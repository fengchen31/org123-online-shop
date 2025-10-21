export const getCustomerQuery = /* GraphQL */ `
  query getCustomer {
    customer {
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
  query getCustomerOrders($first: Int = 10) {
    customer {
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
  query getCustomerWishlist {
    customer {
      metafield(namespace: "custom", key: "wishlist") {
        value
      }
    }
  }
`;
