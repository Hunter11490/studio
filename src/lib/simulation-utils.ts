'use client';

import { Doctor, Patient, FinancialRecord } from '@/types';
import { usePatients } from '@/hooks/use-patients';

const arabicFirstNames = ["د. جاسم", "د. كريم", "د. سعيد", "د. رنا", "د. آلاء", "د. بلال", "د. سندس", "د. ليث", "د. غيث", "د. سارة"];
const arabicLastNames = ["العاني", "البياتي", "الحمداني", "الجبوري", "الكبيسي", "الأسدي", "المالكي", "الزبيدي", "الدليمي"];
const medicalSpecialties = [
    "Internal Medicine", "General Surgery", "Obstetrics and Gynecology", "Pediatrics", "Orthopedics",
    "Urology", "ENT", "Ophthalmology", "Dermatology", "Cardiology", "Neurology",
    "Oncology", "Nephrology"
];
const departments = [
  'internalMedicine', 'generalSurgery', 'obGyn', 'pediatrics', 'orthopedics', 'urology', 'ent', 'ophthalmology', 'dermatology', 'cardiology', 'neurology', 'oncology', 'nephrology', 'laboratories', 'pharmacy'
];

const patientFirstNames = ["علي", "محمد", "حسن", "حسين", "فاطمة", "زينب", "مريم", "نور", "عباس", "حيدر"];
const patientLastNames = ["الساعدي", "العبيدي", "الطائي", "اللامي", "الكعبي", "الركابي", "الخالدي", "الموسوي", "الجنابي"];
const governorates = ["بغداد", "البصرة", "نينوى", "أربيل", "الأنبار", "كربلاء", "كركوك", "النجف", "ذي قار", "ديالى"];

const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const createRandomDoctor = (): Omit<Doctor, 'id' | 'createdAt'> => {
  return {
    name: `${getRandomElement(arabicFirstNames)} ${getRandomElement(arabicLastNames)}`,
    specialty: getRandomElement(medicalSpecialties),
    phoneNumber: `07${Math.floor(700000000 + Math.random() * 299999999)}`,
    clinicAddress: `منطقة عشوائية, ${getRandomElement(governorates)}`,
    mapLocation: "",
    clinicCardImageUrl: "",
    isPartner: Math.random() > 0.7,
    referralCount: Math.floor(Math.random() * 5),
    availableDays: ["Sat", "Mon", "Wed"],
    referralNotes: []
  };
};

export const createRandomPatient = (doctors: Doctor[]): Omit<Patient, 'id' | 'createdAt' | 'financialRecords'> => {
    const dobYear = 1960 + Math.floor(Math.random() * 50);
    const dobMonth = 1 + Math.floor(Math.random() * 12);
    const dobDay = 1 + Math.floor(Math.random() * 28);
    const department = getRandomElement(departments);

    let doctorId: string | undefined = undefined;
    const doctorsInDept = doctors.filter(d => d.specialty.toLowerCase().replace(/ /g, '') === department.toLowerCase());
    if (doctorsInDept.length > 0) {
        doctorId = getRandomElement(doctorsInDept).id;
    }

    return {
        patientName: `${getRandomElement(patientFirstNames)} ${getRandomElement(patientLastNames)}`,
        dob: {
            day: String(dobDay),
            month: String(dobMonth),
            year: String(dobYear)
        },
        receptionDate: new Date().toISOString().split('T')[0],
        address: {
            governorate: getRandomElement(governorates),
            region: `حي عشوائي`,
            mahalla: String(100 + Math.floor(Math.random() * 899)),
            zuqaq: String(1 + Math.floor(Math.random() * 99)),
            dar: String(1 + Math.floor(Math.random() * 99)),
        },
        department,
        doctorId,
    };
};
