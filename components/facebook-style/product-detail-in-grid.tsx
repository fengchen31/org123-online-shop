'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Product } from 'lib/shopify/types';
import { ProductProvider } from 'components/product/product-context';
import { AddToCart } from 'components/cart/add-to-cart';
import { FacebookVariantSelector } from './facebook-variant-selector';
import { FullscreenImageViewer } from './fullscreen-image-viewer';

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
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center border border-gray-300 bg-white text-gray-600 hover:bg-gray-100"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Left side - Images */}
          <div
            className={`p-8 ${isAnimating ? 'animate-image-expand' : ''}`}
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
              <div className="mt-4 grid grid-cols-5 gap-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-square overflow-hidden border-2 bg-gray-100 ${
                      selectedImageIndex === index ? 'border-[#3b5998]' : 'border-gray-300'
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
            )}
          </div>

          {/* Right side - Product info */}
          <div className={`flex flex-col p-8 transition-all duration-500 ${
            showContent ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'
          }`}>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                {product.title}
              </h1>

              <p className="mt-3 text-base font-semibold text-[#3b5998]">
                {product.priceRange.maxVariantPrice.currencyCode} {Math.floor(parseFloat(product.priceRange.maxVariantPrice.amount)).toLocaleString()}
              </p>

              {product.description && (
                <div className="mt-4">
                  <h2 className="text-xs font-bold uppercase text-gray-600">Description</h2>
                  <p className="mt-1 text-sm leading-relaxed text-gray-700">{product.description}</p>
                </div>
              )}

              {/* Variants/Options */}
              <div className="mt-4">
                <FacebookVariantSelector options={product.options} variants={product.variants} />
              </div>
            </div>

            {/* Add to cart button */}
            <div className="mt-8">
              <AddToCart product={product} />
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
