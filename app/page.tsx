import { CollectionProductsWrapper } from 'components/facebook-style/collection-products-wrapper';
import { HomePageClient } from 'components/facebook-style/home-page-client';
import { getCollections, getBlogArticles, getCollection, getArticle } from 'lib/shopify';
import { Suspense } from 'react';
import type { Metadata } from 'next';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const postId = params.post as string | undefined;

  // Default metadata
  const defaultMetadata: Metadata = {
    description: 'org123.xyz - Your online shopping destination',
    openGraph: {
      type: 'website'
    }
  };

  // If no post parameter, return default
  if (!postId) {
    return defaultMetadata;
  }

  try {
    // Check if it's a Shopify Article ID (format: gid://shopify/Article/xxx)
    if (postId.startsWith('gid://shopify/Article/')) {
      const articles = await getBlogArticles('news');
      const article = articles.find((a) => a.id === postId);

      if (article) {
        // Extract first image URL from article content or use featured image
        const extractFirstImageUrl = (htmlContent: string): string | undefined => {
          try {
            const imgMatch = htmlContent.match(/<img[^>]+src="([^">]+)"/);
            return imgMatch ? imgMatch[1] : undefined;
          } catch (error) {
            return undefined;
          }
        };

        const imageUrl = article.image?.url || extractFirstImageUrl(article.contentHtml);

        const metadata = {
          title: article.title,
          description: article.excerpt || article.seo?.description || 'org123.xyz',
          openGraph: {
            type: 'article' as const,
            title: article.title,
            description: article.excerpt || article.seo?.description || 'org123.xyz',
            publishedTime: article.publishedAt,
            authors: article.author?.name ? [article.author.name] : undefined,
            images: imageUrl
              ? [
                  {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: article.title
                  }
                ]
              : undefined
          }
        };
        return metadata;
      }
    }

    // Try to extract collection handle from postId
    // Format: "collection-{handle}"
    if (postId.startsWith('collection-')) {
      const collectionHandle = postId.replace('collection-', '');

      const collection = await getCollection(collectionHandle);

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
        return metadata;
      }
    }
  } catch (error) {
    console.error('Error generating metadata for post:', postId, error);
  }

  return defaultMetadata;
}

export default async function HomePage() {
  // 獲取所有 Shopify blog articles 和 collections
  const [articles, allCollections] = await Promise.all([
    getBlogArticles('news'), // 從 'news' blog 獲取文章
    getCollections()
  ]);

  // 不需要過濾，使用所有 collections
  const collections = allCollections;

  // 為 collection tabs 準備 server-rendered 內容
  const collectionProductsComponents: Record<string, React.ReactNode> = {};

  collections.forEach((collection) => {
    collectionProductsComponents[collection.handle] = (
      <Suspense
        key={collection.handle}
        fallback={
          <>
            {/* Collection Description Skeleton */}
            <div className="mb-3 sm:mb-4">
              <div className="h-4 w-full animate-pulse bg-gray-200"></div>
            </div>

            {/* Filters Skeleton */}
            <div className="mb-3 sm:mb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Category Filter Skeleton */}
                <div className="flex min-w-0 flex-shrink gap-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-8 w-16 animate-pulse bg-gray-200"></div>
                  ))}
                </div>

                {/* Currency Toggle and Sort Filter Skeleton */}
                <div className="flex items-center gap-2">
                  <div className="h-8 w-24 animate-pulse bg-gray-200"></div>
                  <div className="h-8 w-28 animate-pulse bg-gray-200"></div>
                </div>
              </div>
            </div>

            {/* Products Grid Skeleton */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-gray-200"></div>
                  <div className="mt-2 h-4 bg-gray-200"></div>
                  <div className="mt-2 h-3 bg-gray-200"></div>
                </div>
              ))}
            </div>
          </>
        }
      >
        <CollectionProductsWrapper collectionHandle={collection.handle} />
      </Suspense>
    );
  });

  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <HomePageClient
        articles={articles}
        collections={collections}
        collectionProductsComponents={collectionProductsComponents}
      />
    </Suspense>
  );
}
