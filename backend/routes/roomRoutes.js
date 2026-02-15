const express = require("express");
const db = require("../database/initDb");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/rooms - Get all rooms
// Accessible by Admin, Support, Doctor, Nurse
router.get(
  "/",
  protect,
  authorize("Admin", "Support", "Doctor", "Nurse"),
  (req, res) => {
    const { isOccupied } = req.query;
    let sql = "SELECT * FROM Rooms";
    const params = [];

    if (isOccupied !== undefined) {
      sql += " WHERE isOccupied = ?";
      params.push(isOccupied === "1" || isOccupied === "true" ? 1 : 0);
    }
    sql += " ORDER BY nursingUnit, wing, roomNumber, bedLabel";

    db.all(sql, params, (err, rows) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error retrieving rooms.", error: err.message });
      }
      res.json(rows);
    });
  }
);

// GET /api/rooms/available - Check for available room/bed
// Accessible by Admin, Support, Doctor, Nurse
router.get(
  "/available",
  protect,
  authorize("Admin", "Support", "Doctor", "Nurse"),
  (_req, res) => {
    db.all(
      "SELECT * FROM Rooms WHERE isOccupied = 0 ORDER BY nursingUnit, wing, roomNumber, bedLabel",
      [],
      (err, rows) => {
        if (err) {
          return res.status(500).json({
            message: "Error retrieving available rooms.",
            error: err.message,
          });
        }
        if (rows.length === 0) {
          return res
            .status(404)
            .json({ message: "No available rooms/beds found." });
        }
        res.json(rows);
      }
    );
  }
);

// GET /api/rooms/:id - Get a specific room by ID
router.get(
  "/:id",
  protect,
  authorize("Admin", "Support", "Doctor", "Nurse"),
  (req, res) => {
    const { id } = req.params;
    db.get("SELECT * FROM Rooms WHERE id = ?", [id], (err, row) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error retrieving room.", error: err.message });
      }
      if (!row) {
        return res.status(404).json({ message: "Room not found." });
      }
      res.json(row);
    });
  }
);

// Admin endpoint to add more rooms if needed
router.post("/", protect, authorize("Admin"), (req, res) => {
  const { nursingUnit, wing, roomNumber, bedLabel } = req.body;
  if (!nursingUnit || !wing || !roomNumber || !bedLabel) {
    return res.status(400).json({
      message: "Nursing unit, wing, room number, and bed label are required.",
    });
  }

  const sql =
    "INSERT INTO Rooms (nursingUnit, wing, roomNumber, bedLabel, isOccupied) VALUES (?, ?, ?, ?, 0)";
  db.run(sql, [nursingUnit, wing, roomNumber, bedLabel], function (err) {
    if (err) {
      if (err.message.includes("UNIQUE constraint failed")) {
        return res.status(409).json({
          message: "This room/bed combination already exists.",
          error: err.message,
        });
      }
      return res
        .status(500)
        .json({ message: "Failed to add room.", error: err.message });
    }
    res
      .status(201)
      .json({ message: "Room added successfully", roomId: this.lastID });
  });
});

module.exports = router;
