import { NextRequest, NextResponse } from 'next/server';
import { parseExcelFile, validateShippingData } from '@/lib/utils/excelParser';

/**
 * Parse endpoint - allows client to preview Excel data before importing
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (
      !file.name.endsWith('.xlsx') &&
      !file.name.endsWith('.xls') &&
      !file.name.endsWith('.csv')
    ) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an Excel file (.xlsx, .xls)' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse Excel file (reads from C29:H40)
    const parsedData = await parseExcelFile(buffer);

    // Validate data
    const validation = validateShippingData(parsedData);

    return NextResponse.json({
      success: true,
      data: parsedData.data,
      periods: parsedData.periods,
      validation: {
        isValid: validation.isValid,
        errors: validation.errors,
      },
    });
  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json(
      {
        error: 'Failed to parse Excel file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
