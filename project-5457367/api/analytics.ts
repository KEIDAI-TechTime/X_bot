import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from '@notionhq/client';
import Anthropic from '@anthropic-ai/sdk';
import type {
  PostWithMetrics,
  HourlyAnalysis,
  DayOfWeekAnalysis,
  TopicAnalysis,
  FirstLinePatternAnalysis,
  AnalyticsData,
  AIInsights,
} from '../src/types/analytics';

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

// Notionから投稿履歴とメトリクスを取得
async function getPostsWithMetrics(
  notion: Client,
  databaseId: string
): Promise<PostWithMetrics[]> {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'status',
        select: { equals: 'success' },
      },
      sorts: [{ property: 'postedAt', direction: 'descending' }],
      page_size: 100,
    });

    return response.results.map((page: any) => {
      const props = page.properties;
      const content = props.content?.rich_text?.[0]?.plain_text || '';
      const lines = content.split('\n');

      return {
        id: page.id,
        tweetId: props.tweetId?.rich_text?.[0]?.plain_text || '',
        content,
        postedAt: props.postedAt?.date?.start || '',
        status: props.status?.select?.name || 'success',
        likes: props.likes?.number || 0,
        retweets: props.retweets?.number || 0,
        replies: props.replies?.number || 0,
        quotes: props.quotes?.number || 0,
        impressions: props.impressions?.number || 0,
        engagementRate: props.engagementRate?.number || 0,
        topic: props.topic?.rich_text?.[0]?.plain_text,
        hasEmoji: /[\u{1F300}-\u{1F9FF}]/u.test(content),
        hasHashtag: /#\S+/.test(content),
        charCount: content.length,
        lineCount: lines.length,
        firstLine: lines[0] || '',
      };
    }).filter(p => p.tweetId);
  } catch (error) {
    console.error('Error fetching posts with metrics:', error);
    return [];
  }
}

// 時間帯別分析
function analyzeByHour(posts: PostWithMetrics[]): HourlyAnalysis[] {
  const hourlyData: Map<number, { engagement: number[]; impressions: number[]; likes: number[] }> = new Map();

  for (let h = 0; h < 24; h++) {
    hourlyData.set(h, { engagement: [], impressions: [], likes: [] });
  }

  for (const post of posts) {
    if (!post.postedAt) continue;
    const hour = new Date(post.postedAt).getHours();
    const data = hourlyData.get(hour)!;
    data.engagement.push(post.engagementRate);
    data.impressions.push(post.impressions);
    data.likes.push(post.likes);
  }

  return Array.from(hourlyData.entries()).map(([hour, data]) => ({
    hour,
    avgEngagement: data.engagement.length > 0
      ? Math.round(data.engagement.reduce((a, b) => a + b, 0) / data.engagement.length * 100) / 100
      : 0,
    avgImpressions: data.impressions.length > 0
      ? Math.round(data.impressions.reduce((a, b) => a + b, 0) / data.impressions.length)
      : 0,
    avgLikes: data.likes.length > 0
      ? Math.round(data.likes.reduce((a, b) => a + b, 0) / data.likes.length * 10) / 10
      : 0,
    postCount: data.engagement.length,
  }));
}

// 曜日別分析
function analyzeByDayOfWeek(posts: PostWithMetrics[]): DayOfWeekAnalysis[] {
  const dayData: Map<number, { engagement: number[]; impressions: number[]; likes: number[] }> = new Map();

  for (let d = 0; d < 7; d++) {
    dayData.set(d, { engagement: [], impressions: [], likes: [] });
  }

  for (const post of posts) {
    if (!post.postedAt) continue;
    const day = new Date(post.postedAt).getDay();
    const data = dayData.get(day)!;
    data.engagement.push(post.engagementRate);
    data.impressions.push(post.impressions);
    data.likes.push(post.likes);
  }

  return Array.from(dayData.entries()).map(([dayIndex, data]) => ({
    day: DAY_NAMES[dayIndex],
    dayIndex,
    avgEngagement: data.engagement.length > 0
      ? Math.round(data.engagement.reduce((a, b) => a + b, 0) / data.engagement.length * 100) / 100
      : 0,
    avgImpressions: data.impressions.length > 0
      ? Math.round(data.impressions.reduce((a, b) => a + b, 0) / data.impressions.length)
      : 0,
    avgLikes: data.likes.length > 0
      ? Math.round(data.likes.reduce((a, b) => a + b, 0) / data.likes.length * 10) / 10
      : 0,
    postCount: data.engagement.length,
  }));
}

// トピック別分析
function analyzeByTopic(posts: PostWithMetrics[]): TopicAnalysis[] {
  const topicData: Map<string, { posts: PostWithMetrics[] }> = new Map();

  for (const post of posts) {
    const topic = post.topic || detectTopic(post.content);
    if (!topicData.has(topic)) {
      topicData.set(topic, { posts: [] });
    }
    topicData.get(topic)!.posts.push(post);
  }

  return Array.from(topicData.entries()).map(([topic, data]) => {
    const posts = data.posts;
    const avgEngagement = posts.reduce((a, b) => a + b.engagementRate, 0) / posts.length;
    const bestPost = posts.reduce((a, b) =>
      (a.engagementRate > b.engagementRate ? a : b), posts[0]);

    return {
      topic,
      avgEngagement: Math.round(avgEngagement * 100) / 100,
      avgImpressions: Math.round(posts.reduce((a, b) => a + b.impressions, 0) / posts.length),
      avgLikes: Math.round(posts.reduce((a, b) => a + b.likes, 0) / posts.length * 10) / 10,
      postCount: posts.length,
      bestPerformingPost: bestPost,
    };
  }).sort((a, b) => b.avgEngagement - a.avgEngagement);
}

// コンテンツからトピックを推測
function detectTopic(content: string): string {
  const topicKeywords: Record<string, string[]> = {
    'AI・機械学習': ['AI', '機械学習', 'ChatGPT', 'Claude', 'LLM', '人工知能'],
    'プログラミング': ['プログラミング', 'コード', '開発', 'エンジニア', 'Python', 'JavaScript'],
    'ビジネス': ['ビジネス', '経営', 'スタートアップ', '起業', 'マーケティング'],
    '生産性': ['生産性', '効率', 'タスク', '時間管理', 'リモートワーク'],
    'キャリア': ['キャリア', '転職', '仕事', '就職', 'スキル'],
  };

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(kw => content.includes(kw))) {
      return topic;
    }
  }
  return 'その他';
}

// 1行目パターン分析
function analyzeFirstLinePatterns(posts: PostWithMetrics[]): FirstLinePatternAnalysis[] {
  const patterns: Record<string, { examples: string[]; posts: PostWithMetrics[] }> = {
    '絵文字で始まる': { examples: [], posts: [] },
    '数字で始まる': { examples: [], posts: [] },
    '問いかけ': { examples: [], posts: [] },
    '宣言・主張': { examples: [], posts: [] },
    '体験談': { examples: [], posts: [] },
    'その他': { examples: [], posts: [] },
  };

  for (const post of posts) {
    const firstLine = post.firstLine;
    let matched = false;

    if (/^[\u{1F300}-\u{1F9FF}]/u.test(firstLine)) {
      patterns['絵文字で始まる'].posts.push(post);
      if (patterns['絵文字で始まる'].examples.length < 3) {
        patterns['絵文字で始まる'].examples.push(firstLine.slice(0, 50));
      }
      matched = true;
    } else if (/^[0-9０-９]/.test(firstLine)) {
      patterns['数字で始まる'].posts.push(post);
      if (patterns['数字で始まる'].examples.length < 3) {
        patterns['数字で始まる'].examples.push(firstLine.slice(0, 50));
      }
      matched = true;
    } else if (/[？?]/.test(firstLine)) {
      patterns['問いかけ'].posts.push(post);
      if (patterns['問いかけ'].examples.length < 3) {
        patterns['問いかけ'].examples.push(firstLine.slice(0, 50));
      }
      matched = true;
    } else if (/^(私|僕|俺|自分)/.test(firstLine) || /してみた|だった|ている/.test(firstLine)) {
      patterns['体験談'].posts.push(post);
      if (patterns['体験談'].examples.length < 3) {
        patterns['体験談'].examples.push(firstLine.slice(0, 50));
      }
      matched = true;
    } else if (/です[。！]?$|ます[。！]?$|だ[。！]?$/.test(firstLine)) {
      patterns['宣言・主張'].posts.push(post);
      if (patterns['宣言・主張'].examples.length < 3) {
        patterns['宣言・主張'].examples.push(firstLine.slice(0, 50));
      }
      matched = true;
    }

    if (!matched) {
      patterns['その他'].posts.push(post);
      if (patterns['その他'].examples.length < 3) {
        patterns['その他'].examples.push(firstLine.slice(0, 50));
      }
    }
  }

  return Object.entries(patterns)
    .filter(([, data]) => data.posts.length > 0)
    .map(([pattern, data]) => ({
      pattern,
      examples: data.examples,
      avgEngagement: Math.round(
        data.posts.reduce((a, b) => a + b.engagementRate, 0) / data.posts.length * 100
      ) / 100,
      avgImpressions: Math.round(
        data.posts.reduce((a, b) => a + b.impressions, 0) / data.posts.length
      ),
      postCount: data.posts.length,
    }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement);
}

// AI分析を実行
async function generateAIInsights(
  posts: PostWithMetrics[],
  hourlyAnalysis: HourlyAnalysis[],
  topicAnalysis: TopicAnalysis[]
): Promise<AIInsights | undefined> {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicApiKey || posts.length < 5) {
    return undefined;
  }

  try {
    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    // 上位と下位の投稿を抽出
    const sortedByEngagement = [...posts].sort((a, b) => b.engagementRate - a.engagementRate);
    const topPosts = sortedByEngagement.slice(0, 5);
    const bottomPosts = sortedByEngagement.slice(-5);

    // 最適な投稿時間を抽出
    const bestHours = hourlyAnalysis
      .filter(h => h.postCount >= 2)
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 3)
      .map(h => `${h.hour}時`);

    const prompt = `あなたはSNSマーケティングの専門家です。以下のX（Twitter）投稿データを分析し、改善提案をしてください。

## 高パフォーマンス投稿（上位5件）
${topPosts.map(p => `- エンゲージメント率: ${p.engagementRate}%, いいね: ${p.likes}
  内容: ${p.content.slice(0, 100)}...`).join('\n')}

## 低パフォーマンス投稿（下位5件）
${bottomPosts.map(p => `- エンゲージメント率: ${p.engagementRate}%, いいね: ${p.likes}
  内容: ${p.content.slice(0, 100)}...`).join('\n')}

## トピック別パフォーマンス
${topicAnalysis.slice(0, 5).map(t => `- ${t.topic}: 平均エンゲージメント ${t.avgEngagement}%, ${t.postCount}件`).join('\n')}

以下のJSON形式で回答してください：
{
  "strengths": ["強み1", "強み2", "強み3"],
  "weaknesses": ["弱点1", "弱点2", "弱点3"],
  "recommendations": ["改善提案1", "改善提案2", "改善提案3", "改善提案4", "改善提案5"],
  "suggestedTemplates": ["投稿テンプレート1", "投稿テンプレート2", "投稿テンプレート3"]
}

日本語で回答してください。`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      // JSONを抽出
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const insights = JSON.parse(jsonMatch[0]);
        return {
          ...insights,
          optimalPostingTimes: bestHours,
          generatedAt: new Date().toISOString(),
        };
      }
    }
  } catch (error) {
    console.error('Error generating AI insights:', error);
  }

  return undefined;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const notionApiKey = process.env.NOTION_API_KEY;
  const historyDatabaseId = process.env.NOTION_HISTORY_DATABASE_ID;

  if (!notionApiKey || !historyDatabaseId) {
    return res.status(500).json({ error: 'Notion credentials not configured' });
  }

  const notion = new Client({ auth: notionApiKey });

  try {
    // 投稿データを取得
    const posts = await getPostsWithMetrics(notion, historyDatabaseId);

    if (posts.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          summary: {
            totalPosts: 0,
            totalImpressions: 0,
            totalLikes: 0,
            totalRetweets: 0,
            avgEngagementRate: 0,
            bestPost: null,
            worstPost: null,
          },
          hourlyAnalysis: [],
          dayOfWeekAnalysis: [],
          topicAnalysis: [],
          firstLinePatterns: [],
          posts: [],
        } as AnalyticsData,
      });
    }

    // 各種分析を実行
    const hourlyAnalysis = analyzeByHour(posts);
    const dayOfWeekAnalysis = analyzeByDayOfWeek(posts);
    const topicAnalysis = analyzeByTopic(posts);
    const firstLinePatterns = analyzeFirstLinePatterns(posts);

    // サマリーを計算
    const sortedByEngagement = [...posts].sort((a, b) => b.engagementRate - a.engagementRate);
    const totalImpressions = posts.reduce((a, b) => a + b.impressions, 0);
    const totalLikes = posts.reduce((a, b) => a + b.likes, 0);
    const totalRetweets = posts.reduce((a, b) => a + b.retweets, 0);
    const avgEngagementRate = posts.reduce((a, b) => a + b.engagementRate, 0) / posts.length;

    // AI分析（オプション）
    const includeAI = req.query.includeAI === 'true';
    let aiInsights: AIInsights | undefined;
    if (includeAI) {
      aiInsights = await generateAIInsights(posts, hourlyAnalysis, topicAnalysis);
    }

    const analyticsData: AnalyticsData = {
      summary: {
        totalPosts: posts.length,
        totalImpressions,
        totalLikes,
        totalRetweets,
        avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
        bestPost: sortedByEngagement[0] || null,
        worstPost: sortedByEngagement[sortedByEngagement.length - 1] || null,
      },
      hourlyAnalysis,
      dayOfWeekAnalysis,
      topicAnalysis,
      firstLinePatterns,
      posts,
      aiInsights,
    };

    return res.status(200).json({
      success: true,
      data: analyticsData,
    });
  } catch (error) {
    console.error('Error generating analytics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: errorMessage });
  }
}
