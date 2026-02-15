import type { InPatient, InPatientBasic, InPatientAdmissionData, StaffAssignmentData } from '../types/InPatient'; // Define these types

const API_BASE_URL = 'http://localhost:3001/api'; // Updated to port 3001

// Updated to retrieve token directly from 'nma_token'
const getAuthToken = () => {
    const token = localStorage.getItem('nma_token');
    return token;
};

// Fetch all current in-patients (basic list view)
export const getInPatients = async (): Promise<InPatientBasic[]> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/inpatients`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch in-patients' }));
        throw new Error(errorData.message || 'Failed to fetch in-patients');
    }
    return await response.json();
};

// Fetch details for a specific in-patient record
export const getInPatientDetails = async (recordId: string | number): Promise<InPatient> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/inpatients/${recordId}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch in-patient details' }));
        throw new Error(errorData.message || 'Failed to fetch in-patient details');
    }
    return await response.json();
};

// Admit a patient
export const admitPatient = async (admissionData: InPatientAdmissionData): Promise<{ message: string; inPatientId: number }> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/inpatients/admit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(admissionData),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to admit patient' }));
        throw new Error(errorData.message || 'Failed to admit patient');
    }
    return await response.json();
};

// Discharge an in-patient
export const dischargePatient = async (recordId: string | number, dischargeDate: string): Promise<{ message: string }> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/inpatients/${recordId}/discharge`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ dischargeDate }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to discharge patient' }));
        throw new Error(errorData.message || 'Failed to discharge patient');
    }
    return await response.json();
};

// Assign staff (Doctor/Nurse) to an in-patient
export const assignStaffToInPatient = async (recordId: string | number, data: StaffAssignmentData): Promise<{ message: string }> => {
    const { staffId, staffType } = data;
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/inpatients/${recordId}/assign-staff`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ staffId, staffType }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to assign ${staffType}` }));
        throw new Error(errorData.message || `Failed to assign ${staffType}`);
    }
    return await response.json();
};

// Remove staff (Doctor/Nurse) assignment from an in-patient
export const removeStaffFromInPatient = async (recordId: string | number, staffType: 'Doctor' | 'Nurse'): Promise<{ message: string }> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/inpatients/${recordId}/remove-staff`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ staffType }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to remove ${staffType} assignment` }));
        throw new Error(errorData.message || `Failed to remove ${staffType} assignment`);
    }
    return await response.json();
}; 