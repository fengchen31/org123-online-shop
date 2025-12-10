export const getCustomerQuery = /* GraphQL */ `
  query getCustomer($customerAccessToken: String!) {
    customer(customerAccessToken: $customerAccessToken) {
      id
      firstName
      lastName
      email
      phone
      defaultAddress {
        id
        address1
        address2
        city
        province
        country
        zip
      }
      metafield(namespace: "custom", key: "avatar") {
        value
      }
    }
  }
`;

export const getCustomerOrdersQuery = /* GraphQL */ `
  query getCustomerOrders($customerAccessToken: String!, $first: Int = 10) {
    customer(customerAccessToken: $customerAccessToken) {
      orders(first: $first) {
        edges {
          node {
            id
            orderNumber
            processedAt
            financialStatus
            fulfillmentStatus
            totalPrice {
              amount
              currencyCode
            }
            lineItems(first: 10) {
              edges {
                node {
                  title
                  quantity
                  variant {
                    id
                    image {
                      url
                      altText
                      width
                      height
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const getCustomerWishlistQuery = /* GraphQL */ `
  query getCustomerWishlist($customerAccessToken: String!) {
    customer(customerAccessToken: $customerAccessToken) {
      metafield(namespace: "custom", key: "wishlist") {
        value
      }
    }
  }
`;

export const getCustomerCartQuery = /* GraphQL */ `
  query getCustomerCart($customerAccessToken: String!) {
    customer(customerAccessToken: $customerAccessToken) {
      metafield(namespace: "custom", key: "cart") {
        value
      }
    }
  }
`;

export const adminGetCustomerCartQuery = /* GraphQL */ `
  query adminGetCustomerCart($customerId: ID!) {
    customer(id: $customerId) {
      id
      metafield(namespace: "custom", key: "cart") {
        id
        namespace
        key
        value
      }
    }
  }
`;

export const adminGetCustomerWishlistQuery = /* GraphQL */ `
  query adminGetCustomerWishlist($customerId: ID!) {
    customer(id: $customerId) {
      id
      metafield(namespace: "custom", key: "wishlist") {
        id
        namespace
        key
        value
      }
    }
  }
`;
