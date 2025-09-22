import * as XLSX from 'xlsx';

// This type is generic for any kind of data we want to export.
type ExportData = {
    [key: string]: string | number | boolean | null | undefined;
};

export const exportToExcel = (data: ExportData[], fileName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    
    if (data.length > 0) {
      // Auto-fit columns
      const colWidths = Object.keys(data[0]).map(key => {
        const titleWidth = key.length;
        const dataWidths = data.map(row => String(row[key] || '').length);
        const maxWidth = Math.max(titleWidth, ...dataWidths);
        return { wch: Math.min(maxWidth + 2, 60) }; // Add padding, max width 60
      });
      worksheet["!cols"] = colWidths;
    }

    const finalFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
    XLSX.writeFile(workbook, finalFileName);
};
