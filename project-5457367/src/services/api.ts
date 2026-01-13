const API_BASE = '/api';

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

export interface BotStatus {
  totalPosts: number;
  successRate: number;
  todayPosts: number;
  nextPostTime: string | null;
  isRunning: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    throw new Error(json.error || 'API request failed');
  }

  return json.data as T;
}

// 設定API
export const settingsApi = {
  get: () => fetchApi<PostSettings | null>('/settings'),
  update: (settings: Partial<PostSettings>) =>
    fetchApi<PostSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
};

// 履歴API
export const historyApi = {
  get: (limit?: number) =>
    fetchApi<PostHistory[]>(`/history${limit ? `?limit=${limit}` : ''}`),
};

// ステータスAPI
export const statusApi = {
  get: () => fetchApi<BotStatus>('/status'),
};

// 投稿API
export const postApi = {
  generate: (settings?: Partial<PostSettings>) =>
    fetchApi<{ content: string; generatedAt: string }>('/generate', {
      method: 'POST',
      body: JSON.stringify({ settings }),
    }),
  postNow: () =>
    fetchApi<{ content: string; tweetId: string }>('/post-now', {
      method: 'POST',
    }),
  toggle: (enabled: boolean) =>
    fetchApi<{ enabled: boolean }>('/toggle', {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    }),
};
