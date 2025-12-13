import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { shopifyFetch } from 'lib/shopify';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { firstName, lastName } = await request.json();

    // Get customer access token from cookie
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('customerAccessToken')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Update customer information
    const updateMutation = `
      mutation customerUpdate($customerAccessToken: String!, $customer: CustomerUpdateInput!) {
        customerUpdate(customerAccessToken: $customerAccessToken, customer: $customer) {
          customer {
            id
            firstName
            lastName
            email
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
          firstName: firstName || '',
          lastName: lastName || ''
        }
      }
    });

    if (res.body.data.customerUpdate.customerUserErrors.length > 0) {
      const error = res.body.data.customerUpdate.customerUserErrors[0];
      return NextResponse.json(
        { error: error?.message || 'Failed to update profile' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      customer: res.body.data.customerUpdate.customer
    });
  } catch (error) {
    console.error('Customer update API error:', error);
    return NextResponse.json({ error: 'An error occurred while updating profile' }, { status: 500 });
  }
}
