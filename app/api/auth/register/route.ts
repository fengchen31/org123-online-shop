import { customerLogin, customerRegister } from 'lib/shopify';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { email, password, firstName, lastName } = await request.json();

    // 驗證必填欄位
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Please provide all required fields (email, password, first name, last name)' },
        { status: 400 }
      );
    }

    // 註冊客戶
    const registerResult = await customerRegister({
      email,
      password,
      firstName,
      lastName
    });

    if (!registerResult.success) {
      return NextResponse.json({ error: registerResult.error }, { status: 400 });
    }

    // 註冊成功後自動登錄
    const loginResult = await customerLogin(email, password);

    if ('error' in loginResult) {
      // 註冊成功但登錄失敗，返回提示用戶手動登錄
      return NextResponse.json({
        success: true,
        message: 'Registration successful! Please log in to your account.',
        autoLoginFailed: true
      });
    }

    // 設置 HTTP-Only Cookie 存儲 access token
    const cookieStore = await cookies();
    cookieStore.set('customerAccessToken', loginResult.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 天
      path: '/'
    });

    return NextResponse.json({
      success: true,
      customer: registerResult.customer,
      expiresAt: loginResult.expiresAt
    });
  } catch (error) {
    console.error('Register API error:', error);
    return NextResponse.json({ error: 'An error occurred during registration' }, { status: 500 });
  }
}
