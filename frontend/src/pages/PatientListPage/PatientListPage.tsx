import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../services/apiService";
import { useAuth } from "../../contexts/AuthContext";
import "./PatientListPage.css";

interface Patient {
  id: number;
  name: string;
  dob: string;
  ssn: string;
  primaryCarePhysicianId?: number;
}

const PatientListPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user, hasRole } = useAuth();

  const canModifyPatientRoles = ["Admin", "Support", "Doctor", "Nurse"];

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/patients");
        const sortedPatients = response.data.sort(
          (a: Patient, b: Patient) => a.id - b.id
        );
        setPatients(sortedPatients);
        setError(null);
      } catch (err) {
        setError("Failed to fetch patients. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  if (loading) return <p>Loading patients...</p>;
  if (error) return <p className="errorMessage">{error}</p>;

  return (
    <div className="container">
      <h2 className="heading">Patient Management</h2>
      {user && hasRole(canModifyPatientRoles) && (
        <Link to="/patients/add" className="registerButton">
          Register New Patient
        </Link>
      )}
      {patients.length === 0 ? (
        <p>No patients found.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th className="tableHeader">ID</th>
              <th className="tableHeader">Name</th>
              <th className="tableHeader">Date of Birth</th>
              <th className="tableHeader">SSN (Partial)</th>
              <th className="tableHeader">Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.id}>
                <td className="tableCell">{patient.id}</td>
                <td className="tableCell">{patient.name}</td>
                <td className="tableCell">
                  {new Date(patient.dob).toLocaleDateString()}
                </td>
                <td className="tableCell">XXX-XX-{patient.ssn?.slice(-4)}</td>
                <td className="tableCell">
                  <Link to={`/patients/${patient.id}`}>View Details</Link>
                  {user && hasRole(canModifyPatientRoles) && (
                    <Link
                      to={`/patients/edit/${patient.id}`}
                      style={{ marginLeft: "10px" }}
                    >
                      Edit
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PatientListPage;
