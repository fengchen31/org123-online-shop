'use client';

import { useState } from 'react';
import { ProfileHeader } from './profile-header';
import { TabType } from './profile-tabs';

interface FacebookHomeProps {
  wallContent: React.ReactNode;
  infoContent: React.ReactNode;
  sourceContent: React.ReactNode;
}

export function FacebookHome({ wallContent, infoContent, sourceContent }: FacebookHomeProps) {
  const [activeTab, setActiveTab] = useState<TabType>('wall');

  return (
    <div className="min-h-screen bg-white">
      {/* Profile Header with Tabs */}
      <ProfileHeader activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Sidebar */}
          <aside className="lg:col-span-3">
            <div className="rounded border border-gray-300 bg-white p-4 shadow-sm">
              <h3 className="mb-3 font-semibold text-[#3b5998]">About</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <strong>org123.xyz</strong>
                </p>
                <p>Your online shopping destination</p>
              </div>
            </div>

            <div className="mt-4 rounded border border-gray-300 bg-white p-4 shadow-sm">
              <h3 className="mb-3 font-semibold text-[#3b5998]">Information</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Shop our collections</p>
                <p>Latest products</p>
                <p>Best sellers</p>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-9">
            <div className="rounded border border-gray-300 bg-white shadow-sm">
              {activeTab === 'wall' && (
                <div className="p-6">
                  <h2 className="mb-4 text-xl font-semibold text-[#3b5998]">Wall</h2>
                  {wallContent}
                </div>
              )}

              {activeTab === 'info' && (
                <div className="p-6">
                  <h2 className="mb-4 text-xl font-semibold text-[#3b5998]">Info</h2>
                  {infoContent}
                </div>
              )}

              {activeTab === 'source' && (
                <div className="p-6">
                  <h2 className="mb-4 text-xl font-semibold text-[#3b5998]">Collections</h2>
                  {sourceContent}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
