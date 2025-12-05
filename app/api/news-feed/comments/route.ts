import { NextRequest, NextResponse } from 'next/server';
import { getMetafields, setMetafields } from 'lib/shopify/admin';

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
    const body = await request.json();
    const { postId, userId, author, avatar, content } = body;

    if (!postId || !userId || !author || !content) {
      return NextResponse.json(
        { error: 'postId, userId, author, and content are required' },
        { status: 400 }
      );
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

    console.log('=== Creating new comment ===');
    console.log('Author:', author);
    console.log('Avatar:', avatar);
    console.log('New comment:', JSON.stringify(newComment, null, 2));

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
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');
    const userId = searchParams.get('userId');
    const postId = searchParams.get('postId');

    if (!commentId || !userId || !postId) {
      return NextResponse.json(
        { error: 'commentId, userId, and postId are required' },
        { status: 400 }
      );
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
