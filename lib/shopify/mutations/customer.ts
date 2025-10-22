// 客戶登錄 Mutation
export const customerAccessTokenCreateMutation = /* GraphQL */ `
  mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
    customerAccessTokenCreate(input: $input) {
      customerAccessToken {
        accessToken
        expiresAt
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

// 客戶註冊 Mutation
export const customerCreateMutation = /* GraphQL */ `
  mutation customerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer {
        id
        email
        firstName
        lastName
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

// 客戶密碼重設請求 Mutation
export const customerRecoverMutation = /* GraphQL */ `
  mutation customerRecover($email: String!) {
    customerRecover(email: $email) {
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

// 更新願望清單 Mutation
// Note: This mutation requires Admin API or Customer Account API access
// Storefront API does not support updating customer metafields
export const updateCustomerWishlistMutation = /* GraphQL */ `
  mutation updateCustomerWishlist($customerAccessToken: String!, $metafields: [MetafieldsSetInput!]!) {
    customerUpdate(customerAccessToken: $customerAccessToken, input: { metafields: $metafields }) {
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
