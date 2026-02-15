export interface Room {
    id: number;
    nursingUnit: string;
    wing: string;
    roomNumber: string;
    bedLabel: string; // 'A' or 'B'
    isOccupied: 0 | 1; // 0 for false, 1 for true
    // Optional: a constructed full name for display
    fullName?: string; 
} 