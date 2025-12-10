'use client';

import { useState, useEffect, useRef } from 'react';
import type { Product } from 'lib/shopify/types';
import { ProductProvider } from 'components/product/product-context';
import { AddToCart } from 'components/cart/add-to-cart';
import { AddToWishlist } from 'components/wishlist/add-to-wishlist';
import { FacebookVariantSelector } from './facebook-variant-selector';
import { FullscreenImageViewer } from './fullscreen-image-viewer';
import { CollapsibleDescription } from './collapsible-description';
import { useCurrency } from '../currency-context';
import { ImageWithFallback } from './image-with-fallback';

interface ProductDetailInGridProps {
  product: Product;
  startRect: DOMRect | null;
  onClose: () => void;
}

export function ProductDetailInGrid({ product, startRect, onClose }: ProductDetailInGridProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const imageRef = useState<HTMLDivElement | null>(null);
  const images = product.images.length > 0 ? product.images : [product.featuredImage];
  const { convertPrice } = useCurrency();

  // Touch swipe handling
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swiped left - show next image
        setSelectedImageIndex((prev) => (prev + 1 < images.length ? prev + 1 : 0));
      } else {
        // Swiped right - show previous image
        setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      }
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  useEffect(() => {
    // 立即開始動畫
    setIsAnimating(true);

    // 動畫完成後顯示右側內容
    const timer = setTimeout(() => {
      setIsAnimating(false);
      setShowContent(true);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ProductProvider>
      {/* 跨越所有欄位 */}
      <div className="relative col-span-full overflow-hidden border border-gray-300 bg-white shadow-lg">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 sm:right-3 sm:top-3 sm:h-6 sm:w-6"
          aria-label="Close"
        >
          <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="grid gap-3 bg-white sm:gap-4 md:grid-cols-2 md:gap-6 lg:gap-8">
          {/* Left side - Images */}
          <div
            className={`bg-white p-3 sm:p-4 md:p-6 lg:p-8 ${isAnimating ? 'animate-image-expand' : ''}`}
          >
            {/* Main image */}
            <div
              className="relative aspect-square w-full cursor-pointer overflow-hidden bg-white"
              onClick={() => setShowFullscreen(true)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <ImageWithFallback
                src={images[selectedImageIndex]?.url || '/images/default-fallback-image.png'}
                alt={product.title}
                fill
                className="object-contain transition-transform hover:scale-105"
                priority
              />
            </div>

            {/* Thumbnail images */}
            {images.length > 1 && (
              <>
                {/* Desktop: Thumbnail grid */}
                <div className="mt-2 hidden grid-cols-5 lg:mt-4 lg:grid">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative aspect-square overflow-hidden bg-white transition-all ${
                        selectedImageIndex === index
                          ? 'border-2 border-[#3b5998] shadow-md'
                          : 'border border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <ImageWithFallback
                        src={image.url}
                        alt={`${product.title} - ${index + 1}`}
                        fill
                        className="object-contain"
                      />
                    </button>
                  ))}
                </div>

                {/* Mobile: Bar buttons */}
                <div className="mt-3 flex items-center gap-1 lg:hidden">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-1 py-1 transition-colors ${
                        selectedImageIndex === index
                          ? 'bg-[#3b5998]'
                          : 'bg-gray-300 hover:bg-gray-400 active:bg-gray-500'
                      }`}
                      aria-label={`Select image ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right side - Product info */}
          <div className={`flex flex-col p-3 pt-8 transition-all duration-500 sm:p-4 sm:pt-10 md:p-6 md:pt-12 lg:p-8 lg:pt-14 ${
            showContent ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'
          }`}>
            <div className="flex-1">
              <h1 className="pr-8 text-base font-bold text-gray-900 sm:pr-10 sm:text-lg lg:text-xl">
                {product.title}
              </h1>

              <p className="mt-2 text-sm font-semibold text-[#3b5998] sm:mt-3 sm:text-base">
                {(() => {
                  const originalAmount = product.priceRange.maxVariantPrice.amount;
                  const originalCurrency = product.priceRange.maxVariantPrice.currencyCode;
                  const converted = convertPrice(originalAmount, originalCurrency);
                  return `${converted.currency === 'TWD' ? 'NT$' : '$'}${Math.floor(parseFloat(converted.amount)).toLocaleString()} ${converted.currency}`;
                })()}
              </p>

              {/* Collapsible Description - After price */}
              {product.description && (
                <div className="mt-3 sm:mt-4">
                  <CollapsibleDescription
                    description={product.description}
                    descriptionHtml={product.descriptionHtml}
                  />
                </div>
              )}

              {/* Variants/Options */}
              <div className="mt-3 sm:mt-4">
                <FacebookVariantSelector options={product.options} variants={product.variants} />
              </div>
            </div>

            {/* Add to cart and wishlist buttons */}
            <div className="mt-4 space-y-2 sm:mt-6 sm:space-y-3 lg:mt-8">
              <AddToCart product={product} />
              <AddToWishlist product={product} />
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen image viewer */}
      {showFullscreen && (
        <FullscreenImageViewer
          images={images}
          initialIndex={selectedImageIndex}
          onClose={() => setShowFullscreen(false)}
        />
      )}
    </ProductProvider>
  );
}
