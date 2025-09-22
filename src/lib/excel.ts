import * as XLSX from 'xlsx';

// This type is generic for any kind of data we want to export.
type ExportData = {
    [key: string]: string | number;
};

export const exportToExcel = (data: ExportData[], fileName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Doctors');
    
    // Auto-fit columns
    const max_width = data.reduce((w, r) => Math.max(w, ...Object.values(r).map(val => String(val).length)), 10);
    worksheet["!cols"] = Object.keys(data[0]).map(() => ({ wch: max_width }));

    XLSX.writeFile(workbook, fileName);
};
