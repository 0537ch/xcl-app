import { NextRequest, NextResponse } from "next/server";
import { deleteByUploadId } from "@/lib/services/shippingService";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const uploadId = parseInt(id);

    if (isNaN(uploadId)) {
      return NextResponse.json({ error: 'Invalid upload ID' }, { status: 400 });
    }

    const result = await deleteByUploadId(uploadId);

    if (!result) {
      return NextResponse.json(
        { error: 'Upload not found or already deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error removing:', error);
    return NextResponse.json(
      { error: 'Failed to delete upload' },
      { status: 500 }
    );
  }
}