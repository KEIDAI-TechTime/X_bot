
import { useState, useEffect } from 'react';
import { format, differenceInSeconds } from 'date-fns';
import { ja } from 'date-fns/locale';

interface Activity {
  time: string;
  action: string;
  icon: string;
  color: string;
  content?: string;
}

interface StatusTabProps {
  status: {
    totalPosts: number;
    successRate: number | null;
    todayPosts: number;
    nextPostTime: string;
    isRunning: boolean;
    recentActivities?: Activity[];
  };
}

export default function StatusTab({ status }: StatusTabProps) {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const nextPost = new Date(status.nextPostTime);
      const diff = differenceInSeconds(nextPost, now);

      if (diff > 0) {
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        setCountdown(`${hours}時間 ${minutes}分 ${seconds}秒`);
      } else {
        setCountdown('まもなく投稿');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [status.nextPostTime]);

  const formatNextPostTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      return format(date, 'yyyy年M月d日 HH:mm', { locale: ja });
    } catch {
      return timeStr;
    }
  };

  const activities = status.recentActivities || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-8 shadow-sm text-center">
          <div className="text-5xl font-bold text-blue-600 mb-2">{status.totalPosts.toLocaleString()}</div>
          <div className="text-sm text-gray-600">総投稿数</div>
        </div>
        <div className="bg-white rounded-xl p-8 shadow-sm text-center">
          <div className="text-5xl font-bold text-green-600 mb-2">
            {status.successRate !== null ? `${status.successRate}%` : '-'}
          </div>
          <div className="text-sm text-gray-600">成功率</div>
        </div>
        <div className="bg-white rounded-xl p-8 shadow-sm text-center">
          <div className="text-5xl font-bold text-[#4F46E5] mb-2">{status.todayPosts}</div>
          <div className="text-sm text-gray-600">今日の投稿</div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-xl p-10 shadow-lg text-white text-center">
        <i className="ri-time-line text-6xl mb-4 opacity-90"></i>
        <h3 className="text-xl font-semibold mb-2">次回投稿予定</h3>
        <div className="text-4xl font-mono font-bold mb-3">{formatNextPostTime(status.nextPostTime)}</div>
        <div className="text-lg opacity-90">
          <i className="ri-timer-line mr-2"></i>
          {countdown}
        </div>
      </div>

      <div className="bg-white rounded-xl p-8 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">最近のアクティビティ</h3>
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="relative">
                  <div className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center ${activity.color}`}>
                    <i className={`${activity.icon} text-xl`}></i>
                  </div>
                  {index < activities.length - 1 && (
                    <div className="absolute left-1/2 top-10 w-0.5 h-8 bg-gray-200 -translate-x-1/2"></div>
                  )}
                </div>
                <div className="flex-1 pt-2">
                  <div className="text-sm font-medium text-gray-900">{activity.action}</div>
                  {activity.content && (
                    <div className="text-xs text-gray-600 mt-0.5">{activity.content}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <i className="ri-inbox-line text-4xl mb-2"></i>
            <p>まだアクティビティがありません</p>
            <p className="text-sm mt-1">投稿を行うとここに履歴が表示されます</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-8 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">システム状態</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">自動投稿</span>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${status.isRunning ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
              <span className={`text-sm font-semibold ${status.isRunning ? 'text-green-600' : 'text-red-600'}`}>
                {status.isRunning ? '稼働中' : '停止中'}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">AI生成</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-semibold text-green-600">正常</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">X API接続</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-semibold text-green-600">接続中</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">データベース</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-semibold text-green-600">正常</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
