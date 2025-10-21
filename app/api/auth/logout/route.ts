import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();

    // Delete the customer access token cookie
    cookieStore.delete('customerAccessToken');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging out:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
