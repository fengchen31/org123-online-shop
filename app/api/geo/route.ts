import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const headersList = await headers();

  // Use Vercel's geo header, fallback to accept-language detection
  const country =
    headersList.get('x-vercel-ip-country') ||
    (headersList.get('accept-language')?.includes('zh-TW') ? 'TW' : null) ||
    'US';

  return NextResponse.json({ country });
}
