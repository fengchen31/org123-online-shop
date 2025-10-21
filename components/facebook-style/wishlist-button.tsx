'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export function FacebookWishlistButton() {
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const fetchWishlistCount = async () => {
      try {
        const res = await fetch('/api/wishlist');
        if (res.ok) {
          const data = await res.json();
          setWishlistCount(data.wishlist?.length || 0);
        }
      } catch (error) {
        console.error('Error fetching wishlist count:', error);
      }
    };

    fetchWishlistCount();

    const handleWishlistUpdate = (event: CustomEvent) => {
      setWishlistCount(event.detail.count);
    };

    window.addEventListener('wishlistUpdate', handleWishlistUpdate as EventListener);

    return () => {
      window.removeEventListener('wishlistUpdate', handleWishlistUpdate as EventListener);
    };
  }, []);

  return (
    <Link
      href="/facebook-style/wishlist"
      className="relative flex h-8 w-8 items-center justify-center text-white transition-opacity hover:opacity-80"
      aria-label="Wishlist"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
      {wishlistCount > 0 && (
        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
          {wishlistCount}
        </div>
      )}
    </Link>
  );
}
