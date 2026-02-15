export interface Staff {
    id: number;
    name: string;
    jobType: 'Doctor' | 'Nurse' | 'Surgeon' | 'SupportStaff' | string; // jobType from backend
    email?: string;
    specialty?: string;
    contractType?: string;
    contractLengthYears?: number;
    grade?: string;
    yearsExperience?: number;
    salary?: number;
    employmentNumber?: string; // employmentNumber is string based on AddStaffPage
    gender?: 'Male' | 'Female' | 'Other' | string;
    address?: string;
    telephone?: string;
    userId?: number; 
    username?: string; // For login, if creating a user account simultaneously
    password?: string; // For login, should not be stored long-term or sent back from GET requests
    role?: 'Admin' | 'Doctor' | 'Nurse' | 'Support' | string; // User role for login
} 