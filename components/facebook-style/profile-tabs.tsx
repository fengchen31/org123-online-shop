'use client';

import { useState } from 'react';
import clsx from 'clsx';

export type TabType = 'wall' | 'info' | 'source';

interface ProfileTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  const tabs: { id: TabType; label: string }[] = [
    { id: 'wall', label: 'Wall' },
    { id: 'info', label: 'Info' },
    { id: 'source', label: 'Source' }
  ];

  return (
    <div className="border-b border-gray-300 bg-[#d8dfea]">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={clsx(
                'border-x border-t px-8 py-3 text-base font-semibold transition-colors',
                activeTab === tab.id
                  ? 'border-gray-300 bg-white text-[#3b5998]'
                  : 'border-transparent bg-transparent text-gray-700 hover:bg-white/50'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProfileTabsContainer() {
  const [activeTab, setActiveTab] = useState<TabType>('wall');

  return (
    <div>
      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="mx-auto max-w-6xl px-4 py-6">
        {activeTab === 'wall' && <div id="wall-content" />}
        {activeTab === 'info' && <div id="info-content" />}
        {activeTab === 'source' && <div id="source-content" />}
      </div>
    </div>
  );
}
