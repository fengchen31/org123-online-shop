import { getCollectionProducts } from 'lib/shopify';
import Link from 'next/link';
import Image from 'next/image';

interface CollectionProductsGridProps {
  collectionHandle: string;
}

export async function CollectionProductsGrid({ collectionHandle }: CollectionProductsGridProps) {
  const products = await getCollectionProducts({ collection: collectionHandle });

  if (!products?.length) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg">No products found in this collection.</p>
          <p className="mt-2 text-sm">Please check back later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/product/${product.handle}`}
          className="group overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm transition-shadow hover:shadow-md"
        >
          {/* Product Image */}
          <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
            {product.featuredImage ? (
              <Image
                src={product.featuredImage.url}
                alt={product.title}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                <span>No Image</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="p-4">
            <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-[#3b5998]">
              {product.title}
            </h3>

            {product.description && (
              <p className="mt-1 line-clamp-2 text-xs text-gray-600">{product.description}</p>
            )}

            {/* Price */}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-base font-bold text-[#3b5998]">
                {product.priceRange.maxVariantPrice.currencyCode}{' '}
                {product.priceRange.maxVariantPrice.amount}
              </span>
              <span className="text-xs text-gray-500 group-hover:underline">View →</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
