import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'comments.json');

interface Comment {
  id: string;
  postId: string;
  author: string;
  userId: string;
  content: string;
  timestamp: string;
}

// 確保資料目錄和檔案存在
async function ensureDataFile() {
  try {
    const dataDir = path.dirname(DATA_FILE);
    await fs.mkdir(dataDir, { recursive: true });

    try {
      await fs.access(DATA_FILE);
    } catch {
      await fs.writeFile(DATA_FILE, JSON.stringify([]));
    }
  } catch (error) {
    console.error('Error ensuring data file:', error);
  }
}

// GET: 獲取某個貼文的 comments
export async function GET(request: NextRequest) {
  try {
    await ensureDataFile();
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 });
    }

    const data = await fs.readFile(DATA_FILE, 'utf-8');
    const allComments: Comment[] = JSON.parse(data);
    const postComments = allComments.filter((c) => c.postId === postId);

    return NextResponse.json({
      postId,
      comments: postComments
    });
  } catch (error) {
    console.error('Error reading comments:', error);
    return NextResponse.json({ error: 'Failed to read comments' }, { status: 500 });
  }
}

// POST: 新增 comment
export async function POST(request: NextRequest) {
  try {
    await ensureDataFile();
    const body = await request.json();
    const { postId, userId, author, content } = body;

    if (!postId || !userId || !author || !content) {
      return NextResponse.json(
        { error: 'postId, userId, author, and content are required' },
        { status: 400 }
      );
    }

    const data = await fs.readFile(DATA_FILE, 'utf-8');
    const comments: Comment[] = JSON.parse(data);

    const newComment: Comment = {
      id: Date.now().toString(),
      postId,
      userId,
      author,
      content,
      timestamp: new Date().toISOString()
    };

    comments.push(newComment);
    await fs.writeFile(DATA_FILE, JSON.stringify(comments, null, 2));

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
    await ensureDataFile();
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');
    const userId = searchParams.get('userId');

    if (!commentId || !userId) {
      return NextResponse.json(
        { error: 'commentId and userId are required' },
        { status: 400 }
      );
    }

    const data = await fs.readFile(DATA_FILE, 'utf-8');
    let comments: Comment[] = JSON.parse(data);

    const comment = comments.find((c) => c.id === commentId);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (comment.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    comments = comments.filter((c) => c.id !== commentId);
    await fs.writeFile(DATA_FILE, JSON.stringify(comments, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
