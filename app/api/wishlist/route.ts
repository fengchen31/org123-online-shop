import { getCustomerWishlist, updateCustomerWishlist } from 'lib/shopify';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { productId, action } = await req.json();
    const accessToken = (await cookies()).get('customerAccessToken')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!productId || !action) {
      return NextResponse.json({ error: 'Missing productId or action' }, { status: 400 });
    }

    // Get current wishlist
    const currentWishlist = await getCustomerWishlist(accessToken);

    let newWishlist: string[];

    if (action === 'add') {
      if (currentWishlist.includes(productId)) {
        return NextResponse.json({ wishlist: currentWishlist });
      }
      newWishlist = [...currentWishlist, productId];
    } else if (action === 'remove') {
      newWishlist = currentWishlist.filter((id) => id !== productId);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update wishlist in Shopify
    const success = await updateCustomerWishlist(accessToken, newWishlist);

    if (!success) {
      return NextResponse.json({ error: 'Failed to update wishlist' }, { status: 500 });
    }

    return NextResponse.json({ wishlist: newWishlist });
  } catch (error) {
    console.error('Error in wishlist API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const accessToken = (await cookies()).get('customerAccessToken')?.value;

    if (!accessToken) {
      return NextResponse.json({ wishlist: [] });
    }

    const wishlist = await getCustomerWishlist(accessToken);
    return NextResponse.json({ wishlist });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
