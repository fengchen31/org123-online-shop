'use client';

import { useState } from 'react';
import clsx from 'clsx';

export type CategoryType = 'all' | 'accessories' | 'clothing' | 'footwear' | 'lifestyle';

interface CategoryFilterProps {
  categories: Array<{
    id: CategoryType;
    label: string;
    icon: string;
  }>;
  activeCategory: CategoryType;
  onCategoryChange: (category: CategoryType) => void;
}

export function CategoryFilter({
  categories,
  activeCategory,
  onCategoryChange
}: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeCategoryLabel = categories.find(cat => cat.id === activeCategory)?.label || 'All';

  return (
    <>
      {/* Mobile: Dropdown */}
      <div className="relative inline-block md:hidden">
        <div className="flex items-center gap-1.5 border border-gray-300 bg-[#f7f7f7] px-2 py-0.5 sm:gap-2 sm:px-3 sm:py-1">
          <span className="text-[10px] text-gray-600 sm:text-xs">Category:</span>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-[10px] font-semibold text-[#3b5998] hover:underline sm:text-xs"
          >
            {activeCategoryLabel}
          </button>
        </div>

        {isOpen && (
          <div className="absolute left-0 z-10 mt-1 min-w-[160px] border border-gray-300 bg-white shadow-lg sm:min-w-[200px]">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  onCategoryChange(category.id);
                  setIsOpen(false);
                }}
                className={clsx(
                  'block w-full text-left px-2 py-1.5 text-[10px] transition-colors sm:px-3 sm:py-2 sm:text-xs',
                  activeCategory === category.id
                    ? 'bg-[#3b5998] text-white font-semibold'
                    : 'text-gray-700 hover:bg-[#e9eaed]'
                )}
              >
                {category.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: Button Tags */}
      <div className="hidden flex-wrap gap-1.5 md:flex sm:gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={clsx(
              'border border-gray-300 px-2 py-0.5 text-[10px] font-medium transition-all sm:px-3 sm:py-1 sm:text-xs',
              activeCategory === category.id
                ? 'bg-[#3b5998] text-white shadow-md'
                : 'bg-[#f7f7f7] text-gray-800 hover:bg-gray-200'
            )}
          >
            {category.label}
          </button>
        ))}
      </div>
    </>
  );
}
