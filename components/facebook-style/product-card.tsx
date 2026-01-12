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

  // Determine which collection name to display
  const displayCollectionName = (() => {
    // If collectionName is "View All", "Sale", or similar, use product's first non-hidden collection
    if (
      !collectionName ||
      collectionName.toLowerCase() === 'view all' ||
      collectionName.toLowerCase() === 'view-all' ||
      collectionName.toLowerCase() === 'all' ||
      collectionName.toLowerCase() === 'sale'
    ) {
      // Find first collection that is not hidden, view-all, or sale
      const validCollection = product.collections?.find(
        (col) =>
          !col.handle.startsWith('hidden-') &&
          col.handle !== 'view-all' &&
          col.handle !== 'all' &&
          col.handle !== 'sale'
      );

      return validCollection?.title || collectionName || 'Product';
    }
    return collectionName;
  })();

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
          className="object-cover"
          enableBlurEffect={true}
        />

        {/* Sale Badge */}
        {product.compareAtPriceRange &&
          parseFloat(product.compareAtPriceRange.maxVariantPrice.amount) > parseFloat(product.priceRange.maxVariantPrice.amount) && (
          <div className="absolute left-2 top-2 bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white sm:text-xs">
            Sale
          </div>
        )}

        {/* Sold Out Fog Effect */}
        {!product.availableForSale && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px]"></div>
        )}
      </div>

      {/* Product Info */}
      <div className="grid min-h-[130px] grid-rows-[auto_minmax(3rem,auto)_1fr_auto] gap-1 p-3 sm:min-h-[140px] sm:p-4">
        {/* Collection Name (Tab Name) - Larger */}
        <div className="text-sm font-bold tracking-wide text-gray-900 sm:text-base">
          {displayCollectionName}
        </div>

        {/* Product Name - Smaller - Min height for 3 lines */}
        <h3 className="line-clamp-3 text-xs leading-tight text-gray-900 sm:text-sm">
          {product.title}
        </h3>

        {/* Flexible spacer to push price to bottom */}
        <div></div>

        {/* Price or Sold Out */}
        {product.availableForSale ? (
          (() => {
            const currentAmount = product.priceRange.maxVariantPrice.amount;
            const currentCurrency = product.priceRange.maxVariantPrice.currencyCode;
            const compareAtAmount = product.compareAtPriceRange?.maxVariantPrice.amount;
            const compareAtCurrency = product.compareAtPriceRange?.maxVariantPrice.currencyCode;

            const hasDiscount = compareAtAmount && parseFloat(compareAtAmount) > parseFloat(currentAmount);

            if (hasDiscount) {
              // Calculate discount percentage
              const discount = Math.round((1 - parseFloat(currentAmount) / parseFloat(compareAtAmount)) * 100);

              // Convert prices
              const currentConverted = convertPrice(currentAmount, currentCurrency);
              const compareAtConverted = convertPrice(compareAtAmount, compareAtCurrency || currentCurrency);

              const currencySymbol = currentConverted.currency === 'TWD' ? 'NT$' : '$';

              return (
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs font-bold text-gray-500 line-through sm:text-sm">
                    {currencySymbol}{Math.floor(parseFloat(compareAtConverted.amount)).toLocaleString()} {compareAtConverted.currency}
                  </p>
                  <p className="text-xs font-bold text-red-600 sm:text-sm">
                    {currencySymbol}{Math.floor(parseFloat(currentConverted.amount)).toLocaleString()} {currentConverted.currency} ({discount}%)
                  </p>
                </div>
              );
            } else {
              // No discount - show regular price with consistent layout
              const converted = convertPrice(currentAmount, currentCurrency);
              return (
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs font-bold text-transparent sm:text-sm">&nbsp;</p>
                  <p className="text-xs font-bold text-gray-900 sm:text-sm">
                    {converted.currency === 'TWD' ? 'NT$' : '$'}{Math.floor(parseFloat(converted.amount)).toLocaleString()} {converted.currency}
                  </p>
                </div>
              );
            }
          })()
        ) : (
          <div className="flex flex-col gap-0.5">
            <p className="text-xs font-bold text-transparent sm:text-sm">&nbsp;</p>
            <p className="text-xs font-bold text-red-600 sm:text-sm">SOLD OUT</p>
          </div>
        )}
      </div>
    </div>
  );
}
