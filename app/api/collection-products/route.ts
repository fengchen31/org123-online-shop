import { getCollectionProducts } from 'lib/shopify';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const collection = searchParams.get('collection');
  const sortKey = searchParams.get('sortKey');
  const reverse = searchParams.get('reverse') === 'true';
  const category = searchParams.get('category');

  if (!collection) {
    return NextResponse.json({ error: 'Collection parameter is required' }, { status: 400 });
  }

  try {
    let products = await getCollectionProducts({
      collection,
      sortKey: sortKey || undefined,
      reverse
    });

    // Filter by category if specified
    if (category && category !== 'all') {
      products = products.filter((product) => {
        const tags = product.tags.map((tag) => tag.toLowerCase());
        return tags.includes(category.toLowerCase());
      });
    }

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching collection products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
