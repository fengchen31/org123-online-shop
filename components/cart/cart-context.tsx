'use client';

import type {
  Cart,
  CartItem,
  Product,
  ProductVariant
} from 'lib/shopify/types';
import React, {
  createContext,
  use,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

type UpdateType = 'plus' | 'minus' | 'delete';

type CartContextType = {
  cart: Cart | undefined;
  updateCartItem: (merchandiseId: string, updateType: UpdateType) => void;
  addCartItem: (variant: ProductVariant, product: Product) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

function calculateItemCost(quantity: number, price: string): string {
  return (Number(price) * quantity).toString();
}

function updateCartItemInLines(
  item: CartItem,
  updateType: UpdateType
): CartItem | null {
  if (updateType === 'delete') return null;

  const newQuantity =
    updateType === 'plus' ? item.quantity + 1 : item.quantity - 1;
  if (newQuantity === 0) return null;

  const singleItemAmount = Number(item.cost.totalAmount.amount) / item.quantity;
  const newTotalAmount = calculateItemCost(
    newQuantity,
    singleItemAmount.toString()
  );

  return {
    ...item,
    quantity: newQuantity,
    cost: {
      ...item.cost,
      totalAmount: {
        ...item.cost.totalAmount,
        amount: newTotalAmount
      }
    }
  };
}

function createOrUpdateCartItem(
  existingItem: CartItem | undefined,
  variant: ProductVariant,
  product: Product
): CartItem {
  const quantity = existingItem ? existingItem.quantity + 1 : 1;
  const totalAmount = calculateItemCost(quantity, variant.price.amount);

  return {
    id: existingItem?.id,
    quantity,
    cost: {
      totalAmount: {
        amount: totalAmount,
        currencyCode: variant.price.currencyCode
      }
    },
    merchandise: {
      id: variant.id,
      title: variant.title,
      selectedOptions: variant.selectedOptions,
      product: {
        id: product.id,
        handle: product.handle,
        title: product.title,
        featuredImage: product.featuredImage
      }
    }
  };
}

function updateCartTotals(
  lines: CartItem[]
): Pick<Cart, 'totalQuantity' | 'cost'> {
  const totalQuantity = lines.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = lines.reduce(
    (sum, item) => sum + Number(item.cost.totalAmount.amount),
    0
  );
  const currencyCode = lines[0]?.cost.totalAmount.currencyCode ?? 'USD';

  return {
    totalQuantity,
    cost: {
      subtotalAmount: { amount: totalAmount.toString(), currencyCode },
      totalAmount: { amount: totalAmount.toString(), currencyCode },
      totalTaxAmount: { amount: '0', currencyCode }
    }
  };
}

function createEmptyCart(): Cart {
  return {
    id: undefined,
    checkoutUrl: '',
    totalQuantity: 0,
    lines: [],
    cost: {
      subtotalAmount: { amount: '0', currencyCode: 'USD' },
      totalAmount: { amount: '0', currencyCode: 'USD' },
      totalTaxAmount: { amount: '0', currencyCode: 'USD' }
    }
  };
}

// CartProvider resolves the cart promise and owns the shared cart state.
// All consumers of useCart() see the SAME cart, so when AddToCart
// calls addCartItem(), the header badge updates instantly too.
// Uses useState instead of useOptimistic for reliable cross-component updates.
export function CartProvider({
  children,
  cartPromise
}: {
  children: React.ReactNode;
  cartPromise: Promise<Cart | undefined>;
}) {
  const serverCart = use(cartPromise);
  const [cart, setCart] = useState<Cart | undefined>(serverCart);
  const serverCartRef = useRef(serverCart);

  // Sync server cart to local state when server data changes
  // (e.g., after revalidateTag triggers a re-render)
  useEffect(() => {
    if (serverCart !== serverCartRef.current) {
      serverCartRef.current = serverCart;
      setCart(serverCart);
    }
  }, [serverCart]);

  const updateCartItemFn = useCallback(
    (merchandiseId: string, updateType: UpdateType) => {
      setCart((prev) => {
        const currentCart = prev || createEmptyCart();
        const updatedLines = currentCart.lines
          .map((item) =>
            item.merchandise.id === merchandiseId
              ? updateCartItemInLines(item, updateType)
              : item
          )
          .filter(Boolean) as CartItem[];

        if (updatedLines.length === 0) {
          return {
            ...currentCart,
            lines: [],
            totalQuantity: 0,
            cost: {
              ...currentCart.cost,
              totalAmount: { ...currentCart.cost.totalAmount, amount: '0' }
            }
          };
        }

        return {
          ...currentCart,
          ...updateCartTotals(updatedLines),
          lines: updatedLines
        };
      });
    },
    []
  );

  const addCartItemFn = useCallback(
    (variant: ProductVariant, product: Product) => {
      setCart((prev) => {
        const currentCart = prev || createEmptyCart();
        const existingItem = currentCart.lines.find(
          (item) => item.merchandise.id === variant.id
        );
        const updatedItem = createOrUpdateCartItem(
          existingItem,
          variant,
          product
        );

        const updatedLines = existingItem
          ? currentCart.lines.map((item) =>
              item.merchandise.id === variant.id ? updatedItem : item
            )
          : [...currentCart.lines, updatedItem];

        return {
          ...currentCart,
          ...updateCartTotals(updatedLines),
          lines: updatedLines
        };
      });
    },
    []
  );

  const value = useMemo(
    () => ({
      cart,
      updateCartItem: updateCartItemFn,
      addCartItem: addCartItemFn
    }),
    [cart, updateCartItemFn, addCartItemFn]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
