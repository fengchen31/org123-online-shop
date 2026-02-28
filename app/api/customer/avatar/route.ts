import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { SHOPIFY_GRAPHQL_API_ENDPOINT, SHOPIFY_ADMIN_API_VERSION } from 'lib/constants';

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

    // Validate MIME type - only allow safe image formats
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const mimeMatch = avatarBase64.match(/^data:(image\/[a-z+]+);base64,/);
    if (!mimeMatch || !allowedMimeTypes.includes(mimeMatch[1]!)) {
      return NextResponse.json(
        { error: 'Invalid image format. Only JPEG, PNG, GIF, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate base64 size (limit to ~200KB)
    const base64Size = avatarBase64.length * 0.75;
    if (base64Size > 200 * 1024) {
      return NextResponse.json(
        { error: 'Image too large. Please upload an image smaller than 200KB.' },
        { status: 400 }
      );
    }

    // Verify actual binary content matches declared MIME type via magic bytes
    const declaredMime = mimeMatch[1]!;
    const base64Data = avatarBase64.split(',')[1];
    if (base64Data) {
      const buffer = Buffer.from(base64Data, 'base64');
      const magicBytesValid =
        (declaredMime === 'image/jpeg' && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) ||
        (declaredMime === 'image/png' && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) ||
        (declaredMime === 'image/gif' && buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) ||
        (declaredMime === 'image/webp' && buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
         buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50);

      if (!magicBytesValid) {
        return NextResponse.json(
          { error: 'File content does not match declared image type.' },
          { status: 400 }
        );
      }
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
      `https://${process.env.SHOPIFY_STORE_DOMAIN}${SHOPIFY_GRAPHQL_API_ENDPOINT}`,
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
      return NextResponse.json(
        { error: 'Failed to update avatar', details: updateData.data.customerUpdate.userErrors },
        { status: 500 }
      );
    }

    const avatarValue = updateData.data?.customerUpdate?.customer?.metafield?.value;

    return NextResponse.json({
      success: true,
      avatar: avatarValue
    });
  } catch (error) {
    console.error('Error updating avatar:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
