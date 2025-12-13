import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { shopifyFetch } from 'lib/shopify';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Please provide current and new password' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
    }

    // Get customer access token and email from cookie
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('customerAccessToken')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // First, get customer email
    const customerQuery = `
      query {
        customer(customerAccessToken: "${accessToken}") {
          email
        }
      }
    `;

    const customerRes = await shopifyFetch<any>({
      query: customerQuery
    });

    const email = customerRes.body.data.customer?.email;

    if (!email) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Try to login with current password to verify it's correct
    const loginMutation = `
      mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
        customerAccessTokenCreate(input: $input) {
          customerAccessToken {
            accessToken
          }
          customerUserErrors {
            code
            field
            message
          }
        }
      }
    `;

    const loginRes = await shopifyFetch<any>({
      query: loginMutation,
      variables: {
        input: {
          email,
          password: currentPassword
        }
      }
    });

    if (loginRes.body.data.customerAccessTokenCreate.customerUserErrors.length > 0) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Update password using customerUpdate mutation
    const updateMutation = `
      mutation customerUpdate($customerAccessToken: String!, $customer: CustomerUpdateInput!) {
        customerUpdate(customerAccessToken: $customerAccessToken, customer: $customer) {
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

    const updateRes = await shopifyFetch<any>({
      query: updateMutation,
      variables: {
        customerAccessToken: accessToken,
        customer: {
          password: newPassword
        }
      }
    });

    if (updateRes.body.data.customerUpdate.customerUserErrors.length > 0) {
      const error = updateRes.body.data.customerUpdate.customerUserErrors[0];
      return NextResponse.json(
        { error: error?.message || 'Failed to update password' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password API error:', error);
    return NextResponse.json(
      { error: 'An error occurred while changing password' },
      { status: 500 }
    );
  }
}
