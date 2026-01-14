import { Client } from '@notionhq/client';
import type { PostSettings, PostHistory, BotStatus } from '../types/index.js';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const SETTINGS_DATABASE_ID = process.env.NOTION_SETTINGS_DATABASE_ID!;
const HISTORY_DATABASE_ID = process.env.NOTION_HISTORY_DATABASE_ID!;

// ヘルパー関数: Notionのプロパティ値を取得
function getPropertyValue(property: any): any {
  if (!property) return null;

  switch (property.type) {
    case 'title':
      return property.title[0]?.plain_text || '';
    case 'rich_text':
      return property.rich_text[0]?.plain_text || '';
    case 'number':
      return property.number;
    case 'checkbox':
      return property.checkbox;
    case 'select':
      return property.select?.name || '';
    case 'multi_select':
      return property.multi_select.map((s: any) => s.name);
    case 'date':
      return property.date?.start || null;
    default:
      return null;
  }
}

// 投稿設定を取得
export async function getSettings(): Promise<PostSettings | null> {
  try {
    const response = await notion.databases.query({
      database_id: SETTINGS_DATABASE_ID,
      page_size: 1,
    });

    if (response.results.length === 0) {
      return null;
    }

    const page = response.results[0] as any;
    const props = page.properties;

    return {
      id: page.id,
      name: getPropertyValue(props.name) || 'デフォルト設定',
      enabled: getPropertyValue(props.enabled) ?? false,
      persona: getPropertyValue(props.persona) || '',
      tone: getPropertyValue(props.tone) || '',
      topic: getPropertyValue(props.topic) || '',
      contentDirection: getPropertyValue(props.contentDirection) || '',
      mustInclude: getPropertyValue(props.mustInclude) || '',
      mustExclude: getPropertyValue(props.mustExclude) || '',
      structureTemplate: getPropertyValue(props.structureTemplate) || '',
      maxLength: getPropertyValue(props.maxLength) || 280,
      useEmoji: getPropertyValue(props.useEmoji) ?? true,
      useHashtags: getPropertyValue(props.useHashtags) ?? true,
      hashtagRules: getPropertyValue(props.hashtagRules) || '',
      referenceInfo: getPropertyValue(props.referenceInfo) || '',
      examplePosts: getPropertyValue(props.examplePosts) || '',
      postTimes: getPropertyValue(props.postTimes) || [],
      activeDays: getPropertyValue(props.activeDays) || [],
      timezone: getPropertyValue(props.timezone) || 'Asia/Tokyo',
      maxPostsPerDay: getPropertyValue(props.maxPostsPerDay) || 10,
    };
  } catch (error) {
    console.error('Failed to get settings from Notion:', error);
    throw error;
  }
}

// 投稿設定を更新
export async function updateSettings(settings: Partial<PostSettings>): Promise<PostSettings> {
  try {
    // 既存の設定を取得
    let existingSettings = await getSettings();
    let pageId: string;

    if (!existingSettings) {
      // 新規作成
      const response = await notion.pages.create({
        parent: { database_id: SETTINGS_DATABASE_ID },
        properties: buildSettingsProperties(settings),
      });
      pageId = response.id;
    } else {
      // 更新
      pageId = existingSettings.id;
      await notion.pages.update({
        page_id: pageId,
        properties: buildSettingsProperties(settings),
      });
    }

    // 更新後の設定を取得して返す
    const updated = await getSettings();
    return updated!;
  } catch (error) {
    console.error('Failed to update settings in Notion:', error);
    throw error;
  }
}

// 設定プロパティをNotionの形式に変換
function buildSettingsProperties(settings: Partial<PostSettings>): any {
  const props: any = {};

  if (settings.name !== undefined) {
    props.name = { title: [{ text: { content: settings.name } }] };
  }
  if (settings.enabled !== undefined) {
    props.enabled = { checkbox: settings.enabled };
  }
  if (settings.persona !== undefined) {
    props.persona = { rich_text: [{ text: { content: settings.persona } }] };
  }
  if (settings.tone !== undefined) {
    props.tone = { rich_text: [{ text: { content: settings.tone } }] };
  }
  if (settings.topic !== undefined) {
    props.topic = { rich_text: [{ text: { content: settings.topic } }] };
  }
  if (settings.contentDirection !== undefined) {
    props.contentDirection = { rich_text: [{ text: { content: settings.contentDirection } }] };
  }
  if (settings.mustInclude !== undefined) {
    props.mustInclude = { rich_text: [{ text: { content: settings.mustInclude } }] };
  }
  if (settings.mustExclude !== undefined) {
    props.mustExclude = { rich_text: [{ text: { content: settings.mustExclude } }] };
  }
  if (settings.structureTemplate !== undefined) {
    props.structureTemplate = { rich_text: [{ text: { content: settings.structureTemplate } }] };
  }
  if (settings.maxLength !== undefined) {
    props.maxLength = { number: settings.maxLength };
  }
  if (settings.useEmoji !== undefined) {
    props.useEmoji = { checkbox: settings.useEmoji };
  }
  if (settings.useHashtags !== undefined) {
    props.useHashtags = { checkbox: settings.useHashtags };
  }
  if (settings.hashtagRules !== undefined) {
    props.hashtagRules = { rich_text: [{ text: { content: settings.hashtagRules } }] };
  }
  if (settings.referenceInfo !== undefined) {
    props.referenceInfo = { rich_text: [{ text: { content: settings.referenceInfo } }] };
  }
  if (settings.examplePosts !== undefined) {
    props.examplePosts = { rich_text: [{ text: { content: settings.examplePosts } }] };
  }
  if (settings.postTimes !== undefined) {
    props.postTimes = { rich_text: [{ text: { content: JSON.stringify(settings.postTimes) } }] };
  }
  if (settings.activeDays !== undefined) {
    props.activeDays = { multi_select: settings.activeDays.map(day => ({ name: day })) };
  }
  if (settings.timezone !== undefined) {
    props.timezone = { rich_text: [{ text: { content: settings.timezone } }] };
  }
  if (settings.maxPostsPerDay !== undefined) {
    props.maxPostsPerDay = { number: settings.maxPostsPerDay };
  }

  return props;
}

// 投稿履歴を取得
export async function getHistory(limit: number = 50): Promise<PostHistory[]> {
  try {
    const response = await notion.databases.query({
      database_id: HISTORY_DATABASE_ID,
      page_size: limit,
      sorts: [{ property: 'postedAt', direction: 'descending' }],
    });

    return response.results.map((page: any) => {
      const props = page.properties;
      return {
        id: page.id,
        settingId: getPropertyValue(props.settingId) || '',
        postedAt: getPropertyValue(props.postedAt) || '',
        content: getPropertyValue(props.content) || '',
        status: getPropertyValue(props.status) || 'failed',
        errorMessage: getPropertyValue(props.errorMessage) || null,
      };
    });
  } catch (error) {
    console.error('Failed to get history from Notion:', error);
    throw error;
  }
}

// 投稿履歴を追加
export async function addHistory(history: Omit<PostHistory, 'id'>): Promise<PostHistory> {
  try {
    const response = await notion.pages.create({
      parent: { database_id: HISTORY_DATABASE_ID },
      properties: {
        settingId: { rich_text: [{ text: { content: history.settingId } }] },
        postedAt: { date: { start: history.postedAt } },
        content: { title: [{ text: { content: history.content } }] },
        status: { select: { name: history.status } },
        errorMessage: { rich_text: [{ text: { content: history.errorMessage || '' } }] },
      },
    });

    return {
      id: response.id,
      ...history,
    };
  } catch (error) {
    console.error('Failed to add history to Notion:', error);
    throw error;
  }
}

// 今日の投稿数を取得
export async function getTodayPostCount(): Promise<number> {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();

    const response = await notion.databases.query({
      database_id: HISTORY_DATABASE_ID,
      filter: {
        and: [
          {
            property: 'postedAt',
            date: { on_or_after: startOfDay },
          },
          {
            property: 'status',
            select: { equals: 'success' },
          },
        ],
      },
    });

    return response.results.length;
  } catch (error) {
    console.error('Failed to get today post count:', error);
    return 0;
  }
}

// ステータスを取得
export async function getStatus(): Promise<BotStatus> {
  try {
    const settings = await getSettings();
    const history = await getHistory(1000);
    const todayCount = await getTodayPostCount();

    const successCount = history.filter(h => h.status === 'success').length;
    const totalCount = history.length;
    const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;

    // 次回投稿時間を計算
    let nextPostTime: string | null = null;
    if (settings?.enabled && settings.postTimes.length > 0) {
      const now = new Date();
      const times = settings.postTimes.sort();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      // 今日の残りの投稿時間を探す
      const nextTime = times.find(t => t > currentTime);
      if (nextTime) {
        const [hours, minutes] = nextTime.split(':');
        const nextDate = new Date(now);
        nextDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        nextPostTime = nextDate.toISOString();
      } else if (times.length > 0) {
        // 明日の最初の投稿時間
        const [hours, minutes] = times[0].split(':');
        const nextDate = new Date(now);
        nextDate.setDate(nextDate.getDate() + 1);
        nextDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        nextPostTime = nextDate.toISOString();
      }
    }

    return {
      totalPosts: totalCount,
      successRate: Math.round(successRate * 10) / 10,
      todayPosts: todayCount,
      nextPostTime,
      isRunning: settings?.enabled ?? false,
    };
  } catch (error) {
    console.error('Failed to get status:', error);
    return {
      totalPosts: 0,
      successRate: 0,
      todayPosts: 0,
      nextPostTime: null,
      isRunning: false,
    };
  }
}
