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
