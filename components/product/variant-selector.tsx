'use client';

import clsx from 'clsx';
import { useProduct, useUpdateURL } from 'components/product/product-context';
import { ProductOption, ProductVariant } from 'lib/shopify/types';

type Combination = {
  id: string;
  availableForSale: boolean;
  [key: string]: string | boolean;
};

// 將尺寸名稱轉換為縮寫
function getSizeAbbreviation(value: string): string {
  const lowerValue = value.toLowerCase().trim();

  // 尺寸縮寫對應表
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
    'extra extra large': 'XXL',
    'xx-large': 'XXL',
    'xxl': 'XXL',
    '2xl': '2XL',
    '3xl': '3XL',
    '4xl': '4XL',
    '5xl': '5XL',
    'one size': 'OS',
    'one-size': 'OS',
    'onesize': 'OS',
    'free size': 'FREE',
    'free': 'FREE'
  };

  // 如果找到對應的縮寫，返回縮寫；否則返回原值
  return sizeMap[lowerValue] || value;
}

export function VariantSelector({
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

  return options.map((option) => (
    <form key={option.id}>
      <dl className="mb-8">
        <dt className="mb-4 text-sm uppercase tracking-wide">{option.name}</dt>
        <dd className="flex flex-wrap gap-3">
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
                formAction={() => {
                  const newState = updateOption(optionNameLowerCase, value);
                  updateURL(newState);
                }}
                key={value}
                aria-disabled={!isAvailableForSale}
                disabled={!isAvailableForSale}
                title={`${option.name} ${value}${!isAvailableForSale ? ' (Out of Stock)' : ''}`}
                className={clsx(
                  'flex min-w-[48px] items-center justify-center rounded-full border bg-neutral-100 px-2 py-1 text-sm dark:border-neutral-800 dark:bg-neutral-900',
                  {
                    'cursor-default ring-2 ring-blue-600': isActive,
                    'ring-1 ring-transparent transition duration-300 ease-in-out hover:ring-blue-600':
                      !isActive && isAvailableForSale,
                    'relative z-10 cursor-not-allowed overflow-hidden bg-neutral-100 text-neutral-500 ring-1 ring-neutral-300 before:absolute before:inset-x-0 before:-z-10 before:h-px before:-rotate-45 before:bg-neutral-300 before:transition-transform dark:bg-neutral-900 dark:text-neutral-400 dark:ring-neutral-700 dark:before:bg-neutral-700':
                      !isAvailableForSale
                  }
                )}
              >
                {getSizeAbbreviation(value)}
              </button>
            );
          })}
        </dd>
      </dl>
    </form>
  ));
}
