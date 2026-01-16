import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from '@notionhq/client';

// 投稿設定のインターフェース（フル）
interface PostSettings {
  // スケジュール関連
  postTimes: string[];
  activeDays: string[];
  topics: string[];
  enabled: boolean;
  // 投稿生成関連
  persona?: string;
  tone?: string;
  contentDirection?: string;
  maxLength?: number;
  useEmoji?: boolean;
  useHashtags?: boolean;
  hashtagRules?: string;
  mustInclude?: string;
  mustExclude?: string;
  structureTemplate?: string;
  referenceInfo?: string;
  examplePosts?: string;
}

// デフォルト設定
const DEFAULT_SETTINGS: PostSettings = {
  postTimes: ['07:00', '12:00', '19:00'],
  activeDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
  topics: ['AI・機械学習の最新動向', 'クラウドサービス・SaaS', 'プログラミング・開発ツール'],
  enabled: true,
};

// テキストプロパティを取得するヘルパー
function getTextProperty(properties: any, key: string): string | undefined {
  return properties[key]?.rich_text?.[0]?.plain_text;
}

// 数値プロパティを取得するヘルパー
function getNumberProperty(properties: any, key: string): number | undefined {
  return properties[key]?.number;
}

// チェックボックスプロパティを取得するヘルパー
function getCheckboxProperty(properties: any, key: string): boolean | undefined {
  if (properties[key]?.checkbox !== undefined) {
    return properties[key].checkbox;
  }
  return undefined;
}

// Notionから設定を取得
async function getSettingsFromNotion(notion: Client, databaseId: string): Promise<{
  settings: PostSettings | null;
  availableProperties?: string[];
  debug?: {
    databaseId: string;
    resultsCount: number;
    error?: string;
  };
}> {
  try {
    console.log('Querying Notion database:', databaseId);
    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: 1,
    });

    console.log('Query results count:', response.results.length);

    if (response.results.length === 0) {
      return {
        settings: null,
        debug: {
          databaseId,
          resultsCount: 0,
        }
      };
    }

    const page = response.results[0] as any;
    const properties = page.properties;

    // デバッグ用: 利用可能なプロパティ名を取得
    const availableProperties = Object.keys(properties);
    console.log('Available properties:', availableProperties);

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

    // enabled: チェックボックス
    const enabled = properties.enabled?.checkbox ?? true;

    // 投稿生成関連の設定
    const settings: PostSettings = {
      postTimes,
      activeDays,
      topics,
      enabled,
      persona: getTextProperty(properties, 'persona'),
      tone: getTextProperty(properties, 'tone'),
      contentDirection: getTextProperty(properties, 'contentDirection'),
      maxLength: getNumberProperty(properties, 'maxLength'),
      useEmoji: getCheckboxProperty(properties, 'useEmoji'),
      useHashtags: getCheckboxProperty(properties, 'useHashtags'),
      hashtagRules: getTextProperty(properties, 'hashtagRules'),
      mustInclude: getTextProperty(properties, 'mustInclude'),
      mustExclude: getTextProperty(properties, 'mustExclude'),
      structureTemplate: getTextProperty(properties, 'structureTemplate'),
      referenceInfo: getTextProperty(properties, 'referenceInfo'),
      examplePosts: getTextProperty(properties, 'examplePosts'),
    };

    return {
      settings,
      availableProperties,
      debug: {
        databaseId,
        resultsCount: response.results.length,
      }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching settings from Notion:', errorMessage, error);
    return {
      settings: null,
      debug: {
        databaseId,
        resultsCount: -1,
        error: errorMessage,
      }
    };
  }
}

// テキストプロパティを設定するヘルパー
function setTextProperty(properties: any, existingProps: any, key: string, value: string | undefined) {
  if (value !== undefined && existingProps[key]?.type === 'rich_text') {
    properties[key] = {
      rich_text: [{ text: { content: value } }],
    };
  }
}

// 数値プロパティを設定するヘルパー
function setNumberProperty(properties: any, existingProps: any, key: string, value: number | undefined) {
  if (value !== undefined && existingProps[key]?.type === 'number') {
    properties[key] = { number: value };
  }
}

// チェックボックスプロパティを設定するヘルパー
function setCheckboxProperty(properties: any, existingProps: any, key: string, value: boolean | undefined) {
  if (value !== undefined && existingProps[key]?.type === 'checkbox') {
    properties[key] = { checkbox: value };
  }
}

// Notionに設定を保存
async function saveSettingsToNotion(notion: Client, databaseId: string, settings: PostSettings): Promise<{ success: boolean; error?: string }> {
  try {
    // 既存のページを検索
    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: 1,
    });

    // postTimesはJSON配列形式で保存
    const postTimesJson = JSON.stringify(settings.postTimes);

    // topicsはJSON配列形式で保存
    const topicsJson = JSON.stringify(settings.topics);

    // activeDaysはカンマ区切りテキストで保存（multi_selectが存在しない場合に対応）
    const activeDaysText = settings.activeDays.join(',');

    if (response.results.length > 0) {
      const existingPage = response.results[0] as any;
      const existingProps = existingPage.properties;

      // 存在するプロパティのみ更新
      const properties: any = {};

      // スケジュール関連
      if (existingProps.enabled) {
        properties.enabled = { checkbox: settings.enabled };
      }

      if (existingProps.postTimes) {
        properties.postTimes = {
          rich_text: [{ text: { content: postTimesJson } }],
        };
      }

      // activeDays: multi_selectまたはrich_text
      if (existingProps.activeDays?.type === 'multi_select') {
        properties.activeDays = {
          multi_select: settings.activeDays.map(day => ({ name: day })),
        };
      } else if (existingProps.activeDays?.type === 'rich_text') {
        properties.activeDays = {
          rich_text: [{ text: { content: activeDaysText } }],
        };
      }

      // topic または topics
      if (existingProps.topics) {
        properties.topics = {
          rich_text: [{ text: { content: topicsJson } }],
        };
      } else if (existingProps.topic) {
        properties.topic = {
          rich_text: [{ text: { content: topicsJson } }],
        };
      }

      // 投稿生成関連の設定を保存
      setTextProperty(properties, existingProps, 'persona', settings.persona);
      setTextProperty(properties, existingProps, 'tone', settings.tone);
      setTextProperty(properties, existingProps, 'contentDirection', settings.contentDirection);
      setNumberProperty(properties, existingProps, 'maxLength', settings.maxLength);
      setCheckboxProperty(properties, existingProps, 'useEmoji', settings.useEmoji);
      setCheckboxProperty(properties, existingProps, 'useHashtags', settings.useHashtags);
      setTextProperty(properties, existingProps, 'hashtagRules', settings.hashtagRules);
      setTextProperty(properties, existingProps, 'mustInclude', settings.mustInclude);
      setTextProperty(properties, existingProps, 'mustExclude', settings.mustExclude);
      setTextProperty(properties, existingProps, 'structureTemplate', settings.structureTemplate);
      setTextProperty(properties, existingProps, 'referenceInfo', settings.referenceInfo);
      setTextProperty(properties, existingProps, 'examplePosts', settings.examplePosts);

      console.log('Updating Notion page with properties:', Object.keys(properties));

      await notion.pages.update({
        page_id: existingPage.id,
        properties,
      });
    } else {
      // 新規ページを作成
      console.log('Creating new Notion page');
      await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
          name: { title: [{ text: { content: 'Schedule Settings' } }] },
          enabled: { checkbox: settings.enabled },
          postTimes: {
            rich_text: [{ text: { content: postTimesJson } }],
          },
          activeDays: {
            rich_text: [{ text: { content: activeDaysText } }],
          },
          topic: {
            rich_text: [{ text: { content: topicsJson } }],
          },
        },
      });
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error saving settings to Notion:', errorMessage, error);
    return { success: false, error: errorMessage };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORSヘッダー
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const notionApiKey = process.env.NOTION_API_KEY;
  const settingsDatabaseId = process.env.NOTION_SETTINGS_DATABASE_ID;

  if (!notionApiKey || !settingsDatabaseId) {
    return res.status(500).json({ error: 'Notion credentials not configured' });
  }

  const notion = new Client({ auth: notionApiKey });

  // GET: 設定を取得
  if (req.method === 'GET') {
    const result = await getSettingsFromNotion(notion, settingsDatabaseId);
    return res.status(200).json({
      success: true,
      settings: result.settings || DEFAULT_SETTINGS,
      availableProperties: result.availableProperties || [],
      debug: result.debug,
    });
  }

  // POST/PUT: 設定を保存
  if (req.method === 'POST' || req.method === 'PUT') {
    const {
      postTimes,
      activeDays,
      topics,
      enabled,
      persona,
      tone,
      contentDirection,
      maxLength,
      useEmoji,
      useHashtags,
      hashtagRules,
      mustInclude,
      mustExclude,
      structureTemplate,
      referenceInfo,
      examplePosts,
    } = req.body;

    const settings: PostSettings = {
      postTimes: postTimes || DEFAULT_SETTINGS.postTimes,
      activeDays: activeDays || DEFAULT_SETTINGS.activeDays,
      topics: topics || DEFAULT_SETTINGS.topics,
      enabled: enabled ?? true,
      persona,
      tone,
      contentDirection,
      maxLength,
      useEmoji,
      useHashtags,
      hashtagRules,
      mustInclude,
      mustExclude,
      structureTemplate,
      referenceInfo,
      examplePosts,
    };

    const result = await saveSettingsToNotion(notion, settingsDatabaseId, settings);

    if (result.success) {
      return res.status(200).json({ success: true, settings });
    } else {
      return res.status(500).json({ error: 'Failed to save settings', details: result.error });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
