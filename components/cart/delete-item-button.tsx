'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { removeItem } from 'components/cart/actions';
import type { CartItem } from 'lib/shopify/types';
import { useActionState } from 'react';

export function DeleteItemButton({
  item,
  optimisticUpdate
}: {
  item: CartItem;
  optimisticUpdate: any;
}) {
  const [message, formAction] = useActionState(removeItem, null);
  const merchandiseId = item.merchandise.id;
  const removeItemAction = formAction.bind(null, merchandiseId);

  return (
    <form
      action={async () => {
        optimisticUpdate(merchandiseId, 'delete');
        removeItemAction();
      }}
    >
      <button
        type="submit"
        aria-label="Remove cart item"
        className="flex h-[20px] w-[20px] items-center justify-center rounded border border-gray-400 bg-gray-100 transition-colors hover:bg-red-100 hover:border-red-400"
      >
        <XMarkIcon className="mx-[1px] h-3.5 w-3.5 text-gray-700 hover:text-red-600" />
      </button>
      <p aria-live="polite" className="sr-only" role="status">
        {message}
      </p>
    </form>
  );
}
