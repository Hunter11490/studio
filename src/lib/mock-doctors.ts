import { Doctor } from '@/types';
import { IRAQI_GOVERNORATES, MEDICAL_SPECIALTIES } from './constants';

const COMMON_IRAQI_FIRST_NAMES = ["Ahmed", "Ali", "Mohammed", "Mustafa", "Ibrahim", "Hassan", "Hussein", "Omar", "Abdullah", "Youssef", "Fatima", "Zahra", "Maryam", "Nour", "Aya", "Sara", "Huda", "Zainab"];
const COMMON_IRAQI_LAST_NAMES = ["Al-Jubouri", "Al-Tamimi", "Al-Lami", "Al-Saadi", "Al-Maliki", "Al-Khafaji", "Al-Dulaimi", "Al-Shammari", "Al-Rubaie", "Al-Obeidi"];

const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomNumber = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

const generateMockDoctor = (id: number): Doctor => {
  const governorate = getRandomItem(Object.keys(IRAQI_GOVERNORATES));
  const city = getRandomItem(IRAQI_GOVERNORATES[governorate as keyof typeof IRAQI_GOVERNORATES]);
  const street = `Street ${getRandomNumber(1, 100)}`;
  const referralCount = getRandomNumber(0, 30);
  const isPartner = Math.random() > 0.5;

  return {
    id: `mock-doctor-${id}-${new Date().getTime()}`,
    name: `Dr. ${getRandomItem(COMMON_IRAQI_FIRST_NAMES)} ${getRandomItem(COMMON_IRAQI_LAST_NAMES)}`,
    specialty: getRandomItem(MEDICAL_SPECIALTIES),
    phoneNumber: `07${getRandomNumber(7, 9)}0${getRandomNumber(1000000, 9999999)}`,
    clinicAddress: `${city}, ${governorate}, ${street}`,
    mapLocation: '',
    clinicCardImageUrl: '',
    isPartner,
    referralCount,
    referralNotes: Array(referralCount).fill(null).map((_, i) => ({
        patientName: `Patient ${i + 1}`,
        referralDate: `2024-${getRandomNumber(1,12).toString().padStart(2, '0')}-${getRandomNumber(1,28).toString().padStart(2,'0')}`,
        testType: `Test Type ${i+1}`,
        patientAge: `${getRandomNumber(18, 70)}`,
        chronicDiseases: Math.random() > 0.7 ? 'Diabetes' : ''
    })),
    availableDays: ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'].filter(() => Math.random() > 0.4),
    createdAt: new Date(new Date().getTime() - getRandomNumber(0, 1000 * 60 * 60 * 24 * 365)).toISOString(),
  };
};

export const MOCK_DOCTORS: Doctor[] = Array.from({ length: 100 }, (_, i) => generateMockDoctor(i + 1));
