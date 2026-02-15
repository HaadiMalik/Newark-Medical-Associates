import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage/HomePage";
import LoginPage from "./pages/LoginPage/LoginPage";
import DashboardPage from "./pages/DashboardPage/DashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";

// Staff Pages
import StaffListPage from "./pages/StaffListPage/StaffListPage";
import StaffDetailsPage from "./pages/StaffDetailsPage/StaffDetailsPage";
import AddStaffPage from "./pages/AddStaffPage/AddStaffPage";
import EditStaffPage from "./pages/EditStaffPage/EditStaffPage";

// Patient Pages
import PatientListPage from "./pages/PatientListPage/PatientListPage";
import AddPatientPage from "./pages/AddPatientPage/AddPatientPage";
import PatientDetailsPage from "./pages/PatientDetailsPage/PatientDetailsPage";
import EditPatientPage from "./pages/EditPatientPage/EditPatientPage";

// In-Patient Pages
import InPatientListPage from "./pages/InPatientListPage/InPatientListPage";
import AdmitPatientPage from "./pages/AdmitPatientPage/AdmitPatientPage";
import InPatientDetailsPage from "./pages/InPatientDetailsPage/InPatientDetailsPage";

// Appointment Pages
import AppointmentListPage from "./pages/AppointmentListPage/AppointmentListPage";
import ScheduleAppointmentPage from "./pages/ScheduleAppointmentPage/ScheduleAppointmentPage";
import AppointmentDetailsPage from "./pages/AppointmentDetailsPage/AppointmentDetailsPage";
import EditAppointmentPage from "./pages/EditAppointmentPage/EditAppointmentPage";

// Import the new Shift Management Page
import ShiftManagementPage from "./pages/ShiftManagementPage/ShiftManagementPage";

// Import the new Book Surgery Page
import BookSurgeryPage from "./pages/BookSurgeryPage/BookSurgeryPage";

// Import the new View Scheduled Surgeries Page
import ViewScheduledSurgeriesPage from "./pages/ViewScheduledSurgeries/ViewScheduledSurgeriesPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Staff Management Routes */}
        <Route
          path="staff"
          element={
            <ProtectedRoute>
              <StaffListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="staff/add"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AddStaffPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="staff/edit/:id"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <EditStaffPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="staff/:id"
          element={
            <ProtectedRoute>
              <StaffDetailsPage />
            </ProtectedRoute>
          }
        />

        {/* Patient Management Routes */}
        <Route
          path="patients"
          element={
            <ProtectedRoute>
              <PatientListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="patients/add"
          element={
            <ProtectedRoute
              allowedRoles={["Admin", "Support", "Doctor", "Nurse"]}
            >
              <AddPatientPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="patients/edit/:id"
          element={
            <ProtectedRoute
              allowedRoles={["Admin", "Support", "Doctor", "Nurse"]}
            >
              <EditPatientPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="patients/:id"
          element={
            <ProtectedRoute>
              <PatientDetailsPage />
            </ProtectedRoute>
          }
        />

        {/* In-Patient Management Routes */}
        <Route
          path="inpatients"
          element={
            <ProtectedRoute
              allowedRoles={["Admin", "Doctor", "Nurse", "Support"]}
            >
              <InPatientListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="inpatients/admit"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Doctor", "Nurse"]}>
              <AdmitPatientPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="inpatients/:recordId"
          element={
            <ProtectedRoute
              allowedRoles={["Admin", "Doctor", "Nurse", "Support"]}
            >
              <InPatientDetailsPage />
            </ProtectedRoute>
          }
        />

        {/* Appointment Management Routes */}
        <Route
          path="appointments"
          element={
            <ProtectedRoute
              allowedRoles={["Admin", "Support", "Doctor", "Nurse"]}
            >
              <AppointmentListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="appointments/schedule"
          element={
            <ProtectedRoute
              allowedRoles={["Admin", "Support", "Doctor", "Nurse"]}
            >
              <ScheduleAppointmentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="appointments/:id"
          element={
            <ProtectedRoute
              allowedRoles={["Admin", "Support", "Doctor", "Nurse"]}
            >
              <AppointmentDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="appointments/edit/:id"
          element={
            <ProtectedRoute
              allowedRoles={["Admin", "Support", "Doctor", "Nurse"]}
            >
              <EditAppointmentPage />
            </ProtectedRoute>
          }
        />

        {/* Shift Management Route */}
        <Route
          path="shifts"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Doctor", "Nurse"]}>
              {" "}
              <ShiftManagementPage />
            </ProtectedRoute>
          }
        />

        {/* Surgery Booking Route */}
        <Route
          path="book-surgery"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Doctor"]}>
              <BookSurgeryPage />
            </ProtectedRoute>
          }
        />

        {/* View Scheduled Surgeries Route */}
        <Route
          path="view-scheduled-surgeries"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Doctor", "Nurse"]}>
              <ViewScheduledSurgeriesPage />
            </ProtectedRoute>
          }
        />

        {/* TODO: Add routes for Rooms, Surgeries etc. */}
      </Route>
    </Routes>
  );
}

export default App;
