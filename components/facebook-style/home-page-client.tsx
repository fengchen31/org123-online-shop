'use client';

import { CollectionTabsHome } from './collection-tabs-home';
import { PagesFeed } from './pages-feed';
import type { Page, Collection } from 'lib/shopify/types';
import { useState, useMemo } from 'react';

interface HomePageClientProps {
  pages: Page[];
  collections: Collection[];
  collectionProductsComponents: Record<string, React.ReactNode>;
  onOpenCart?: () => void;
  onOpenWishlist?: () => void;
  onOpenAccount?: () => void;
}

export function HomePageClient({
  pages,
  collections,
  collectionProductsComponents,
  onOpenCart,
  onOpenWishlist,
  onOpenAccount
}: HomePageClientProps) {
  const [currentTab, setCurrentTab] = useState<string>('news-feed');

  // 建立 tabs：第一個是 News Feed，後面接著所有 collections
  const tabs = useMemo(() => {
    const newsFeedTab = {
      handle: 'news-feed',
      title: 'News Feed',
      description: 'Latest updates and news',
      seo: {
        title: 'News Feed',
        description: 'Latest updates and news'
      },
      updatedAt: new Date().toISOString(),
      path: '/news-feed'
    };

    return [newsFeedTab, ...collections];
  }, [collections]);

  // 組合所有 tab 的內容：News Feed + collections
  const tabContents: Record<string, React.ReactNode> = useMemo(() => {
    const contents: Record<string, React.ReactNode> = {
      'news-feed': <PagesFeed pages={pages} />
    };

    // 加入所有 collection 的內容
    Object.keys(collectionProductsComponents).forEach((handle) => {
      contents[handle] = collectionProductsComponents[handle];
    });

    return contents;
  }, [pages, collectionProductsComponents]);

  return (
    <CollectionTabsHome
      collections={tabs}
      collectionContents={tabContents}
      onTabChange={setCurrentTab}
      onOpenCart={onOpenCart}
      onOpenWishlist={onOpenWishlist}
      onOpenAccount={onOpenAccount}
    />
  );
}
