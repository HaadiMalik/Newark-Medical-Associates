import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAppointments } from "../../services/apiService";
import { useAuth } from "../../contexts/AuthContext";
import "./AppointmentListPage.css";

interface AppointmentRecord {
  id: number;
  patientId: number;
  patientName?: string;
  doctorId: number;
  doctorName?: string;
  appointmentDate: string;
  reason?: string;
  status: string;
}

const AppointmentListPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const canManageAppointmentsRoles = ["Admin", "Support", "Doctor", "Nurse"];

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const response = await getAppointments();
        setAppointments(response || []);
        setError(null);
      } catch (err: any) {
        setError(
          err?.response?.data?.message || "Failed to fetch appointments."
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  if (loading) return <p>Loading appointments...</p>;
  if (error) return <p className="errorMessage">{error}</p>;

  return (
    <div className="container">
      <h2>Appointment Management</h2>
      {user && hasRole(canManageAppointmentsRoles) && (
        <Link to="/appointments/schedule" className="scheduleButton">
          Schedule New Appointment
        </Link>
      )}

      {appointments.length === 0 && !loading && (
        <p className="noAppointments">No appointments found.</p>
      )}

      {appointments.length > 0 && (
        <table className="appointmentTable">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Date & Time</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt) => (
              <tr key={appt.id}>
                <td>{appt.patientName || `Patient ID: ${appt.patientId}`}</td>
                <td>{appt.doctorName || `Doctor ID: ${appt.doctorId}`}</td>
                <td>{new Date(appt.appointmentDate).toLocaleString()}</td>
                <td>{appt.reason || "N/A"}</td>
                <td
                  className={
                    appt.status === "Cancelled"
                      ? "statusCancelled"
                      : "statusActive"
                  }
                >
                  {appt.status}
                </td>
                <td>
                  <Link to={`/appointments/${appt.id}`} className="actionLink">
                    View/Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AppointmentListPage;
