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
};


export type DoctorInfo = {
  name: string;
  specialty: string;
  clinicAddress: string;
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
