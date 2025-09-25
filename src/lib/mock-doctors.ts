import { Doctor } from '@/types';

const medicalSpecialties = [
    "Internal Medicine", "General Surgery", "Obstetrics and Gynecology", "Pediatrics", "Orthopedics",
    "Urology", "ENT", "Ophthalmology", "Dermatology", "Cardiology", "Neurology",
    "Oncology", "Nephrology", "Blood Bank", "Emergency Medicine", "Anesthesiology"
];

const arabicFirstNames = [
    "د. أحمد", "د. علي", "د. يوسف", "د. عمر", "د. خالد", "د. محمد",
    "د. فاطمة", "د. ليلى", "د. نور", "د. هدى", "د. مريم", "د. زينب"
];
const arabicLastNames = [
    "الجميلي", "الزبيدي", "الحداد", "الخفاجي", "التكريتي", "الشمري", "الساعدي",
    "العبادي", "الدليمي", "الياسري", "العراقي", "البغدادي", "الموصلي", "البصري",
    "النجفي", "الكربلائي", "الحلي", "الرمادي", "الحيالي"
];


// Helper to get a random specialty
const getRandomSpecialty = () => medicalSpecialties[Math.floor(Math.random() * medicalSpecialties.length)];
const getRandomArabicName = (index: number) => {
    const firstName = arabicFirstNames[index % arabicFirstNames.length];
    const lastName = arabicLastNames[Math.floor(index / arabicFirstNames.length) % arabicLastNames.length];
    return `${firstName} ${lastName}`;
}


// This file is intentionally left empty for production.
// Mock data can be added here for development purposes.
export const MOCK_DOCTORS: Omit<Doctor, 'id' | 'createdAt'>[] = [
  {
    name: "د. أحمد الجميلي",
    specialty: "Cardiology",
    phoneNumber: "07701234567",
    clinicAddress: "المنصور، بغداد",
    mapLocation: "",
    clinicCardImageUrl: "",
    isPartner: true,
    referralCount: 15,
    availableDays: ["Sat", "Mon", "Wed"],
    referralNotes: []
  },
  {
    name: "د. فاطمة الزبيدي",
    specialty: "Dermatology",
    phoneNumber: "07807654321",
    clinicAddress: "الكرادة، بغداد",
    mapLocation: "",
    clinicCardImageUrl: "",
    isPartner: false,
    referralCount: 5,
    availableDays: ["Sun", "Tue", "Thu"],
    referralNotes: []
  },
  {
    name: "د. يوسف الحداد",
    specialty: "Orthopedics",
    phoneNumber: "07901122334",
    clinicAddress: "الأعظمية، بغداد",
    mapLocation: "",
    clinicCardImageUrl: "",
    isPartner: true,
    referralCount: 25,
    availableDays: ["Sat", "Sun", "Mon", "Tue", "Wed"],
    referralNotes: []
  },
  {
    name: "د. ليلى الخفاجي",
    specialty: "Pediatrics",
    phoneNumber: "07712345678",
    clinicAddress: "زيونة، بغداد",
    mapLocation: "",
    clinicCardImageUrl: "",
    isPartner: false,
    referralCount: 8,
    availableDays: ["Mon", "Wed", "Fri"],
    referralNotes: []
  },
  {
    name: "د. عمر التكريتي",
    specialty: "Neurology",
    phoneNumber: "07818765432",
    clinicAddress: "اليرموك، بغداد",
    mapLocation: "",
    clinicCardImageUrl: "",
    isPartner: true,
    referralCount: 12,
    availableDays: ["Sun", "Tue"],
    referralNotes: []
  },
  {
    name: "د. نور الشمري",
    specialty: "Oncology",
    phoneNumber: "07912233445",
    clinicAddress: "مدينة الطب، بغداد",
    mapLocation: "",
    clinicCardImageUrl: "",
    isPartner: false,
    referralCount: 3,
    availableDays: ["Mon", "Thu"],
    referralNotes: []
  },
  {
    name: "د. علي الساعدي",
    specialty: "General Surgery",
    phoneNumber: "07723456789",
    clinicAddress: "الحارثية، بغداد",
    mapLocation: "",
    clinicCardImageUrl: "",
    isPartner: true,
    referralCount: 30,
    availableDays: ["Tue", "Thu", "Sat"],
    referralNotes: []
  },
  {
    name: "د. هدى العبادي",
    specialty: "Obstetrics and Gynecology",
    phoneNumber: "07829876543",
    clinicAddress: "الجادرية، بغداد",
    mapLocation: "",
    clinicCardImageUrl: "",
    isPartner: false,
    referralCount: 22,
    availableDays: ["Sun", "Wed"],
    referralNotes: []
  },
  {
    name: "د. إبراهيم الدليمي",
    specialty: "Urology",
    phoneNumber: "07923344556",
    clinicAddress: "العامرية، بغداد",
    mapLocation: "",
    clinicCardImageUrl: "",
    isPartner: true,
    referralCount: 18,
    availableDays: ["Mon", "Fri"],
    referralNotes: []
  },
  {
    name: "د. مريم الياسري",
    specialty: "Ophthalmology",
    phoneNumber: "07734567890",
    clinicAddress: "شارع فلسطين، بغداد",
    mapLocation: "",
    clinicCardImageUrl: "",
    isPartner: false,
    referralCount: 11,
    availableDays: ["Tue", "Wed", "Thu"],
    referralNotes: []
  },
  {
    name: "د. خالد العامري",
    specialty: "ENT",
    phoneNumber: "07830987654",
    clinicAddress: "السيدية، بغداد",
    mapLocation: "",
    clinicCardImageUrl: "",
    isPartner: true,
    referralCount: 9,
    availableDays: ["Sat", "Tue"],
    referralNotes: []
  },
  {
    name: "د. زينب الربيعي",
    specialty: "Internal Medicine",
    phoneNumber: "07934455667",
    clinicAddress: "الدورة، بغداد",
    mapLocation: "",
    clinicCardImageUrl: "",
    isPartner: false,
    referralCount: 14,
    availableDays: ["Sun", "Mon", "Wed"],
    referralNotes: []
  },
  ...Array.from({ length: 138 }, (_, i) => {
    return {
        name: `${getRandomArabicName(i)}`,
        specialty: getRandomSpecialty(),
        phoneNumber: `07${Math.floor(700000000 + Math.random() * 299999999)}`,
        clinicAddress: `منطقة ${i+1}, بغداد`,
        mapLocation: "",
        clinicCardImageUrl: "",
        isPartner: Math.random() > 0.5,
        referralCount: Math.floor(Math.random() * 30),
        availableDays: ["Sat", "Mon", "Wed"],
        referralNotes: []
    }
  })
];
