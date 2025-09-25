import { Patient } from '@/types';
import { MOCK_DOCTORS } from './mock-doctors';

const firstNames = ["Mohammed", "Fatima", "Ali", "Zahra", "Hassan", "Zainab", "Hussein", "Maryam", "Mustafa", "Noor", "Ahmed", "Aya", "Ibrahim", "Sara", "Yusuf", "Huda"];
const lastNames = ["Al-Jumaily", "Al-Zubaidi", "Al-Haddad", "Al-Khafaji", "Al-Tikriti", "Al-Shammari", "Al-Saadi", "Al-Abadi", "Al-Dulaimi", "Al-Yasiri"];
const governorates = ["Baghdad", "Basra", "Nineveh", "Erbil", "Anbar", "Karbala", "Kirkuk", "Najaf", "Dhi Qar", "Diyala"];
const departments = [
  'internalMedicine', 'generalSurgery', 'obGyn', 'pediatrics', 'orthopedics', 'urology', 'ent', 'ophthalmology', 'dermatology', 'cardiology', 'neurology', 'oncology', 'nephrology',
];

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generateRandomDate = (start: Date, end: Date): Date => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const createMockPatient = (i: number): Patient => {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    
    const createdAtDate = generateRandomDate(lastWeek, today);

    // Generate random DOB
    const dobYear = 1950 + Math.floor(Math.random() * 60);
    const dobMonth = 1 + Math.floor(Math.random() * 12);
    const dobDay = 1 + Math.floor(Math.random() * 28);

    const randomDoctor = getRandomElement(MOCK_DOCTORS);
    const doctorId = MOCK_DOCTORS.find(d => d.name === randomDoctor.name) ? `mock-id-${randomDoctor.name}` : undefined;


    return {
        id: `mock_patient_${Date.now()}_${i}`,
        patientName: `${getRandomElement(firstNames)} ${getRandomElement(lastNames)}`,
        dob: {
            day: String(dobDay),
            month: String(dobMonth),
            year: String(dobYear)
        },
        receptionDate: createdAtDate.toISOString().split('T')[0],
        address: {
            governorate: getRandomElement(governorates),
            region: `Region ${i % 10 + 1}`,
            mahalla: String(100 + i % 100),
            zuqaq: String(1 + i % 50),
            dar: String(1 + i % 100),
        },
        department: getRandomElement(departments),
        doctorId: MOCK_DOCTORS[i % MOCK_DOCTORS.length].name, // Assign to a doctor
        createdAt: createdAtDate.toISOString(),
    };
};


export const MOCK_PATIENTS: Patient[] = Array.from({ length: 500 }, (_, i) => createMockPatient(i));

// Add referrals to mock doctors based on mock patients
MOCK_PATIENTS.forEach(patient => {
    const assignedDoctorName = patient.doctorId;
    if (assignedDoctorName) {
        const doctorIndex = MOCK_DOCTORS.findIndex(d => d.name === assignedDoctorName);
        if (doctorIndex !== -1) {
            MOCK_DOCTORS[doctorIndex].referralCount++;
            
            if (!MOCK_DOCTORS[doctorIndex].referralNotes) {
                MOCK_DOCTORS[doctorIndex].referralNotes = [];
            }
            
            MOCK_DOCTORS[doctorIndex].referralNotes!.push({
                patientName: patient.patientName,
                referralDate: patient.receptionDate,
                testDate: new Date().toISOString().split('T')[0],
                testType: 'Initial Checkup',
                patientAge: String(new Date().getFullYear() - parseInt(patient.dob.year)),
                chronicDiseases: 'None'
            });
        }
    }
});
