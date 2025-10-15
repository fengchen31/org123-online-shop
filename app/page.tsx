import { CollectionTabsHome } from 'components/facebook-style/collection-tabs-home';
import { CollectionProductsWrapper } from 'components/facebook-style/collection-products-wrapper';
import { getCollections } from 'lib/shopify';
import { Suspense } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  description: 'org123.xyz - Your online shopping destination',
  openGraph: {
    type: 'website'
  }
};

export default async function HomePage() {
  // 獲取所有 collections
  const allCollections = await getCollections();

  // 過濾掉 "All" collection
  const collections = allCollections.filter((c) => c.handle !== '');

  // 為每個 collection 準備內容
  const collectionContents: Record<string, React.ReactNode> = {};

  collections.forEach((collection) => {
    collectionContents[collection.handle] = (
      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {[...Array(6)].map((_, i) => (
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

  return <CollectionTabsHome collections={collections} collectionContents={collectionContents} />;
}
