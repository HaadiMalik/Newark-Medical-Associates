import React, { useState, useEffect } from "react";
import { getShifts, addShift } from "../../services/shiftService";
import { getStaff } from "../../services/staffService";
import type { Shift } from "../../types/Shift";
import type { Staff } from "../../types/Staff";
import { useAuth } from "../../contexts/AuthContext";
import "./ShiftManagementPage.css";

const ShiftManagementPage: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const [newShiftStaffId, setNewShiftStaffId] = useState<string>("");
  const [newShiftDate, setNewShiftDate] = useState<string>("");
  const [newShiftStartTime, setNewShiftStartTime] = useState<string>("");
  const [newShiftEndTime, setNewShiftEndTime] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [shiftsData, staffData] = await Promise.all([
          getShifts(),
          getStaff(),
        ]);
        setShifts(shiftsData);
        setStaffList(staffData);
      } catch (err: any) {
        setError(err.message || "Failed to load shift data.");
        console.error("Error loading shift data:", err);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newShiftStaffId ||
      !newShiftDate ||
      !newShiftStartTime ||
      !newShiftEndTime
    ) {
      alert("Please fill in all fields for the shift.");
      return;
    }
    try {
      const newShiftData = {
        staffId: parseInt(newShiftStaffId),
        shiftDate: newShiftDate,
        startTime: newShiftStartTime,
        endTime: newShiftEndTime,
      };
      const createdShiftResponse = await addShift(newShiftData);
      const updatedShifts = await getShifts();
      setShifts(updatedShifts);
      alert(createdShiftResponse.message);
      setNewShiftStaffId("");
      setNewShiftDate("");
      setNewShiftStartTime("");
      setNewShiftEndTime("");
    } catch (err: any) {
      setError(err.message || "Failed to add shift.");
      console.error("Error adding shift:", err);
      alert("Error: " + (err.message || "Failed to add shift."));
    }
  };

  if (isLoading) {
    return <div>Loading shifts...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="container">
      <h1>Shift Management</h1>

      {user?.role === "Admin" && (
        <form onSubmit={handleAddShift} className="form">
          <h3>Add New Shift</h3>
          <div>
            <label htmlFor="staffId">Staff Member: </label>
            <select
              id="staffId"
              value={newShiftStaffId}
              onChange={(e) => setNewShiftStaffId(e.target.value)}
              required
            >
              <option value="">Select Staff</option>
              {staffList.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name} ({staff.jobType})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="shiftDate">Date: </label>
            <input
              type="date"
              id="shiftDate"
              value={newShiftDate}
              onChange={(e) => setNewShiftDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="startTime">Start Time: </label>
            <input
              type="time"
              id="startTime"
              value={newShiftStartTime}
              onChange={(e) => setNewShiftStartTime(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="endTime">End Time: </label>
            <input
              type="time"
              id="endTime"
              value={newShiftEndTime}
              onChange={(e) => setNewShiftEndTime(e.target.value)}
              required
            />
          </div>
          <button type="submit">Add Shift</button>
        </form>
      )}

      <h2>Scheduled Shifts</h2>
      {shifts.length === 0 ? (
        <p>No shifts scheduled.</p>
      ) : (
        <ul className="shift-list">
          {shifts.map((shift) => (
            <li key={shift.id} className="shift-item">
              <strong>{shift.staffName || `Staff ID: ${shift.staffId}`}</strong>{" "}
              - {shift.shiftDate}
              <br />
              {shift.startTime} - {shift.endTime}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ShiftManagementPage;
