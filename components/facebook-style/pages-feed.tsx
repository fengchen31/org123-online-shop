'use client';

import type { Article } from 'lib/shopify/types';
import { NewsFeed, type NewsPost } from './news-feed';
import { useMemo } from 'react';

interface PagesFeedProps {
  articles: Article[];
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
  if (typeof window === 'undefined') {
    // Server-side: use regex to extract image URL
    const imgMatch = htmlBody.match(/<img[^>]+src=["']([^"']+)["']/i);
    return imgMatch ? imgMatch[1] : undefined;
  }

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

// 從 HTML 中提取純文字內容（客戶端和伺服器端使用相同邏輯）
function extractTextFromHtml(htmlBody: string): string {
  // 使用 regex 方法，確保客戶端和伺服器端結果一致
  const text = htmlBody
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();

  return text;
}

export function PagesFeed({ articles }: PagesFeedProps) {
  // 將 articles 轉換為 NewsPost 格式
  const posts: NewsPost[] = useMemo(() => {
    // 按 publishedAt 降序排序（最新的在最上面）
    const sortedArticles = [...articles].sort((a, b) => {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    return sortedArticles.map((article) => {
      // 使用 extractTextFromHtml 從 contentHtml 提取文字
      const content = extractTextFromHtml(article.contentHtml);

      return {
        id: article.id,
        author: 'org123.xyz',
        authorAvatar: '/images/avatars/org123xyz_head.svg',
        timestamp: formatRelativeTime(article.publishedAt),
        content, // 顯示完整內文（純文字）
        imageUrl: article.image?.url || extractFirstImageUrl(article.contentHtml)
      };
    });
  }, [articles]);

  return <NewsFeed posts={posts} />;
}
