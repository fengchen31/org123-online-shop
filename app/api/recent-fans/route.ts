import { NextRequest, NextResponse } from 'next/server';

const SHOPIFY_ADMIN_ENDPOINT = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-10/graphql.json`;
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!;

interface RecentFan {
  customerId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar: string;
  timestamp: string;
}

const METAFIELD_NAMESPACE = 'custom';
const METAFIELD_KEY = 'recent_fans';

// Get shop GID dynamically
async function getShopGID(): Promise<string | null> {
  const query = `
    query {
      shop {
        id
      }
    }
  `;

  try {
    const response = await fetch(SHOPIFY_ADMIN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': ADMIN_TOKEN
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    return data.data?.shop?.id || null;
  } catch (error) {
    console.error('Error getting shop GID:', error);
    return null;
  }
}

// Get recent fans from shop metafield
async function getRecentFans(): Promise<RecentFan[]> {
  const query = `
    query getShopMetafield {
      shop {
        metafield(namespace: "${METAFIELD_NAMESPACE}", key: "${METAFIELD_KEY}") {
          value
        }
      }
    }
  `;

  try {
    const response = await fetch(SHOPIFY_ADMIN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': ADMIN_TOKEN
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    const metafieldValue = data.data?.shop?.metafield?.value;

    if (metafieldValue) {
      return JSON.parse(metafieldValue);
    }
    return [];
  } catch (error) {
    console.error('Error getting recent fans:', error);
    return [];
  }
}

// Save recent fans to shop metafield
async function saveRecentFans(fans: RecentFan[]): Promise<boolean> {
  const mutation = `
    mutation SetShopMetafield($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          namespace
          key
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  try {
    // Get shop GID dynamically
    const shopGID = await getShopGID();
    if (!shopGID) {
      console.error('Failed to get shop GID');
      return false;
    }

    const response = await fetch(SHOPIFY_ADMIN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': ADMIN_TOKEN
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          metafields: [
            {
              ownerId: shopGID,
              namespace: METAFIELD_NAMESPACE,
              key: METAFIELD_KEY,
              value: JSON.stringify(fans),
              type: 'json'
            }
          ]
        }
      })
    });

    const data = await response.json();
    if (data.data?.metafieldsSet?.userErrors?.length > 0) {
      console.error('Metafield set errors:', data.data.metafieldsSet.userErrors);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error saving recent fans:', error);
    return false;
  }
}

// GET: Get recent fans list
export async function GET() {
  try {
    const fans = await getRecentFans();
    return NextResponse.json({ fans: fans.slice(0, 6) });
  } catch (error) {
    console.error('Error in GET recent-fans:', error);
    return NextResponse.json({ error: 'Failed to get recent fans' }, { status: 500 });
  }
}

// POST: Add a new fan to the list
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, email, firstName, lastName, avatar } = body;

    if (!customerId || !avatar) {
      return NextResponse.json(
        { error: 'customerId and avatar are required' },
        { status: 400 }
      );
    }

    // Get current fans
    const currentFans = await getRecentFans();

    // Check if user already exists
    const existingIndex = currentFans.findIndex(fan => fan.customerId === customerId);

    const newFan: RecentFan = {
      customerId,
      email,
      firstName,
      lastName,
      avatar,
      timestamp: new Date().toISOString()
    };

    let updatedFans: RecentFan[];

    if (existingIndex >= 0) {
      // Update existing fan (move to front)
      updatedFans = [
        newFan,
        ...currentFans.filter(fan => fan.customerId !== customerId)
      ];
    } else {
      // Add new fan to front
      updatedFans = [newFan, ...currentFans];
    }

    // Keep only the most recent 20 fans
    updatedFans = updatedFans.slice(0, 20);

    // Save to metafield
    await saveRecentFans(updatedFans);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST recent-fans:', error);
    return NextResponse.json({ error: 'Failed to add fan' }, { status: 500 });
  }
}
