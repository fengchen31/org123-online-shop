'use client';

import { HeartIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useProduct } from 'components/product/product-context';
import { Product, ProductVariant } from 'lib/shopify/types';
import { useEffect, useState, useTransition } from 'react';

export function AddToWishlist({ product }: { product: Product }) {
  const { variants } = product;
  const { state } = useProduct();
  const [isPending, startTransition] = useTransition();
  const [isInWishlist, setIsInWishlist] = useState(false);

  const variant = variants.find((variant: ProductVariant) =>
    variant.selectedOptions.every(
      (option) => option.value === state[option.name.toLowerCase()]
    )
  );
  const defaultVariantId = variants.length === 1 ? variants[0]?.id : undefined;
  const selectedVariantId = variant?.id || defaultVariantId;

  // Check if current variant is in wishlist
  useEffect(() => {
    const checkWishlist = async () => {
      if (!selectedVariantId) return;

      try {
        const res = await fetch('/api/wishlist');
        if (res.ok) {
          const data = await res.json();
          setIsInWishlist(
            data.wishlist?.some((item: any) => item.variantId === selectedVariantId) || false
          );
        }
      } catch (error) {
        console.error('Error checking wishlist:', error);
      }
    };
    checkWishlist();

    // Listen for wishlist updates from other components
    const handleWishlistUpdate = () => {
      checkWishlist();
    };

    window.addEventListener('wishlistUpdate', handleWishlistUpdate);

    return () => {
      window.removeEventListener('wishlistUpdate', handleWishlistUpdate);
    };
  }, [selectedVariantId]);

  const handleWishlistToggle = async () => {
    if (!selectedVariantId) return;

    startTransition(async () => {
      const previousState = isInWishlist;
      setIsInWishlist(!isInWishlist);

      try {
        const res = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            variantId: selectedVariantId,
            productId: product.id,
            productHandle: product.handle,
            action: isInWishlist ? 'remove' : 'add'
          })
        });

        if (!res.ok) {
          throw new Error('Failed to update wishlist');
        }

        const data = await res.json();
        window.dispatchEvent(
          new CustomEvent('wishlistUpdate', {
            detail: { count: data.wishlist?.length || 0 }
          })
        );
      } catch (error) {
        console.error('Error toggling wishlist:', error);
        setIsInWishlist(previousState);
      }
    });
  };

  const buttonClasses =
    'flex w-full items-center justify-center gap-2 border py-2 text-sm font-semibold transition-colors';
  const disabledClasses = 'cursor-not-allowed opacity-60';

  if (!selectedVariantId) {
    return (
      <button disabled className={clsx(buttonClasses, 'border-gray-300 bg-gray-100 text-gray-500', disabledClasses)}>
        <HeartIcon className="h-5 w-5" />
        Select Variant
      </button>
    );
  }

  return (
    <button
      onClick={handleWishlistToggle}
      disabled={isPending}
      className={clsx(buttonClasses, {
        'border-red-500 bg-red-500 text-white hover:bg-red-600': isInWishlist,
        'border-gray-300 bg-white text-gray-700 hover:border-red-500 hover:text-red-500': !isInWishlist,
        [disabledClasses]: isPending
      })}
      aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      {isInWishlist ? (
        <>
          In Wishlist
        </>
      ) : (
        <>
          Add To Wishlist
        </>
      )}
    </button>
  );
}
