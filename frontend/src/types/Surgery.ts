export interface SurgeryType {
    id: number;
    surgeryCode: string;
    name: string;
    category?: string; // 'H' or 'O'
    anatomicalLocation?: string;
    specialNeeds?: string;
}

export interface SurgeryBookingData {
    patientId: number;
    surgeonId: number;
    surgeryTypeId: number;
    scheduledDateTime: string; // ISO string or YYYY-MM-DD HH:MM:SS
    operationTheatre?: string | null;
    status?: string; // e.g., 'Scheduled', 'Completed', 'Cancelled'
}

export interface ScheduledSurgery extends SurgeryBookingData {
    surgeryId: number; // or just id
    patientName?: string;
    surgeonName?: string;
    surgeryTypeName?: string;
    surgeryCategory?: string;
} 