import { getMusicEmbedUrl } from 'lib/shopify';
import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  try {
    const musicEmbedUrl = await getMusicEmbedUrl();

    if (!musicEmbedUrl) {
      return NextResponse.json({ musicEmbedUrl: null }, { status: 200 });
    }

    return NextResponse.json({ musicEmbedUrl });
  } catch (error) {
    console.error('Error fetching music embed URL:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
