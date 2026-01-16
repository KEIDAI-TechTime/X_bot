import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { AnalyticsData, PostWithMetrics } from '../../../types/analytics';

type ViewMode = 'overview' | 'posts' | 'timing' | 'content' | 'ai';

export default function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [isCollecting, setIsCollecting] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  const fetchAnalytics = useCallback(async (includeAI = false) => {
    try {
      if (includeAI) setIsLoadingAI(true);
      const url = includeAI ? '/api/analytics?includeAI=true' : '/api/analytics';
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || '分析データの取得に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラー');
      console.error('Failed to fetch analytics:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingAI(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleCollectMetrics = async () => {
    setIsCollecting(true);
    try {
      const response = await fetch('/api/collect-metrics', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        alert(`${result.collected}件の投稿のメトリクスを収集しました`);
        fetchAnalytics();
      } else {
        alert('メトリクス収集に失敗しました: ' + result.error);
      }
    } catch (err) {
      alert('メトリクス収集中にエラーが発生しました');
    } finally {
      setIsCollecting(false);
    }
  };

  const handleGenerateAI = () => {
    fetchAnalytics(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <i className="ri-error-warning-line text-4xl text-red-500 mb-2"></i>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!data || data.summary.totalPosts === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl p-8 shadow-sm text-center">
          <i className="ri-bar-chart-line text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">分析データがありません</h3>
          <p className="text-gray-500 mb-6">投稿を行い、メトリクスを収集すると分析が表示されます</p>
          <button
            onClick={handleCollectMetrics}
            disabled={isCollecting}
            className="px-6 py-3 bg-[#4F46E5] text-white rounded-lg font-medium hover:bg-[#4338CA] disabled:opacity-50"
          >
            {isCollecting ? '収集中...' : 'メトリクスを収集'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['overview', 'posts', 'timing', 'content', 'ai'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-[#4F46E5] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {mode === 'overview' && '概要'}
              {mode === 'posts' && '投稿一覧'}
              {mode === 'timing' && '時間帯分析'}
              {mode === 'content' && 'コンテンツ分析'}
              {mode === 'ai' && 'AI分析'}
            </button>
          ))}
        </div>
        <button
          onClick={handleCollectMetrics}
          disabled={isCollecting}
          className="px-4 py-2 border border-[#4F46E5] text-[#4F46E5] rounded-lg text-sm font-medium hover:bg-[#4F46E5] hover:text-white disabled:opacity-50"
        >
          <i className={`ri-refresh-line mr-2 ${isCollecting ? 'animate-spin' : ''}`}></i>
          {isCollecting ? '収集中...' : 'メトリクス更新'}
        </button>
      </div>

      {/* 概要 */}
      {viewMode === 'overview' && (
        <OverviewSection data={data} />
      )}

      {/* 投稿一覧 */}
      {viewMode === 'posts' && (
        <PostsSection posts={data.posts} />
      )}

      {/* 時間帯分析 */}
      {viewMode === 'timing' && (
        <TimingSection data={data} />
      )}

      {/* コンテンツ分析 */}
      {viewMode === 'content' && (
        <ContentSection data={data} />
      )}

      {/* AI分析 */}
      {viewMode === 'ai' && (
        <AISection
          data={data}
          isLoading={isLoadingAI}
          onGenerate={handleGenerateAI}
        />
      )}
    </div>
  );
}

// 概要セクション
function OverviewSection({ data }: { data: AnalyticsData }) {
  return (
    <>
      {/* サマリーカード */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm text-center">
          <div className="text-3xl font-bold text-blue-600">{data.summary.totalPosts}</div>
          <div className="text-sm text-gray-500 mt-1">総投稿数</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm text-center">
          <div className="text-3xl font-bold text-green-600">
            {data.summary.totalImpressions.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 mt-1">総インプレッション</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm text-center">
          <div className="text-3xl font-bold text-red-500">
            {data.summary.totalLikes.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 mt-1">総いいね数</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm text-center">
          <div className="text-3xl font-bold text-purple-600">
            {data.summary.avgEngagementRate}%
          </div>
          <div className="text-sm text-gray-500 mt-1">平均エンゲージメント率</div>
        </div>
      </div>

      {/* ベスト/ワースト投稿 */}
      <div className="grid grid-cols-2 gap-6">
        {data.summary.bestPost && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <i className="ri-trophy-line text-yellow-500 text-xl"></i>
              <h3 className="font-semibold text-gray-900">ベストパフォーマンス</h3>
            </div>
            <PostCard post={data.summary.bestPost} />
          </div>
        )}
        {data.summary.worstPost && data.summary.totalPosts > 1 && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <i className="ri-arrow-down-line text-gray-400 text-xl"></i>
              <h3 className="font-semibold text-gray-900">改善の余地あり</h3>
            </div>
            <PostCard post={data.summary.worstPost} />
          </div>
        )}
      </div>

      {/* クイック統計 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 時間帯TOP3 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">
            <i className="ri-time-line mr-2 text-blue-500"></i>
            最適な投稿時間
          </h3>
          <div className="space-y-3">
            {data.hourlyAnalysis
              .filter(h => h.postCount > 0)
              .sort((a, b) => b.avgEngagement - a.avgEngagement)
              .slice(0, 3)
              .map((h, i) => (
                <div key={h.hour} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-yellow-100 text-yellow-700' :
                      i === 1 ? 'bg-gray-100 text-gray-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {i + 1}
                    </span>
                    <span className="font-medium">{h.hour}:00</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    エンゲージメント: {h.avgEngagement}%
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* トピックTOP3 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">
            <i className="ri-hashtag mr-2 text-green-500"></i>
            人気トピック
          </h3>
          <div className="space-y-3">
            {data.topicAnalysis.slice(0, 3).map((t, i) => (
              <div key={t.topic} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-yellow-100 text-yellow-700' :
                    i === 1 ? 'bg-gray-100 text-gray-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {i + 1}
                  </span>
                  <span className="font-medium">{t.topic}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {t.postCount}件 / {t.avgEngagement}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// 投稿一覧セクション
function PostsSection({ posts }: { posts: PostWithMetrics[] }) {
  const [sortBy, setSortBy] = useState<'date' | 'engagement' | 'likes' | 'impressions'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const sortedPosts = [...posts].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime();
        break;
      case 'engagement':
        comparison = a.engagementRate - b.engagementRate;
        break;
      case 'likes':
        comparison = a.likes - b.likes;
        break;
      case 'impressions':
        comparison = a.impressions - b.impressions;
        break;
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">投稿一覧</h3>
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border rounded-lg px-3 py-1.5"
          >
            <option value="date">投稿日時</option>
            <option value="engagement">エンゲージメント率</option>
            <option value="likes">いいね数</option>
            <option value="impressions">インプレッション</option>
          </select>
          <button
            onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
            className="p-1.5 border rounded-lg hover:bg-gray-50"
          >
            <i className={`ri-sort-${sortOrder === 'desc' ? 'desc' : 'asc'}`}></i>
          </button>
        </div>
      </div>
      <div className="divide-y max-h-[600px] overflow-y-auto">
        {sortedPosts.map((post) => (
          <div key={post.id} className="p-4 hover:bg-gray-50">
            <div className="flex justify-between items-start mb-2">
              <div className="text-sm text-gray-500">
                {format(new Date(post.postedAt), 'yyyy/MM/dd HH:mm', { locale: ja })}
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-red-500">
                  <i className="ri-heart-line mr-1"></i>{post.likes}
                </span>
                <span className="text-green-500">
                  <i className="ri-repeat-line mr-1"></i>{post.retweets}
                </span>
                <span className="text-blue-500">
                  <i className="ri-eye-line mr-1"></i>{post.impressions.toLocaleString()}
                </span>
                <span className="text-purple-600 font-medium">
                  {post.engagementRate}%
                </span>
              </div>
            </div>
            <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// 時間帯分析セクション
function TimingSection({ data }: { data: AnalyticsData }) {
  return (
    <div className="space-y-6">
      {/* 時間帯別 */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">時間帯別パフォーマンス</h3>
        <div className="grid grid-cols-12 gap-1">
          {data.hourlyAnalysis.map((h) => {
            const maxEngagement = Math.max(...data.hourlyAnalysis.map(x => x.avgEngagement));
            const height = maxEngagement > 0 ? (h.avgEngagement / maxEngagement) * 100 : 0;
            return (
              <div key={h.hour} className="flex flex-col items-center">
                <div className="h-24 w-full flex items-end justify-center">
                  <div
                    className={`w-full rounded-t transition-all ${
                      h.postCount > 0 ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                    style={{ height: `${Math.max(height, 5)}%` }}
                    title={`${h.hour}時: ${h.avgEngagement}% (${h.postCount}件)`}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">{h.hour}</div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center mt-2 text-xs text-gray-400">時間帯</div>
      </div>

      {/* 曜日別 */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">曜日別パフォーマンス</h3>
        <div className="grid grid-cols-7 gap-2">
          {data.dayOfWeekAnalysis.map((d) => {
            const maxEngagement = Math.max(...data.dayOfWeekAnalysis.map(x => x.avgEngagement));
            const intensity = maxEngagement > 0 ? (d.avgEngagement / maxEngagement) : 0;
            return (
              <div
                key={d.dayIndex}
                className="p-4 rounded-lg text-center"
                style={{
                  backgroundColor: d.postCount > 0
                    ? `rgba(79, 70, 229, ${0.1 + intensity * 0.5})`
                    : '#f3f4f6'
                }}
              >
                <div className="font-medium text-gray-900">{d.day}</div>
                <div className="text-2xl font-bold text-[#4F46E5] mt-1">
                  {d.avgEngagement}%
                </div>
                <div className="text-xs text-gray-500 mt-1">{d.postCount}件</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// コンテンツ分析セクション
function ContentSection({ data }: { data: AnalyticsData }) {
  return (
    <div className="space-y-6">
      {/* トピック別 */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">トピック別パフォーマンス</h3>
        <div className="space-y-3">
          {data.topicAnalysis.map((t) => (
            <div key={t.topic} className="flex items-center gap-4">
              <div className="w-32 text-sm font-medium text-gray-700 truncate">{t.topic}</div>
              <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-end pr-3"
                  style={{
                    width: `${Math.min(t.avgEngagement * 10, 100)}%`,
                  }}
                >
                  <span className="text-xs text-white font-medium">{t.avgEngagement}%</span>
                </div>
              </div>
              <div className="w-16 text-right text-sm text-gray-500">{t.postCount}件</div>
            </div>
          ))}
        </div>
      </div>

      {/* 1行目パターン */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">1行目パターン分析</h3>
        <div className="space-y-4">
          {data.firstLinePatterns.map((p) => (
            <div key={p.pattern} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{p.pattern}</span>
                <span className="text-sm text-purple-600 font-medium">
                  平均 {p.avgEngagement}%
                </span>
              </div>
              <div className="text-sm text-gray-500 mb-2">{p.postCount}件の投稿</div>
              <div className="text-xs text-gray-400">
                例: {p.examples[0]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// AI分析セクション
function AISection({
  data,
  isLoading,
  onGenerate,
}: {
  data: AnalyticsData;
  isLoading: boolean;
  onGenerate: () => void;
}) {
  const insights = data.aiInsights;

  if (!insights) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm text-center">
        <i className="ri-robot-line text-6xl text-gray-300 mb-4"></i>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">AI分析</h3>
        <p className="text-gray-500 mb-6">
          AIがあなたの投稿パターンを分析し、改善提案を生成します
        </p>
        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <i className="ri-loader-4-line animate-spin"></i>
              分析中...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <i className="ri-magic-line"></i>
              AI分析を実行
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 最適な投稿時間 */}
      {insights.optimalPostingTimes && insights.optimalPostingTimes.length > 0 && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <i className="ri-time-line"></i>
            最適な投稿時間
          </h3>
          <div className="flex gap-4">
            {insights.optimalPostingTimes.map((time) => (
              <div key={time} className="bg-white/20 rounded-lg px-4 py-2 font-medium">
                {time}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* 強み */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <i className="ri-thumb-up-line text-green-500"></i>
            強み
          </h3>
          <ul className="space-y-2">
            {insights.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <i className="ri-check-line text-green-500 mt-0.5"></i>
                {s}
              </li>
            ))}
          </ul>
        </div>

        {/* 弱点 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <i className="ri-error-warning-line text-yellow-500"></i>
            改善ポイント
          </h3>
          <ul className="space-y-2">
            {insights.weaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <i className="ri-arrow-right-s-line text-yellow-500 mt-0.5"></i>
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 改善提案 */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <i className="ri-lightbulb-line text-yellow-500"></i>
          改善提案
        </h3>
        <div className="space-y-3">
          {insights.recommendations.map((r, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
              <span className="w-6 h-6 bg-yellow-200 text-yellow-800 rounded-full flex items-center justify-center text-sm font-bold">
                {i + 1}
              </span>
              <p className="text-sm text-gray-700">{r}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 投稿テンプレート */}
      {insights.suggestedTemplates && insights.suggestedTemplates.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <i className="ri-file-text-line text-blue-500"></i>
            おすすめ投稿テンプレート
          </h3>
          <div className="space-y-3">
            {insights.suggestedTemplates.map((t, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{t}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center text-xs text-gray-400">
        生成日時: {format(new Date(insights.generatedAt), 'yyyy/MM/dd HH:mm', { locale: ja })}
      </div>
    </div>
  );
}

// 投稿カード
function PostCard({ post }: { post: PostWithMetrics }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <div className="text-xs text-gray-500">
          {format(new Date(post.postedAt), 'yyyy/MM/dd HH:mm', { locale: ja })}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-red-500">
            <i className="ri-heart-fill mr-1"></i>{post.likes}
          </span>
          <span className="text-purple-600 font-bold">
            {post.engagementRate}%
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-800 line-clamp-3">{post.content}</p>
    </div>
  );
}
