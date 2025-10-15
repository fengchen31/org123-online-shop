'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Product } from 'lib/shopify/types';
import { ProductProvider } from 'components/product/product-context';
import { AddToCart } from 'components/cart/add-to-cart';

interface ProductDetailExpandedProps {
  product: Product;
  onClose: () => void;
}

export function ProductDetailExpanded({ product, onClose }: ProductDetailExpandedProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const images = product.images.length > 0 ? product.images : [product.featuredImage];

  return (
    <ProductProvider value={product}>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-6xl animate-scale-in bg-white shadow-2xl">
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
          <div className="p-8">
            {/* Main image */}
            <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
              {images[selectedImageIndex] ? (
                <Image
                  src={images[selectedImageIndex].url}
                  alt={product.title}
                  fill
                  className="object-cover"
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
          <div className="flex flex-col p-8">
            <div className="flex-1">
              <h1 className="text-2xl font-bold uppercase text-gray-900">
                {product.title}
              </h1>

              <p className="mt-4 text-3xl font-bold text-[#3b5998]">
                {product.priceRange.maxVariantPrice.currencyCode}
                {Math.floor(parseFloat(product.priceRange.maxVariantPrice.amount)).toLocaleString()}
              </p>

              {product.description && (
                <div className="mt-6">
                  <h2 className="text-sm font-bold uppercase text-gray-700">Description</h2>
                  <p className="mt-2 text-sm text-gray-600">{product.description}</p>
                </div>
              )}

              {/* Variants/Options */}
              {product.options.map((option) => (
                <div key={option.id} className="mt-6">
                  <h3 className="text-sm font-bold uppercase text-gray-700">{option.name}</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {option.values.map((value) => (
                      <button
                        key={value}
                        className="border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:border-[#3b5998] hover:bg-gray-50"
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Add to cart button */}
            <div className="mt-8">
              <AddToCart product={product} />
            </div>
          </div>
        </div>
      </div>
    </div>
    </ProductProvider>
  );
}
