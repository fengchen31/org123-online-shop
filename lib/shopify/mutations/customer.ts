export const updateCustomerWishlistMutation = /* GraphQL */ `
  mutation updateCustomerWishlist($metafields: [MetafieldsSetInput!]!) {
    customerUpdate(input: { metafields: $metafields }) {
      customer {
        id
        metafield(namespace: "custom", key: "wishlist") {
          value
        }
      }
      customerUserErrors {
        field
        message
      }
    }
  }
`;
