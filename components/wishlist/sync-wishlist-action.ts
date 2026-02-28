'use server';

import { cookies } from 'next/headers';
import { getCustomer, adminGetCustomerWishlist } from 'lib/shopify';

interface WishlistItem {
  variantId: string;
  productId: string;
  productHandle: string;
}

export async function restoreWishlistFromCustomer() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('customerAccessToken')?.value;

    if (!accessToken) {
      return { success: false, error: 'Not authenticated' };
    }

    const customer = await getCustomer(accessToken);
    if (!customer || !customer.id) {
      return { success: false, error: 'Failed to get customer info' };
    }

    const savedVariantIds = await adminGetCustomerWishlist(customer.id);

    if (!savedVariantIds || savedVariantIds.length === 0) {
      cookieStore.set('wishlist', JSON.stringify([]), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365
      });
      return {
        success: true,
        message: 'No saved wishlist found',
        itemsRestored: 0
      };
    }

    const wishlistItems: WishlistItem[] = savedVariantIds.map(variantId => ({
      variantId,
      productId: '',
      productHandle: ''
    }));

    cookieStore.set('wishlist', JSON.stringify(wishlistItems), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365
    });

    return {
      success: true,
      message: 'Wishlist restored successfully',
      itemsRestored: wishlistItems.length
    };
  } catch (error: any) {
    console.error('Error in restoreWishlistFromCustomer:', error);
    return { success: false, error: error.message || 'Failed to restore wishlist' };
  }
}

export async function clearLocalWishlist() {
  try {
    const cookieStore = await cookies();
    cookieStore.set('wishlist', JSON.stringify([]), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365
    });

    return { success: true };
  } catch (e) {
    console.error('Error clearing local wishlist:', e);
    return { success: false, error: 'Error clearing local wishlist' };
  }
}

export async function syncWishlistFromServer() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('customerAccessToken')?.value;

    if (!accessToken) {
      return { success: false, error: 'Not authenticated', count: 0 };
    }

    const customer = await getCustomer(accessToken);
    if (!customer || !customer.id) {
      return { success: false, error: 'Failed to get customer info', count: 0 };
    }

    const savedVariantIds = await adminGetCustomerWishlist(customer.id);

    const wishlistItems: WishlistItem[] = (savedVariantIds || []).map(variantId => ({
      variantId,
      productId: '',
      productHandle: ''
    }));

    cookieStore.set('wishlist', JSON.stringify(wishlistItems), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365
    });

    return {
      success: true,
      message: 'Wishlist synced from server',
      count: wishlistItems.length
    };
  } catch (error: any) {
    console.error('Error in syncWishlistFromServer:', error);
    return { success: false, error: error.message || 'Failed to sync wishlist', count: 0 };
  }
}
