import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getAppointmentById,
  updateAppointment,
  getAllStaffSimple,
} from "../../services/apiService";
import "./EditAppointmentPage.css";

interface StaffBasicInfo {
  id: number;
  name: string;
  jobType: string;
}

interface AppointmentEditData {
  patientId?: number;
  patientName?: string;
  doctorId: string;
  appointmentDate: string;
  reason: string;
  status: string;
}

const EditAppointmentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState<AppointmentEditData | null>(
    null
  );
  const [doctors, setDoctors] = useState<StaffBasicInfo[]>([]);
  const [originalPatientName, setOriginalPatientName] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const appointmentStatusOptions = [
    "Scheduled",
    "Completed",
    "Cancelled",
    "No Show",
  ];

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError("Appointment ID is missing.");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [apptData, staffRes] = await Promise.all([
          getAppointmentById(id),
          getAllStaffSimple(),
        ]);

        const localDateTime = new Date(apptData.appointmentDate);
        const timezoneOffset = localDateTime.getTimezoneOffset() * 60000;
        const localCorrectedDateTime = new Date(
          localDateTime.getTime() - timezoneOffset
        );
        const formattedDateTime = localCorrectedDateTime
          .toISOString()
          .slice(0, 16);

        setAppointment({
          ...apptData,
          doctorId: apptData.doctorId.toString(),
          appointmentDate: formattedDateTime,
          reason: apptData.reason || "",
        });
        setOriginalPatientName(
          apptData.patientName || `Patient ID: ${apptData.patientId}`
        );

        setDoctors(
          staffRes.filter(
            (s: StaffBasicInfo) =>
              s.jobType === "Doctor" || s.jobType === "Physician"
          )
        );
        setError(null);
      } catch (err: any) {
        setError(
          err.response?.data?.message || `Failed to load appointment ${id}.`
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    if (!appointment) return;
    setAppointment({ ...appointment, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !appointment) {
      setError("Appointment data is missing.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await updateAppointment(id, {
        ...appointment,
        doctorId: parseInt(appointment.doctorId),
        appointmentDate: new Date(appointment.appointmentDate).toISOString(),
      });
      navigate(`/appointments/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update appointment.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading appointment data...</p>;
  if (error && !appointment) return <p className="errorMessage">{error}</p>;
  if (!appointment) return <p>Appointment data not available.</p>;

  return (
    <div className="container">
      <h2>Edit Appointment for {originalPatientName}</h2>
      <p className="note">(Patient cannot be changed from this form)</p>
      <form onSubmit={handleSubmit}>
        <div className="formGroup">
          <label htmlFor="doctorId">Doctor:</label>
          <select
            id="doctorId"
            name="doctorId"
            value={appointment.doctorId}
            onChange={handleChange}
            required
          >
            <option value="">Select Doctor</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="formGroup">
          <label htmlFor="appointmentDate">Appointment Date & Time:</label>
          <input
            id="appointmentDate"
            type="datetime-local"
            name="appointmentDate"
            value={appointment.appointmentDate}
            onChange={handleChange}
            required
          />
        </div>

        <div className="formGroup">
          <label htmlFor="reason">Reason:</label>
          <textarea
            id="reason"
            name="reason"
            value={appointment.reason}
            onChange={handleChange}
            rows={3}
          />
        </div>

        <div className="formGroup">
          <label htmlFor="status">Status:</label>
          <select
            id="status"
            name="status"
            value={appointment.status}
            onChange={handleChange}
            required
          >
            {appointmentStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {error && !submitting && <p className="errorMessage">{error}</p>}

        <button type="submit" disabled={submitting} className="submitButton">
          {submitting ? "Updating..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => navigate(id ? `/appointments/${id}` : "/appointments")}
          className="cancelButton"
          disabled={submitting}
        >
          Cancel
        </button>
      </form>
    </div>
  );
};

export default EditAppointmentPage;
