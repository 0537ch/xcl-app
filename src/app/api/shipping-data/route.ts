import { NextRequest, NextResponse } from 'next/server';
import {
  getShippingData,
  getFormattedShippingData,
  getUploadHistory,
  deleteByUploadId,
} from '@/lib/services/shippingService';

/**
 * GET - Fetch shipping data
 * Query params:
 * - year: filter by year (2025, 2026, etc.)
 * - dataType: filter by type ('actual', 'budget')
 * - month: filter by month
 * - format: 'flat' (default) or 'table'
 * - uploadId: specific upload to fetch
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year');
    const dataType = searchParams.get('dataType') as 'actual' | 'budget' | null;
    const month = searchParams.get('month');
    const format = searchParams.get('format');
    const uploadId = searchParams.get('uploadId');

    const filters: any = {};
    if (year) filters.year = parseInt(year);
    if (dataType) filters.dataType = dataType;
    if (month) filters.month = month;

    // Return formatted data for table view
    if (format === 'table') {
      const data = await getFormattedShippingData(uploadId ? parseInt(uploadId) : undefined);
      return NextResponse.json({ success: true, data });
    }

    // Return flat data structure
    const data = await getShippingData(
      Object.keys(filters).length > 0 ? filters : undefined
    );

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Get shipping data error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch shipping data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete shipping data
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const uploadId = searchParams.get('uploadId');

    if (!uploadId) {
      return NextResponse.json(
        { error: 'uploadId is required' },
        { status: 400 }
      );
    }

    const success = await deleteByUploadId(parseInt(uploadId));

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Data deleted successfully',
    });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
