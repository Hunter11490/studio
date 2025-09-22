export type ReferralCase = {
  patientName: string;
  referralDate: string;
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

export type DoctorInfo = {
  name: string;
  specialty: string;
  clinicAddress: string;
};

export type User = {
  id: string;
  username: string;
  email: string;
  phoneNumber: string;
  role: 'admin' | 'user';
};

export type StoredUser = User & {
  pass: string;
};

export type Translation = {
  [key: string]: string | Translation;
};

export type Translations = {
  en: Translation;
  ar: Translation;
};
