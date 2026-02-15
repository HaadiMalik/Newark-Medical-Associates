const express = require("express");
const cors = require("cors");
const _db = require("./database/initDb");

const authRoutes = require("./routes/authRoutes");
const staffRoutes = require("./routes/staffRoutes");
const patientRoutes = require("./routes/patientRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const roomRoutes = require("./routes/roomRoutes");
const inPatientRoutes = require("./routes/inPatientRoutes");
const surgeryRoutes = require("./routes/surgeryRoutes");
const illnessRoutes = require("./routes/illnessRoutes");
const allergyRoutes = require("./routes/allergyRoutes");
const shiftRoutes = require("./routes/shiftRoutes");

const app = express();
// Backend server
const port = process.env.PORT || 3001;

app.use(cors());

app.use(express.json());

// Simple GET route
app.get("/api", (_req, res) => {
  res.json({ message: "Hello from the NMA backend!" });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/inpatients", inPatientRoutes);
app.use("/api/surgeries", surgeryRoutes);
app.use("/api/illnesses", illnessRoutes);
app.use("/api/allergies", allergyRoutes);
app.use("/api/shifts", shiftRoutes);

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});

module.exports = app;
