import * as XLSX from 'xlsx';

export interface ShippingDataRow {
  month: string;
  year1: {
    box: number | null;
    teus: number | null;
  };
  year2Budget: {
    box: number | null;
    teus: number | null;
  };
  year2Actual: {
    box: number | null;
    teus: number | null;
  };
}

export interface ParsedExcelData {
  data: ShippingDataRow[];
  periods: {
    year1Label: string;
    year2BudgetLabel: string;
    year2ActualLabel: string;
  };
}

/**
 * Parse Excel file from fixed range C29:H40
 * @param file - Excel file buffer
 * @param sheetName - Optional sheet name (defaults to "Chart_Actual VS Budget")
 * @returns Parsed shipping data
 */
export async function parseExcelFile(
  file: Buffer,
  targetSheetName: string = 'Chart_Actual VS Budget'
): Promise<ParsedExcelData> {
  // Read the workbook
  const workbook = XLSX.read(file, { type: 'buffer' });

  const sheetName = workbook.SheetNames.find(
    (name) => name === targetSheetName || name.trim() === targetSheetName
  );

  if (!sheetName) {
    throw new Error(`Sheet "${targetSheetName}" not found in workbook`);
  }

  const worksheet = workbook.Sheets[sheetName];

  // Extract period labels from specific cells (e.g., "2024 Actual", "2025 Budget", "2025 Actual")
  const year1Cell = worksheet['C27'];
  const year2BudgetCell = worksheet['E27'];
  const year2ActualCell = worksheet['G27'];

  const year1Label = year1Cell?.v || 'Year 1 Actual';
  const year2BudgetLabel = year2BudgetCell?.v || 'Year 2 Budget';
  const year2ActualLabel = year2ActualCell?.v || 'Year 2 Actual';

  const range = XLSX.utils.decode_range('C29:H40');

  const data: ShippingDataRow[] = [];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  let rowIndex = 0;

  for (let row = range.s.r; row <= range.e.r; row++) {
    if (rowIndex >= months.length) break;

    const rowData: ShippingDataRow = {
      month: months[rowIndex],
      year1: { box: null, teus: null },
      year2Budget: { box: null, teus: null },
      year2Actual: { box: null, teus: null },
    };

    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];

      if (!cell) continue;

      const colIndex = col - range.s.c;

      switch (colIndex) {
        case 0:
          rowData.year1.box = cell.v !== undefined && !isNaN(cell.v) ? Math.round(Number(cell.v)) : null;
          break;

        case 1:
          rowData.year1.teus = cell.v !== undefined && !isNaN(cell.v) ? Math.round(Number(cell.v)) : null;
          break;

        case 2:
          rowData.year2Budget.box = cell.v !== undefined && !isNaN(cell.v) ? Math.round(Number(cell.v)) : null;
          break;

        case 3:
          rowData.year2Budget.teus = cell.v !== undefined && !isNaN(cell.v) ? Math.round(Number(cell.v)) : null;
          break;

        case 4:
          rowData.year2Actual.box = cell.v !== undefined && !isNaN(cell.v) ? Math.round(Number(cell.v)) : null;
          break;

        case 5:
          rowData.year2Actual.teus = cell.v !== undefined && !isNaN(cell.v) ? Math.round(Number(cell.v)) : null;
          break;
      }
    }

    data.push(rowData);
    rowIndex++;
  }

  return {
    data,
    periods: {
      year1Label,
      year2BudgetLabel,
      year2ActualLabel,
    },
  };
}

/**
 * Validate parsed data
 */
export function validateShippingData(data: ParsedExcelData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.data || data.data.length === 0) {
    errors.push('No data found in Excel file');
    return { isValid: false, errors };
  }

  // Check for required months
  const requiredMonths = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  const foundMonths = data.data.map((d) => d.month.toUpperCase());

  requiredMonths.forEach((month) => {
    const found = foundMonths.some((m) => m.includes(month));
    if (!found) {
      // Not a critical error - some months might be empty
      console.warn(`Month ${month} not found in data`);
    }
  });

  // Validate numeric values
  data.data.forEach((row, index) => {
    if (row.year1.box && row.year1.box < 0) {
      errors.push(`Row ${index + 1}: Year 1 Actual BOX value cannot be negative`);
    }
    if (row.year1.teus && row.year1.teus < 0) {
      errors.push(`Row ${index + 1}: Year 1 Actual TEUS value cannot be negative`);
    }
    if (row.year2Budget.box && row.year2Budget.box < 0) {
      errors.push(`Row ${index + 1}: Year 2 Budget BOX value cannot be negative`);
    }
    if (row.year2Budget.teus && row.year2Budget.teus < 0) {
      errors.push(`Row ${index + 1}: Year 2 Budget TEUS value cannot be negative`);
    }
    if (row.year2Actual.box && row.year2Actual.box < 0) {
      errors.push(`Row ${index + 1}: Year 2 Actual BOX value cannot be negative`);
    }
    if (row.year2Actual.teus && row.year2Actual.teus < 0) {
      errors.push(`Row ${index + 1}: Year 2 Actual TEUS value cannot be negative`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
