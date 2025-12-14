'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProductCard } from './product-card';
import { ProductDetailInGrid } from './product-detail-in-grid';
import { ProductFilter } from './product-filter';
import { CurrencyToggle } from './currency-toggle';
import { SaleToggle } from './sale-toggle';
import { StockToggle } from './stock-toggle';
import { CategoryFilter, type CategoryType } from './category-filter';
import type { Product } from 'lib/shopify/types';
import type { SortFilterItem } from 'lib/constants';
import { defaultSort } from 'lib/constants';

interface CollectionProductsGridProps {
  products: Product[];
  collectionName?: string;
  onSortChange?: (sortOption: SortFilterItem) => void;
  currentSort?: SortFilterItem;
  showOnSale?: boolean;
  onSaleToggle?: (showOnSale: boolean) => void;
  inStockOnly?: boolean;
  onStockToggle?: (inStockOnly: boolean) => void;
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
  currentSort = defaultSort,
  showOnSale = false,
  onSaleToggle,
  inStockOnly = false,
  onStockToggle,
  categories,
  activeCategory,
  onCategoryChange
}: CollectionProductsGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [expandedProduct, setExpandedProduct] = useState<Product | null>(null);
  const [startRect, setStartRect] = useState<DOMRect | null>(null);
  const [savedScrollPosition, setSavedScrollPosition] = useState<number>(0);

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

  const handleExpand = (product: Product, rect: DOMRect) => {
    // 儲存當前滾動位置
    setSavedScrollPosition(window.scrollY);

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

    // 恢復到之前的滾動位置
    setTimeout(() => {
      window.scrollTo(0, savedScrollPosition);
    }, 0);
  };

  const handleSortChange = (sortOption: SortFilterItem) => {
    onSortChange?.(sortOption);
  };

  return (
    <>
      {/* Filters Section - Responsive: one row when wide, two rows when narrow */}
      {!expandedProduct && (
        <div className="mb-3 sm:mb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Category Filter */}
            {categories && activeCategory !== undefined && onCategoryChange && (
              <div className="flex min-w-0 flex-shrink items-center">
                <CategoryFilter
                  categories={categories}
                  activeCategory={activeCategory}
                  onCategoryChange={onCategoryChange}
                />
              </div>
            )}

            {/* Sale Toggle, Stock Toggle, Currency Toggle and Sort Filter */}
            <div className="flex items-center gap-2">
              {onSaleToggle && <SaleToggle showOnSale={showOnSale} onToggle={onSaleToggle} />}
              {onStockToggle && <StockToggle inStockOnly={inStockOnly} onToggle={onStockToggle} />}
              <CurrencyToggle />
              <ProductFilter onSortChange={handleSortChange} currentSort={currentSort} />
            </div>
          </div>
        </div>
      )}

      {!products?.length ? (
        <div className="col-span-full flex min-h-[400px] items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="text-lg">No products found with current filters.</p>
            <p className="mt-2 text-sm">Try adjusting your filters.</p>
          </div>
        </div>
      ) : (
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
      )}
    </>
  );
}
