import type { Shift } from '../types/Shift';

const API_BASE_URL = 'http://localhost:3001/api'; // Updated to port 3001

// Updated to retrieve token directly from 'nma_token'
const getAuthToken = () => {
    const token = localStorage.getItem('nma_token');
    return token;
};

interface ShiftCreationResponse {
    message: string;
    shiftId: number;
}

export const addShift = async (shiftData: Omit<Shift, 'id' | 'staffName'>): Promise<ShiftCreationResponse> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/shifts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(shiftData),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to add shift and parse error failed.' }));
        throw new Error(errorData.message || 'Failed to add shift');
    }
    return await response.json() as ShiftCreationResponse;
};

export const getShifts = async (): Promise<Shift[]> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/shifts`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch shifts and parse error failed.' }));
        throw new Error(errorData.message || 'Failed to fetch shifts');
    }
    return await response.json() as Shift[];
}; 