'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { removeItem } from 'components/cart/actions';
import type { CartItem } from 'lib/shopify/types';
import { useTransition } from 'react';

export function DeleteItemButton({
  item,
  optimisticUpdate
}: {
  item: CartItem;
  optimisticUpdate: any;
}) {
  const merchandiseId = item.merchandise.id;
  const [, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label="Remove cart item"
      onClick={() => {
        startTransition(async () => {
          optimisticUpdate(merchandiseId, 'delete');
          await removeItem(null, merchandiseId);
        });
      }}
      className="flex h-6 w-6 items-center justify-center border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-100"
    >
      <XMarkIcon className="h-3.5 w-3.5 stroke-2" />
    </button>
  );
}
