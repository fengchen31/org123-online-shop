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
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
        <ImageWithFallback
          src={images[currentImageIndex]?.url || '/images/default-fallback-image.png'}
          alt={product.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      {/* Product Info */}
      <div className="p-3 sm:p-4">
        {/* Collection Name (Tab Name) - Larger */}
        <div className="mb-1 text-sm font-bold tracking-wide text-gray-900 sm:text-base">
          {collectionName || 'Product'}
        </div>

        {/* Product Name - Smaller */}
        <h3 className="mb-2 line-clamp-2 text-xs leading-tight text-gray-900 sm:text-sm">
          {product.title}
        </h3>

        {/* Price - Smaller, same as product name */}
        <p className="text-xs font-bold text-gray-900 sm:text-sm">
          {(() => {
            const originalAmount = product.priceRange.maxVariantPrice.amount;
            const originalCurrency = product.priceRange.maxVariantPrice.currencyCode;
            const converted = convertPrice(originalAmount, originalCurrency);
            return `${converted.currency === 'TWD' ? 'NT$' : '$'}${Math.floor(parseFloat(converted.amount)).toLocaleString()} ${converted.currency}`;
          })()}
        </p>
      </div>
    </div>
  );
}
