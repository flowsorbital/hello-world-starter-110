import * as XLSX from 'xlsx';

export interface ParsedCsvData {
  headers: string[];
  rows: string[][];
  errors: string[];
  totalRows: number;
}

export interface ContactValidationResult {
  isValid: boolean;
  errors: string[];
  formattedPhone?: string;
}

/**
 * Validates and formats a phone number
 */
export function validateAndFormatPhone(phone: string): ContactValidationResult {
  const errors: string[] = [];
  
  if (!phone || !phone.trim()) {
    return { isValid: false, errors: ['Phone number is required'] };
  }

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check length
  if (cleaned.length < 10) {
    errors.push('Phone number too short (minimum 10 digits)');
  } else if (cleaned.length > 15) {
    errors.push('Phone number too long (maximum 15 digits)');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Format phone number - add country code if missing
  let formattedPhone = cleaned;
  if (cleaned.length === 10) {
    // Assume US number, add country code
    formattedPhone = `1${cleaned}`;
  }

  return { 
    isValid: true, 
    errors: [], 
    formattedPhone 
  };
}

/**
 * Parses CSV content with proper quote handling
 */
export function parseCsvContent(content: string): string[][] {
  const lines = content.split('\n').filter(line => line.trim());
  const result: string[][] = [];

  for (const line of lines) {
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        row.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    
    // Add the last field
    row.push(current.trim());
    result.push(row);
  }

  return result;
}

/**
 * Parses various file formats (CSV, XLS, XLSX)
 */
export async function parseContactFile(file: File): Promise<ParsedCsvData> {
  const errors: string[] = [];
  
  try {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    let data: string[][];

    if (fileExtension === 'csv') {
      const text = await file.text();
      data = parseCsvContent(text);
    } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      // Convert all cells to strings
      data = rawData.map(row => 
        row.map(cell => cell !== null && cell !== undefined ? String(cell).trim() : '')
      );
    } else {
      throw new Error('Unsupported file format. Please use CSV, XLS, or XLSX files.');
    }

    if (data.length === 0) {
      throw new Error('File is empty');
    }

    const headers = data[0].map(h => String(h).trim()).filter(h => h);
    const rows = data.slice(1).filter(row => row.some(cell => String(cell).trim()));

    // Validate headers
    if (headers.length === 0) {
      errors.push('No valid headers found in the file');
    }

    // Check for duplicate headers
    const duplicateHeaders = headers.filter((header, index) => 
      headers.indexOf(header) !== index
    );
    if (duplicateHeaders.length > 0) {
      errors.push(`Duplicate headers found: ${duplicateHeaders.join(', ')}`);
    }

    return {
      headers,
      rows,
      errors,
      totalRows: rows.length
    };
  } catch (error) {
    return {
      headers: [],
      rows: [],
      errors: [error instanceof Error ? error.message : 'Failed to parse file'],
      totalRows: 0
    };
  }
}

/**
 * Suggests the best column for phone numbers based on header names
 */
export function suggestPhoneColumn(headers: string[]): number {
  const phoneKeywords = ['phone', 'mobile', 'cell', 'number', 'tel', 'telephone'];
  
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i].toLowerCase();
    if (phoneKeywords.some(keyword => header.includes(keyword))) {
      return i;
    }
  }
  
  // Default to first column if no phone-like header found
  return 0;
}

/**
 * Validates a batch of contacts
 */
export function validateContacts(
  rows: string[][], 
  headers: string[], 
  phoneColumnIndex: number
): { validContacts: any[], errors: string[] } {
  const validContacts: any[] = [];
  const errors: string[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because we skip header and arrays are 0-indexed
    const phone = String(row[phoneColumnIndex] || '').trim();
    
    if (!phone) {
      errors.push(`Row ${rowNumber}: Missing phone number`);
      return;
    }

    const phoneValidation = validateAndFormatPhone(phone);
    if (!phoneValidation.isValid) {
      errors.push(`Row ${rowNumber}: ${phoneValidation.errors.join(', ')}`);
      return;
    }

    const contact: any = {
      id: `import-${index}`,
      phone: phoneValidation.formattedPhone,
    };

    // Add other fields
    headers.forEach((header, headerIndex) => {
      if (headerIndex !== phoneColumnIndex && row[headerIndex]) {
        const value = String(row[headerIndex]).trim();
        if (value) {
          contact[header] = value;
        }
      }
    });

    validContacts.push(contact);
  });

  return { validContacts, errors };
}

/**
 * Generates a sample CSV template
 */
export function generateCsvTemplate(): string {
  const headers = ['phone', 'name', 'email', 'company', 'notes'];
  const sampleData = [
    ['1234567890', 'John Doe', 'john@example.com', 'Acme Corp', 'VIP customer'],
    ['9876543210', 'Jane Smith', 'jane@example.com', 'Tech Inc', 'Follow up needed'],
  ];

  const csvContent = [
    headers.join(','),
    ...sampleData.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Downloads a CSV template file
 */
export function downloadCsvTemplate(): void {
  const csvContent = generateCsvTemplate();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'contacts_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}