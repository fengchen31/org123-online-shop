'use client';

import { useCart } from 'components/cart/cart-context';
import { Menu } from 'lib/shopify/types';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { AccountDrawer } from './account-drawer';
import { CartDrawer } from './cart-drawer';
import { WishlistDrawer } from './wishlist-drawer';

interface FacebookHeaderClientProps {
  menu: Menu[];
}

export function FacebookHeaderClient({ menu }: FacebookHeaderClientProps) {
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);
  const [isWishlistDrawerOpen, setIsWishlistDrawerOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const { cart } = useCart();
  const quantityRef = useRef(cart?.totalQuantity);

  useEffect(() => {
    // Initial fetch
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

    // Listen for wishlist updates
    const handleWishlistUpdate = (event: CustomEvent) => {
      setWishlistCount(event.detail.count);
    };

    window.addEventListener('wishlistUpdate', handleWishlistUpdate as EventListener);

    return () => {
      window.removeEventListener('wishlistUpdate', handleWishlistUpdate as EventListener);
    };
  }, []);

  // Auto-open cart when items are added
  useEffect(() => {
    if (
      cart?.totalQuantity &&
      cart?.totalQuantity !== quantityRef.current &&
      cart?.totalQuantity > 0
    ) {
      if (!isCartDrawerOpen) {
        setIsCartDrawerOpen(true);
      }
      quantityRef.current = cart?.totalQuantity;
    }
  }, [isCartDrawerOpen, cart?.totalQuantity, quantityRef]);

  return (
    <>
      <header className="border-b border-[#2c4373] bg-[#3b5998] shadow-md">
        <div className="mx-auto">
          {/* Mobile Header - Centered Logo Only */}
          <div className="flex items-center justify-center pb-3 pt-4 md:hidden">
            <Link href="/" className="flex items-end" prefetch={true}>
              <span className="inline-block text-[24px] font-bold lowercase leading-none tracking-[-0.06em] text-white">
                org123.xyz
              </span>
            </Link>
          </div>

          {/* Desktop Header - Full Layout */}
          <div className="hidden items-end justify-between pb-2 pt-6 md:flex md:pt-8 lg:pb-2 lg:pt-8 xl:pb-2 xl:pt-9">
            {/* Left: Logo and Site Name */}
            <div className="flex items-end gap-2 sm:gap-4 md:gap-6">
              {/* Logo - responsive width */}
              <Link href="/" className="flex w-[140px] shrink-0 items-end pl-3 lg:w-[180px] lg:pl-4" prefetch={true}>
                <span className="inline-block text-[32px] font-bold lowercase leading-none tracking-[-0.06em] text-white lg:text-[40px]">
                  org123.xyz
                </span>
              </Link>

              {/* Navigation Menu */}
              {menu.length ? (
                <nav>
                  <ul className="flex gap-2 lg:gap-4">
                    {menu.map((item: Menu) => (
                      <li key={item.title}>
                        <Link
                          href={item.path}
                          prefetch={true}
                          className="text-xs font-semibold text-white/90 transition-colors hover:text-white hover:underline lg:text-sm"
                        >
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              ) : null}
            </div>

            {/* Right: Wishlist, User, Cart */}
            <div className="flex items-end gap-2 pr-2 sm:gap-3 sm:pr-4">
              {/* Wishlist */}
              <button
                onClick={() => setIsWishlistDrawerOpen(true)}
                className="relative flex h-7 w-7 items-center justify-center text-white transition-opacity hover:opacity-80 sm:h-8 sm:w-8"
                aria-label="Wishlist"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-5 w-5 sm:h-6 sm:w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  />
                </svg>
                {wishlistCount > 0 && (
                  <div className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white sm:-right-1 sm:-top-1 sm:h-5 sm:w-5 sm:text-[10px]">
                    {wishlistCount}
                  </div>
                )}
              </button>

              {/* User Account */}
              <button
                onClick={() => setIsAccountDrawerOpen(true)}
                className="flex h-7 w-7 items-center justify-center text-white transition-opacity hover:opacity-80 sm:h-8 sm:w-8"
                aria-label="Account"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-5 w-5 sm:h-6 sm:w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
              </button>

              {/* Cart - Rightmost */}
              <button
                onClick={() => setIsCartDrawerOpen(true)}
                className="relative flex h-7 w-7 items-center justify-center text-white transition-opacity hover:opacity-80 sm:h-8 sm:w-8"
                aria-label="Cart"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-5 w-5 sm:h-6 sm:w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                  />
                </svg>
                {cart?.totalQuantity && cart.totalQuantity > 0 ? (
                  <div className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white sm:-right-1 sm:-top-1 sm:h-5 sm:w-5 sm:text-[10px]">
                    {cart.totalQuantity}
                  </div>
                ) : null}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Drawers */}
      <WishlistDrawer
        isOpen={isWishlistDrawerOpen}
        onClose={() => setIsWishlistDrawerOpen(false)}
        onOpenCart={() => setIsCartDrawerOpen(true)}
      />
      <AccountDrawer isOpen={isAccountDrawerOpen} onClose={() => setIsAccountDrawerOpen(false)} />
      <CartDrawer isOpen={isCartDrawerOpen} onClose={() => setIsCartDrawerOpen(false)} />
    </>
  );
}
