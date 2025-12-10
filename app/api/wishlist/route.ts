import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getCustomer, adminUpdateCustomerWishlist } from 'lib/shopify';

interface WishlistItem {
  variantId: string;
  productId: string;
  productHandle: string;
}

// Helper function to sync wishlist to customer metafield
async function syncWishlistToCustomer(wishlistItems: WishlistItem[]) {
  try {
    console.log('=== syncWishlistToCustomer called ===');
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('customerAccessToken')?.value;

    if (!accessToken) {
      console.log('No customerAccessToken found, skipping wishlist sync');
      return;
    }

    console.log('AccessToken found, fetching customer ID...');

    // Get customer info to obtain customer ID
    const customer = await getCustomer(accessToken);
    if (!customer || !customer.id) {
      console.error('❌ Failed to get customer ID');
      return;
    }

    console.log('Customer ID:', customer.id);

    // Extract variant IDs for metafield storage
    const variantIds = wishlistItems.map(item => item.variantId);

    console.log('Syncing wishlist items to customer metafield via Admin API:', variantIds);
    const success = await adminUpdateCustomerWishlist(customer.id, variantIds);

    if (success) {
      console.log('✅ Wishlist synced to customer metafield successfully');
    } else {
      console.error('❌ Failed to sync wishlist to customer metafield');
    }
  } catch (e) {
    console.error('Error in syncWishlistToCustomer:', e);
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { variantId, productId, productHandle, action } = await req.json();

    if (!variantId || !action) {
      return NextResponse.json({ error: 'Missing variantId or action' }, { status: 400 });
    }

    // Get current wishlist from cookies
    const cookieStore = await cookies();
    const wishlistCookie = cookieStore.get('wishlist')?.value;
    let currentWishlist: WishlistItem[] = [];

    if (wishlistCookie) {
      try {
        currentWishlist = JSON.parse(wishlistCookie);
      } catch (e) {
        currentWishlist = [];
      }
    }

    let newWishlist: WishlistItem[];

    if (action === 'add') {
      // Check if this variant is already in the wishlist
      if (currentWishlist.some((item) => item.variantId === variantId)) {
        return NextResponse.json({ wishlist: currentWishlist });
      }
      newWishlist = [...currentWishlist, { variantId, productId, productHandle }];
    } else if (action === 'remove') {
      newWishlist = currentWishlist.filter((item) => item.variantId !== variantId);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Sync wishlist to customer metafield if logged in
    await syncWishlistToCustomer(newWishlist);

    // Create response and set cookie
    const response = NextResponse.json({ wishlist: newWishlist });
    response.cookies.set('wishlist', JSON.stringify(newWishlist), {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365 // 1 year
    });

    return response;
  } catch (error) {
    console.error('Error in wishlist API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const wishlistCookie = cookieStore.get('wishlist')?.value;
    let wishlist: WishlistItem[] = [];

    if (wishlistCookie) {
      try {
        wishlist = JSON.parse(wishlistCookie);
      } catch (e) {
        wishlist = [];
      }
    }

    return NextResponse.json({ wishlist });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
