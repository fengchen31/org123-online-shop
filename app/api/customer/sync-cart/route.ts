import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminGetCustomerCart, addToCart, createCart, getCart, getCustomer, adminUpdateCustomerCart } from 'lib/shopify';

// 獲取並恢復用戶的購物車（登入時調用）
export async function GET(req: NextRequest) {
  try {
    console.log('=== GET /api/customer/sync-cart called ===');
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('customerAccessToken')?.value;

    if (!accessToken) {
      console.log('❌ No customerAccessToken found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('✅ AccessToken found, fetching customer info...');

    // Get customer info to obtain customer ID
    const customer = await getCustomer(accessToken);
    if (!customer || !customer.id) {
      console.error('❌ Failed to get customer ID');
      return NextResponse.json({ error: 'Failed to get customer info' }, { status: 500 });
    }

    console.log('Customer ID:', customer.id);

    // 先清除本地購物車 cookie（無論是否有儲存的購物車）
    console.log('Clearing local cartId cookie first...');
    const oldCartId = cookieStore.get('cartId')?.value;
    if (oldCartId) {
      console.log('Old cart ID found:', oldCartId, '- deleting...');
      cookieStore.delete('cartId');
    } else {
      console.log('No old cart ID found');
    }

    // 獲取用戶存儲的購物車 - 使用 Admin API
    console.log('Fetching cart from customer metafield via Admin API...');
    const savedCartItems = await adminGetCustomerCart(customer.id);
    console.log('Saved cart items from metafield:', savedCartItems);

    if (!savedCartItems || savedCartItems.length === 0) {
      console.log('No saved cart items found in customer metafield');

      // 即使沒有儲存的商品，也要創建一個新的空購物車
      console.log('Creating new empty cart...');
      const newCart = await createCart();
      if (newCart && newCart.id) {
        cookieStore.set('cartId', newCart.id);
        console.log('✅ New empty cart created with ID:', newCart.id);
      }

      return NextResponse.json({
        cart: newCart || null,
        message: 'No saved cart found, created new empty cart'
      });
    }

    console.log(`Found ${savedCartItems.length} items in saved cart, restoring...`);

    // 創建新的購物車
    console.log('Creating new cart for saved items...');
    const newCart = await createCart();
    if (!newCart) {
      console.error('❌ Failed to create cart');
      return NextResponse.json({ error: 'Failed to create cart' }, { status: 500 });
    }

    console.log('✅ New cart created with ID:', newCart.id);

    // 設置新的 cartId
    cookieStore.set('cartId', newCart.id!);

    // 添加商品到新購物車
    console.log('Adding items to new cart:', savedCartItems);
    await addToCart(savedCartItems);

    // 獲取更新後的購物車
    const updatedCart = await getCart();
    console.log('✅ Cart restored successfully with', updatedCart?.lines?.length || 0, 'items');

    return NextResponse.json({
      cart: updatedCart,
      message: 'Cart restored successfully',
      itemsRestored: updatedCart?.lines?.length || 0
    });
  } catch (error: any) {
    console.error('❌ Error syncing cart:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync cart' },
      { status: 500 }
    );
  }
}

// 保存當前購物車到用戶 metafield（購物車變更時調用）
export async function POST(req: NextRequest) {
  try {
    console.log('=== POST /api/customer/sync-cart called ===');
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('customerAccessToken')?.value;

    if (!accessToken) {
      console.log('No customerAccessToken, skipping cart sync');
      // 用戶未登入，不需要同步
      return NextResponse.json({ message: 'Not authenticated, no sync needed' });
    }

    console.log('AccessToken found, syncing cart to customer metafield using Admin API');

    // 獲取客戶資訊（包含全域 ID）
    const customer = await getCustomer(accessToken);
    if (!customer) {
      console.error('❌ Failed to get customer info');
      return NextResponse.json({ error: 'Failed to get customer info' }, { status: 500 });
    }

    console.log('Customer ID:', customer.id);

    // 獲取當前購物車
    const currentCart = await getCart();
    if (!currentCart || !currentCart.lines || currentCart.lines.length === 0) {
      console.log('Cart is empty, clearing customer cart metafield');
      // 購物車為空，清除用戶的購物車 metafield
      const success = await adminUpdateCustomerCart(customer.id, []);

      if (!success) {
        console.error('❌ Failed to clear cart via Admin API');
        return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 });
      }

      return NextResponse.json({ message: 'Cart cleared' });
    }

    // 提取購物車商品資訊
    const cartItems = currentCart.lines.map(line => ({
      merchandiseId: line.merchandise.id,
      quantity: line.quantity
    }));

    console.log('Saving cart items to customer metafield via Admin API:', cartItems);

    // 使用 Admin API 更新用戶的購物車 metafield
    const success = await adminUpdateCustomerCart(customer.id, cartItems);

    if (!success) {
      console.error('❌ Failed to update customer cart via Admin API');
      return NextResponse.json(
        { error: 'Failed to update customer cart' },
        { status: 500 }
      );
    }

    console.log('✅ Cart synced to customer metafield successfully via Admin API');

    return NextResponse.json({
      message: 'Cart synced successfully',
      items: cartItems.length
    });
  } catch (error: any) {
    console.error('❌ Error saving cart:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save cart' },
      { status: 500 }
    );
  }
}
