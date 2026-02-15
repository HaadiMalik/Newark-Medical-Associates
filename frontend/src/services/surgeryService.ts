import type { SurgeryBookingData, ScheduledSurgery, SurgeryType } from '../types/Surgery';

const API_BASE_URL = 'http://localhost:3001/api'; // Updated to port 3001

// Updated to retrieve token directly from 'nma_token'
const getAuthToken = () => {
    // console.log('[surgeryService] Attempting to get auth token from key: nma_token'); // Optional: keep for debugging if needed
    const token = localStorage.getItem('nma_token');
    // console.log('[surgeryService] Token from localStorage (nma_token):', token); // Optional: keep for debugging if needed
    return token;
};

interface SurgeryBookingResponse {
    message: string;
    surgeryId: number;
}

// Book a new surgery
export const bookSurgery = async (bookingData: SurgeryBookingData): Promise<SurgeryBookingResponse> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/surgeries/book`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to book surgery' }));
        throw new Error(errorData.message || 'Failed to book surgery');
    }
    return await response.json();
};

// Get all surgery types
export const getSurgeryTypes = async (): Promise<SurgeryType[]> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/surgeries/types`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch surgery types' }));
        throw new Error(errorData.message || 'Failed to fetch surgery types');
    }
    return await response.json();
};

// Get scheduled surgeries (with optional filters)
// Filters can be an object like { patientId, surgeonId, date, status, operationTheatre }
export const getScheduledSurgeries = async (filters?: any): Promise<ScheduledSurgery[]> => {
    const token = getAuthToken();
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE_URL}/surgeries${queryParams ? `?${queryParams}` : ''}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch scheduled surgeries' }));
        throw new Error(errorData.message || 'Failed to fetch scheduled surgeries');
    }
    return await response.json();
};

// Get scheduled surgeries by room and day
export const getScheduledSurgeriesByRoomAndDay = async (roomId: string, day: string): Promise<ScheduledSurgery[]> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/surgeries/by-room-day?roomId=${roomId}&day=${day}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch surgeries by room and day' }));
        throw new Error(errorData.message || 'Failed to fetch surgeries by room and day');
    }
    return await response.json();
}; 