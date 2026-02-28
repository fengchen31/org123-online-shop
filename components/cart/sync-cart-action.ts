'use server';

import { cookies } from 'next/headers';
import { revalidateTag } from 'next/cache';
import { TAGS } from 'lib/constants';
import { getCustomer, adminGetCustomerCart, addToCart, createCart, getCart } from 'lib/shopify';

export async function restoreCartFromCustomer() {
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

    // Clear old cart cookie
    const oldCartId = cookieStore.get('cartId')?.value;
    if (oldCartId) {
      cookieStore.delete('cartId');
    }

    // Get saved cart items from customer metafield using Admin API
    const savedCartItems = await adminGetCustomerCart(customer.id);

    if (!savedCartItems || savedCartItems.length === 0) {
      const newCart = await createCart();
      if (newCart && newCart.id) {
        cookieStore.set('cartId', newCart.id);
      }
      revalidateTag(TAGS.cart, 'max');
      return {
        success: true,
        message: 'No saved cart found, created new empty cart',
        itemsRestored: 0
      };
    }

    // Create new cart and add saved items
    const newCart = await createCart();
    if (!newCart || !newCart.id) {
      return { success: false, error: 'Failed to create cart' };
    }

    cookieStore.set('cartId', newCart.id);
    await addToCart(savedCartItems, newCart.id);
    revalidateTag(TAGS.cart, 'max');

    const updatedCart = await getCart();

    return {
      success: true,
      message: 'Cart restored successfully',
      itemsRestored: updatedCart?.lines?.length || 0
    };
  } catch (error: any) {
    console.error('Error in restoreCartFromCustomer:', error);
    return { success: false, error: error.message || 'Failed to restore cart' };
  }
}

export async function syncCartFromServer() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('customerAccessToken')?.value;

    if (!accessToken) {
      return { success: false, error: 'Not authenticated', itemCount: 0 };
    }

    const customer = await getCustomer(accessToken);
    if (!customer || !customer.id) {
      return { success: false, error: 'Failed to get customer info', itemCount: 0 };
    }

    // Get saved cart items from customer metafield using Admin API
    const savedCartItems = await adminGetCustomerCart(customer.id);

    // Clear old cart cookie
    const oldCartId = cookieStore.get('cartId')?.value;
    if (oldCartId) {
      cookieStore.delete('cartId');
    }

    if (!savedCartItems || savedCartItems.length === 0) {
      const newCart = await createCart();
      if (newCart && newCart.id) {
        cookieStore.set('cartId', newCart.id);
      }
      revalidateTag(TAGS.cart, 'max');
      return {
        success: true,
        message: 'Cart synced from server (empty)',
        itemCount: 0
      };
    }

    // Create new cart and add saved items
    const newCart = await createCart();
    if (!newCart || !newCart.id) {
      return { success: false, error: 'Failed to create cart', itemCount: 0 };
    }

    cookieStore.set('cartId', newCart.id);
    await addToCart(savedCartItems, newCart.id);
    revalidateTag(TAGS.cart, 'max');

    const updatedCart = await getCart();

    return {
      success: true,
      message: 'Cart synced from server',
      itemCount: updatedCart?.lines?.length || 0
    };
  } catch (error: any) {
    console.error('Error in syncCartFromServer:', error);
    return { success: false, error: error.message || 'Failed to sync cart', itemCount: 0 };
  }
}
