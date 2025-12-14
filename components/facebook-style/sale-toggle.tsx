'use client';

import clsx from 'clsx';

interface SaleToggleProps {
  showOnSale: boolean;
  onToggle: (showOnSale: boolean) => void;
}

export function SaleToggle({ showOnSale, onToggle }: SaleToggleProps) {
  return (
    <button
      onClick={() => onToggle(!showOnSale)}
      className={clsx(
        'flex items-center border px-2 py-[3px] text-[10px] font-semibold leading-none transition-all sm:px-3 sm:py-1 sm:text-xs',
        showOnSale
          ? 'border-[#3b5998] bg-[#3b5998] text-white'
          : 'border-gray-300 bg-[#f7f7f7] text-gray-600 hover:bg-gray-200'
      )}
    >
      Sale
    </button>
  );
}
