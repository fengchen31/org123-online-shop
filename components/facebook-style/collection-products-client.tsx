'use client';

import { useState, useEffect, useMemo } from 'react';
import { CollectionProductsGrid } from './collection-products-grid';
import { type CategoryType } from './category-filter';
import { CollectionHeader } from './collection-header';
import type { Product } from 'lib/shopify/types';
import type { SortFilterItem } from 'lib/constants';
import { defaultSort } from 'lib/constants';
import { HIDDEN_PRODUCT_TAG } from 'lib/constants';

interface CollectionProductsClientProps {
  initialProducts: Product[];
  collectionHandle: string;
  collectionTitle: string;
  collectionDescription: string;
}

export function CollectionProductsClient({
  initialProducts,
  collectionHandle,
  collectionTitle,
  collectionDescription
}: CollectionProductsClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSort, setCurrentSort] = useState<SortFilterItem>(defaultSort);
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 從商品中動態生成 categories
  const categories = useMemo(() => {
    const allTags = new Set<string>();

    products.forEach((product) => {
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
  }, [products]);

  const handleSortChange = async (sortOption: SortFilterItem) => {
    // 開始過渡動畫
    setIsTransitioning(true);

    // 短暫延遲讓淡出動畫完成
    await new Promise(resolve => setTimeout(resolve, 150));

    setCurrentSort(sortOption);
    await fetchProducts(sortOption, activeCategory);

    // 淡入動畫
    setTimeout(() => {
      setIsTransitioning(false);
    }, 50);
  };

  const handleCategoryChange = async (category: CategoryType) => {
    // 開始過渡動畫
    setIsTransitioning(true);

    // 短暫延遲讓淡出動畫完成
    await new Promise(resolve => setTimeout(resolve, 150));

    setActiveCategory(category);
    await fetchProducts(currentSort, category);

    // 淡入動畫
    setTimeout(() => {
      setIsTransitioning(false);
    }, 50);
  };

  const fetchProducts = async (sortOption: SortFilterItem, category: CategoryType) => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        collection: collectionHandle,
        sortKey: sortOption.sortKey,
        reverse: sortOption.reverse.toString()
      });

      if (category !== 'all') {
        params.append('category', category);
      }

      const response = await fetch(`/api/collection-products?${params.toString()}`);
      const data = await response.json();
      setProducts(data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

      {isLoading && (
        <div className="mb-4 border border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-700">
          Loading products...
        </div>
      )}

      <div
        className={`transition-opacity duration-200 ease-in-out ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <CollectionProductsGrid
          products={filteredProducts}
          collectionName={collectionTitle}
          onSortChange={handleSortChange}
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />
      </div>
    </>
  );
}
