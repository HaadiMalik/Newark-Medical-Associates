import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { getStaff, deleteStaff } from "../../services/staffService";
import { AuthContext } from "../../contexts/AuthContext";
import "./StaffListPage.css";

const JOB_TYPES = ["All", "Doctor", "Nurse", "Surgeon", "SupportStaff"];

const StaffListPage: React.FC = () => {
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [jobTypeFilter, setJobTypeFilter] = useState<string>("All");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const authContextValue = useContext(AuthContext);

  useEffect(() => {
    const fetchStaffMembers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getStaff();
        setStaffMembers(data);
      } catch (err) {
        setError("Failed to fetch staff members. Please try again later.");
        console.error("Error fetching staff:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaffMembers();
  }, []);

  const handleDelete = async (staffId: number, staffName: string) => {
    if (window.confirm(`Are you sure you want to delete ${staffName}?`)) {
      try {
        await deleteStaff(staffId);
        setStaffMembers(staffMembers.filter((staff) => staff.id !== staffId));
        alert("Staff member deleted successfully.");
      } catch (err: any) {
        setError(
          err.message || "Failed to delete staff member. Please try again."
        );
        console.error("Error deleting staff:", err);
      }
    }
  };

  if (isLoading) {
    return <div>Loading staff members...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const filteredStaffMembers = staffMembers.filter(
    (staff) => jobTypeFilter === "All" || staff.jobType === jobTypeFilter
  );

  return (
    <div className="container">
      <h1 className="header">Staff Directory</h1>
      <div className="controlsContainer">
        {authContextValue?.user?.role === "Admin" && (
          <Link to="/staff/add" className="addButton">
            Add New Staff Member
          </Link>
        )}
        <div className="filterContainer">
          <label htmlFor="jobTypeFilter" className="filterLabel">
            Filter by Job Type:{" "}
          </label>
          <select
            id="jobTypeFilter"
            value={jobTypeFilter}
            onChange={(e) => setJobTypeFilter(e.target.value)}
            className="filterSelect"
          >
            {JOB_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredStaffMembers.length === 0 ? (
        <p className="noStaffMessage">
          No staff members found
          {jobTypeFilter !== "All" ? ` with job type: ${jobTypeFilter}` : ""}.
        </p>
      ) : (
        <ul className="staffList">
          {filteredStaffMembers.map((staff) => (
            <li key={staff.id} className="staffItem">
              <Link to={`/staff/${staff.id}`} className="staffLink">
                <div className="staffInfoContainer">
                  <h2 className="staffName">{staff.name}</h2>
                  <p className="staffJobType">{staff.jobType}</p>
                  {staff.email && (
                    <p className="staffDetail">Email: {staff.email}</p>
                  )}
                </div>
              </Link>
              {authContextValue?.user?.role === "Admin" && (
                <button
                  onClick={() => handleDelete(staff.id, staff.name)}
                  className="deleteButton"
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default StaffListPage;
