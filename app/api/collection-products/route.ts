import { getCollectionProducts } from 'lib/shopify';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const collection = searchParams.get('collection');
  const sortKey = searchParams.get('sortKey');
  const reverse = searchParams.get('reverse') === 'true';
  const category = searchParams.get('category');
  const after = searchParams.get('after');
  const first = searchParams.get('first') ? parseInt(searchParams.get('first')!) : 50;

  if (!collection) {
    return NextResponse.json({ error: 'Collection parameter is required' }, { status: 400 });
  }

  try {
    const { products: allProducts, pageInfo } = await getCollectionProducts({
      collection,
      sortKey: sortKey || undefined,
      reverse,
      first,
      after: after || undefined
    });

    // Filter by category if specified
    let products = allProducts;
    if (category && category !== 'all') {
      products = allProducts.filter((product) => {
        const tags = product.tags.map((tag) => tag.toLowerCase());
        return tags.includes(category.toLowerCase());
      });
    }

    return NextResponse.json({ products, pageInfo });
  } catch (error) {
    console.error('Error fetching collection products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
