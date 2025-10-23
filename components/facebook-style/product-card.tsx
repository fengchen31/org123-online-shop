'use client';

import { useState, useEffect, useRef } from 'react';
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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
      </div>

      {/* Product Info */}
      <div className="p-2 sm:p-3 lg:p-4">
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          <h3 className="line-clamp-1 text-[10px] font-bold uppercase text-gray-900 sm:text-xs">
            {product.title}
          </h3>
          <p className="whitespace-nowrap text-[10px] font-bold text-gray-900 sm:text-xs">
            {product.priceRange.maxVariantPrice.currencyCode}
            {Math.floor(parseFloat(product.priceRange.maxVariantPrice.amount)).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
