import { Doctor } from '@/types';

export const exportDataFile = (doctors: Doctor[], fileName: string) => {
  try {
    const jsonData = JSON.stringify(doctors, null, 2); // Pretty print JSON
    const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const finalFileName = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
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
    if (!file.name.endsWith('.json')) {
      return reject(new Error("Invalid file type. Please select a .json backup file."));
    }
      
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        if (!event.target?.result) {
            throw new Error("File could not be read.");
        }
        const fileContent = event.target.result as string;

        const importedData: any[] = JSON.parse(fileContent);

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
