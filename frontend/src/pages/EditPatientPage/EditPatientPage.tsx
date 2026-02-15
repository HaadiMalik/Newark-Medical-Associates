import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "../../services/apiService";
import { useAuth } from "../../contexts/AuthContext";
import "./EditPatientPage.css";

interface PatientFormData {
  name: string;
  gender: string;
  dob: string;
  address: string;
  telephone: string;
  ssn: string;
  bloodType: string;
  primaryCarePhysicianId: string | number;
}

interface StaffMemberShort {
  id: number;
  name: string;
  jobType: string;
}

const EditPatientPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // Authentication
  const { user } = useAuth();

  const [formData, setFormData] = useState<PatientFormData>({
    name: "",
    gender: "",
    dob: "",
    address: "",
    telephone: "",
    ssn: "",
    bloodType: "",
    primaryCarePhysicianId: "",
  });

  const [ _physicians , setPhysicians] = useState<StaffMemberShort[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatientAndPhysicians = async () => {
      if (!id) {
        setError("Patient ID is missing.");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const patientRes = await apiClient.get(`/patients/${id}`);
        const patientData = patientRes.data;
        const formattedDob = patientData.dob
          ? new Date(patientData.dob).toISOString().split("T")[0]
          : "";

        setFormData({
          name: patientData.name || "",
          gender: patientData.gender || "",
          dob: formattedDob,
          address: patientData.address || "",
          telephone: patientData.telephone || "",
          ssn: patientData.ssn || "",
          bloodType: patientData.bloodType || "",
          primaryCarePhysicianId:
            patientData.primaryCarePhysicianId?.toString() || "",
        });

        const physiciansRes = await apiClient.get("/staff/type/Doctor");
        setPhysicians(physiciansRes.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientAndPhysicians();
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

    if (!formData.name || !formData.gender || !formData.dob || !formData.ssn) {
      setError("Name, Gender, Date of Birth, and SSN are required.");
      return;
    }

    try {
      const payload = {
        ...formData,
        primaryCarePhysicianId: formData.primaryCarePhysicianId
          ? parseInt(formData.primaryCarePhysicianId as string)
          : null,
      };

      await apiClient.put(`/patients/${id}`, payload);
      setSuccessMessage("Patient details updated successfully!");
      setTimeout(() => navigate(`/patients/${id}`), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update patient.");
      console.error(err);
    }
  };

  if (loading) return <p>Loading patient data for editing...</p>;
  if (error && !formData.name) return <p className="error">{error}</p>;

  return (
    <div className="container">
      <h2>Edit Patient (ID: {id})</h2>
      {error && <p className="error">{error}</p>}
      {successMessage && <p className="success">{successMessage}</p>}
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

        <button className="button" type="submit">
          Update Patient
        </button>
      </form>
      <button
        className="cancel-button"
        onClick={() => navigate(id ? `/patients/${id}` : "/patients")}
      >
        Cancel
      </button>
    </div>
  );
};

export default EditPatientPage;
