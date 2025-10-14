import { getCollections } from 'lib/shopify';
import Link from 'next/link';
import Image from 'next/image';

export async function CollectionsGrid() {
  const collections = await getCollections();

  // Filter out the "All" collection since it's just a placeholder
  const filteredCollections = collections.filter((c) => c.handle !== '');

  if (!filteredCollections.length) {
    return (
      <div className="text-center text-gray-600">
        <p>No collections available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filteredCollections.map((collection) => (
        <Link
          key={collection.handle}
          href={collection.path}
          className="group overflow-hidden rounded border border-gray-300 bg-white shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="aspect-video w-full bg-gradient-to-br from-[#3b5998] to-[#6d84b4]">
            <div className="flex h-full items-center justify-center">
              <span className="text-4xl font-bold text-white opacity-50">
                {collection.title.charAt(0)}
              </span>
            </div>
          </div>

          <div className="p-4">
            <h3 className="text-lg font-semibold text-[#3b5998] group-hover:underline">
              {collection.title}
            </h3>
            {collection.description && (
              <p className="mt-2 line-clamp-2 text-sm text-gray-600">{collection.description}</p>
            )}
            <div className="mt-3 text-xs text-gray-500">
              View Collection →
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
