import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getPatients } from "../../services/patientService";
import { getStaff } from "../../services/staffService";
import { getRooms } from "../../services/roomService";
import {
  getScheduledSurgeries,
  getScheduledSurgeriesByRoomAndDay,
} from "../../services/surgeryService";
import type { Patient } from "../../types/Patient";
import type { Staff } from "../../types/Staff";
import type { Room } from "../../types/Room";
import type { ScheduledSurgery } from "../../types/Surgery";
import "./ViewScheduledSurgeriesPage.css";

type FilterType = "general" | "roomDay";

const ViewScheduledSurgeriesPage: React.FC = () => {
  const { hasRole } = useAuth();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [surgeons, setSurgeons] = useState<Staff[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  const [filterType, setFilterType] = useState<FilterType>("general");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [selectedSurgeonId, setSelectedSurgeonId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [selectedRoomDayDate, setSelectedRoomDayDate] = useState<string>("");

  const [scheduledSurgeries, setScheduledSurgeries] = useState<
    ScheduledSurgery[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const [patientsData, staffData, roomsData] = await Promise.all([
          getPatients(),
          getStaff(),
          getRooms(),
        ]);
        setPatients(patientsData);
        setSurgeons(staffData.filter((s) => s.jobType === "Surgeon"));
        setRooms(roomsData);
      } catch (err: any) {
        setError(err?.message || "Failed to load data for filters.");
        console.error("Failed to load filter data:", err);
      }
    };
    loadFilterData();
  }, []);

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    setScheduledSurgeries([]);
    try {
      let surgeriesData: ScheduledSurgery[] = [];
      if (filterType === "roomDay") {
        if (!selectedRoomId || !selectedRoomDayDate) {
          setError("Please select a room and a date.");
          setIsLoading(false);
          return;
        }
        surgeriesData = await getScheduledSurgeriesByRoomAndDay(
          selectedRoomId,
          selectedRoomDayDate
        );
      } else {
        const filters: any = {};
        if (selectedPatientId) filters.patientId = selectedPatientId;
        if (selectedSurgeonId) filters.surgeonId = selectedSurgeonId;
        if (selectedDate) filters.date = selectedDate;
        surgeriesData = await getScheduledSurgeries(filters);
      }
      setScheduledSurgeries(surgeriesData);
    } catch (err: any) {
      setError(err?.message || "Failed to retrieve scheduled surgeries.");
      console.error("Failed to search surgeries:", err);
    }
    setIsLoading(false);
  };

  if (!hasRole(["Admin", "Doctor", "Nurse"])) {
    return (
      <p className="errorMessage">
        You do not have permission to view this page.
      </p>
    );
  }

  return (
    <div className="container">
      <h1>View Scheduled Surgeries</h1>

      <div className="filterSection">
        <label>
          <input
            type="radio"
            name="filterType"
            value="general"
            checked={filterType === "general"}
            onChange={() => setFilterType("general")}
          />
          General Filters
        </label>
        <br />
        <label>
          <input
            type="radio"
            name="filterType"
            value="roomDay"
            checked={filterType === "roomDay"}
            onChange={() => setFilterType("roomDay")}
          />
          By Room & Day
        </label>
      </div>

      {filterType === "general" && (
        <div className="filterGroup">
          <label htmlFor="patients">Patient:</label>
          <select
            id="patients"
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
          >
            <option value="">All Patients</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <label htmlFor="surgeons">Surgeon:</label>
          <select
            id="surgeons"
            value={selectedSurgeonId}
            onChange={(e) => setSelectedSurgeonId(e.target.value)}
          >
            <option value="">All Surgeons</option>
            {surgeons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <label htmlFor="date">Date:</label>
          <input
            id="date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      )}

      {filterType === "roomDay" && (
        <div className="filterGroup">
          <label htmlFor="rooms">Room:</label>
          <select
            id="rooms"
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            required
          >
            <option value="">Select Room</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.fullName || `${r.roomNumber}-${r.bedLabel}`}
              </option>
            ))}
          </select>

          <label htmlFor="roomDayDate">Date:</label>
          <input
            id="roomDayDate"
            type="date"
            value={selectedRoomDayDate}
            onChange={(e) => setSelectedRoomDayDate(e.target.value)}
            required
          />
        </div>
      )}

      <br />
      <button
        onClick={handleSearch}
        disabled={isLoading}
        className="searchButton"
      >
        {isLoading ? "Searching..." : "Search Surgeries"}
      </button>

      {error && <p className="errorMessage">{error}</p>}

      <br />
      <br />
      <h2>Results: {scheduledSurgeries.length}</h2>
      {isLoading && <p>Loading results...</p>}
      {scheduledSurgeries.length === 0 && !isLoading && (
        <p>No surgeries found.</p>
      )}

      <ul className="resultsList">
        {scheduledSurgeries.map((surgery) => (
          <li key={surgery.surgeryId} className="resultItem">
            <strong>Surgery ID: {surgery.surgeryId}</strong>
            <br />
            Patient: {surgery.patientName || `ID: ${surgery.patientId}`}
            <br />
            Surgeon: {surgery.surgeonName || `ID: ${surgery.surgeonId}`}
            <br />
            Scheduled: {new Date(surgery.scheduledDateTime).toLocaleString()}
            <br />
            Theatre: {surgery.operationTheatre || "N/A"}
            <br />
            Status: {surgery.status || "N/A"}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ViewScheduledSurgeriesPage;
