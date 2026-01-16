import type { VercelRequest, VercelResponse } from '@vercel/node';
import { TwitterApi } from 'twitter-api-v2';
import Anthropic from '@anthropic-ai/sdk';
import { Client } from '@notionhq/client';

// スケジュール設定の型
interface ScheduleSettings {
  postTimes: string[];
  activeDays: string[];
  topics: string[];
  enabled: boolean;
}

// デフォルト設定
const DEFAULT_SETTINGS: ScheduleSettings = {
  postTimes: ['07:00', '12:00', '19:00'],
  activeDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
  topics: ['AI・機械学習の最新動向', 'クラウドサービス・SaaS', 'プログラミング・開発ツール'],
  enabled: true,
};

// 投稿設定
const POST_CONFIG = {
  persona: 'テクノロジーとビジネスに詳しい、フレンドリーな専門家',
  tone: 'カジュアル',
  contentDirection: '最新のAIトレンドやビジネスに役立つ情報を、初心者にも分かりやすく解説',
  maxLength: 280,
};

// 曜日マッピング
const DAY_MAP: Record<number, string> = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat'
};

// Notionから設定を取得
async function getSettingsFromNotion(): Promise<ScheduleSettings> {
  const notionApiKey = process.env.NOTION_API_KEY;
  const settingsDatabaseId = process.env.NOTION_SETTINGS_DATABASE_ID;

  if (!notionApiKey || !settingsDatabaseId) {
    console.log('Notion not configured, using default settings');
    return DEFAULT_SETTINGS;
  }

  try {
    const notion = new Client({ auth: notionApiKey });
    const response = await notion.databases.query({
      database_id: settingsDatabaseId,
      page_size: 1,
      sorts: [{ property: 'updatedAt', direction: 'descending' }],
    });

    if (response.results.length === 0) {
      console.log('No settings found in Notion, using defaults');
      return DEFAULT_SETTINGS;
    }

    const page = response.results[0] as any;
    const properties = page.properties;

    const settings: ScheduleSettings = {
      postTimes: properties.postTimes?.rich_text?.[0]?.plain_text?.split(',').map((t: string) => t.trim()) || DEFAULT_SETTINGS.postTimes,
      activeDays: properties.activeDays?.rich_text?.[0]?.plain_text?.split(',').map((d: string) => d.trim().toLowerCase()) || DEFAULT_SETTINGS.activeDays,
      topics: properties.topics?.rich_text?.[0]?.plain_text?.split(',').map((t: string) => t.trim()) || DEFAULT_SETTINGS.topics,
      enabled: properties.enabled?.checkbox ?? true,
    };

    console.log('Settings loaded from Notion:', settings);
    return settings;
  } catch (error) {
    console.error('Error fetching settings from Notion:', error);
    return DEFAULT_SETTINGS;
  }
}

// 現在時刻がスケジュールに含まれるかチェック
function isScheduledTime(settings: ScheduleSettings): { scheduled: boolean; reason: string } {
  if (!settings.enabled) {
    return { scheduled: false, reason: 'Auto-posting is disabled' };
  }

  // 日本時間で現在時刻を取得
  const now = new Date();
  const jstOffset = 9 * 60; // JST is UTC+9
  const jstTime = new Date(now.getTime() + (jstOffset + now.getTimezoneOffset()) * 60000);

  const currentHour = jstTime.getHours().toString().padStart(2, '0');
  const currentMinute = jstTime.getMinutes().toString().padStart(2, '0');
  const currentTime = `${currentHour}:${currentMinute}`;
  const currentDay = DAY_MAP[jstTime.getDay()];

  console.log(`Current JST: ${currentTime}, Day: ${currentDay}`);
  console.log(`Scheduled times: ${settings.postTimes.join(', ')}`);
  console.log(`Active days: ${settings.activeDays.join(', ')}`);

  // 曜日チェック
  if (!settings.activeDays.includes(currentDay)) {
    return { scheduled: false, reason: `Today (${currentDay}) is not an active day` };
  }

  // 時刻チェック（時間が一致すればOK）
  const isTimeMatch = settings.postTimes.some(time => {
    const [schedHour] = time.split(':');
    return schedHour === currentHour;
  });

  if (!isTimeMatch) {
    return { scheduled: false, reason: `Current time (${currentTime}) is not in schedule` };
  }

  return { scheduled: true, reason: 'Time matches schedule' };
}

// ランダムにトピックを選択
function selectRandomTopic(topics: string[]): string {
  return topics[Math.floor(Math.random() * topics.length)];
}

// AIプロンプトを生成
function buildPrompt(topic: string): string {
  return `あなたはX（旧Twitter）の投稿を作成するアシスタントです。

【ペルソナ】${POST_CONFIG.persona}
【トーン】${POST_CONFIG.tone}
【トピック】${topic}
【方向性】${POST_CONFIG.contentDirection}
【文字数】${POST_CONFIG.maxLength}文字以内

以下のポイントを意識して投稿を作成してください:
- 1行目で読者の興味を引く（質問、驚き、共感など）
- 中学生でも理解できる言葉遣い
- 漢字を使いすぎない（ひらがな70%:漢字30%程度）
- 同じ語尾を続けない（「です」「です」など）
- URLリンクは含めない
- ネガティブな内容は避ける
- 適切な絵文字を1-2個使用
- 関連するハッシュタグを1-2個追加

投稿文のみを出力してください（説明や補足は不要）。`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORSヘッダー
  res.setHeader('Access-Control-Allow-Origin', '*');

  console.log('Auto-post triggered at:', new Date().toISOString());

  // 強制実行パラメータ（テスト用）
  const forcePost = req.query.force === 'true';

  // Notionから設定を取得
  const settings = await getSettingsFromNotion();

  // スケジュールチェック
  if (!forcePost) {
    const scheduleCheck = isScheduledTime(settings);
    if (!scheduleCheck.scheduled) {
      console.log('Skipping post:', scheduleCheck.reason);
      return res.status(200).json({
        success: false,
        skipped: true,
        reason: scheduleCheck.reason,
        currentSettings: settings,
        timestamp: new Date().toISOString(),
      });
    }
  }

  try {
    // 環境変数チェック
    const anthropicKey = process.env.VITE_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
    const xApiKey = process.env.X_API_KEY;
    const xApiSecret = process.env.X_API_SECRET;
    const xAccessToken = process.env.X_ACCESS_TOKEN;
    const xAccessSecret = process.env.X_ACCESS_SECRET;

    if (!anthropicKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured' });
    }

    if (!xApiKey || !xApiSecret || !xAccessToken || !xAccessSecret) {
      return res.status(500).json({ error: 'X API credentials are not configured' });
    }

    // トピック選択
    const topic = selectRandomTopic(settings.topics);
    console.log('Selected topic:', topic);

    // AIで投稿内容を生成
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const prompt = buildPrompt(topic);

    const aiResponse = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
      system: 'あなたはX（旧Twitter）の投稿を作成する専門家です。指示に従って魅力的な投稿を作成してください。',
    });

    const content = aiResponse.content[0];
    if (content.type !== 'text') {
      return res.status(500).json({ error: 'AI did not return text content' });
    }

    const postContent = content.text.trim();
    console.log('Generated content:', postContent);

    // 文字数チェック
    if (postContent.length > 280) {
      console.warn('Content exceeds 280 characters, truncating...');
    }

    // Xに投稿
    const twitterClient = new TwitterApi({
      appKey: xApiKey,
      appSecret: xApiSecret,
      accessToken: xAccessToken,
      accessSecret: xAccessSecret,
    });

    const tweetResult = await twitterClient.v2.tweet(postContent.slice(0, 280));

    console.log('Tweet posted successfully:', tweetResult.data.id);

    return res.status(200).json({
      success: true,
      tweetId: tweetResult.data.id,
      content: postContent,
      topic,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Auto-post error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: errorMessage });
  }
}
