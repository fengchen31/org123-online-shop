'use client';

import { useState, useEffect, useRef } from 'react';
import type { Product } from 'lib/shopify/types';
import { useCurrency } from '../currency-context';
import { ImageWithFallback } from './image-with-fallback';

interface ProductCardProps {
  product: Product;
  onExpand: (rect: DOMRect) => void;
  isHidden: boolean;
  collectionName?: string;
}

export function ProductCard({ product, onExpand, isHidden, collectionName }: ProductCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { convertPrice } = useCurrency();

  const images = product.images.length > 0 ? product.images : [product.featuredImage];

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
      <div className="relative aspect-square w-full overflow-hidden bg-white">
        <ImageWithFallback
          src={images[currentImageIndex]?.url || '/images/default-fallback-image.png'}
          alt={product.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-contain"
          enableBlurEffect={true}
        />

        {/* Sold Out Fog Effect */}
        {!product.availableForSale && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px]"></div>
        )}
      </div>

      {/* Product Info */}
      <div className="grid h-[110px] grid-rows-[auto_minmax(2.5rem,auto)_1fr_auto] gap-1 p-3 sm:h-[120px] sm:p-4">
        {/* Collection Name (Tab Name) - Larger */}
        <div className="text-sm font-bold tracking-wide text-gray-900 sm:text-base">
          {collectionName || 'Product'}
        </div>

        {/* Product Name - Smaller - Min height for 2 lines */}
        <h3 className="line-clamp-2 text-xs leading-tight text-gray-900 sm:text-sm">
          {product.title}
        </h3>

        {/* Flexible spacer to push price to bottom */}
        <div></div>

        {/* Price or Sold Out */}
        {product.availableForSale ? (
          <p className="text-xs font-bold text-gray-900 sm:text-sm">
            {(() => {
              const originalAmount = product.priceRange.maxVariantPrice.amount;
              const originalCurrency = product.priceRange.maxVariantPrice.currencyCode;
              const converted = convertPrice(originalAmount, originalCurrency);
              return `${converted.currency === 'TWD' ? 'NT$' : '$'}${Math.floor(parseFloat(converted.amount)).toLocaleString()} ${converted.currency}`;
            })()}
          </p>
        ) : (
          <p className="text-xs font-bold text-red-600 sm:text-sm">SOLD OUT</p>
        )}
      </div>
    </div>
  );
}
