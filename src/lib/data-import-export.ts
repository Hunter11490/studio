import { Doctor } from '@/types';
import * as XLSX from 'xlsx';

export const exportDataFile = (doctors: Doctor[], fileName: string) => {
  try {
    const dataToExport = doctors.map(d => ({
      id: d.id,
      name: d.name,
      specialty: d.specialty,
      phoneNumber: d.phoneNumber,
      clinicAddress: d.clinicAddress,
      mapLocation: d.mapLocation,
      isPartner: d.isPartner,
      referralCount: d.referralCount,
      availableDays: d.availableDays.join(','),
      createdAt: d.createdAt,
      // We stringify complex objects for backup.
      // clinicCardImageUrl is too long for Excel cells, so we omit it.
      referralNotes: JSON.stringify(d.referralNotes || []),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Doctors');
    XLSX.writeFile(workbook, fileName.replace('.data', '.xlsx')); // Export as xlsx for clarity
    return true;
  } catch (error) {
    console.error("Error exporting data:", error);
    return false;
  }
};

export const importDataFile = (file: File): Promise<Doctor[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const fileContent = event.target?.result as string;
        if (!fileContent) {
          throw new Error("File is empty.");
        }
        const importedData: any[] = JSON.parse(fileContent);

        if (!Array.isArray(importedData)) {
            throw new Error("Imported file is not a valid JSON array.");
        }

        const validDoctors = importedData.filter(d => 
            d && typeof d === 'object' && d.id && typeof d.id === 'string' && d.name && typeof d.name === 'string'
        ).map((d: any): Doctor => ({
           id: d.id,
           name: d.name,
           specialty: d.specialty || '',
           phoneNumber: d.phoneNumber || '',
           clinicAddress: d.clinicAddress || '',
           mapLocation: d.mapLocation || '',
           clinicCardImageUrl: d.clinicCardImageUrl || '',
           isPartner: d.isPartner || false,
           referralCount: d.referralCount || 0,
           referralNotes: d.referralNotes || [],
           availableDays: d.availableDays || [],
           createdAt: d.createdAt || new Date().toISOString()
        }));
        
        resolve(validDoctors);
      } catch (error) {
        console.error("Error parsing imported file:", error);
        reject(new Error("File is not a valid format or is corrupted."));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file, 'UTF-8');
  });
};
