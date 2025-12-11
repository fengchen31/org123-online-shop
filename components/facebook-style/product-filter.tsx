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
    <div className="relative inline-block">
      <div className="flex items-center gap-1.5 border border-gray-300 bg-[#f7f7f7] px-2 py-[3px] leading-none sm:gap-2 sm:px-3 sm:py-1">
        <span className="text-[10px] leading-none text-gray-600 sm:text-xs">Sort by:</span>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-[10px] font-semibold leading-none text-[#3b5998] hover:underline sm:text-xs"
        >
          {currentSort.title}
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-1 min-w-[160px] border border-gray-300 bg-white shadow-lg sm:min-w-[200px]">
          {sorting.map((option) => (
            <button
              key={option.slug || 'default'}
              onClick={() => {
                onSortChange(option);
                setIsOpen(false);
              }}
              className={clsx(
                'block w-full text-left px-2 py-1.5 text-[10px] transition-colors sm:px-3 sm:py-2 sm:text-xs',
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
  );
}
