import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { shopifyFetch } from 'lib/shopify';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { acceptsMarketing } = await request.json();

    // Get customer access token from cookie
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('customerAccessToken')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Update customer marketing preferences
    const updateMutation = `
      mutation customerUpdate($customerAccessToken: String!, $customer: CustomerUpdateInput!) {
        customerUpdate(customerAccessToken: $customerAccessToken, customer: $customer) {
          customer {
            id
            acceptsMarketing
          }
          customerUserErrors {
            code
            field
            message
          }
        }
      }
    `;

    const res = await shopifyFetch<any>({
      query: updateMutation,
      variables: {
        customerAccessToken: accessToken,
        customer: {
          acceptsMarketing: acceptsMarketing
        }
      }
    });

    if (res.body.data.customerUpdate.customerUserErrors.length > 0) {
      const error = res.body.data.customerUpdate.customerUserErrors[0];
      return NextResponse.json(
        { error: error?.message || 'Failed to update marketing preferences' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      acceptsMarketing: res.body.data.customerUpdate.customer.acceptsMarketing
    });
  } catch (error) {
    console.error('Marketing preferences update API error:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating marketing preferences' },
      { status: 500 }
    );
  }
}
