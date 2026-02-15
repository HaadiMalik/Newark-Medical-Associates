const express = require("express");
const db = require("../database/initDb");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/shifts - Add a new shift
router.post("/", protect, authorize("Admin"), (req, res) => {
  const { staffId, shiftDate, startTime, endTime } = req.body;

  if (!staffId || !shiftDate || !startTime || !endTime) {
    return res
      .status(400)
      .json({
        message: "staffId, shiftDate, startTime, and endTime are required.",
      });
  }

  db.get("SELECT id FROM Staff WHERE id = ?", [staffId], (err, staffRow) => {
    if (err) {
      return res
        .status(500)
        .json({
          message: "Error checking staff existence.",
          error: err.message,
        });
    }
    if (!staffRow) {
      return res.status(404).json({ message: "Staff member not found." });
    }

    const sql = `INSERT INTO Shifts (staffId, shiftDate, startTime, endTime)
                     VALUES (?, ?, ?, ?)`;
    const params = [staffId, shiftDate, startTime, endTime];

    db.run(sql, params, function (err) {
      if (err) {
        console.error("DB err on shift insert:", err.message);
        return res
          .status(500)
          .json({ message: "Failed to add shift.", error: err.message });
      }
      res
        .status(201)
        .json({ message: "Shift added successfully", shiftId: this.lastID });
    });
  });
});

// GET /api/shifts - View all shifts
router.get("/", protect, (req, res) => {
  console.log("[shiftRoutes] GET /api/shifts: Received request");
  const sql = `
        SELECT 
            s.id, 
            s.staffId, 
            st.name as staffName, 
            s.shiftDate, 
            s.startTime, 
            s.endTime 
        FROM Shifts s
        JOIN Staff st ON s.staffId = st.id
        ORDER BY s.shiftDate DESC, s.startTime ASC
    `;
  console.log("[shiftRoutes] GET /api/shifts: Executing SQL:", sql);

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error(
        "[shiftRoutes] GET /api/shifts: Database error occurred:",
        err
      );
      return res
        .status(500)
        .json({ message: "Error retrieving shifts.", error: err.message });
    }
    console.log(
      "[shiftRoutes] GET /api/shifts: Successfully retrieved shifts. Count:",
      rows.length
    );
    res.json(rows);
  });
});

module.exports = router;
