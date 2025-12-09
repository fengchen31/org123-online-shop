'use client';

import clsx from 'clsx';
import { useProduct, useUpdateURL } from 'components/product/product-context';
import { ProductOption, ProductVariant } from 'lib/shopify/types';

type Combination = {
  id: string;
  availableForSale: boolean;
  [key: string]: string | boolean;
};

// Convert size names to acronyms
function getSizeAcronym(value: string): string {
  const lowerValue = value.toLowerCase().trim();
  const sizeMap: Record<string, string> = {
    'small': 'S',
    'medium': 'M',
    'large': 'L',
    'x-large': 'XL',
    'extra large': 'XL',
    'xlarge': 'XL',
    'xx-large': 'XXL',
    '2x-large': 'XXL',
    'xxlarge': 'XXL',
    'xxx-large': 'XXXL',
    '3x-large': 'XXXL',
    'xxxlarge': 'XXXL'
  };

  return sizeMap[lowerValue] || value;
}

export function FacebookVariantSelector({
  options,
  variants
}: {
  options: ProductOption[];
  variants: ProductVariant[];
}) {
  const { state, updateOption } = useProduct();
  const updateURL = useUpdateURL();
  const hasNoOptionsOrJustOneOption =
    !options.length || (options.length === 1 && options[0]?.values.length === 1);

  if (hasNoOptionsOrJustOneOption) {
    return null;
  }

  const combinations: Combination[] = variants.map((variant) => ({
    id: variant.id,
    availableForSale: variant.availableForSale,
    ...variant.selectedOptions.reduce(
      (accumulator, option) => ({ ...accumulator, [option.name.toLowerCase()]: option.value }),
      {}
    )
  }));

  return (
    <div className="space-y-3">
      {options.map((option) => (
        <div key={option.id}>
          <label className="mb-1 block text-xs font-bold uppercase text-gray-600">
            {option.name}:
          </label>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const optionNameLowerCase = option.name.toLowerCase();

              // Base option params on current selectedOptions so we can preserve any other param state.
              const optionParams = { ...state, [optionNameLowerCase]: value };

              // Filter out invalid options and check if the option combination is available for sale.
              const filtered = Object.entries(optionParams).filter(([key, value]) =>
                options.find(
                  (option) => option.name.toLowerCase() === key && option.values.includes(value)
                )
              );
              const isAvailableForSale = combinations.find((combination) =>
                filtered.every(
                  ([key, value]) => combination[key] === value && combination.availableForSale
                )
              );

              // The option is active if it's in the selected options.
              const isActive = state[optionNameLowerCase] === value;

              return (
                <button
                  onClick={() => {
                    const newState = updateOption(optionNameLowerCase, value);
                    updateURL(newState);
                  }}
                  type="button"
                  key={value}
                  title={`${option.name} ${value}${!isAvailableForSale ? ' (Out of Stock)' : ''}`}
                  className={clsx(
                    'relative border px-3 py-1 text-sm transition-colors',
                    {
                      'border-[#3b5998] bg-[#eceff5] font-semibold text-[#3b5998]': isActive,
                      'border-gray-300 bg-white text-gray-700 hover:border-[#3b5998] hover:bg-gray-50':
                        !isActive && isAvailableForSale,
                      'border-gray-200 bg-gray-100 text-gray-400 hover:border-gray-300':
                        !isAvailableForSale
                    }
                  )}
                >
                  {option.name.toLowerCase() === 'size' ? getSizeAcronym(value) : value}
                  {/* Diagonal line for sold out variants - from bottom-left to top-right */}
                  {!isAvailableForSale && (
                    <span className="pointer-events-none absolute bottom-0 left-0 h-full w-full">
                      <svg className="h-full w-full" preserveAspectRatio="none">
                        <line x1="0" y1="100%" x2="100%" y2="0" stroke="rgb(156, 163, 175)" strokeWidth="1.5" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
