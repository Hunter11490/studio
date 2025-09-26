export type ReferralCase = {
  patientName: string;
  referralDate: string;
  testDate: string; // New field for test date
  testType: string;
  patientAge: string;
  chronicDiseases: string;
};

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  phoneNumber: string;
  clinicAddress: string;
  mapLocation: string; // URL
  clinicCardImageUrl: string; // Data URL
  isPartner: boolean;
  referralCount: number;
  referralNotes?: ReferralCase[];
  availableDays: string[]; // e.g., ['Sun', 'Mon']
  createdAt: string; // ISO date string
  isLoading?: boolean;
};

export type FinancialRecord = {
  id: string;
  type: 'lab' | 'pharmacy' | 'surgery' | 'payment' | 'consultation' | 'inpatient';
  description: string;
  amount: number; // Can be positive (charges) or negative (payments)
  date: string; // ISO date string
};

export type TriageLevel = 'critical' | 'urgent' | 'stable' | 'minor';

export type VitalSigns = {
  heartRate: number;
  bloodPressure: string;
  spo2: number;
  temperature: number;
}

export type Patient = {
  id: string;
  patientName: string;
  dob: {
    day: string;
    month: string;
    year: string;
  };
  receptionDate: string;
  address: {
    governorate: string;
    region: string;
    mahalla: string;
    zuqaq: string;
    dar: string;
  };
  idFront?: string;
  idBack?: string;
  department: string;
  doctorId?: string;
  createdAt: string;
  financialRecords?: FinancialRecord[];

  // New fields for emergency and ICU
  triageLevel?: TriageLevel;
  status?: 'Waiting' | 'In Treatment' | 'Observation' | 'Admitted' | 'Discharged';
  vitalSigns?: VitalSigns;
  
  // New fields for inpatient wards
  floor?: number;
  room?: number;
  admittedAt?: string; // ISO date string
};

export type DoctorInfo = {
    name: string;
    specialty: string;
    clinicAddress: string;
    referralNotes?: {
        patientName: string;
        referralDate: string;
        testDate: string;
        testType: string;
        patientAge: string;
        chronicDiseases: string;
    }[];
};

export type UserStatus = 'pending' | 'active' | 'banned';

export type User = {
  id: string;
  username: string;
  email: string;
  phoneNumber: string;
  role: 'admin' | 'user';
  status: UserStatus;
  sessionStarted?: number;
};

export type StoredUser = User & {
  pass: string;
  isFirstLogin?: boolean;
  activatedAt?: number; // Timestamp of activation/creation
};

export type Translation = {
  [key: string]: string | Translation;
};

export type Translations = {
  en: Translation;
  ar: Translation;
};


export type PartnerExportData = {
  [key:string]: string | number;
};

export type AppNotification = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  isRead: boolean;
};

export type ServiceRequest = {
  id: string;
  type: 'maintenance' | 'cleaning' | 'catering';
  description: string;
  department: string;
  status: 'new' | 'in-progress' | 'completed';
  createdAt: string;
}

export type InstrumentSet = {
    id: string;
    name: string;
    department: string;
    status: 'cleaning' | 'packaging' | 'sterilizing' | 'storage';
    cycleStartTime: number;
    cycleDuration: number; // in seconds
}
