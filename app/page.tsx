import { CollectionProductsWrapper } from 'components/facebook-style/collection-products-wrapper';
import { HomePageClient } from 'components/facebook-style/home-page-client';
import { getCollections, getPages, getCollection, getPage } from 'lib/shopify';
import { Suspense } from 'react';
import type { Metadata } from 'next';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const postId = params.post as string | undefined;

  console.log('=== generateMetadata called ===');
  console.log('postId:', postId);

  // Default metadata
  const defaultMetadata: Metadata = {
    description: 'org123.xyz - Your online shopping destination',
    openGraph: {
      type: 'website'
    }
  };

  // If no post parameter, return default
  if (!postId) {
    console.log('No postId, returning default metadata');
    return defaultMetadata;
  }

  try {
    // Check if it's a Shopify Page ID (format: gid://shopify/Page/xxx)
    if (postId.startsWith('gid://shopify/Page/')) {
      console.log('Detected Shopify Page ID');
      const pages = await getPages();
      const page = pages.find((p) => p.id === postId);

      if (page) {
        console.log('Page found:', page.title);

        // Extract first image URL from page body
        const extractFirstImageUrl = (htmlBody: string): string | undefined => {
          try {
            const imgMatch = htmlBody.match(/<img[^>]+src="([^">]+)"/);
            return imgMatch ? imgMatch[1] : undefined;
          } catch (error) {
            return undefined;
          }
        };

        const imageUrl = extractFirstImageUrl(page.body);
        console.log('Extracted image URL:', imageUrl);

        const metadata = {
          title: page.title,
          description: page.bodySummary || page.seo?.description || 'org123.xyz',
          openGraph: {
            type: 'website' as const,
            title: page.title,
            description: page.bodySummary || page.seo?.description || 'org123.xyz',
            images: imageUrl
              ? [
                  {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: page.title
                  }
                ]
              : undefined
          }
        };
        console.log('Generated metadata for page:', metadata);
        return metadata;
      }
    }

    // Try to extract collection handle from postId
    // Format: "collection-{handle}"
    console.log('Checking if postId starts with "collection-":', postId.startsWith('collection-'));
    if (postId.startsWith('collection-')) {
      const collectionHandle = postId.replace('collection-', '');
      console.log('Collection handle:', collectionHandle);

      const collection = await getCollection(collectionHandle);
      console.log('Collection found:', !!collection);

      if (collection) {
        const metadata = {
          title: collection.title,
          description: collection.description || collection.seo?.description || 'org123.xyz',
          openGraph: {
            type: 'website' as const,
            title: collection.title,
            description: collection.description || collection.seo?.description || 'org123.xyz'
          }
        };
        console.log('Generated metadata for collection:', metadata);
        return metadata;
      }
    }
  } catch (error) {
    console.error('Error generating metadata for post:', postId, error);
  }

  console.log('Returning default metadata');
  return defaultMetadata;
}

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
