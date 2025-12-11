'use client';

import clsx from 'clsx';
import type { Collection, Product } from 'lib/shopify/types';
import Image from 'next/image';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CollectionProductsGrid } from './collection-products-grid';
import { MobileBottomBar } from './mobile-bottom-bar';
import { CartDrawer } from './cart-drawer';
import { WishlistDrawer } from './wishlist-drawer';
import { AccountDrawer } from './account-drawer';
import { useCart } from 'components/cart/cart-context';
import { NewsletterSuccessModal } from 'components/newsletter-success-modal';
import { clearLocalCartAndSync } from 'components/cart/actions';
import { restoreCartFromCustomer } from 'components/cart/sync-cart-action';
import LoadingDots from 'components/loading-dots';
import {
  restoreWishlistFromCustomer,
  clearLocalWishlist,
  syncWishlistFromServer
} from 'components/wishlist/sync-wishlist-action';

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
  const router = useRouter();
  const searchParams = useSearchParams();

  // 從URL讀取當前collection，如果沒有則預設使用 news-feed
  const getInitialTab = () => {
    const collectionParam = searchParams.get('collection');
    if (collectionParam && collections.some(c => c.handle === collectionParam)) {
      return collectionParam;
    }
    return 'news-feed';
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTab);
  const [customerName, setCustomerName] = useState<string>('org123.xyz');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customerAvatar, setCustomerAvatar] = useState<string>('');
  const [currentCustomerId, setCurrentCustomerId] = useState<string>('');

  // Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Wishlist count
  const [wishlistCount, setWishlistCount] = useState(0);

  // Discount banner
  const [discountMessage, setDiscountMessage] = useState<string>('Special Offer: 20% OFF on all items! Use code: SAVE20');

  // Music embed URL
  const [musicEmbedUrl, setMusicEmbedUrl] = useState<string | null>(null);

  // Newsletter subscription state
  const [isSubscribing, setIsSubscribing] = useState(false);

  // 監聽URL變化並同步activeTab狀態
  useEffect(() => {
    const collectionParam = searchParams.get('collection');
    if (collectionParam && collections.some(c => c.handle === collectionParam)) {
      setActiveTab(collectionParam);
    } else {
      setActiveTab('news-feed');
    }
  }, [searchParams, collections]);

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
    const fetchRecentFans = async (excludeCustomerId?: string) => {
      try {
        const res = await fetch('/api/recent-fans');
        if (res.ok) {
          const data = await res.json();
          if (data.fans && data.fans.length > 0) {
            // Filter out the current user if excludeCustomerId is provided
            const filteredFans = excludeCustomerId
              ? data.fans.filter((fan: any) => fan.customerId !== excludeCustomerId)
              : data.fans;

            // Transform recent fans data to match the expected format
            const transformedFans = filteredFans.map((fan: any) => ({
              username: fan.firstName && fan.lastName
                ? `${fan.firstName} ${fan.lastName}`
                : fan.email.split('@')[0],
              avatarUrl: fan.avatar,
              profileUrl: '#' // No profile URL for now
            }));
            setFansAvatars(transformedFans);
            setFansPopulation(filteredFans.length);
          } else {
            // No fans data, show empty array (will display placeholders)
            setFansAvatars([]);
            setFansPopulation(0);
          }
        } else {
          // API call failed, show empty array
          setFansAvatars([]);
          setFansPopulation(0);
        }
      } catch (error) {
        console.error('Error fetching recent fans:', error);
        // On error, show empty array
        setFansAvatars([]);
        setFansPopulation(0);
      }
    };

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

            let customerId = '';
            // Use custom avatar if exists
            if (data.customer.avatar) {
              setCustomerAvatar(data.customer.avatar);
              setCurrentCustomerId(data.customer.id);
              customerId = data.customer.id;

              // Record this user as a recent fan (only if they have a custom avatar)
              try {
                await fetch('/api/recent-fans', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    customerId: data.customer.id,
                    email: data.customer.email,
                    firstName: data.customer.firstName,
                    lastName: data.customer.lastName,
                    avatar: data.customer.avatar
                  })
                });
              } catch (error) {
                console.error('Error recording recent fan:', error);
              }
            }

            // Fetch recent fans, excluding current user
            await fetchRecentFans(customerId || undefined);
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

    const fetchMusicEmbedUrl = async () => {
      try {
        const res = await fetch('/api/music-embed');
        if (res.ok) {
          const data = await res.json();
          if (data.musicEmbedUrl) {
            // Clean up SoundCloud URL parameters for minimal display
            const cleanUrl = cleanSoundCloudUrl(data.musicEmbedUrl);
            setMusicEmbedUrl(cleanUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching music embed URL:', error);
      }
    };

    // Helper function to clean SoundCloud URL parameters
    const cleanSoundCloudUrl = (url: string): string => {
      try {
        const urlObj = new URL(url);
        // Set clean parameters for minimal player display
        urlObj.searchParams.set('auto_play', 'false');
        urlObj.searchParams.set('hide_related', 'true');
        urlObj.searchParams.set('show_comments', 'false');
        urlObj.searchParams.set('show_user', 'true'); // Keep artist name
        urlObj.searchParams.set('show_reposts', 'false');
        urlObj.searchParams.set('show_teaser', 'false');
        urlObj.searchParams.set('visual', 'true');
        return urlObj.toString();
      } catch (e) {
        // If URL parsing fails, return original
        return url;
      }
    };

    // Fetch initial data
    const initializeData = async () => {
      // Fetch customer info first to determine if user is logged in
      try {
        const res = await fetch('/api/customer');
        const customerId = res.ok ? (await res.json()).customer?.id : null;

        // Fetch recent fans (always show, but exclude current user if logged in)
        await fetchRecentFans(customerId || undefined);
      } catch (error) {
        console.error('Error initializing data:', error);
        // Still fetch fans even if customer fetch fails
        await fetchRecentFans();
      }
    };

    fetchCustomer();
    fetchWishlistCount();
    fetchDiscountBanner();
    fetchMusicEmbedUrl();
    initializeData();

    // Initial sync on page load if user is logged in
    const performInitialSync = async () => {
      try {
        console.log('=== performInitialSync called ===');

        // Check if user is logged in by calling /api/customer
        console.log('Checking login status via /api/customer...');
        const customerResponse = await fetch('/api/customer');
        const isLoggedIn = customerResponse.ok;
        console.log('Is logged in:', isLoggedIn);

        if (isLoggedIn) {
          console.log('=== Initial page load sync for logged-in user ===');

          // Sync cart and wishlist from server using API endpoints
          console.log('Calling sync APIs...');
          const [cartResponse, wishlistResult] = await Promise.all([
            fetch('/api/customer/sync-cart'),
            syncWishlistFromServer()
          ]);

          console.log('Cart response status:', cartResponse.status);
          const cartResult = cartResponse.ok ? await cartResponse.json() : { success: false, error: await cartResponse.text() };

          console.log('Initial cart sync result:', cartResult);
          console.log('Initial wishlist sync result:', wishlistResult);

          // Dispatch events to update UI
          if (wishlistResult.success) {
            window.dispatchEvent(
              new CustomEvent('wishlistUpdate', {
                detail: { count: wishlistResult.count || 0 }
              })
            );
          }

          // Refresh page data to reflect synced cart and wishlist
          if (cartResponse.ok || wishlistResult.success) {
            console.log('✅ Initial sync completed, refreshing UI...');
            router.refresh();
          } else {
            console.error('❌ Initial sync failed:', { cart: cartResult, wishlist: wishlistResult });
          }
        } else {
          console.log('User not logged in, skipping initial sync');
        }
      } catch (error) {
        console.error('❌ Fatal error in performInitialSync:', error);
      }
    };

    performInitialSync();

    // Listen for wishlist updates
    const handleWishlistUpdate = (event: Event) => {
      setWishlistCount((event as CustomEvent).detail.count);
    };

    // Listen for auth status changes (login/logout)
    const handleAuthStatusChange = async (event: Event) => {
      const { isLoggedIn: newLoginStatus } = (event as CustomEvent).detail;
      console.log('=== Auth status changed ===', { newLoginStatus });

      if (newLoginStatus) {
        // User logged in - clear local data first, then restore from customer metafield
        console.log('User logged in, clearing local cart and wishlist...');
        try {
          // Clear local cart and wishlist first
          await clearLocalCartAndSync();
          await clearLocalWishlist();
          console.log('✅ Local cart and wishlist cleared');

          console.log('Restoring cart and wishlist from account...');

          // Restore cart from account
          const cartResult = await restoreCartFromCustomer();
          console.log('Cart restore result:', cartResult);

          // Restore wishlist from account
          const wishlistResult = await restoreWishlistFromCustomer();
          console.log('Wishlist restore result:', wishlistResult);

          if (cartResult.success || wishlistResult.success) {
            console.log('✅ Account data restored successfully');
            if (cartResult.success) {
              console.log('  Cart items restored:', cartResult.itemsRestored);
            }
            if (wishlistResult.success) {
              console.log('  Wishlist items restored:', wishlistResult.itemsRestored);

              // Dispatch wishlistUpdate event to update UI components
              window.dispatchEvent(
                new CustomEvent('wishlistUpdate', {
                  detail: { count: wishlistResult.itemsRestored || 0 }
                })
              );
            }
            console.log('Refreshing page data to show updated cart and wishlist...');

            // Refresh page data without full reload
            router.refresh();
          } else {
            console.error('❌ Account data restore failed');
            if (!cartResult.success) console.error('  Cart:', cartResult.error);
            if (!wishlistResult.success) console.error('  Wishlist:', wishlistResult.error);
          }

          // Fetch customer info to update avatar and name
          console.log('Fetching customer info to update UI...');
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

                if (data.customer.avatar) {
                  setCustomerAvatar(data.customer.avatar);
                  setCurrentCustomerId(data.customer.id);

                  // Record as recent fan and refresh fan list
                  try {
                    await fetch('/api/recent-fans', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        customerId: data.customer.id,
                        email: data.customer.email,
                        firstName: data.customer.firstName,
                        lastName: data.customer.lastName,
                        avatar: data.customer.avatar
                      })
                    });
                    // Refresh fan list
                    await fetchRecentFans(data.customer.id);
                  } catch (error) {
                    console.error('Error updating recent fans on login:', error);
                  }
                }
                console.log('✅ Customer info updated:', { name, hasAvatar: !!data.customer.avatar });
              }
            }
          } catch (error) {
            console.error('Error fetching customer info:', error);
          }
        } catch (error) {
          console.error('❌ Failed to restore account data:', error);
        }
      } else {
        // User logged out - clear cart, wishlist and all account data
        console.log('User logged out, clearing local cart and wishlist...');
        await clearLocalCartAndSync();
        await clearLocalWishlist();

        // Reset customer info to defaults
        setCustomerName('org123.xyz');
        setIsLoggedIn(false);
        setCustomerAvatar('');
        setCurrentCustomerId('');

        // Dispatch wishlistUpdate event to clear the counter
        window.dispatchEvent(
          new CustomEvent('wishlistUpdate', {
            detail: { count: 0 }
          })
        );

        console.log('Refreshing page data to clear account data...');

        // Refresh page data without full reload
        router.refresh();
      }
    };

    // Handle avatar update event
    const handleAvatarUpdate = async (event: Event) => {
      const { avatar } = (event as CustomEvent).detail;
      console.log('=== Avatar updated ===');

      try {
        // Update avatar in sidebar
        setCustomerAvatar(avatar);

        // Fetch customer info to get updated data
        const res = await fetch('/api/customer');
        if (res.ok) {
          const data = await res.json();
          if (data.customer && data.customer.avatar) {
            // Record as recent fan with new avatar
            await fetch('/api/recent-fans', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                customerId: data.customer.id,
                email: data.customer.email,
                firstName: data.customer.firstName,
                lastName: data.customer.lastName,
                avatar: data.customer.avatar
              })
            });

            // Refresh fan list
            await fetchRecentFans(data.customer.id);
            console.log('✅ Recent fans updated after avatar change');
          }
        }
      } catch (error) {
        console.error('Error handling avatar update:', error);
      }
    };

    // Handle page visibility change for cross-device sync
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('=== Page became visible, checking for cross-device updates ===');

        try {
          // Check if user is logged in by calling /api/customer
          const customerResponse = await fetch('/api/customer');
          const isLoggedIn = customerResponse.ok;

          if (isLoggedIn) {
            console.log('User is logged in, syncing cart and wishlist from server...');

            // Sync cart and wishlist from server using API endpoints
            const [cartResponse, wishlistResult] = await Promise.all([
              fetch('/api/customer/sync-cart'),
              syncWishlistFromServer()
            ]);

            const cartResult = cartResponse.ok ? await cartResponse.json() : { success: false };

            console.log('Cart sync result:', cartResult);
            console.log('Wishlist sync result:', wishlistResult);

            // Dispatch events to update UI
            if (wishlistResult.success) {
              window.dispatchEvent(
                new CustomEvent('wishlistUpdate', {
                  detail: { count: wishlistResult.count || 0 }
                })
              );
            }

            // Refresh page data to reflect synced cart and wishlist
            if (cartResponse.ok || wishlistResult.success) {
              console.log('✅ Cross-device sync completed, refreshing UI...');
              router.refresh();
            }
          }
        } catch (error) {
          console.error('❌ Error during cross-device sync:', error);
        }
      }
    };

    console.log('🔧 Setting up event listeners in collection-tabs-home');
    window.addEventListener('wishlistUpdate', handleWishlistUpdate);
    window.addEventListener('authStatusChange', handleAuthStatusChange);
    window.addEventListener('avatarUpdate', handleAvatarUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    console.log('✅ Event listeners registered');

    return () => {
      window.removeEventListener('wishlistUpdate', handleWishlistUpdate);
      window.removeEventListener('authStatusChange', handleAuthStatusChange);
      window.removeEventListener('avatarUpdate', handleAvatarUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleTabChange = (handle: string) => {
    setActiveTab(handle);
    onTabChange?.(handle);

    // 使用push來支持瀏覽器歷史記錄
    // 清除所有參數，只保留 collection
    const newParams = new URLSearchParams();
    newParams.set('collection', handle);
    router.push(`?${newParams.toString()}`, { scroll: false });
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
        <div className="animate-marquee">
          <span className="marquee-content py-1.5 text-xs text-gray-700">
            {discountMessage}
          </span>
          <span className="marquee-content py-1.5 text-xs text-gray-700">
            {discountMessage}
          </span>
        </div>
      </div>

      {/* Profile Header - Light gray background - Hidden on mobile */}
      <div className="relative hidden bg-[#e9eaed] pt-3 sm:pt-4 md:block md:pt-6 lg:pt-5">
        <div className="mx-auto px-2 sm:px-4">
          {/* Right: Title and Tabs - with left margin to avoid avatar on desktop */}
          <div className="ml-0 flex flex-col md:ml-[calc(100%/7+0.75rem)] lg:ml-[calc(100%/7+1.5rem)]">
            {/* Title */}
            <div className="flex items-center gap-2 pb-2">
              <h1 className="text-lg font-bold text-gray-900 sm:text-xl lg:text-2xl">{customerName}</h1>
            </div>

            {/* Tabs - positioned at the bottom, aligned with bottom of gray area */}
            <div className="relative z-30 flex flex-nowrap gap-1 overflow-x-auto">
              {collections.filter((c) => c.handle !== 'vintage').map((collection) => {
                const isSale = collection.handle.toLowerCase() === 'sale';
                return (
                  <button
                    key={collection.handle}
                    onClick={() => handleTabChange(collection.handle)}
                    className={clsx(
                      'whitespace-nowrap px-2 py-1 text-xs font-bold transition-all sm:px-2.5 sm:py-1 md:px-3 md:py-1.5 md:text-sm lg:px-4 lg:py-2 lg:text-sm',
                      activeTab === collection.handle
                        ? isSale
                          ? 'bg-white text-red-600'
                          : 'bg-white text-gray-900'
                        : isSale
                          ? 'bg-[#d8dfea] text-red-600'
                          : 'bg-[#d8dfea] text-[#3b5998]'
                    )}
                  >
                    {collection.title}
                  </button>
                );
              })}
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
            <div className="hidden shrink-0 pt-3 md:block md:w-[calc(100%/7)] sm:pt-4 md:pt-6 lg:pt-5">
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
                <div className="animate-marquee">
                  <span className="marquee-content text-xs text-gray-700">
                    {discountMessage}
                  </span>
                  <span className="marquee-content text-xs text-gray-700">
                    {discountMessage}
                  </span>
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

              {/* Music Player Section - Only show if URL is available */}
              {musicEmbedUrl && (
                <div className="border-r border-t border-gray-300 bg-white">
                  <div className="border-b border-gray-300 bg-[#f7f7f7] px-3 py-2">
                    <h3 className="text-xs font-bold text-gray-800">Music</h3>
                  </div>
                  <div className="p-2">
                    <iframe
                      width="100%"
                      height="150"
                      scrolling="no"
                      frameBorder="no"
                      allow="autoplay"
                      src={musicEmbedUrl}
                      className="w-full"
                    ></iframe>
                  <div
                    style={{
                      fontSize: '10px',
                      color: '#cccccc',
                      lineBreak: 'anywhere',
                      wordBreak: 'normal',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      fontFamily:
                        'Interstate,Lucida Grande,Lucida Sans Unicode,Lucida Sans,Garuda,Verdana,Tahoma,sans-serif',
                      fontWeight: 100
                    }}
                  >
                    <a
                      href="https://soundcloud.com/salem-official"
                      title="SALEM official"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#cccccc', textDecoration: 'none' }}
                    >
                      SALEM official
                    </a>
                    {' · '}
                    <a
                      href="https://soundcloud.com/salem-official/03-frost"
                      title="FROST"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#cccccc', textDecoration: 'none' }}
                    >
                      FROST
                    </a>
                  </div>
                  </div>
                </div>
              )}

              {/* Information Section */}
              <div className="border-b-0 border-r border-t border-gray-300 bg-white">
                <div className="border-b border-gray-300 bg-[#f7f7f7] px-3 py-2">
                  <h3 className="text-xs font-bold text-gray-800">Information</h3>
                </div>
                <div className="px-3 py-2">
                  <div className="flex flex-wrap items-start gap-1">
                    {/* Instagram Icon - 2009 vintage camera style */}
                    <a
                      href="https://www.instagram.com/org123.xyz/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block transition-opacity hover:opacity-80"
                    >
                      <Image
                        src="/images/ig.jpg"
                        alt="Instagram"
                        width={28}
                        height={28}
                        className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8"
                      />
                    </a>
                    {/* YouTube Icon */}
                    <a
                      href="https://www.youtube.com/@user-ud8be9nz3b"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block transition-opacity hover:opacity-80"
                    >
                      <Image
                        src="/images/youtube.jpg"
                        alt="YouTube"
                        width={28}
                        height={28}
                        className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8"
                      />
                    </a>
                    {/* Meta Threads Icon */}
                    <a
                      href="https://www.threads.com/@nul1org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block transition-opacity hover:opacity-80"
                    >
                      <Image
                        src="/images/thread.png"
                        alt="Threads"
                        width={28}
                        height={28}
                        className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8"
                      />
                    </a>
                    {/* Apple Music Icon */}
                    <a
                      href="https://music.apple.com/tw/playlist/org123-xyz-nov2025/pl.u-RRbVVE1toby3v9?l=en-GB"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block transition-opacity hover:opacity-80"
                    >
                      <Image
                        src="/images/Apple_Music_icon.svg"
                        alt="Apple Music"
                        width={28}
                        height={28}
                        className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8"
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
                    {fansAvatars.length > 0 ? `${fansAvatars.length} recent visitors` : 'No recent visitors'}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-3">
                    {(fansAvatars.length > 0 ? fansAvatars : [1, 2, 3, 4, 5, 6]).map((fan, i) => {
                      const isDefaultAvatar = typeof fan !== 'object' || !fan.avatarUrl || fan.avatarUrl === '/images/avatars/org123xyz_head.svg';
                      const avatarSrc = typeof fan === 'object' && fan.avatarUrl ? fan.avatarUrl : '/images/avatars/org123xyz_head.svg';

                      return (
                        <a
                          key={typeof fan === 'object' ? fan.username : i}
                          href={typeof fan === 'object' ? fan.profileUrl : '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative aspect-square overflow-hidden border border-gray-300 bg-white transition-transform hover:scale-105"
                          title={typeof fan === 'object' ? `@${fan.username}` : undefined}
                        >
                          <Image
                            src={avatarSrc}
                            alt={typeof fan === 'object' ? `@${fan.username}` : `Fan ${i}`}
                            fill
                            className={isDefaultAvatar ? "object-contain p-1" : "object-cover"}
                            unoptimized
                          />
                        </a>
                      );
                    })}
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

                      setIsSubscribing(true);

                      try {
                        const response = await fetch('/api/newsletter', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email })
                        });

                        const data = await response.json();

                        // Clear email input
                        emailInput.value = '';

                        // Only show discount code modal for FIRST-TIME subscribers
                        if (!data.isExisting && data.discountCode) {
                          setNewsletterDiscountCode(data.discountCode);
                          setIsNewsletterModalOpen(true);
                        } else if (data.isExisting) {
                          // Show simple success message for existing subscribers
                          alert('Thank you! You are already subscribed to our newsletter.');
                        } else if (!response.ok) {
                          alert(data.error || 'Subscription failed. Please try again.');
                        }
                      } catch (error) {
                        console.error('Newsletter subscription error:', error);
                        alert('An error occurred. Please try again.');
                      } finally {
                        setIsSubscribing(false);
                      }
                    }}
                  >
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      required
                      disabled={isSubscribing}
                      className="w-full border border-gray-300 px-3 py-2 text-xs text-gray-700 placeholder-gray-400 outline-none focus:border-gray-300 disabled:opacity-50"
                      style={{ boxShadow: 'none' }}
                    />
                    <button
                      type="submit"
                      name="submit"
                      disabled={isSubscribing}
                      className="mt-2 w-full bg-[#3b5998] px-3 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="inline-flex h-[1rem] items-center justify-center">
                        {isSubscribing ? <LoadingDots className="text-white" /> : 'Subscribe'}
                      </span>
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
