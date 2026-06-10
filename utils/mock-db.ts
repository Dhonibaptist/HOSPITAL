import bcrypt from 'bcryptjs';

// Pre-hashed passwords using bcryptjs for safety (password is 'password123')
const MOCK_PASSWORD_HASH = '$2a$10$QO0kP.p3z7.O6hJgOJyHze6G2P7jP/N8jWqM1h0aCqQ7eJ0/8e2XG'; // password123

export interface MockUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  passwordHash: string;
}

export interface MockDoctor {
  id: string;
  name: string;
  specialization: string;
  experience: number;
  consultationFee: number;
  availability: Record<string, string[]>;
  qualifications: string[];
  languages: string[];
  rating: number;
  image: string;
}

export interface MockFamilyMember {
  id: string;
  parentId: string;
  name: string;
  relation: string; // "FATHER" | "MOTHER" | "CHILD" | "GRANDPARENT"
  age: number;
  gender: string;
}

export interface MockAppointment {
  id: string;
  patientId: string;
  patientName: string;
  familyMemberId?: string;
  familyMemberName?: string; // If booked for a family member
  doctorId: string;
  doctorName: string;
  specialization: string;
  date: string;
  timeSlot: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
  paymentId?: string;
  tokenNumber?: number;
  queueStatus: 'NOT_ARRIVED' | 'WAITING' | 'ACTIVE' | 'SKIPPED' | 'COMPLETED';
}

export interface MockPrescription {
  id: string;
  appointmentId: string;
  medicines: Array<{ name: string; dosage: string; frequency: string; duration: string }>;
  notes?: string;
  createdAt: string;
}

export interface MockMedicalReport {
  id: string;
  patientId: string;
  fileName: string;
  fileUrl: string;
  reportType: string; // LAB_RESULT, IMAGING
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  keyFindings?: string;
  abnormalValues?: string;
  createdAt: string;
}

export interface MockReminder {
  id: string;
  patientId: string;
  medicine: string;
  time: string;
  active: boolean;
}

export interface MockHealthProfile {
  id: string;
  patientId: string;
  bloodSugar: number;
  systolicBP: number;
  exerciseHoursPerWeek: number;
  smoking: boolean;
  heartRisk: number;
  diabetesRisk: number;
  bmiRisk: number;
  lifestyleScore: number;
}

export interface MockMedicineInventory {
  id: string;
  name: string;
  quantity: number;
  expiryDate: string; // YYYY-MM-DD
  supplier: string;
}

// In-Memory Database State
class MockDatabase {
  users: MockUser[] = [];
  doctors: MockDoctor[] = [];
  appointments: MockAppointment[] = [];
  prescriptions: MockPrescription[] = [];
  reports: MockMedicalReport[] = [];
  reminders: MockReminder[] = [];
  familyMembers: MockFamilyMember[] = [];
  healthProfiles: MockHealthProfile[] = [];
  medicineInventory: MockMedicineInventory[] = [];
  
  // Real-time Queue counter cache
  currentQueueToken: Record<string, number> = {}; // doctorId -> current token

  constructor() {
    this.init();
  }

  private init() {
    // Populate default users
    this.users = [
      { id: 'usr-pat-1', name: 'John Doe (Patient)', email: 'patient@astracare.com', phone: '+91 9876543210', role: 'PATIENT', passwordHash: MOCK_PASSWORD_HASH },
      { id: 'usr-doc-1', name: 'Dr. Sarah Jenkins', email: 'doctor@astracare.com', phone: '+91 8765432109', role: 'DOCTOR', passwordHash: MOCK_PASSWORD_HASH },
      { id: 'usr-doc-2', name: 'Dr. Rajan Sharma', email: 'rajan@astracare.com', phone: '+91 7654321098', role: 'DOCTOR', passwordHash: MOCK_PASSWORD_HASH },
      { id: 'usr-adm-1', name: 'Administrator Portal', email: 'admin@astracare.com', phone: '+91 5432109876', role: 'ADMIN', passwordHash: MOCK_PASSWORD_HASH }
    ];

    // Populate doctors profiles
    this.doctors = [
      {
        id: 'usr-doc-1',
        name: 'Dr. Sarah Jenkins',
        specialization: 'Cardiology',
        experience: 14,
        consultationFee: 800,
        availability: {
          'Monday': ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'],
          'Wednesday': ['09:00 AM', '10:00 AM', '04:00 PM', '05:00 PM'],
          'Friday': ['10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM']
        },
        qualifications: ['MD (Cardiology)', 'MBBS', 'FACC'],
        languages: ['English', 'German'],
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=300&auto=format&fit=crop'
      },
      {
        id: 'usr-doc-2',
        name: 'Dr. Rajan Sharma',
        specialization: 'Neurology',
        experience: 18,
        consultationFee: 1000,
        availability: {
          'Tuesday': ['10:00 AM', '11:00 AM', '12:00 PM', '03:00 PM', '04:00 PM'],
          'Thursday': ['09:00 AM', '10:00 AM', '02:00 PM', '03:00 PM', '04:00 PM']
        },
        qualifications: ['DM (Neurology)', 'MD (Medicine)', 'MBBS'],
        languages: ['English', 'Hindi', 'Tamil'],
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=300&auto=format&fit=crop'
      }
    ];

    // Populating base appointments
    this.appointments = [
      {
        id: 'appt-1',
        patientId: 'usr-pat-1',
        patientName: 'John Doe (Patient)',
        doctorId: 'usr-doc-1',
        doctorName: 'Dr. Sarah Jenkins',
        specialization: 'Cardiology',
        date: new Date().toISOString().split('T')[0],
        timeSlot: '10:00 AM',
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentId: 'pay_mock_12345',
        tokenNumber: 24,
        queueStatus: 'WAITING'
      },
      {
        id: 'appt-2',
        patientId: 'usr-pat-1',
        patientName: 'John Doe (Patient)',
        doctorId: 'usr-doc-2',
        doctorName: 'Dr. Rajan Sharma',
        specialization: 'Neurology',
        date: new Date().toISOString().split('T')[0],
        timeSlot: '02:00 PM',
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        queueStatus: 'NOT_ARRIVED'
      }
    ];

    // Populating base prescriptions
    this.prescriptions = [
      {
        id: 'pr-1',
        appointmentId: 'appt-1',
        medicines: [
          { name: 'Aspirin', dosage: '75mg', frequency: 'Once daily (after breakfast)', duration: '30 days' },
          { name: 'Atorvastatin', dosage: '10mg', frequency: 'Once daily (at night)', duration: '30 days' }
        ],
        notes: 'Avoid strenuous exercises and heavy salt intake. Monitor blood pressure daily.',
        createdAt: new Date().toISOString()
      }
    ];

    // Populate medical reports
    this.reports = [
      {
        id: 'rep-1',
        patientId: 'usr-pat-1',
        fileName: 'Blood_Panel_Report.pdf',
        fileUrl: '#',
        reportType: 'LAB_RESULT',
        riskLevel: 'LOW',
        keyFindings: 'All hematological parameters within healthy clinical limits.',
        abnormalValues: 'None',
        createdAt: '2026-05-15'
      },
      {
        id: 'rep-2',
        patientId: 'usr-pat-1',
        fileName: 'ECG_Digital_Wave.pdf',
        fileUrl: '#',
        reportType: 'ECG',
        riskLevel: 'MEDIUM',
        keyFindings: 'Slightly elevated resting heartbeat frequency detected.',
        abnormalValues: 'Heart Rate: 98 bpm',
        createdAt: '2026-05-20'
      }
    ];

    // Populate reminders
    this.reminders = [
      { id: 'rem-1', patientId: 'usr-pat-1', medicine: 'Aspirin', time: '08:00 AM', active: true },
      { id: 'rem-2', patientId: 'usr-pat-1', medicine: 'Atorvastatin', time: '09:30 PM', active: true }
    ];

    // Populating family members for Patient
    this.familyMembers = [
      { id: 'fam-1', parentId: 'usr-pat-1', name: 'Robert Doe', relation: 'FATHER', age: 64, gender: 'MALE' },
      { id: 'fam-2', parentId: 'usr-pat-1', name: 'Mary Doe', relation: 'MOTHER', age: 58, gender: 'FEMALE' },
      { id: 'fam-3', parentId: 'usr-pat-1', name: 'Timmy Doe', relation: 'CHILD', age: 8, gender: 'MALE' },
      { id: 'fam-4', parentId: 'usr-pat-1', name: 'Arthur Doe', relation: 'GRANDPARENT', age: 84, gender: 'MALE' }
    ];

    // Populating health profiles for Patient
    this.healthProfiles = [
      {
        id: 'hp-1',
        patientId: 'usr-pat-1',
        bloodSugar: 110,
        systolicBP: 120,
        exerciseHoursPerWeek: 4,
        smoking: false,
        heartRisk: 15,
        diabetesRisk: 22,
        bmiRisk: 12,
        lifestyleScore: 82
      }
    ];

    // Populating medicine inventory stock
    this.medicineInventory = [
      { id: 'inv-1', name: 'Paracetamol', quantity: 150, expiryDate: '2026-12-10', supplier: 'AstraCare Pharma Ltd' },
      { id: 'inv-2', name: 'Aspirin', quantity: 15, expiryDate: '2026-07-25', supplier: 'LifeDrugs Medical' },
      { id: 'inv-3', name: 'Atorvastatin', quantity: 45, expiryDate: '2026-05-01', supplier: 'GlobalMeds Distributors' },
      { id: 'inv-4', name: 'Amoxicillin', quantity: 210, expiryDate: '2027-02-15', supplier: 'MediCare Suppliers' }
    ];

    // Populate initial queue token counters
    this.currentQueueToken['usr-doc-1'] = 22; // Doctor 1 is currently serving token 22
    this.currentQueueToken['usr-doc-2'] = 5;  // Doctor 2 is currently serving token 5
  }
}

// Global persistence for mock db across server requests
const globalForMockDb = global as unknown as { mockDb: MockDatabase };
export const mockDb = globalForMockDb.mockDb || new MockDatabase();
if (process.env.NODE_ENV !== 'production') globalForMockDb.mockDb = mockDb;

// Helper to determine if we should fallback to Mock Database (runs if postgres isn't active or DATABASE_URL isn't set)
export async function tryDbQuery<T>(
  prismaQuery: () => Promise<T>,
  mockQuery: () => Promise<T>
): Promise<T> {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost:5432/hospital_booking')) {
    // If it's the default dummy value and no connection is set, immediately bypass to speed up loading
    return await mockQuery();
  }
  try {
    return await prismaQuery();
  } catch (error) {
    console.warn("PostgreSQL connection error, falling back to mock database:", (error as Error).message);
    return await mockQuery();
  }
}
