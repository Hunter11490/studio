import { Doctor } from '@/types';

const medicalSpecialties = [
    "Internal Medicine", "General Surgery", "Obstetrics and Gynecology", "Pediatrics", "Orthopedics",
    "Urology", "ENT", "Ophthalmology", "Dermatology", "Cardiology", "Neurology",
    "Oncology", "Nephrology", "Blood Bank", "Emergency Medicine", "Anesthesiology"
];

// Helper to get a random specialty
const getRandomSpecialty = () => medicalSpecialties[Math.floor(Math.random() * medicalSpecialties.length)];

// This file is intentionally left empty for production.
// Mock data can be added here for development purposes.
export const MOCK_DOCTORS: Omit<Doctor, 'id' | 'createdAt'>[] = [
  {
    name: "Dr. Ahmed Al-Jumaily",
    specialty: "Cardiology",
    phoneNumber: "07701234567",
    clinicAddress: "Al-Mansour, Baghdad",
    mapLocation: "",
    clinicCardImageUrl: "",
    isPartner: true,
    referralCount: 15,
    availableDays: ["Sat", "Mon", "Wed"],
    referralNotes: []
  },
  {
    name: "Dr. Fatima Al-Zubaidi",
    specialty: "Dermatology",
    phoneNumber: "07807654321",
    clinicAddress: "Al-Karrada, Baghdad",
    mapLocation: "",
    clinicCardImageUrl: "",
    isPartner: false,
    referralCount: 5,
    availableDays: ["Sun", "Tue", "Thu"],
    referralNotes: []
  },
  {
    name: "Dr. Yusuf Al-Haddad",
    specialty: "Orthopedics",
    phoneNumber: "07901122334",
    clinicAddress: "Al-Adhamiyah, Baghdad",
    mapLocation: "",
    clinicCardImageUrl: "",
    isPartner: true,
    referralCount: 25,
    availableDays: ["Sat", "Sun", "Mon", "Tue", "Wed"],
    referralNotes: []
  },
  {
    name: "Dr. Layla Al-Khafaji",
    specialty: "Pediatrics",
    phoneNumber: "07712345678",
    clinicAddress: "Zayouna, Baghdad",
    mapLocation: "",
    clinicCardImageUrl: "",
    isPartner: false,
    referralCount: 8,
    availableDays: ["Mon", "Wed", "Fri"],
    referralNotes: []
  },
  {
    name: "Dr. Omar Al-Tikriti",
    specialty: "Neurology",
    phoneNumber: "07818765432",
    clinicAddress: "Yarmouk, Baghdad",
    mapLocation: "",
    clinicCardImageUrl: "",
    isPartner: true,
    referralCount: 12,
    availableDays: ["Sun", "Tue"],
    referralNotes: []
  },
  {
    name: "Dr. Noor Al-Shammari",
    specialty: "Oncology",
    phoneNumber: "07912233445",
    clinicAddress: "Medical City, Baghdad",
    mapLocation: "",
    clinicCardImageUrl: "",
    isPartner: false,
    referralCount: 3,
    availableDays: ["Mon", "Thu"],
    referralNotes: []
  },
  {
    name: "Dr. Ali Al-Saadi",
    specialty: "General Surgery",
    phoneNumber: "07723456789",
    clinicAddress: "Al-Harthiya, Baghdad",
    mapLocation: "",
    clinicCardImageUrl: "",
    isPartner: true,
    referralCount: 30,
    availableDays: ["Tue", "Thu", "Sat"],
    referralNotes: []
  },
  {
    name: "Dr. Huda Al-Abadi",
    specialty: "Obstetrics and Gynecology",
    phoneNumber: "07829876543",
    clinicAddress: "Al-Jadriya, Baghdad",
    mapLocation: "",
    clinicCardImageUrl: "",
    isPartner: false,
    referralCount: 22,
    availableDays: ["Sun", "Wed"],
    referralNotes: []
  },
  {
    name: "Dr. Ibrahim Al-Dulaimi",
    specialty: "Urology",
    phoneNumber: "07923344556",
    clinicAddress: "Amiriyah, Baghdad",
    mapLocation: "",
    clinicCardImageUrl: "",
    isPartner: true,
    referralCount: 18,
    availableDays: ["Mon", "Fri"],
    referralNotes: []
  },
  {
    name: "Dr. Mariam Al-Yasiri",
    specialty: "Ophthalmology",
    phoneNumber: "07734567890",
    clinicAddress: "Palestine Street, Baghdad",
    mapLocation: "",
    clinicCardImageUrl: "",
    isPartner: false,
    referralCount: 11,
    availableDays: ["Tue", "Wed", "Thu"],
    referralNotes: []
  },
  {
    name: "Dr. Khalid Al-Amiri",
    specialty: "ENT",
    phoneNumber: "07830987654",
    clinicAddress: "Al-Saydiya, Baghdad",
    mapLocation: "",
    clinicCardImageUrl: "",
    isPartner: true,
    referralCount: 9,
    availableDays: ["Sat", "Tue"],
    referralNotes: []
  },
  {
    name: "Dr. Zainab Al-Rubaie",
    specialty: "Internal Medicine",
    phoneNumber: "07934455667",
    clinicAddress: "Al-Dora, Baghdad",
    mapLocation: "",
    clinicCardImageUrl: "",
    isPartner: false,
    referralCount: 14,
    availableDays: ["Sun", "Mon", "Wed"],
    referralNotes: []
  },
  ...Array.from({ length: 138 }, (_, i) => {
    const firstName = ["Dr. Mohammed", "Dr. Fatima", "Dr. Ali", "Dr. Zahra", "Dr. Hassan", "Dr. Zainab", "Dr. Hussein", "Dr. Maryam", "Dr. Mustafa", "Dr. Noor"][i % 10];
    const lastName = ["Al-Iraqi", "Al-Baghdadi", "Al-Mosuli", "Al-Basri", "Al-Najafi", "Al-Karbalai", "Al-Hilli", "Al-Ramadi", "Al-Tikriti", "Al-Diyali"][Math.floor(i / 10) % 10];
    
    return {
        name: `${firstName} ${lastName} ${i + 1}`,
        specialty: getRandomSpecialty(),
        phoneNumber: `07${Math.floor(700000000 + Math.random() * 299999999)}`,
        clinicAddress: `District ${i+1}, Baghdad`,
        mapLocation: "",
        clinicCardImageUrl: "",
        isPartner: Math.random() > 0.5,
        referralCount: Math.floor(Math.random() * 30),
        availableDays: ["Sat", "Mon", "Wed"],
        referralNotes: []
    }
  })
];
