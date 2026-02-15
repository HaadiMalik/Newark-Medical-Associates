import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../services/apiService";
import { useAuth } from "../../contexts/AuthContext";
import "./AddPatientPage.css";

interface StaffMemberShort {
  id: number;
  name: string;
  jobType: string;
}

const AddPatientPage: React.FC = () => {
  const navigate = useNavigate();
  // Check authentication status
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    dob: "",
    address: "",
    telephone: "",
    ssn: "",
    bloodType: "",
    primaryCarePhysicianId: "",
  });
  const [physicians, setPhysicians] = useState<StaffMemberShort[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchPhysicians = async () => {
      try {
        const response = await apiClient.get("/staff/type/Doctor");
        setPhysicians(response.data);
      } catch (err) {
        console.error("Failed to fetch physicians", err);
      }
    };
    fetchPhysicians();
  }, []);

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

    if (!formData.name || !formData.gender || !formData.dob || !formData.ssn) {
      setError("Name, Gender, Date of Birth, and SSN are required.");
      return;
    }

    try {
      const payload = {
        ...formData,
        primaryCarePhysicianId: formData.primaryCarePhysicianId
          ? parseInt(formData.primaryCarePhysicianId)
          : undefined,
      };

      const response = await apiClient.post("/patients", payload);
      setSuccessMessage(
        `Patient ${
          response.data.patientId ? "(ID: " + response.data.patientId + ")" : ""
        } added successfully!`
      );

      setFormData({
        name: "",
        gender: "",
        dob: "",
        address: "",
        telephone: "",
        ssn: "",
        bloodType: "",
        primaryCarePhysicianId: "",
      });

    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to add patient. Please try again."
      );
      console.error(err);
    }
  };

  return (
    <div className="container">
      <h2>Register New Patient</h2>
      {error && <p className="errorMessage">{error}</p>}
      {successMessage && <p className="successMessage">{successMessage}</p>}
      <form onSubmit={handleSubmit} className="form">
        <label className="label" htmlFor="name">
          Full Name *
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

        <label className="label" htmlFor="ssn">
          Social Security Number (SSN) *
        </label>
        <input
          className="input"
          type="text"
          name="ssn"
          id="ssn"
          value={formData.ssn}
          onChange={handleChange}
          required
          placeholder="XXX-XX-XXXX"
        />

        <label className="label" htmlFor="dob">
          Date of Birth *
        </label>
        <input
          className="input"
          type="date"
          name="dob"
          id="dob"
          value={formData.dob}
          onChange={handleChange}
          required
        />

        <label className="label" htmlFor="gender">
          Gender *
        </label>
        <select
          className="input"
          name="gender"
          id="gender"
          value={formData.gender}
          onChange={handleChange}
          required
        >
          <option value="">Select Gender...</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </select>

        <label className="label" htmlFor="address">
          Address
        </label>
        <textarea
          className="input textarea"
          name="address"
          id="address"
          value={formData.address}
          onChange={handleChange}
        />

        <label className="label" htmlFor="telephone">
          Telephone
        </label>
        <input
          className="input"
          type="tel"
          name="telephone"
          id="telephone"
          value={formData.telephone}
          onChange={handleChange}
        />

        <label className="label" htmlFor="bloodType">
          Blood Type
        </label>
        <input
          className="input"
          type="text"
          name="bloodType"
          id="bloodType"
          value={formData.bloodType}
          onChange={handleChange}
          placeholder="e.g., A+, O-"
        />

        <label className="label" htmlFor="primaryCarePhysicianId">
          Primary Care Physician
        </label>
        <select
          className="input"
          name="primaryCarePhysicianId"
          id="primaryCarePhysicianId"
          value={formData.primaryCarePhysicianId}
          onChange={handleChange}
        >
          <option value="">None Assigned</option>
          {physicians.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (ID: {p.id})
            </option>
          ))}
        </select>

        <button className="button" type="submit">
          Register Patient
        </button>
      </form>
      <button
        className="button backButton"
        onClick={() => navigate("/patients")}
      >
        Back to Patient List
      </button>
    </div>
  );
};

export default AddPatientPage;
