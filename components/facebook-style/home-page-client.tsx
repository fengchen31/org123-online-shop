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

  // 建立 tabs：第一個是 News Feed，後面接著所有 collections（按指定順序）
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

    // 定義 collection 的排序順序（根據 handle）
    const collectionOrder = [
      'view-all',
      'all',
      'sale',
      'nul1-org',
      'nul1org',
      'lttt',
      'sabukaru',
      'kenford',
      'throwback2000',
      'throwback-2000',
      '4dimension'
    ];

    // 排序 collections
    const sortedCollections = [...collections].sort((a, b) => {
      const indexA = collectionOrder.indexOf(a.handle.toLowerCase());
      const indexB = collectionOrder.indexOf(b.handle.toLowerCase());

      // 如果都在排序列表中，按列表順序
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }

      // 如果只有 a 在列表中，a 排前面
      if (indexA !== -1) return -1;

      // 如果只有 b 在列表中，b 排前面
      if (indexB !== -1) return 1;

      // 都不在列表中，保持原順序
      return 0;
    });

    return [newsFeedTab, ...sortedCollections];
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
