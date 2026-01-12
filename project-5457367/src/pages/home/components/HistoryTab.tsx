
import { useState } from 'react';
import { mockPostHistory } from '../../../mocks/postSettings';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function HistoryTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [history] = useState(mockPostHistory);

  const filteredHistory = history.filter(post =>
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExport = () => {
    alert('CSV形式でエクスポートします');
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
          onClick={handleExport}
          className="px-6 h-12 border-2 border-[#4F46E5] text-[#4F46E5] rounded-lg font-medium hover:bg-[#4F46E5] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
        >
          <i className="ri-file-download-line mr-2"></i>
          CSVエクスポート
        </button>
      </div>

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
                </div>
                <p className="text-base text-gray-900 leading-relaxed mb-3">{post.content}</p>
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

      {filteredHistory.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center">
          <i className="ri-inbox-line text-6xl text-gray-300 mb-4"></i>
          <p className="text-gray-500">該当する投稿履歴がありません</p>
        </div>
      )}
    </div>
  );
}
