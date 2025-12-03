export const getShopMetafieldQuery = /* GraphQL */ `
  query getShopMetafield($namespace: String!, $key: String!) {
    shop {
      metafield(namespace: $namespace, key: $key) {
        value
        type
      }
    }
  }
`;

export const getShopMetafieldsQuery = /* GraphQL */ `
  query getShopMetafields {
    shop {
      name
      metafield(namespace: "custom", key: "discount_banner") {
        value
        type
      }
    }
  }
`;

export const getMetaobjectQuery = /* GraphQL */ `
  query getMetaobject($handle: String!) {
    metaobject(handle: { handle: $handle, type: "discount_banner" }) {
      id
      handle
      type
      fields {
        key
        value
      }
    }
  }
`;
