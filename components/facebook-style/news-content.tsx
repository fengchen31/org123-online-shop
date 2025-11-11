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

  console.log('=== Parsing News Posts ===');
  console.log('HTML Body:', htmlBody);

  // Find all article elements or div with class 'post'
  const articles = doc.querySelectorAll('article, .post, [data-post]');
  console.log('Found articles:', articles.length);

  articles.forEach((article, index) => {
    // Extract post data from article element
    const author = article.getAttribute('data-author') || 'org123.xyz';
    const timestamp = article.getAttribute('data-timestamp') || 'Just now';
    const linkTo = article.getAttribute('data-link-to') || '';

    // Get text content (all text not in img tags)
    const textContent = Array.from(article.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'IMG'))
      .map(node => node.textContent?.trim())
      .filter(Boolean)
      .join(' ');

    // Get first image if exists
    const img = article.querySelector('img');
    const imageUrl = img?.getAttribute('src') || '';

    console.log(`Article ${index}:`, { textContent, imageUrl, linkTo });

    if (textContent || imageUrl) {
      posts.push({
        id: `post-${index}`,
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
    console.log('No articles found, trying fallback parsing...');

    // Try to find all images and group them with nearby text
    const body = doc.body;
    const allElements = Array.from(body.children);

    console.log('Body children:', allElements.length);

    // Strategy: Look for patterns of text followed by image, or image with surrounding text
    let i = 0;
    while (i < allElements.length) {
      const element = allElements[i];

      // Check if this element or its children contain an image
      const img = element?.tagName === 'IMG' ? element as HTMLImageElement : element?.querySelector('img');

      if (img) {
        const imageUrl = img.getAttribute('src');
        const linkTo = img.getAttribute('data-link-to') || '';

        // Collect text from current element (excluding img) and previous elements
        let content = '';

        // Get text from current element
        const clone = element?.cloneNode(true) as HTMLElement;
        const images = clone?.querySelectorAll('img');
        images?.forEach(i => i.remove());
        content = clone?.textContent?.trim() || '';

        // If no text in current element, look at previous element
        if (!content && i > 0) {
          const prevElement = allElements[i - 1];
          if (prevElement && !prevElement.querySelector('img')) {
            content = prevElement.textContent?.trim() || '';
          }
        }

        // Use alt text as fallback
        if (!content) {
          content = img.getAttribute('alt') || '';
        }

        console.log(`Image ${posts.length}:`, { content, imageUrl, linkTo });

        if (imageUrl) {
          posts.push({
            id: `post-${posts.length}`,
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

  console.log('Total posts parsed:', posts.length);
  console.log('Posts:', posts);

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
