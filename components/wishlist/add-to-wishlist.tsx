'use client';

import { HeartIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import LoadingDots from 'components/loading-dots';
import { useProduct } from 'components/product/product-context';
import { Product, ProductVariant } from 'lib/shopify/types';
import { useEffect, useState, useTransition } from 'react';

export function AddToWishlist({ product }: { product: Product }) {
  const { variants } = product;
  const { state } = useProduct();
  const [isPending, startTransition] = useTransition();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const variant = variants.find((variant: ProductVariant) =>
    variant.selectedOptions.every(
      (option) => option.value === state[option.name.toLowerCase()]
    )
  );
  const defaultVariantId = variants.length === 1 ? variants[0]?.id : undefined;
  const selectedVariantId = variant?.id || defaultVariantId;

  // Check if user is logged in and if current variant is in wishlist
  useEffect(() => {
    const checkLoginAndWishlist = async () => {
      // Check if user is logged in
      try {
        const customerRes = await fetch('/api/customer');
        if (customerRes.ok) {
          const customerData = await customerRes.json();
          if (customerData.customer) {
            setIsLoggedIn(true);

            // Only check wishlist if user is logged in and variant is selected
            if (selectedVariantId) {
              try {
                const wishlistRes = await fetch('/api/wishlist');
                if (wishlistRes.ok) {
                  const wishlistData = await wishlistRes.json();
                  setIsInWishlist(
                    wishlistData.wishlist?.some((item: any) => item.variantId === selectedVariantId) || false
                  );
                }
              } catch (error) {
                console.error('Error checking wishlist:', error);
              }
            }
          } else {
            setIsLoggedIn(false);
          }
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Error checking customer:', error);
        setIsLoggedIn(false);
      }
    };

    checkLoginAndWishlist();

    // Listen for wishlist updates from other components
    const handleWishlistUpdate = () => {
      checkLoginAndWishlist();
    };

    // Listen for auth status changes (login/logout)
    const handleAuthStatusChange = () => {
      checkLoginAndWishlist();
    };

    window.addEventListener('wishlistUpdate', handleWishlistUpdate);
    window.addEventListener('authStatusChange', handleAuthStatusChange);

    return () => {
      window.removeEventListener('wishlistUpdate', handleWishlistUpdate);
      window.removeEventListener('authStatusChange', handleAuthStatusChange);
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

  // Don't show wishlist button if user is not logged in
  if (!isLoggedIn) {
    return null;
  }

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
        'border-red-500 bg-red-500 text-white hover:bg-red-600': isInWishlist && !isPending,
        'border-gray-300 bg-white text-gray-700 hover:border-red-500 hover:text-red-500': !isInWishlist && !isPending,
        [disabledClasses]: isPending
      })}
      aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <span className="inline-flex h-[1.25rem] items-center justify-center">
        {isPending ? (
          <LoadingDots className={isInWishlist ? 'bg-white' : 'bg-gray-700'} />
        ) : isInWishlist ? (
          <>
            In Wishlist
          </>
        ) : (
          <>
            Add To Wishlist
          </>
        )}
      </span>
    </button>
  );
}
