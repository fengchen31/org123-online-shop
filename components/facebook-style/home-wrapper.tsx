'use client';

import type { Collection, Page } from 'lib/shopify/types';
import { useMemo, useState } from 'react';
import { CollectionTabsHome } from './collection-tabs-home';
import { NewsContent } from './news-content';

interface HomeWrapperProps {
  collections: Collection[];
  newsPage: Page | null;
  onOpenCart?: () => void;
  onOpenWishlist?: () => void;
  onOpenAccount?: () => void;
}

export function HomeWrapper({ collections, newsPage, onOpenCart, onOpenWishlist, onOpenAccount }: HomeWrapperProps) {
  // 建立一個假的 "News" collection 物件
  const newsCollection = useMemo(
    () => ({
      handle: 'news',
      title: 'News',
      description: '',
      seo: { title: 'News', description: '' },
      updatedAt: new Date().toISOString(),
      path: '/news'
    }),
    []
  );

  // 將 News 放在第一個位置
  const allTabs = useMemo(
    () => (newsPage ? [newsCollection, ...collections] : collections),
    [newsPage, newsCollection, collections]
  );

  const [currentTab, setCurrentTab] = useState<string>(
    allTabs.length > 0 ? allTabs[0]!.handle : ''
  );

  // 為每個 tab 準備內容
  const tabContents: Record<string, React.ReactNode> = useMemo(() => {
    const contents: Record<string, React.ReactNode> = {};

    // News tab 內容
    if (newsPage) {
      contents['news'] = <NewsContent page={newsPage} onTabChange={setCurrentTab} />;
    }

    // Collection tabs 內容 (這些會在 server 端渲染)
    // 我們只提供佔位符,實際內容由 server component 提供
    collections.forEach((collection) => {
      contents[collection.handle] = (
        <div key={collection.handle}>Loading {collection.title}...</div>
      );
    });

    return contents;
  }, [newsPage, collections]);

  return (
    <CollectionTabsHome
      collections={allTabs}
      collectionContents={tabContents}
      onTabChange={setCurrentTab}
      onOpenCart={onOpenCart}
      onOpenWishlist={onOpenWishlist}
      onOpenAccount={onOpenAccount}
    />
  );
}
