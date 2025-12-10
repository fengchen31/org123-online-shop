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
      className="flex h-6 w-6 items-center justify-center border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? (
        <LoadingDots className="text-gray-700" />
      ) : (
        <XMarkIcon className="h-3.5 w-3.5 stroke-2" />
      )}
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
