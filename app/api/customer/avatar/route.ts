import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const SHOPIFY_ADMIN_API_VERSION = '2024-01';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('customerAccessToken')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { avatarBase64 } = await request.json();

    if (!avatarBase64) {
      return NextResponse.json({ error: 'No avatar provided' }, { status: 400 });
    }

    // Validate base64 size (limit to ~200KB)
    const base64Size = avatarBase64.length * 0.75; // Approximate size in bytes
    if (base64Size > 200 * 1024) {
      return NextResponse.json(
        { error: 'Image too large. Please upload an image smaller than 200KB.' },
        { status: 400 }
      );
    }

    // First, get customer ID from access token
    const customerQuery = `
      query getCustomer($customerAccessToken: String!) {
        customer(customerAccessToken: $customerAccessToken) {
          id
        }
      }
    `;

    const customerRes = await fetch(
      `https://${process.env.SHOPIFY_STORE_DOMAIN}/api/${SHOPIFY_ADMIN_API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!
        },
        body: JSON.stringify({
          query: customerQuery,
          variables: { customerAccessToken: accessToken }
        })
      }
    );

    const customerData = await customerRes.json();
    const customerId = customerData.data?.customer?.id;

    if (!customerId) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Update customer metafield using Admin API
    // Note: This requires Admin API access token, not Storefront API
    const mutation = `
      mutation updateCustomerMetafield($input: CustomerInput!) {
        customerUpdate(input: $input) {
          customer {
            id
            metafield(namespace: "custom", key: "avatar") {
              value
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

    if (!adminToken) {
      // Fallback: try to use Storefront API (may not work)
      console.warn(
        'SHOPIFY_ADMIN_ACCESS_TOKEN not set. Avatar upload may fail without Admin API access.'
      );
      return NextResponse.json(
        {
          error:
            'Avatar upload requires Admin API access. Please configure SHOPIFY_ADMIN_ACCESS_TOKEN in your environment variables.'
        },
        { status: 500 }
      );
    }

    const updateRes = await fetch(
      `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': adminToken
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            input: {
              id: customerId,
              metafields: [
                {
                  namespace: 'custom',
                  key: 'avatar',
                  value: avatarBase64,
                  type: 'single_line_text_field'
                }
              ]
            }
          }
        })
      }
    );

    const updateData = await updateRes.json();

    if (updateData.data?.customerUpdate?.userErrors?.length > 0) {
      console.error('Shopify errors:', updateData.data.customerUpdate.userErrors);
      return NextResponse.json(
        { error: 'Failed to update avatar', details: updateData.data.customerUpdate.userErrors },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      avatar: updateData.data?.customerUpdate?.customer?.metafield?.value
    });
  } catch (error) {
    console.error('Error updating avatar:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
