import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Doctor } from '@/types';

type DoctorExport = Omit<Doctor, 'id' | 'createdAt' | 'clinicCardImageUrl' | 'availableDays'> & {
  availableDays: string;
};

export const exportToExcel = (data: Doctor[], fileName: string) => {
  const simplifiedData: DoctorExport[] = data.map(doc => ({
    name: doc.name,
    specialty: doc.specialty,
    phoneNumber: doc.phoneNumber,
    clinicAddress: doc.clinicAddress,
    mapLocation: doc.mapLocation,
    isPartner: doc.isPartner,
    referralCount: doc.referralCount,
    availableDays: doc.availableDays.join(', '),
  }));

  const worksheet = XLSX.utils.json_to_sheet(simplifiedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Doctors');

  // Set column widths
  const columnWidths = [
    { wch: 30 }, // name
    { wch: 20 }, // specialty
    { wch: 15 }, // phoneNumber
    { wch: 40 }, // clinicAddress
    { wch: 30 }, // mapLocation
    { wch: 10 }, // isPartner
    { wch: 10 }, // referralCount
    { wch: 25 }, // availableDays
  ];
  worksheet['!cols'] = columnWidths;

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(blob, fileName);
};

export const importFromExcel = (file: File): Promise<Partial<Doctor>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);
        
        const doctors: Partial<Doctor>[] = json.map(row => ({
          name: row.name || '',
          specialty: row.specialty || '',
          phoneNumber: String(row.phoneNumber || ''),
          clinicAddress: row.clinicAddress || '',
          mapLocation: row.mapLocation || '',
          isPartner: row.isPartner === true || String(row.isPartner).toLowerCase() === 'true',
          referralCount: Number(row.referralCount) || 0,
          availableDays: typeof row.availableDays === 'string' ? row.availableDays.split(',').map(d => d.trim()) : [],
        }));
        
        resolve(doctors.filter(d => d.name));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};
