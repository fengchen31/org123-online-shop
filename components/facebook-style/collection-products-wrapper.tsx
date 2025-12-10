import { getCollectionProducts, getCollection } from 'lib/shopify';
import { CollectionProductsClient } from './collection-products-client';
import { defaultSort } from 'lib/constants';

interface CollectionProductsWrapperProps {
  collectionHandle: string;
}

export async function CollectionProductsWrapper({
  collectionHandle
}: CollectionProductsWrapperProps) {
  const [productsData, collection] = await Promise.all([
    getCollectionProducts({
      collection: collectionHandle,
      sortKey: defaultSort.sortKey,
      reverse: defaultSort.reverse,
      first: 50
    }),
    getCollection(collectionHandle)
  ]);

  return (
    <CollectionProductsClient
      initialProducts={productsData.products}
      initialPageInfo={productsData.pageInfo}
      collectionHandle={collectionHandle}
      collectionTitle={collection?.title || ''}
      collectionDescription={collection?.description || ''}
    />
  );
}
