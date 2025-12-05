import { NextRequest, NextResponse } from 'next/server';
import { getMetafields, setMetafields } from 'lib/shopify/admin';

const NAMESPACE = 'news_feed';
const KEY = 'likes';

interface LikesData {
  [postId: string]: {
    count: number;
    users: string[];
  };
}

// GET: 獲取某個貼文的 likes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 });
    }

    // 從 Shopify Page metafields 讀取 likes 資料
    const metafields = await getMetafields(postId, NAMESPACE);
    const likesMetafield = metafields.find((m) => m.key === KEY);

    let likesData: LikesData[string] = { count: 0, users: [] };

    if (likesMetafield && likesMetafield.value) {
      try {
        likesData = JSON.parse(likesMetafield.value);
      } catch (error) {
        console.error('Error parsing likes data:', error);
      }
    }

    return NextResponse.json({
      postId,
      count: likesData.count || 0,
      users: likesData.users || []
    });
  } catch (error) {
    console.error('Error reading likes:', error);
    return NextResponse.json({ error: 'Failed to read likes' }, { status: 500 });
  }
}

// POST: 新增或移除 like
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, userId, action } = body;

    if (!postId || !userId || !action) {
      return NextResponse.json(
        { error: 'postId, userId, and action are required' },
        { status: 400 }
      );
    }

    // 從 Shopify Page metafields 讀取現有 likes 資料
    const metafields = await getMetafields(postId, NAMESPACE);
    const likesMetafield = metafields.find((m) => m.key === KEY);

    let likesData: LikesData[string] = { count: 0, users: [] };

    if (likesMetafield && likesMetafield.value) {
      try {
        likesData = JSON.parse(likesMetafield.value);
      } catch (error) {
        console.error('Error parsing existing likes data:', error);
      }
    }

    // 更新 likes 資料
    if (action === 'like') {
      if (!likesData.users.includes(userId)) {
        likesData.users.push(userId);
        likesData.count = likesData.users.length;
      }
    } else if (action === 'unlike') {
      likesData.users = likesData.users.filter((id: string) => id !== userId);
      likesData.count = likesData.users.length;
    }

    // 寫回 Shopify metafields
    await setMetafields(postId, [
      {
        namespace: NAMESPACE,
        key: KEY,
        value: JSON.stringify(likesData),
        type: 'json'
      }
    ]);

    return NextResponse.json({
      postId,
      count: likesData.count,
      isLiked: likesData.users.includes(userId)
    });
  } catch (error) {
    console.error('Error updating likes:', error);
    return NextResponse.json({ error: 'Failed to update likes' }, { status: 500 });
  }
}
