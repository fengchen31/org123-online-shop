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
    'extra extra small': 'XXS',
    'xx-small': 'XXS',
    'xxs': 'XXS',
    'extra small': 'XS',
    'x-small': 'XS',
    'xs': 'XS',
    'small': 'S',
    's': 'S',
    'medium': 'M',
    'm': 'M',
    'large': 'L',
    'l': 'L',
    'extra large': 'XL',
    'x-large': 'XL',
    'xl': 'XL',
    'xlarge': 'XL',
    'extra extra large': 'XXL',
    'xx-large': 'XXL',
    'xxl': 'XXL',
    'xxlarge': 'XXL',
    '2xl': '2XL',
    '2x-large': '2XL',
    '3xl': '3XL',
    '3x-large': '3XL',
    'xxx-large': '3XL',
    'xxxlarge': '3XL',
    '4xl': '4XL',
    '5xl': '5XL',
    'one size': 'OS',
    'one-size': 'OS',
    'onesize': 'OS',
    'free size': 'FREE',
    'free': 'FREE'
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
                  {getSizeAcronym(value)}
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
