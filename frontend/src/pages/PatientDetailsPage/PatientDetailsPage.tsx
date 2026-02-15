import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import apiClient, {
  getIllnessesMaster,
  getAllergiesMaster,
} from "../../services/apiService";
import { useAuth } from "../../contexts/AuthContext";

interface PatientFullDetail {
  id: number;
  name: string;
  gender: string;
  dob: string;
  address: string;
  telephone: string;
  ssn: string;
  bloodType?: string;
  primaryCarePhysicianId?: number;
  primaryCarePhysicianName?: string;
}

interface IllnessRecord {
  code: string;
  description: string;
  diagnosedDate: string;
}

interface IllnessMasterItem {
  id: number;
  code: string;
  description: string;
}

interface AllergyRecord {
  code: string;
  name: string;
}

interface AllergyMasterItem {
  id: number;
  code: string;
  name: string;
}

interface MedicalHistory {
  patientId: number;
  illnesses: IllnessRecord[];
  allergies: AllergyRecord[];
}

const PatientDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, hasRole } = useAuth();
  const [patient, setPatient] = useState<PatientFullDetail | null>(null);
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [illnessesMaster, setIllnessesMaster] = useState<IllnessMasterItem[]>(
    []
  );
  const [allergiesMaster, setAllergiesMaster] = useState<AllergyMasterItem[]>(
    []
  );
  const [showAddIllnessForm, setShowAddIllnessForm] = useState<boolean>(false);
  const [newIllnessCode, setNewIllnessCode] = useState<string>("");
  const [newIllnessDate, setNewIllnessDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [addingIllness, setAddingIllness] = useState<boolean>(false);
  const [addIllnessError, setAddIllnessError] = useState<string | null>(null);
  const [showAddAllergyForm, setShowAddAllergyForm] = useState<boolean>(false);
  const [newAllergyCode, setNewAllergyCode] = useState<string>("");
  const [addingAllergy, setAddingAllergy] = useState<boolean>(false);
  const [addAllergyError, setAddAllergyError] = useState<string | null>(null);

  const canManageMedicalHistoryRoles = ["Admin", "Doctor", "Nurse"];

  const fetchPatientData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const patientRes = await apiClient.get(`/patients/${id}`);
      setPatient(patientRes.data);
      await fetchMedicalHistory();
      const illnessesData = await getIllnessesMaster();
      setIllnessesMaster(illnessesData);
      const allergiesData = await getAllergiesMaster();
      setAllergiesMaster(allergiesData);
      setError(null);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to fetch patient data."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicalHistory = async () => {
    if (!id) return;
    try {
      const historyRes = await apiClient.get(`/patients/${id}/medical-history`);
      setMedicalHistory(historyRes.data);
    } catch (err: any) {
      console.error("Failed to fetch medical history", err);
      setError(
        err.response?.data?.message || "Failed to refresh medical history."
      );
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  const handleAddIllnessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newIllnessCode || !newIllnessDate) {
      setAddIllnessError("Please select an illness and a valid date.");
      return;
    }
    setAddingIllness(true);
    setAddIllnessError(null);
    try {
      await apiClient.post(`/patients/${id}/illnesses`, {
        illnessCode: newIllnessCode,
        diagnosedDate: newIllnessDate,
      });
      setShowAddIllnessForm(false);
      setNewIllnessCode("");
      setNewIllnessDate(new Date().toISOString().split("T")[0]);
      await fetchMedicalHistory();
    } catch (err: any) {
      setAddIllnessError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to add illness."
      );
      console.error(err);
    } finally {
      setAddingIllness(false);
    }
  };

  const handleAddAllergySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newAllergyCode) {
      setAddAllergyError("Please select an allergy.");
      return;
    }
    setAddingAllergy(true);
    setAddAllergyError(null);
    try {
      await apiClient.post(`/patients/${id}/allergies`, {
        allergyCode: newAllergyCode,
      });
      setShowAddAllergyForm(false);
      setNewAllergyCode("");
      await fetchMedicalHistory();
    } catch (err: any) {
      setAddAllergyError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to add allergy."
      );
      console.error(err);
    } finally {
      setAddingAllergy(false);
    }
  };

  const displayValue = (value: string | number | undefined | null) =>
    value || "N/A";

  if (loading && !patient) return <p>Loading patient details...</p>;
  if (error && !patient) return <p className="error">{error}</p>;
  if (!patient) return <p>Patient not found.</p>;

  return (
    <div className="patient-details-container">
      <h2>
        Patient Details: {patient.name} (ID: {patient.id})
      </h2>

      <div className="section">
        <h4>Personal Information</h4>
        <p>
          <strong>Name:</strong> {patient.name}
        </p>
        <p>
          <strong>SSN:</strong> XXX-XX-{patient.ssn?.slice(-4)}
        </p>
        <p>
          <strong>Gender:</strong> {displayValue(patient.gender)}
        </p>
        <p>
          <strong>Date of Birth:</strong>{" "}
          {new Date(patient.dob).toLocaleDateString()}
        </p>
        <p>
          <strong>Address:</strong> {displayValue(patient.address)}
        </p>
        <p>
          <strong>Telephone:</strong> {displayValue(patient.telephone)}
        </p>
        <p>
          <strong>Blood Type:</strong> {displayValue(patient.bloodType)}
        </p>
        <p>
          <strong>Primary Care Physician:</strong>{" "}
          {displayValue(patient.primaryCarePhysicianName) ||
            (patient.primaryCarePhysicianId
              ? `ID: ${patient.primaryCarePhysicianId}`
              : "N/A")}
        </p>
      </div>

      <div className="section">
        <h4>Medical History</h4>
        {medicalHistory ? (
          <>
            <h5>Illnesses:</h5>
            {medicalHistory.illnesses.length > 0 ? (
              <ul>
                {medicalHistory.illnesses.map((ill) => (
                  <li key={ill.code}>
                    {ill.description} (Code: {ill.code}) - Diagnosed:{" "}
                    {new Date(ill.diagnosedDate).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No recorded illnesses.</p>
            )}

            {user && hasRole(canManageMedicalHistoryRoles) && (
              <div>
                <button
                  onClick={() => setShowAddIllnessForm(!showAddIllnessForm)}
                >
                  {showAddIllnessForm ? "Cancel Adding Illness" : "Add Illness"}
                </button>
                {showAddIllnessForm && (
                  <form onSubmit={handleAddIllnessSubmit}>
                    <div>
                      <label htmlFor="illnessCode">Illness:</label>
                      <select
                        id="illnessCode"
                        value={newIllnessCode}
                        onChange={(e) => setNewIllnessCode(e.target.value)}
                        required
                      >
                        <option value="">Select Illness</option>
                        {illnessesMaster.map((ill) => (
                          <option key={ill.id} value={ill.code}>
                            {ill.description} ({ill.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="diagnosedDate">Diagnosed Date:</label>
                      <input
                        type="date"
                        id="diagnosedDate"
                        value={newIllnessDate}
                        onChange={(e) => setNewIllnessDate(e.target.value)}
                        required
                      />
                    </div>
                    {addIllnessError && <p>{addIllnessError}</p>}
                    <button type="submit" disabled={addingIllness}>
                      {addingIllness ? "Adding..." : "Confirm Add Illness"}
                    </button>
                  </form>
                )}
              </div>
            )}

            <h5>Allergies:</h5>
            {medicalHistory.allergies.length > 0 ? (
              <ul>
                {medicalHistory.allergies.map((alg) => (
                  <li key={alg.code}>
                    {alg.name} (Code: {alg.code})
                  </li>
                ))}
              </ul>
            ) : (
              <p>No known allergies.</p>
            )}

            {user && hasRole(canManageMedicalHistoryRoles) && (
              <div>
                <button
                  onClick={() => setShowAddAllergyForm(!showAddAllergyForm)}
                >
                  {showAddAllergyForm ? "Cancel Adding Allergy" : "Add Allergy"}
                </button>
                {showAddAllergyForm && (
                  <form onSubmit={handleAddAllergySubmit}>
                    <div>
                      <label htmlFor="allergyCode">Allergy:</label>
                      <select
                        id="allergyCode"
                        value={newAllergyCode}
                        onChange={(e) => setNewAllergyCode(e.target.value)}
                        required
                      >
                        <option value="">Select Allergy</option>
                        {allergiesMaster.map((all) => (
                          <option key={all.id} value={all.code}>
                            {all.name} ({all.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    {addAllergyError && <p>{addAllergyError}</p>}
                    <button type="submit" disabled={addingAllergy}>
                      {addingAllergy ? "Adding..." : "Confirm Add Allergy"}
                    </button>
                  </form>
                )}
              </div>
            )}
          </>
        ) : (
          <p>No medical history available.</p>
        )}
      </div>

      <Link to={`/patients/${id}/edit`}>Edit Patient Details</Link>
    </div>
  );
};

export default PatientDetailsPage;
