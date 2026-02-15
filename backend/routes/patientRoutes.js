const express = require("express");
const db = require("../database/initDb");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/patients - Insert a new patient
// Accessible by Admin, Support Staff (roles that typically handle registration)
router.post(
  "/",
  protect,
  authorize("Admin", "Support", "Doctor", "Nurse"),
  (req, res) => {
    const {
      name,
      gender,
      dob,
      address,
      telephone,
      ssn,
      bloodType,
      cholesterolHDL,
      cholesterolLDL,
      cholesterolTriglyceride,
      bloodSugar,
      primaryCarePhysicianId,
    } = req.body;

    if (!name || !gender || !dob || !ssn) {
      return res
        .status(400)
        .json({ message: "Name, gender, DOB, and SSN are required." });
    }

    const sql = `INSERT INTO Patients 
        (name, gender, dob, address, telephone, ssn, bloodType, 
        cholesterolHDL, cholesterolLDL, cholesterolTriglyceride, bloodSugar, primaryCarePhysicianId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      name,
      gender,
      dob,
      address,
      telephone,
      ssn,
      bloodType,
      cholesterolHDL,
      cholesterolLDL,
      cholesterolTriglyceride,
      bloodSugar,
      primaryCarePhysicianId,
    ];

    db.run(sql, params, function (err) {
      if (err) {
        console.error("DB error on patient insert:", err.message);
        return res
          .status(500)
          .json({ message: "Failed to add new patient.", error: err.message });
      }
      res.status(201).json({
        message: "Patient added successfully",
        patientId: this.lastID,
      });
    });
  }
);

// GET /api/patients - Get all patients
// Accessible by Admin, Doctor, Nurse, Support
router.get(
  "/",
  protect,
  authorize("Admin", "Doctor", "Nurse", "Support"),
  (req, res) => {
    db.all(
      "SELECT id, name, dob, ssn, primaryCarePhysicianId FROM Patients ORDER BY name ASC",
      [],
      (err, rows) => {
        if (err) {
          return res.status(500).json({
            message: "Error retrieving patients.",
            error: err.message,
          });
        }
        res.json(rows);
      }
    );
  }
);

// GET /api/patients/:id - View specific patient information
// Accessible by Admin, Doctor, Nurse, Support
router.get(
  "/:id",
  protect,
  authorize("Admin", "Doctor", "Nurse", "Support"),
  (req, res) => {
    const { id } = req.params;
    db.get("SELECT * FROM Patients WHERE id = ?", [id], (err, row) => {
      if (err) {
        return res.status(500).json({
          message: "Error retrieving patient information.",
          error: err.message,
        });
      }
      if (!row) {
        return res.status(404).json({ message: "Patient not found." });
      }
      res.json(row);
    });
  }
);

// PUT /api/patients/:id - Update patient information
// Accessible by Admin, Support Staff
router.put(
  "/:id",
  protect,
  authorize("Admin", "Support", "Doctor", "Nurse"),
  (req, res) => {
    const { id } = req.params;
    const {
      name,
      gender,
      dob,
      address,
      telephone,
      ssn,
      bloodType,
      cholesterolHDL,
      cholesterolLDL,
      cholesterolTriglyceride,
      bloodSugar,
      primaryCarePhysicianId,
    } = req.body;

    const fields = [];
    const params = [];

    if (name !== undefined) {
      fields.push("name = ?");
      params.push(name);
    }
    if (gender !== undefined) {
      fields.push("gender = ?");
      params.push(gender);
    }
    if (dob !== undefined) {
      fields.push("dob = ?");
      params.push(dob);
    }
    if (address !== undefined) {
      fields.push("address = ?");
      params.push(address);
    }
    if (telephone !== undefined) {
      fields.push("telephone = ?");
      params.push(telephone);
    }
    if (ssn !== undefined) {
      fields.push("ssn = ?");
      params.push(ssn);
    }
    if (bloodType !== undefined) {
      fields.push("bloodType = ?");
      params.push(bloodType);
    }
    if (cholesterolHDL !== undefined) {
      fields.push("cholesterolHDL = ?");
      params.push(cholesterolHDL);
    }
    if (cholesterolLDL !== undefined) {
      fields.push("cholesterolLDL = ?");
      params.push(cholesterolLDL);
    }
    if (cholesterolTriglyceride !== undefined) {
      fields.push("cholesterolTriglyceride = ?");
      params.push(cholesterolTriglyceride);
    }
    if (bloodSugar !== undefined) {
      fields.push("bloodSugar = ?");
      params.push(bloodSugar);
    }
    if (primaryCarePhysicianId !== undefined) {
      fields.push("primaryCarePhysicianId = ?");
      params.push(primaryCarePhysicianId);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "No updatable fields provided." });
    }

    params.push(id); // For the WHERE clause
    const sql = `UPDATE Patients SET ${fields.join(", ")} WHERE id = ?`;

    db.run(sql, params, function (err) {
      if (err) {
        console.error("DB error on patient update:", err.message);
        return res.status(500).json({
          message: "Failed to update patient information.",
          error: err.message,
        });
      }
      if (this.changes === 0) {
        return res
          .status(404)
          .json({ message: "Patient not found or no changes made." });
      }
      res.json({
        message: "Patient information updated successfully.",
        changes: this.changes,
      });
    });
  }
);

// GET /api/patients/:id/medical-history - Check previous diagnoses and illnesses
// Accessible by Doctor, Nurse, Admin
router.get(
  "/:id/medical-history",
  protect,
  authorize("Admin", "Doctor", "Nurse"),
  async (req, res) => {
    const { id } = req.params;
    try {
      const patientExists = await new Promise((resolve, reject) => {
        db.get("SELECT id FROM Patients WHERE id = ?", [id], (err, row) => {
          if (err) reject(err);
          resolve(row);
        });
      });

      if (!patientExists) {
        return res.status(404).json({ message: "Patient not found." });
      }

      const illnesses = await new Promise((resolve, reject) => {
        const sql = `SELECT i.code, i.description, pi.diagnosedDate 
                         FROM PatientIllnesses pi
                         JOIN Illnesses i ON pi.illnessId = i.id
                         WHERE pi.patientId = ?`;
        db.all(sql, [id], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      const allergies = await new Promise((resolve, reject) => {
        const sql = `SELECT a.code, a.name 
                         FROM PatientAllergies pa
                         JOIN Allergies a ON pa.allergyId = a.id
                         WHERE pa.patientId = ?`;
        db.all(sql, [id], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      res.json({ patientId: id, illnesses, allergies });
    } catch (err) {
      console.error("Error fetching medical history:", err.message);
      res.status(500).json({
        message: "Failed to retrieve medical history.",
        error: err.message,
      });
    }
  }
);

// POST /api/patients/:id/illnesses - Add an illness for a patient
// Accessible by Doctor, Nurse (primarily clinical staff)
router.post(
  "/:id/illnesses",
  protect,
  authorize("Doctor", "Nurse", "Admin"),
  (req, res) => {
    const patientId = req.params.id;
    const { illnessCode, diagnosedDate } = req.body; // illnessCode refers to Illnesses.code

    if (!illnessCode) {
      return res.status(400).json({ message: "Illness code is required." });
    }

    db.get(
      "SELECT id FROM Illnesses WHERE code = ?",
      [illnessCode],
      (err, illness) => {
        if (err) {
          return res.status(500).json({
            message: "Error checking illness code.",
            error: err.message,
          });
        }
        if (!illness) {
          return res.status(404).json({
            message: `Illness with code '${illnessCode}' not found. Please add it to master list first.`,
          });
        }

        const illnessId = illness.id;
        const sql =
          "INSERT INTO PatientIllnesses (patientId, illnessId, diagnosedDate) VALUES (?, ?, ?)";
        db.run(
          sql,
          [patientId, illnessId, diagnosedDate || null],
          function (err) {
            if (err) {
              // Handle unique constraint violation (patient already has this illness)
              if (err.message.includes("UNIQUE constraint failed")) {
                return res.status(409).json({
                  message: "Patient already diagnosed with this illness.",
                  error: err.message,
                });
              }
              return res.status(500).json({
                message: "Failed to add illness to patient.",
                error: err.message,
              });
            }
            res.status(201).json({
              message: "Illness added to patient successfully.",
              entryId: this.lastID,
            });
          }
        );
      }
    );
  }
);

// POST /api/patients/:id/allergies - Add an allergy for a patient
// Accessible by Doctor, Nurse (primarily clinical staff)
router.post(
  "/:id/allergies",
  protect,
  authorize("Doctor", "Nurse", "Admin"),
  (req, res) => {
    const patientId = req.params.id;
    const { allergyCode } = req.body; // allergyCode refers to Allergies.code

    if (!allergyCode) {
      return res.status(400).json({ message: "Allergy code is required." });
    }

    db.get(
      "SELECT id FROM Allergies WHERE code = ?",
      [allergyCode],
      (err, allergy) => {
        if (err) {
          return res.status(500).json({
            message: "Error checking allergy code.",
            error: err.message,
          });
        }
        if (!allergy) {
          return res.status(404).json({
            message: `Allergy with code '${allergyCode}' not found. Please add it to master list first.`,
          });
        }

        const allergyId = allergy.id;
        const sql =
          "INSERT INTO PatientAllergies (patientId, allergyId) VALUES (?, ?)";
        db.run(sql, [patientId, allergyId], function (err) {
          if (err) {
            // Handle unique constraint violation (patient already has this allergy)
            if (err.message.includes("UNIQUE constraint failed")) {
              return res.status(409).json({
                message: "Patient already has this allergy recorded.",
                error: err.message,
              });
            }
            return res.status(500).json({
              message: "Failed to add allergy to patient.",
              error: err.message,
            });
          }
          res
            .status(201)
            .json({ message: "Allergy added to patient successfully." });
        });
      }
    );
  }
);

// TODO from ApplicationRequirement.md: (Consider if these fit better in a different route file or are covered)
// o View scheduled per doctor and per day (Likely /api/appointments?doctorId=X&date=Y)

module.exports = router;
