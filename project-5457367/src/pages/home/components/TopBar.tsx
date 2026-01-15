
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

type TabType = 'settings' | 'schedule' | 'history' | 'test' | 'status';

interface TopBarProps {
  activeTab: TabType;
  status: {
    todayPosts: number;
    nextPostTime: string;
    isRunning: boolean;
  };
  enabled: boolean;
  onToggle: () => void;
}

export default function TopBar({ activeTab, status, enabled, onToggle }: TopBarProps) {
  const tabTitles: Record<TabType, string> = {
    settings: '投稿設定',
    schedule: 'スケジュール',
    history: '投稿履歴',
    test: 'テスト投稿',
    status: 'ステータス',
  };

  const isValidNextPostTime = (timeStr: string) => {
    if (!timeStr) return false;
    const date = new Date(timeStr);
    return !isNaN(date.getTime()) && date.getFullYear() > 1970;
  };

  const formatNextPostTime = (timeStr: string) => {
    if (!enabled) {
      return '無効';
    }
    if (!isValidNextPostTime(timeStr)) {
      return '未設定';
    }
    try {
      const date = new Date(timeStr);
      return format(date, 'M月d日 HH:mm', { locale: ja });
    } catch {
      return timeStr;
    }
  };

  return (
    <header className="h-[72px] bg-white border-b border-gray-200 px-8 flex items-center justify-between">
      <h2 className="text-3xl font-semibold text-gray-900">{tabTitles[activeTab]}</h2>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-sm">
          <i className="ri-time-line text-blue-600"></i>
          <span className="text-gray-700">次回投稿:</span>
          <span className="font-medium text-gray-900">{formatNextPostTime(status.nextPostTime)}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-700 text-sm">本日の投稿:</span>
          <span className="text-3xl font-bold text-[#4F46E5]">{status.todayPosts}</span>
          <span className="text-gray-500 text-sm">件</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-700">{enabled ? '有効' : '無効'}</span>
          <button
            onClick={onToggle}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 cursor-pointer ${
              enabled ? 'bg-[#4F46E5]' : 'bg-gray-300'
            }`}
          >
            <div
              className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
                enabled ? 'translate-x-8' : 'translate-x-1'
              }`}
            ></div>
          </button>
        </div>
      </div>
    </header>
  );
}
