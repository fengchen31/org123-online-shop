import { getProductVariantById } from 'lib/shopify';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);

    const variant = await getProductVariantById(decodedId);

    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    return NextResponse.json(variant);
  } catch (error) {
    console.error('Error fetching variant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
