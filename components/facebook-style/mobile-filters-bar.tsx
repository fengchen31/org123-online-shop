'use client';

import clsx from 'clsx';
import { useState } from 'react';
import { useCurrency } from '../currency-context';
import type { CategoryType } from './category-filter';
import type { SortFilterItem } from 'lib/constants';
import { sorting } from 'lib/constants';

interface MobileFiltersBarProps {
  categories: Array<{
    id: CategoryType;
    label: string;
    icon: string;
  }>;
  activeCategory: CategoryType;
  onCategoryChange: (category: CategoryType) => void;
  onSortChange: (sortOption: SortFilterItem) => void;
  currentSort: SortFilterItem;
}

export function MobileFiltersBar({
  categories,
  activeCategory,
  onCategoryChange,
  onSortChange,
  currentSort
}: MobileFiltersBarProps) {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="fixed left-0 right-0 z-40 bg-[#3b5998] md:hidden" style={{ bottom: '56px' }}>
      <div className="flex items-center justify-between gap-2 px-2 py-2">
        {/* Left: Category Tags */}
        <div className="flex flex-1 gap-1 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={clsx(
                'shrink-0 border px-2 py-1 text-[10px] font-medium transition-all',
                activeCategory === category.id
                  ? 'border-white bg-white text-[#3b5998]'
                  : 'border-white/40 bg-transparent text-white hover:bg-white/10'
              )}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Right: Currency Toggle and Sort Filter */}
        <div className="flex shrink-0 items-center gap-1">
          {/* Currency Toggle */}
          <div className="flex items-center gap-0.5 border border-white/40 bg-transparent">
            <button
              onClick={() => setCurrency('TWD')}
              className={clsx(
                'px-1.5 py-1 text-[9px] font-semibold transition-all',
                currency === 'TWD'
                  ? 'bg-white text-[#3b5998]'
                  : 'text-white hover:bg-white/10'
              )}
            >
              TWD
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={clsx(
                'px-1.5 py-1 text-[9px] font-semibold transition-all',
                currency === 'USD'
                  ? 'bg-white text-[#3b5998]'
                  : 'text-white hover:bg-white/10'
              )}
            >
              USD
            </button>
          </div>

          {/* Sort Filter */}
          <div className="relative">
            <button
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="flex items-center gap-1 border border-white/40 bg-transparent px-2 py-1 text-[10px] font-medium text-white transition-all hover:bg-white/10"
            >
              <span>Sort</span>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isSortOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsSortOpen(false)}
                />

                {/* Dropdown */}
                <div className="absolute bottom-full right-0 z-50 mb-1 min-w-[160px] border border-gray-300 bg-white shadow-lg">
                  {sorting.map((option) => (
                    <button
                      key={option.slug || 'default'}
                      onClick={() => {
                        onSortChange(option);
                        setIsSortOpen(false);
                      }}
                      className={clsx(
                        'block w-full px-3 py-2 text-left text-[10px] transition-colors',
                        currentSort.slug === option.slug
                          ? 'bg-[#3b5998] font-semibold text-white'
                          : 'text-gray-700 hover:bg-[#e9eaed]'
                      )}
                    >
                      {option.title}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
