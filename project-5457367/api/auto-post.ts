import type { VercelRequest, VercelResponse } from '@vercel/node';
import { TwitterApi } from 'twitter-api-v2';
import Anthropic from '@anthropic-ai/sdk';
import { Client } from '@notionhq/client';

// 設定の型（スケジュール + 投稿生成）
interface PostSettings {
  // スケジュール関連
  postTimes: string[];
  activeDays: string[];
  topics: string[];
  enabled: boolean;
  // 投稿生成関連
  persona: string;
  tone: string;
  contentDirection: string;
  maxLength: number;
  useEmoji: boolean;
  useHashtags: boolean;
  hashtagRules: string;
  mustInclude: string;
  mustExclude: string;
  structureTemplate: string;
  referenceInfo: string;
  examplePosts: string;
}

// デフォルト設定
const DEFAULT_SETTINGS: PostSettings = {
  postTimes: ['07:00', '12:00', '19:00'],
  activeDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
  topics: ['AI・機械学習の最新動向', 'クラウドサービス・SaaS', 'プログラミング・開発ツール'],
  enabled: true,
  persona: 'テクノロジーとビジネスに詳しい、フレンドリーな専門家',
  tone: 'カジュアル',
  contentDirection: '最新のAIトレンドやビジネスに役立つ情報を、初心者にも分かりやすく解説',
  maxLength: 280,
  useEmoji: true,
  useHashtags: true,
  hashtagRules: '関連するハッシュタグを1-2個追加',
  mustInclude: '',
  mustExclude: '',
  structureTemplate: '',
  referenceInfo: '',
  examplePosts: '',
};

// 曜日マッピング
const DAY_MAP: Record<number, string> = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat'
};

// テキストプロパティを取得するヘルパー
function getTextProperty(properties: any, key: string, defaultValue: string): string {
  return properties[key]?.rich_text?.[0]?.plain_text || defaultValue;
}

// 数値プロパティを取得するヘルパー
function getNumberProperty(properties: any, key: string, defaultValue: number): number {
  return properties[key]?.number ?? defaultValue;
}

// チェックボックスプロパティを取得するヘルパー
function getCheckboxProperty(properties: any, key: string, defaultValue: boolean): boolean {
  return properties[key]?.checkbox ?? defaultValue;
}

// Notionから設定を取得
async function getSettingsFromNotion(): Promise<PostSettings> {
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
    });

    if (response.results.length === 0) {
      console.log('No settings found in Notion, using defaults');
      return DEFAULT_SETTINGS;
    }

    const page = response.results[0] as any;
    const properties = page.properties;

    // postTimes: JSON配列形式またはカンマ区切りテキスト
    let postTimes = DEFAULT_SETTINGS.postTimes;
    const postTimesText = properties.postTimes?.rich_text?.[0]?.plain_text;
    if (postTimesText) {
      try {
        const parsed = JSON.parse(postTimesText);
        if (Array.isArray(parsed)) {
          postTimes = parsed;
        }
      } catch {
        postTimes = postTimesText.split(',').map((t: string) => t.trim());
      }
    }

    // activeDays: マルチセレクトまたはテキスト
    let activeDays = DEFAULT_SETTINGS.activeDays;
    if (properties.activeDays?.multi_select) {
      activeDays = properties.activeDays.multi_select.map((item: any) => item.name.toLowerCase());
    } else if (properties.activeDays?.rich_text?.[0]?.plain_text) {
      activeDays = properties.activeDays.rich_text[0].plain_text.split(',').map((d: string) => d.trim().toLowerCase());
    }

    // topics: JSON配列、カンマ区切り、または単一テキスト
    let topics = DEFAULT_SETTINGS.topics;
    const topicsText = properties.topics?.rich_text?.[0]?.plain_text || properties.topic?.rich_text?.[0]?.plain_text;
    if (topicsText) {
      try {
        const parsed = JSON.parse(topicsText);
        if (Array.isArray(parsed)) {
          topics = parsed;
        }
      } catch {
        topics = topicsText.split(',').map((t: string) => t.trim());
      }
    }

    // 投稿生成関連の設定を取得
    const settings: PostSettings = {
      // スケジュール関連
      postTimes,
      activeDays,
      topics,
      enabled: getCheckboxProperty(properties, 'enabled', DEFAULT_SETTINGS.enabled),
      // 投稿生成関連
      persona: getTextProperty(properties, 'persona', DEFAULT_SETTINGS.persona),
      tone: getTextProperty(properties, 'tone', DEFAULT_SETTINGS.tone),
      contentDirection: getTextProperty(properties, 'contentDirection', DEFAULT_SETTINGS.contentDirection),
      maxLength: getNumberProperty(properties, 'maxLength', DEFAULT_SETTINGS.maxLength),
      useEmoji: getCheckboxProperty(properties, 'useEmoji', DEFAULT_SETTINGS.useEmoji),
      useHashtags: getCheckboxProperty(properties, 'useHashtags', DEFAULT_SETTINGS.useHashtags),
      hashtagRules: getTextProperty(properties, 'hashtagRules', DEFAULT_SETTINGS.hashtagRules),
      mustInclude: getTextProperty(properties, 'mustInclude', DEFAULT_SETTINGS.mustInclude),
      mustExclude: getTextProperty(properties, 'mustExclude', DEFAULT_SETTINGS.mustExclude),
      structureTemplate: getTextProperty(properties, 'structureTemplate', DEFAULT_SETTINGS.structureTemplate),
      referenceInfo: getTextProperty(properties, 'referenceInfo', DEFAULT_SETTINGS.referenceInfo),
      examplePosts: getTextProperty(properties, 'examplePosts', DEFAULT_SETTINGS.examplePosts),
    };

    console.log('Settings loaded from Notion:', settings);
    return settings;
  } catch (error) {
    console.error('Error fetching settings from Notion:', error);
    return DEFAULT_SETTINGS;
  }
}

// 現在時刻がスケジュールに含まれるかチェック
function isScheduledTime(settings: PostSettings): { scheduled: boolean; reason: string } {
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
function buildPrompt(topic: string, settings: PostSettings): string {
  let prompt = `あなたはX（旧Twitter）の投稿を作成するアシスタントです。

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
- ネガティブな内容は避ける`;

  // 絵文字設定
  if (settings.useEmoji) {
    prompt += `\n- 適切な絵文字を1-2個使用`;
  } else {
    prompt += `\n- 絵文字は使用しない`;
  }

  // ハッシュタグ設定
  if (settings.useHashtags) {
    prompt += `\n- ${settings.hashtagRules || '関連するハッシュタグを1-2個追加'}`;
  } else {
    prompt += `\n- ハッシュタグは使用しない`;
  }

  // 含める要素
  if (settings.mustInclude) {
    prompt += `\n\n【必ず含める要素】\n${settings.mustInclude}`;
  }

  // 避ける要素
  if (settings.mustExclude) {
    prompt += `\n\n【避ける要素】\n${settings.mustExclude}`;
  }

  // 構成テンプレート
  if (settings.structureTemplate) {
    prompt += `\n\n【構成テンプレート】\n${settings.structureTemplate}`;
  }

  // 参考情報
  if (settings.referenceInfo) {
    prompt += `\n\n【参考情報】\n${settings.referenceInfo}`;
  }

  // 参考投稿例
  if (settings.examplePosts) {
    prompt += `\n\n【参考投稿例】\n${settings.examplePosts}`;
  }

  prompt += `\n\n投稿文のみを出力してください（説明や補足は不要）。`;

  return prompt;
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
    const prompt = buildPrompt(topic, settings);

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

    // 文字数チェック（Xの最大文字数は280）
    const maxTweetLength = Math.min(settings.maxLength, 280);
    if (postContent.length > maxTweetLength) {
      console.warn(`Content exceeds ${maxTweetLength} characters, truncating...`);
    }

    // Xに投稿
    const twitterClient = new TwitterApi({
      appKey: xApiKey,
      appSecret: xApiSecret,
      accessToken: xAccessToken,
      accessSecret: xAccessSecret,
    });

    const tweetResult = await twitterClient.v2.tweet(postContent.slice(0, maxTweetLength));

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
