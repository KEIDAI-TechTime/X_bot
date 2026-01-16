import type { VercelRequest, VercelResponse } from '@vercel/node';
import { TwitterApi } from 'twitter-api-v2';
import { Client } from '@notionhq/client';

interface PostHistoryItem {
  id: string;
  tweetId: string;
  content: string;
  postedAt: string;
}

interface TweetMetrics {
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  impressions: number;
}

// Notionから投稿履歴を取得
async function getPostsFromNotion(notion: Client, databaseId: string): Promise<PostHistoryItem[]> {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        and: [
          {
            property: 'status',
            select: { equals: 'success' },
          },
          {
            property: 'tweetId',
            rich_text: { is_not_empty: true },
          },
        ],
      },
      sorts: [{ property: 'postedAt', direction: 'descending' }],
      page_size: 100,
    });

    return response.results.map((page: any) => ({
      id: page.id,
      tweetId: page.properties.tweetId?.rich_text?.[0]?.plain_text || '',
      content: page.properties.content?.rich_text?.[0]?.plain_text || '',
      postedAt: page.properties.postedAt?.date?.start || '',
    })).filter(p => p.tweetId);
  } catch (error) {
    console.error('Error fetching posts from Notion:', error);
    return [];
  }
}

// X APIからツイートのメトリクスを取得
async function getTweetMetrics(
  client: TwitterApi,
  tweetIds: string[]
): Promise<Map<string, TweetMetrics>> {
  const metricsMap = new Map<string, TweetMetrics>();

  if (tweetIds.length === 0) return metricsMap;

  try {
    // X API v2でツイートの公開メトリクスを取得
    // 100件ずつ取得（APIの制限）
    const chunks = [];
    for (let i = 0; i < tweetIds.length; i += 100) {
      chunks.push(tweetIds.slice(i, i + 100));
    }

    for (const chunk of chunks) {
      const response = await client.v2.tweets(chunk, {
        'tweet.fields': ['public_metrics', 'created_at', 'organic_metrics', 'non_public_metrics'],
      });

      if (response.data) {
        for (const tweet of response.data) {
          const metrics = tweet.public_metrics;
          if (metrics) {
            metricsMap.set(tweet.id, {
              likes: metrics.like_count || 0,
              retweets: metrics.retweet_count || 0,
              replies: metrics.reply_count || 0,
              quotes: metrics.quote_count || 0,
              impressions: (tweet as any).organic_metrics?.impression_count ||
                           (tweet as any).non_public_metrics?.impression_count || 0,
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error fetching tweet metrics:', error);
  }

  return metricsMap;
}

// Notionにメトリクスを保存
async function saveMetricsToNotion(
  notion: Client,
  metricsDatabaseId: string,
  tweetId: string,
  postId: string,
  metrics: TweetMetrics,
  hoursAfterPost: number
): Promise<void> {
  try {
    // エンゲージメント率を計算（インプレッションが0の場合は0）
    const totalEngagements = metrics.likes + metrics.retweets + metrics.replies + metrics.quotes;
    const engagementRate = metrics.impressions > 0
      ? Math.round((totalEngagements / metrics.impressions) * 10000) / 100
      : 0;

    await notion.pages.create({
      parent: { database_id: metricsDatabaseId },
      properties: {
        tweetId: {
          rich_text: [{ text: { content: tweetId } }],
        },
        postId: {
          rich_text: [{ text: { content: postId } }],
        },
        likes: { number: metrics.likes },
        retweets: { number: metrics.retweets },
        replies: { number: metrics.replies },
        quotes: { number: metrics.quotes },
        impressions: { number: metrics.impressions },
        engagementRate: { number: engagementRate },
        hoursAfterPost: { number: hoursAfterPost },
        collectedAt: {
          date: { start: new Date().toISOString() },
        },
      },
    });
  } catch (error) {
    console.error('Error saving metrics to Notion:', error);
  }
}

// 投稿履歴のメトリクスを更新
async function updatePostMetrics(
  notion: Client,
  postId: string,
  metrics: TweetMetrics
): Promise<void> {
  try {
    const totalEngagements = metrics.likes + metrics.retweets + metrics.replies + metrics.quotes;
    const engagementRate = metrics.impressions > 0
      ? Math.round((totalEngagements / metrics.impressions) * 10000) / 100
      : 0;

    await notion.pages.update({
      page_id: postId,
      properties: {
        likes: { number: metrics.likes },
        retweets: { number: metrics.retweets },
        replies: { number: metrics.replies },
        quotes: { number: metrics.quotes },
        impressions: { number: metrics.impressions },
        engagementRate: { number: engagementRate },
        metricsUpdatedAt: {
          date: { start: new Date().toISOString() },
        },
      },
    });
  } catch (error) {
    // プロパティが存在しない場合は無視（後で追加される）
    console.log('Note: Some metrics properties may not exist yet:', error);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORSヘッダー
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Cron認証（Vercel Cronからの呼び出しを確認）
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  // 手動実行またはCron実行を許可
  const isManualTrigger = req.method === 'POST';
  const isCronTrigger = authHeader === `Bearer ${cronSecret}`;

  if (!isManualTrigger && !isCronTrigger && cronSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 環境変数チェック
  const notionApiKey = process.env.NOTION_API_KEY;
  const historyDatabaseId = process.env.NOTION_HISTORY_DATABASE_ID;
  const metricsDatabaseId = process.env.NOTION_METRICS_DATABASE_ID;
  const xApiKey = process.env.X_API_KEY;
  const xApiSecret = process.env.X_API_SECRET;
  const xAccessToken = process.env.X_ACCESS_TOKEN;
  const xAccessSecret = process.env.X_ACCESS_SECRET;

  if (!notionApiKey || !historyDatabaseId) {
    return res.status(500).json({ error: 'Notion credentials not configured' });
  }

  if (!xApiKey || !xApiSecret || !xAccessToken || !xAccessSecret) {
    return res.status(500).json({ error: 'X API credentials not configured' });
  }

  const notion = new Client({ auth: notionApiKey });
  const twitterClient = new TwitterApi({
    appKey: xApiKey,
    appSecret: xApiSecret,
    accessToken: xAccessToken,
    accessSecret: xAccessSecret,
  });

  try {
    // 投稿履歴を取得
    const posts = await getPostsFromNotion(notion, historyDatabaseId);

    if (posts.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No posts to collect metrics for',
        collected: 0,
      });
    }

    // ツイートIDのリスト
    const tweetIds = posts.map(p => p.tweetId);

    // X APIからメトリクスを取得
    const metricsMap = await getTweetMetrics(twitterClient, tweetIds);

    let collectedCount = 0;

    // 各投稿のメトリクスを保存
    for (const post of posts) {
      const metrics = metricsMap.get(post.tweetId);
      if (metrics) {
        // 投稿からの経過時間を計算
        const postedAt = new Date(post.postedAt);
        const now = new Date();
        const hoursAfterPost = Math.round((now.getTime() - postedAt.getTime()) / 3600000);

        // 投稿履歴のメトリクスを更新
        await updatePostMetrics(notion, post.id, metrics);

        // メトリクスデータベースが設定されている場合は履歴も保存
        if (metricsDatabaseId) {
          await saveMetricsToNotion(
            notion,
            metricsDatabaseId,
            post.tweetId,
            post.id,
            metrics,
            hoursAfterPost
          );
        }

        collectedCount++;
      }
    }

    console.log(`Collected metrics for ${collectedCount} posts`);

    return res.status(200).json({
      success: true,
      collected: collectedCount,
      total: posts.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error collecting metrics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: errorMessage });
  }
}
