import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCustomer } from 'lib/shopify';
import { getMetafields, setMetafields } from 'lib/shopify/admin';

async function getAuthenticatedCustomer() {
  const accessToken = (await cookies()).get('customerAccessToken')?.value;
  if (!accessToken) return null;
  return getCustomer(accessToken);
}

const NAMESPACE = 'news_feed';
const KEY = 'comments';

interface Comment {
  id: string;
  postId: string;
  author: string;
  userId: string;
  avatar?: string;
  content: string;
  timestamp: string;
}

// GET: 獲取某個貼文的 comments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 });
    }

    // Validate postId is a Shopify Page or Article GID
    if (!postId.startsWith('gid://shopify/Page/') && !postId.startsWith('gid://shopify/Article/')) {
      return NextResponse.json({ error: 'Invalid postId format' }, { status: 400 });
    }

    // 從 Shopify Page metafields 讀取 comments 資料
    const metafields = await getMetafields(postId, NAMESPACE);
    const commentsMetafield = metafields.find((m) => m.key === KEY);

    let comments: Comment[] = [];

    if (commentsMetafield && commentsMetafield.value) {
      try {
        comments = JSON.parse(commentsMetafield.value);
      } catch (error) {
        console.error('Error parsing comments data:', error);
      }
    }

    return NextResponse.json({
      postId,
      comments
    });
  } catch (error) {
    console.error('Error reading comments:', error);
    return NextResponse.json({ error: 'Failed to read comments' }, { status: 500 });
  }
}

// POST: 新增 comment
export async function POST(request: NextRequest) {
  try {
    const customer = await getAuthenticatedCustomer();
    if (!customer) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { postId, content } = body;

    // Derive userId and author from verified session, not from request body
    const userId = customer.id;
    const author = customer.firstName && customer.lastName
      ? `${customer.firstName} ${customer.lastName}`
      : customer.email;
    const avatar = customer.avatar;

    if (!postId || !content) {
      return NextResponse.json(
        { error: 'postId and content are required' },
        { status: 400 }
      );
    }

    // Validate postId is a Shopify Page or Article GID to prevent IDOR
    if (!postId.startsWith('gid://shopify/Page/') && !postId.startsWith('gid://shopify/Article/')) {
      return NextResponse.json({ error: 'Invalid postId format' }, { status: 400 });
    }

    // 從 Shopify Page metafields 讀取現有 comments 資料
    const metafields = await getMetafields(postId, NAMESPACE);
    const commentsMetafield = metafields.find((m) => m.key === KEY);

    let comments: Comment[] = [];

    if (commentsMetafield && commentsMetafield.value) {
      try {
        comments = JSON.parse(commentsMetafield.value);
      } catch (error) {
        console.error('Error parsing existing comments data:', error);
      }
    }

    const newComment: Comment = {
      id: Date.now().toString(),
      postId,
      userId,
      author,
      avatar,
      content,
      timestamp: new Date().toISOString()
    };

    comments.push(newComment);

    // 寫回 Shopify metafields
    await setMetafields(postId, [
      {
        namespace: NAMESPACE,
        key: KEY,
        value: JSON.stringify(comments),
        type: 'json'
      }
    ]);

    return NextResponse.json({
      comment: newComment
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

// DELETE: 刪除 comment
export async function DELETE(request: NextRequest) {
  try {
    const customer = await getAuthenticatedCustomer();
    if (!customer) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');
    const postId = searchParams.get('postId');

    // Use verified customer ID from session
    const userId = customer.id;

    if (!commentId || !postId) {
      return NextResponse.json(
        { error: 'commentId and postId are required' },
        { status: 400 }
      );
    }

    // Validate postId is a Shopify Page or Article GID
    if (!postId.startsWith('gid://shopify/Page/') && !postId.startsWith('gid://shopify/Article/')) {
      return NextResponse.json({ error: 'Invalid postId format' }, { status: 400 });
    }

    // 從 Shopify Page metafields 讀取現有 comments 資料
    const metafields = await getMetafields(postId, NAMESPACE);
    const commentsMetafield = metafields.find((m) => m.key === KEY);

    let comments: Comment[] = [];

    if (commentsMetafield && commentsMetafield.value) {
      try {
        comments = JSON.parse(commentsMetafield.value);
      } catch (error) {
        console.error('Error parsing existing comments data:', error);
      }
    }

    const comment = comments.find((c) => c.id === commentId);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (comment.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    comments = comments.filter((c) => c.id !== commentId);

    // 寫回 Shopify metafields
    await setMetafields(postId, [
      {
        namespace: NAMESPACE,
        key: KEY,
        value: JSON.stringify(comments),
        type: 'json'
      }
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
