'use client';

import { AddToCart } from 'components/cart/add-to-cart';
import Price from 'components/price';
import Prose from 'components/prose';
import { Product } from 'lib/shopify/types';
import { VariantSelector } from './variant-selector';
import { useProduct } from './product-context';

export function ProductDescription({ product }: { product: Product }) {
  const { state } = useProduct();

  // Find the selected variant based on the current state
  const selectedVariant = product.variants.find((variant) =>
    variant.selectedOptions.every((option) => {
      const stateKey = option.name.toLowerCase();
      return state[stateKey] === option.value;
    })
  );

  // Use the selected variant's prices, or fall back to product price range
  const currentPrice = selectedVariant?.price || product.priceRange.maxVariantPrice;
  const compareAtPrice = selectedVariant?.compareAtPrice;

  // Check if there's a discount
  const hasDiscount =
    compareAtPrice && parseFloat(compareAtPrice.amount) > parseFloat(currentPrice.amount);

  return (
    <>
      <div className="mb-6 flex flex-col border-b pb-6 dark:border-neutral-700">
        <h1 className="mb-2 text-5xl font-medium">{product.title}</h1>
        <div className="flex items-center gap-3">
          {hasDiscount && (
            <div className="text-lg text-gray-500 line-through dark:text-gray-400">
              <Price amount={compareAtPrice.amount} currencyCode={compareAtPrice.currencyCode} />
            </div>
          )}
          <div className="mr-auto w-auto rounded-full bg-blue-600 p-2 text-sm text-white">
            <Price amount={currentPrice.amount} currencyCode={currentPrice.currencyCode} />
          </div>
        </div>
      </div>
      <VariantSelector options={product.options} variants={product.variants} />
      {product.descriptionHtml ? (
        <Prose
          className="mb-6 text-sm leading-tight dark:text-white/[60%]"
          html={product.descriptionHtml}
        />
      ) : null}
      <AddToCart product={product} />
    </>
  );
}
