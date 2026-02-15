import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getInPatients } from "../../services/apiService";
import { useAuth } from "../../contexts/AuthContext";
import "./InPatientListPage.css";

interface InPatientRecord {
  inPatientRecordId: number;
  patientId: number;
  patientName: string;
  roomId: number;
  nursingUnit?: string;
  wing?: string;
  roomNumber?: string;
  bedLabel?: string;
  roomIdentifier?: string;
  admissionDate: string;
  dischargeDate?: string;
  assignedDoctorName?: string;
  assignedNurseName?: string;
}

const InPatientListPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [inPatients, setInPatients] = useState<InPatientRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const canAdmitRoles = ["Admin", "Doctor", "Nurse"];

  useEffect(() => {
    const fetchInPatients = async () => {
      setLoading(true);
      try {
        const responseData = await getInPatients();
        const formattedData = responseData.map((record: any) => ({
          ...record,
          roomIdentifier:
            record.wing && record.roomNumber && record.bedLabel
              ? `${record.wing} ${record.roomNumber}-${record.bedLabel} (Unit ${
                  record.nursingUnit || "N/A"
                })`
              : `Room ID: ${record.roomId}`,
        }));
        setInPatients(formattedData);
        setError(null);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Failed to fetch in-patient list."
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInPatients();
  }, []);

  if (loading) return <p>Loading in-patients...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="container">
      <h2 className="title">In-Patient Management</h2>

      {user && hasRole(canAdmitRoles) && (
        <Link to="/inpatients/admit" className="button-link">
          Admit New Patient
        </Link>
      )}

      {inPatients.length === 0 && !loading && (
        <p className="error-message">No patients currently admitted.</p>
      )}

      {inPatients.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Patient Name</th>
              <th>Room</th>
              <th>Admission Date</th>
              <th>Attending Doctor</th>
              <th>Attending Nurse</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inPatients.map((record) => (
              <tr key={record.inPatientRecordId}>
                <td>
                  {record.patientName || `Patient ID: ${record.patientId}`}
                </td>
                <td>{record.roomIdentifier || `Room ID: ${record.roomId}`}</td>
                <td>{new Date(record.admissionDate).toLocaleDateString()}</td>
                <td>{record.assignedDoctorName || "N/A"}</td>
                <td>{record.assignedNurseName || "N/A"}</td>
                <td>
                  {record.dischargeDate
                    ? `Discharged: ${new Date(
                        record.dischargeDate
                      ).toLocaleDateString()}`
                    : "Admitted"}
                </td>
                <td>
                  <Link
                    to={`/inpatients/${record.inPatientRecordId}`}
                    className="link"
                  >
                    View Details
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

export default InPatientListPage;
