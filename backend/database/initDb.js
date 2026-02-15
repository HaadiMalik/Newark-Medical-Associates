const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcryptjs");

const DBSOURCE = path.join(__dirname, "nma.sqlite");

const db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    console.error("Error opening database", err.message);
    throw err;
  }
  console.log("Connected to the SQLite database.");
});

function createTables() {
  db.serialize(() => {
    console.log("Creating tables...");

    // Users Table for login
    db.run(
      `CREATE TABLE IF NOT EXISTS Users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL, -- Store hashed in a real app
            role TEXT NOT NULL CHECK(role IN ('Admin', 'Doctor', 'Nurse', 'Support'))
        )`,
      (err) => {
        if (err) console.error("Error creating Users table", err);
        else {
          console.log("Users table created or already exists.");
          db.get("SELECT COUNT(*) as count FROM Users", (err, row) => {
            if (err) {
              console.error("Error checking Users table count:", err);
              return;
            }
            if (row && row.count === 0) {
              console.log(
                "Users table is empty, proceeding to populate initial data."
              );
              populateInitialData();
            } else {
              console.log(
                "Users table already has data or an error occurred during count."
              );
            }
          });
        }
      }
    );

    // Staff Table
    db.run(
      `CREATE TABLE IF NOT EXISTS Staff (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER UNIQUE, -- Can be NULL if staff member doesn't have login credentials yet
            name TEXT NOT NULL,
            jobType TEXT NOT NULL CHECK(jobType IN ('Physician', 'Surgeon', 'Nurse', 'Support Staff', 'Admin', 'Technician', 'Pharmacist')),
            specialty TEXT, -- For Physician/Surgeon
            contractType TEXT, -- For Surgeon
            contractLengthYears INTEGER, -- For Surgeon
            grade TEXT, -- For Nurse
            yearsExperience INTEGER, -- For Nurse
            salary REAL,
            employmentNumber TEXT UNIQUE NOT NULL,
            gender TEXT CHECK(gender IN ('Male', 'Female', 'Other')),
            address TEXT,
            telephone TEXT,
            email TEXT UNIQUE NOT NULL,
            dob TEXT,
            hireDate TEXT,
            FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE SET NULL
        )`,
      (err) => {
        if (err) console.error("Error creating Staff table", err);
        else console.log("Staff table created or already exists.");
      }
    );

    // Patients Table
    db.run(
      `CREATE TABLE IF NOT EXISTS Patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            gender TEXT CHECK(gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
            dob TEXT NOT NULL, -- Date of Birth (YYYY-MM-DD)
            address TEXT,
            telephone TEXT,
            ssn TEXT UNIQUE,
            bloodType TEXT,
            cholesterolHDL REAL,
            cholesterolLDL REAL,
            cholesterolTriglyceride REAL,
            bloodSugar REAL,
            primaryCarePhysicianId INTEGER,
            FOREIGN KEY (primaryCarePhysicianId) REFERENCES Staff(id) ON DELETE SET NULL
        )`,
      (err) => {
        if (err) console.error("Error creating Patients table", err);
        else console.log("Patients table created or already exists.");
      }
    );

    // Illnesses Table
    db.run(
      `CREATE TABLE IF NOT EXISTS Illnesses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            description TEXT NOT NULL
        )`,
      (err) => {
        if (err) console.error("Error creating Illnesses table", err);
        else console.log("Illnesses table created or already exists.");
      }
    );

    // PatientIllnesses Table (custom table to ease querying)
    db.run(
      `CREATE TABLE IF NOT EXISTS PatientIllnesses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patientId INTEGER NOT NULL,
            illnessCode TEXT NOT NULL,
            diagnosedDate TEXT,
            FOREIGN KEY (patientId) REFERENCES Patients(id) ON DELETE CASCADE,
            FOREIGN KEY (illnessCode) REFERENCES Illnesses(code) ON DELETE CASCADE
        )`,
      (err) => {
        if (err) console.error("Error creating PatientIllnesses table", err);
        else console.log("PatientIllnesses table created or already exists.");
      }
    );

    // Allergies Table (similar to Illnesses but for Allergies)
    db.run(
      `CREATE TABLE IF NOT EXISTS Allergies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL
        )`,
      (err) => {
        if (err) console.error("Error creating Allergies table", err);
        else console.log("Allergies table created or already exists.");
      }
    );

    // PatientAllergies Table (Junction table)
    db.run(
      `CREATE TABLE IF NOT EXISTS PatientAllergies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patientId INTEGER NOT NULL,
            allergyCode TEXT NOT NULL,
            FOREIGN KEY (patientId) REFERENCES Patients(id) ON DELETE CASCADE,
            FOREIGN KEY (allergyCode) REFERENCES Allergies(code) ON DELETE CASCADE
        )`,
      (err) => {
        if (err) console.error("Error creating PatientAllergies table", err);
        else console.log("PatientAllergies table created or already exists.");
      }
    );

    // Appointments Table (Consultations)
    db.run(
      `CREATE TABLE IF NOT EXISTS Appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patientId INTEGER NOT NULL,
            doctorId INTEGER NOT NULL, -- Staff ID of the doctor for the consultation
            appointmentDate TEXT NOT NULL, -- YYYY-MM-DD HH:MM:SS
            reason TEXT,
            status TEXT DEFAULT 'Scheduled' CHECK(status IN ('Scheduled', 'Completed', 'Cancelled', 'No Show')),
            FOREIGN KEY (patientId) REFERENCES Patients(id) ON DELETE CASCADE,
            FOREIGN KEY (doctorId) REFERENCES Staff(id) ON DELETE CASCADE
        )`,
      (err) => {
        if (err) console.error("Error creating Appointments table", err);
        else console.log("Appointments table created or already exists.");
      }
    );

    // Rooms Table (created to help with room management for In-Patient Management)
    db.run(
      `CREATE TABLE IF NOT EXISTS Rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nursingUnit TEXT NOT NULL, -- e.g., '1', '2', ... '7'
            wing TEXT CHECK(wing IN ('Blue', 'Green')),
            roomNumber TEXT NOT NULL,
            bedLabel TEXT CHECK(bedLabel IN ('A', 'B')),
            isOccupied INTEGER DEFAULT 0, -- 0 for false, 1 for true (boolean)
            UNIQUE (nursingUnit, wing, roomNumber, bedLabel)
        )`,
      (err) => {
        if (err) console.error("Error creating Rooms table", err);
        else console.log("Rooms table created or already exists.");
      }
    );

    // InPatients Table
    db.run(
      `CREATE TABLE IF NOT EXISTS InPatients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patientId INTEGER UNIQUE NOT NULL,
            roomId INTEGER UNIQUE,
            admissionDate TEXT NOT NULL,
            dischargeDate TEXT,
            assignedNurseId INTEGER,
            assignedDoctorId INTEGER, -- Attending physician for in-patient care
            FOREIGN KEY (patientId) REFERENCES Patients(id) ON DELETE CASCADE,
            FOREIGN KEY (roomId) REFERENCES Rooms(id) ON DELETE SET NULL,
            FOREIGN KEY (assignedNurseId) REFERENCES Staff(id) ON DELETE SET NULL,
            FOREIGN KEY (assignedDoctorId) REFERENCES Staff(id) ON DELETE SET NULL
        )`,
      (err) => {
        if (err) console.error("Error creating InPatients table", err);
        else {
          console.log("InPatients table created or already exists.");
        }
      }
    );

    // Surgery Types Table
    db.run(
      `CREATE TABLE IF NOT EXISTS SurgeryTypes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            surgeryCode TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            category TEXT CHECK(category IN ('H', 'O')), -- H for Hospitalization, O for Outpatient
            anatomicalLocation TEXT,
            specialNeeds TEXT
        )`,
      (err) => {
        if (err) console.error("Error creating SurgeryTypes table", err);
        else console.log("SurgeryTypes table created or already exists.");
      }
    );

    // Surgeries Table (Scheduled Surgeries)
    db.run(
      `CREATE TABLE IF NOT EXISTS Surgeries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patientId INTEGER NOT NULL,
            surgeonId INTEGER NOT NULL, -- Staff ID of the surgeon
            surgeryTypeId INTEGER NOT NULL,
            operationTheatre TEXT, -- e.g., 'OT1', 'OT2'
            scheduledDateTime TEXT NOT NULL, -- YYYY-MM-DD HH:MM:SS
            status TEXT DEFAULT 'Scheduled' CHECK(status IN ('Scheduled', 'Completed', 'Cancelled')),
            FOREIGN KEY (patientId) REFERENCES Patients(id) ON DELETE CASCADE,
            FOREIGN KEY (surgeonId) REFERENCES Staff(id) ON DELETE CASCADE,
            FOREIGN KEY (surgeryTypeId) REFERENCES SurgeryTypes(id) ON DELETE CASCADE
        )`,
      (err) => {
        if (err) console.error("Error creating Surgeries table", err);
        else {
          console.log("Surgeries table created or already exists.");
        }
      }
    );

    // Shifts Table (for Staff Shifts)
    db.run(
      `CREATE TABLE IF NOT EXISTS Shifts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            staffId INTEGER NOT NULL,
            shiftDate TEXT NOT NULL,
            startTime TEXT NOT NULL,
            endTime TEXT NOT NULL, 
            FOREIGN KEY (staffId) REFERENCES Staff(id) ON DELETE CASCADE
        )`,
      (err) => {
        if (err) console.error("Error creating Shifts table", err);
        else {
          console.log("Shifts table created or already exists.");
        }
      }
    );
  });
}

async function populateInitialData() {
  db.serialize(async () => {
    console.log("Populating initial data...");

    // Sample Users - Passwords will be hashed
    const usersToCreate = [
      { username: "admin", password: "adminpass", role: "Admin" },
      { username: "doc_adams", password: "docpass", role: "Doctor" },
      { username: "nurse_betty", password: "nursepass", role: "Nurse" },
      { username: "support_sam", password: "supportpass", role: "Support" },
    ];

    const userStmt = db.prepare(
      "INSERT OR IGNORE INTO Users (username, password, role) VALUES (?, ?, ?)"
    );
    for (const user of usersToCreate) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);
      userStmt.run(user.username, hashedPassword, user.role, (err) => {
        if (err)
          console.error(`Error inserting user ${user.username}:`, err.message);
      });
    }
    userStmt.finalize((err) => {
      if (err) console.error("Finalizing userStmt error:", err.message);
      console.log("Sample users populated or ignored if existing.");
      populateStaffAndOtherData();
    });
  });
}

// Populate tables.
async function populateStaffAndOtherData() {
  db.serialize(async () => {
    console.log("Populating staff and other data...");

    // Helper to get user ID
    const getUserId = (username) => {
      return new Promise((resolve, reject) => {
        db.get(
          "SELECT id FROM Users WHERE username = ?",
          [username],
          (err, row) => {
            if (err) reject(err);
            else resolve(row ? row.id : null);
          }
        );
      });
    };

    const adminUserId = await getUserId("admin");
    const docAdamsUserId = await getUserId("doc_adams");
    const nurseBettyUserId = await getUserId("nurse_betty");
    const supportSamUserId = await getUserId("support_sam");

    const staff = [
      {
        userId: adminUserId,
        name: "Dr. Alice Admin",
        jobType: "Admin",
        specialty: "Hospital Administration",
        employmentNumber: "EMP000",
        salary: 150000,
        gender: "Female",
        address: "10 Admin Way",
        telephone: "555-0100",
        email: "alice.admin@nma.com",
        dob: "1975-03-10",
        hireDate: "2010-06-01",
      },
      {
        userId: docAdamsUserId,
        name: "Dr. Bob Adams",
        jobType: "Physician",
        specialty: "Cardiology",
        employmentNumber: "EMP001",
        salary: 200000,
        gender: "Male",
        address: "123 Heart St",
        telephone: "555-0101",
        email: "bob.adams@nma.com",
        dob: "1980-11-22",
        hireDate: "2015-08-15",
      },
      {
        userId: nurseBettyUserId,
        name: "Nurse Betty Clark",
        jobType: "Nurse",
        grade: "Senior Nurse",
        yearsExperience: 10,
        employmentNumber: "EMP002",
        salary: 80000,
        gender: "Female",
        address: "456 Care Ave",
        telephone: "555-0102",
        email: "betty.clark@nma.com",
        dob: "1988-07-14",
        hireDate: "2012-03-01",
      },
      {
        name: "Dr. Charles Davis",
        jobType: "Surgeon",
        specialty: "Orthopedics",
        contractType: "Full-Time",
        contractLengthYears: 5,
        employmentNumber: "EMP003",
        gender: "Male",
        address: "789 Bone Rd",
        telephone: "555-0103",
        email: "charles.davis@nma.com",
        dob: "1970-02-20",
        hireDate: "2018-01-10",
      },
      {
        userId: supportSamUserId,
        name: "Support Sam Smith",
        jobType: "Support",
        employmentNumber: "EMP004",
        salary: 50000,
        gender: "Male",
        address: "1 Support Ln",
        telephone: "555-0104",
        email: "sam.smith@nma.com",
        dob: "1990-06-25",
        hireDate: "2019-07-20",
      },
    ];

    const staffStmt = db.prepare(`INSERT OR IGNORE INTO Staff 
            (userId, name, jobType, specialty, contractType, contractLengthYears, grade, yearsExperience, salary, employmentNumber, gender, address, telephone, email, dob, hireDate)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    staff.forEach((s) =>
      staffStmt.run(
        s.userId,
        s.name,
        s.jobType,
        s.specialty,
        s.contractType,
        s.contractLengthYears,
        s.grade,
        s.yearsExperience,
        s.salary,
        s.employmentNumber,
        s.gender,
        s.address,
        s.telephone,
        s.email,
        s.dob,
        s.hireDate
      )
    );
    staffStmt.finalize();
    console.log("Sample staff populated.");

    const patients = [
      {
        name: "John Doe",
        gender: "Male",
        dob: "1980-05-15",
        address: "1 Patient Lane",
        telephone: "555-0200",
        ssn: "111-00-0001",
        bloodType: "O+",
        primaryCarePhysicianId: docAdamsUserId,
      },
      {
        name: "Jane Smith",
        gender: "Female",
        dob: "1992-09-20",
        address: "2 Sick Street",
        telephone: "555-0201",
        ssn: "111-00-0002",
        bloodType: "A-",
        primaryCarePhysicianId: docAdamsUserId,
      },
      {
        name: "Old Man River",
        gender: "Male",
        dob: "1950-01-01",
        address: "3 River Bend",
        telephone: "555-0202",
        ssn: "111-00-0003",
        bloodType: "B+",
        primaryCarePhysicianId: adminUserId,
      },
    ];

    const patientStmt = db.prepare(`INSERT OR IGNORE INTO Patients 
            (name, gender, dob, address, telephone, ssn, bloodType, primaryCarePhysicianId)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    for (const p of patients) {
      const pcpId =
        typeof p.primaryCarePhysicianId === "function"
          ? await p.primaryCarePhysicianId()
          : p.primaryCarePhysicianId;
      patientStmt.run(
        p.name,
        p.gender,
        p.dob,
        p.address,
        p.telephone,
        p.ssn,
        p.bloodType,
        pcpId
      );
    }
    patientStmt.finalize();
    console.log("Sample patients populated.");

    const rooms = [
      { nursingUnit: "1", wing: "Blue", roomNumber: "101", bedLabel: "A" },
      { nursingUnit: "1", wing: "Blue", roomNumber: "103", bedLabel: "A" },
      { nursingUnit: "2", wing: "Green", roomNumber: "205", bedLabel: "B" },
      { nursingUnit: "2", wing: "Green", roomNumber: "206", bedLabel: "B" },
      { nursingUnit: "1", wing: "Blue", roomNumber: "104", bedLabel: "A" },
      { nursingUnit: "2", wing: "Green", roomNumber: "207", bedLabel: "B" },
    ];
    const roomStmt = db.prepare(
      "INSERT OR IGNORE INTO Rooms (nursingUnit, wing, roomNumber, bedLabel) VALUES (?, ?, ?, ?)"
    );
    rooms.forEach((r) =>
      roomStmt.run(r.nursingUnit, r.wing, r.roomNumber, r.bedLabel)
    );
    roomStmt.finalize();
    console.log("Sample rooms populated.");

    const illnesses = [
      { code: "FLU001", description: "Influenza" },
      { code: "HYP001", description: "Hypertension" },
    ];
    const illnessStmt = db.prepare(
      "INSERT OR IGNORE INTO Illnesses (code, description) VALUES (?, ?)"
    );
    illnesses.forEach((i) => illnessStmt.run(i.code, i.description));
    illnessStmt.finalize();
    console.log("Sample illnesses populated.");

    const allergies = [
      { code: "PNCL01", name: "Penicillin" },
      { code: "ALR001", name: "Pollen" },
    ];
    const allergyStmt = db.prepare(
      "INSERT OR IGNORE INTO Allergies (code, name) VALUES (?, ?)"
    );
    allergies.forEach((a) => allergyStmt.run(a.code, a.name));
    allergyStmt.finalize();
    console.log("Sample allergies populated.");

    const appointments = [
      {
        patientId: 1,
        doctorId: docAdamsUserId,
        appointmentDate: "2024-08-01 10:00:00",
        reason: "Checkup",
      },
      {
        patientId: 2,
        doctorId: docAdamsUserId,
        appointmentDate: "2024-08-01 11:00:00",
        reason: "Follow-up",
      },
    ];
    const appointmentStmt = db.prepare(
      "INSERT OR IGNORE INTO Appointments (patientId, doctorId, appointmentDate, reason) VALUES (?, ?, ?, ?)"
    );
    for (const appt of appointments) {
      const docId =
        typeof appt.doctorId === "function"
          ? await appt.doctorId()
          : appt.doctorId;
      appointmentStmt.run(
        appt.patientId,
        docId,
        appt.appointmentDate,
        appt.reason
      );
    }
    appointmentStmt.finalize();
    console.log("Sample appointments populated.");

    const surgeryTypes = [
      {
        surgeryCode: "APP001",
        name: "Appendectomy",
        category: "H",
        anatomicalLocation: "Abdomen",
      },
      {
        surgeryCode: "CAT001",
        name: "Cataract Surgery",
        category: "O",
        anatomicalLocation: "Eye",
      },
    ];
    const surgeryTypeStmt = db.prepare(
      "INSERT OR IGNORE INTO SurgeryTypes (surgeryCode, name, category, anatomicalLocation) VALUES (?, ?, ?, ?)"
    );
    surgeryTypes.forEach((st) =>
      surgeryTypeStmt.run(
        st.surgeryCode,
        st.name,
        st.category,
        st.anatomicalLocation
      )
    );
    surgeryTypeStmt.finalize();
    console.log("Sample surgery types populated.");

    console.log("Finished populating all initial data.");
    console.log(
      "Initial data population sequence complete. Database remains open."
    );
  });
}

db.serialize(() => {
  createTables();
});

module.exports = db;
