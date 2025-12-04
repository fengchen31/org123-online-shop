'use client';

import type { Page } from 'lib/shopify/types';
import { NewsFeed, type NewsPost } from './news-feed';
import { useMemo } from 'react';

interface PagesFeedProps {
  pages: Page[];
}

// 格式化日期為相對時間
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

  // 超過一週就顯示實際日期
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// 從 HTML body 中提取第一張圖片 URL
function extractFirstImageUrl(htmlBody: string): string | undefined {
  if (typeof window === 'undefined') return undefined;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlBody, 'text/html');
    const img = doc.querySelector('img');
    return img?.getAttribute('src') || undefined;
  } catch (error) {
    console.error('Error parsing image from page body:', error);
    return undefined;
  }
}

export function PagesFeed({ pages }: PagesFeedProps) {
  // 將 pages 轉換為 NewsPost 格式
  const posts: NewsPost[] = useMemo(() => {
    return pages.map((page) => ({
      id: page.id,
      author: 'org123.xyz',
      authorAvatar: '/images/avatars/org123xyz_head.svg',
      timestamp: formatRelativeTime(page.createdAt),
      content: page.title + (page.bodySummary ? `\n\n${page.bodySummary}` : ''),
      imageUrl: extractFirstImageUrl(page.body)
    }));
  }, [pages]);

  return <NewsFeed posts={posts} />;
}
