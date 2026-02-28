'use client';

import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { updateItemQuantity } from 'components/cart/actions';
import type { CartItem } from 'lib/shopify/types';
import { useTransition } from 'react';

export function EditItemQuantityButton({
  item,
  type,
  optimisticUpdate
}: {
  item: CartItem;
  type: 'plus' | 'minus';
  optimisticUpdate: any;
}) {
  const payload = {
    merchandiseId: item.merchandise.id,
    quantity: type === 'plus' ? item.quantity + 1 : item.quantity - 1
  };
  const [, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label={
        type === 'plus' ? 'Increase item quantity' : 'Reduce item quantity'
      }
      onClick={() => {
        startTransition(async () => {
          optimisticUpdate(payload.merchandiseId, type);
          await updateItemQuantity(null, payload);
        });
      }}
      className="ease flex h-full min-w-[24px] max-w-[24px] flex-none items-center justify-center bg-white p-1 transition-all duration-200 hover:bg-gray-50"
    >
      {type === 'plus' ? (
        <PlusIcon className="h-3 w-3 text-gray-700" />
      ) : (
        <MinusIcon className="h-3 w-3 text-gray-700" />
      )}
    </button>
  );
}
