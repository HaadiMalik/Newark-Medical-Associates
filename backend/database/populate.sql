PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE Users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('Admin', 'Doctor', 'Nurse', 'Support'))
        );
INSERT INTO Users VALUES(1,'admin','$2b$10$x9LBKeDEy91JwyWkt2FkMulr8rD1xQdyr2t.zURfA1enxzJJC1kzi','Admin');
INSERT INTO Users VALUES(2,'doc_adams','$2b$10$gmaV4JhHyXnlGk/8GIDkMOBg7zPEjksW.7XCt1sVME0SyPGP4VU4C','Doctor');
INSERT INTO Users VALUES(3,'nurse_betty','$2b$10$/71MvvDHZS1ohYWEUo6SG.YQ9Cpwnxmja91kbC2qaRQ1hIHKYcSqi','Nurse');
INSERT INTO Users VALUES(4,'support_sam','$2b$10$O5E75apFVad4GQcYI/yAOubgrPyuecH4jYV00mzyXgMVu8LG8OXI2','Support');
CREATE TABLE Staff (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER UNIQUE,
            name TEXT NOT NULL,
            jobType TEXT NOT NULL CHECK(jobType IN ('Physician', 'Surgeon', 'Nurse', 'Support Staff', 'Admin', 'Technician', 'Pharmacist')),
            specialty TEXT,
            contractType TEXT,
            contractLengthYears INTEGER,
            grade TEXT,
            yearsExperience INTEGER,
            salary REAL,
            employmentNumber TEXT UNIQUE NOT NULL,
            gender TEXT CHECK(gender IN ('Male', 'Female', 'Other')),
            address TEXT,
            telephone TEXT,
            email TEXT UNIQUE NOT NULL,
            dob TEXT,
            hireDate TEXT,
            FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE SET NULL
        );
INSERT INTO Staff VALUES(1,1,'Dr. Alice Admin','Admin','Hospital Administration',NULL,NULL,NULL,NULL,150000.0,'EMP000','Female','10 Admin Way','555-0100','alice.admin@nma.com','1975-03-10','2010-06-01');
INSERT INTO Staff VALUES(3,3,'Nurse Betty Clark','Nurse',NULL,NULL,NULL,'Senior Nurse',10,80000.0,'EMP002','Female','456 Care Ave','555-0102','betty.clark@nma.com','1988-07-14','2012-03-01');
INSERT INTO Staff VALUES(4,NULL,'Dr. Charles Davis','Surgeon','Orthopedics','Full-Time',5,NULL,NULL,NULL,'EMP003','Male','789 Bone Rd','555-0103','charles.davis@nma.com','1970-02-20','2018-01-10');
INSERT INTO Staff VALUES(7,NULL,'Warden','Physician',NULL,NULL,NULL,NULL,NULL,60000.0,'','Male','sa','333-666-9999','something@anything',NULL,NULL);
INSERT INTO Staff VALUES(8,NULL,'John Smith','Technician',NULL,NULL,NULL,NULL,NULL,435353.0,'004','Male','20 St.','999-222-2933','hd@gmail.com',NULL,NULL);
CREATE TABLE Patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            gender TEXT CHECK(gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
            dob TEXT NOT NULL,
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
        );
INSERT INTO Patients VALUES(1,'John Doe','Male','1980-05-15','1 Patient Lane','555-0200','111-00-0001','O+',NULL,NULL,NULL,NULL,2);
INSERT INTO Patients VALUES(2,'Jane Smith','Female','1992-09-20','2 Sick Street','555-0201','111-00-0033','A-',NULL,NULL,NULL,NULL,2);
INSERT INTO Patients VALUES(3,'Old Man River','Male','1950-01-01','3 River Bend','555-0202','111-00-0003','B+',NULL,NULL,NULL,NULL,1);
INSERT INTO Patients VALUES(4,'ssss','Prefer not to say','2025-05-16','111 fff','9083193842','111111111','A+',NULL,NULL,NULL,NULL,NULL);
INSERT INTO Patients VALUES(5,'Test Name','Male','2025-05-08','12 Lane','444-555-1111','134-22-2345','A+',NULL,NULL,NULL,NULL,NULL);
INSERT INTO Patients VALUES(6,'JJ','Male','2025-05-13','01 Lane Dr.','123-456-1233','123-45-1234','A-',NULL,NULL,NULL,NULL,NULL);
INSERT INTO Patients VALUES(7,'Paul','Male','2025-05-22','03 Light Dr.','222-444-6666','333-44-5555','O-',NULL,NULL,NULL,NULL,NULL);
INSERT INTO Patients VALUES(8,'Hello','Male','2025-05-09','12 Light Dr.','222-333-9999','111-88-9999','AB+',NULL,NULL,NULL,NULL,NULL);
CREATE TABLE Illnesses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            description TEXT NOT NULL
        );
INSERT INTO Illnesses VALUES(1,'FLU001','Influenza');
INSERT INTO Illnesses VALUES(2,'HYP001','Hypertension');
CREATE TABLE PatientIllnesses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patientId INTEGER NOT NULL,
            illnessCode TEXT NOT NULL,
            diagnosedDate TEXT,
            FOREIGN KEY (patientId) REFERENCES Patients(id) ON DELETE CASCADE,
            FOREIGN KEY (illnessCode) REFERENCES Illnesses(code) ON DELETE CASCADE
        );
CREATE TABLE Allergies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL
        );
INSERT INTO Allergies VALUES(1,'PNCL01','Penicillin');
INSERT INTO Allergies VALUES(2,'ALR001','Pollen');
CREATE TABLE PatientAllergies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patientId INTEGER NOT NULL,
            allergyCode TEXT NOT NULL,
            FOREIGN KEY (patientId) REFERENCES Patients(id) ON DELETE CASCADE,
            FOREIGN KEY (allergyCode) REFERENCES Allergies(code) ON DELETE CASCADE
        );
CREATE TABLE Appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patientId INTEGER NOT NULL,
            doctorId INTEGER NOT NULL,
            appointmentDate TEXT NOT NULL,
            reason TEXT,
            status TEXT DEFAULT 'Scheduled' CHECK(status IN ('Scheduled', 'Completed', 'Cancelled', 'No Show')),
            FOREIGN KEY (patientId) REFERENCES Patients(id) ON DELETE CASCADE,
            FOREIGN KEY (doctorId) REFERENCES Staff(id) ON DELETE CASCADE
        );
INSERT INTO Appointments VALUES(1,1,2,'2024-08-01 10:00:00','Checkup','Scheduled');
INSERT INTO Appointments VALUES(2,2,2,'2024-08-01 11:00:00','Follow-up','Scheduled');
INSERT INTO Appointments VALUES(3,2,7,'2025-05-09T01:35:00.000Z','Check','Scheduled');
INSERT INTO Appointments VALUES(4,8,7,'2025-05-15T02:05:00.000Z','Checkup','Scheduled');
CREATE TABLE Rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nursingUnit TEXT NOT NULL,
            wing TEXT CHECK(wing IN ('Blue', 'Green')),
            roomNumber TEXT NOT NULL,
            bedLabel TEXT CHECK(bedLabel IN ('A', 'B')),
            isOccupied INTEGER DEFAULT 0,
            UNIQUE (nursingUnit, wing, roomNumber, bedLabel)
        );
INSERT INTO Rooms VALUES(1,'1','Blue','101','A',0);
INSERT INTO Rooms VALUES(2,'1','Blue','101','B',0);
INSERT INTO Rooms VALUES(3,'2','Green','205','A',1);
CREATE TABLE InPatients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patientId INTEGER UNIQUE NOT NULL,
            roomId INTEGER UNIQUE,
            admissionDate TEXT NOT NULL,
            dischargeDate TEXT,
            assignedNurseId INTEGER,
            assignedDoctorId INTEGER,
            FOREIGN KEY (patientId) REFERENCES Patients(id) ON DELETE CASCADE,
            FOREIGN KEY (roomId) REFERENCES Rooms(id) ON DELETE SET NULL,
            FOREIGN KEY (assignedNurseId) REFERENCES Staff(id) ON DELETE SET NULL,
            FOREIGN KEY (assignedDoctorId) REFERENCES Staff(id) ON DELETE SET NULL
        );
INSERT INTO InPatients VALUES(1,3,2,'2025-05-11','2025-05-12',NULL,NULL);
INSERT INTO InPatients VALUES(2,2,1,'2025-05-12','2025-05-12',NULL,NULL);
INSERT INTO InPatients VALUES(3,7,3,'2025-05-12',NULL,3,7);
CREATE TABLE SurgeryTypes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            surgeryCode TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            category TEXT CHECK(category IN ('H', 'O')),
            anatomicalLocation TEXT,
            specialNeeds TEXT
        );
INSERT INTO SurgeryTypes VALUES(1,'APP001','Appendectomy','H','Abdomen',NULL);
INSERT INTO SurgeryTypes VALUES(2,'CAT001','Cataract Surgery','O','Eye',NULL);
CREATE TABLE Surgeries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patientId INTEGER NOT NULL,
            surgeonId INTEGER NOT NULL,
            surgeryTypeId INTEGER NOT NULL,
            operationTheatre TEXT,
            scheduledDateTime TEXT NOT NULL,
            status TEXT DEFAULT 'Scheduled' CHECK(status IN ('Scheduled', 'Completed', 'Cancelled')),
            FOREIGN KEY (patientId) REFERENCES Patients(id) ON DELETE CASCADE,
            FOREIGN KEY (surgeonId) REFERENCES Staff(id) ON DELETE CASCADE,
            FOREIGN KEY (surgeryTypeId) REFERENCES SurgeryTypes(id) ON DELETE CASCADE
        );
INSERT INTO Surgeries VALUES(1,2,4,1,NULL,'2025-05-08T04:30','Scheduled');
INSERT INTO Surgeries VALUES(2,3,4,2,NULL,'2025-05-31T13:28','Scheduled');
INSERT INTO Surgeries VALUES(3,1,4,1,'blank','2025-05-16T15:09','Scheduled');
INSERT INTO Surgeries VALUES(4,2,4,1,NULL,'2025-05-01T14:21','Scheduled');
INSERT INTO Surgeries VALUES(5,2,4,2,NULL,'2025-05-07T14:22','Scheduled');
INSERT INTO Surgeries VALUES(6,2,4,2,NULL,'2025-05-04T14:33','Scheduled');
INSERT INTO Surgeries VALUES(7,1,4,1,NULL,'2025-05-17T20:27','Scheduled');
INSERT INTO Surgeries VALUES(8,5,4,1,'something','2025-05-08T20:28','Scheduled');
INSERT INTO Surgeries VALUES(9,5,4,2,'Lab 1','2025-05-14T22:09','Scheduled');
CREATE TABLE Shifts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            staffId INTEGER NOT NULL,
            shiftDate TEXT NOT NULL,
            startTime TEXT NOT NULL,
            endTime TEXT NOT NULL,
            FOREIGN KEY (staffId) REFERENCES Staff(id) ON DELETE CASCADE
        );
INSERT INTO Shifts VALUES(1,4,'2025-05-13','11:20','14:20');
INSERT INTO Shifts VALUES(2,3,'2025-05-15','10:21','22:22');
INSERT INTO sqlite_sequence VALUES('Users',4);
INSERT INTO sqlite_sequence VALUES('Staff',8);
INSERT INTO sqlite_sequence VALUES('Allergies',2);
INSERT INTO sqlite_sequence VALUES('Appointments',4);
INSERT INTO sqlite_sequence VALUES('SurgeryTypes',2);
INSERT INTO sqlite_sequence VALUES('Patients',8);
INSERT INTO sqlite_sequence VALUES('Illnesses',2);
INSERT INTO sqlite_sequence VALUES('Rooms',3);
INSERT INTO sqlite_sequence VALUES('Surgeries',9);
INSERT INTO sqlite_sequence VALUES('InPatients',3);
INSERT INTO sqlite_sequence VALUES('Shifts',2);
COMMIT;
