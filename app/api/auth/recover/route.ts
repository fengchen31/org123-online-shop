import { customerRecover } from 'lib/shopify';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Please provide email' }, { status: 400 });
    }

    const result = await customerRecover(email);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent, please check your email'
    });
  } catch (error) {
    console.error('Password recovery API error:', error);
    return NextResponse.json({ error: 'An error occurred during password reset' }, { status: 500 });
  }
}
