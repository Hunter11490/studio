import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Doctor } from '@/types';

type DoctorExport = {
  'الاسم': string;
  'التخصص': string;
  'رقم الهاتف': string;
  'عنوان العيادة': string;
  'رابط الخريطة': string;
  'شريك': boolean;
  'عدد الإحالات': number;
  'العمولة': number;
  'أيام التواجد': string;
};

export const exportToExcel = (data: Doctor[], fileName: string) => {
  const simplifiedData: DoctorExport[] = data.map(doc => ({
    'الاسم': doc.name,
    'التخصص': doc.specialty,
    'رقم الهاتف': doc.phoneNumber,
    'عنوان العيادة': doc.clinicAddress,
    'رابط الخريطة': doc.mapLocation,
    'شريك': doc.isPartner,
    'عدد الإحالات': doc.referralCount,
    'العمولة': doc.referralCount * 100,
    'أيام التواجد': doc.availableDays.join(', '),
  }));

  const worksheet = XLSX.utils.json_to_sheet(simplifiedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'الأطباء');

  // Set column widths
  const columnWidths = [
    { wch: 30 }, // الاسم
    { wch: 20 }, // التخصص
    { wch: 15 }, // رقم الهاتف
    { wch: 40 }, // عنوان العيادة
    { wch: 30 }, // رابط الخريطة
    { wch: 10 }, // شريك
    { wch: 10 }, // عدد الإحالات
    { wch: 12 }, // العمولة
    { wch: 25 }, // أيام التواجد
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
          name: row['الاسم'] || row.name || '',
          specialty: row['التخصص'] || row.specialty || '',
          phoneNumber: String(row['رقم الهاتف'] || row.phoneNumber || ''),
          clinicAddress: row['عنوان العيادة'] || row.clinicAddress || '',
          mapLocation: row['رابط الخريطة'] || row.mapLocation || '',
          isPartner: row['شريك'] === true || String(row.isPartner).toLowerCase() === 'true',
          referralCount: Number(row['عدد الإحالات'] || row.referralCount) || 0,
          availableDays: typeof row['أيام التواجد'] === 'string' ? row['أيام التواجد'].split(',').map(d => d.trim()) : (typeof row.availableDays === 'string' ? row.availableDays.split(',').map(d => d.trim()) : []),
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
