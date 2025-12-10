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
    console.log('=== restoreWishlistFromCustomer server action called ===');
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('customerAccessToken')?.value;

    if (!accessToken) {
      console.log('❌ No customerAccessToken found in server action');
      return { success: false, error: 'Not authenticated' };
    }

    console.log('✅ AccessToken found in server action, fetching customer info');

    // Get customer info to obtain customer ID
    const customer = await getCustomer(accessToken);
    if (!customer || !customer.id) {
      console.error('❌ Failed to get customer ID');
      return { success: false, error: 'Failed to get customer info' };
    }

    console.log('Customer ID:', customer.id);

    // Get saved wishlist items from customer metafield using Admin API
    const savedVariantIds = await adminGetCustomerWishlist(customer.id);
    console.log('Saved wishlist variant IDs:', savedVariantIds);

    if (!savedVariantIds || savedVariantIds.length === 0) {
      console.log('No saved wishlist items, clearing cookie');
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

    // For now, we'll store just the variant IDs in a simplified format
    // The actual product data will be fetched by the client
    const wishlistItems: WishlistItem[] = savedVariantIds.map(variantId => ({
      variantId,
      productId: '', // Will be fetched by client
      productHandle: '' // Will be fetched by client
    }));

    console.log(`Restoring ${wishlistItems.length} items to wishlist`);
    cookieStore.set('wishlist', JSON.stringify(wishlistItems), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365
    });

    console.log('✅ Wishlist restored successfully');

    return {
      success: true,
      message: 'Wishlist restored successfully',
      itemsRestored: wishlistItems.length
    };
  } catch (error: any) {
    console.error('❌ Error in restoreWishlistFromCustomer:', error);
    return { success: false, error: error.message || 'Failed to restore wishlist' };
  }
}

export async function clearLocalWishlist() {
  console.log('=== clearLocalWishlist called ===');
  console.log('Clearing local wishlist cookie');

  try {
    const cookieStore = await cookies();
    cookieStore.set('wishlist', JSON.stringify([]), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365
    });

    console.log('✅ Local wishlist cleared successfully');
    return { success: true };
  } catch (e) {
    console.error('Error clearing local wishlist:', e);
    return { success: false, error: 'Error clearing local wishlist' };
  }
}

export async function syncWishlistFromServer() {
  try {
    console.log('=== syncWishlistFromServer called ===');
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('customerAccessToken')?.value;

    if (!accessToken) {
      console.log('❌ No customerAccessToken found, user not logged in');
      return { success: false, error: 'Not authenticated', count: 0 };
    }

    // Get customer info to obtain customer ID
    const customer = await getCustomer(accessToken);
    if (!customer || !customer.id) {
      console.error('❌ Failed to get customer ID');
      return { success: false, error: 'Failed to get customer info', count: 0 };
    }

    // Get saved wishlist items from customer metafield using Admin API
    const savedVariantIds = await adminGetCustomerWishlist(customer.id);
    console.log('Synced wishlist variant IDs from server:', savedVariantIds);

    // Update local cookie with server data
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

    console.log('✅ Wishlist synced from server successfully');

    return {
      success: true,
      message: 'Wishlist synced from server',
      count: wishlistItems.length
    };
  } catch (error: any) {
    console.error('❌ Error in syncWishlistFromServer:', error);
    return { success: false, error: error.message || 'Failed to sync wishlist', count: 0 };
  }
}
