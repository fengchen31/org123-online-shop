'use server';

import { TAGS } from 'lib/constants';
import {
  addToCart,
  createCart,
  getCart,
  removeFromCart,
  updateCart,
  getCustomer,
  adminUpdateCustomerCart
} from 'lib/shopify';
import { revalidateTag } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Helper function to sync cart to customer metafield using Admin API (fire-and-forget)
// This runs after the cart operation is complete and should never block the UI
async function syncCartToCustomer() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('customerAccessToken')?.value;

    if (!accessToken) return;

    const customer = await getCustomer(accessToken);
    if (!customer || !customer.id) return;

    const currentCart = await getCart();
    if (!currentCart || !currentCart.lines || currentCart.lines.length === 0) {
      await adminUpdateCustomerCart(customer.id, []);
      return;
    }

    const cartItems = currentCart.lines.map(line => ({
      merchandiseId: line.merchandise.id,
      quantity: line.quantity
    }));

    await adminUpdateCustomerCart(customer.id, cartItems);
  } catch (e) {
    console.error('Error in syncCartToCustomer:', e);
  }
}

export async function addItem(
  prevState: any,
  selectedVariantId: string | undefined
) {
  if (!selectedVariantId) {
    return 'Error adding item to cart';
  }

  try {
    let cart = await getCart();

    if (!cart) {
      // Create a new cart if one doesn't exist
      cart = await createCart();
      (await cookies()).set('cartId', cart.id!);
    }

    await addToCart([{ merchandiseId: selectedVariantId, quantity: 1 }]);
    revalidateTag(TAGS.cart, 'max');
  } catch (e) {
    console.error('Error in addItem:', e);
    return 'Error adding item to cart';
  }

  // Sync cart to customer metafield AFTER the main operation succeeds
  // This is separate so sync failures never block the cart update
  syncCartToCustomer();
}

export async function removeItem(prevState: any, merchandiseId: string) {
  try {
    const cart = await getCart();

    if (!cart) {
      return 'Error fetching cart';
    }

    const lineItem = cart.lines.find(
      (line) => line.merchandise.id === merchandiseId
    );

    if (lineItem && lineItem.id) {
      await removeFromCart([lineItem.id]);
      revalidateTag(TAGS.cart, 'max');
    } else {
      return 'Item not found in cart';
    }
  } catch (e) {
    console.error('Error removing item from cart:', e);
    return 'Error removing item from cart';
  }

  // Sync after success, non-blocking
  syncCartToCustomer();
}

export async function updateItemQuantity(
  prevState: any,
  payload: {
    merchandiseId: string;
    quantity: number;
  }
) {
  const { merchandiseId, quantity } = payload;

  try {
    const cart = await getCart();

    if (!cart) {
      return 'Error fetching cart';
    }

    const lineItem = cart.lines.find(
      (line) => line.merchandise.id === merchandiseId
    );

    if (lineItem && lineItem.id) {
      if (quantity === 0) {
        await removeFromCart([lineItem.id]);
      } else {
        await updateCart([
          {
            id: lineItem.id,
            merchandiseId,
            quantity
          }
        ]);
      }
    } else if (quantity > 0) {
      // If the item doesn't exist in the cart and quantity > 0, add it
      await addToCart([{ merchandiseId, quantity }]);
    }

    revalidateTag(TAGS.cart, 'max');
  } catch (e) {
    console.error(e);
    return 'Error updating item quantity';
  }

  // Sync after success, non-blocking
  syncCartToCustomer();
}

export async function redirectToCheckout() {
  const cart = await getCart();
  if (!cart?.checkoutUrl) return;
  redirect(cart.checkoutUrl);
}

export async function createCartAndSetCookie() {
  let cart = await createCart();
  (await cookies()).set('cartId', cart.id!);
}

export async function clearLocalCartAndSync() {
  try {
    (await cookies()).delete('cartId');
    revalidateTag(TAGS.cart, 'max');
  } catch (e) {
    console.error('Error clearing local cart:', e);
    return 'Error clearing local cart';
  }
}
