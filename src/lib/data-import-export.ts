import { Doctor } from '@/types';
import * as XLSX from 'xlsx';

// Note: This function now exports as a proper .xlsx file.
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
      availableDays: (d.availableDays || []).join(','),
      createdAt: d.createdAt,
      referralNotes: JSON.stringify(d.referralNotes || '[]'),
      // Omit clinicCardImageUrl as it's too large for Excel and can corrupt the file.
      // It's not critical for a backup.
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Doctors');
    
    // Ensure the filename ends with .xlsx
    const finalFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
    XLSX.writeFile(workbook, finalFileName);
    
    return true;
  } catch (error) {
    console.error("Error exporting data:", error);
    return false;
  }
};


// Note: This function now imports from an .xlsx file, not a .json or .data file.
export const importDataFile = (file: File): Promise<Doctor[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        if (!event.target?.result) {
            throw new Error("File could not be read.");
        }
        const data = new Uint8Array(event.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const importedData: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!Array.isArray(importedData)) {
            throw new Error("Imported data is not in a valid format.");
        }

        const validDoctors: Doctor[] = importedData.map((d: any): Doctor => {
            // Basic validation
            if (!d.id || !d.name) {
                throw new Error(`Invalid doctor entry found in file: ${JSON.stringify(d)}`);
            }
            
            let referralNotes = [];
            try {
                // Safely parse referral notes
                if (d.referralNotes) {
                    const parsedNotes = JSON.parse(d.referralNotes);
                    if (Array.isArray(parsedNotes)) {
                        referralNotes = parsedNotes;
                    }
                }
            } catch {
                referralNotes = []; // Default to empty array on parse error
            }

            return {
               id: String(d.id),
               name: String(d.name),
               specialty: d.specialty || '',
               phoneNumber: d.phoneNumber || '',
               clinicAddress: d.clinicAddress || '',
               mapLocation: d.mapLocation || '',
               clinicCardImageUrl: '', // Omitted during export, so empty on import
               isPartner: d.isPartner === true || d.isPartner === 'true',
               referralCount: Number(d.referralCount) || 0,
               referralNotes: referralNotes,
               availableDays: d.availableDays ? String(d.availableDays).split(',') : [],
               createdAt: d.createdAt || new Date().toISOString()
            };
        });
        
        resolve(validDoctors);
      } catch (error) {
        console.error("Error parsing imported file:", error);
        reject(new Error("File is not a valid Excel format or is corrupted."));
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
