// Shopify Admin API client for metafields operations
import { ensureStartsWith } from 'lib/utils';

const domain = process.env.SHOPIFY_STORE_DOMAIN
  ? ensureStartsWith(process.env.SHOPIFY_STORE_DOMAIN, 'https://')
  : '';

// Admin API endpoint (different from Storefront API)
const adminEndpoint = `${domain}/admin/api/2024-10/graphql.json`;
const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!;

interface ShopifyAdminResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

/**
 * Fetch data from Shopify Admin API
 */
export async function shopifyAdminFetch<T>({
  query,
  variables
}: {
  query: string;
  variables?: Record<string, unknown>;
}): Promise<ShopifyAdminResponse<T>> {
  try {
    const result = await fetch(adminEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': adminToken
      },
      body: JSON.stringify({
        query,
        ...(variables && { variables })
      }),
      cache: 'no-store' // Admin API calls should not be cached
    });

    const body = await result.json();

    if (body.errors) {
      console.error('Shopify Admin API errors:', body.errors);
      throw new Error(body.errors[0]?.message || 'Shopify Admin API error');
    }

    return body;
  } catch (error) {
    console.error('Error calling Shopify Admin API:', error);
    throw error;
  }
}

/**
 * Set metafields on a resource (Page, Product, etc.)
 */
export async function setMetafields(
  ownerId: string,
  metafields: Array<{
    namespace: string;
    key: string;
    value: string;
    type: string;
  }>
) {
  const mutation = `
    mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          namespace
          key
          value
          type
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    metafields: metafields.map((field) => ({
      ownerId,
      namespace: field.namespace,
      key: field.key,
      value: field.value,
      type: field.type
    }))
  };

  const response = await shopifyAdminFetch<{
    metafieldsSet: {
      metafields: Array<{
        id: string;
        namespace: string;
        key: string;
        value: string;
        type: string;
      }>;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  }>({
    query: mutation,
    variables
  });

  if (response.data?.metafieldsSet.userErrors?.length) {
    throw new Error(
      `Metafields set error: ${response.data.metafieldsSet.userErrors
        .map((e) => e.message)
        .join(', ')}`
    );
  }

  return response.data?.metafieldsSet.metafields;
}

/**
 * Get metafields from a resource
 */
export async function getMetafields(
  ownerId: string,
  namespace: string
): Promise<Array<{ key: string; value: string }>> {
  const query = `
    query getMetafields($ownerId: ID!, $namespace: String!) {
      node(id: $ownerId) {
        ... on Page {
          metafields(namespace: $namespace, first: 10) {
            edges {
              node {
                key
                value
              }
            }
          }
        }
      }
    }
  `;

  const response = await shopifyAdminFetch<{
    node: {
      metafields: {
        edges: Array<{
          node: {
            key: string;
            value: string;
          };
        }>;
      };
    };
  }>({
    query,
    variables: { ownerId, namespace }
  });

  return (
    response.data?.node?.metafields?.edges.map((edge) => edge.node) || []
  );
}
