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

// Helper function to sync cart to customer metafield using Admin API
async function syncCartToCustomer() {
  try {
    console.log('=== syncCartToCustomer called ===');
    const cookieStore = await cookies();

    // Debug: List all cookies
    const allCookies = cookieStore.getAll();
    console.log('Available cookies:', allCookies.map(c => c.name).join(', '));

    const accessToken = cookieStore.get('customerAccessToken')?.value;

    if (!accessToken) {
      console.log('❌ No customerAccessToken found, skipping cart sync');
      console.log('Expected cookie: customerAccessToken');
      return;
    }

    console.log('✅ AccessToken found, fetching customer ID...');

    // Get customer info to obtain customer ID
    const customer = await getCustomer(accessToken);
    if (!customer || !customer.id) {
      console.error('❌ Failed to get customer ID');
      return;
    }

    console.log('Customer ID:', customer.id);

    // Get current cart
    const currentCart = await getCart();
    if (!currentCart || !currentCart.lines || currentCart.lines.length === 0) {
      console.log('Cart is empty, clearing customer cart metafield');
      await adminUpdateCustomerCart(customer.id, []);
      return;
    }

    // Extract cart items
    const cartItems = currentCart.lines.map(line => ({
      merchandiseId: line.merchandise.id,
      quantity: line.quantity
    }));

    console.log('Syncing cart items to customer metafield via Admin API:', cartItems);
    const success = await adminUpdateCustomerCart(customer.id, cartItems);

    if (success) {
      console.log('✅ Cart synced to customer metafield successfully');
    } else {
      console.error('❌ Failed to sync cart to customer metafield');
    }
  } catch (e) {
    console.error('Error in syncCartToCustomer:', e);
  }
}

export async function addItem(
  prevState: any,
  selectedVariantId: string | undefined
) {
  console.log('=== addItem called ===');
  console.log('selectedVariantId:', selectedVariantId);
  console.trace('Stack trace:'); // 顯示調用堆棧

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

    // Force revalidation with revalidatePath
    const { revalidatePath } = await import('next/cache');
    revalidatePath('/', 'layout');

    // Sync cart to customer metafield if logged in
    await syncCartToCustomer();

    console.log('✅ Item added successfully and cache invalidated');
  } catch (e) {
    console.error('Error in addItem:', e);
    return 'Error adding item to cart';
  }
}

export async function removeItem(prevState: any, merchandiseId: string) {
  console.log('=== removeItem called ===');
  console.log('merchandiseId:', merchandiseId);

  try {
    const cart = await getCart();
    console.log('Cart:', cart);

    if (!cart) {
      console.error('No cart found');
      return 'Error fetching cart';
    }

    const lineItem = cart.lines.find(
      (line) => line.merchandise.id === merchandiseId
    );
    console.log('Line item found:', lineItem);

    if (lineItem && lineItem.id) {
      console.log('Removing line item:', lineItem.id);
      await removeFromCart([lineItem.id]);

      // Force revalidation with revalidatePath
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/', 'layout');

      // Sync cart to customer metafield if logged in
      await syncCartToCustomer();

      console.log('✅ Item removed successfully and cache invalidated');
    } else {
      console.error('Item not found in cart');
      return 'Item not found in cart';
    }
  } catch (e) {
    console.error('Error removing item from cart:', e);
    return 'Error removing item from cart';
  }
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

    // Force revalidation with revalidatePath
    const { revalidatePath } = await import('next/cache');
    revalidatePath('/', 'layout');

    // Sync cart to customer metafield if logged in
    await syncCartToCustomer();
  } catch (e) {
    console.error(e);
    return 'Error updating item quantity';
  }
}

export async function redirectToCheckout() {
  let cart = await getCart();
  redirect(cart!.checkoutUrl);
}

export async function createCartAndSetCookie() {
  let cart = await createCart();
  (await cookies()).set('cartId', cart.id!);
}

export async function clearLocalCartAndSync() {
  console.log('=== clearLocalCartAndSync called ===');
  console.log('Clearing local cart cookie and syncing with account cart');

  try {
    // Delete the local cart cookie
    (await cookies()).delete('cartId');

    // Force revalidation to fetch account's cart
    revalidateTag(TAGS.cart, 'max');

    const { revalidatePath } = await import('next/cache');
    revalidatePath('/', 'layout');

    console.log('✅ Local cart cleared and synced successfully');
  } catch (e) {
    console.error('Error clearing local cart:', e);
    return 'Error clearing local cart';
  }
}
