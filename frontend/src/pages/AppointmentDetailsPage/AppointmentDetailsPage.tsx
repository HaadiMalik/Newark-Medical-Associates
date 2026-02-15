import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  getAppointmentById,
  updateAppointmentStatus,
} from "../../services/apiService";
import { useAuth } from "../../contexts/AuthContext";
import "./AppointmentDetailsPage.css";

interface AppointmentDetailRecord {
  id: number;
  patientId: number;
  patientName?: string;
  doctorId: number;
  doctorName?: string;
  appointmentDate: string;
  reason?: string;
  status: string;
}

const AppointmentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, hasRole } = useAuth();
  // Navigate routes between pages
  const navigate = useNavigate();

  const [appointment, setAppointment] =
    useState<AppointmentDetailRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  const canManageRoles = ["Admin", "Support", "Doctor", "Nurse"];
  const canCancelRoles = ["Admin", "Support", "Doctor"];

  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await getAppointmentById(id);
        setAppointment(data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch appointment.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointmentDetails();
  }, [id]);

  const handleCancelAppointment = async () => {
    if (!id || !appointment) return;
    if (!window.confirm("Are you sure you want to cancel this appointment?"))
      return;

    setIsCancelling(true);
    setActionError(null);
    try {
      await updateAppointmentStatus(id, "Cancelled");
      setAppointment((prev) =>
        prev ? { ...prev, status: "Cancelled" } : null
      );
    } catch (err: any) {
      setActionError(
        err.response?.data?.message || "Failed to cancel appointment."
      );
      console.error(err);
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) return <p>Loading appointment details...</p>;
  if (error) return <p className="errorMessage">{error}</p>;
  if (!appointment) return <p>Appointment not found.</p>;

  const isActionable = appointment.status === "Scheduled";

  return (
    <div className="container">
      <h3>Appointment Details (ID: {appointment.id})</h3>
      <div className="detailsBox">
        <p>
          <strong>Patient:</strong>{" "}
          {appointment.patientName || `ID: ${appointment.patientId}`}
        </p>
        <p>
          <strong>Doctor:</strong>{" "}
          {appointment.doctorName || `ID: ${appointment.doctorId}`}
        </p>
        <p>
          <strong>Date & Time:</strong>{" "}
          {new Date(appointment.appointmentDate).toLocaleString()}
        </p>
        <p>
          <strong>Reason:</strong> {appointment.reason || "N/A"}
        </p>
        <p>
          <strong>Status:</strong>{" "}
          <span
            className={
              appointment.status === "Cancelled"
                ? "statusCancelled"
                : "statusActive"
            }
          >
            {appointment.status}
          </span>
        </p>
      </div>

      {actionError && <p className="errorMessage">{actionError}</p>}

      <div className="actions">
        {user && hasRole(canManageRoles) && isActionable && (
          <Link
            to={`/appointments/edit/${appointment.id}`}
            className="editButton"
          >
            Edit Appointment
          </Link>
        )}
        {user && hasRole(canCancelRoles) && isActionable && (
          <button
            onClick={handleCancelAppointment}
            disabled={isCancelling}
            className="cancelButton"
          >
            {isCancelling ? "Cancelling..." : "Cancel Appointment"}
          </button>
        )}
        <Link to="/appointments" className="backButton">
          Back to List
        </Link>
      </div>
    </div>
  );
};

export default AppointmentDetailsPage;
