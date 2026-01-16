import type { VercelRequest, VercelResponse } from '@vercel/node';
import { TwitterApi } from 'twitter-api-v2';
import Anthropic from '@anthropic-ai/sdk';
import { Client } from '@notionhq/client';

// ライティングルール型
interface WritingRules {
  readabilityLevel?: string;
  hiraganaRatio?: number;
  kanjiRatio?: number;
  useHalfWidthNumbers?: boolean;
  maxConsecutiveSameEnding?: number;
  omitConjunctions?: boolean;
  useListFormat?: boolean;
}

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
  // X投稿戦略設定
  contentCategory: string;
  contentFormat: string;
  firstLinePattern: string;
  provenPatterns: string[];
  writingRules: WritingRules;
  // アルゴリズム対策
  avoidUrls: boolean;
  preferImages: boolean;
  targetDwellTime: number;
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
  // X投稿戦略設定
  contentCategory: 'empathy',
  contentFormat: 'points_3',
  firstLinePattern: 'method',
  provenPatterns: ['breathing_habit', 'thought_process'],
  writingRules: {
    readabilityLevel: 'middle_school',
    hiraganaRatio: 70,
    kanjiRatio: 30,
    useHalfWidthNumbers: true,
    maxConsecutiveSameEnding: 2,
    omitConjunctions: true,
    useListFormat: true,
  },
  // アルゴリズム対策
  avoidUrls: true,
  preferImages: true,
  targetDwellTime: 120,
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

    // provenPatterns: JSON配列形式またはカンマ区切りテキスト
    let provenPatterns = DEFAULT_SETTINGS.provenPatterns;
    const provenPatternsText = getTextProperty(properties, 'provenPatterns', '');
    if (provenPatternsText) {
      try {
        const parsed = JSON.parse(provenPatternsText);
        if (Array.isArray(parsed)) {
          provenPatterns = parsed;
        }
      } catch {
        provenPatterns = provenPatternsText.split(',').map((t: string) => t.trim());
      }
    }

    // writingRules: JSON形式
    let writingRules = DEFAULT_SETTINGS.writingRules;
    const writingRulesText = getTextProperty(properties, 'writingRules', '');
    if (writingRulesText) {
      try {
        writingRules = { ...DEFAULT_SETTINGS.writingRules, ...JSON.parse(writingRulesText) };
      } catch {
        console.warn('Failed to parse writingRules JSON');
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
      // X投稿戦略設定
      contentCategory: getTextProperty(properties, 'contentCategory', DEFAULT_SETTINGS.contentCategory),
      contentFormat: getTextProperty(properties, 'contentFormat', DEFAULT_SETTINGS.contentFormat),
      firstLinePattern: getTextProperty(properties, 'firstLinePattern', DEFAULT_SETTINGS.firstLinePattern),
      provenPatterns,
      writingRules,
      // アルゴリズム対策
      avoidUrls: getCheckboxProperty(properties, 'avoidUrls', DEFAULT_SETTINGS.avoidUrls),
      preferImages: getCheckboxProperty(properties, 'preferImages', DEFAULT_SETTINGS.preferImages),
      targetDwellTime: getNumberProperty(properties, 'targetDwellTime', DEFAULT_SETTINGS.targetDwellTime),
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

// コンテンツカテゴリの説明
const CONTENT_CATEGORY_LABELS: Record<string, string> = {
  empathy: '共感できる（あるあるネタ）',
  informative: 'ためになる（知識として役立つ）',
  humorous: '笑える（ユーモラス）',
  positive: 'とにかく明るくやる',
};

// コンテンツフォーマットの説明
const CONTENT_FORMAT_LABELS: Record<string, string> = {
  points_3: 'ポイント3つ解説型',
  list_7_8: '7か条・8か条型',
  book_review: '本の画像＋感想一言',
  handwritten: '手書き風',
  memo_text: 'メモ帳テキスト風',
  long_post: '長文ポスト',
};

// 1行目パターンの説明
const FIRST_LINE_PATTERN_LABELS: Record<string, string> = {
  method: '方法提示（〜する方法）',
  question_what: '質問形式（〇〇とは？）',
  question_why: '質問形式（なぜ〜？）',
  secret: '秘密公開（実は〜）',
  target: 'ターゲット指定（〜な人へ）',
};

// 実績のあるパターンの説明
const PROVEN_PATTERN_LABELS: Record<string, string> = {
  thought_process: '〜な人の思考回路を言語化',
  brain_inside: '〜な人の脳内はこんな感じ',
  solution: '〜を何とかしてくれる方法/本',
  breathing_habit: '〜な人が息を吸うようにやっている行動',
  authority: '権威のある人が言っていたよ構文',
  staircase: '階段型構文',
  foolish: '馬鹿だった構文',
};

// 読みやすさレベルの説明
const READABILITY_LABELS: Record<string, string> = {
  middle_school: '中学生でも理解できる',
  high_school: '高校生レベル',
  college: '大学生レベル',
};

// AIプロンプトを生成
function buildPrompt(topic: string, settings: PostSettings): string {
  const wr = settings.writingRules;

  let prompt = `あなたはX（旧Twitter）の投稿を作成するアシスタントです。

【ペルソナ】${settings.persona}
【トーン】${settings.tone}
【トピック】${topic}
【方向性】${settings.contentDirection}
【文字数】${settings.maxLength}文字以内

【コンテンツタイプ】${CONTENT_CATEGORY_LABELS[settings.contentCategory] || settings.contentCategory}
【投稿の型】${CONTENT_FORMAT_LABELS[settings.contentFormat] || settings.contentFormat}
【1行目パターン】${FIRST_LINE_PATTERN_LABELS[settings.firstLinePattern] || settings.firstLinePattern}`;

  // 実績のあるパターン
  if (settings.provenPatterns && settings.provenPatterns.length > 0) {
    const patternLabels = settings.provenPatterns
      .map(p => PROVEN_PATTERN_LABELS[p] || p)
      .join('、');
    prompt += `\n【使用する表現パターン】${patternLabels}`;
  }

  prompt += `\n
以下のライティングルールを厳守してください:`;

  // ライティングルール
  if (wr.readabilityLevel) {
    prompt += `\n- ${READABILITY_LABELS[wr.readabilityLevel] || wr.readabilityLevel}言葉遣い`;
  }
  if (wr.hiraganaRatio !== undefined && wr.kanjiRatio !== undefined) {
    prompt += `\n- ひらがな:漢字の比率は約${wr.hiraganaRatio}:${wr.kanjiRatio}を目安に`;
  }
  if (wr.useHalfWidthNumbers) {
    prompt += `\n- 数字は半角を使用`;
  }
  if (wr.maxConsecutiveSameEnding !== undefined) {
    prompt += `\n- 同じ語尾を${wr.maxConsecutiveSameEnding}回以上続けない（「です」「です」など）`;
  }
  if (wr.omitConjunctions) {
    prompt += `\n- 順接の接続詞（そして、だから等）は省略`;
  }
  if (wr.useListFormat) {
    prompt += `\n- 箇条書きを積極的に使う`;
  }

  // アルゴリズム対策
  prompt += `\n\n【アルゴリズム対策】`;
  if (settings.avoidUrls) {
    prompt += `\n- URLリンクは絶対に含めない`;
  }
  if (settings.targetDwellTime > 0) {
    prompt += `\n- 読者が${settings.targetDwellTime}秒以上滞在したくなる内容に`;
  }
  prompt += `\n- ネガティブな内容は避ける`;

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
