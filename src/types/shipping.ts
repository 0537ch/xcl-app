/**
 * Shipping data related types
 */

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

export interface ShippingData {
  month: string;
  [key: string]: number | null | string;
}

export interface ShippingRecord {
  id?: number;
  month: string;
  period: string;
  box: number | null;
  teus: number | null;
  upload_id?: number;
}

export interface ParsedShippingDataRow {
  month: string;
  year1: { box: number | null; teus: number | null };
  year2Budget: { box: number | null; teus: number | null };
  year2Actual: { box: number | null; teus: number | null };
}

export interface ParsedExcelData {
  data: ParsedShippingDataRow[];
  periods: {
    year1Label: string;
    year2BudgetLabel: string;
    year2ActualLabel: string;
  };
}

export interface ShippingDataFilters {
  year?: number;
  dataType?: 'actual' | 'budget';
  month?: string;
}

export interface YearGroup {
  year: string;
  type: string;
  boxKey: string;
  teusKey: string;
  label: string;
}

export type Month =
  | 'January'
  | 'February'
  | 'March'
  | 'April'
  | 'May'
  | 'June'
  | 'July'
  | 'August'
  | 'September'
  | 'October'
  | 'November'
  | 'December';
