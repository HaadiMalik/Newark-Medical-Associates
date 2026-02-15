import axios from 'axios';

const API_URL = 'http://localhost:3001/api'; // Your backend API URL

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('nma_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Illnesses
export const getIllnessesMaster = async () => {
  const response = await apiClient.get('/illnesses/master');
  return response.data;
};

// Allergies
export const getAllergiesMaster = async () => {
  const response = await apiClient.get('/allergies/master');
  return response.data;
};

// Patient (Simplified for dropdowns)
export const getAllPatientsSimple = async () => {
  // Assuming the backend /api/patients can handle a query param or returns enough data by default
  // Or, if there's a dedicated endpoint e.g., /api/patients/simple-list
  const response = await apiClient.get('/patients');
  return response.data.map((p: { id: number; name: string; }) => ({ id: p.id, name: p.name }));
};

// Rooms
export const getAvailableRooms = async () => {
  const response = await apiClient.get('/rooms/available');
  return response.data;
};

// Staff (Simplified for dropdowns)
export const getAllStaffSimple = async () => {
  // Assuming /api/staff returns at least id, name, jobType
  const response = await apiClient.get('/staff');
  return response.data.map((s: { id: number; name: string; jobType: string }) => ({ id: s.id, name: s.name, jobType: s.jobType }));
};

// In-Patients
export const getInPatients = async () => {
  // This endpoint on the backend needs to return enriched data (patientName, roomIdentifier, staff names)
  const response = await apiClient.get('/inpatients');
  return response.data;
};

export const getInPatientById = async (recordId: string) => {
  // This endpoint on the backend needs to return enriched data
  const response = await apiClient.get(`/inpatients/${recordId}`);
  return response.data;
};

interface AdmitPatientPayload {
  patientId: number;
  roomId: number;
  admissionDate: string;
  assignedDoctorId?: number | null;
  assignedNurseId?: number | null;
}

export const admitPatient = async (payload: AdmitPatientPayload) => {
  const response = await apiClient.post('/inpatients/admit', payload);
  return response.data;
};

interface DischargePatientPayload {
  dischargeDate: string;
}

export const dischargePatient = async (recordId: string, payload: DischargePatientPayload) => {
  const response = await apiClient.put(`/inpatients/${recordId}/discharge`, payload);
  return response.data;
};

// Appointments
export const getAppointments = async (/* TODO: Add filter params if needed */) => {
  // Backend /api/appointments should return enriched data (patientName, doctorName)
  const response = await apiClient.get('/appointments');
  return response.data;
};

export const getAppointmentById = async (appointmentId: string) => {
  // Backend /api/appointments/:id should return enriched data
  const response = await apiClient.get(`/appointments/${appointmentId}`);
  return response.data;
};

interface ScheduleAppointmentPayload {
  patientId: number;
  doctorId: number;
  appointmentDate: string; // ISO string
  reason?: string;
  // status will default to 'Scheduled' on backend typically
}
export const scheduleAppointment = async (payload: ScheduleAppointmentPayload) => {
  const response = await apiClient.post('/appointments', payload);
  return response.data;
};

interface UpdateAppointmentPayload {
  // Define fields that can be updated. PatientId is usually not updatable.
  doctorId: number;
  appointmentDate: string; // ISO string
  reason?: string;
  status: string;
}
export const updateAppointment = async (appointmentId: string, payload: UpdateAppointmentPayload) => {
  const response = await apiClient.put(`/appointments/${appointmentId}`, payload);
  return response.data;
};

// Specific function to update status, or could be part of general updateAppointment
export const updateAppointmentStatus = async (appointmentId: string, status: string) => {
  const response = await apiClient.put(`/appointments/${appointmentId}`, { status });
  return response.data;
};

// Staff
export const getStaff = async () => {
  const response = await apiClient.get('/staff');
  return response.data;
};

export const getStaffById = async (staffId: string) => {
  const response = await apiClient.get(`/staff/${staffId}`);
  return response.data;
};

// Define a more specific type for the staff payload
export interface AddStaffPayload {
  name: string;
  employmentNumber?: string; // Changed to optional
  email: string;
  jobType: string;
  department: string;
  gender?: string;
  dob?: string; // Date of Birth
  address?: string;
  telephone?: string;
  hire_date?: string; // Changed from hireDate
  salary?: number | null;
  // Optional login creation fields
  create_login?: boolean; // Changed from createLogin
  username?: string;
  password?: string;
  role?: string; // Role for the login
}

export const addStaff = async (payload: AddStaffPayload) => {
  const response = await apiClient.post('/staff', payload);
  return response.data; // Should return { message, staffId, userId? }
};

export default apiClient; 