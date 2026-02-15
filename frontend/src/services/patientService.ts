import type { Patient } from '../types/Patient';

const API_BASE_URL = 'http://localhost:3001/api'; // Updated to port 3001

// Updated to retrieve token directly from 'nma_token'
const getAuthToken = () => {
    const token = localStorage.getItem('nma_token');
    return token;
};

// Fetch all patients
export const getPatients = async (): Promise<Patient[]> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/patients`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch patients' }));
        throw new Error(errorData.message || 'Failed to fetch patients');
    }
    return await response.json();
};

// We can add getPatientById, addPatient, updatePatient etc. here later as needed. 