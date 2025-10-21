'use client';

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
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={clsx(
            'border border-gray-300 px-3 py-1 text-xs font-medium transition-all',
            activeCategory === category.id
              ? 'bg-[#3b5998] text-white shadow-md'
              : 'bg-[#f7f7f7] text-gray-800 hover:bg-gray-200'
          )}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
