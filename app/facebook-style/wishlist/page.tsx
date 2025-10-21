import { FacebookFooter } from 'components/facebook-style/facebook-footer';
import { FacebookHeader } from 'components/facebook-style/facebook-header';
import { getCustomerWishlist } from 'lib/shopify';
import { Product } from 'lib/shopify/types';
import { cookies } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

async function getWishlistProducts(): Promise<Product[]> {
  const accessToken = (await cookies()).get('customerAccessToken')?.value;

  if (!accessToken) {
    return [];
  }

  try {
    const wishlistIds = await getCustomerWishlist(accessToken);

    if (wishlistIds.length === 0) {
      return [];
    }

    // Note: This would require implementing a getProductsByIds function in Shopify
    // For now, returning empty array
    return [];
  } catch (error) {
    console.error('Error fetching wishlist products:', error);
    return [];
  }
}

export default async function FacebookWishlistPage() {
  const accessToken = (await cookies()).get('customerAccessToken')?.value;

  if (!accessToken) {
    redirect('/login?redirect=/facebook-style/wishlist');
  }

  const products = await getWishlistProducts();

  return (
    <div className="flex min-h-screen flex-col bg-[#f0f2f5]">
      <FacebookHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
            <p className="text-sm text-gray-600">
              {products.length} {products.length === 1 ? 'item' : 'items'}
            </p>
          </div>

          {products.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg bg-white p-12 shadow-sm">
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-12 w-12 text-gray-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  />
                </svg>
              </div>
              <h2 className="mb-2 text-xl font-semibold text-gray-900">Your wishlist is empty</h2>
              <p className="mb-6 text-center text-gray-600">
                Start adding products you love by clicking the + button on any product!
              </p>
              <Link
                href="/"
                className="rounded-lg bg-[#3b5998] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#344e86]"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <Link
                  key={product.handle}
                  href={`/product/${product.handle}`}
                  className="group overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="relative aspect-square w-full bg-gray-100">
                    {product.featuredImage && (
                      <Image
                        src={product.featuredImage.url}
                        alt={product.title}
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="line-clamp-1 text-xs font-bold uppercase text-gray-900">
                        {product.title}
                      </h3>
                      <p className="whitespace-nowrap text-xs font-bold text-gray-900">
                        {product.priceRange.maxVariantPrice.currencyCode}
                        {Math.floor(
                          parseFloat(product.priceRange.maxVariantPrice.amount)
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <FacebookFooter />
    </div>
  );
}
