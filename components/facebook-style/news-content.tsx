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

    // Get text content (all text not in img tags)
    const textContent = Array.from(article.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'IMG'))
      .map(node => node.textContent?.trim())
      .filter(Boolean)
      .join(' ');

    // Get first image if exists
    const img = article.querySelector('img');
    const imageUrl = img?.getAttribute('src') || '';

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
    const images = doc.querySelectorAll('img');
    images.forEach((img, index) => {
      const imageUrl = img.getAttribute('src');
      const linkTo = img.getAttribute('data-link-to') || '';
      const alt = img.getAttribute('alt') || '';

      // Try to find associated text (next sibling or parent's text)
      let content = alt;
      const parent = img.parentElement;
      if (parent) {
        const textNodes = Array.from(parent.childNodes)
          .filter(node => node.nodeType === Node.TEXT_NODE)
          .map(node => node.textContent?.trim())
          .filter(Boolean);
        if (textNodes.length > 0) {
          content = textNodes.join(' ');
        }
      }

      if (imageUrl) {
        posts.push({
          id: `post-${index}`,
          author: 'org123.xyz',
          authorAvatar: '/images/avatars/org123xyz_head.svg',
          timestamp: 'Just now',
          content: content,
          imageUrl,
          linkTo: linkTo || undefined
        });
      }
    });
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
