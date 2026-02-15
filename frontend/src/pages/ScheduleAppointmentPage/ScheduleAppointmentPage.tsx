import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllPatientsSimple,
  getAllStaffSimple,
  scheduleAppointment,
} from "../../services/apiService";
import "./ScheduleAppointmentPage.css";

interface PatientBasicInfo {
  id: number;
  name: string;
}

interface StaffBasicInfo {
  id: number;
  name: string;
  jobType: string;
}

const ScheduleAppointmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<PatientBasicInfo[]>([]);
  const [doctors, setDoctors] = useState<StaffBasicInfo[]>([]);

  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [appointmentDateTime, setAppointmentDateTime] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const patientsRes = await getAllPatientsSimple();
        setPatients(patientsRes);

        const staffRes = await getAllStaffSimple();
        setDoctors(
          staffRes.filter(
            (s: StaffBasicInfo) =>
              s.jobType === "Doctor" || s.jobType === "Physician"
          )
        );

        setError(null);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            "Failed to load data for scheduling form."
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedDoctorId || !appointmentDateTime) {
      setError("Patient, Doctor, and Appointment Date/Time are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await scheduleAppointment({
        patientId: parseInt(selectedPatientId),
        doctorId: parseInt(selectedDoctorId),
        appointmentDate: new Date(appointmentDateTime).toISOString(),
        reason: reason.trim(),
      });
      navigate("/appointments");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to schedule appointment."
      );
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading form data...</p>;
  if (error && !patients.length && !doctors.length)
    return <p className="error-message">{error}</p>;

  return (
    <div className="form-container">
      <h2>Schedule New Appointment</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="patientId" className="form-label">
            Patient:
          </label>
          <select
            id="patientId"
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            required
            className="form-input"
          >
            <option value="">Select Patient</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (ID: {p.id})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="doctorId" className="form-label">
            Doctor:
          </label>
          <select
            id="doctorId"
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            required
            className="form-input"
          >
            <option value="">Select Doctor</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="appointmentDateTime" className="form-label">
            Appointment Date & Time:
          </label>
          <input
            type="datetime-local"
            id="appointmentDateTime"
            value={appointmentDateTime}
            onChange={(e) => setAppointmentDateTime(e.target.value)}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="reason" className="form-label">
            Reason for Appointment:
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="form-input"
          />
        </div>

        {error && <p className="error-message">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-submit">
          {submitting ? "Scheduling..." : "Schedule Appointment"}
        </button>
        <button
          type="button"
          onClick={() => navigate("/appointments")}
          className="btn-cancel"
          disabled={submitting}
        >
          Cancel
        </button>
      </form>
    </div>
  );
};

export default ScheduleAppointmentPage;
