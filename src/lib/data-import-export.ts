import { saveAs } from 'file-saver';
import { Doctor } from '@/types';

export const exportDataFile = (doctors: Doctor[], fileName: string) => {
  try {
    const dataString = JSON.stringify(doctors, null, 2);
    const blob = new Blob([dataString], { type: 'application/json;charset=utf-8' });
    saveAs(blob, fileName);
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
