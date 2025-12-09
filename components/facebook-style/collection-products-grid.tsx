'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProductCard } from './product-card';
import { ProductDetailInGrid } from './product-detail-in-grid';
import { ProductFilter } from './product-filter';
import { CurrencyToggle } from './currency-toggle';
import { CategoryFilter, type CategoryType } from './category-filter';
import type { Product } from 'lib/shopify/types';
import type { SortFilterItem } from 'lib/constants';
import { defaultSort } from 'lib/constants';

interface CollectionProductsGridProps {
  products: Product[];
  collectionName?: string;
  onSortChange?: (sortOption: SortFilterItem) => void;
  categories?: Array<{
    id: CategoryType;
    label: string;
    icon: string;
  }>;
  activeCategory?: CategoryType;
  onCategoryChange?: (category: CategoryType) => void;
}

export function CollectionProductsGrid({
  products,
  collectionName,
  onSortChange,
  categories,
  activeCategory,
  onCategoryChange
}: CollectionProductsGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [expandedProduct, setExpandedProduct] = useState<Product | null>(null);
  const [startRect, setStartRect] = useState<DOMRect | null>(null);
  const [currentSort, setCurrentSort] = useState<SortFilterItem>(defaultSort);

  // 從URL讀取展開的商品並設置初始狀態
  useEffect(() => {
    const productHandle = searchParams.get('product');
    if (productHandle && products?.length) {
      const product = products.find(p => p.handle === productHandle);
      if (product) {
        setExpandedProduct(product);
      }
    } else {
      // 當URL中沒有product參數時，關閉商品詳情
      setExpandedProduct(null);
      setStartRect(null);
    }
  }, [searchParams, products]);

  if (!products?.length) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg">No products found in this collection.</p>
          <p className="mt-2 text-sm">Please check back later.</p>
        </div>
      </div>
    );
  }

  const handleExpand = (product: Product, rect: DOMRect) => {
    setStartRect(rect);
    setExpandedProduct(product);

    // 使用push來支持瀏覽器歷史記錄
    const newParams = new URLSearchParams(window.location.search);
    newParams.set('product', product.handle);
    router.push(`?${newParams.toString()}`, { scroll: false });
  };

  const handleClose = () => {
    setExpandedProduct(null);
    setStartRect(null);

    // 使用push來支持瀏覽器歷史記錄
    const newParams = new URLSearchParams(window.location.search);
    newParams.delete('product');
    router.push(`?${newParams.toString()}`, { scroll: false });
  };

  const handleSortChange = (sortOption: SortFilterItem) => {
    setCurrentSort(sortOption);
    onSortChange?.(sortOption);
  };

  return (
    <>
      {/* Filters Section - Responsive: one row when wide, two rows when narrow */}
      <div className="mb-3 sm:mb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Category Filter */}
          {categories && activeCategory !== undefined && onCategoryChange && (
            <div className="flex-shrink min-w-0">
              <CategoryFilter
                categories={categories}
                activeCategory={activeCategory}
                onCategoryChange={onCategoryChange}
              />
            </div>
          )}

          {/* Currency Toggle and Sort Filter */}
          <div className="flex items-center gap-2">
            <CurrencyToggle />
            <ProductFilter onSortChange={handleSortChange} currentSort={currentSort} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {expandedProduct ? (
          <ProductDetailInGrid
            product={expandedProduct}
            startRect={startRect}
            onClose={handleClose}
          />
        ) : (
          products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onExpand={(rect) => handleExpand(product, rect)}
              isHidden={false}
              collectionName={collectionName}
            />
          ))
        )}
      </div>
    </>
  );
}
