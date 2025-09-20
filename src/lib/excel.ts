import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Doctor } from '@/types';

type GenericExport = {
  [key: string]: string | number | boolean;
}

export const exportToExcel = (data: GenericExport[], fileName:string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  // Auto-calculate column widths
  if (data.length > 0) {
    const headers = Object.keys(data[0]);
    const columnWidths = headers.map(header => {
      const maxLength = Math.max(
        header.length,
        ...data.map(row => String(row[header] ?? '').length)
      );
      return { wch: maxLength + 2 }; // +2 for padding
    });
    worksheet['!cols'] = columnWidths;
  }

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
