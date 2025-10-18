'use client';

import type { Page } from 'lib/shopify/types';
import { NewsCarousel, type CarouselSlide } from './news-carousel';

interface NewsContentProps {
  page: Page;
  onTabChange: (handle: string) => void;
}

// Parse the page body to extract carousel data
function parseCarouselData(htmlBody: string): CarouselSlide[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlBody, 'text/html');
  const slides: CarouselSlide[] = [];

  // Find all images with data-link-to attribute
  const images = doc.querySelectorAll('img[data-link-to]');
  images.forEach((img) => {
    const imageUrl = img.getAttribute('src');
    const linkTo = img.getAttribute('data-link-to');
    const alt = img.getAttribute('alt');

    if (imageUrl && linkTo) {
      slides.push({
        imageUrl,
        linkTo,
        alt: alt || undefined
      });
    }
  });

  // If no special images found, try to extract all images as simple slides
  if (slides.length === 0) {
    const allImages = doc.querySelectorAll('img');
    allImages.forEach((img, index) => {
      const imageUrl = img.getAttribute('src');
      if (imageUrl) {
        slides.push({
          imageUrl,
          linkTo: '', // No link by default
          alt: img.getAttribute('alt') || `Image ${index + 1}`
        });
      }
    });
  }

  return slides;
}

export function NewsContent({ page, onTabChange }: NewsContentProps) {
  const slides = parseCarouselData(page.body);

  const handleSlideClick = (collectionHandle: string) => {
    if (collectionHandle) {
      onTabChange(collectionHandle);
    }
  };

  if (slides.length > 0) {
    return (
      <div className="space-y-4">
        <NewsCarousel slides={slides} onSlideClick={handleSlideClick} />
        {page.bodySummary && (
          <div className="mt-4 text-sm text-gray-600">{page.bodySummary}</div>
        )}
      </div>
    );
  }

  // Fallback to original HTML display if no images found
  return (
    <div className="space-y-4">
      <div
        className="prose prose-sm max-w-none text-gray-700"
        dangerouslySetInnerHTML={{ __html: page.body }}
      />
    </div>
  );
}
