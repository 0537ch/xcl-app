import { NextResponse } from 'next/server';
import { getActiveUpload } from '@/lib/services/shippingService';

export async function GET() {
  try {
    const upload = await getActiveUpload();

    if (!upload) {
      return NextResponse.json(
        { success: false, error: 'No active upload found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: upload });
  } catch (error) {
    console.error('Get active upload error:', error);
    return NextResponse.json(
      { error: 'Failed to get active upload' },
      { status: 500 }
    );
  }
}
