'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { CollectionProductsGrid } from './collection-products-grid';
import { type CategoryType } from './category-filter';
import { CollectionHeader } from './collection-header';
import { LoadingDots } from '../loading-dots';
import type { Product } from 'lib/shopify/types';
import type { SortFilterItem } from 'lib/constants';
import { defaultSort } from 'lib/constants';
import { HIDDEN_PRODUCT_TAG } from 'lib/constants';

interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

interface CollectionProductsClientProps {
  initialProducts: Product[];
  initialPageInfo: PageInfo;
  collectionHandle: string;
  collectionTitle: string;
  collectionDescription: string;
}

export function CollectionProductsClient({
  initialProducts,
  initialPageInfo,
  collectionHandle,
  collectionTitle,
  collectionDescription
}: CollectionProductsClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [allProducts, setAllProducts] = useState<Product[]>(initialProducts); // 保存所有商品用於生成 categories
  const [pageInfo, setPageInfo] = useState<PageInfo>(initialPageInfo);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentSort, setCurrentSort] = useState<SortFilterItem>(defaultSort);
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const observerTarget = useRef<HTMLDivElement>(null);

  // 從所有商品中動態生成 categories (不受過濾影響)
  const categories = useMemo(() => {
    const allTags = new Set<string>();

    allProducts.forEach((product) => {
      if (product.tags) {
        product.tags.forEach((tag) => {
          if (tag && tag.trim() !== '' && tag !== HIDDEN_PRODUCT_TAG) {
            allTags.add(tag.trim());
          }
        });
      }
    });

    const tagCategories = Array.from(allTags)
      .sort((a, b) => a.localeCompare(b))
      .map((tag) => ({
        id: tag,
        label: tag,
        icon: ''
      }));

    return [{ id: 'all', label: 'All', icon: '' }, ...tagCategories];
  }, [allProducts]);

  const handleSortChange = async (sortOption: SortFilterItem) => {
    setCurrentSort(sortOption);
    await fetchProducts(sortOption, activeCategory);
  };

  const handleCategoryChange = async (category: CategoryType) => {
    // 只需要更新 category 狀態，filteredProducts 會自動重新計算
    // 不需要重新獲取數據，避免閃爍
    setActiveCategory(category);
  };

  const fetchProducts = async (sortOption: SortFilterItem, category: CategoryType, cursor?: string) => {
    const loadingMore = !!cursor;

    if (loadingMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const params = new URLSearchParams({
        collection: collectionHandle,
        sortKey: sortOption.sortKey,
        reverse: sortOption.reverse.toString(),
        first: '50'
      });

      // 不傳 category 參數，始終獲取所有商品
      // if (category !== 'all') {
      //   params.append('category', category);
      // }

      if (cursor) {
        params.append('after', cursor);
      }

      const response = await fetch(`/api/collection-products?${params.toString()}`);
      const data = await response.json();

      if (loadingMore) {
        // Append new products to existing ones
        const newAllProducts = [...allProducts, ...data.products];
        setAllProducts(newAllProducts);
        setProducts(newAllProducts);
      } else {
        // Replace products - 保存所有商品
        setAllProducts(data.products);
        setProducts(data.products);
      }

      setPageInfo(data.pageInfo);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      if (loadingMore) {
        setIsLoadingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  // Load more products when scrolling to bottom
  const loadMore = useCallback(() => {
    if (!isLoadingMore && !isLoading && pageInfo.hasNextPage && pageInfo.endCursor) {
      fetchProducts(currentSort, activeCategory, pageInfo.endCursor);
    }
  }, [isLoadingMore, isLoading, pageInfo, currentSort, activeCategory]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loadMore]);

  // Filter products based on category (client-side filtering as fallback)
  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return products;

    return products.filter((product) => {
      const tags = product.tags.map((tag) => tag.toLowerCase());
      return tags.includes(activeCategory.toLowerCase());
    });
  }, [products, activeCategory]);

  const productCount = filteredProducts.length;

  return (
    <>
      <CollectionHeader
        title={collectionTitle}
        description={collectionDescription}
        productCount={productCount}
      />

      {isLoading ? (
        <>
          {/* Filters Skeleton */}
          <div className="mb-3 sm:mb-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Category Filter Skeleton */}
              <div className="flex min-w-0 flex-shrink gap-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 w-16 animate-pulse rounded bg-gray-200"></div>
                ))}
              </div>

              {/* Currency Toggle and Sort Filter Skeleton */}
              <div className="flex items-center gap-2">
                <div className="h-8 w-24 animate-pulse rounded bg-gray-200"></div>
                <div className="h-8 w-28 animate-pulse rounded bg-gray-200"></div>
              </div>
            </div>
          </div>

          {/* Products Grid Skeleton */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square rounded bg-gray-200"></div>
                <div className="mt-2 h-4 rounded bg-gray-200"></div>
                <div className="mt-2 h-3 rounded bg-gray-200"></div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <CollectionProductsGrid
          products={filteredProducts}
          collectionName={collectionTitle}
          onSortChange={handleSortChange}
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />
      )}

      {/* Infinite scroll trigger */}
      <div ref={observerTarget} className="h-20 w-full">
        {isLoadingMore && (
          <div className="flex items-center justify-center py-8">
            <LoadingDots className="text-gray-500" />
          </div>
        )}
      </div>
    </>
  );
}
