export interface Shift {
    id: number;
    staffId: number;
    staffName?: string; // Included from the backend JOIN for display purposes
    shiftDate: string; // YYYY-MM-DD
    startTime: string; // HH:MM
    endTime: string;   // HH:MM
} 