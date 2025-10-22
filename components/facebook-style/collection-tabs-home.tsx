'use client';

import clsx from 'clsx';
import type { Collection } from 'lib/shopify/types';
import Image from 'next/image';
import { Suspense, useEffect, useMemo, useState } from 'react';

interface CollectionTabsHomeProps {
  collections: Collection[];
  collectionContents: Record<string, React.ReactNode>;
  onTabChange?: (handle: string) => void;
}

// Available login avatars
const LOGIN_AVATARS = [
  '/images/loginAvatars/122726524_10222938026866668_4834097733912607470_n.jpg',
  '/images/loginAvatars/460959320_2440517949471558_1212324920682692175_n.jpg'
];

export function CollectionTabsHome({
  collections,
  collectionContents,
  onTabChange
}: CollectionTabsHomeProps) {
  // 使用第一個 collection 作為預設
  const [activeTab, setActiveTab] = useState<string>(
    collections.length > 0 ? collections[0]!.handle : ''
  );
  const [customerName, setCustomerName] = useState<string>('org123.xyz');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Randomly select an avatar (stable across re-renders)
  const randomAvatar = useMemo(() => {
    return LOGIN_AVATARS[Math.floor(Math.random() * LOGIN_AVATARS.length)] || LOGIN_AVATARS[0]!;
  }, []);

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
          }
        }
      } catch (error) {
        console.error('Error fetching customer:', error);
      }
    };

    fetchCustomer();
  }, []);

  const handleTabChange = (handle: string) => {
    setActiveTab(handle);
    onTabChange?.(handle);
  };

  return (
    <div className="min-h-screen bg-[#e9eaed]">
      {/* Profile Header - Light gray background */}
      <div className="relative bg-[#e9eaed] pt-16">
        <div className="mx-auto max-w-7xl px-4">
          {/* Right: Title and Tabs - with left margin to avoid avatar */}
          <div className="ml-[204px] flex flex-col">
            {/* Title */}
            <div className="flex items-center gap-2 pb-2">
              <h1 className="text-2xl font-bold text-gray-900">{customerName}</h1>
            </div>

            {/* Tabs - positioned at the bottom, aligned with bottom of gray area */}
            <div className="relative z-10 flex flex-wrap gap-1">
              {collections.map((collection) => (
                <button
                  key={collection.handle}
                  onClick={() => handleTabChange(collection.handle)}
                  className={clsx(
                    'px-3 py-1.5 text-md font-bold transition-all',
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
        <div className="mx-auto max-w-7xl px-4 pb-6">
          <div className="flex gap-6">
            {/* Left Column - Sidebar with Avatar */}
            <div className="hidden w-[180px] shrink-0 lg:block">
              {/* Avatar - positioned absolutely, extending up into gray area */}
              <div className="relative -mt-20 mb-4 w-full">
                <div className="relative z-20 overflow-hidden border border-gray-300 shadow-lg">
                  <div className="relative aspect-square w-full bg-white">
                    <Image
                      src={isLoggedIn ? randomAvatar : '/images/avatars/org123_logo.svg'}
                      alt={isLoggedIn ? customerName : 'org123 logo'}
                      fill
                      className={isLoggedIn ? 'object-cover' : 'object-contain p-[15%]'}
                      priority
                    />
                  </div>
                </div>
              </div>

              {/* Discount Marquee */}
              <div className="mb-4 overflow-hidden border border-gray-300 bg-white p-2">
                <div className="animate-marquee whitespace-nowrap text-xs text-gray-700">
                  Special Offer: 20% OFF on all items! Use code: SAVE20
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
                        src="/images/fb.webp"
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
                        src="/images/ig.webp"
                        alt="Instagram"
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
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-800">Fans</h3>
                    <a href="/search" className="text-xs text-[#3b5998] hover:underline">
                      See All
                    </a>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs text-gray-700">6 of 3,227,043 fans</p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="relative aspect-square overflow-hidden border border-gray-300 bg-white p-2"
                      >
                        <div className="relative h-full w-full">
                          <Image
                            src="/images/avatars/org123xyz_head.svg"
                            alt={`Fan ${i}`}
                            fill
                            className="object-contain"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Content */}
            <div className="flex-1">
              {/* Main Content - Product Grid */}
              <div className="mt-6 border border-gray-300 bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-xl font-semibold text-[#3b5998]">
                  {collections.find((c) => c.handle === activeTab)?.title || 'Products'}
                </h2>

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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
