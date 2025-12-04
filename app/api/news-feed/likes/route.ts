import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'likes.json');

// 確保資料目錄和檔案存在
async function ensureDataFile() {
  try {
    const dataDir = path.dirname(DATA_FILE);
    await fs.mkdir(dataDir, { recursive: true });

    try {
      await fs.access(DATA_FILE);
    } catch {
      await fs.writeFile(DATA_FILE, JSON.stringify({}));
    }
  } catch (error) {
    console.error('Error ensuring data file:', error);
  }
}

// GET: 獲取某個貼文的 likes
export async function GET(request: NextRequest) {
  try {
    await ensureDataFile();
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 });
    }

    const data = await fs.readFile(DATA_FILE, 'utf-8');
    const likes = JSON.parse(data);

    return NextResponse.json({
      postId,
      count: likes[postId]?.count || 0,
      users: likes[postId]?.users || []
    });
  } catch (error) {
    console.error('Error reading likes:', error);
    return NextResponse.json({ error: 'Failed to read likes' }, { status: 500 });
  }
}

// POST: 新增或移除 like
export async function POST(request: NextRequest) {
  try {
    await ensureDataFile();
    const body = await request.json();
    const { postId, userId, action } = body;

    if (!postId || !userId || !action) {
      return NextResponse.json(
        { error: 'postId, userId, and action are required' },
        { status: 400 }
      );
    }

    const data = await fs.readFile(DATA_FILE, 'utf-8');
    const likes = JSON.parse(data);

    if (!likes[postId]) {
      likes[postId] = { count: 0, users: [] };
    }

    if (action === 'like') {
      if (!likes[postId].users.includes(userId)) {
        likes[postId].users.push(userId);
        likes[postId].count = likes[postId].users.length;
      }
    } else if (action === 'unlike') {
      likes[postId].users = likes[postId].users.filter((id: string) => id !== userId);
      likes[postId].count = likes[postId].users.length;
    }

    await fs.writeFile(DATA_FILE, JSON.stringify(likes, null, 2));

    return NextResponse.json({
      postId,
      count: likes[postId].count,
      isLiked: likes[postId].users.includes(userId)
    });
  } catch (error) {
    console.error('Error updating likes:', error);
    return NextResponse.json({ error: 'Failed to update likes' }, { status: 500 });
  }
}
