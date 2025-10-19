'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import type { Image as ProductImage } from 'lib/shopify/types';

interface FullscreenImageViewerProps {
  images: ProductImage[];
  initialIndex: number;
  onClose: () => void;
}

export function FullscreenImageViewer({ images, initialIndex, onClose }: FullscreenImageViewerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to initial image on mount
    if (scrollContainerRef.current) {
      const imageElement = scrollContainerRef.current.children[initialIndex] as HTMLElement;
      if (imageElement) {
        imageElement.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    }

    // Prevent body scroll when viewer is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [initialIndex]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] bg-white"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="fixed right-4 top-4 z-20 flex h-8 w-8 items-center justify-center border border-gray-300 bg-white text-gray-600 shadow-md transition-colors hover:bg-gray-100"
        aria-label="Close"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Scrollable image container */}
      <div
        ref={scrollContainerRef}
        className="h-full w-full overflow-y-auto overflow-x-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {images.map((image, index) => (
          <div
            key={index}
            className="flex min-h-screen w-full items-center justify-center bg-white"
          >
            <div className="relative h-screen w-full">
              <Image
                src={image.url}
                alt={image.altText || `Product image ${index + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
                priority={index === initialIndex}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
