'use client';

import { addItem } from 'components/cart/actions';
import { useCart } from 'components/cart/cart-context';
import type { WishlistVariant } from 'lib/shopify/types';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCart: () => void;
}

export function WishlistDrawer({ isOpen, onClose, onOpenCart }: WishlistDrawerProps) {
  const [variants, setVariants] = useState<WishlistVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addCartItem } = useCart();
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [addingToCartIds, setAddingToCartIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen) {
      fetchWishlist();
    }
  }, [isOpen]);

  const fetchWishlist = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/wishlist');
      if (res.ok) {
        const data = await res.json();
        const wishlistItems = data.wishlist || [];

        // Fetch variant details for each wishlist item
        const variantPromises = wishlistItems.map(async (item: any) => {
          try {
            const variantRes = await fetch(`/api/variant/${encodeURIComponent(item.variantId)}`);
            if (variantRes.ok) {
              return await variantRes.json();
            }
          } catch (error) {
            console.error('Error fetching variant:', error);
          }
          return null;
        });

        const variantResults = await Promise.all(variantPromises);
        setVariants(variantResults.filter((v): v is WishlistVariant => v !== null));
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (variantId: string) => {
    setRemovingIds((prev) => new Set(prev).add(variantId));

    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId,
          productId: '',
          productHandle: '',
          action: 'remove'
        })
      });

      if (!res.ok) {
        throw new Error('Failed to remove from wishlist');
      }

      const data = await res.json();

      // Update local state
      setVariants((prev) => prev.filter((v) => v.id !== variantId));

      // Dispatch event to update wishlist counter
      window.dispatchEvent(
        new CustomEvent('wishlistUpdate', {
          detail: { count: data.wishlist?.length || 0 }
        })
      );
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    } finally {
      setRemovingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(variantId);
        return newSet;
      });
    }
  };

  const handleAddToCart = async (variant: WishlistVariant) => {
    setAddingToCartIds((prev) => new Set(prev).add(variant.id));

    try {
      // Add to cart first (server action)
      const addResult = await addItem(null, variant.id);

      if (addResult) {
        // If there's an error message, show it
        console.error('Error adding to cart:', addResult);
        alert('Failed to add item to cart. Please try again.');
        setAddingToCartIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(variant.id);
          return newSet;
        });
        return;
      }

      // Then update the optimistic UI using startTransition
      startTransition(() => {
        addCartItem(
          {
            id: variant.id,
            title: variant.title,
            availableForSale: variant.availableForSale,
            selectedOptions: variant.selectedOptions,
            price: variant.price
          },
          {
            id: variant.product.id,
            handle: variant.product.handle,
            title: variant.product.title,
            featuredImage: variant.product.featuredImage || variant.image!,
            availableForSale: true,
            description: '',
            descriptionHtml: '',
            options: [],
            priceRange: {
              maxVariantPrice: variant.price,
              minVariantPrice: variant.price
            },
            variants: [],
            images: [],
            seo: { title: variant.product.title, description: '' },
            tags: [],
            updatedAt: ''
          }
        );
      });

      // Remove from wishlist
      const removeRes = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: variant.id,
          productId: '',
          productHandle: '',
          action: 'remove'
        })
      });

      if (removeRes.ok) {
        const data = await removeRes.json();

        // Update local state
        setVariants((prev) => prev.filter((v) => v.id !== variant.id));

        // Dispatch event to update wishlist counter
        window.dispatchEvent(
          new CustomEvent('wishlistUpdate', {
            detail: { count: data.wishlist?.length || 0 }
          })
        );

        // Close wishlist drawer and open cart drawer
        onClose();
        onOpenCart();
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    } finally {
      setAddingToCartIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(variant.id);
        return newSet;
      });
    }
  };

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
        className={`fixed right-0 top-0 z-50 h-full w-full bg-white shadow-2xl transition-transform duration-300 ease-in-out sm:w-[420px] md:w-[500px] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Wishlist</h2>
            <p className="text-xs text-gray-600 sm:text-sm">
              {variants.length} {variants.length === 1 ? 'item' : 'items'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center text-gray-600 hover:bg-gray-100 sm:h-8 sm:w-8"
            aria-label="Close"
          >
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-64px)] overflow-y-auto p-3 sm:h-[calc(100%-80px)] sm:p-4 md:p-6">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : variants.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center space-y-4">
              <div className="text-center">
                <h3 className="mb-1 text-base font-semibold text-gray-900 sm:text-lg">Your wishlist is empty</h3>
              </div>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {variants.map((variant) => {
                const isRemoving = removingIds.has(variant.id);
                const isAddingToCart = addingToCartIds.has(variant.id);
                const imageUrl = variant.image?.url || variant.product.featuredImage?.url;

                return (
                  <div
                    key={variant.id}
                    className={`overflow-hidden border border-gray-200 bg-white transition-all ${
                      isRemoving ? 'scale-95 opacity-50' : ''
                    }`}
                  >
                    <div className="flex gap-2 p-2 sm:gap-3 sm:p-3 md:gap-4 md:p-4">
                      {/* Image */}
                      <Link href={`/product/${variant.product.handle}`} onClick={onClose}>
                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden bg-gray-100 sm:h-20 sm:w-20 md:h-24 md:w-24">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={variant.product.title}
                              fill
                              sizes="96px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-gray-400">
                              No Image
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Info */}
                      <div className="flex flex-1 flex-col">
                        <Link href={`/product/${variant.product.handle}`} onClick={onClose}>
                          <h3 className="mb-1 text-xs font-semibold text-gray-900 hover:text-[#3b5998] sm:text-sm">
                            {variant.product.title}
                          </h3>
                        </Link>

                        {/* Variant Options */}
                        <div className="mb-2 flex flex-wrap gap-1">
                          {variant.selectedOptions.map((option, index) => (
                            <span
                              key={index}
                              className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                            >
                              {option.value}
                            </span>
                          ))}
                        </div>

                        {/* Price */}
                        <p className="mb-3 text-sm font-semibold text-[#3b5998]">
                          {variant.price.currencyCode}{' '}
                          {Math.floor(parseFloat(variant.price.amount)).toLocaleString()}
                        </p>

                        {/* Buttons */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleAddToCart(variant)}
                            disabled={!variant.availableForSale || isAddingToCart || isPending}
                            className="bg-[#3b5998] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#344e86] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isAddingToCart || isPending
                              ? 'Adding...'
                              : !variant.availableForSale
                                ? 'Out of Stock'
                                : 'Add to Cart'}
                          </button>
                          <button
                            onClick={() => handleRemove(variant.id)}
                            disabled={isRemoving}
                            className="border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isRemoving ? 'Removing...' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
