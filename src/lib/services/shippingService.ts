import { getDb } from '@/lib/db';
import { ShippingDataRow, ParsedExcelData } from '@/lib/utils/excelParser';
import type { Sql } from 'postgres';

export interface ShippingRecord {
  id?: number;
  month: string;
  period: string;
  box: number | null;
  teus: number | null;
  upload_id?: number;
}

/**
 * Save parsed Excel data to database
 * Uses upsert to handle duplicates
 */
export async function saveShippingData(
  parsedData: ParsedExcelData,
  filename: string
): Promise<{ success: boolean; uploadId?: number; error?: string }> {
  try {
    const db = getDb();

    const [upload] = await db`
      INSERT INTO uploads (filename, total_rows, status)
      VALUES (${filename}, ${parsedData.data.length}, 'in_progress')
      RETURNING id
    `;

    const id = upload.id;

    for (const row of parsedData.data) {
      if (row.year1.box !== null || row.year1.teus !== null) {
        await db`
          INSERT INTO shipping_data (month, period, box, teus, upload_id)
          VALUES (${row.month}, ${parsedData.periods.year1Label}, ${row.year1.box}, ${row.year1.teus}, ${id})
        `;
      }

      if (row.year2Budget.box !== null || row.year2Budget.teus !== null) {
        await db`
          INSERT INTO shipping_data (month, period, box, teus, upload_id)
          VALUES (${row.month}, ${parsedData.periods.year2BudgetLabel}, ${row.year2Budget.box}, ${row.year2Budget.teus}, ${id})
        `;
      }

      if (row.year2Actual.box !== null || row.year2Actual.teus !== null) {
        await db`
          INSERT INTO shipping_data (month, period, box, teus, upload_id)
          VALUES (${row.month}, ${parsedData.periods.year2ActualLabel}, ${row.year2Actual.box}, ${row.year2Actual.teus}, ${id})
        `;
      }
    }

    await db`UPDATE uploads SET status = 'completed' WHERE id = ${id}`;

    return { success: true, uploadId: id };
  } catch (error) {
    console.error('Error saving shipping data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all shipping data with optional filters
 */
export async function getShippingData(filters?: {
  period?: string;
  month?: string;
}): Promise<ShippingRecord[]> {
  const sql = getDb();

  const result = await sql<ShippingRecord[]>`
    SELECT *
    FROM shipping_data
    ${filters?.period || filters?.month
      ? sql`WHERE
        ${filters?.period ? sql`period = ${filters.period}` : sql``}
        ${filters?.period && filters?.month ? sql`AND` : sql``}
        ${filters?.month ? sql`month = ${filters.month}` : sql``}
      `
      : sql``
    }
    ORDER BY
      CASE
        WHEN month = 'January' THEN 1
        WHEN month = 'February' THEN 2
        WHEN month = 'March' THEN 3
        WHEN month = 'April' THEN 4
        WHEN month = 'May' THEN 5
        WHEN month = 'June' THEN 6
        WHEN month = 'July' THEN 7
        WHEN month = 'August' THEN 8
        WHEN month = 'September' THEN 9
        WHEN month = 'October' THEN 10
        WHEN month = 'November' THEN 11
        WHEN month = 'December' THEN 12
      END,
      period
  `;

  return result;
}

/**
 * Get data formatted for the frontend table
 */
export async function getFormattedShippingData(uploadId?: number): Promise<any[]> {
  const sql = getDb();

  let targetUploadId = uploadId;

  if (!targetUploadId) {
    const [latestUpload] = await sql`
      SELECT id FROM uploads ORDER BY upload_date DESC LIMIT 1
    `;
    if (latestUpload) {
      targetUploadId = latestUpload.id;
    }
  }

  if (!targetUploadId) {
    return [];
  }

  const periods = await sql`
    SELECT DISTINCT period
    FROM shipping_data
    WHERE upload_id = ${targetUploadId}
    ORDER BY period
  `;

  if (periods.length === 0) {
    return [];
  }

  const boxCases = periods.map(p => {
    const safeName = p.period.replace(/[^a-zA-Z0-9_]/g, '_');
    return `MAX(CASE WHEN period = '${p.period.replace(/'/g, "''")}' THEN box END) as "${safeName}_box"`;
  });

  const teusCases = periods.map(p => {
    const safeName = p.period.replace(/[^a-zA-Z0-9_]/g, '_');
    return `MAX(CASE WHEN period = '${p.period.replace(/'/g, "''")}' THEN teus END) as "${safeName}_teus"`;
  });

  const pivotQuery = `
    SELECT
      month,
      ${[...boxCases, ...teusCases].join(',\n      ')}
    FROM shipping_data
    WHERE upload_id = ${targetUploadId}
    GROUP BY month
    ORDER BY
      CASE
        WHEN month = 'January' THEN 1
        WHEN month = 'February' THEN 2
        WHEN month = 'March' THEN 3
        WHEN month = 'April' THEN 4
        WHEN month = 'May' THEN 5
        WHEN month = 'June' THEN 6
        WHEN month = 'July' THEN 7
        WHEN month = 'August' THEN 8
        WHEN month = 'September' THEN 9
        WHEN month = 'October' THEN 10
        WHEN month = 'November' THEN 11
        WHEN month = 'December' THEN 12
      END
  `;

  const result = await sql.unsafe(pivotQuery);

  return result;
}

/**
 * Get upload history
 */
export async function getUploadHistory(): Promise<any[]> {
  const sql = getDb();

  const result = await sql`
    SELECT *
    FROM uploads
    ORDER BY upload_date DESC
    LIMIT 20
  `;

  return result;
}

/**
 * Delete data by upload ID
 */
export async function deleteByUploadId(uploadId: number): Promise<boolean> {
  const sql = getDb();

  try {
    await sql`DELETE FROM shipping_data WHERE upload_id = ${uploadId}`;
    await sql`DELETE FROM uploads WHERE id = ${uploadId}`;
    return true;
  } catch (error) {
    console.error('Error deleting data:', error);
    return false;
  }
}
