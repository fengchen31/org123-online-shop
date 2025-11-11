'use client';

import { useState, useEffect, useMemo } from 'react';
import { CollectionProductsGrid } from './collection-products-grid';
import { type CategoryType } from './category-filter';
import { CollectionHeader } from './collection-header';
import type { Product } from 'lib/shopify/types';
import type { SortFilterItem } from 'lib/constants';
import { defaultSort } from 'lib/constants';

interface CollectionProductsClientProps {
  initialProducts: Product[];
  collectionHandle: string;
  collectionTitle: string;
  collectionDescription: string;
}

const CATEGORIES = [
  { id: 'all' as CategoryType, label: 'All', icon: '' },
  { id: 'accessories' as CategoryType, label: 'Accessories', icon: '' },
  { id: 'clothing' as CategoryType, label: 'Clothing', icon: '' },
  { id: 'footwear' as CategoryType, label: 'Footwear', icon: '' },
  { id: 'lifestyle' as CategoryType, label: 'Lifestyle', icon: '' }
];

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

  const handleSortChange = async (sortOption: SortFilterItem) => {
    setCurrentSort(sortOption);
    await fetchProducts(sortOption, activeCategory);
  };

  const handleCategoryChange = async (category: CategoryType) => {
    setActiveCategory(category);
    await fetchProducts(currentSort, category);
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

      <CollectionProductsGrid
        products={filteredProducts}
        collectionName={collectionTitle}
        onSortChange={handleSortChange}
        categories={CATEGORIES}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />
    </>
  );
}
