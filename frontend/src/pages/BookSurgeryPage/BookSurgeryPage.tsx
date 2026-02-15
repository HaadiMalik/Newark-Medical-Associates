import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getPatients } from "../../services/patientService";
import { getStaff } from "../../services/staffService";
import { getSurgeryTypes, bookSurgery } from "../../services/surgeryService";
import type { Patient } from "../../types/Patient";
import type { Staff } from "../../types/Staff";
import type { SurgeryType, SurgeryBookingData } from "../../types/Surgery";
import "./BookSurgeryPage.css";

const BookSurgeryPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [surgeons, setSurgeons] = useState<Staff[]>([]);
  const [surgeryTypes, setSurgeryTypes] = useState<SurgeryType[]>([]);

  const [patientId, setPatientId] = useState<string>("");
  const [surgeonId, setSurgeonId] = useState<string>("");
  const [surgeryTypeId, setSurgeryTypeId] = useState<string>("");
  const [scheduledDateTime, setScheduledDateTime] = useState<string>("");
  const [operationTheatre, setOperationTheatre] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const loadDropdownData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [patientsData, staffData, surgeryTypesData] = await Promise.all([
          getPatients(),
          getStaff(),
          getSurgeryTypes(),
        ]);
        setPatients(patientsData);
        setSurgeons(staffData.filter((s) => s.jobType === "Surgeon"));
        setSurgeryTypes(surgeryTypesData);
      } catch (err: any) {
        setError("Failed to load data for booking form.");
        console.error(err);
      }
      setIsLoading(false);
    };

    if (hasRole(["Admin", "Doctor"])) {
      loadDropdownData();
    } else {
      setError("You do not have permission to book surgeries.");
      setIsLoading(false);
    }
  }, [hasRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!patientId || !surgeonId || !surgeryTypeId || !scheduledDateTime) {
      setFormError("All required fields must be filled.");
      return;
    }

    const bookingData: SurgeryBookingData = {
      patientId: parseInt(patientId),
      surgeonId: parseInt(surgeonId),
      surgeryTypeId: parseInt(surgeryTypeId),
      scheduledDateTime,
      operationTheatre: operationTheatre || null,
    };

    try {
      const result = await bookSurgery(bookingData);
      alert(result.message || "Surgery booked successfully!");
      navigate("/appointments");
    } catch (err: any) {
      setFormError("Failed to book surgery.");
      console.error(err);
    }
  };

  if (isLoading) return <p>Loading booking information...</p>;
  if (error) return <p className="errorMessage">{error}</p>;
  if (!hasRole(["Admin", "Doctor"]))
    return <p className="errorMessage">Access Denied.</p>;

  return (
    <div className="container">
      <h1>Book New Surgery</h1>
      <form onSubmit={handleSubmit}>
        {formError && <p className="errorMessage">{formError}</p>}
        <div className="inputGroup">
          <label htmlFor="patientId">Patient:</label>
          <select
            id="patientId"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            required
          >
            <option value="">Select Patient</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="inputGroup">
          <label htmlFor="surgeonId">Surgeon:</label>
          <select
            id="surgeonId"
            value={surgeonId}
            onChange={(e) => setSurgeonId(e.target.value)}
            required
          >
            <option value="">Select Surgeon</option>
            {surgeons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="inputGroup">
          <label htmlFor="surgeryTypeId">Surgery Type:</label>
          <select
            id="surgeryTypeId"
            value={surgeryTypeId}
            onChange={(e) => setSurgeryTypeId(e.target.value)}
            required
          >
            <option value="">Select Surgery Type</option>
            {surgeryTypes.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name} ({st.surgeryCode})
              </option>
            ))}
          </select>
        </div>
        <div className="inputGroup">
          <label htmlFor="scheduledDateTime">Scheduled Date & Time:</label>
          <input
            type="datetime-local"
            id="scheduledDateTime"
            value={scheduledDateTime}
            onChange={(e) => setScheduledDateTime(e.target.value)}
            required
          />
        </div>
        <div className="inputGroup">
          <label htmlFor="operationTheatre">
            Operation Theatre (Optional):
          </label>
          <input
            type="text"
            id="operationTheatre"
            value={operationTheatre}
            onChange={(e) => setOperationTheatre(e.target.value)}
          />
        </div>
        <button className="submitButton" type="submit">
          Book Surgery
        </button>
      </form>
    </div>
  );
};

export default BookSurgeryPage;
