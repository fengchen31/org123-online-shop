'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { removeItem } from 'components/cart/actions';
import LoadingDots from 'components/loading-dots';
import type { CartItem } from 'lib/shopify/types';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

function RemoveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      aria-label="Remove cart item"
      disabled={pending}
      className="border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-300 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="inline-flex h-[1rem] min-w-[2.5rem] items-center justify-center">
        {pending ? <LoadingDots className="bg-gray-700" /> : 'Remove'}
      </span>
    </button>
  );
}

export function DeleteItemButton({
  item,
  optimisticUpdate
}: {
  item: CartItem;
  optimisticUpdate: any;
}) {
  const merchandiseId = item.merchandise.id;
  const [message, formAction] = useActionState(removeItem, null);

  return (
    <form
      action={async () => {
        console.log('=== Delete button clicked ===');
        console.log('Merchandise ID:', merchandiseId);

        // Optimistic update first
        optimisticUpdate(merchandiseId, 'delete');

        // Then call server action
        console.log('Calling removeItem server action...');
        await formAction(merchandiseId);
        console.log('removeItem completed');
      }}
    >
      <RemoveButton />
      <p aria-live="polite" className="sr-only" role="status">
        {message}
      </p>
    </form>
  );
}
