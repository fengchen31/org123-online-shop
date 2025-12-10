import { NextRequest, NextResponse } from 'next/server';
import { getProduct } from 'lib/shopify';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const handle = searchParams.get('handle');

  if (!handle) {
    return NextResponse.json({ error: 'Missing handle parameter' }, { status: 400 });
  }

  try {
    const product = await getProduct(handle);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Return product info with collections
    return NextResponse.json({
      id: product.id,
      handle: product.handle,
      title: product.title,
      collections: (product as any).collections || []
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
