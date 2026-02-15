import type { Room } from '../types/Room';

const API_BASE_URL = 'http://localhost:3001/api'; // Updated to port 3001

// Updated to retrieve token directly from 'nma_token'
const getAuthToken = () => {
    const token = localStorage.getItem('nma_token');
    return token;
};

// Fetch all rooms
export const getRooms = async (): Promise<Room[]> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/rooms`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch rooms' }));
        throw new Error(errorData.message || 'Failed to fetch rooms');
    }
    // Construct a fullName for easier display in dropdowns
    const rooms: Room[] = await response.json();
    return rooms.map(room => ({
        ...room,
        fullName: `${room.nursingUnit}-${room.wing} ${room.roomNumber}-${room.bedLabel}`
    }));
}; 