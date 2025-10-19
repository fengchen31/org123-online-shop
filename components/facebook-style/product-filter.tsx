'use client';

import { useState } from 'react';
import clsx from 'clsx';
import type { SortFilterItem } from 'lib/constants';
import { sorting } from 'lib/constants';

interface ProductFilterProps {
  onSortChange: (sortOption: SortFilterItem) => void;
  currentSort: SortFilterItem;
}

export function ProductFilter({ onSortChange, currentSort }: ProductFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-4 flex justify-end">
      <div className="relative inline-block">
        <div className="flex items-center gap-2 border border-gray-300 bg-[#f7f7f7] px-3 py-1">
          <span className="text-xs text-gray-600">Sort by:</span>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-xs font-semibold text-[#3b5998] hover:underline"
          >
            {currentSort.title}
          </button>
        </div>

        {isOpen && (
          <div className="absolute right-0 z-10 mt-1 min-w-[200px] border border-gray-300 bg-white shadow-lg">
            {sorting.map((option) => (
              <button
                key={option.slug || 'default'}
                onClick={() => {
                  onSortChange(option);
                  setIsOpen(false);
                }}
                className={clsx(
                  'block w-full text-left px-3 py-2 text-xs transition-colors',
                  currentSort.slug === option.slug
                    ? 'bg-[#3b5998] text-white font-semibold'
                    : 'text-gray-700 hover:bg-[#e9eaed]'
                )}
              >
                {option.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
