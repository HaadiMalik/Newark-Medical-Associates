import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllPatientsSimple,
  getAvailableRooms,
  getAllStaffSimple,
  admitPatient,
} from "../../services/apiService";
import "./AdmitPatientPage.css";

interface PatientBasicInfo {
  id: number;
  name: string;
}

interface RoomBasicInfo {
  id: number;
  nursingUnit: string;
  wing: string;
  roomNumber: string;
  bedLabel: string;
  identifier?: string;
}

interface StaffBasicInfo {
  id: number;
  name: string;
  jobType: string;
}

const AdmitPatientPage: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<PatientBasicInfo[]>([]);
  const [availableRooms, setAvailableRooms] = useState<RoomBasicInfo[]>([]);
  const [doctors, setDoctors] = useState<StaffBasicInfo[]>([]);
  const [nurses, setNurses] = useState<StaffBasicInfo[]>([]);

  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [admissionDate, setAdmissionDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [selectedNurseId, setSelectedNurseId] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const patientsRes = await getAllPatientsSimple();
        setPatients(patientsRes);

        const roomsRes = await getAvailableRooms();
        setAvailableRooms(
          roomsRes.map((room: RoomBasicInfo) => ({
            ...room,
            identifier: `${room.wing} ${room.roomNumber}-${room.bedLabel} (Unit ${room.nursingUnit})`,
          }))
        );

        const staffRes = await getAllStaffSimple();
        setDoctors(
          staffRes.filter(
            (s: StaffBasicInfo) =>
              s.jobType === "Doctor" || s.jobType === "Physician"
          )
        );
        setNurses(
          staffRes.filter((s: StaffBasicInfo) => s.jobType === "Nurse")
        );

        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedRoomId || !admissionDate) {
      setError("Patient, Room, and Admission Date are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await admitPatient({
        patientId: parseInt(selectedPatientId),
        roomId: parseInt(selectedRoomId),
        admissionDate,
        assignedDoctorId: selectedDoctorId ? parseInt(selectedDoctorId) : null,
        assignedNurseId: selectedNurseId ? parseInt(selectedNurseId) : null,
      });
      navigate("/inpatients");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to admit patient.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading admission form data...</p>;
  if (error && !patients.length && !availableRooms.length)
    return <p className="errorMessage">{error}</p>;

  return (
    <div className="container">
      <h2>Admit New Patient</h2>
      <form onSubmit={handleSubmit}>
        <div className="formGroup">
          <label htmlFor="patientId">Patient:</label>
          <select
            id="patientId"
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            required
          >
            <option value="">Select Patient</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (ID: {p.id})
              </option>
            ))}
          </select>
        </div>

        <div className="formGroup">
          <label htmlFor="roomId">Available Room:</label>
          <select
            id="roomId"
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            required
          >
            <option value="">Select Room</option>
            {availableRooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.identifier}
              </option>
            ))}
          </select>
        </div>

        <div className="formGroup">
          <label htmlFor="admissionDate">Admission Date:</label>
          <input
            type="date"
            id="admissionDate"
            value={admissionDate}
            onChange={(e) => setAdmissionDate(e.target.value)}
            required
          />
        </div>

        <div className="formGroup">
          <label htmlFor="doctorId">Attending Doctor (Optional):</label>
          <select
            id="doctorId"
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
          >
            <option value="">None</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="formGroup">
          <label htmlFor="nurseId">Attending Nurse (Optional):</label>
          <select
            id="nurseId"
            value={selectedNurseId}
            onChange={(e) => setSelectedNurseId(e.target.value)}
          >
            <option value="">None</option>
            {nurses.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="errorMessage">{error}</p>}

        <button type="submit" disabled={submitting} className="submitButton">
          {submitting ? "Admitting..." : "Admit Patient"}
        </button>
        <button
          type="button"
          onClick={() => navigate("/inpatients")}
          className="cancelButton"
          disabled={submitting}
        >
          Cancel
        </button>
      </form>
    </div>
  );
};

export default AdmitPatientPage;
