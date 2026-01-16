import type { VercelRequest, VercelResponse } from '@vercel/node';
import { TwitterApi } from 'twitter-api-v2';

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

    return res.status(200).json({
      success: true,
      tweetId: result.data.id,
      text: result.data.text,
    });
  } catch (error: unknown) {
    console.error('X API Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

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
