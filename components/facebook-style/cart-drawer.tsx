'use client';

import { redirectToCheckout } from 'components/cart/actions';
import { DeleteItemButton } from 'components/cart/delete-item-button';
import { EditItemQuantityButton } from 'components/cart/edit-item-quantity-button';
import LoadingDots from 'components/loading-dots';
import Price from 'components/price';
import { DEFAULT_OPTION } from 'lib/constants';
import { createUrl } from 'lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { useCart } from '../cart/cart-context';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type MerchandiseSearchParams = {
  [key: string]: string;
};

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart, updateCartItem } = useCart();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-full bg-white shadow-2xl transition-transform duration-300 ease-in-out sm:w-[500px] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">My Cart</h2>
            {cart && cart.lines.length > 0 && (
              <p className="text-sm text-gray-600">
                {cart.totalQuantity} {cart.totalQuantity === 1 ? 'item' : 'items'}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-100"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        {!cart || cart.lines.length === 0 ? (
          <div className="flex h-[calc(100%-80px)] flex-col items-center justify-center space-y-4">           
            <div className="text-center">
              <h3 className="mb-1 text-lg font-semibold text-gray-900">Your cart is empty</h3>          
            </div>
          </div>
        ) : (
          <div className="flex h-[calc(100%-80px)] flex-col">
            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {cart.lines
                  .sort((a, b) =>
                    a.merchandise.product.title.localeCompare(b.merchandise.product.title)
                  )
                  .map((item, i) => {
                    const merchandiseSearchParams = {} as MerchandiseSearchParams;

                    item.merchandise.selectedOptions.forEach(({ name, value }) => {
                      if (value !== DEFAULT_OPTION) {
                        merchandiseSearchParams[name.toLowerCase()] = value;
                      }
                    });

                    const merchandiseUrl = createUrl(
                      `/product/${item.merchandise.product.handle}`,
                      new URLSearchParams(merchandiseSearchParams)
                    );

                    return (
                      <div
                        key={i}
                        className="overflow-hidden border border-gray-200 bg-white"
                      >
                        <div className="flex gap-4 p-4">
                          {/* Image */}
                          <Link href={merchandiseUrl} onClick={onClose}>
                            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden bg-gray-100">
                              <Image
                                src={item.merchandise.product.featuredImage.url}
                                alt={
                                  item.merchandise.product.featuredImage.altText ||
                                  item.merchandise.product.title
                                }
                                fill
                                sizes="96px"
                                className="object-cover"
                              />
                            </div>
                          </Link>

                          {/* Info */}
                          <div className="flex flex-1 flex-col">
                            <div className="mb-2 flex items-start justify-between">
                              <Link href={merchandiseUrl} onClick={onClose}>
                                <h3 className="text-sm font-semibold text-gray-900 hover:text-[#3b5998]">
                                  {item.merchandise.product.title}
                                </h3>
                              </Link>
                              {/* Delete Button */}
                              <DeleteItemButton
                                item={item}
                                optimisticUpdate={updateCartItem}
                              />
                            </div>

                            {/* Variant Options */}
                            {item.merchandise.title !== DEFAULT_OPTION && (
                              <div className="mb-2 flex flex-wrap gap-1">
                                {item.merchandise.selectedOptions.map((option, index) => {
                                  if (option.value === DEFAULT_OPTION) return null;
                                  return (
                                    <span
                                      key={index}
                                      className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                                    >
                                      {option.value}
                                    </span>
                                  );
                                })}
                              </div>
                            )}

                            {/* Price and Quantity */}
                            <div className="mt-auto flex items-center justify-between">
                              <div className="flex items-center gap-2 border border-gray-300 bg-white">
                                <EditItemQuantityButton
                                  item={item}
                                  type="minus"
                                  optimisticUpdate={updateCartItem}
                                />
                                <span className="w-8 text-center text-sm font-medium">
                                  {item.quantity}
                                </span>
                                <EditItemQuantityButton
                                  item={item}
                                  type="plus"
                                  optimisticUpdate={updateCartItem}
                                />
                              </div>
                              <Price
                                className="text-sm font-semibold text-[#3b5998]"
                                amount={item.cost.totalAmount.amount}
                                currencyCode={item.cost.totalAmount.currencyCode}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Footer with totals and checkout */}
            <div className="border-t border-gray-200 bg-gray-50 p-6">
              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Taxes</span>
                  <Price
                    className="font-semibold text-gray-900"
                    amount={cart.cost.totalTaxAmount.amount}
                    currencyCode={cart.cost.totalTaxAmount.currencyCode}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-600">Calculated at checkout</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-300 pt-2">
                  <span className="text-base font-bold text-gray-900">Total</span>
                  <Price
                    className="text-lg font-bold text-[#3b5998]"
                    amount={cart.cost.totalAmount.amount}
                    currencyCode={cart.cost.totalAmount.currencyCode}
                  />
                </div>
              </div>

              <form action={redirectToCheckout}>
                <CheckoutButton />
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function CheckoutButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="w-full bg-[#3b5998] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#344e86] disabled:cursor-not-allowed disabled:opacity-50"
      type="submit"
      disabled={pending}
    >
      {pending ? <LoadingDots className="bg-white" /> : 'Proceed to Checkout'}
    </button>
  );
}
