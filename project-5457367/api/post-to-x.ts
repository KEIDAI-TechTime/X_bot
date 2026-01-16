import type { VercelRequest, VercelResponse } from '@vercel/node';
import { TwitterApi } from 'twitter-api-v2';
import { Client } from '@notionhq/client';

// Notionに投稿履歴を保存
async function saveHistoryToNotion(
  content: string,
  status: 'success' | 'failed',
  tweetId?: string,
  errorMessage?: string
): Promise<void> {
  const notionApiKey = process.env.NOTION_API_KEY;
  const historyDatabaseId = process.env.NOTION_HISTORY_DATABASE_ID;

  if (!notionApiKey || !historyDatabaseId) {
    console.log('Notion history database not configured, skipping history save');
    return;
  }

  try {
    const notion = new Client({ auth: notionApiKey });

    const properties: any = {
      content: {
        rich_text: [{ text: { content: content.slice(0, 2000) } }],
      },
      postedAt: {
        date: { start: new Date().toISOString() },
      },
      status: {
        select: { name: status },
      },
    };

    if (tweetId) {
      properties.tweetId = {
        rich_text: [{ text: { content: tweetId } }],
      };
    }

    if (errorMessage) {
      properties.errorMessage = {
        rich_text: [{ text: { content: errorMessage.slice(0, 2000) } }],
      };
    }

    await notion.pages.create({
      parent: { database_id: historyDatabaseId },
      properties,
    });

    console.log('History saved to Notion');
  } catch (error) {
    console.error('Failed to save history to Notion:', error);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORSヘッダー
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: '投稿内容が必要です' });
    }

    if (content.length > 280) {
      return res.status(400).json({ error: '投稿は280文字以内にしてください' });
    }

    // 環境変数からX APIキーを取得
    const apiKey = process.env.X_API_KEY;
    const apiSecret = process.env.X_API_SECRET;
    const accessToken = process.env.X_ACCESS_TOKEN;
    const accessSecret = process.env.X_ACCESS_SECRET;

    if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
      console.error('Missing X API credentials');
      return res.status(500).json({ error: 'X API認証情報が設定されていません' });
    }

    // Twitter APIクライアントを初期化
    const client = new TwitterApi({
      appKey: apiKey,
      appSecret: apiSecret,
      accessToken: accessToken,
      accessSecret: accessSecret,
    });

    // ツイートを投稿
    const result = await client.v2.tweet(content);

    // 履歴を保存（成功）
    await saveHistoryToNotion(content, 'success', result.data.id);

    return res.status(200).json({
      success: true,
      tweetId: result.data.id,
      text: result.data.text,
    });
  } catch (error: unknown) {
    console.error('X API Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // 履歴を保存（失敗）
    await saveHistoryToNotion(content, 'failed', undefined, errorMessage);

    // Twitter APIのエラーハンドリング
    if (errorMessage.includes('401')) {
      return res.status(401).json({ error: 'X API認証に失敗しました。APIキーを確認してください。' });
    }
    if (errorMessage.includes('403')) {
      return res.status(403).json({ error: 'X APIへのアクセスが拒否されました。アプリの権限を確認してください。' });
    }
    if (errorMessage.includes('429')) {
      return res.status(429).json({ error: 'レート制限に達しました。しばらく待ってから再試行してください。' });
    }

    return res.status(500).json({ error: `投稿に失敗しました: ${errorMessage}` });
  }
}
