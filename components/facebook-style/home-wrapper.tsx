'use client';

import { CollectionTabsHome } from './collection-tabs-home';
import { NewsContent } from './news-content';
import type { Collection } from 'lib/shopify/types';
import type { Page } from 'lib/shopify/types';
import { useState, useMemo } from 'react';
import { Suspense } from 'react';

interface HomeWrapperProps {
  collections: Collection[];
  newsPage: Page | null;
}

export function HomeWrapper({ collections, newsPage }: HomeWrapperProps) {
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
    />
  );
}
