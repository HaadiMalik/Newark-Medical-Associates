const express = require("express");
const router = express.Router();
const db = require("../database/initDb");
const { protect, authorize } = require("../middleware/authMiddleware");

// @desc    Get all illnesses
// @route   GET /api/illnesses/master
// @access  Private (Admin, Doctor, Nurse)
router.get(
  "/master",
  protect,
  authorize("Admin", "Doctor", "Nurse"),
  (_req, res) => {
    const sql =
      "SELECT id, code, description FROM Illnesses ORDER BY description";
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error("Error fetching illnesses master list:", err.message);
        return res.status(500).json({
          message: "Error fetching illnesses master list",
          error: err.message,
        });
      }
      res.json(rows);
    });
  }
);

module.exports = router;
