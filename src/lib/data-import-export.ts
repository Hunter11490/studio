import { Doctor } from '@/types';
import { encryptData, decryptData } from './encryption';

export const exportDataFile = (doctors: Doctor[], fileName: string) => {
  try {
    const jsonData = JSON.stringify(doctors);
    const encryptedData = encryptData(jsonData);

    const blob = new Blob([encryptedData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const finalFileName = fileName.endsWith('.spirit') ? fileName : `${fileName}.spirit`;
    link.download = finalFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error("Error exporting data:", error);
    return false;
  }
};


export const importDataFile = (file: File): Promise<Doctor[]> => {
  return new Promise((resolve, reject) => {
    if (!file.name.endsWith('.spirit')) {
      return reject(new Error("Invalid file type. Please select a .spirit backup file."));
    }
      
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        if (!event.target?.result) {
            throw new Error("File could not be read.");
        }
        const encryptedData = event.target.result as string;
        const decryptedJson = decryptData(encryptedData);

        if (!decryptedJson) {
            throw new Error("Decryption failed. The file may be corrupt or the key incorrect.");
        }

        const importedData: any[] = JSON.parse(decryptedJson);

        if (!Array.isArray(importedData)) {
            throw new Error("Imported data is not in a valid format.");
        }

        const validDoctors: Doctor[] = importedData.map((d: any): Doctor | null => {
            if (!d.id || !d.name) {
                console.warn(`Skipping invalid doctor entry in file: ${JSON.stringify(d)}`);
                return null;
            }
            
            return {
               id: String(d.id),
               name: String(d.name),
               specialty: d.specialty || '',
               phoneNumber: d.phoneNumber || '',
               clinicAddress: d.clinicAddress || '',
               mapLocation: d.mapLocation || '',
               clinicCardImageUrl: d.clinicCardImageUrl || '',
               isPartner: d.isPartner === true || d.isPartner === 'true',
               referralCount: Number(d.referralCount) || 0,
               referralNotes: d.referralNotes || [],
               availableDays: d.availableDays || [],
               createdAt: d.createdAt || new Date().toISOString()
            };
        }).filter((d): d is Doctor => d !== null);
        
        resolve(validDoctors);
      } catch (error) {
        console.error("Error parsing imported file:", error);
        reject(new Error("File is not valid or is corrupted."));
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};
