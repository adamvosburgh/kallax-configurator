/**
 * Utility functions for downloading files
 */

export function downloadFile(data: string | Uint8Array, filename: string, mimeType: string) {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function downloadJSON(data: any, filename: string) {
  const jsonString = JSON.stringify(data, null, 2);
  downloadFile(jsonString, filename, 'application/json');
}

export function downloadCSV(data: string, filename: string) {
  downloadFile(data, filename, 'text/csv');
}

export function downloadPDF(data: Uint8Array, filename: string) {
  downloadFile(data, filename, 'application/pdf');
}