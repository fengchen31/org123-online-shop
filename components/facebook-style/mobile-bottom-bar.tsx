'use client';

import { useState } from 'react';
import type { Collection } from 'lib/shopify/types';
import clsx from 'clsx';

interface MobileBottomBarProps {
  collections: Collection[];
  activeTab: string;
  onTabChange: (handle: string) => void;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAccount: () => void;
  cartCount: number;
  wishlistCount: number;
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

export function MobileBottomBar({
  collections,
  activeTab,
  onTabChange,
  onOpenCart,
  onOpenWishlist,
  onOpenAccount,
  cartCount,
  wishlistCount,
  onSearch,
  searchQuery: externalSearchQuery
}: MobileBottomBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(externalSearchQuery || '');

  const handleTabChangeAndClose = (handle: string) => {
    onTabChange(handle);
    setIsMenuOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(localSearchQuery);
    }
    setIsMenuOpen(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setLocalSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  return (
    <>
      {/* Right Drawer - Unified Style */}
      <>
        {/* Backdrop */}
        {isMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
            onClick={() => setIsMenuOpen(false)}
          />
        )}

        {/* Drawer - From Right */}
        <div
          className={`fixed bottom-0 right-0 top-0 z-50 w-full max-w-md bg-white shadow-xl transition-transform duration-300 ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h2 className="text-lg font-bold text-gray-900">Collections</h2>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded text-gray-500 hover:bg-gray-100"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Collections List */}
          <div className="overflow-y-auto" style={{ height: 'calc(100vh - 60px)' }}>
            {collections.map((collection) => (
              <button
                key={collection.handle}
                onClick={() => handleTabChangeAndClose(collection.handle)}
                className={clsx(
                  'flex w-full items-center border-b border-gray-200 px-4 py-3 text-left transition-colors',
                  activeTab === collection.handle
                    ? 'bg-blue-50 text-[#3b5998]'
                    : 'bg-white text-gray-900 hover:bg-gray-50'
                )}
              >
                <span className="text-sm font-medium">{collection.title}</span>
              </button>
            ))}
          </div>
        </div>
      </>

      {/* Single Row Bottom Bar - Blue like Header */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#3b5998]">
        <div className="flex items-center gap-2 px-3 py-2">
          {/* Left: Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1">
            <input
              type="text"
              value={localSearchQuery}
              onChange={handleSearchChange}
              placeholder="Search..."
              className="w-full rounded border-none bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
            />
          </form>

          {/* Right: Header Icons */}
          <div className="flex shrink-0 items-center gap-1">
            {/* Wishlist */}
            <button
              onClick={onOpenWishlist}
              className="relative flex h-9 w-9 items-center justify-center text-white transition-opacity hover:opacity-80"
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {wishlistCount > 0 && (
                <div className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white sm:-right-1 sm:-top-1 sm:h-5 sm:w-5 sm:text-[10px]">
                  {wishlistCount}
                </div>
              )}
            </button>

            {/* Account */}
            <button
              onClick={onOpenAccount}
              className="flex h-9 w-9 items-center justify-center text-white transition-opacity hover:opacity-80"
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </button>

            {/* Cart */}
            <button
              onClick={onOpenCart}
              className="relative flex h-9 w-9 items-center justify-center text-white transition-opacity hover:opacity-80"
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              {cartCount > 0 && (
                <div className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white sm:-right-1 sm:-top-1 sm:h-5 sm:w-5 sm:text-[10px]">
                  {cartCount}
                </div>
              )}
            </button>

            {/* Hamburger Menu - Moved to Right */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center text-white transition-opacity hover:opacity-80"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
