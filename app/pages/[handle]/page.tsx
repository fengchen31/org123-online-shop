import { getPage } from 'lib/shopify';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ handle: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const page = await getPage(handle);

  if (!page) return {};

  return {
    title: page.seo?.title || page.title,
    description: page.seo?.description || page.bodySummary,
    openGraph: {
      title: page.seo?.title || page.title,
      description: page.seo?.description || page.bodySummary,
      type: 'website'
    }
  };
}

export default async function Page({ params }: Props) {
  const { handle } = await params;
  const page = await getPage(handle);

  if (!page) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <article className="rounded-lg bg-white p-6 shadow-sm sm:p-8">
        <h1 className="mb-6 text-3xl font-bold text-gray-900 sm:text-4xl">{page.title}</h1>
        <div
          className="prose prose-sm max-w-none sm:prose-base"
          dangerouslySetInnerHTML={{ __html: page.body }}
        />
      </article>
    </div>
  );
}
