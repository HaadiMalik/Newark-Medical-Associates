const express = require("express");
const router = express.Router();
const db = require("../database/initDb");
const { protect, authorize } = require("../middleware/authMiddleware");

// @desc    Get all allergies
// @route   GET /api/allergies/master
// @access  Private (Admin, Doctor, Nurse)
router.get(
  "/master",
  protect,
  authorize("Admin", "Doctor", "Nurse"),
  (_req, res) => {
    const sql = "SELECT id, code, name FROM Allergies ORDER BY name";
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error("Error fetching allergies master list:", err.message);
        return res.status(500).json({
          message: "Error fetching allergies master list",
          error: err.message,
        });
      }
      res.json(rows);
    });
  }
);

module.exports = router;
