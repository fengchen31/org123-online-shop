// Test script to check product collections
require('dotenv').config();
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_STOREFRONT_ACCESS_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

const query = `
  query getProduct($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      collections(first: 10) {
        edges {
          node {
            handle
            title
          }
        }
      }
    }
  }
`;

async function checkProductCollections(handle) {
  const response = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_ACCESS_TOKEN
    },
    body: JSON.stringify({
      query,
      variables: { handle }
    })
  });

  const data = await response.json();

  if (data.errors) {
    console.error('GraphQL Errors:', JSON.stringify(data.errors, null, 2));
    return;
  }

  if (!data.data.product) {
    console.log(`❌ Product not found: ${handle}`);
    return;
  }

  const product = data.data.product;
  console.log('\n=== Product Information ===');
  console.log('ID:', product.id);
  console.log('Handle:', product.handle);
  console.log('Title:', product.title);
  console.log('\n=== Collections ===');

  if (product.collections.edges.length === 0) {
    console.log('❌ This product is not in any collections!');
  } else {
    console.log(`✅ This product is in ${product.collections.edges.length} collection(s):`);
    product.collections.edges.forEach((edge, index) => {
      console.log(`  ${index + 1}. ${edge.node.title} (handle: ${edge.node.handle})`);
    });
  }
}

// Check the product
checkProductCollections('nu-t100-yishu-pin-jersey-black');
