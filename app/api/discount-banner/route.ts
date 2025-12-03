import { getDiscountBanner } from 'lib/shopify';
import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  try {
    const discountBanner = await getDiscountBanner();

    if (!discountBanner) {
      return NextResponse.json({ discountBanner: null }, { status: 200 });
    }

    return NextResponse.json({ discountBanner });
  } catch (error) {
    console.error('Error fetching discount banner:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
