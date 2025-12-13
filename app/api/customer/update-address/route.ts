import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { shopifyFetch } from 'lib/shopify';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { address1, address2, city, province, zip, country } = await request.json();

    // Get customer access token from cookie
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('customerAccessToken')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // First, get customer ID
    const customerQuery = `
      query {
        customer(customerAccessToken: "${accessToken}") {
          id
        }
      }
    `;

    const customerRes = await shopifyFetch<any>({
      query: customerQuery
    });

    const customerId = customerRes.body.data.customer?.id;

    if (!customerId) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Get existing default address ID if it exists
    const getAddressQuery = `
      query {
        customer(customerAccessToken: "${accessToken}") {
          defaultAddress {
            id
          }
        }
      }
    `;

    const addressQueryRes = await shopifyFetch<any>({
      query: getAddressQuery
    });

    const existingAddressId = addressQueryRes.body.data.customer?.defaultAddress?.id;

    let res;

    if (existingAddressId) {
      // Update existing address
      const updateMutation = `
        mutation customerAddressUpdate($customerAccessToken: String!, $id: ID!, $address: MailingAddressInput!) {
          customerAddressUpdate(customerAccessToken: $customerAccessToken, id: $id, address: $address) {
            customerAddress {
              id
            }
            customerUserErrors {
              code
              field
              message
            }
          }
        }
      `;

      res = await shopifyFetch<any>({
        query: updateMutation,
        variables: {
          customerAccessToken: accessToken,
          id: existingAddressId,
          address: {
            address1,
            address2,
            city,
            province,
            zip,
            country
          }
        }
      });

      if (res.body.data.customerAddressUpdate.customerUserErrors.length > 0) {
        const error = res.body.data.customerAddressUpdate.customerUserErrors[0];
        return NextResponse.json(
          { error: error?.message || 'Failed to update address' },
          { status: 400 }
        );
      }
    } else {
      // Create new address
      const createMutation = `
        mutation customerAddressCreate($customerAccessToken: String!, $address: MailingAddressInput!) {
          customerAddressCreate(customerAccessToken: $customerAccessToken, address: $address) {
            customerAddress {
              id
            }
            customerUserErrors {
              code
              field
              message
            }
          }
        }
      `;

      res = await shopifyFetch<any>({
        query: createMutation,
        variables: {
          customerAccessToken: accessToken,
          address: {
            address1,
            address2,
            city,
            province,
            zip,
            country
          }
        }
      });

      if (res.body.data.customerAddressCreate.customerUserErrors.length > 0) {
        const error = res.body.data.customerAddressCreate.customerUserErrors[0];
        return NextResponse.json(
          { error: error?.message || 'Failed to create address' },
          { status: 400 }
        );
      }

      // Set as default address
      const newAddressId = res.body.data.customerAddressCreate.customerAddress?.id;
      if (newAddressId) {
        const setDefaultMutation = `
          mutation customerDefaultAddressUpdate($customerAccessToken: String!, $addressId: ID!) {
            customerDefaultAddressUpdate(customerAccessToken: $customerAccessToken, addressId: $addressId) {
              customer {
                id
              }
              customerUserErrors {
                code
                field
                message
              }
            }
          }
        `;

        await shopifyFetch<any>({
          query: setDefaultMutation,
          variables: {
            customerAccessToken: accessToken,
            addressId: newAddressId
          }
        });
      }
    }

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Address update API error:', error);
    return NextResponse.json({ error: 'An error occurred while updating address' }, { status: 500 });
  }
}
