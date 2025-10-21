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

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
