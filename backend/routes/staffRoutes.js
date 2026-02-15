const express = require("express");
const db = require("../database/initDb");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/staff - Add a new staff member (Admin only)
router.post("/", protect, authorize("Admin"), (req, res) => {
  const {
    name,
    jobType,
    email,
    specialty,
    contractType,
    contractLengthYears,
    grade,
    yearsExperience,
    salary,
    employmentNumber,
    gender,
    address,
    telephone,
    username,
    password,
    role,
  } = req.body;

  if (!name || !jobType) {
    return res.status(400).json({ message: "Name and jobType are required." });
  }

  db.serialize(async () => {
    let userId = null;
    try {
      if (username && password && role) {
        const userExists = await new Promise((resolve, reject) => {
          db.get(
            "SELECT id FROM Users WHERE username = ?",
            [username],
            (err, row) => {
              if (err) reject(err);
              else resolve(row);
            }
          );
        });

        if (userExists) {
          return res
            .status(400)
            .json({
              message: "Cannot add staff: Username for login already exists.",
            });
        }

        const bcrypt = require("bcryptjs");
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        userId = await new Promise((resolve, reject) => {
          db.run(
            "INSERT INTO Users (username, password, role) VALUES (?, ?, ?)",
            [username, hashedPassword, role],
            function (err) {
              if (err) reject(err);
              else resolve(this.lastID);
            }
          );
        });
      }

      const sql = `INSERT INTO Staff (userId, name, jobType, email, specialty, contractType, contractLengthYears, grade, yearsExperience, salary, employmentNumber, gender, address, telephone)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const params = [
        userId,
        name,
        jobType,
        email,
        specialty,
        contractType,
        contractLengthYears,
        grade,
        yearsExperience,
        salary,
        employmentNumber,
        gender,
        address,
        telephone,
      ];

      db.run(sql, params, function (err) {
        if (err) {
          console.error("DB err on staff insert:", err.message);
          return res
            .status(500)
            .json({
              message: "Failed to add staff member.",
              error: err.message,
            });
        }
        res
          .status(201)
          .json({
            message: "Staff member added successfully",
            staffId: this.lastID,
            userId: userId,
          });
      });
    } catch (error) {
      console.error("Outer catch err on staff insert:", error);
      res
        .status(500)
        .json({
          message: "Server error adding staff member.",
          error: error.message,
        });
    }
  });
});

// GET /api/staff - View all staff members
router.get("/", protect, (req, res) => {
  db.all("SELECT * FROM Staff", [], (err, rows) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error retrieving staff.", error: err.message });
    }
    res.json(rows);
  });
});

// GET /api/staff/:id - View a specific staff member by ID (Authenticated users)
router.get("/:id", protect, (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM Staff WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res
        .status(500)
        .json({
          message: "Error retrieving staff member.",
          error: err.message,
        });
    }
    if (!row) {
      return res.status(404).json({ message: "Staff member not found." });
    }
    res.json(row);
  });
});

// GET /api/staff/type/:jobType - View staff by job type (Authenticated users)
router.get("/type/:jobType", protect, (req, res) => {
  const { jobType } = req.params;
  // It's good to validate jobType against expected values if possible, or ensure it's sanitized
  db.all("SELECT * FROM Staff WHERE jobType = ?", [jobType], (err, rows) => {
    if (err) {
      return res
        .status(500)
        .json({
          message: `Error retrieving staff of type ${jobType}.`,
          error: err.message,
        });
    }
    res.json(rows);
  });
});

// PUT /api/staff/:id - Update a staff member (Admin only)
router.put("/:id", protect, authorize("Admin"), (req, res) => {
  const { id } = req.params;
  const {
    name,
    jobType,
    specialty,
    contractType,
    contractLengthYears,
    grade,
    yearsExperience,
    salary,
    employmentNumber,
    gender,
    address,
    telephone,
    userId, // Allow updating associated userId if necessary
  } = req.body;

  if (!name || !jobType || !employmentNumber) {
    return res
      .status(400)
      .json({
        message: "Name, jobType, and employmentNumber are required for update.",
      });
  }

  // Construct SQL query dynamically based on provided fields
  // This is a simple approach; a more robust one would validate each field
  // and handle cases where only some fields are updated.
  const fields = [];
  const params = [];

  if (name !== undefined) {
    fields.push("name = ?");
    params.push(name);
  }
  if (jobType !== undefined) {
    fields.push("jobType = ?");
    params.push(jobType);
  }
  if (specialty !== undefined) {
    fields.push("specialty = ?");
    params.push(specialty);
  }
  if (contractType !== undefined) {
    fields.push("contractType = ?");
    params.push(contractType);
  }
  if (contractLengthYears !== undefined) {
    fields.push("contractLengthYears = ?");
    params.push(contractLengthYears);
  }
  if (grade !== undefined) {
    fields.push("grade = ?");
    params.push(grade);
  }
  if (yearsExperience !== undefined) {
    fields.push("yearsExperience = ?");
    params.push(yearsExperience);
  }
  if (salary !== undefined) {
    fields.push("salary = ?");
    params.push(salary);
  }
  if (employmentNumber !== undefined) {
    fields.push("employmentNumber = ?");
    params.push(employmentNumber);
  }
  if (gender !== undefined) {
    fields.push("gender = ?");
    params.push(gender);
  }
  if (address !== undefined) {
    fields.push("address = ?");
    params.push(address);
  }
  if (telephone !== undefined) {
    fields.push("telephone = ?");
    params.push(telephone);
  }
  if (userId !== undefined) {
    fields.push("userId = ?");
    params.push(userId);
  } // Handle null carefully if unsetting

  if (fields.length === 0) {
    return res.status(400).json({ message: "No fields provided for update." });
  }

  params.push(id); // For the WHERE clause

  const sql = `UPDATE Staff SET ${fields.join(", ")} WHERE id = ?`;

  db.run(sql, params, function (err) {
    if (err) {
      console.error("DB error on staff update:", err.message);
      return res
        .status(500)
        .json({
          message: "Failed to update staff member.",
          error: err.message,
        });
    }
    if (this.changes === 0) {
      return res
        .status(404)
        .json({ message: "Staff member not found or no changes made." });
    }
    res.json({
      message: "Staff member updated successfully.",
      changes: this.changes,
    });
  });
});

// DELETE /api/staff/:id - Remove a staff member (Admin only)
router.delete("/:id", protect, authorize("Admin"), (req, res) => {
  const { id } = req.params;

  // Note: DatabaseAssignment.md states: "A person affiliated with the clinic as a surgeon
  // cannot be deleted as long as a record of all surgeries performed by the surgeon is retained."
  // This logic is NOT implemented here for simplicity in this phase. A real app would need checks.
  // Also, consider what happens to the linked User account (if any). For now, it's not deleted.

  db.run("DELETE FROM Staff WHERE id = ?", [id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({
          message: "Failed to delete staff member.",
          error: err.message,
        });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "Staff member not found." });
    }
    res.json({
      message: "Staff member deleted successfully.",
      changes: this.changes,
    });
  });
});

module.exports = router;
