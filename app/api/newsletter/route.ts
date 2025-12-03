import { NextRequest, NextResponse } from 'next/server';
import { shopifyFetch } from 'lib/shopify';

const createNewsletterSubscriberMutation = /* GraphQL */ `
  mutation customerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer {
        id
        email
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

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    // Generate a random password for the customer (they won't use it for newsletter)
    const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);

    // Try to create a customer with acceptsMarketing: true
    const result = await shopifyFetch<{
      data: {
        customerCreate: {
          customer?: {
            id: string;
            email: string;
            acceptsMarketing: boolean;
          };
          customerUserErrors: Array<{
            code: string;
            field: string[];
            message: string;
          }>;
        };
      };
      variables: {
        input: {
          email: string;
          password: string;
          acceptsMarketing: boolean;
        };
      };
    }>({
      query: createNewsletterSubscriberMutation,
      variables: {
        input: {
          email,
          password: randomPassword,
          acceptsMarketing: true
        }
      }
    });

    const { customer, customerUserErrors } = result.body.data.customerCreate;

    // Check for errors
    if (customerUserErrors && customerUserErrors.length > 0) {
      const error = customerUserErrors[0];

      // If customer already exists, that's actually okay - they're already subscribed
      if (error?.code === 'TAKEN') {
        return NextResponse.json({
          success: true,
          message: 'Email already subscribed!'
        });
      }

      return NextResponse.json(
        { error: error?.message || 'Subscription failed' },
        { status: 400 }
      );
    }

    if (!customer) {
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }

    // Return fixed discount code for newsletter subscribers
    const discountCode = 'WELCOME10';

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to newsletter!',
      discountCode, // Return the fixed discount code
      customer: {
        email: customer.email,
        acceptsMarketing: customer.acceptsMarketing
      }
    });
  } catch (error: any) {
    console.error('Newsletter subscription error:', error);

    // Handle Shopify API rate limiting
    if (error?.error?.extensions?.code === 'THROTTLED') {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a few minutes.' },
        { status: 429 }
      );
    }

    // Return more specific error message if available
    const errorMessage = error?.error?.message || error?.message || 'An error occurred while processing your subscription';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
