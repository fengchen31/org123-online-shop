'use client';

import clsx from 'clsx';
import Image from 'next/image';

export interface NewsPost {
  id: string;
  author: string;
  authorAvatar?: string;
  timestamp: string;
  content: string;
  imageUrl?: string;
  linkTo?: string; // collection handle to link to
}

interface NewsFeedProps {
  posts: NewsPost[];
  onPostClick?: (collectionHandle: string) => void;
}

export function NewsFeed({ posts, onPostClick }: NewsFeedProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center text-gray-500">
        <p>No news posts available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div
          key={post.id}
          className="border border-gray-300 bg-white shadow-sm"
        >
          {/* Post Header */}
          <div className="flex items-center gap-3 border-b border-gray-200 bg-[#f7f7f7] px-4 py-3">
            {/* Avatar */}
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm border border-gray-300 bg-white">
              {post.authorAvatar ? (
                <Image
                  src={post.authorAvatar}
                  alt={post.author}
                  fill
                  className="object-contain p-1"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-200 text-xs font-bold text-gray-600">
                  {post.author.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Author and Timestamp */}
            <div className="flex-1">
              <div className="text-sm font-bold text-[#3b5998]">
                {post.author}
              </div>
              <div className="text-xs text-gray-500">{post.timestamp}</div>
            </div>
          </div>

          {/* Post Content */}
          <div>
            {/* Text Content */}
            {post.content && (
              <div className="px-4 py-3 text-sm text-gray-800">
                {post.content}
              </div>
            )}

            {/* Image Content */}
            {post.imageUrl && (
              <div
                className={clsx(
                  'relative h-[300px] w-full overflow-hidden sm:h-[400px] md:h-[500px]',
                  post.linkTo && 'cursor-pointer transition-opacity hover:opacity-90'
                )}
                onClick={() => post.linkTo && onPostClick?.(post.linkTo)}
              >
                <Image
                  src={post.imageUrl}
                  alt={post.content || 'Post image'}
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>

          {/* Post Actions - Old Facebook style */}
          <div className="border-t border-gray-200 bg-white px-4 py-2">
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <button className="transition-colors hover:text-[#3b5998]">
                <span className="font-semibold">Comment</span>
              </button>
              <button className="transition-colors hover:text-[#3b5998]">
                <span className="font-semibold">Like</span>
              </button>
              <button className="transition-colors hover:text-[#3b5998]">
                <span className="font-semibold">Share</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
