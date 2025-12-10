'use client';

import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { updateItemQuantity } from 'components/cart/actions';
import LoadingDots from 'components/loading-dots';
import type { CartItem } from 'lib/shopify/types';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

function SubmitButton({ type }: { type: 'plus' | 'minus' }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      aria-label={
        type === 'plus' ? 'Increase item quantity' : 'Reduce item quantity'
      }
      disabled={pending}
      className="ease flex h-full min-w-[24px] max-w-[24px] flex-none items-center justify-center bg-white p-1 transition-all duration-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="inline-flex h-3 w-3 items-center justify-center">
        {pending ? (
          <LoadingDots className="text-gray-700" />
        ) : type === 'plus' ? (
          <PlusIcon className="h-3 w-3 text-gray-700" />
        ) : (
          <MinusIcon className="h-3 w-3 text-gray-700" />
        )}
      </span>
    </button>
  );
}

export function EditItemQuantityButton({
  item,
  type,
  optimisticUpdate
}: {
  item: CartItem;
  type: 'plus' | 'minus';
  optimisticUpdate: any;
}) {
  const [message, formAction] = useActionState(updateItemQuantity, null);
  const payload = {
    merchandiseId: item.merchandise.id,
    quantity: type === 'plus' ? item.quantity + 1 : item.quantity - 1
  };
  const updateItemQuantityAction = formAction.bind(null, payload);

  return (
    <form
      action={async () => {
        optimisticUpdate(payload.merchandiseId, type);
        await updateItemQuantityAction();
      }}
    >
      <SubmitButton type={type} />
      <p aria-live="polite" className="sr-only" role="status">
        {message}
      </p>
    </form>
  );
}
