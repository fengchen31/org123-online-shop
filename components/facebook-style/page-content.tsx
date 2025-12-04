'use client';

import type { Page } from 'lib/shopify/types';

interface PageContentProps {
  page: Page;
}

export function PageContent({ page }: PageContentProps) {
  return (
    <div className="space-y-4">
      <div
        className="prose prose-sm max-w-none text-gray-700"
        dangerouslySetInnerHTML={{ __html: page.body }}
      />
    </div>
  );
}
