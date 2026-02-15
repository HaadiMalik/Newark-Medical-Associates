import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "../../services/apiService";
import "./EditStaffPage.css";

interface StaffFormData {
  name: string;
  gender: string;
  dob: string;
  address: string;
  telephone: string;
  email: string;
  jobType: string;
  department: string;
  hireDate: string;
  salary: string | number;
}

const EditStaffPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<StaffFormData>({
    name: "",
    gender: "",
    dob: "",
    address: "",
    telephone: "",
    email: "",
    jobType: "Doctor",
    department: "",
    hireDate: "",
    salary: "",
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchStaffData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await apiClient.get(`/staff/${id}`);
        const staffData = response.data;
        setFormData({
          name: staffData.name || "",
          gender: staffData.gender || "",
          dob: staffData.dob
            ? new Date(staffData.dob).toISOString().split("T")[0]
            : "",
          address: staffData.address || "",
          telephone: staffData.telephone || "",
          email: staffData.email || "",
          jobType: staffData.jobType || "Doctor",
          department: staffData.department || "",
          hireDate: staffData.hireDate
            ? new Date(staffData.hireDate).toISOString().split("T")[0]
            : "",
          salary: staffData.salary || "",
        });
        setError(null);
      } catch {
        setError("Failed to fetch staff data.");
      } finally {
        setLoading(false);
      }
    };
    fetchStaffData();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (
      !formData.name ||
      !formData.email ||
      !formData.jobType ||
      !formData.department
    ) {
      setError("Name, Email, Job Type, and Department are required.");
      return;
    }

    try {
      await apiClient.put(`/staff/${id}`, {
        ...formData,
        salary: formData.salary
          ? parseFloat(formData.salary as string)
          : undefined,
      });
      setSuccessMessage("Staff member updated successfully!");
      setTimeout(() => navigate(`/staff/${id}`), 1500);
    } catch {
      setError("Failed to update staff member.");
    }
  };

  if (loading) return <p>Loading staff data...</p>;

  return (
    <div className="container">
      <h2>Edit Staff Member (ID: {id})</h2>
      {error && <p className="error">{error}</p>}
      {successMessage && <p className="success">{successMessage}</p>}
      <form onSubmit={handleSubmit} className="form">
        <label className="label" htmlFor="name">
          Name *
        </label>
        <input
          className="input"
          type="text"
          name="name"
          id="name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <label className="label" htmlFor="email">
          Email *
        </label>
        <input
          className="input"
          type="email"
          name="email"
          id="email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <label className="label" htmlFor="jobType">
          Job Type *
        </label>
        <select
          className="input"
          name="jobType"
          id="jobType"
          value={formData.jobType}
          onChange={handleChange}
          required
        >
          {[
            "Doctor",
            "Nurse",
            "Support",
            "Admin",
            "Surgeon",
            "Technician",
            "Pharmacist",
          ].map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <button className="button" type="submit">
          Update Staff Member
        </button>
      </form>
      <button
        className="cancel-button"
        onClick={() => navigate(id ? `/staff/${id}` : "/staff")}
      >
        Cancel
      </button>
    </div>
  );
};

export default EditStaffPage;
