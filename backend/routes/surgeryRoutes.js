const express = require("express");
const db = require("../database/initDb");
const { protect, authorize } = require("../middleware/authMiddleware");

console.log("[surgeryRoutes.js] File loaded and router being configured.");

const router = express.Router();

// GET /api/surgeries/types - Get all surgery types
router.get(
  "/types",
  protect,
  authorize("Admin", "Doctor", "Nurse"),
  (req, res) => {
    console.log(
      "[surgeryRoutes.js] Inside GET /types handler. Request received."
    );
    db.all("SELECT * FROM SurgeryTypes ORDER BY name ASC", [], (err, rows) => {
      if (err) {
        console.error("Error fetching surgery types:", err.message);
        return res.status(500).json({
          message: "Failed to retrieve surgery types.",
          error: err.message,
        });
      }
      res.json(rows);
    });
  }
);

// POST /api/surgeries/book - Book a surgery
// Accessible by Admin, Doctor
router.post(
  "/book",
  protect,
  authorize("Admin", "Doctor"),
  async (req, res) => {
    const {
      patientId,
      surgeonId,
      surgeryTypeId,
      operationTheatre,
      scheduledDateTime,
      status,
    } = req.body;

    if (!patientId || !surgeonId || !surgeryTypeId || !scheduledDateTime) {
      return res.status(400).json({
        message:
          "Patient ID, Surgeon ID, Surgery Type ID, and Scheduled Date/Time are required.",
      });
    }

    try {
      // 1. Validate patientId
      const patient = await new Promise((resolve, reject) =>
        db.get("SELECT id FROM Patients WHERE id = ?", [patientId], (e, r) =>
          e ? reject(e) : resolve(r)
        )
      );
      if (!patient)
        return res.status(404).json({ message: "Patient not found." });

      // 2. Validate surgeonId
      const surgeon = await new Promise((resolve, reject) =>
        db.get("SELECT jobType FROM Staff WHERE id = ?", [surgeonId], (e, r) =>
          e ? reject(e) : resolve(r)
        )
      );
      if (!surgeon || surgeon.jobType !== "Surgeon")
        return res.status(400).json({
          message: "Invalid surgeon ID or staff member is not a surgeon.",
        });

      // 3. Validate surgeryTypeId
      const surgeryType = await new Promise((resolve, reject) =>
        db.get(
          "SELECT id FROM SurgeryTypes WHERE id = ?",
          [surgeryTypeId],
          (e, r) => (e ? reject(e) : resolve(r))
        )
      );
      if (!surgeryType)
        return res.status(404).json({ message: "Surgery type not found." });

      const currentStatus = status || "Scheduled";
      const sql = `INSERT INTO Surgeries (patientId, surgeonId, surgeryTypeId, operationTheatre, scheduledDateTime, status)
                     VALUES (?, ?, ?, ?, ?, ?)`;
      db.run(
        sql,
        [
          patientId,
          surgeonId,
          surgeryTypeId,
          operationTheatre,
          scheduledDateTime,
          currentStatus,
        ],
        function (err) {
          if (err) {
            console.error("DB error on surgery booking:", err.message);
            return res
              .status(500)
              .json({ message: "Failed to book surgery.", error: err.message });
          }
          res.status(201).json({
            message: "Surgery booked successfully",
            surgeryId: this.lastID,
          });
        }
      );
    } catch (error) {
      console.error("Server error during surgery booking:", error);
      if (!res.headersSent) {
        res.status(500).json({
          message: "Server error booking surgery.",
          error: error.message,
        });
      }
    }
  }
);

// GET /api/surgeries - View scheduled surgeries
// Accessible by Admin, Doctor, Nurse
router.get("/", protect, authorize("Admin", "Doctor", "Nurse"), (req, res) => {
  const { patientId, surgeonId, date, status, operationTheatre } = req.query;

  let sql = `
        SELECT 
            s.id as surgeryId, s.scheduledDateTime, s.status, s.operationTheatre,
            p.id as patientId, p.name as patientName,
            st.name as surgeonName, st.id as surgeonStaffId,
            sty.name as surgeryTypeName, sty.surgeryCode, sty.category as surgeryCategory
        FROM Surgeries s
        JOIN Patients p ON s.patientId = p.id
        JOIN Staff st ON s.surgeonId = st.id AND st.jobType = 'Surgeon'
        JOIN SurgeryTypes sty ON s.surgeryTypeId = sty.id
        WHERE 1=1
    `;
  const params = [];

  if (patientId) {
    sql += " AND s.patientId = ?";
    params.push(patientId);
  }
  if (surgeonId) {
    sql += " AND s.surgeonId = ?";
    params.push(surgeonId);
  }
  if (date) {
    sql += " AND date(s.scheduledDateTime) = date(?)";
    params.push(date);
  }
  if (status) {
    sql += " AND s.status = ?";
    params.push(status);
  }
  if (operationTheatre) {
    sql += " AND s.operationTheatre = ?";
    params.push(operationTheatre);
  }

  sql += " ORDER BY s.scheduledDateTime ASC";

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error retrieving surgeries.", error: err.message });
    }
    res.json(rows);
  });
});

// GET /api/surgeries/:id - View a specific surgery
router.get(
  "/:id",
  protect,
  authorize("Admin", "Doctor", "Nurse"),
  (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT 
            s.*, 
            p.name as patientName,
            st.name as surgeonName,
            sty.name as surgeryTypeName, sty.surgeryCode, sty.category as surgeryCategory
        FROM Surgeries s
        JOIN Patients p ON s.patientId = p.id
        JOIN Staff st ON s.surgeonId = st.id
        JOIN SurgeryTypes sty ON s.surgeryTypeId = sty.id
        WHERE s.id = ?
    `;
    db.get(sql, [id], (err, row) => {
      if (err) {
        return res.status(500).json({
          message: "Error retrieving surgery details.",
          error: err.message,
        });
      }
      if (!row) {
        return res.status(404).json({ message: "Surgery not found." });
      }
      res.json(row);
    });
  }
);

// PUT /api/surgeries/:id - Update surgery details
// Accessible by Admin, Doctor
router.put("/:id", protect, authorize("Admin", "Doctor"), (req, res) => {
  const { id } = req.params;
  const {
    operationTheatre,
    scheduledDateTime,
    status,
    surgeonId,
    surgeryTypeId,
  } = req.body;

  const fields = [];
  const params = [];

  if (operationTheatre !== undefined) {
    fields.push("operationTheatre = ?");
    params.push(operationTheatre);
  }
  if (scheduledDateTime !== undefined) {
    fields.push("scheduledDateTime = ?");
    params.push(scheduledDateTime);
  }
  if (status !== undefined) {
    fields.push("status = ?");
    params.push(status);
  }
  if (surgeonId !== undefined) {
    fields.push("surgeonId = ?");
    params.push(surgeonId);
  }
  if (surgeryTypeId !== undefined) {
    fields.push("surgeryTypeId = ?");
    params.push(surgeryTypeId);
  }

  if (fields.length === 0) {
    return res.status(400).json({ message: "No fields provided for update." });
  }
  params.push(id);
  const sql = `UPDATE Surgeries SET ${fields.join(", ")} WHERE id = ?`;

  db.run(sql, params, function (err) {
    if (err) {
      return res
        .status(500)
        .json({ message: "Failed to update surgery.", error: err.message });
    }
    if (this.changes === 0) {
      return res
        .status(404)
        .json({ message: "Surgery not found or no changes made." });
    }
    res.json({
      message: "Surgery updated successfully.",
      changes: this.changes,
    });
  });
});

// DELETE /api/surgeries/:id - Cancel (delete) a surgery
// Accessible by Admin, Doctor
router.delete("/:id", protect, authorize("Admin", "Doctor"), (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM Surgeries WHERE id = ?", [id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ message: "Failed to delete surgery.", error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "Surgery not found." });
    }
    res.json({
      message: "Surgery deleted successfully.",
      changes: this.changes,
    });
  });
});

// GET /api/surgeries/by-room-day - View scheduled surgery per room and per day
// Accessible by Admin, Doctor, Nurse
router.get(
  "/by-room-day",
  protect,
  authorize("Admin", "Doctor", "Nurse"),
  (req, res) => {
    const { roomId, date } = req.query;
    if (!roomId || !date) {
      return res
        .status(400)
        .json({ message: "Room ID and Date are required for this view." });
    }

    const sql = `
        SELECT 
            s.id as surgeryId, s.scheduledDateTime, s.status, s.operationTheatre,
            p.id as patientId, p.name as patientName,
            st.name as surgeonName, st.id as surgeonStaffId,
            sty.name as surgeryTypeName, sty.surgeryCode,
            r.roomNumber, r.wing, r.nursingUnit, r.bedLabel
        FROM Surgeries s
        JOIN Patients p ON s.patientId = p.id
        JOIN Staff st ON s.surgeonId = st.id AND st.jobType = 'Surgeon'
        JOIN SurgeryTypes sty ON s.surgeryTypeId = sty.id
        JOIN InPatients ip ON p.id = ip.patientId AND ip.roomId = ? AND date(ip.admissionDate) <= date(?) AND (ip.dischargeDate IS NULL OR date(ip.dischargeDate) >= date(?))
        JOIN Rooms r ON ip.roomId = r.id
        WHERE date(s.scheduledDateTime) = date(?)
        ORDER BY s.scheduledDateTime ASC
    `;

    db.all(sql, [roomId, date, date, date], (err, rows) => {
      if (err) {
        console.error("Error fetching surgeries by room and day:", err.message);
        return res.status(500).json({
          message: "Error retrieving surgeries by room and day.",
          error: err.message,
        });
      }
      res.json(rows);
    });
  }
);

module.exports = router;
