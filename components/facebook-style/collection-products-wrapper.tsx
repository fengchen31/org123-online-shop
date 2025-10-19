import { getCollectionProducts, getCollection } from 'lib/shopify';
import { CollectionProductsClient } from './collection-products-client';

interface CollectionProductsWrapperProps {
  collectionHandle: string;
}

export async function CollectionProductsWrapper({
  collectionHandle
}: CollectionProductsWrapperProps) {
  const [products, collection] = await Promise.all([
    getCollectionProducts({ collection: collectionHandle }),
    getCollection(collectionHandle)
  ]);

  return (
    <CollectionProductsClient
      initialProducts={products}
      collectionHandle={collectionHandle}
      collectionTitle={collection.title}
      collectionDescription={collection.description}
    />
  );
}
