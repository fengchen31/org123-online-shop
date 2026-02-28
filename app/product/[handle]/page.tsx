import { Gallery } from 'components/product/gallery';
import { ProductDescription } from 'components/product/product-description';
import { ProductProvider } from 'components/product/product-context';
import { getProduct, getProductRecommendations } from 'lib/shopify';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type Props = {
  params: Promise<{ handle: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProduct(handle);

  if (!product) return {};

  const { url, width, height, altText: alt } = product.featuredImage || {};

  return {
    title: product.seo?.title || product.title,
    description: product.seo?.description || product.description,
    openGraph: url
      ? {
          images: [{ url, width, height, alt: alt || product.title }]
        }
      : null
  };
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params;
  const product = await getProduct(handle);

  if (!product) {
    notFound();
  }

  return (
    <ProductProvider>
      <div className="mx-auto max-w-screen-2xl px-4 py-4">
        <div className="flex flex-col gap-8 md:flex-row">
          <div className="w-full md:w-1/2">
            <Gallery
              images={product.images.map((image) => ({
                src: image.url,
                altText: image.altText
              }))}
            />
          </div>
          <div className="w-full md:w-1/2">
            <ProductDescription product={product} />
          </div>
        </div>
        <Suspense>
          <RelatedProducts id={product.id} />
        </Suspense>
      </div>
    </ProductProvider>
  );
}

async function RelatedProducts({ id }: { id: string }) {
  const relatedProducts = await getProductRecommendations(id);

  if (!relatedProducts.length) return null;

  return (
    <div className="py-8">
      <h2 className="mb-4 text-2xl font-bold">Related Products</h2>
      <ul className="flex w-full gap-4 overflow-x-auto pt-1">
        {relatedProducts.map((product) => (
          <li
            key={product.handle}
            className="w-full flex-none min-[475px]:w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5"
          >
            <Link href={`/product/${product.handle}`} className="block">
              <div className="relative aspect-square overflow-hidden border border-neutral-200">
                {product.featuredImage?.url && (
                  <Image
                    src={product.featuredImage.url}
                    alt={product.title}
                    width={400}
                    height={400}
                    className="h-full w-full object-contain"
                  />
                )}
              </div>
              <p className="mt-2 text-sm font-medium">{product.title}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
