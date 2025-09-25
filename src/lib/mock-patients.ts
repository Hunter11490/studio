import { Patient } from '@/types';
import { MOCK_DOCTORS } from './mock-doctors';

const firstNames = ["محمد", "فاطمة", "علي", "زهراء", "حسن", "زينب", "حسين", "مريم", "مصطفى", "نور", "أحمد", "آية", "إبراهيم", "سارة", "يوسف", "هدى"];
const lastNames = ["الجميلي", "الزبيدي", "الحداد", "الخفاجي", "التكريتي", "الشمري", "الساعدي", "العبادي", "الدليمي", "الياسري", "العامري", "الربيعي"];

const governorates = ["بغداد", "البصرة", "نينوى", "أربيل", "الأنبار", "كربلاء", "كركوك", "النجف", "ذي قار", "ديالى"];
const departments = [
  'internalMedicine', 'generalSurgery', 'obGyn', 'pediatrics', 'orthopedics', 'urology', 'ent', 'ophthalmology', 'dermatology', 'cardiology', 'neurology', 'oncology', 'nephrology',
];

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generateRandomDate = (start: Date, end: Date): Date => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const createMockPatient = (i: number, doctors: Omit<Doctor, 'id' | 'createdAt'>[]): Patient => {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    
    const createdAtDate = generateRandomDate(lastWeek, today);

    const dobYear = 1950 + Math.floor(Math.random() * 60);
    const dobMonth = 1 + Math.floor(Math.random() * 12);
    const dobDay = 1 + Math.floor(Math.random() * 28);

    const assignedDepartment = getRandomElement(departments);
    const doctorsInDept = doctors.filter(d => d.specialty.toLowerCase().replace(/ /g, '') === assignedDepartment.toLowerCase());
    const randomDoctor = doctorsInDept.length > 0 ? getRandomElement(doctorsInDept) : getRandomElement(doctors);
    
    // We need a temporary unique ID for the doctor to link them before they get real IDs. Let's use their name.
    const doctorId = randomDoctor.name;

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
            region: `منطقة ${i % 10 + 1}`,
            mahalla: String(100 + i % 100),
            zuqaq: String(1 + i % 50),
            dar: String(1 + i % 100),
        },
        department: assignedDepartment,
        doctorId: doctorId, // Link by name initially
        createdAt: createdAtDate.toISOString(),
    };
};

export const generateInitialData = () => {
    const doctorsWithTempId = MOCK_DOCTORS.map((doc, index) => ({
      ...doc,
      id: `temp_doctor_id_${index}_${doc.name}` // Assign a temporary but unique ID
    }));

    const patients = Array.from({ length: 500 }, (_, i) => createMockPatient(i, doctorsWithTempId));
    
    patients.forEach(patient => {
        if (patient.doctorId) { // doctorId here is the name
            const doctorIndex = doctorsWithTempId.findIndex(d => d.name === patient.doctorId);
            if (doctorIndex !== -1) {
                doctorsWithTempId[doctorIndex].referralCount++;

                if (!doctorsWithTempId[doctorIndex].referralNotes) {
                    doctorsWithTempId[doctorIndex].referralNotes = [];
                }
                
                doctorsWithTempId[doctorIndex].referralNotes!.push({
                    patientName: patient.patientName,
                    referralDate: patient.receptionDate,
                    testDate: new Date().toISOString().split('T')[0],
                    testType: 'فحص أولي',
                    patientAge: String(new Date().getFullYear() - parseInt(patient.dob.year)),
                    chronicDiseases: 'لا يوجد'
                });

                // Update patient's doctorId to the temporary ID
                patient.doctorId = doctorsWithTempId[doctorIndex].id;
            } else {
                 patient.doctorId = undefined;
            }
        }
    });

    return { doctors: doctorsWithTempId, patients };
};
