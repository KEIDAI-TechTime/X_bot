import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSettings, addHistory } from './lib/notion';
import { generatePost } from './lib/claude';
import { postTweet } from './lib/twitter';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const settings = await getSettings();
    if (!settings) {
      return res.status(400).json({ success: false, error: 'No settings found' });
    }

    // 投稿を生成
    const content = await generatePost(settings);

    // ツイートを投稿
    const result = await postTweet(content);

    // 履歴に追加
    await addHistory({
      settingId: settings.id,
      postedAt: new Date().toISOString(),
      content,
      status: 'success',
      errorMessage: null,
    });

    return res.json({
      success: true,
      data: {
        content,
        tweetId: result.id,
      },
    });
  } catch (error: any) {
    console.error('Post now API error:', error);

    // エラー履歴を追加
    try {
      const settings = await getSettings();
      if (settings) {
        await addHistory({
          settingId: settings.id,
          postedAt: new Date().toISOString(),
          content: '',
          status: 'failed',
          errorMessage: error.message,
        });
      }
    } catch {}

    return res.status(500).json({ success: false, error: error.message });
  }
}
