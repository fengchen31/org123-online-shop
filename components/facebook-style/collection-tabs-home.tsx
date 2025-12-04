'use client';

import clsx from 'clsx';
import type { Collection, Product } from 'lib/shopify/types';
import Image from 'next/image';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { CollectionProductsGrid } from './collection-products-grid';
import { MobileBottomBar } from './mobile-bottom-bar';
import { CartDrawer } from './cart-drawer';
import { WishlistDrawer } from './wishlist-drawer';
import { AccountDrawer } from './account-drawer';
import { useCart } from 'components/cart/cart-context';
import { NewsletterSuccessModal } from 'components/newsletter-success-modal';

interface CollectionTabsHomeProps {
  collections: Collection[];
  collectionContents: Record<string, React.ReactNode>;
  onTabChange?: (handle: string) => void;
  onOpenCart?: () => void;
  onOpenWishlist?: () => void;
  onOpenAccount?: () => void;
}

export function CollectionTabsHome({
  collections,
  collectionContents,
  onTabChange,
  onOpenCart,
  onOpenWishlist,
  onOpenAccount
}: CollectionTabsHomeProps) {
  // 使用第一個 collection 作為預設
  const [activeTab, setActiveTab] = useState<string>(
    collections.length > 0 ? collections[0]!.handle : ''
  );
  const [customerName, setCustomerName] = useState<string>('org123.xyz');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customerAvatar, setCustomerAvatar] = useState<string>('');

  // Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Wishlist count
  const [wishlistCount, setWishlistCount] = useState(0);

  // Discount banner
  const [discountMessage, setDiscountMessage] = useState<string>('Special Offer: 20% OFF on all items! Use code: SAVE20');

  // Cart from context
  const { cart } = useCart();

  // Drawer states for mobile
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isWishlistDrawerOpen, setIsWishlistDrawerOpen] = useState(false);
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);

  // Newsletter success modal state
  const [isNewsletterModalOpen, setIsNewsletterModalOpen] = useState(false);
  const [newsletterDiscountCode, setNewsletterDiscountCode] = useState('');

  // Fans avatars from country
  const [fansAvatars, setFansAvatars] = useState<Array<{ username: string; avatarUrl: string; profileUrl: string }>>([]);
  const [fansPopulation, setFansPopulation] = useState<number>(3227043);
  const [fansCountry, setFansCountry] = useState<string>('');

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await fetch('/api/customer');
        if (res.ok) {
          const data = await res.json();
          if (data.customer) {
            const name = data.customer.firstName
              ? `${data.customer.firstName} ${data.customer.lastName || ''}`.trim()
              : data.customer.email;
            setCustomerName(name);
            setIsLoggedIn(true);
            // Use custom avatar if exists
            if (data.customer.avatar) {
              setCustomerAvatar(data.customer.avatar);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching customer:', error);
      }
    };

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

    const fetchDiscountBanner = async () => {
      try {
        const res = await fetch('/api/discount-banner');
        if (res.ok) {
          const data = await res.json();
          if (data.discountBanner && data.discountBanner.enabled) {
            const message = data.discountBanner.code
              ? `${data.discountBanner.message} Use code: ${data.discountBanner.code}`
              : data.discountBanner.message;
            setDiscountMessage(message);
          }
        }
      } catch (error) {
        console.error('Error fetching discount banner:', error);
      }
    };

    const fetchCountryFans = async () => {
      try {
        const res = await fetch('/api/country-fans');
        if (res.ok) {
          const data = await res.json();
          if (data.avatars) {
            setFansAvatars(data.avatars);
          }
          if (data.population) {
            setFansPopulation(data.population);
          }
          if (data.countryName) {
            setFansCountry(data.countryName);
          }
        }
      } catch (error) {
        console.error('Error fetching country fans:', error);
      }
    };

    fetchCustomer();
    fetchWishlistCount();
    fetchDiscountBanner();
    fetchCountryFans();

    // Listen for wishlist updates
    const handleWishlistUpdate = (event: CustomEvent) => {
      setWishlistCount(event.detail.count);
    };

    window.addEventListener('wishlistUpdate', handleWishlistUpdate as EventListener);

    return () => {
      window.removeEventListener('wishlistUpdate', handleWishlistUpdate as EventListener);
    };
  }, []);

  const handleTabChange = (handle: string) => {
    setActiveTab(handle);
    onTabChange?.(handle);
  };

  // Handle search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.products || []);
      } else {
        console.error('Search failed:', response.statusText);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
    }
  };

  return (
    <div className="min-h-screen bg-white md:bg-[#e9eaed] md:pt-0">
      {/* Mobile Discount Marquee - Below header, only show on mobile */}
      <div className="overflow-hidden bg-[#f7f7f7] md:hidden">
        <div className="animate-marquee whitespace-nowrap py-1.5 text-xs text-gray-700">
          {discountMessage}
        </div>
      </div>

      {/* Profile Header - Light gray background - Hidden on mobile */}
      <div className="relative hidden bg-[#e9eaed] pt-3 sm:pt-4 md:block md:pt-6 lg:pt-5">
        <div className="mx-auto px-2 sm:px-4">
          {/* Right: Title and Tabs - with left margin to avoid avatar on desktop */}
          <div className="ml-0 flex flex-col md:ml-[204px] lg:ml-[calc(20%+1.5rem)]">
            {/* Title */}
            <div className="flex items-center gap-2 pb-2">
              <h1 className="text-lg font-bold text-gray-900 sm:text-xl lg:text-2xl">{customerName}</h1>
            </div>

            {/* Tabs - positioned at the bottom, aligned with bottom of gray area */}
            <div className="relative z-30 flex flex-nowrap gap-1 overflow-x-auto">
              {collections.map((collection) => (
                <button
                  key={collection.handle}
                  onClick={() => handleTabChange(collection.handle)}
                  className={clsx(
                    'whitespace-nowrap px-2 py-1 text-xs font-bold transition-all sm:px-2.5 sm:py-1 md:px-3 md:py-1.5 md:text-sm lg:px-4 lg:py-2 lg:text-sm',
                    activeTab === collection.handle
                      ? 'bg-white text-gray-900'
                      : 'bg-[#d8dfea] text-[#3b5998]'
                  )}
                >
                  {collection.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* White Content Section */}
      <div className="relative -mt-0 bg-white pt-0">
        {/* Content below tabs */}
        <div className="mx-auto px-2 pb-6 sm:px-4">
          <div className="flex gap-3 sm:gap-4 lg:gap-6">
            {/* Left Column - Sidebar with Avatar */}
            <div className="hidden w-[180px] shrink-0 pt-3 md:block sm:pt-4 md:pt-6 lg:w-1/5 lg:pt-5">
              {/* Avatar - positioned with negative margin to overlap gray area, with equal spacing below */}
              <div className="relative -mt-[66px] mb-3 w-full sm:-mt-[78px] sm:mb-4 md:-mt-[88px] md:mb-6 lg:-mt-[94px] lg:mb-5">
                <div className="relative z-20 overflow-hidden border border-gray-300 shadow-lg">
                  <div className="relative aspect-square w-full bg-white">
                    {isLoggedIn ? (
                      customerAvatar ? (
                        <Image
                          src={customerAvatar}
                          alt={customerName}
                          fill
                          className="object-cover"
                          priority
                        />
                      ) : (
                        <Image
                          src="/images/avatars/org123xyz_head.svg"
                          alt="Default avatar"
                          fill
                          className="object-contain p-[10%]"
                          priority
                        />
                      )
                    ) : (
                      <Image
                        src="/images/avatars/org123_logo.svg"
                        alt="org123 logo"
                        fill
                        className="object-contain p-[15%]"
                        priority
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Discount Marquee */}
              <div className="mb-4 overflow-hidden border border-gray-300 bg-white p-2">
                <div className="animate-marquee whitespace-nowrap text-xs text-gray-700">
                  {discountMessage}
                </div>
              </div>

              {/* Search Section */}
              <div className="border-b border-r border-t border-gray-300 bg-white">
                <div className="border-b border-gray-300 bg-[#f7f7f7] px-3 py-2">
                  <h3 className="text-xs font-bold text-gray-800">Search</h3>
                </div>
                <div className="p-3">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 text-xs text-gray-700 placeholder-gray-400 outline-none"
                    style={{ boxShadow: 'none' }}
                    onFocus={(e) => {
                      e.target.style.outline = 'none';
                      e.target.style.boxShadow = 'none';
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.borderWidth = '1px';
                    }}
                  />
                  {isSearching && searchQuery && (
                    <p className="mt-2 text-xs text-gray-600">
                      Found {searchResults.length} product{searchResults.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* SoundCloud Player Section */}
              <div className="border-r border-t border-gray-300 bg-white">
                <div className="border-b border-gray-300 bg-[#f7f7f7] px-3 py-2">
                  <h3 className="text-xs font-bold text-gray-800">Music</h3>
                </div>
                <div className="p-2">
                  <iframe
                    width="100%"
                    height="120"
                    scrolling="no"
                    frameBorder="no"
                    allow="autoplay"
                    src="https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/soundcloud/sets/new-exclusive&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false"
                    className="w-full"
                  ></iframe>
                </div>
              </div>

              {/* Information Section */}
              <div className="border-b-0 border-r border-t border-gray-300 bg-white">
                <div className="border-b border-gray-300 bg-[#f7f7f7] px-3 py-2">
                  <h3 className="text-xs font-bold text-gray-800">Information</h3>
                </div>
                <div className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {/* Facebook Icon */}
                    <a
                      href="https://facebook.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-opacity hover:opacity-80"
                    >
                      <Image
                        src="/images/fb.jpg"
                        alt="Facebook"
                        width={28}
                        height={28}
                        className="h-7 w-7"
                      />
                    </a>
                    {/* Instagram Icon - 2009 vintage camera style */}
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-opacity hover:opacity-80"
                    >
                      <Image
                        src="/images/ig.jpg"
                        alt="Instagram"
                        width={28}
                        height={28}
                        className="h-7 w-7"
                      />
                    </a>
                    {/* YouTube Icon */}
                    <a
                      href="https://youtube.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-opacity hover:opacity-80"
                    >
                      <Image
                        src="/images/youtube.jpg"
                        alt="YouTube"
                        width={28}
                        height={28}
                        className="h-7 w-7"
                      />
                    </a>
                    {/* Meta Threads Icon */}
                    <a
                      href="https://threads.net"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-opacity hover:opacity-80"
                    >
                      <Image
                        src="/images/thread.png"
                        alt="Threads"
                        width={34}
                        height={34}
                        className="h-[34px] w-[34px]"
                      />
                    </a>
                  </div>
                </div>
              </div>

              {/* Fans Section */}
              <div className="border-b border-r border-t border-gray-300 bg-white">
                <div className="border-b border-gray-300 bg-[#f7f7f7] px-3 py-2">
                  <h3 className="text-xs font-bold text-gray-800">Fans</h3>
                </div>
                <div className="p-3">
                  <p className="text-xs text-gray-700">
                    6 of {fansPopulation.toLocaleString()} fans
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {(fansAvatars.length > 0 ? fansAvatars : [1, 2, 3, 4, 5, 6]).map((fan, i) => (
                      <a
                        key={typeof fan === 'object' ? fan.username : i}
                        href={typeof fan === 'object' ? fan.profileUrl : '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative aspect-square overflow-hidden border border-gray-300 bg-white transition-transform hover:scale-105"
                        title={typeof fan === 'object' ? `@${fan.username}` : undefined}
                      >
                        <Image
                          src={typeof fan === 'object' ? fan.avatarUrl : '/images/avatars/org123xyz_head.svg'}
                          alt={typeof fan === 'object' ? `@${fan.username}` : `Fan ${i}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Newsletter Section */}
              <div className="border-b-0 border-r border-t border-gray-300 bg-white">
                <div className="border-b border-gray-300 bg-[#f7f7f7] px-3 py-2">
                  <h3 className="text-xs font-bold text-gray-800">Newsletter</h3>
                </div>
                <div className="p-3">
                  <p className="mb-3 text-xs text-gray-700">
                    Get the latest updates and exclusive offers!
                  </p>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const emailInput = form.elements.namedItem('email') as HTMLInputElement;
                      const email = emailInput.value;
                      const button = form.elements.namedItem('submit') as HTMLButtonElement;

                      // Disable button
                      button.disabled = true;
                      button.textContent = 'Subscribing...';

                      try {
                        const response = await fetch('/api/newsletter', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email })
                        });

                        const data = await response.json();

                        // Clear email input
                        emailInput.value = '';

                        // Always show modal with discount code (success or error)
                        setNewsletterDiscountCode(data.discountCode || 'WELCOME10');
                        setIsNewsletterModalOpen(true);
                      } catch (error) {
                        // Even on error, show modal
                        console.error('Newsletter subscription error:', error);
                        setNewsletterDiscountCode('WELCOME10');
                        setIsNewsletterModalOpen(true);
                      } finally {
                        button.disabled = false;
                        button.textContent = 'Subscribe';
                      }
                    }}
                  >
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      required
                      className="w-full border border-gray-300 px-3 py-2 text-xs text-gray-700 placeholder-gray-400 outline-none focus:border-gray-300"
                      style={{ boxShadow: 'none' }}
                    />
                    <button
                      type="submit"
                      name="submit"
                      className="mt-2 w-full bg-[#3b5998] px-3 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
                    >
                      Subscribe
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Right Column - Content */}
            <div className="flex-1">
              {/* Main Content - Product Grid */}
              <div className="mt-3 p-3 md:border md:border-gray-300 md:bg-white md:shadow-sm sm:mt-4 sm:p-4 lg:mt-6 lg:p-6">
                {isSearching && searchQuery ? (
                  // Show search results
                  searchResults.length > 0 ? (
                    <CollectionProductsGrid products={searchResults} />
                  ) : (
                    <div className="flex min-h-[400px] items-center justify-center">
                      <div className="text-center text-gray-500">
                        <p className="text-lg">No products found.</p>
                        <p className="mt-2 text-sm">Try a different search term.</p>
                      </div>
                    </div>
                  )
                ) : (
                  // Show collection contents
                  <Suspense
                    fallback={
                      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {[...Array(8)].map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="aspect-square bg-gray-200"></div>
                            <div className="mt-2 h-4 bg-gray-200"></div>
                            <div className="mt-2 h-3 bg-gray-200"></div>
                          </div>
                        ))}
                      </div>
                    }
                  >
                    {collectionContents[activeTab]}
                  </Suspense>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Bar - Only show on screens smaller than 768px */}
      <div className="md:hidden">
        <MobileBottomBar
          collections={collections}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onOpenCart={() => setIsCartDrawerOpen(true)}
          onOpenWishlist={() => setIsWishlistDrawerOpen(true)}
          onOpenAccount={() => setIsAccountDrawerOpen(true)}
          cartCount={cart?.totalQuantity || 0}
          wishlistCount={wishlistCount}
          onSearch={handleSearch}
          searchQuery={searchQuery}
        />
      </div>

      {/* Mobile Drawers */}
      <div className="md:hidden">
        <WishlistDrawer
          isOpen={isWishlistDrawerOpen}
          onClose={() => setIsWishlistDrawerOpen(false)}
          onOpenCart={() => setIsCartDrawerOpen(true)}
        />
        <AccountDrawer isOpen={isAccountDrawerOpen} onClose={() => setIsAccountDrawerOpen(false)} />
        <CartDrawer isOpen={isCartDrawerOpen} onClose={() => setIsCartDrawerOpen(false)} />
      </div>

      {/* Newsletter Success Modal */}
      <NewsletterSuccessModal
        isOpen={isNewsletterModalOpen}
        onClose={() => setIsNewsletterModalOpen(false)}
        discountCode={newsletterDiscountCode}
      />

      {/* Add padding on mobile to prevent content being hidden by sticky bar */}
      <style jsx global>{`
        @media (max-width: 767px) {
          body {
            padding-bottom: 56px;
          }
        }
      `}</style>
    </div>
  );
}
