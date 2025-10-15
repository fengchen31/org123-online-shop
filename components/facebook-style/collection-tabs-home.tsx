'use client';

import clsx from 'clsx';
import type { Collection } from 'lib/shopify/types';
import Image from 'next/image';
import { Suspense, useState } from 'react';

interface CollectionTabsHomeProps {
  collections: Collection[];
  collectionContents: Record<string, React.ReactNode>;
}

export function CollectionTabsHome({ collections, collectionContents }: CollectionTabsHomeProps) {
  // 使用第一個 collection 作為預設
  const [activeTab, setActiveTab] = useState<string>(
    collections.length > 0 ? collections[0]!.handle : ''
  );

  return (
    <div className="min-h-screen bg-[#e9eaed]">
      {/* Profile Header - Light gray background */}
      <div className="relative bg-[#e9eaed] pt-16">
        <div className="mx-auto max-w-6xl px-4">
          {/* Right: Title and Tabs - with left margin to avoid avatar */}
          <div className="ml-[280px] flex flex-col">
            {/* Title */}
            <div className="flex items-center gap-2 pb-2">
              <h1 className="text-2xl font-bold text-gray-900">org123.xyz</h1>
            </div>

            {/* Tabs - positioned at the bottom, aligned with bottom of gray area */}
            <div className="relative z-10 flex flex-wrap gap-1">
              {collections.map((collection) => (
                <button
                  key={collection.handle}
                  onClick={() => setActiveTab(collection.handle)}
                  className={clsx(
                    'px-5 py-2 text-sm font-bold transition-all',
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
        <div className="mx-auto max-w-6xl px-4 pb-6">
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left Column - Sidebar with Avatar */}
            <div className="lg:col-span-3">
              {/* Avatar - positioned absolutely, extending up into gray area */}
              <div className="relative -mt-20 mb-4 w-full">
                <div className="relative z-20 overflow-hidden border border-gray-300 shadow-lg">
                  <div className="relative flex aspect-square w-full items-center justify-center bg-white">
                    <div className="relative h-[70%] w-[70%]">
                      <Image
                        src="/images/avatars/org123_logo.svg"
                        alt="org123 logo"
                        fill
                        className="object-contain"
                        priority
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Description */}
              <div className="mb-4 border border-gray-300 bg-white p-3 text-xs text-gray-700">
                <p className="leading-relaxed">
                  Giving people the power to shop and make the world more open and connected.
                </p>
              </div>

              {/* Information Section */}
              <div className="border-b-0 border-r border-t border-gray-300 bg-white">
                <div className="border-b border-gray-300 bg-[#f7f7f7] px-3 py-2">
                  <h3 className="text-xs font-bold text-gray-800">Information</h3>
                </div>
                <div className="px-3 py-2">
                  <div className="flex items-center gap-3">
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
                        className="aspect-square border border-gray-300 bg-gray-100"
                      >
                        <div className="flex h-full items-center justify-center text-xs text-gray-400">
                          👤
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Content */}
            <div className="lg:col-span-9">
              {/* Main Content - Product Grid */}
              <div className="mt-6 border border-gray-300 bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-xl font-semibold text-[#3b5998]">
                  {collections.find((c) => c.handle === activeTab)?.title || 'Products'}
                </h2>

                <Suspense
                  fallback={
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {[...Array(6)].map((_, i) => (
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
