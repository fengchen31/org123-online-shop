import { CollectionProductsWrapper } from 'components/facebook-style/collection-products-wrapper';
import { HomePageClient } from 'components/facebook-style/home-page-client';
import { getCollections, getPages } from 'lib/shopify';
import { Suspense } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  description: 'org123.xyz - Your online shopping destination',
  openGraph: {
    type: 'website'
  }
};

export default async function HomePage() {
  // 獲取所有 Shopify pages 和 collections
  const [pages, allCollections] = await Promise.all([getPages(), getCollections()]);

  // 過濾掉 "All" collection
  const collections = allCollections.filter((c) => c.handle !== '');

  // 為 collection tabs 準備 server-rendered 內容
  const collectionProductsComponents: Record<string, React.ReactNode> = {};

  collections.forEach((collection) => {
    collectionProductsComponents[collection.handle] = (
      <Suspense
        key={collection.handle}
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square rounded bg-gray-200"></div>
                <div className="mt-2 h-4 rounded bg-gray-200"></div>
                <div className="mt-2 h-3 rounded bg-gray-200"></div>
              </div>
            ))}
          </div>
        }
      >
        <CollectionProductsWrapper collectionHandle={collection.handle} />
      </Suspense>
    );
  });

  return (
    <HomePageClient
      pages={pages}
      collections={collections}
      collectionProductsComponents={collectionProductsComponents}
    />
  );
}
