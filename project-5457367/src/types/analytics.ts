// エンゲージメント指標
export interface TweetMetrics {
  tweetId: string;
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  impressions: number;
  profileClicks: number;
  engagementRate: number;
  collectedAt: string;
  hoursAfterPost: number;
}

// 投稿 + メトリクス
export interface PostWithMetrics {
  id: string;
  tweetId: string;
  content: string;
  postedAt: string;
  status: 'success' | 'failed';
  // 最新のメトリクス
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  impressions: number;
  engagementRate: number;
  // メタデータ
  topic?: string;
  hasEmoji: boolean;
  hasHashtag: boolean;
  charCount: number;
  lineCount: number;
  firstLine: string;
}

// 時間帯別分析
export interface HourlyAnalysis {
  hour: number;
  avgEngagement: number;
  avgImpressions: number;
  avgLikes: number;
  postCount: number;
}

// 曜日別分析
export interface DayOfWeekAnalysis {
  day: string;
  dayIndex: number;
  avgEngagement: number;
  avgImpressions: number;
  avgLikes: number;
  postCount: number;
}

// トピック別分析
export interface TopicAnalysis {
  topic: string;
  avgEngagement: number;
  avgImpressions: number;
  avgLikes: number;
  postCount: number;
  bestPerformingPost?: PostWithMetrics;
}

// 1行目パターン分析
export interface FirstLinePatternAnalysis {
  pattern: string;
  examples: string[];
  avgEngagement: number;
  avgImpressions: number;
  postCount: number;
}

// 総合分析結果
export interface AnalyticsData {
  // サマリー
  summary: {
    totalPosts: number;
    totalImpressions: number;
    totalLikes: number;
    totalRetweets: number;
    avgEngagementRate: number;
    bestPost: PostWithMetrics | null;
    worstPost: PostWithMetrics | null;
  };
  // 詳細分析
  hourlyAnalysis: HourlyAnalysis[];
  dayOfWeekAnalysis: DayOfWeekAnalysis[];
  topicAnalysis: TopicAnalysis[];
  firstLinePatterns: FirstLinePatternAnalysis[];
  // 投稿一覧
  posts: PostWithMetrics[];
  // AI分析結果
  aiInsights?: AIInsights;
}

// AI分析結果
export interface AIInsights {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  suggestedTemplates: string[];
  optimalPostingTimes: string[];
  generatedAt: string;
}

// メトリクス収集のスケジュール
export interface MetricsCollectionSchedule {
  tweetId: string;
  postedAt: string;
  scheduledCollections: {
    hoursAfter: number;
    scheduledAt: string;
    collected: boolean;
  }[];
}
