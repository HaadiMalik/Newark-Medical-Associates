import type { Staff } from '../types/Staff';

const API_BASE_URL = 'http://localhost:3001/api'; // Updated to port 3001

// Updated to retrieve token directly from 'nma_token'
const getAuthToken = () => {
    console.log('[staffService] Attempting to get auth token from key: nma_token');
    const token = localStorage.getItem('nma_token');
    console.log('[staffService] Token from localStorage (nma_token):', token);
    return token; 
};

interface StaffCreationResponse {
    message: string;
    staffId: number;
    userId?: number;
}

export const getStaff = async (): Promise<Staff[]> => {
    const token = getAuthToken();
    console.log('[staffService] Token being used for getStaff request:', token);
    const response = await fetch(`${API_BASE_URL}/staff`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });
    console.log('[staffService] getStaff response status:', response.status);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch staff members and parse error failed.' }));
        console.error('[staffService] Error fetching staff:', errorData);
        throw new Error(errorData.message || 'Failed to fetch staff members');
    }
    const staffData = await response.json() as Staff[];
    console.log('[staffService] Staff data received:', staffData);
    return staffData;
};

export const addStaff = async (staffData: Omit<Staff, 'id'>): Promise<StaffCreationResponse> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/staff`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(staffData),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to add staff member and parse error failed.' }));
        throw new Error(errorData.message || 'Failed to add staff member');
    }
    return await response.json() as StaffCreationResponse;
};

export const deleteStaff = async (staffId: number): Promise<{ message: string; changes: number }> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/staff/${staffId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete staff member and parse error failed.' }));
        throw new Error(errorData.message || 'Failed to delete staff member');
    }
    return await response.json();
};

// It would be good to define the Staff type. If it's not already defined,
// create a file like frontend/src/types/Staff.ts
// For example:
/*
export interface Staff {
    id: number;
    name: string;
    jobType: 'Doctor' | 'Nurse' | 'Surgeon' | 'SupportStaff' | string; // Be more specific if possible
    email?: string;
    specialty?: string;
    contractType?: string;
    contractLengthYears?: number;
    grade?: string;
    yearsExperience?: number;
    salary?: number;
    employmentNumber?: string;
    gender?: 'Male' | 'Female' | 'Other' | string;
    address?: string;
    telephone?: string;
    userId?: number; // If linked to a User account
    // Add any other relevant fields
}
*/ 