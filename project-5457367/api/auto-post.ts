import type { VercelRequest, VercelResponse } from '@vercel/node';
import { TwitterApi } from 'twitter-api-v2';
import Anthropic from '@anthropic-ai/sdk';

// デフォルト設定
const DEFAULT_SETTINGS = {
  topics: [
    'AI・機械学習の最新動向',
    'リモートワーク・生産性向上',
    'クラウドサービス・SaaS',
    'プログラミング・開発ツール',
  ],
  persona: 'テクノロジーとビジネスに詳しい、フレンドリーな専門家',
  tone: 'カジュアル',
  contentDirection: '最新のAIトレンドやビジネスに役立つ情報を、初心者にも分かりやすく解説',
  maxLength: 280,
};

// 曜日マッピング
const DAY_MAP: Record<number, string> = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat'
};

// 現在時刻がスケジュールに含まれるかチェック
function isScheduledTime(): { scheduled: boolean; reason: string } {
  // 環境変数からスケジュールを取得
  // POST_SCHEDULE: "07:00,12:00,18:00,21:00" 形式
  // POST_ACTIVE_DAYS: "mon,tue,wed,thu,fri,sat,sun" 形式
  const scheduleStr = process.env.POST_SCHEDULE || '07:00,12:00,19:00';
  const activeDaysStr = process.env.POST_ACTIVE_DAYS || 'mon,tue,wed,thu,fri,sat,sun';

  const scheduledTimes = scheduleStr.split(',').map(t => t.trim());
  const activeDays = activeDaysStr.split(',').map(d => d.trim().toLowerCase());

  // 日本時間で現在時刻を取得
  const now = new Date();
  const jstOffset = 9 * 60; // JST is UTC+9
  const jstTime = new Date(now.getTime() + (jstOffset + now.getTimezoneOffset()) * 60000);

  const currentHour = jstTime.getHours().toString().padStart(2, '0');
  const currentMinute = jstTime.getMinutes().toString().padStart(2, '0');
  const currentTime = `${currentHour}:${currentMinute}`;
  const currentDay = DAY_MAP[jstTime.getDay()];

  console.log(`Current JST: ${currentTime}, Day: ${currentDay}`);
  console.log(`Scheduled times: ${scheduledTimes.join(', ')}`);
  console.log(`Active days: ${activeDays.join(', ')}`);

  // 曜日チェック
  if (!activeDays.includes(currentDay)) {
    return { scheduled: false, reason: `Today (${currentDay}) is not an active day` };
  }

  // 時刻チェック（分は00のみ許可、時間が一致すればOK）
  const currentHourTime = `${currentHour}:00`;
  const isTimeMatch = scheduledTimes.some(time => {
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
function buildPrompt(topic: string, settings: typeof DEFAULT_SETTINGS): string {
  return `あなたはX（旧Twitter）の投稿を作成するアシスタントです。

【ペルソナ】${settings.persona}
【トーン】${settings.tone}
【トピック】${topic}
【方向性】${settings.contentDirection}
【文字数】${settings.maxLength}文字以内

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

  // スケジュールチェック
  if (!forcePost) {
    const scheduleCheck = isScheduledTime();
    if (!scheduleCheck.scheduled) {
      console.log('Skipping post:', scheduleCheck.reason);
      return res.status(200).json({
        success: false,
        skipped: true,
        reason: scheduleCheck.reason,
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
    const topic = selectRandomTopic(DEFAULT_SETTINGS.topics);
    console.log('Selected topic:', topic);

    // AIで投稿内容を生成
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const prompt = buildPrompt(topic, DEFAULT_SETTINGS);

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
