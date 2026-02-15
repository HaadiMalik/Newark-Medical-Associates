import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  getInPatientDetails as getInPatientById,
  dischargePatient,
  assignStaffToInPatient,
  removeStaffFromInPatient,
} from "../../services/inPatientService";
import { getStaff } from "../../services/staffService";
import { useAuth } from "../../contexts/AuthContext";
import type {
  InPatient as InPatientDetailRecord,
  StaffAssignmentData,
} from "../../types/InPatient";
import type { Staff } from "../../types/Staff";
import "./InPatientDetailsPage.css";

const InPatientDetailsPage: React.FC = () => {
  const { recordId } = useParams<{ recordId: string }>();
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  const [record, setRecord] = useState<InPatientDetailRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [_allStaff, setAllStaff] = useState<Staff[]>([]);
  const [availableDoctors, setAvailableDoctors] = useState<Staff[]>([]);
  const [availableNurses, setAvailableNurses] = useState<Staff[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [selectedNurseId, setSelectedNurseId] = useState<string>("");
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [showDischargeModal, setShowDischargeModal] = useState<boolean>(false);
  const [dischargeDate, setDischargeDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [discharging, setDischarging] = useState<boolean>(false);
  const [dischargeError, setDischargeError] = useState<string | null>(null);

  const canModifyAssignmentsRoles = ["Admin", "Doctor", "Nurse"];
  const canDischargeRoles = ["Admin", "Doctor"];

  const fetchPageData = async () => {
    if (!recordId) return;
    setLoading(true);
    setError(null);
    setAssignmentError(null);
    try {
      const [inPatientData, staffData] = await Promise.all([
        getInPatientById(recordId),
        getStaff(),
      ]);
      setRecord({ ...inPatientData });
      setAllStaff(staffData);
      setAvailableDoctors(
        staffData.filter(
          (s: Staff) =>
            s.jobType === "Doctor" ||
            s.jobType === "Physician" ||
            s.jobType === "Surgeon"
        )
      );
      setAvailableNurses(staffData.filter((s: Staff) => s.jobType === "Nurse"));
      if (inPatientData.dischargeDate) {
        setDischargeDate(
          new Date(inPatientData.dischargeDate).toISOString().split("T")[0]
        );
      }
      setSelectedDoctorId(inPatientData.assignedDoctorId?.toString() || "");
      setSelectedNurseId(inPatientData.assignedNurseId?.toString() || "");
    } catch (err: any) {
      setError(
        err.message || `Failed to fetch data for in-patient record ${recordId}.`
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPageData();
  }, [recordId]);

  const handleDischargeSubmit = async () => {
    if (!recordId || !dischargeDate) {
      setDischargeError("Discharge date is required.");
      return;
    }
    setDischarging(true);
    setDischargeError(null);
    try {
      await dischargePatient(recordId, dischargeDate);
      setShowDischargeModal(false);
      await fetchPageData();
    } catch (err: any) {
      setDischargeError(err.message || "Failed to discharge patient.");
      console.error(err);
    } finally {
      setDischarging(false);
    }
  };

  const handleStaffAssignment = async (
    staffId: string,
    staffType: "Doctor" | "Nurse"
  ) => {
    if (!recordId || !staffId) {
      setAssignmentError(`Please select a ${staffType}.`);
      return;
    }
    setAssignmentError(null);
    try {
      const assignmentData: StaffAssignmentData = {
        staffId: parseInt(staffId),
        staffType,
      };
      await assignStaffToInPatient(recordId, assignmentData);
      alert(`${staffType} assigned successfully.`);
      fetchPageData();
    } catch (err: any) {
      setAssignmentError(err.message || `Failed to assign ${staffType}.`);
      console.error(err);
      alert(`Error: ${err.message || `Failed to assign ${staffType}.`}`);
    }
  };

  const handleStaffRemoval = async (staffType: "Doctor" | "Nurse") => {
    if (!recordId) return;
    if (
      !window.confirm(
        `Are you sure you want to remove the assigned ${staffType}?`
      )
    )
      return;
    setAssignmentError(null);
    try {
      await removeStaffFromInPatient(recordId, staffType);
      alert(`${staffType} assignment removed.`);
      fetchPageData();
    } catch (err: any) {
      setAssignmentError(err.message || `Failed to remove ${staffType}.`);
      console.error(err);
      alert(`Error: ${err.message || `Failed to remove ${staffType}.`}`);
    }
  };

  const displayValue = (value: string | number | undefined | null) =>
    value || "N/A";

  if (loading) return <p>Loading in-patient details...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!record) return <p>In-patient record not found.</p>;

  const isDischarged = !!record.dischargeDate;

  const roomIdentifier =
    record.wing && record.roomNumber && record.bedLabel
      ? `${record.wing} ${record.roomNumber}-${record.bedLabel} (Unit ${
          record.nursingUnit || "N/A"
        })`
      : record.roomId
      ? `Room ID: ${record.roomId}`
      : "N/A";

  return (
    <div className="container">
      <h3>In-Patient Record ID: {record.inPatientRecordId}</h3>
      <div className="section">
        <p>
          <strong>Patient:</strong>{" "}
          {record.patientName || `ID: ${record.patientId}`} (
          <Link to={`/patients/${record.patientId}`} className="link">
            View Patient Details
          </Link>
          )
        </p>
        <p>
          <strong>Room:</strong> {roomIdentifier}
        </p>
        <p>
          <strong>Admission Date:</strong>{" "}
          {new Date(record.admissionDate).toLocaleDateString()}
        </p>
        <p>
          <strong>Discharge Date:</strong>{" "}
          {record.dischargeDate
            ? new Date(record.dischargeDate).toLocaleDateString()
            : isDischarged
            ? "Discharged (Date N/A)"
            : "Currently Admitted"}
        </p>

        <div>
          <strong>Attending Doctor: </strong>
          {record.assignedDoctorName ||
            (record.assignedDoctorId
              ? `ID: ${record.assignedDoctorId}`
              : "N/A")}
          {user &&
            hasRole(canModifyAssignmentsRoles) &&
            !isDischarged &&
            record.assignedDoctorId && (
              <button
                onClick={() => handleStaffRemoval("Doctor")}
                className="button warning"
              >
                Remove Doctor
              </button>
            )}
        </div>
        {user &&
          hasRole(canModifyAssignmentsRoles) &&
          !isDischarged &&
          !record.assignedDoctorId && (
            <div className="selectGroup">
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="select"
              >
                <option value="">Select Doctor</option>
                {availableDoctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() =>
                  handleStaffAssignment(selectedDoctorId, "Doctor")
                }
                disabled={!selectedDoctorId}
                className="button primary"
              >
                Assign Doctor
              </button>
            </div>
          )}

        <div>
          <strong>Attending Nurse: </strong>
          {record.assignedNurseName ||
            (record.assignedNurseId ? `ID: ${record.assignedNurseId}` : "N/A")}
          {user &&
            hasRole(canModifyAssignmentsRoles) &&
            !isDischarged &&
            record.assignedNurseId && (
              <button
                onClick={() => handleStaffRemoval("Nurse")}
                className="button warning"
              >
                Remove Nurse
              </button>
            )}
        </div>
        {user &&
          hasRole(canModifyAssignmentsRoles) &&
          !isDischarged &&
          !record.assignedNurseId && (
            <div className="selectGroup">
              <select
                value={selectedNurseId}
                onChange={(e) => setSelectedNurseId(e.target.value)}
                className="select"
              >
                <option value="">Select Nurse</option>
                {availableNurses.map((nurse) => (
                  <option key={nurse.id} value={nurse.id}>
                    {nurse.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => handleStaffAssignment(selectedNurseId, "Nurse")}
                disabled={!selectedNurseId}
                className="button primary"
              >
                Assign Nurse
              </button>
            </div>
          )}
        {assignmentError && <p className="error">{assignmentError}</p>}
      </div>
      {user && hasRole(canDischargeRoles) && !isDischarged && (
        <>
          <button
            onClick={() => setShowDischargeModal(true)}
            className="button danger"
          >
            Discharge Patient
          </button>
          {showDischargeModal && (
            <div className="modal">
              <h4>Confirm Discharge</h4>
              <p>Are you sure you want to discharge this patient?</p>
              <input
                type="date"
                value={dischargeDate}
                onChange={(e) => setDischargeDate(e.target.value)}
                className="input"
              />
              {dischargeError && <p className="error">{dischargeError}</p>}
              <button
                onClick={handleDischargeSubmit}
                disabled={discharging}
                className="button primary"
              >
                Confirm Discharge
              </button>
              <button
                onClick={() => setShowDischargeModal(false)}
                className="button secondary"
              >
                Cancel
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InPatientDetailsPage;
