import { NextRequest, NextResponse } from 'next/server';
import { getCollectionProducts } from 'lib/shopify';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const handle = searchParams.get('handle') || 'nul1-org';

  try {
    const { products } = await getCollectionProducts({
      collection: handle,
      sortKey: 'CREATED',
      reverse: false,
      first: 250
    });

    return NextResponse.json({
      handle,
      productCount: products.length,
      products: products.map(p => ({
        handle: p.handle,
        title: p.title,
        collections: (p as any).collections
      }))
    });
  } catch (error) {
    console.error('Error fetching collection products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection products', details: String(error) },
      { status: 500 }
    );
  }
}
