import { customerResetByUrl } from 'lib/shopify';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { id, token, password, firstName, lastName } = await request.json();

    if (!id || !token || !password) {
      return NextResponse.json(
        { error: 'Please provide id, token and new password' },
        { status: 400 }
      );
    }

    // Construct resetUrl server-side from trusted env var — never accept URL from client
    const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
    if (!storeDomain) {
      return NextResponse.json({ error: 'Store configuration error' }, { status: 500 });
    }
    const resetUrl = `https://${storeDomain}/account/reset/${encodeURIComponent(id)}/${encodeURIComponent(token)}`;

    const result = await customerResetByUrl(resetUrl, password, firstName, lastName);

    if (!result.success) {
      console.error('Password reset failed:', result.error);
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // If reset successful and we got an access token, set it in cookie
    if (result.accessToken) {
      const cookieStore = await cookies();
      cookieStore.set('customerAccessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Password reset API error:', error);
    return NextResponse.json(
      { error: 'An error occurred during password reset' },
      { status: 500 }
    );
  }
}
