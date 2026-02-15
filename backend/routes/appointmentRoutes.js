const express = require("express");
const db = require("../database/initDb");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/appointments - Schedule an appointment
// Accessible by Admin, Support, Doctor
router.post(
  "/",
  protect,
  authorize("Admin", "Support", "Doctor", "Nurse"),
  (req, res) => {
    const { patientId, doctorId, appointmentDate, reason, status } = req.body;

    if (!patientId || !doctorId || !appointmentDate) {
      return res.status(400).json({
        message: "Patient ID, Doctor ID, and Appointment Date are required.",
      });
    }

    const sql =
      "INSERT INTO Appointments (patientId, doctorId, appointmentDate, reason, status) VALUES (?, ?, ?, ?, ?)";
    const currentStatus = status || "Scheduled";

    db.run(
      sql,
      [patientId, doctorId, appointmentDate, reason, currentStatus],
      function (err) {
        if (err) {
          console.error("DB error on appointment schedule:", err.message);
          return res.status(500).json({
            message: "Failed to schedule appointment.",
            error: err.message,
          });
        }
        res.status(201).json({
          message: "Appointment scheduled successfully",
          appointmentId: this.lastID,
        });
      }
    );
  }
);

// GET /api/appointments - View scheduled appointments
// Accessible by Admin, Support, Doctor, Nurse
router.get(
  "/",
  protect,
  authorize("Admin", "Support", "Doctor", "Nurse"),
  (req, res) => {
    const { doctorId, date, patientId, status } = req.query;
    let sql = `SELECT A.id, A.appointmentDate, A.reason, A.status, 
                      P.name as patientName, P.id as patientId,
                      S.name as doctorName, S.id as doctorId 
               FROM Appointments A
               JOIN Patients P ON A.patientId = P.id
               JOIN Staff S ON A.doctorId = S.id WHERE 1=1`;
    const params = [];

    if (doctorId) {
      sql += " AND A.doctorId = ?";
      params.push(doctorId);
    }
    if (patientId) {
      sql += " AND A.patientId = ?";
      params.push(patientId);
    }
    if (date) {
      sql += " AND date(A.appointmentDate) = date(?)";
      params.push(date);
    }
    if (status) {
      sql += " AND A.status = ?";
      params.push(status);
    }
    sql += " ORDER BY A.appointmentDate ASC";

    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error("DB error retrieving appointments:", err.message);
        return res.status(500).json({
          message: "Error retrieving appointments.",
          error: err.message,
        });
      }
      res.json(rows);
    });
  }
);

// GET /api/appointments/:id - View a specific appointment
router.get(
  "/:id",
  protect,
  authorize("Admin", "Support", "Doctor", "Nurse"),
  (req, res) => {
    const { id } = req.params;
    let sql = `SELECT A.id, A.appointmentDate, A.reason, A.status, 
                      P.name as patientName, P.id as patientId,
                      S.name as doctorName, S.id as doctorId 
               FROM Appointments A
               JOIN Patients P ON A.patientId = P.id
               JOIN Staff S ON A.doctorId = S.id 
               WHERE A.id = ?`;

    db.get(sql, [id], (err, row) => {
      if (err) {
        return res.status(500).json({
          message: "Error retrieving appointment.",
          error: err.message,
        });
      }
      if (!row) {
        return res.status(404).json({ message: "Appointment not found." });
      }
      res.json(row);
    });
  }
);

// PUT /api/appointments/:id - Update an appointment (e.g., reschedule, change status)
// Accessible by Admin, Support, Doctor
router.put(
  "/:id",
  protect,
  authorize("Admin", "Support", "Doctor", "Nurse"),
  (req, res) => {
    const { id } = req.params;
    const { patientId, doctorId, appointmentDate, reason, status } = req.body;

    // For simplicity, require all fields for an update, or build dynamically like in staff/patient PUT
    if (!patientId || !doctorId || !appointmentDate || !status) {
      return res.status(400).json({
        message:
          "Patient ID, Doctor ID, Appointment Date, and Status are required for update.",
      });
    }

    const sql = `UPDATE Appointments SET 
                    patientId = ?,
                    doctorId = ?,
                    appointmentDate = ?,
                    reason = ?,
                    status = ?
                 WHERE id = ?`;

    db.run(
      sql,
      [patientId, doctorId, appointmentDate, reason, status, id],
      function (err) {
        if (err) {
          console.error("DB error on appointment update:", err.message);
          return res.status(500).json({
            message: "Failed to update appointment.",
            error: err.message,
          });
        }
        if (this.changes === 0) {
          return res
            .status(404)
            .json({ message: "Appointment not found or no changes made." });
        }
        res.json({
          message: "Appointment updated successfully.",
          changes: this.changes,
        });
      }
    );
  }
);

// DELETE /api/appointments/:id - Cancel (delete) an appointment
// Accessible by Admin, Support, Doctor
router.delete(
  "/:id",
  protect,
  authorize("Admin", "Support", "Doctor"),
  (req, res) => {
    const { id } = req.params;
    // In a real system, you might change status to 'Cancelled' instead of deleting
    db.run("DELETE FROM Appointments WHERE id = ?", [id], function (err) {
      if (err) {
        return res.status(500).json({
          message: "Failed to delete appointment.",
          error: err.message,
        });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: "Appointment not found." });
      }
      res.json({
        message: "Appointment deleted successfully.",
        changes: this.changes,
      });
    });
  }
);

module.exports = router;
