import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import apiClient from "../../services/apiService";
import { useAuth } from "../../contexts/AuthContext";
import "./StaffDetailsPage.css";

interface StaffDetail {
  id: number;
  name: string;
  gender?: string;
  dob?: string;
  address?: string;
  telephone: string;
  email: string;
  jobType: string;
  department: string;
  hireDate?: string;
  salary?: number;
  User?: {
    username: string;
    role: string;
  };
}

const StaffDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [staffMember, setStaffMember] = useState<StaffDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const { user, hasRole } = useAuth();

  useEffect(() => {
    const fetchStaffDetail = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await apiClient.get(`/staff/${id}`);
        setStaffMember(response.data);
        setError(null);
      } catch (err) {
        setError(
          "Failed to fetch staff details. Please ensure the ID is correct and try again."
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStaffDetail();
  }, [id]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    if (window.confirm("Are you sure you want to delete this staff member?")) {
      try {
        setActionMessage(null);
        setError(null);
        await apiClient.delete(`/staff/${id}`);
        alert("Staff member deleted successfully.");
        navigate("/staff");
      } catch (err: any) {
        setActionMessage(null);
        const errMsg =
          err.response?.data?.error || "Failed to delete staff member.";
        setError(errMsg);
        alert(`Error: ${errMsg}`);
        console.error(err);
      }
    }
  }, [id, navigate]);

  if (loading) return <p>Loading staff details...</p>;
  if (error && !staffMember) return <p className="error">{error}</p>;
  if (!staffMember) return <p>Staff member not found.</p>;

  const displayValue = (value: string | number | undefined) =>
    value != null ? value : "N/A";

  return (
    <div className="staff-details-container">
      <h2>Staff Details - {staffMember.name}</h2>
      {error && <p className="error">Error performing action: {error}</p>}
      {actionMessage && <p className="success">{actionMessage}</p>}

      <div className="detail-section">
        <p>
          <strong>ID:</strong> {staffMember.id}
        </p>
        <p>
          <strong>Name:</strong> {staffMember.name}
        </p>
        <p>
          <strong>Gender:</strong> {displayValue(staffMember.gender)}
        </p>
        <p>
          <strong>Date of Birth:</strong>{" "}
          {displayValue(
            staffMember.dob
              ? new Date(staffMember.dob).toLocaleDateString()
              : undefined
          )}
        </p>
        <p>
          <strong>Address:</strong> {displayValue(staffMember.address)}
        </p>
        <p>
          <strong>Telephone:</strong> {staffMember.telephone}
        </p>
        <p>
          <strong>Email:</strong> {staffMember.email}
        </p>
      </div>

      <div className="detail-section">
        <h4>Professional Information</h4>
        <p>
          <strong>Job Type:</strong> {staffMember.jobType}
        </p>
        <p>
          <strong>Department:</strong> {staffMember.department}
        </p>
        <p>
          <strong>Hire Date:</strong>{" "}
          {displayValue(
            staffMember.hireDate
              ? new Date(staffMember.hireDate).toLocaleDateString()
              : undefined
          )}
        </p>
        <p>
          <strong>Salary:</strong>{" "}
          {displayValue(
            staffMember.salary
              ? `$${staffMember.salary.toLocaleString()}`
              : undefined
          )}
        </p>
      </div>

      {staffMember.User && (
        <div className="detail-section">
          <h4>Login Information</h4>
          <p>
            <strong>Username:</strong> {staffMember.User.username}
          </p>
          <p>
            <strong>Role:</strong> {staffMember.User.role}
          </p>
        </div>
      )}

      {user && hasRole(["Admin"]) && (
        <div className="action-buttons">
          <Link to={`/staff/edit/${staffMember.id}`} className="btn edit-btn">
            Edit Staff
          </Link>
          <button onClick={handleDelete} className="btn delete-btn">
            Delete Staff
          </button>
        </div>
      )}

      <Link to="/staff" className="back-link">
        Back to Staff List
      </Link>
    </div>
  );
};

export default StaffDetailsPage;
