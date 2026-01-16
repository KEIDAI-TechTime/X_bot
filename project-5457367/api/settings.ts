import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from '@notionhq/client';

// Notion設定のインターフェース
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

// Notionから設定を取得
async function getSettingsFromNotion(notion: Client, databaseId: string): Promise<ScheduleSettings | null> {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: 1,
      sorts: [{ property: 'updatedAt', direction: 'descending' }],
    });

    if (response.results.length === 0) {
      return null;
    }

    const page = response.results[0] as any;
    const properties = page.properties;

    return {
      postTimes: properties.postTimes?.rich_text?.[0]?.plain_text?.split(',').map((t: string) => t.trim()) || DEFAULT_SETTINGS.postTimes,
      activeDays: properties.activeDays?.rich_text?.[0]?.plain_text?.split(',').map((d: string) => d.trim()) || DEFAULT_SETTINGS.activeDays,
      topics: properties.topics?.rich_text?.[0]?.plain_text?.split(',').map((t: string) => t.trim()) || DEFAULT_SETTINGS.topics,
      enabled: properties.enabled?.checkbox ?? true,
    };
  } catch (error) {
    console.error('Error fetching settings from Notion:', error);
    return null;
  }
}

// Notionに設定を保存
async function saveSettingsToNotion(notion: Client, databaseId: string, settings: ScheduleSettings): Promise<boolean> {
  try {
    // 既存のページを検索
    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: 1,
    });

    const properties = {
      postTimes: {
        rich_text: [{ text: { content: settings.postTimes.join(',') } }],
      },
      activeDays: {
        rich_text: [{ text: { content: settings.activeDays.join(',') } }],
      },
      topics: {
        rich_text: [{ text: { content: settings.topics.join(',') } }],
      },
      enabled: {
        checkbox: settings.enabled,
      },
      updatedAt: {
        date: { start: new Date().toISOString() },
      },
    };

    if (response.results.length > 0) {
      // 既存のページを更新
      await notion.pages.update({
        page_id: response.results[0].id,
        properties,
      });
    } else {
      // 新規ページを作成
      await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
          Name: { title: [{ text: { content: 'Schedule Settings' } }] },
          ...properties,
        },
      });
    }

    return true;
  } catch (error) {
    console.error('Error saving settings to Notion:', error);
    return false;
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
    const settings = await getSettingsFromNotion(notion, settingsDatabaseId);
    return res.status(200).json({
      success: true,
      settings: settings || DEFAULT_SETTINGS,
    });
  }

  // POST/PUT: 設定を保存
  if (req.method === 'POST' || req.method === 'PUT') {
    const { postTimes, activeDays, topics, enabled } = req.body;

    const settings: ScheduleSettings = {
      postTimes: postTimes || DEFAULT_SETTINGS.postTimes,
      activeDays: activeDays || DEFAULT_SETTINGS.activeDays,
      topics: topics || DEFAULT_SETTINGS.topics,
      enabled: enabled ?? true,
    };

    const success = await saveSettingsToNotion(notion, settingsDatabaseId, settings);

    if (success) {
      return res.status(200).json({ success: true, settings });
    } else {
      return res.status(500).json({ error: 'Failed to save settings' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
