import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from '@notionhq/client';

// 投稿履歴の型
interface PostHistoryItem {
  id: string;
  content: string;
  postedAt: string;
  status: 'success' | 'failed';
  tweetId?: string;
  errorMessage?: string;
}

// Notionから投稿履歴を取得
async function getHistoryFromNotion(notion: Client, databaseId: string): Promise<PostHistoryItem[]> {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [
        {
          property: 'postedAt',
          direction: 'descending',
        },
      ],
      page_size: 100,
    });

    const history: PostHistoryItem[] = [];

    for (const page of response.results) {
      const properties = (page as any).properties;

      const content = properties.content?.rich_text?.[0]?.plain_text || '';
      const postedAt = properties.postedAt?.date?.start || new Date().toISOString();
      const status = properties.status?.select?.name === 'failed' ? 'failed' : 'success';
      const tweetId = properties.tweetId?.rich_text?.[0]?.plain_text;
      const errorMessage = properties.errorMessage?.rich_text?.[0]?.plain_text;

      history.push({
        id: (page as any).id,
        content,
        postedAt,
        status,
        tweetId,
        errorMessage,
      });
    }

    return history;
  } catch (error) {
    console.error('Error fetching history from Notion:', error);
    return [];
  }
}

// Notionに投稿履歴を保存
async function saveHistoryToNotion(
  notion: Client,
  databaseId: string,
  item: Omit<PostHistoryItem, 'id'>
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const properties: any = {
      content: {
        rich_text: [{ text: { content: item.content.slice(0, 2000) } }],
      },
      postedAt: {
        date: { start: item.postedAt },
      },
      status: {
        select: { name: item.status },
      },
    };

    if (item.tweetId) {
      properties.tweetId = {
        rich_text: [{ text: { content: item.tweetId } }],
      };
    }

    if (item.errorMessage) {
      properties.errorMessage = {
        rich_text: [{ text: { content: item.errorMessage.slice(0, 2000) } }],
      };
    }

    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties,
    });

    return { success: true, id: response.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error saving history to Notion:', errorMessage, error);
    return { success: false, error: errorMessage };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORSヘッダー
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const notionApiKey = process.env.NOTION_API_KEY;
  const historyDatabaseId = process.env.NOTION_HISTORY_DATABASE_ID;

  if (!notionApiKey || !historyDatabaseId) {
    return res.status(500).json({
      error: 'Notion credentials not configured',
      details: 'NOTION_API_KEY and NOTION_HISTORY_DATABASE_ID are required',
    });
  }

  const notion = new Client({ auth: notionApiKey });

  // GET: 履歴を取得
  if (req.method === 'GET') {
    const history = await getHistoryFromNotion(notion, historyDatabaseId);
    return res.status(200).json({
      success: true,
      history,
    });
  }

  // POST: 履歴を保存
  if (req.method === 'POST') {
    const { content, status, tweetId, errorMessage } = req.body;

    if (!content || !status) {
      return res.status(400).json({ error: 'content and status are required' });
    }

    const item: Omit<PostHistoryItem, 'id'> = {
      content,
      postedAt: new Date().toISOString(),
      status,
      tweetId,
      errorMessage,
    };

    const result = await saveHistoryToNotion(notion, historyDatabaseId, item);

    if (result.success) {
      return res.status(200).json({ success: true, id: result.id });
    } else {
      return res.status(500).json({ error: 'Failed to save history', details: result.error });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
