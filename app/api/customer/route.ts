import { getCustomer } from 'lib/shopify';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  try {
    const accessToken = (await cookies()).get('customerAccessToken')?.value;

    if (!accessToken) {
      return NextResponse.json({ customer: null }, { status: 401 });
    }

    const customer = await getCustomer(accessToken);

    if (!customer) {
      return NextResponse.json({ customer: null }, { status: 401 });
    }

    // Fetch avatar from Admin API since Storefront API might not have access
    const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
    if (adminToken && customer.id) {
      try {
        const avatarQuery = `
          query getCustomerAvatar($id: ID!) {
            customer(id: $id) {
              metafield(namespace: "custom", key: "avatar") {
                value
              }
            }
          }
        `;

        const avatarRes = await fetch(
          `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/graphql.json`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': adminToken
            },
            body: JSON.stringify({
              query: avatarQuery,
              variables: { id: customer.id }
            })
          }
        );

        const avatarData = await avatarRes.json();
        const avatarValue = avatarData.data?.customer?.metafield?.value;

        if (avatarValue) {
          customer.avatar = avatarValue;
        }

        console.log('=== /api/customer Response ===');
        console.log('Customer ID:', customer.id);
        console.log('Has avatar:', !!customer.avatar);
      } catch (err) {
        console.error('Failed to fetch avatar from Admin API:', err);
      }
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
