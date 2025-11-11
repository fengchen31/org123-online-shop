'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Product } from 'lib/shopify/types';
import { ProductProvider } from 'components/product/product-context';
import { AddToCart } from 'components/cart/add-to-cart';
import { AddToWishlist } from 'components/wishlist/add-to-wishlist';
import { FacebookVariantSelector } from './facebook-variant-selector';
import { FullscreenImageViewer } from './fullscreen-image-viewer';
import { CollapsibleDescription } from './collapsible-description';

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
          className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 sm:right-3 sm:top-3 sm:h-8 sm:w-8 lg:right-4 lg:top-4"
          aria-label="Close"
        >
          <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 md:gap-6 lg:gap-8">
          {/* Left side - Images */}
          <div
            className={`p-3 sm:p-4 md:p-6 lg:p-8 ${isAnimating ? 'animate-image-expand' : ''}`}
          >
            {/* Main image */}
            <div
              className="relative aspect-square w-full cursor-pointer overflow-hidden bg-gray-100"
              onClick={() => setShowFullscreen(true)}
            >
              {images[selectedImageIndex] ? (
                <Image
                  src={images[selectedImageIndex].url}
                  alt={product.title}
                  fill
                  className="object-cover transition-transform hover:scale-105"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  <span>No Image</span>
                </div>
              )}
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
                      className={`relative aspect-square overflow-hidden bg-gray-100 transition-all ${
                        selectedImageIndex === index
                          ? 'border-2 border-[#3b5998] shadow-md'
                          : 'border border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Image
                        src={image.url}
                        alt={`${product.title} - ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>

                {/* Mobile: Dot indicators */}
                <div className="mt-3 flex items-center justify-center gap-2 lg:hidden">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`h-1.5 w-1.5 rounded-full transition-all ${
                        selectedImageIndex === index ? 'bg-[#3b5998] scale-150' : 'bg-gray-400'
                      }`}
                      aria-label={`Select image ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right side - Product info */}
          <div className={`flex flex-col p-3 transition-all duration-500 sm:p-4 md:p-6 lg:p-8 ${
            showContent ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'
          }`}>
            <div className="flex-1">
              <h1 className="text-base font-bold text-gray-900 sm:text-lg lg:text-xl">
                {product.title}
              </h1>

              <p className="mt-2 text-sm font-semibold text-[#3b5998] sm:mt-3 sm:text-base">
                {product.priceRange.maxVariantPrice.currencyCode} {Math.floor(parseFloat(product.priceRange.maxVariantPrice.amount)).toLocaleString()}
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
