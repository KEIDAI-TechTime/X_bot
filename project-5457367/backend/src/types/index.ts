// 投稿設定の型定義
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

// 投稿履歴の型定義
export interface PostHistory {
  id: string;
  settingId: string;
  postedAt: string;
  content: string;
  status: 'success' | 'failed';
  errorMessage: string | null;
}

// ステータスの型定義
export interface BotStatus {
  totalPosts: number;
  successRate: number;
  todayPosts: number;
  nextPostTime: string | null;
  isRunning: boolean;
}

// 生成リクエストの型定義
export interface GenerateRequest {
  settingId?: string;
  settings?: Partial<PostSettings>;
}

// 生成レスポンスの型定義
export interface GenerateResponse {
  content: string;
  generatedAt: string;
}

// API レスポンスの共通型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
