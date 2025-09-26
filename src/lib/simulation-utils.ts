'use client';

import { Doctor, Patient, FinancialRecord, TriageLevel, VitalSigns, ServiceRequest, InstrumentSet } from '@/types';

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
const serviceDepartments = ['surgicalOperations', 'icu', 'emergency', 'radiology', 'laboratories', 'reception', 'pharmacy'];
const requestTypes: ServiceRequest['type'][] = ['maintenance', 'cleaning', 'catering'];
const requestDescriptions = {
    maintenance: ['AC unit not working', 'Leaking faucet', 'Power outlet faulty', 'Bed mechanism broken'],
    cleaning: ['Spill cleanup required', 'Standard room cleaning', 'Sanitization for procedure room'],
    catering: ['Special dietary meal needed', 'Extra meal for guest', 'Water bottle request']
};


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

const generateRandomVitals = (): VitalSigns => {
    return {
        heartRate: 60 + Math.floor(Math.random() * 40),
        bloodPressure: `${110 + Math.floor(Math.random() * 20)}/${70 + Math.floor(Math.random() * 15)}`,
        spo2: 95 + Math.floor(Math.random() * 5),
        temperature: 36.5 + Math.random()
    };
};

const generateRandomTriage = (): TriageLevel => {
    const rand = Math.random();
    if (rand < 0.1) return 'critical';
    if (rand < 0.3) return 'urgent';
    if (rand < 0.7) return 'stable';
    return 'minor';
};

export const createRandomPatient = (doctors: Doctor[]): Omit<Patient, 'id' | 'createdAt' | 'financialRecords'> => {
    const dobYear = 1960 + Math.floor(Math.random() * 50);
    const dobMonth = 1 + Math.floor(Math.random() * 12);
    const dobDay = 1 + Math.floor(Math.random() * 28);
    let department = getRandomElement(departments);

    let doctorId: string | undefined = undefined;
    const doctorsInDept = doctors.filter(d => d.specialty.toLowerCase().replace(/ /g, '') === department.toLowerCase());
    if (doctorsInDept.length > 0) {
        doctorId = getRandomElement(doctorsInDept).id;
    }
    
    // 20% chance to go to emergency
    if (Math.random() < 0.2) {
      department = 'emergency';
    }
    
    const patientData: Omit<Patient, 'id' | 'createdAt' | 'financialRecords'> = {
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
    
    if (department === 'emergency') {
      patientData.triageLevel = generateRandomTriage();
      patientData.status = 'Waiting';
      patientData.vitalSigns = generateRandomVitals();
    }
    
    return patientData;
};

export const createRandomServiceRequest = (): ServiceRequest => {
  const type = getRandomElement(requestTypes);
  return {
    id: `service_req_${Date.now()}_${Math.random()}`,
    type: type,
    description: getRandomElement(requestDescriptions[type]),
    department: getRandomElement(serviceDepartments),
    status: 'new',
    createdAt: new Date().toISOString(),
  };
};

export const moveInstrumentSet = (currentStatus: InstrumentSet['status']): InstrumentSet['status'] => {
  switch (currentStatus) {
    case 'cleaning':
      return 'packaging';
    case 'packaging':
      return 'sterilizing';
    case 'sterilizing':
      return 'storage';
    case 'storage':
      return 'cleaning'; // Cycle back
    default:
      return 'cleaning';
  }
};
