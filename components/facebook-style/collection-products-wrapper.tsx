import { getCollectionProducts } from 'lib/shopify';
import { CollectionProductsGrid } from './collection-products-grid';

interface CollectionProductsWrapperProps {
  collectionHandle: string;
}

export async function CollectionProductsWrapper({ collectionHandle }: CollectionProductsWrapperProps) {
  const products = await getCollectionProducts({ collection: collectionHandle });

  return <CollectionProductsGrid products={products} />;
}
