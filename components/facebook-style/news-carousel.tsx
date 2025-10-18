'use client';

import clsx from 'clsx';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export interface CarouselSlide {
  imageUrl: string;
  linkTo: string; // collection handle to link to
  alt?: string;
}

interface NewsCarouselProps {
  slides: CarouselSlide[];
  onSlideClick: (collectionHandle: string) => void;
  autoPlayInterval?: number; // milliseconds, default 5000
}

export function NewsCarousel({
  slides,
  onSlideClick,
  autoPlayInterval = 5000
}: NewsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-play functionality
  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [slides.length, autoPlayInterval]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  if (slides.length === 0) {
    return <div className="text-gray-500">No slides available</div>;
  }

  return (
    <div className="relative w-full">
      {/* Main carousel container */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
        {slides.map((slide, index) => (
          <button
            key={index}
            onClick={() => onSlideClick(slide.linkTo)}
            className={clsx(
              'absolute inset-0 transition-opacity duration-500 hover:opacity-90',
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            )}
          >
            <Image
              src={slide.imageUrl}
              alt={slide.alt || `Slide ${index + 1}`}
              fill
              className="object-cover"
              priority={index === 0}
            />
          </button>
        ))}

        {/* Navigation arrows - only show if more than 1 slide */}
        {slides.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-lg transition-all hover:bg-white hover:scale-110"
              aria-label="Previous slide"
            >
              <svg
                className="h-6 w-6 text-gray-800"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-lg transition-all hover:bg-white hover:scale-110"
              aria-label="Next slide"
            >
              <svg
                className="h-6 w-6 text-gray-800"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Dots indicator - only show if more than 1 slide */}
      {slides.length > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={clsx(
                'h-2 w-2 rounded-full transition-all',
                index === currentIndex
                  ? 'w-8 bg-[#3b5998]'
                  : 'bg-gray-300 hover:bg-gray-400'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
