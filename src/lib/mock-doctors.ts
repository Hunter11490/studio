
import { Doctor } from '@/types';

// Specialties aligned with the main dashboard departments
const medicalSpecialties = [
    "Internal Medicine", "General Surgery", "Obstetrics and Gynecology", "Pediatrics", "Orthopedics",
    "Urology", "ENT", "Ophthalmology", "Dermatology", "Cardiology", "Neurology",
    "Oncology", "Nephrology", "Emergency Medicine", "Intensive Care Medicine"
];

const arabicFirstNames = [
    "د. أحمد", "د. علي", "د. يوسف", "د. عمر", "د. خالد", "د. محمد",
    "د. فاطمة", "د. ليلى", "د. نور", "د. هدى", "د. مريم", "د. زينب",
    "د. جاسم", "د. كريم", "د. سعيد", "د. رنا", "د. آلاء", "د. بلال"
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
  // Existing Doctors
  { name: "د. أحمد الجميلي", specialty: "Cardiology", phoneNumber: "07701234567", clinicAddress: "المنصور، بغداد", mapLocation: "", clinicCardImageUrl: "", isPartner: true, referralCount: 0, availableDays: ["Sat", "Mon", "Wed"], referralNotes: [] },
  { name: "د. فاطمة الزبيدي", specialty: "Dermatology", phoneNumber: "07807654321", clinicAddress: "الكرادة، بغداد", mapLocation: "", clinicCardImageUrl: "", isPartner: false, referralCount: 0, availableDays: ["Sun", "Tue", "Thu"], referralNotes: [] },
  { name: "د. يوسف الحداد", specialty: "Orthopedics", phoneNumber: "07901122334", clinicAddress: "الأعظمية، بغداد", mapLocation: "", clinicCardImageUrl: "", isPartner: true, referralCount: 0, availableDays: ["Sat", "Sun", "Mon", "Tue", "Wed"], referralNotes: [] },
  
  // New Emergency Doctors
  { name: "د. بلال الأنصاري", specialty: "Emergency Medicine", phoneNumber: "07751112233", clinicAddress: "مستشفى اليرموك التعليمي", mapLocation: "", clinicCardImageUrl: "", isPartner: false, referralCount: 0, availableDays: [], referralNotes: [] },
  { name: "د. رغد العبيدي", specialty: "Emergency Medicine", phoneNumber: "07852223344", clinicAddress: "مدينة الطب", mapLocation: "", clinicCardImageUrl: "", isPartner: false, referralCount: 0, availableDays: [], referralNotes: [] },

  // New ICU Doctors
  { name: "د. ليث الكبيسي", specialty: "Intensive Care Medicine", phoneNumber: "07953334455", clinicAddress: "قسم العناية المركزة", mapLocation: "", clinicCardImageUrl: "", isPartner: false, referralCount: 0, availableDays: [], referralNotes: [] },
  { name: "د. سندس الحمداني", specialty: "Intensive Care Medicine", phoneNumber: "07754445566", clinicAddress: "قسم العناية المركزة", mapLocation: "", clinicCardImageUrl: "", isPartner: false, referralCount: 0, availableDays: [], referralNotes: [] },

  // New Ward / Internal Medicine Doctors
  { name: "د. زينب الربيعي", specialty: "Internal Medicine", phoneNumber: "07934455667", clinicAddress: "ردهات الباطنية", mapLocation: "", clinicCardImageUrl: "", isPartner: false, referralCount: 0, availableDays: ["Sun", "Mon", "Wed"], referralNotes: [] },
  { name: "د. حسن الجنابي", specialty: "Internal Medicine", phoneNumber: "07741234567", clinicAddress: "ردهات الباطنية", mapLocation: "", clinicCardImageUrl: "", isPartner: true, referralCount: 0, availableDays: ["Sun", "Thu"], referralNotes: [] },

  // More existing doctors
  { name: "د. ليلى الخفاجي", specialty: "Pediatrics", phoneNumber: "07712345678", clinicAddress: "زيونة، بغداد", mapLocation: "", clinicCardImageUrl: "", isPartner: false, referralCount: 0, availableDays: ["Mon", "Wed", "Fri"], referralNotes: [] },
  { name: "د. عمر التكريتي", specialty: "Neurology", phoneNumber: "07818765432", clinicAddress: "اليرموك، بغداد", mapLocation: "", clinicCardImageUrl: "", isPartner: true, referralCount: 0, availableDays: ["Sun", "Tue"], referralNotes: [] },
  { name: "د. نور الشمري", specialty: "Oncology", phoneNumber: "07912233445", clinicAddress: "مدينة الطب، بغداد", mapLocation: "", clinicCardImageUrl: "", isPartner: false, referralCount: 0, availableDays: ["Mon", "Thu"], referralNotes: [] },
  { name: "د. علي الساعدي", specialty: "General Surgery", phoneNumber: "07723456789", clinicAddress: "الحارثية، بغداد", mapLocation: "", clinicCardImageUrl: "", isPartner: true, referralCount: 0, availableDays: ["Tue", "Thu", "Sat"], referralNotes: [] },
  { name: "د. هدى العبادي", specialty: "Obstetrics and Gynecology", phoneNumber: "07829876543", clinicAddress: "الجادرية، بغداد", mapLocation: "", clinicCardImageUrl: "", isPartner: false, referralCount: 0, availableDays: ["Sun", "Wed"], referralNotes: [] },
  { name: "د. إبراهيم الدليمي", specialty: "Urology", phoneNumber: "07923344556", clinicAddress: "العامرية، بغداد", mapLocation: "", clinicCardImageUrl: "", isPartner: true, referralCount: 0, availableDays: ["Mon", "Fri"], referralNotes: [] },
  { name: "د. مريم الياسري", specialty: "Ophthalmology", phoneNumber: "07734567890", clinicAddress: "شارع فلسطين، بغداد", mapLocation: "", clinicCardImageUrl: "", isPartner: false, referralCount: 0, availableDays: ["Tue", "Wed", "Thu"], referralNotes: [] },
  { name: "د. خالد العامري", specialty: "ENT", phoneNumber: "07830987654", clinicAddress: "السيدية، بغداد", mapLocation: "", clinicCardImageUrl: "", isPartner: true, referralCount: 0, availableDays: ["Sat", "Tue"], referralNotes: [] },
  { name: "د. آية العزاوي", specialty: "Cardiology", phoneNumber: "07847654321", clinicAddress: "الغزالية، بغداد", mapLocation: "", clinicCardImageUrl: "", isPartner: false, referralCount: 0, availableDays: ["Mon", "Wed"], referralNotes: [] },
  { name: "د. مصطفى الطائي", specialty: "Pediatrics", phoneNumber: "07941122334", clinicAddress: "حي الجامعة، بغداد", mapLocation: "", clinicCardImageUrl: "", isPartner: true, referralCount: 0, availableDays: ["Sat", "Tue", "Thu"], referralNotes: [] },
];
