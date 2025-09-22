import { saveAs } from 'file-saver';
import { Doctor } from '@/types';

export const exportDataFile = (doctors: Doctor[], fileName: string) => {
  const dataString = JSON.stringify(doctors, null, 2);
  const blob = new Blob([dataString], { type: 'application/json' });
  saveAs(blob, fileName);
};

export const importDataFile = (file: File): Promise<Doctor[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const fileContent = event.target?.result as string;
        const importedDoctors: Doctor[] = JSON.parse(fileContent);

        // Basic validation
        if (!Array.isArray(importedDoctors)) {
            throw new Error("Imported file is not a valid array of doctors.");
        }

        // Filter out any potential invalid entries
        const validDoctors = importedDoctors.filter(d => d.id && d.name);

        resolve(validDoctors);
      } catch (error) {
        console.error("Error parsing imported file:", error);
        reject(new Error("File is not a valid format."));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};
