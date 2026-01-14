import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSettings, addHistory, getTodayPostCount } from './lib/notion';
import { generatePost } from './lib/claude';
import { postTweet } from './lib/twitter';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel Cron からの呼び出しを確認
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const settings = await getSettings();

    if (!settings || !settings.enabled) {
      return res.json({ success: true, message: 'Bot is disabled' });
    }

    // 現在時刻をJSTで取得（UTC+9）
    const now = new Date();
    const jstOffset = 9 * 60 * 60 * 1000;
    const nowJST = new Date(now.getTime() + jstOffset);
    const currentHour = nowJST.getUTCHours();
    const currentMinute = nowJST.getUTCMinutes();
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    // 現在時刻が投稿時間に近いかチェック（±5分）
    const isPostTime = settings.postTimes.some(time => {
      const [h, m] = time.split(':').map(Number);
      const scheduledMinutes = h * 60 + m;
      const currentMinutes = currentHour * 60 + currentMinute;
      return Math.abs(scheduledMinutes - currentMinutes) <= 5;
    });

    if (!isPostTime) {
      return res.json({ success: true, message: 'Not a scheduled post time', currentTime });
    }

    // 曜日をチェック（JSTで）
    const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const currentDay = dayMap[nowJST.getUTCDay()];
    if (!settings.activeDays.includes(currentDay)) {
      return res.json({ success: true, message: 'Not an active day', currentDay });
    }

    // 今日の投稿数をチェック
    const todayCount = await getTodayPostCount();
    if (todayCount >= settings.maxPostsPerDay) {
      return res.json({ success: true, message: 'Daily post limit reached', todayCount });
    }

    // 投稿を生成して投稿
    const content = await generatePost(settings);
    const result = await postTweet(content);

    await addHistory({
      settingId: settings.id,
      postedAt: new Date().toISOString(),
      content,
      status: 'success',
      errorMessage: null,
    });

    return res.json({
      success: true,
      message: 'Posted successfully',
      data: { content, tweetId: result.id },
    });
  } catch (error: any) {
    console.error('Cron job error:', error);

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
