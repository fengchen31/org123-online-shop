'use client';

import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { ImageWithFallback } from './image-with-fallback';
import Image from 'next/image';

export interface NewsPost {
  id: string;
  author: string;
  authorAvatar?: string;
  timestamp: string;
  content: string;
  imageUrl?: string;
  linkTo?: string;
}

interface NewsFeedProps {
  posts: NewsPost[];
  onPostClick?: (collectionHandle: string) => void;
}

interface Comment {
  id: string;
  postId: string;
  author: string;
  userId: string;
  avatar?: string;
  content: string;
  timestamp: string;
}

interface PostState {
  likeCount: number;
  isLiked: boolean;
  comments: Comment[];
  showComments: boolean;
}

interface Customer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export function NewsFeed({ posts, onPostClick }: NewsFeedProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);

  const [postStates, setPostStates] = useState<Record<string, PostState>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    // Fetch customer data
    const fetchCustomer = async () => {
      try {
        const res = await fetch('/api/customer');
        if (res.ok) {
          const data = await res.json();
          setCustomer(data.customer);
        } else {
          setCustomer(null);
        }
      } catch (error) {
        console.error('Error fetching customer:', error);
        setCustomer(null);
      }
    };

    fetchCustomer();

    // Listen for auth status changes
    const handleAuthStatusChange = () => {
      fetchCustomer();
    };

    window.addEventListener('authStatusChange', handleAuthStatusChange as EventListener);

    return () => {
      window.removeEventListener('authStatusChange', handleAuthStatusChange as EventListener);
    };
  }, []);

  useEffect(() => {
    const loadPostData = async () => {
      if (!customer) return;

      const newStates: Record<string, PostState> = {};

      for (const post of posts) {
        try {
          const [likesRes, commentsRes] = await Promise.all([
            fetch(`/api/news-feed/likes?postId=${post.id}`),
            fetch(`/api/news-feed/comments?postId=${post.id}`)
          ]);

          const likesData = await likesRes.json();
          const commentsData = await commentsRes.json();

          newStates[post.id] = {
            likeCount: likesData.count || 0,
            isLiked: likesData.users?.includes(customer.id) || false,
            comments: commentsData.comments || [],
            showComments: false
          };
        } catch (error) {
          console.error(`Failed to load data for post ${post.id}:`, error);
          newStates[post.id] = {
            likeCount: 0,
            isLiked: false,
            comments: [],
            showComments: false
          };
        }
      }

      setPostStates(newStates);
    };

    loadPostData();
  }, [posts, customer]);

  const handleLike = async (postId: string) => {
    if (!customer) {
      alert('Please sign in to like posts');
      return;
    }

    const currentState = postStates[postId];
    if (!currentState) return;

    const action = currentState.isLiked ? 'unlike' : 'like';
    const optimisticCount = currentState.isLiked
      ? currentState.likeCount - 1
      : currentState.likeCount + 1;

    setPostStates(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId]!,
        isLiked: !prev[postId]!.isLiked,
        likeCount: optimisticCount
      }
    }));

    try {
      const response = await fetch('/api/news-feed/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId: customer.id, action })
      });

      const data = await response.json();

      setPostStates(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId]!,
          likeCount: data.count,
          isLiked: data.isLiked
        }
      }));
    } catch (error) {
      console.error('Failed to update like:', error);
      setPostStates(prev => ({
        ...prev,
        [postId]: currentState
      }));
    }
  };

  const handleCommentSubmit = async (postId: string) => {
    if (!customer) {
      alert('Please sign in to comment');
      return;
    }

    const content = commentInputs[postId]?.trim();
    if (!content) return;

    const author = customer.firstName && customer.lastName
      ? `${customer.firstName} ${customer.lastName}`
      : customer.email;

    const optimisticComment: Comment = {
      id: 'temp_' + Date.now(),
      postId,
      author,
      userId: customer.id,
      avatar: customer.avatar,
      content,
      timestamp: new Date().toISOString()
    };

    setPostStates(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId]!,
        comments: [...(prev[postId]?.comments || []), optimisticComment]
      }
    }));

    setCommentInputs(prev => ({ ...prev, [postId]: '' }));

    try {
      const response = await fetch('/api/news-feed/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId: customer.id, author, avatar: customer.avatar, content })
      });

      const data = await response.json();

      setPostStates(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId]!,
          comments: [
            ...prev[postId]!.comments.filter(c => c.id !== optimisticComment.id),
            data.comment
          ]
        }
      }));
    } catch (error) {
      console.error('Failed to post comment:', error);
      setPostStates(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId]!,
          comments: prev[postId]!.comments.filter(c => c.id !== optimisticComment.id)
        }
      }));
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!customer) return;

    const currentComments = postStates[postId]?.comments || [];

    setPostStates(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId]!,
        comments: prev[postId]!.comments.filter(c => c.id !== commentId)
      }
    }));

    try {
      await fetch(`/api/news-feed/comments?commentId=${commentId}&userId=${customer.id}&postId=${postId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Failed to delete comment:', error);
      setPostStates(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId]!,
          comments: currentComments
        }
      }));
    }
  };

  const toggleComments = (postId: string) => {
    setPostStates(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId]!,
        showComments: !prev[postId]?.showComments
      }
    }));
  };

  const handleShare = (post: NewsPost) => {
    // Build URL with post parameter for OG tags, and anchor for scrolling
    const shareUrl = `${window.location.origin}?post=${encodeURIComponent(post.id)}#post-${post.id}`;

    console.log('Share URL:', shareUrl);
    console.log('Post ID:', post.id);
    console.log('Post linkTo:', post.linkTo);

    if (navigator.share) {
      navigator.share({
        title: post.content || post.author,
        text: post.content,
        url: shareUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Link copied to clipboard!');
      });
    }
  };

  if (posts.length === 0) {
    return (
      <div className="text-center text-gray-500">
        <p>No news posts available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => {
        const state = postStates[post.id] || {
          likeCount: 0,
          isLiked: false,
          comments: [],
          showComments: false
        };

        return (
          <div
            key={post.id}
            id={`post-${post.id}`}
            className="border border-gray-300 bg-white shadow-sm scroll-mt-4"
          >
            <div className="flex items-center gap-3 border-b border-gray-200 bg-[#f7f7f7] px-4 py-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden border border-gray-300 bg-white">
                {post.authorAvatar ? (
                  <ImageWithFallback
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

              <div className="flex-1">
                <div className="text-sm font-bold text-[#3b5998]">
                  {post.author}
                </div>
                <div className="text-xs text-gray-500">{post.timestamp}</div>
              </div>
            </div>

            <div>
              {post.content && (
                <div className="px-4 py-3 text-sm text-gray-800 whitespace-pre-wrap">
                  {post.content}
                </div>
              )}

              {post.imageUrl && (
                <div
                  className={clsx(
                    'relative w-full bg-black',
                    post.linkTo && 'cursor-pointer transition-opacity hover:opacity-90'
                  )}
                  onClick={() => post.linkTo && onPostClick?.(post.linkTo)}
                  style={{ maxHeight: '800px' }}
                >
                  <ImageWithFallback
                    src={post.imageUrl}
                    alt={post.content || 'Post image'}
                    width={1200}
                    height={1200}
                    className="w-full h-auto object-contain"
                  />
                </div>
              )}
            </div>

            {/* Post actions - 2010 Facebook style */}
            <div className="border-t border-[#e9ebee] bg-white px-3 py-2">
              {customer ? (
                <div className="flex items-center gap-3 text-xs text-[#365899]">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="font-semibold hover:underline"
                  >
                    Like
                  </button>
                  <span className="text-gray-400">·</span>
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="font-semibold hover:underline"
                  >
                    Comment {state.comments.length > 0 && `(${state.comments.length})`}
                  </button>
                  <span className="text-gray-400">·</span>
                  <button
                    onClick={() => handleShare(post)}
                    className="font-semibold hover:underline"
                  >
                    Share
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-xs text-[#365899]">
                  <button
                    onClick={() => handleShare(post)}
                    className="font-semibold hover:underline"
                  >
                    Share
                  </button>
                </div>
              )}
              {state.likeCount > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  <span className="text-[#365899]">{state.likeCount} {state.likeCount === 1 ? 'person' : 'people'}</span> likes this.
                </div>
              )}
            </div>

            {state.showComments && customer && (
              <div className="border-t border-[#e9ebee] bg-[#eceff5] px-3 py-3">
                <div className="space-y-3">
                  {/* Existing Comments - 2010 Facebook style */}
                  {state.comments.map((comment) => (
                    <div key={comment.id}>
                      <div className="flex gap-2">
                        <div className="relative h-8 w-8 shrink-0 overflow-hidden border border-gray-300 bg-white">
                          {comment.avatar ? (
                            <Image
                              src={comment.avatar}
                              alt={comment.author}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <Image
                              src="/images/avatars/org123xyz_head.svg"
                              alt="Default avatar"
                              fill
                              className="object-contain p-0.5"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-xs">
                            <span className="font-bold text-[#365899]">{comment.author}</span>
                            <span className="ml-1 text-gray-800">{comment.content}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
                            <span>
                              {new Date(comment.timestamp).toLocaleString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              }).replace(',', ' at')}
                            </span>
                            <span className="text-gray-400">·</span>
                            <button className="text-[#365899] hover:underline">Like</button>
                            {comment.userId === customer.id && (
                              <>
                                <span className="text-gray-400">·</span>
                                <button
                                  onClick={() => handleDeleteComment(post.id, comment.id)}
                                  className="text-[#365899] hover:underline"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Comment Input - 2010 Facebook style */}
                  <div className="flex gap-2">
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden border border-gray-300 bg-white">
                      {customer.avatar ? (
                        <Image
                          src={customer.avatar}
                          alt="Your avatar"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <Image
                          src="/images/avatars/org123xyz_head.svg"
                          alt="Default avatar"
                          fill
                          className="object-contain p-0.5"
                        />
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value={commentInputs[post.id] || ''}
                      onChange={(e) =>
                        setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))
                      }
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleCommentSubmit(post.id);
                        }
                      }}
                      style={{ outline: 'none', boxShadow: 'none' }}
                      className="flex-1 border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-800 placeholder-gray-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
