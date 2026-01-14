import cron from 'node-cron';
import { getSettings, addHistory, getTodayPostCount } from './notion.js';
import { generatePost } from './claude.js';
import { postTweet } from './twitter.js';

// アクティブなcronジョブを保持
let activeJobs: cron.ScheduledTask[] = [];

// 曜日の変換マップ
const dayMap: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

// スケジューラーを開始
export async function startScheduler(): Promise<void> {
  console.log('Starting scheduler...');

  // 既存のジョブをクリア
  stopScheduler();

  const settings = await getSettings();

  if (!settings || !settings.enabled) {
    console.log('Scheduler is disabled or no settings found');
    return;
  }

  const { postTimes, activeDays } = settings;

  if (postTimes.length === 0) {
    console.log('No post times configured');
    return;
  }

  // 各投稿時間に対してcronジョブを作成
  for (const time of postTimes) {
    const [hours, minutes] = time.split(':');
    const daysOfWeek = activeDays.map(d => dayMap[d]).filter(d => d !== undefined);

    if (daysOfWeek.length === 0) {
      console.log('No active days configured');
      continue;
    }

    // cron式を作成: 分 時 日 月 曜日
    const cronExpression = `${parseInt(minutes)} ${parseInt(hours)} * * ${daysOfWeek.join(',')}`;

    console.log(`Creating cron job: ${cronExpression} for time ${time}`);

    const job = cron.schedule(cronExpression, async () => {
      await executeScheduledPost();
    }, {
      timezone: settings.timezone || 'Asia/Tokyo',
    });

    activeJobs.push(job);
  }

  console.log(`Scheduler started with ${activeJobs.length} jobs`);
}

// スケジューラーを停止
export function stopScheduler(): void {
  console.log('Stopping scheduler...');

  for (const job of activeJobs) {
    job.stop();
  }

  activeJobs = [];
  console.log('Scheduler stopped');
}

// スケジュールされた投稿を実行
async function executeScheduledPost(): Promise<void> {
  console.log('Executing scheduled post...');

  try {
    const settings = await getSettings();

    if (!settings || !settings.enabled) {
      console.log('Posting is disabled');
      return;
    }

    // 今日の投稿数をチェック
    const todayCount = await getTodayPostCount();
    if (todayCount >= settings.maxPostsPerDay) {
      console.log(`Daily post limit reached: ${todayCount}/${settings.maxPostsPerDay}`);
      return;
    }

    // 投稿を生成
    const content = await generatePost(settings);
    console.log('Generated post:', content);

    // ツイートを投稿
    const result = await postTweet(content);
    console.log('Posted successfully:', result.id);

    // 履歴に追加
    await addHistory({
      settingId: settings.id,
      postedAt: new Date().toISOString(),
      content,
      status: 'success',
      errorMessage: null,
    });
  } catch (error: any) {
    console.error('Failed to execute scheduled post:', error);

    // エラー履歴を追加
    const settings = await getSettings();
    if (settings) {
      await addHistory({
        settingId: settings.id,
        postedAt: new Date().toISOString(),
        content: '',
        status: 'failed',
        errorMessage: error.message || 'Unknown error',
      });
    }
  }
}

// 即時投稿を実行
export async function postNow(): Promise<{ content: string; tweetId: string }> {
  console.log('Executing immediate post...');

  const settings = await getSettings();

  if (!settings) {
    throw new Error('No settings found');
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

  return {
    content,
    tweetId: result.id,
  };
}

// スケジューラーの状態を取得
export function getSchedulerStatus(): { isRunning: boolean; jobCount: number } {
  return {
    isRunning: activeJobs.length > 0,
    jobCount: activeJobs.length,
  };
}
