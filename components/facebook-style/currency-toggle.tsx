'use client';

import { useCurrency, type Currency } from '../currency-context';
import clsx from 'clsx';

export function CurrencyToggle() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="flex items-center gap-0.5 border border-gray-300 bg-[#f7f7f7] sm:gap-1">
      <button
        onClick={() => setCurrency('TWD')}
        className={clsx(
          'px-2 py-0.5 text-[10px] font-semibold transition-all sm:px-3 sm:py-1 sm:text-xs',
          currency === 'TWD'
            ? 'bg-[#3b5998] text-white'
            : 'text-gray-600 hover:bg-gray-200'
        )}
      >
        TWD
      </button>
      <button
        onClick={() => setCurrency('USD')}
        className={clsx(
          'px-2 py-0.5 text-[10px] font-semibold transition-all sm:px-3 sm:py-1 sm:text-xs',
          currency === 'USD'
            ? 'bg-[#3b5998] text-white'
            : 'text-gray-600 hover:bg-gray-200'
        )}
      >
        USD
      </button>
    </div>
  );
}
