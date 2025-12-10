'use client';

import { PlusIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { addItem } from 'components/cart/actions';
import { useProduct } from 'components/product/product-context';
import { Product, ProductVariant } from 'lib/shopify/types';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useCart } from './cart-context';
import LoadingDots from 'components/loading-dots';

function SubmitButton({
  availableForSale,
  selectedVariantId
}: {
  availableForSale: boolean;
  selectedVariantId: string | undefined;
}) {
  const { pending } = useFormStatus();
  const buttonClasses =
    'flex w-full items-center justify-center border bg-[#3b5998] py-2 text-sm font-semibold text-white transition-colors';
  const disabledClasses = 'cursor-not-allowed opacity-60 hover:opacity-60';

  if (!availableForSale) {
    return (
      <button disabled className="flex w-full cursor-not-allowed items-center justify-center border bg-red-600 py-2 text-sm font-semibold text-white opacity-90">
        Out Of Stock
      </button>
    );
  }

  if (!selectedVariantId) {
    return (
      <button
        aria-label="Please select an option"
        disabled
        className={clsx(buttonClasses, disabledClasses)}
      >
        Add To Cart
      </button>
    );
  }

  return (
    <button
      aria-label="Add to cart"
      disabled={pending}
      className={clsx(buttonClasses, {
        'hover:bg-[#324a7f]': !pending,
        [disabledClasses]: pending
      })}
    >
      <span className="inline-flex h-[1.25rem] items-center justify-center">
        {pending ? <LoadingDots className="text-white" /> : 'Add To Cart'}
      </span>
    </button>
  );
}

export function AddToCart({ product }: { product: Product }) {
  const { variants, availableForSale } = product;
  const { addCartItem } = useCart();
  const { state } = useProduct();
  const [message, formAction] = useActionState(addItem, null);

  const variant = variants.find((variant: ProductVariant) =>
    variant.selectedOptions.every(
      (option) => option.value === state[option.name.toLowerCase()]
    )
  );
  const defaultVariantId = variants.length === 1 ? variants[0]?.id : undefined;
  const selectedVariantId = variant?.id || defaultVariantId;
  const addItemAction = formAction.bind(null, selectedVariantId);
  const finalVariant = variants.find(
    (variant) => variant.id === selectedVariantId
  )!;

  return (
    <form
      action={async () => {
        addCartItem(finalVariant, product);
        await addItemAction();
      }}
    >
      <SubmitButton
        availableForSale={availableForSale}
        selectedVariantId={selectedVariantId}
      />
      <p aria-live="polite" className="sr-only" role="status">
        {message}
      </p>
    </form>
  );
}
