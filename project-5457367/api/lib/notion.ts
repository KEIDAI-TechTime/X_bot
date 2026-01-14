import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const SETTINGS_DATABASE_ID = process.env.NOTION_SETTINGS_DATABASE_ID!;
const HISTORY_DATABASE_ID = process.env.NOTION_HISTORY_DATABASE_ID!;

export interface PostSettings {
  id: string;
  name: string;
  enabled: boolean;
  persona: string;
  tone: string;
  topic: string;
  contentDirection: string;
  mustInclude: string;
  mustExclude: string;
  structureTemplate: string;
  maxLength: number;
  useEmoji: boolean;
  useHashtags: boolean;
  hashtagRules: string;
  referenceInfo: string;
  examplePosts: string;
  postTimes: string[];
  activeDays: string[];
  timezone: string;
  maxPostsPerDay: number;
}

export interface PostHistory {
  id: string;
  settingId: string;
  postedAt: string;
  content: string;
  status: 'success' | 'failed';
  errorMessage: string | null;
}

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

export async function getSettings(): Promise<PostSettings | null> {
  try {
    const response = await notion.databases.query({
      database_id: SETTINGS_DATABASE_ID,
      page_size: 1,
    });
    if (response.results.length === 0) return null;
    const page = response.results[0] as any;
    const props = page.properties;

    let postTimes: string[] = [];
    const postTimesRaw = getPropertyValue(props.postTimes);
    if (postTimesRaw) {
      try {
        postTimes = JSON.parse(postTimesRaw);
      } catch {
        postTimes = postTimesRaw.split(',').map((t: string) => t.trim());
      }
    }

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
      postTimes,
      activeDays: getPropertyValue(props.activeDays) || [],
      timezone: getPropertyValue(props.timezone) || 'Asia/Tokyo',
      maxPostsPerDay: getPropertyValue(props.maxPostsPerDay) || 10,
    };
  } catch (error) {
    console.error('Failed to get settings:', error);
    throw error;
  }
}

export async function updateSettings(settings: Partial<PostSettings>): Promise<PostSettings> {
  let existingSettings = await getSettings();
  const props: any = {};

  if (settings.name !== undefined) props.name = { title: [{ text: { content: settings.name } }] };
  if (settings.enabled !== undefined) props.enabled = { checkbox: settings.enabled };
  if (settings.persona !== undefined) props.persona = { rich_text: [{ text: { content: settings.persona } }] };
  if (settings.tone !== undefined) props.tone = { rich_text: [{ text: { content: settings.tone } }] };
  if (settings.topic !== undefined) props.topic = { rich_text: [{ text: { content: settings.topic } }] };
  if (settings.contentDirection !== undefined) props.contentDirection = { rich_text: [{ text: { content: settings.contentDirection } }] };
  if (settings.mustInclude !== undefined) props.mustInclude = { rich_text: [{ text: { content: settings.mustInclude } }] };
  if (settings.mustExclude !== undefined) props.mustExclude = { rich_text: [{ text: { content: settings.mustExclude } }] };
  if (settings.structureTemplate !== undefined) props.structureTemplate = { rich_text: [{ text: { content: settings.structureTemplate } }] };
  if (settings.maxLength !== undefined) props.maxLength = { number: settings.maxLength };
  if (settings.useEmoji !== undefined) props.useEmoji = { checkbox: settings.useEmoji };
  if (settings.useHashtags !== undefined) props.useHashtags = { checkbox: settings.useHashtags };
  if (settings.hashtagRules !== undefined) props.hashtagRules = { rich_text: [{ text: { content: settings.hashtagRules } }] };
  if (settings.referenceInfo !== undefined) props.referenceInfo = { rich_text: [{ text: { content: settings.referenceInfo } }] };
  if (settings.examplePosts !== undefined) props.examplePosts = { rich_text: [{ text: { content: settings.examplePosts } }] };
  if (settings.postTimes !== undefined) props.postTimes = { rich_text: [{ text: { content: JSON.stringify(settings.postTimes) } }] };
  if (settings.activeDays !== undefined) props.activeDays = { multi_select: settings.activeDays.map(day => ({ name: day })) };
  if (settings.timezone !== undefined) props.timezone = { rich_text: [{ text: { content: settings.timezone } }] };
  if (settings.maxPostsPerDay !== undefined) props.maxPostsPerDay = { number: settings.maxPostsPerDay };

  if (!existingSettings) {
    await notion.pages.create({
      parent: { database_id: SETTINGS_DATABASE_ID },
      properties: props,
    });
  } else {
    await notion.pages.update({
      page_id: existingSettings.id,
      properties: props,
    });
  }
  return (await getSettings())!;
}

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
    console.error('Failed to get history:', error);
    throw error;
  }
}

export async function addHistory(history: Omit<PostHistory, 'id'>): Promise<PostHistory> {
  const response = await notion.pages.create({
    parent: { database_id: HISTORY_DATABASE_ID },
    properties: {
      content: { title: [{ text: { content: history.content } }] },
      settingId: { rich_text: [{ text: { content: history.settingId } }] },
      postedAt: { date: { start: history.postedAt } },
      status: { select: { name: history.status } },
      errorMessage: { rich_text: [{ text: { content: history.errorMessage || '' } }] },
    },
  });
  return { id: response.id, ...history };
}

export async function getTodayPostCount(): Promise<number> {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const response = await notion.databases.query({
      database_id: HISTORY_DATABASE_ID,
      filter: {
        and: [
          { property: 'postedAt', date: { on_or_after: startOfDay } },
          { property: 'status', select: { equals: 'success' } },
        ],
      },
    });
    return response.results.length;
  } catch (error) {
    console.error('Failed to get today post count:', error);
    return 0;
  }
}

export async function getStatus() {
  const settings = await getSettings();
  const history = await getHistory(1000);
  const todayCount = await getTodayPostCount();
  const successCount = history.filter(h => h.status === 'success').length;
  const totalCount = history.length;
  const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;

  let nextPostTime: string | null = null;
  if (settings?.enabled && settings.postTimes.length > 0) {
    // Get current time in JST (UTC+9)
    const now = new Date();
    const jstOffset = 9 * 60 * 60 * 1000; // 9 hours in milliseconds
    const nowJST = new Date(now.getTime() + jstOffset);
    const currentTime = `${nowJST.getUTCHours().toString().padStart(2, '0')}:${nowJST.getUTCMinutes().toString().padStart(2, '0')}`;

    const times = settings.postTimes.sort();
    const nextTime = times.find(t => t > currentTime);

    if (nextTime) {
      // Create date for today in JST, then convert to UTC
      const [hours, minutes] = nextTime.split(':');
      const nextDateJST = new Date(Date.UTC(
        nowJST.getUTCFullYear(),
        nowJST.getUTCMonth(),
        nowJST.getUTCDate(),
        parseInt(hours),
        parseInt(minutes),
        0
      ));
      // Subtract JST offset to get UTC time
      nextPostTime = new Date(nextDateJST.getTime() - jstOffset).toISOString();
    } else if (times.length > 0) {
      // Use first time tomorrow
      const [hours, minutes] = times[0].split(':');
      const nextDateJST = new Date(Date.UTC(
        nowJST.getUTCFullYear(),
        nowJST.getUTCMonth(),
        nowJST.getUTCDate() + 1,
        parseInt(hours),
        parseInt(minutes),
        0
      ));
      // Subtract JST offset to get UTC time
      nextPostTime = new Date(nextDateJST.getTime() - jstOffset).toISOString();
    }
  }

  return {
    totalPosts: totalCount,
    successRate: Math.round(successRate * 10) / 10,
    todayPosts: todayCount,
    nextPostTime,
    isRunning: settings?.enabled ?? false,
  };
}
