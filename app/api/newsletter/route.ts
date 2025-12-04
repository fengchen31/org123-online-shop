import { NextRequest, NextResponse } from 'next/server';
import { shopifyFetch } from 'lib/shopify';

// Generate a unique discount code
function generateDiscountCode(): string {
  const prefix = 'WELCOME';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp.slice(-4)}${random}`;
}

// Create discount code in Shopify
async function createShopifyDiscount(code: string): Promise<boolean> {
  const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  if (!adminToken) {
    console.error('SHOPIFY_ADMIN_ACCESS_TOKEN not configured');
    return false;
  }

  const mutation = `
    mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
      discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
        codeDiscountNode {
          id
          codeDiscount {
            ... on DiscountCodeBasic {
              codes(first: 1) {
                nodes {
                  code
                }
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  try {
    const response = await fetch(
      `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': adminToken
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            basicCodeDiscount: {
              title: `Newsletter Signup - ${code}`,
              code: code,
              startsAt: new Date().toISOString(),
              endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
              customerGets: {
                value: {
                  percentage: 0.1 // 10% off
                },
                items: {
                  all: true
                }
              },
              customerSelection: {
                all: true
              },
              usageLimit: 1 // One-time use only
            }
          }
        })
      }
    );

    const data = await response.json();

    if (data.data?.discountCodeBasicCreate?.userErrors?.length > 0) {
      console.error('Shopify discount creation errors:', data.data.discountCodeBasicCreate.userErrors);
      return false;
    }

    console.log('Discount code created successfully:', code);
    return true;
  } catch (error) {
    console.error('Error creating discount code:', error);
    return false;
  }
}

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

      // If customer already exists, they're already subscribed - NO discount code
      if (error?.code === 'TAKEN') {
        return NextResponse.json({
          success: true,
          message: 'Email already subscribed!',
          isExisting: true // Flag to indicate this is not a first-time subscriber
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

    // Generate dynamic discount code for FIRST-TIME subscribers only
    const discountCode = generateDiscountCode();

    // Create the discount code in Shopify
    const discountCreated = await createShopifyDiscount(discountCode);

    if (!discountCreated) {
      console.warn('Failed to create discount code in Shopify, but subscription succeeded');
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to newsletter!',
      discountCode, // Return dynamic discount code for new subscribers
      isExisting: false,
      discountCreated, // Inform frontend if discount was created
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
