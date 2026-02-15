// Basic data for list views
export interface InPatientBasic {
    inPatientRecordId: number;
    admissionDate: string;
    patientId: number;
    patientName: string;
    roomId?: number;
    nursingUnit?: string;
    wing?: string;
    roomNumber?: string;
    bedLabel?: string;
    assignedNurseName?: string;
    assignedNurseId?: number;
    assignedDoctorName?: string;
    assignedDoctorId?: number;
}

// Comprehensive InPatient details
export interface InPatient extends InPatientBasic {
    patientDob?: string;
    patientGender?: string;
    dischargeDate?: string | null;
    // any other specific fields from the GET /:inPatientRecordId endpoint
}

// Data for admitting a patient
export interface InPatientAdmissionData {
    patientId: number;
    roomId: number;
    admissionDate: string; // YYYY-MM-DD
    assignedNurseId?: number | null;
    assignedDoctorId?: number | null;
}

// Data for assigning staff
export interface StaffAssignmentData {
    staffId: number;
    staffType: 'Doctor' | 'Nurse';
} 