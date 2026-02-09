import { NextRequest, NextResponse } from 'next/server';
import { parseExcelFile, validateShippingData } from '@/lib/utils/excelParser';
import { saveShippingData } from '@/lib/services/shippingService';

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

    // Parse Excel file (reads from C29:H40 and extracts years from CD27, EF27, GH27)
    const parsedData = await parseExcelFile(buffer);

    // Validate data
    const validation = validateShippingData(parsedData);
    if (!validation.isValid && validation.errors.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Save to database (years are extracted from Excel file)
    const result = await saveShippingData(parsedData, file.name);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Failed to save data to database',
          details: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File imported successfully',
      uploadId: result.uploadId,
      recordCount: parsedData.data.length,
      periods: parsedData.periods,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
