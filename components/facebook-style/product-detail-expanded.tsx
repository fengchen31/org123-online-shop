'use client';

import { useState, useRef, useEffect } from 'react';
import type { Product } from 'lib/shopify/types';
import { ProductProvider } from 'components/product/product-context';
import { AddToCart } from 'components/cart/add-to-cart';
import { AddToWishlist } from 'components/wishlist/add-to-wishlist';
import { FacebookVariantSelector } from './facebook-variant-selector';
import { FullscreenImageViewer } from './fullscreen-image-viewer';
import { CollapsibleDescription } from './collapsible-description';
import { useCurrency } from '../currency-context';
import { ImageWithFallback } from './image-with-fallback';

interface ProductDetailExpandedProps {
  product: Product;
  onClose: () => void;
}

export function ProductDetailExpanded({ product, onClose }: ProductDetailExpandedProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const images = product.images.length > 0 ? product.images : [product.featuredImage];
  const { convertPrice } = useCurrency();

  // 當商品詳情打開時，滾動到頁面最頂端
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Touch swipe handling
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      touchStartX.current = e.touches[0].clientX;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      touchEndX.current = e.touches[0].clientX;
    }
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

  return (
    <ProductProvider>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-6xl animate-scale-in bg-white shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 sm:right-3 sm:top-3"
          aria-label="Close"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="grid gap-8 bg-white md:grid-cols-2">
          {/* Left side - Images */}
          <div className="bg-white p-8">
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
                enableBlurEffect={true}
              />
            </div>

            {/* Thumbnail images - Desktop only */}
            {images.length > 1 && (
              <>
                {/* Desktop: Thumbnail grid */}
                <div className="mt-4 hidden grid-cols-5 lg:grid">
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
                        src={image?.url || '/images/default-fallback-image.png'}
                        alt={`${product.title} - ${index + 1}`}
                        fill
                        sizes="100px"
                        className="object-contain"
                      />
                    </button>
                  ))}
                </div>

                {/* Mobile: Bar buttons */}
                <div className="mt-4 flex items-center gap-1 lg:hidden">
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
          <div className="flex flex-col p-8 pt-16">
            <div className="flex-1 md:flex-none">
              <h1 className="pr-12 text-xl font-bold text-gray-900">
                {product.title}
              </h1>

              <div className="mt-3">
                {(() => {
                  const currentAmount = product.priceRange.maxVariantPrice.amount;
                  const currentCurrency = product.priceRange.maxVariantPrice.currencyCode;
                  const compareAtAmount = product.compareAtPriceRange?.maxVariantPrice.amount;
                  const compareAtCurrency = product.compareAtPriceRange?.maxVariantPrice.currencyCode;
                  const hasDiscount = compareAtAmount && parseFloat(compareAtAmount) > parseFloat(currentAmount);

                  if (hasDiscount) {
                    const currentConverted = convertPrice(currentAmount, currentCurrency);
                    const compareAtConverted = convertPrice(compareAtAmount, compareAtCurrency || currentCurrency);
                    const currencySymbol = currentConverted.currency === 'TWD' ? 'NT$' : '$';
                    const discount = Math.round((1 - parseFloat(currentAmount) / parseFloat(compareAtAmount)) * 100);

                    return (
                      <>
                        <p className="text-base font-semibold text-gray-500 line-through">
                          {currencySymbol}{Math.floor(parseFloat(compareAtConverted.amount)).toLocaleString()} {compareAtConverted.currency}
                        </p>
                        <p className="text-base font-semibold text-red-600">
                          {currencySymbol}{Math.floor(parseFloat(currentConverted.amount)).toLocaleString()} {currentConverted.currency} ({discount}%)
                        </p>
                      </>
                    );
                  } else {
                    const converted = convertPrice(currentAmount, currentCurrency);
                    return (
                      <p className="text-base font-semibold text-[#3b5998]">
                        {converted.currency === 'TWD' ? 'NT$' : '$'}{Math.floor(parseFloat(converted.amount)).toLocaleString()} {converted.currency}
                      </p>
                    );
                  }
                })()}
              </div>

              {/* Collapsible Description - After price */}
              {product.description && (
                <div className="mt-4">
                  <CollapsibleDescription
                    description={product.description}
                    descriptionHtml={product.descriptionHtml}
                  />
                </div>
              )}

              {/* Variants/Options */}
              <div className="mt-4">
                <FacebookVariantSelector options={product.options} variants={product.variants} />
              </div>

              {/* Add to cart and wishlist buttons - follows variant selector on desktop */}
              <div className="mt-4 space-y-3 md:mt-6">
                <AddToCart product={product} />
                <AddToWishlist product={product} />
              </div>
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
    </div>
    </ProductProvider>
  );
}
