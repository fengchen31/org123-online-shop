import { customerResetByUrl } from 'lib/shopify';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { resetUrl, password } = await request.json();

    if (!resetUrl || !password) {
      return NextResponse.json(
        { error: 'Please provide reset URL and new password' },
        { status: 400 }
      );
    }

    const result = await customerResetByUrl(resetUrl, password);

    if (!result.success) {
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
