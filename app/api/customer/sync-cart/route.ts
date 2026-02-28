import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminGetCustomerCart, addToCart, createCart, getCart, getCustomer, adminUpdateCustomerCart } from 'lib/shopify';

// 獲取並恢復用戶的購物車（登入時調用）
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('customerAccessToken')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const customer = await getCustomer(accessToken);
    if (!customer || !customer.id) {
      return NextResponse.json({ error: 'Failed to get customer info' }, { status: 500 });
    }

    // 先清除本地購物車 cookie（無論是否有儲存的購物車）
    const oldCartId = cookieStore.get('cartId')?.value;
    if (oldCartId) {
      cookieStore.delete('cartId');
    }

    // 獲取用戶存儲的購物車 - 使用 Admin API
    const savedCartItems = await adminGetCustomerCart(customer.id);

    if (!savedCartItems || savedCartItems.length === 0) {
      // 即使沒有儲存的商品，也要創建一個新的空購物車
      const newCart = await createCart();
      if (newCart && newCart.id) {
        cookieStore.set('cartId', newCart.id);
      }

      return NextResponse.json({
        cart: newCart || null,
        message: 'No saved cart found, created new empty cart'
      });
    }

    // 創建新的購物車
    const newCart = await createCart();
    if (!newCart) {
      return NextResponse.json({ error: 'Failed to create cart' }, { status: 500 });
    }

    // 設置新的 cartId
    cookieStore.set('cartId', newCart.id!);

    // 添加商品到新購物車 - pass cartId explicitly since cookie is set on response, not request
    await addToCart(savedCartItems, newCart.id!);

    // 獲取更新後的購物車
    const updatedCart = await getCart();

    return NextResponse.json({
      cart: updatedCart,
      message: 'Cart restored successfully',
      itemsRestored: updatedCart?.lines?.length || 0
    });
  } catch (error: any) {
    console.error('Error syncing cart:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync cart' },
      { status: 500 }
    );
  }
}

// 保存當前購物車到用戶 metafield（購物車變更時調用）
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('customerAccessToken')?.value;

    if (!accessToken) {
      return NextResponse.json({ message: 'Not authenticated, no sync needed' });
    }

    const customer = await getCustomer(accessToken);
    if (!customer) {
      return NextResponse.json({ error: 'Failed to get customer info' }, { status: 500 });
    }

    const currentCart = await getCart();
    if (!currentCart || !currentCart.lines || currentCart.lines.length === 0) {
      const success = await adminUpdateCustomerCart(customer.id, []);
      if (!success) {
        return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 });
      }
      return NextResponse.json({ message: 'Cart cleared' });
    }

    const cartItems = currentCart.lines.map(line => ({
      merchandiseId: line.merchandise.id,
      quantity: line.quantity
    }));

    const success = await adminUpdateCustomerCart(customer.id, cartItems);
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update customer cart' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Cart synced successfully',
      items: cartItems.length
    });
  } catch (error: any) {
    console.error('Error saving cart:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save cart' },
      { status: 500 }
    );
  }
}
