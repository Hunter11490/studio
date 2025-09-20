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
  availableDays: string[]; // e.g., ['Sun', 'Mon']
  createdAt: string; // ISO date string
};

export type User = {
  id: string;
  username: string;
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
