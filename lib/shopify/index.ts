import {
  HIDDEN_PRODUCT_TAG,
  SHOPIFY_GRAPHQL_API_ENDPOINT,
  TAGS
} from 'lib/constants';
import { isShopifyError } from 'lib/type-guards';
import { ensureStartsWith } from 'lib/utils';
import {
  revalidateTag,
  cacheTag,
  cacheLife
} from 'next/cache';
import { cookies, headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
  addToCartMutation,
  createCartMutation,
  editCartItemsMutation,
  removeFromCartMutation
} from './mutations/cart';
import {
  customerAccessTokenCreateMutation,
  customerCreateMutation,
  customerRecoverMutation,
  updateCustomerWishlistMutation
} from './mutations/customer';
import { getCartQuery } from './queries/cart';
import {
  getCustomerQuery,
  getCustomerOrdersQuery,
  getCustomerWishlistQuery
} from './queries/customer';
import {
  getCollectionProductsQuery,
  getCollectionQuery,
  getCollectionsQuery
} from './queries/collection';
import { getMenuQuery } from './queries/menu';
import { getPageQuery, getPagesQuery } from './queries/page';
import { getShopMetafieldsQuery, getMetaobjectQuery, getMusicEmbedQuery } from './queries/shop';
import {
  getProductQuery,
  getProductByIdQuery,
  getProductRecommendationsQuery,
  getProductsQuery,
  getProductVariantByIdQuery
} from './queries/product';
import {
  Cart,
  Collection,
  Connection,
  Customer,
  Image,
  Menu,
  Order,
  Page,
  Product,
  ShopifyAddToCartOperation,
  ShopifyCart,
  ShopifyCartOperation,
  ShopifyCollection,
  ShopifyCollectionOperation,
  ShopifyCollectionProductsOperation,
  ShopifyCollectionsOperation,
  ShopifyCreateCartOperation,
  ShopifyCustomerOperation,
  ShopifyCustomerOrdersOperation,
  ShopifyCustomerWishlistOperation,
  ShopifyMenuOperation,
  ShopifyPageOperation,
  ShopifyPagesOperation,
  ShopifyProduct,
  ShopifyProductOperation,
  ShopifyProductRecommendationsOperation,
  ShopifyProductsOperation,
  ShopifyProductVariantOperation,
  ShopifyRemoveFromCartOperation,
  ShopifyUpdateCartOperation,
  ShopifyUpdateCustomerWishlistOperation,
  WishlistVariant,
  ShopMetafieldOperation,
  DiscountBanner,
  ShopifyMetaobjectOperation,
  Metaobject
} from './types';

const domain = process.env.SHOPIFY_STORE_DOMAIN
  ? ensureStartsWith(process.env.SHOPIFY_STORE_DOMAIN, 'https://')
  : '';
const endpoint = `${domain}${SHOPIFY_GRAPHQL_API_ENDPOINT}`;
const key = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!;

type ExtractVariables<T> = T extends { variables: object }
  ? T['variables']
  : never;

export async function shopifyFetch<T>({
  headers,
  query,
  variables
}: {
  headers?: HeadersInit;
  query: string;
  variables?: ExtractVariables<T>;
}): Promise<{ status: number; body: T } | never> {
  try {
    const result = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': key,
        ...headers
      },
      body: JSON.stringify({
        ...(query && { query }),
        ...(variables && { variables })
      })
    });

    const body = await result.json();

    if (body.errors) {
      throw body.errors[0];
    }

    return {
      status: result.status,
      body
    };
  } catch (e) {
    if (isShopifyError(e)) {
      throw {
        cause: e.cause?.toString() || 'unknown',
        status: e.status || 500,
        message: e.message,
        query
      };
    }

    throw {
      error: e,
      query
    };
  }
}

const removeEdgesAndNodes = <T>(array: Connection<T>): T[] => {
  return array.edges.map((edge) => edge?.node);
};

const reshapeCart = (cart: ShopifyCart): Cart => {
  if (!cart.cost?.totalTaxAmount) {
    cart.cost.totalTaxAmount = {
      amount: '0.0',
      currencyCode: cart.cost.totalAmount.currencyCode
    };
  }

  return {
    ...cart,
    lines: removeEdgesAndNodes(cart.lines)
  };
};

const reshapeCollection = (
  collection: ShopifyCollection
): Collection | undefined => {
  if (!collection) {
    return undefined;
  }

  return {
    ...collection,
    path: `/search/${collection.handle}`
  };
};

const reshapeCollections = (collections: ShopifyCollection[]) => {
  const reshapedCollections = [];

  for (const collection of collections) {
    if (collection) {
      const reshapedCollection = reshapeCollection(collection);

      if (reshapedCollection) {
        reshapedCollections.push(reshapedCollection);
      }
    }
  }

  return reshapedCollections;
};

const reshapeImages = (images: Connection<Image>, productTitle: string) => {
  const flattened = removeEdgesAndNodes(images);

  return flattened.map((image) => {
    const filename = image.url.match(/.*\/(.*)\..*/)?.[1];
    return {
      ...image,
      altText: image.altText || `${productTitle} - ${filename}`
    };
  });
};

const reshapeProduct = (
  product: ShopifyProduct,
  filterHiddenProducts: boolean = true
) => {
  if (
    !product ||
    (filterHiddenProducts && product.tags.includes(HIDDEN_PRODUCT_TAG))
  ) {
    return undefined;
  }

  const { images, variants, ...rest } = product;

  return {
    ...rest,
    images: reshapeImages(images, product.title),
    variants: removeEdgesAndNodes(variants)
  };
};

const reshapeProducts = (products: ShopifyProduct[]) => {
  const reshapedProducts = [];

  for (const product of products) {
    if (product) {
      const reshapedProduct = reshapeProduct(product);

      if (reshapedProduct) {
        reshapedProducts.push(reshapedProduct);
      }
    }
  }

  return reshapedProducts;
};

export async function createCart(): Promise<Cart> {
  const res = await shopifyFetch<ShopifyCreateCartOperation>({
    query: createCartMutation
  });

  return reshapeCart(res.body.data.cartCreate.cart);
}

export async function addToCart(
  lines: { merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const cartId = (await cookies()).get('cartId')?.value!;
  const res = await shopifyFetch<ShopifyAddToCartOperation>({
    query: addToCartMutation,
    variables: {
      cartId,
      lines
    }
  });
  return reshapeCart(res.body.data.cartLinesAdd.cart);
}

export async function removeFromCart(lineIds: string[]): Promise<Cart> {
  const cartId = (await cookies()).get('cartId')?.value!;
  const res = await shopifyFetch<ShopifyRemoveFromCartOperation>({
    query: removeFromCartMutation,
    variables: {
      cartId,
      lineIds
    }
  });

  return reshapeCart(res.body.data.cartLinesRemove.cart);
}

export async function updateCart(
  lines: { id: string; merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const cartId = (await cookies()).get('cartId')?.value!;
  const res = await shopifyFetch<ShopifyUpdateCartOperation>({
    query: editCartItemsMutation,
    variables: {
      cartId,
      lines
    }
  });

  return reshapeCart(res.body.data.cartLinesUpdate.cart);
}

export async function getCart(): Promise<Cart | undefined> {
  const cartId = (await cookies()).get('cartId')?.value;

  if (!cartId) {
    return undefined;
  }

  const res = await shopifyFetch<ShopifyCartOperation>({
    query: getCartQuery,
    variables: { cartId }
  });

  // Old carts becomes `null` when you checkout.
  if (!res.body.data.cart) {
    return undefined;
  }

  return reshapeCart(res.body.data.cart);
}

export async function getCollection(
  handle: string
): Promise<Collection | undefined> {
  'use cache';
  cacheTag(TAGS.collections);
  cacheLife('days');

  const res = await shopifyFetch<ShopifyCollectionOperation>({
    query: getCollectionQuery,
    variables: {
      handle
    }
  });

  return reshapeCollection(res.body.data.collection);
}

export async function getCollectionProducts({
  collection,
  reverse,
  sortKey
}: {
  collection: string;
  reverse?: boolean;
  sortKey?: string;
}): Promise<Product[]> {
  'use cache';
  cacheTag(TAGS.collections, TAGS.products);
  cacheLife('days');

  const res = await shopifyFetch<ShopifyCollectionProductsOperation>({
    query: getCollectionProductsQuery,
    variables: {
      handle: collection,
      reverse,
      sortKey: sortKey === 'CREATED_AT' ? 'CREATED' : sortKey
    }
  });

  if (!res.body.data.collection) {
    console.log(`No collection found for \`${collection}\``);
    return [];
  }

  return reshapeProducts(
    removeEdgesAndNodes(res.body.data.collection.products)
  );
}

export async function getCollections(): Promise<Collection[]> {
  // 'use cache';
  // cacheTag(TAGS.collections);
  // cacheLife('days');

  const res = await shopifyFetch<ShopifyCollectionsOperation>({
    query: getCollectionsQuery
  });
  const shopifyCollections = removeEdgesAndNodes(res.body?.data?.collections);
  let collections = [
    {
      handle: '',
      title: 'All',
      description: 'All products',
      seo: {
        title: 'All',
        description: 'All products'
      },
      path: '/search',
      updatedAt: new Date().toISOString()
    },
    // Filter out the `hidden` collections.
    // Collections that start with `hidden-*` need to be hidden on the search page.
    ...reshapeCollections(shopifyCollections).filter(
      (collection) => !collection.handle.startsWith('hidden')
    )
  ];

  // 調整 collection 順序：將 "foot" 移到 "lttt" 之後
  console.log('=== getCollections - BEFORE reorder ===');
  console.log('Handles:', collections.map(c => c.handle));

  const footIndex = collections.findIndex((c) => c.handle.toLowerCase() === 'foot');
  const ltttIndex = collections.findIndex((c) => c.handle.toLowerCase() === 'lttt');
  console.log('footIndex:', footIndex, 'ltttIndex:', ltttIndex);

  if (footIndex !== -1 && ltttIndex !== -1) {
    const footCollection = collections.splice(footIndex, 1)[0];
    const newLtttIndex = collections.findIndex((c) => c.handle.toLowerCase() === 'lttt');
    collections.splice(newLtttIndex + 1, 0, footCollection!);
    console.log('=== getCollections - AFTER reorder ===');
    console.log('Handles:', collections.map(c => c.handle));
  }

  return collections;
}

export async function getMenu(handle: string): Promise<Menu[]> {
  'use cache';
  cacheTag(TAGS.collections);
  cacheLife('days');

  const res = await shopifyFetch<ShopifyMenuOperation>({
    query: getMenuQuery,
    variables: {
      handle
    }
  });

  return (
    res.body?.data?.menu?.items.map((item: { title: string; url: string }) => ({
      title: item.title,
      path: item.url
        .replace(domain, '')
        .replace('/collections', '/search')
        .replace('/pages', '')
    })) || []
  );
}

export async function getPage(handle: string): Promise<Page> {
  const res = await shopifyFetch<ShopifyPageOperation>({
    query: getPageQuery,
    variables: { handle }
  });

  return res.body.data.pageByHandle;
}

export async function getPages(): Promise<Page[]> {
  const res = await shopifyFetch<ShopifyPagesOperation>({
    query: getPagesQuery
  });

  return removeEdgesAndNodes(res.body.data.pages);
}

export async function getProduct(handle: string): Promise<Product | undefined> {
  'use cache';
  cacheTag(TAGS.products);
  cacheLife('days');

  const res = await shopifyFetch<ShopifyProductOperation>({
    query: getProductQuery,
    variables: {
      handle
    }
  });

  return reshapeProduct(res.body.data.product, false);
}

export async function getProductById(id: string): Promise<Product | null> {
  'use cache';
  cacheTag(TAGS.products);
  cacheLife('days');

  try {
    const res = await shopifyFetch<{
      data: { node: ShopifyProduct | null };
      variables: { id: string };
    }>({
      query: getProductByIdQuery,
      variables: { id }
    });

    if (!res.body.data.node) {
      return null;
    }

    return reshapeProduct(res.body.data.node, false) ?? null;
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    return null;
  }
}

export async function getProductVariantById(id: string): Promise<WishlistVariant | null> {
  'use cache';
  cacheTag(TAGS.products);
  cacheLife('days');

  try {
    const res = await shopifyFetch<ShopifyProductVariantOperation>({
      query: getProductVariantByIdQuery,
      variables: { id }
    });

    if (!res.body.data.node) {
      return null;
    }

    return res.body.data.node;
  } catch (error) {
    console.error('Error fetching variant by ID:', error);
    return null;
  }
}

export async function getProductRecommendations(
  productId: string
): Promise<Product[]> {
  'use cache';
  cacheTag(TAGS.products);
  cacheLife('days');

  const res = await shopifyFetch<ShopifyProductRecommendationsOperation>({
    query: getProductRecommendationsQuery,
    variables: {
      productId
    }
  });

  return reshapeProducts(res.body.data.productRecommendations);
}

export async function getProducts({
  query,
  reverse,
  sortKey
}: {
  query?: string;
  reverse?: boolean;
  sortKey?: string;
}): Promise<Product[]> {
  'use cache';
  cacheTag(TAGS.products);
  cacheLife('days');

  const res = await shopifyFetch<ShopifyProductsOperation>({
    query: getProductsQuery,
    variables: {
      query,
      reverse,
      sortKey
    }
  });

  return reshapeProducts(removeEdgesAndNodes(res.body.data.products));
}

// This is called from `app/api/revalidate.ts` so providers can control revalidation logic.
export async function revalidate(req: NextRequest): Promise<NextResponse> {
  // We always need to respond with a 200 status code to Shopify,
  // otherwise it will continue to retry the request.
  const collectionWebhooks = [
    'collections/create',
    'collections/delete',
    'collections/update'
  ];
  const productWebhooks = [
    'products/create',
    'products/delete',
    'products/update'
  ];
  const topic = (await headers()).get('x-shopify-topic') || 'unknown';
  const secret = req.nextUrl.searchParams.get('secret');
  const isCollectionUpdate = collectionWebhooks.includes(topic);
  const isProductUpdate = productWebhooks.includes(topic);

  if (!secret || secret !== process.env.SHOPIFY_REVALIDATION_SECRET) {
    console.error('Invalid revalidation secret.');
    return NextResponse.json({ status: 401 });
  }

  if (!isCollectionUpdate && !isProductUpdate) {
    // We don't need to revalidate anything for any other topics.
    return NextResponse.json({ status: 200 });
  }

  if (isCollectionUpdate) {
    revalidateTag(TAGS.collections, 'max');
  }

  if (isProductUpdate) {
    revalidateTag(TAGS.products, 'max');
  }

  return NextResponse.json({ status: 200, revalidated: true, now: Date.now() });
}

// Customer queries using Storefront API with access token
export async function shopifyCustomerFetch<T>({
  accessToken,
  query,
  variables
}: {
  accessToken: string;
  query: string;
  variables?: ExtractVariables<T>;
}): Promise<{ status: number; body: T } | never> {
  // Merge customerAccessToken into variables
  const mergedVariables = {
    ...variables,
    customerAccessToken: accessToken
  };

  // Use the standard Storefront API endpoint
  return shopifyFetch<T>({
    query,
    variables: mergedVariables as ExtractVariables<T>
  });
}

export async function getCustomer(accessToken: string): Promise<Customer | null> {
  try {
    const res = await shopifyCustomerFetch<ShopifyCustomerOperation>({
      accessToken,
      query: getCustomerQuery
    });

    const customer = res.body.data.customer;

    // Extract avatar from metafield if exists
    if (customer && (customer as any).metafield?.value) {
      customer.avatar = (customer as any).metafield.value;
    }

    return customer;
  } catch (e) {
    console.error('Error fetching customer:', e);
    return null;
  }
}

export async function getCustomerOrders(
  accessToken: string,
  first: number = 10
): Promise<Order[]> {
  try {
    const res = await shopifyCustomerFetch<ShopifyCustomerOrdersOperation>({
      accessToken,
      query: getCustomerOrdersQuery,
      variables: { first }
    });

    return removeEdgesAndNodes(res.body.data.customer.orders);
  } catch (e) {
    console.error('Error fetching customer orders:', e);
    return [];
  }
}

export async function getCustomerWishlist(accessToken: string): Promise<string[]> {
  try {
    const res = await shopifyCustomerFetch<ShopifyCustomerWishlistOperation>({
      accessToken,
      query: getCustomerWishlistQuery
    });

    const wishlistData = res.body.data.customer.metafield;
    if (!wishlistData || !wishlistData.value) {
      return [];
    }

    return JSON.parse(wishlistData.value);
  } catch (e) {
    console.error('Error fetching customer wishlist:', e);
    return [];
  }
}

export async function updateCustomerWishlist(
  accessToken: string,
  productIds: string[]
): Promise<boolean> {
  try {
    const res = await shopifyCustomerFetch<ShopifyUpdateCustomerWishlistOperation>({
      accessToken,
      query: updateCustomerWishlistMutation,
      variables: {
        metafields: [
          {
            namespace: 'custom',
            key: 'wishlist',
            value: JSON.stringify(productIds),
            type: 'json'
          }
        ]
      }
    });

    return res.body.data.customerUpdate.customerUserErrors.length === 0;
  } catch (e) {
    console.error('Error updating customer wishlist:', e);
    return false;
  }
}

// 客戶登錄函數
export async function customerLogin(
  email: string,
  password: string
): Promise<{ accessToken: string; expiresAt: string } | { error: string }> {
  try {
    const res = await shopifyFetch<{
      data: {
        customerAccessTokenCreate: {
          customerAccessToken?: {
            accessToken: string;
            expiresAt: string;
          };
          customerUserErrors: Array<{
            code?: string;
            field?: string[];
            message: string;
          }>;
        };
      };
      variables: {
        input: {
          email: string;
          password: string;
        };
      };
    }>({
      query: customerAccessTokenCreateMutation,
      variables: {
        input: {
          email,
          password
        }
      }
    });

    if (res.body.data.customerAccessTokenCreate.customerUserErrors.length > 0) {
      const error = res.body.data.customerAccessTokenCreate.customerUserErrors[0];
      return { error: error?.message || '登錄失敗' };
    }

    const customerAccessToken = res.body.data.customerAccessTokenCreate.customerAccessToken;

    if (!customerAccessToken) {
      return { error: '登錄失敗' };
    }

    return {
      accessToken: customerAccessToken.accessToken,
      expiresAt: customerAccessToken.expiresAt
    };
  } catch (e) {
    console.error('Error logging in customer:', e);
    return { error: '登錄時發生錯誤' };
  }
}

// 客戶註冊函數
export async function customerRegister(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<{ success: boolean; customer?: any; error?: string }> {
  try {
    const res = await shopifyFetch<{
      data: {
        customerCreate: {
          customer?: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
          };
          customerUserErrors: Array<{
            code?: string;
            field?: string[];
            message: string;
          }>;
        };
      };
      variables: {
        input: {
          email: string;
          password: string;
          firstName: string;
          lastName: string;
        };
      };
    }>({
      query: customerCreateMutation,
      variables: {
        input: {
          email: input.email,
          password: input.password,
          firstName: input.firstName,
          lastName: input.lastName
        }
      }
    });

    if (res.body.data.customerCreate.customerUserErrors.length > 0) {
      const error = res.body.data.customerCreate.customerUserErrors[0];
      return {
        success: false,
        error: error?.message || '註冊失敗'
      };
    }

    return {
      success: true,
      customer: res.body.data.customerCreate.customer
    };
  } catch (e) {
    console.error('Error registering customer:', e);
    return {
      success: false,
      error: '註冊時發生錯誤'
    };
  }
}

// 客戶密碼重設請求函數
export async function customerRecover(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await shopifyFetch<{
      data: {
        customerRecover: {
          customerUserErrors: Array<{
            code?: string;
            field?: string[];
            message: string;
          }>;
        };
      };
      variables: {
        email: string;
      };
    }>({
      query: customerRecoverMutation,
      variables: {
        email
      }
    });

    if (res.body.data.customerRecover.customerUserErrors.length > 0) {
      const error = res.body.data.customerRecover.customerUserErrors[0];
      return {
        success: false,
        error: error?.message || '密碼重設請求失敗'
      };
    }

    return { success: true };
  } catch (e) {
    console.error('Error recovering customer password:', e);
    return {
      success: false,
      error: '密碼重設時發生錯誤'
    };
  }
}

// 獲取折扣橫幅信息 (從 Shopify Metaobject)
export async function getDiscountBanner(): Promise<DiscountBanner | null> {
  'use cache';
  cacheTag('discount-banner');
  cacheLife('minutes');

  try {
    // Get the metaobject handle from environment variable
    const metaobjectHandle = process.env.DISCOUNT_BANNER_HANDLE || '15-off-for-new-user';

    const res = await shopifyFetch<ShopifyMetaobjectOperation>({
      query: getMetaobjectQuery,
      variables: {
        handle: metaobjectHandle
      }
    });

    const metaobject = res.body.data.metaobject;

    if (!metaobject) {
      console.log('No metaobject found for discount banner');
      return null;
    }

    // Parse fields from metaobject
    const fields = metaobject.fields.reduce((acc, field) => {
      acc[field.key] = field.value;
      return acc;
    }, {} as Record<string, string>);

    const enabled = fields.enabled === 'true';
    const message = fields.message || '';
    const code = fields.code || '';

    if (!enabled || !message) {
      return null;
    }

    return {
      message,
      code: code || undefined,
      enabled
    };
  } catch (e) {
    console.error('Error fetching discount banner from metaobject:', e);
    return null;
  }
}

// 獲取音樂嵌入 URL (從 Shopify Shop Metafield)
export async function getMusicEmbedUrl(): Promise<string | null> {
  try {
    const res = await shopifyFetch<ShopifyMusicEmbedOperation>({
      query: getMusicEmbedQuery
    });

    const metafield = res.body.data.shop.metafield;

    if (!metafield || !metafield.value) {
      console.log('No music embed URL found in shop metafield');
      return null;
    }

    return metafield.value;
  } catch (e) {
    console.error('Error fetching music embed URL from shop metafield:', e);
    return null;
  }
}
