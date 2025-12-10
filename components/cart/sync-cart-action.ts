'use server';

import { cookies } from 'next/headers';
import { getCustomer, adminGetCustomerCart, addToCart, createCart, getCart } from 'lib/shopify';

export async function restoreCartFromCustomer() {
  try {
    console.log('=== restoreCartFromCustomer server action called ===');
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

    // Clear old cart cookie
    const oldCartId = cookieStore.get('cartId')?.value;
    if (oldCartId) {
      console.log('Deleting old cart ID:', oldCartId);
      cookieStore.delete('cartId');
    }

    // Get saved cart items from customer metafield using Admin API
    const savedCartItems = await adminGetCustomerCart(customer.id);
    console.log('Saved cart items:', savedCartItems);

    if (!savedCartItems || savedCartItems.length === 0) {
      console.log('No saved cart items, creating empty cart');
      const newCart = await createCart();
      if (newCart && newCart.id) {
        cookieStore.set('cartId', newCart.id);
      }
      return {
        success: true,
        message: 'No saved cart found, created new empty cart',
        itemsRestored: 0
      };
    }

    // Create new cart and add saved items
    console.log(`Restoring ${savedCartItems.length} items to cart`);
    const newCart = await createCart();
    if (!newCart || !newCart.id) {
      return { success: false, error: 'Failed to create cart' };
    }

    cookieStore.set('cartId', newCart.id);
    await addToCart(savedCartItems);

    const updatedCart = await getCart();
    console.log('✅ Cart restored successfully');

    return {
      success: true,
      message: 'Cart restored successfully',
      itemsRestored: updatedCart?.lines?.length || 0
    };
  } catch (error: any) {
    console.error('❌ Error in restoreCartFromCustomer:', error);
    return { success: false, error: error.message || 'Failed to restore cart' };
  }
}

export async function syncCartFromServer() {
  try {
    console.log('=== syncCartFromServer called ===');
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('customerAccessToken')?.value;

    if (!accessToken) {
      console.log('❌ No customerAccessToken found, user not logged in');
      return { success: false, error: 'Not authenticated', itemCount: 0 };
    }

    // Get customer info to obtain customer ID
    const customer = await getCustomer(accessToken);
    if (!customer || !customer.id) {
      console.error('❌ Failed to get customer ID');
      return { success: false, error: 'Failed to get customer info', itemCount: 0 };
    }

    console.log('Customer ID:', customer.id);

    // Get saved cart items from customer metafield using Admin API
    const savedCartItems = await adminGetCustomerCart(customer.id);
    console.log('Synced cart items from server:', savedCartItems);

    // Clear old cart cookie
    const oldCartId = cookieStore.get('cartId')?.value;
    if (oldCartId) {
      console.log('Deleting old cart ID:', oldCartId);
      cookieStore.delete('cartId');
    }

    if (!savedCartItems || savedCartItems.length === 0) {
      console.log('No saved cart items on server, creating empty cart');
      const newCart = await createCart();
      if (newCart && newCart.id) {
        cookieStore.set('cartId', newCart.id);
      }
      return {
        success: true,
        message: 'Cart synced from server (empty)',
        itemCount: 0
      };
    }

    // Create new cart and add saved items
    console.log(`Syncing ${savedCartItems.length} items from server to cart`);
    const newCart = await createCart();
    if (!newCart || !newCart.id) {
      return { success: false, error: 'Failed to create cart', itemCount: 0 };
    }

    cookieStore.set('cartId', newCart.id);
    await addToCart(savedCartItems);

    const updatedCart = await getCart();
    console.log('✅ Cart synced from server successfully');

    return {
      success: true,
      message: 'Cart synced from server',
      itemCount: updatedCart?.lines?.length || 0
    };
  } catch (error: any) {
    console.error('❌ Error in syncCartFromServer:', error);
    return { success: false, error: error.message || 'Failed to sync cart', itemCount: 0 };
  }
}
