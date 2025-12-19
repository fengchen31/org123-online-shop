'use client';

import { useState, useEffect } from 'react';
import type { Page } from 'lib/shopify/types';
import { NewsFeed, type NewsPost } from './news-feed';

interface NewsContentProps {
  page: Page;
  onTabChange: (handle: string) => void;
}

// Parse the page body to extract news posts
function parseNewsPosts(htmlBody: string): NewsPost[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlBody, 'text/html');
  const posts: NewsPost[] = [];

  // Find all article elements or div with class 'post'
  const articles = doc.querySelectorAll('article, .post, [data-post]');

  articles.forEach((article, index) => {
    // Extract post data from article element
    const author = article.getAttribute('data-author') || 'org123.xyz';
    const timestamp = article.getAttribute('data-timestamp') || 'Just now';
    const linkTo = article.getAttribute('data-link-to') || '';

    // Get HTML content (all content not in img tags)
    const clone = article.cloneNode(true) as HTMLElement;
    const images = clone.querySelectorAll('img');
    images.forEach(img => img.remove());
    const textContent = clone.innerHTML.trim();

    // Get first image if exists
    const img = article.querySelector('img');
    const imageUrl = img?.getAttribute('src') || '';

    if (textContent || imageUrl) {
      // Use collection handle as ID if linkTo exists
      const postId = linkTo ? `collection-${linkTo}` : `post-${index}`;
      posts.push({
        id: postId,
        author,
        authorAvatar: '/images/avatars/org123xyz_head.svg',
        timestamp,
        content: textContent,
        imageUrl: imageUrl || undefined,
        linkTo: linkTo || undefined
      });
    }
  });

  // If no articles found, try to parse as simple image + text pairs
  if (posts.length === 0) {
    // Try to find all images and group them with nearby text
    const body = doc.body;
    const allElements = Array.from(body.children);

    // Strategy: Look for patterns of text followed by image, or image with surrounding text
    let i = 0;
    while (i < allElements.length) {
      const element = allElements[i];

      // Check if this element or its children contain an image
      const img = element?.tagName === 'IMG' ? element as HTMLImageElement : element?.querySelector('img');

      if (img) {
        const imageUrl = img.getAttribute('src');
        const linkTo = img.getAttribute('data-link-to') || '';

        // Collect HTML content from current element (excluding img) and previous elements
        let content = '';

        // Get HTML content from current element
        const clone = element?.cloneNode(true) as HTMLElement;
        const images = clone?.querySelectorAll('img');
        images?.forEach(i => i.remove());
        content = clone?.innerHTML?.trim() || '';

        // If no content in current element, look at previous element
        if (!content && i > 0) {
          const prevElement = allElements[i - 1];
          if (prevElement && !prevElement.querySelector('img')) {
            const prevClone = prevElement.cloneNode(true) as HTMLElement;
            const prevImages = prevClone.querySelectorAll('img');
            prevImages.forEach(i => i.remove());
            content = prevClone.innerHTML?.trim() || '';
          }
        }

        // Use alt text as fallback
        if (!content) {
          content = img.getAttribute('alt') || '';
        }

        if (imageUrl) {
          // Use collection handle as ID if linkTo exists
          const postId = linkTo ? `collection-${linkTo}` : `post-${posts.length}`;
          posts.push({
            id: postId,
            author: 'org123.xyz',
            authorAvatar: '/images/avatars/org123xyz_head.svg',
            timestamp: 'Just now',
            content: content,
            imageUrl,
            linkTo: linkTo || undefined
          });
        }
      }

      i++;
    }
  }

  return posts;
}

export function NewsContent({ page, onTabChange }: NewsContentProps) {
  const [posts, setPosts] = useState<NewsPost[]>([]);

  useEffect(() => {
    // Parse on client side only
    const parsedPosts = parseNewsPosts(page.body);
    setPosts(parsedPosts);
  }, [page.body]);

  const handlePostClick = (collectionHandle: string) => {
    if (collectionHandle) {
      onTabChange(collectionHandle);
    }
  };

  if (posts.length > 0) {
    return (
      <div className="space-y-4">
        <NewsFeed posts={posts} onPostClick={handlePostClick} />
      </div>
    );
  }

  // Fallback to original HTML display if no posts found
  return (
    <div className="space-y-4">
      <div
        className="prose prose-sm max-w-none text-gray-700"
        dangerouslySetInnerHTML={{ __html: page.body }}
      />
    </div>
  );
}
