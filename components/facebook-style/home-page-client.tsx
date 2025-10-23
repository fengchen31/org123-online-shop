'use client';

import { CollectionTabsHome } from './collection-tabs-home';
import { NewsContent } from './news-content';
import type { Collection, Page } from 'lib/shopify/types';
import { useState, useMemo } from 'react';

interface HomePageClientProps {
  allTabs: Collection[];
  newsPage: Page | null;
  collectionProductsComponents: Record<string, React.ReactNode>;
  onOpenCart?: () => void;
  onOpenWishlist?: () => void;
  onOpenAccount?: () => void;
}

export function HomePageClient({
  allTabs,
  newsPage,
  collectionProductsComponents,
  onOpenCart,
  onOpenWishlist,
  onOpenAccount
}: HomePageClientProps) {
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

    // Collection tabs 內容來自 server components
    Object.keys(collectionProductsComponents).forEach((handle) => {
      contents[handle] = collectionProductsComponents[handle];
    });

    return contents;
  }, [newsPage, collectionProductsComponents]);

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
