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

// 更新大頭照 Mutation
export const updateCustomerAvatarMutation = /* GraphQL */ `
  mutation updateCustomerAvatar($customerAccessToken: String!, $avatar: String!) {
    customerUpdate(
      customerAccessToken: $customerAccessToken
      customer: {
        metafields: [
          {
            namespace: "custom"
            key: "avatar"
            value: $avatar
            type: "single_line_text_field"
          }
        ]
      }
    ) {
      customer {
        id
        metafield(namespace: "custom", key: "avatar") {
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

// 更新購物車 Mutation (Storefront API - 不支援寫入 metafields)
export const updateCustomerCartMutation = /* GraphQL */ `
  mutation updateCustomerCart($customerAccessToken: String!, $cart: String!) {
    customerUpdate(
      customerAccessToken: $customerAccessToken
      customer: {
        metafields: [
          {
            namespace: "custom"
            key: "cart"
            value: $cart
            type: "json"
          }
        ]
      }
    ) {
      customer {
        id
        metafield(namespace: "custom", key: "cart") {
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

// Admin API: 使用 customer ID 和 metafieldsSet mutation 更新購物車
export const adminUpdateCustomerCartMutation = /* GraphQL */ `
  mutation adminUpdateCustomerCart($customerId: ID!, $cart: String!) {
    metafieldsSet(metafields: [
      {
        ownerId: $customerId
        namespace: "custom"
        key: "cart"
        value: $cart
        type: "json"
      }
    ]) {
      metafields {
        id
        namespace
        key
        value
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Admin API: 更新願望清單
export const adminUpdateCustomerWishlistMutation = /* GraphQL */ `
  mutation adminUpdateCustomerWishlist($customerId: ID!, $wishlist: String!) {
    metafieldsSet(metafields: [
      {
        ownerId: $customerId
        namespace: "custom"
        key: "wishlist"
        value: $wishlist
        type: "json"
      }
    ]) {
      metafields {
        id
        namespace
        key
        value
      }
      userErrors {
        field
        message
      }
    }
  }
`;
