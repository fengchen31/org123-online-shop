'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import Image from 'next/image';
import type { Product } from 'lib/shopify/types';

interface ProductCardProps {
  product: Product;
  onExpand: (rect: DOMRect) => void;
  isHidden: boolean;
}

export function ProductCard({ product, onExpand, isHidden }: ProductCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const images = product.images.length > 0 ? product.images : [product.featuredImage];

  // Check if product is in wishlist
  useEffect(() => {
    const checkWishlist = async () => {
      try {
        const res = await fetch('/api/wishlist');
        if (res.ok) {
          const data = await res.json();
          setIsInWishlist(data.wishlist?.includes(product.id) || false);
        }
      } catch (error) {
        console.error('Error checking wishlist:', error);
      }
    };
    checkWishlist();
  }, [product.id]);

  useEffect(() => {
    if (isHovering && images.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 800); // 每 800ms 切換一張圖片
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setCurrentImageIndex(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isHovering, images.length]);

  const handleClick = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      onExpand(rect);
    }
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    startTransition(async () => {
      const previousState = isInWishlist;
      setIsInWishlist(!isInWishlist);

      try {
        const res = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
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

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      className={`group cursor-pointer overflow-hidden border border-gray-300 bg-white shadow-sm transition-all duration-300 hover:shadow-md ${
        isHidden ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
      }`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Product Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
        {images[currentImageIndex] ? (
          <Image
            src={images[currentImageIndex].url}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            <span>No Image</span>
          </div>
        )}

        {/* Wishlist Button - Show on hover */}
        <div
          className={`absolute right-2 top-2 transition-opacity duration-200 ${
            isHovering ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <button
            onClick={handleWishlistToggle}
            disabled={isPending}
            className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all ${
              isInWishlist
                ? 'border-red-500 bg-red-500 text-white'
                : 'border-white bg-white/90 text-gray-700 hover:bg-white'
            } ${isPending ? 'cursor-not-allowed opacity-50' : ''}`}
            aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="line-clamp-1 text-xs font-bold uppercase text-gray-900">
            {product.title}
          </h3>
          <p className="whitespace-nowrap text-xs font-bold text-gray-900">
            {product.priceRange.maxVariantPrice.currencyCode}
            {Math.floor(parseFloat(product.priceRange.maxVariantPrice.amount)).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
