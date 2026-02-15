const express = require("express");
const db = require("../database/initDb");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/inpatients/admit - Admit a patient to a room/bed
// Accessible by Admin, Doctor, Nurse
router.post(
  "/admit",
  protect,
  authorize("Admin", "Doctor", "Nurse"),
  async (req, res) => {
    const {
      patientId,
      roomId,
      admissionDate,
      assignedNurseId,
      assignedDoctorId,
    } = req.body;

    if (!patientId || !roomId || !admissionDate) {
      return res.status(400).json({
        message: "Patient ID, Room ID, and Admission Date are required.",
      });
    }

    try {
      db.serialize(async () => {
        // 1. Check if patient exists and is not already an in-patient
        const patient = await new Promise((resolve, reject) => {
          db.get(
            "SELECT * FROM Patients WHERE id = ?",
            [patientId],
            (err, row) => (err ? reject(err) : resolve(row))
          );
        });
        if (!patient)
          return res.status(404).json({ message: "Patient not found." });

        const existingInPatient = await new Promise((resolve, reject) => {
          db.get(
            "SELECT * FROM InPatients WHERE patientId = ? AND dischargeDate IS NULL",
            [patientId],
            (err, row) => (err ? reject(err) : resolve(row))
          );
        });
        if (existingInPatient)
          return res
            .status(400)
            .json({ message: "Patient is already admitted." });

        // 2. Check if room exists and is available
        const room = await new Promise((resolve, reject) => {
          db.get(
            "SELECT * FROM Rooms WHERE id = ? AND isOccupied = 0",
            [roomId],
            (err, row) => (err ? reject(err) : resolve(row))
          );
        });
        if (!room)
          return res
            .status(404)
            .json({ message: "Room not found or is occupied." });

        // 3. Optionally, validate assignedNurseId and assignedDoctorId (are they valid staff of correct type?)
        if (assignedNurseId) {
          const nurse = await new Promise((resolve, reject) =>
            db.get(
              "SELECT jobType FROM Staff WHERE id = ?",
              [assignedNurseId],
              (e, r) => (e ? reject(e) : resolve(r))
            )
          );
          if (!nurse || nurse.jobType !== "Nurse")
            return res.status(400).json({
              message: "Invalid or non-nurse staff ID for assignedNurseId.",
            });
        }
        if (assignedDoctorId) {
          const doctor = await new Promise((resolve, reject) =>
            db.get(
              "SELECT jobType FROM Staff WHERE id = ?",
              [assignedDoctorId],
              (e, r) => (e ? reject(e) : resolve(r))
            )
          );
          if (
            !doctor ||
            (doctor.jobType !== "Physician" && doctor.jobType !== "Surgeon")
          )
            return res.status(400).json({
              message:
                "Invalid or non-doctor/surgeon staff ID for assignedDoctorId.",
            });
        }

        // 4. Create InPatient record
        const inPatientId = await new Promise((resolve, reject) => {
          const sql =
            "INSERT INTO InPatients (patientId, roomId, admissionDate, assignedNurseId, assignedDoctorId) VALUES (?, ?, ?, ?, ?)";
          db.run(
            sql,
            [
              patientId,
              roomId,
              admissionDate,
              assignedNurseId,
              assignedDoctorId,
            ],
            function (err) {
              err ? reject(err) : resolve(this.lastID);
            }
          );
        });

        // 5. Update room to be occupied
        await new Promise((resolve, reject) => {
          db.run(
            "UPDATE Rooms SET isOccupied = 1 WHERE id = ?",
            [roomId],
            function (err) {
              err ? reject(err) : resolve(this.changes);
            }
          );
        });

        res.status(201).json({
          message: "Patient admitted successfully.",
          inPatientId: inPatientId,
        });
      });
    } catch (error) {
      console.error("Error during patient admission:", error);
      // Ensure response is sent if an early return with res.status() happened in a promise that was awaited outside db.serialize scope
      if (!res.headersSent) {
        res.status(500).json({
          message: "Server error during admission.",
          error: error.message,
        });
      }
    }
  }
);

// PUT /api/inpatients/:inPatientRecordId/discharge - Discharge an in-patient
// Accessible by Admin, Doctor, Nurse
router.put(
  "/:inPatientRecordId/discharge",
  protect,
  authorize("Admin", "Doctor", "Nurse"),
  async (req, res) => {
    const { inPatientRecordId } = req.params;
    const { dischargeDate } = req.body;

    if (!dischargeDate) {
      return res.status(400).json({ message: "Discharge date is required." });
    }

    try {
      db.serialize(async () => {
        // 1. Find the in-patient record
        const inPatient = await new Promise((resolve, reject) => {
          db.get(
            "SELECT * FROM InPatients WHERE id = ? AND dischargeDate IS NULL",
            [inPatientRecordId],
            (err, row) => (err ? reject(err) : resolve(row))
          );
        });

        if (!inPatient) {
          return res.status(404).json({
            message:
              "Active in-patient record not found or already discharged.",
          });
        }

        // 2. Update InPatient record with discharge date
        await new Promise((resolve, reject) => {
          db.run(
            "UPDATE InPatients SET dischargeDate = ? WHERE id = ?",
            [dischargeDate, inPatientRecordId],
            function (err) {
              err ? reject(err) : resolve(this.changes);
            }
          );
        });

        // 3. Update the room to be available
        if (inPatient.roomId) {
          await new Promise((resolve, reject) => {
            db.run(
              "UPDATE Rooms SET isOccupied = 0 WHERE id = ?",
              [inPatient.roomId],
              function (err) {
                err ? reject(err) : resolve(this.changes);
              }
            );
          });
        }
        res.json({ message: "Patient discharged successfully." });
      });
    } catch (error) {
      console.error("Error during patient discharge:", error);
      if (!res.headersSent) {
        res.status(500).json({
          message: "Server error during discharge.",
          error: error.message,
        });
      }
    }
  }
);

// GET /api/inpatients - Get all currently admitted in-patients
// Accessible by Admin, Doctor, Nurse, Support
router.get(
  "/",
  protect,
  authorize("Admin", "Doctor", "Nurse", "Support"),
  (req, res) => {
    const sql = `
        SELECT 
            ip.id as inPatientRecordId, ip.admissionDate, 
            p.id as patientId, p.name as patientName, 
            r.id as roomId, r.nursingUnit, r.wing, r.roomNumber, r.bedLabel,
            assignedNurse.name as assignedNurseName, assignedNurse.id as assignedNurseId,
            assignedDoctor.name as assignedDoctorName, assignedDoctor.id as assignedDoctorId
        FROM InPatients ip
        JOIN Patients p ON ip.patientId = p.id
        LEFT JOIN Rooms r ON ip.roomId = r.id
        LEFT JOIN Staff assignedNurse ON ip.assignedNurseId = assignedNurse.id
        LEFT JOIN Staff assignedDoctor ON ip.assignedDoctorId = assignedDoctor.id
        WHERE ip.dischargeDate IS NULL
        ORDER BY p.name ASC
    `;
    db.all(sql, [], (err, rows) => {
      if (err) {
        return res.status(500).json({
          message: "Error retrieving in-patients.",
          error: err.message,
        });
      }
      res.json(rows);
    });
  }
);

// GET /api/inpatients/:inPatientRecordId - Get specific in-patient details
router.get(
  "/:inPatientRecordId",
  protect,
  authorize("Admin", "Doctor", "Nurse", "Support"),
  (req, res) => {
    const { inPatientRecordId } = req.params;
    const sql = `
        SELECT 
            ip.*, 
            p.name as patientName, p.dob as patientDob, p.gender as patientGender,
            r.nursingUnit, r.wing, r.roomNumber, r.bedLabel,
            assignedNurse.name as assignedNurseName,
            assignedDoctor.name as assignedDoctorName
        FROM InPatients ip
        JOIN Patients p ON ip.patientId = p.id
        LEFT JOIN Rooms r ON ip.roomId = r.id
        LEFT JOIN Staff assignedNurse ON ip.assignedNurseId = assignedNurse.id
        LEFT JOIN Staff assignedDoctor ON ip.assignedDoctorId = assignedDoctor.id
        WHERE ip.id = ?
    `;
    db.get(sql, [inPatientRecordId], (err, row) => {
      if (err) {
        return res.status(500).json({
          message: "Error retrieving in-patient details.",
          error: err.message,
        });
      }
      if (!row) {
        return res
          .status(404)
          .json({ message: "In-patient record not found." });
      }
      res.json(row);
    });
  }
);

// PUT /api/inpatients/:inPatientRecordId/assign-staff - Assign/update doctor or nurse for an in-patient
// Accessible by Admin, Doctor, Nurse
router.put(
  "/:inPatientRecordId/assign-staff",
  protect,
  authorize("Admin", "Doctor", "Nurse"),
  async (req, res) => {
    const { inPatientRecordId } = req.params;
    const { staffId, staffType } = req.body; // staffType: 'Doctor' or 'Nurse'

    if (!staffId || !staffType) {
      return res.status(400).json({
        message: "Staff ID and Staff Type (Doctor/Nurse) are required.",
      });
    }
    if (!["Doctor", "Nurse"].includes(staffType)) {
      return res
        .status(400)
        .json({ message: "Invalid staffType. Must be 'Doctor' or 'Nurse'." });
    }

    try {
      const inPatient = await new Promise((resolve, reject) => {
        db.get(
          "SELECT id FROM InPatients WHERE id = ? AND dischargeDate IS NULL",
          [inPatientRecordId],
          (e, r) => (e ? reject(e) : resolve(r))
        );
      });
      if (!inPatient)
        return res
          .status(404)
          .json({ message: "Active in-patient record not found." });

      const staffMember = await new Promise((resolve, reject) => {
        db.get("SELECT jobType FROM Staff WHERE id = ?", [staffId], (e, r) =>
          e ? reject(e) : resolve(r)
        );
      });
      if (!staffMember)
        return res.status(404).json({ message: "Staff member not found." });

      let fieldToUpdate;
      if (
        staffType === "Doctor" &&
        (staffMember.jobType === "Physician" ||
          staffMember.jobType === "Surgeon")
      ) {
        fieldToUpdate = "assignedDoctorId";
      } else if (staffType === "Nurse" && staffMember.jobType === "Nurse") {
        fieldToUpdate = "assignedNurseId";
      } else {
        return res.status(400).json({
          message: `Staff member with ID ${staffId} is not a valid ${staffType}. Job type is ${staffMember.jobType}`,
        });
      }

      await new Promise((resolve, reject) => {
        db.run(
          `UPDATE InPatients SET ${fieldToUpdate} = ? WHERE id = ?`,
          [staffId, inPatientRecordId],
          function (e) {
            e ? reject(e) : resolve(this.changes);
          }
        );
      });
      res.json({
        message: `${staffType} assigned/updated successfully for in-patient.`,
      });
    } catch (error) {
      console.error("Error assigning staff to in-patient:", error);
      if (!res.headersSent) {
        res.status(500).json({
          message: "Server error assigning staff.",
          error: error.message,
        });
      }
    }
  }
);

// PUT /api/inpatients/:inPatientRecordId/remove-staff - Remove doctor or nurse assignment
router.put(
  "/:inPatientRecordId/remove-staff",
  protect,
  authorize("Admin", "Doctor", "Nurse"),
  async (req, res) => {
    const { inPatientRecordId } = req.params;
    const { staffType } = req.body;

    if (!staffType || !["Doctor", "Nurse"].includes(staffType)) {
      return res
        .status(400)
        .json({ message: "Valid Staff Type (Doctor/Nurse) is required." });
    }

    try {
      const inPatient = await new Promise((resolve, reject) => {
        db.get(
          "SELECT id FROM InPatients WHERE id = ? AND dischargeDate IS NULL",
          [inPatientRecordId],
          (e, r) => (e ? reject(e) : resolve(r))
        );
      });
      if (!inPatient)
        return res
          .status(404)
          .json({ message: "Active in-patient record not found." });

      const fieldToUpdate =
        staffType === "Doctor" ? "assignedDoctorId" : "assignedNurseId";

      await new Promise((resolve, reject) => {
        db.run(
          `UPDATE InPatients SET ${fieldToUpdate} = NULL WHERE id = ?`,
          [inPatientRecordId],
          function (e) {
            e ? reject(e) : resolve(this.changes);
          }
        );
      });
      res.json({
        message: `${staffType} assignment removed successfully for in-patient.`,
      });
    } catch (error) {
      console.error(`Error removing ${staffType} from in-patient:`, error);
      if (!res.headersSent) {
        res.status(500).json({
          message: `Server error removing ${staffType}.`,
          error: error.message,
        });
      }
    }
  }
);

module.exports = router;
