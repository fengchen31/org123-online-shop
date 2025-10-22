import { customerLogin } from 'lib/shopify';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Please provide email and password' }, { status: 400 });
    }

    const result = await customerLogin(email, password);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    // 設置 HTTP-Only Cookie 存儲 access token
    const cookieStore = await cookies();
    cookieStore.set('customerAccessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 天
      path: '/'
    });

    return NextResponse.json({
      success: true,
      expiresAt: result.expiresAt
    });
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ error: 'An error occurred during login' }, { status: 500 });
  }
}
