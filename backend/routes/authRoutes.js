const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../database/initDb");

const router = express.Router();

const JWT_SECRET = "yoursupersecretkeyforschoolproject";

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res
      .status(400)
      .json({ message: "Username, password, and role are required." });
  }

  const validRoles = ["Admin", "Doctor", "Nurse", "Support"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({
      message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
    });
  }

  try {
    db.get(
      "SELECT * FROM Users WHERE username = ?",
      [username],
      async (err, row) => {
        if (err) {
          console.error(
            "Database error during registration check:",
            err.message
          );
          return res
            .status(500)
            .json({ message: "Error checking user existence." });
        }
        if (row) {
          return res.status(400).json({ message: "Username already exists." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        db.run(
          "INSERT INTO Users (username, password, role) VALUES (?, ?, ?)",
          [username, hashedPassword, role],
          function (err) {
            if (err) {
              console.error("Database error during registration:", err.message);
              return res
                .status(500)
                .json({ message: "Error registering user." });
            }
            const token = jwt.sign(
              { id: this.lastID, username: username, role: role },
              JWT_SECRET,
              { expiresIn: "1h" }
            );
            res.status(201).json({
              message: "User registered successfully.",
              userId: this.lastID,
              token: token,
            });
          }
        );
      }
    );
  } catch (error) {
    console.error("Server error during registration:", error);
    res.status(500).json({ message: "Server error during registration." });
  }
});

// POST /api/auth/login
router.post("/login", (req, res) => {
  console.log("[LOGIN ATTEMPT] Request body:", req.body);
  const { username, password } = req.body;

  if (!username || !password) {
    console.log("[LOGIN REJECTED] Missing username or password.");
    return res
      .status(400)
      .json({ message: "Username and password are required." });
  }

  db.get(
    "SELECT * FROM Users WHERE username = ?",
    [username],
    async (err, user) => {
      if (err) {
        console.error(
          "[LOGIN DB ERROR] Database error during login:",
          err.message
        );
        return res.status(500).json({ message: "Error during login." });
      }
      console.log("[LOGIN DB RESULT] User fetched from DB:", user);

      if (!user) {
        console.log("[LOGIN REJECTED] User not found:", username);
        return res
          .status(400)
          .json({ message: "Invalid credentials. User not found." });
      }

      console.log(
        "[LOGIN INFO] Comparing provided password:",
        password,
        "with stored hash:",
        user.password
      );
      const isMatch = await bcrypt.compare(password, user.password);
      console.log("[LOGIN INFO] Password match result:", isMatch);

      if (!isMatch) {
        console.log("[LOGIN REJECTED] Password incorrect for user:", username);
        return res
          .status(400)
          .json({ message: "Invalid credentials. Password incorrect." });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: "1h" }
      );
      console.log("[LOGIN SUCCESS] Token generated for user:", username);

      res.json({
        message: "Login successful.",
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      });
    }
  );
});

// Simple logout - In a real app, token invalidation is more complex (e.g., blocklist)
// For a stateless JWT approach, the client just discards the token.
router.post("/logout", (req, res) => {
  // Client should discard the token. No server-side action needed for basic JWT.
  res
    .status(200)
    .json({ message: "Logout successful. Please discard your token." });
});

module.exports = router;
