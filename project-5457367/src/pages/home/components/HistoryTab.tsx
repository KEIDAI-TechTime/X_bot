
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface PostHistoryItem {
  id: string;
  content: string;
  postedAt: string;
  status: 'success' | 'failed';
  tweetId?: string;
  errorMessage?: string;
}

export default function HistoryTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState<PostHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // 履歴を取得
  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/history');
      const data = await response.json();

      if (data.success) {
        setHistory(data.history);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError(data.error || '履歴の取得に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラー: 履歴を取得できませんでした');
      console.error('Failed to fetch history:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初回ロードと自動更新
  useEffect(() => {
    fetchHistory();

    // 30秒ごとに自動更新
    const interval = setInterval(fetchHistory, 30000);

    return () => clearInterval(interval);
  }, [fetchHistory]);

  const filteredHistory = history.filter(post =>
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExport = () => {
    if (history.length === 0) {
      alert('エクスポートするデータがありません');
      return;
    }

    // CSV生成
    const headers = ['投稿日時', 'ステータス', '投稿内容', 'ツイートID', 'エラーメッセージ'];
    const rows = history.map(post => [
      post.postedAt,
      post.status === 'success' ? '成功' : '失敗',
      `"${post.content.replace(/"/g, '""')}"`,
      post.tweetId || '',
      post.errorMessage || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    // ダウンロード
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `post_history_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    fetchHistory();
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'yyyy年M月d日 HH:mm', { locale: ja });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm flex items-center gap-4">
        <div className="flex-1 relative">
          <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="投稿内容を検索..."
            className="w-full h-12 pl-12 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-sm"
          />
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="px-4 h-12 border-2 border-gray-300 text-gray-600 rounded-lg font-medium hover:border-[#4F46E5] hover:text-[#4F46E5] transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
        >
          <i className={`ri-refresh-line mr-2 ${isLoading ? 'animate-spin' : ''}`}></i>
          更新
        </button>
        <button
          onClick={handleExport}
          className="px-6 h-12 border-2 border-[#4F46E5] text-[#4F46E5] rounded-lg font-medium hover:bg-[#4F46E5] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
        >
          <i className="ri-file-download-line mr-2"></i>
          CSVエクスポート
        </button>
      </div>

      {/* 最終更新時刻 */}
      {lastUpdated && (
        <div className="text-sm text-gray-500 text-right">
          最終更新: {format(lastUpdated, 'HH:mm:ss')}
          <span className="ml-2 text-xs text-gray-400">(30秒ごとに自動更新)</span>
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <i className="ri-error-warning-line text-yellow-600 text-xl"></i>
            <div>
              <p className="font-medium text-yellow-800">{error}</p>
              <p className="text-sm text-yellow-600 mt-1">
                NOTION_HISTORY_DATABASE_IDが設定されているか確認してください
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ローディング */}
      {isLoading && history.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">履歴を読み込み中...</p>
        </div>
      )}

      {/* 履歴一覧 */}
      <div className="space-y-4">
        {filteredHistory.map((post) => (
          <div key={post.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex">
              <div className={`w-1 ${post.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div className="flex-1 p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">{formatDate(post.postedAt)}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      post.status === 'success'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {post.status === 'success' ? '成功' : '失敗'}
                    </span>
                  </div>
                  {post.tweetId && (
                    <a
                      href={`https://x.com/i/web/status/${post.tweetId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#4F46E5] hover:underline flex items-center gap-1"
                    >
                      <i className="ri-external-link-line"></i>
                      Xで見る
                    </a>
                  )}
                </div>
                <p className="text-base text-gray-900 leading-relaxed mb-3 whitespace-pre-wrap">{post.content}</p>
                {post.errorMessage && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <i className="ri-error-warning-line text-red-600 text-lg mt-0.5"></i>
                    <span className="text-sm text-red-700">{post.errorMessage}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 空状態 */}
      {!isLoading && filteredHistory.length === 0 && !error && (
        <div className="bg-white rounded-xl p-12 text-center">
          <i className="ri-inbox-line text-6xl text-gray-300 mb-4"></i>
          <p className="text-gray-500">
            {searchQuery ? '該当する投稿履歴がありません' : '投稿履歴がありません'}
          </p>
          {!searchQuery && (
            <p className="text-sm text-gray-400 mt-2">
              テスト投稿または自動投稿を行うと、ここに履歴が表示されます
            </p>
          )}
        </div>
      )}
    </div>
  );
}
