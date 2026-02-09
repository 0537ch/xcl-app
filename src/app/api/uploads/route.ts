import { NextResponse } from 'next/server';
import { getUploadHistory } from '@/lib/services/shippingService';

export async function GET() {
  try {
    const uploads = await getUploadHistory();
    return NextResponse.json({ success: true, data: uploads });
  } catch (error) {
    console.error('Get uploads error:', error);
    return NextResponse.json(
      { error: 'Failed to get uploads' },
      { status: 500 }
    );
  }
}
