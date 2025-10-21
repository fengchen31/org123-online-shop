'use client';

import clsx from 'clsx';
import { TabType } from './profile-tabs';

interface ProfileHeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function ProfileHeader({ activeTab, onTabChange }: ProfileHeaderProps) {
  const tabs: { id: TabType; label: string }[] = [
    { id: 'wall', label: 'Wall' },
    { id: 'info', label: 'Info' },
    { id: 'source', label: 'Source' }
  ];

  return (
    <div className="bg-[#d8dfea]">
      <div className="mx-auto max-w-7xl px-4">
        <div className="py-6">
          {/* Profile Info */}
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-[#3b5998]">org123.xyz</h1>
            <p className="mt-1 text-sm text-gray-600">Online Store</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white pt-0">
          <div className="flex gap-1 border-b border-gray-300">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={clsx(
                  'rounded-t border-x border-t px-4 py-2 text-sm font-semibold transition-colors',
                  activeTab === tab.id
                    ? 'border-gray-300 bg-white text-[#3b5998]'
                    : 'border-transparent bg-transparent text-gray-700 hover:bg-gray-100'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
