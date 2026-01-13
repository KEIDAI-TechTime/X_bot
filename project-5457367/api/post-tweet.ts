import type { VercelRequest, VercelResponse } from '@vercel/node';
import { TwitterApi } from 'twitter-api-v2';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
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

  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text is required' });
  }

  if (text.length > 280) {
    return res.status(400).json({ error: 'Tweet exceeds 280 characters' });
  }

  try {
    const client = new TwitterApi({
      appKey: process.env.X_API_KEY!,
      appSecret: process.env.X_API_SECRET!,
      accessToken: process.env.X_ACCESS_TOKEN!,
      accessSecret: process.env.X_ACCESS_SECRET!,
    });

    const tweet = await client.v2.tweet(text);

    return res.status(200).json({
      success: true,
      tweet: {
        id: tweet.data.id,
        text: tweet.data.text,
      },
    });
  } catch (error: any) {
    console.error('Twitter API Error:', error);
    return res.status(500).json({
      error: 'Failed to post tweet',
      details: error.message,
    });
  }
}
