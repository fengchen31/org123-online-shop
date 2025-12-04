'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
  enableBlurEffect?: boolean; // New prop to enable blur effect
}

export function ImageWithFallback({
  src,
  alt,
  fill,
  width,
  height,
  sizes,
  className = '',
  priority = false,
  enableBlurEffect = false
}: ImageWithFallbackProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative h-full w-full">
      {/* Loading Skeleton - Only show if blur effect is disabled */}
      {isLoading && !hasError && !enableBlurEffect && (
        <div className="absolute inset-0 animate-pulse bg-gray-200">
          <div className="h-full w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
        </div>
      )}

      {/* Error Fallback */}
      {hasError ? (
        <div className="flex h-full w-full items-center justify-center bg-gray-100">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-2 text-xs text-gray-400">No Image</p>
          </div>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill={fill}
          width={width}
          height={height}
          sizes={sizes}
          className={`${className} ${enableBlurEffect && isLoading ? 'scale-110 blur-lg' : 'scale-100 blur-0'} transition-all duration-700 ease-out`}
          priority={priority}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      )}
    </div>
  );
}
