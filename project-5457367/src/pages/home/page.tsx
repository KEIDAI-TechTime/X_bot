
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import SettingsTab from './components/SettingsTab';
import ScheduleTab from './components/ScheduleTab';
import HistoryTab from './components/HistoryTab';
import TestTab from './components/TestTab';
import StatusTab from './components/StatusTab';
import { mockPostSettings, type Settings } from '../../mocks/postSettings';
import { saveSettingsToNotion } from '../../services/settingsService';

interface PostHistoryItem {
  id: string;
  content: string;
  postedAt: string;
  status: 'success' | 'failed';
  tweetId?: string;
  errorMessage?: string;
}

type TabType = 'settings' | 'schedule' | 'history' | 'test' | 'status';

const SETTINGS_STORAGE_KEY = 'x-auto-poster-settings';

// 曜日のマッピング（0=日曜日, 1=月曜日, ...）
const DAY_MAP: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6
};

// 次回投稿時刻を計算
const calculateNextPostTime = (postTimes: string[], activeDays: string[]): string => {
  if (postTimes.length === 0 || activeDays.length === 0) {
    return new Date().toISOString();
  }

  const now = new Date();
  const activeDayNumbers = activeDays.map(d => DAY_MAP[d]).filter(d => d !== undefined);

  // 今日から7日間をチェック
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const checkDate = new Date(now);
    checkDate.setDate(now.getDate() + dayOffset);
    const dayOfWeek = checkDate.getDay();

    // この曜日がアクティブかチェック
    if (activeDayNumbers.includes(dayOfWeek)) {
      // この日の投稿時刻をチェック
      for (const timeStr of postTimes.sort()) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const postTime = new Date(checkDate);
        postTime.setHours(hours, minutes, 0, 0);

        // 未来の時刻なら次回投稿時刻として返す
        if (postTime > now) {
          return postTime.toISOString();
        }
      }
    }
  }

  // 見つからない場合は翌週の最初のアクティブ日の最初の時刻
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);
  return nextWeek.toISOString();
};

// localStorageから設定を読み込む
const loadSettings = (): Settings => {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // mockPostSettingsとマージして新しいフィールドにも対応
      return { ...mockPostSettings, ...parsed };
    }
  } catch (e) {
    console.warn('設定の読み込みに失敗しました:', e);
  }
  return mockPostSettings;
};

// localStorageに設定を保存
const saveSettings = (settings: Settings): void => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('設定の保存に失敗しました:', e);
  }
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>('settings');
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [postHistory, setPostHistory] = useState<PostHistoryItem[]>([]);

  // 投稿履歴を取得
  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/history');
      const data = await response.json();
      if (data.success) {
        setPostHistory(data.history);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  }, []);

  // 初回ロードと定期更新
  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 30000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  // 投稿履歴から統計を計算
  const stats = useMemo(() => {
    const totalPosts = postHistory.length;
    const successPosts = postHistory.filter(p => p.status === 'success').length;
    const successRate = totalPosts > 0 ? Math.round((successPosts / totalPosts) * 1000) / 10 : 100;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayPosts = postHistory.filter(p => new Date(p.postedAt) >= today).length;

    // 最近のアクティビティを生成
    const recentActivities = postHistory.slice(0, 5).map(p => {
      const postedDate = new Date(p.postedAt);
      const now = new Date();
      const diffMs = now.getTime() - postedDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      let time: string;
      if (diffMins < 60) {
        time = `${diffMins}分前`;
      } else if (diffHours < 24) {
        time = `${diffHours}時間前`;
      } else {
        time = `${diffDays}日前`;
      }

      return {
        time,
        action: p.status === 'success' ? '投稿に成功しました' : '投稿に失敗しました',
        icon: p.status === 'success' ? 'ri-check-line' : 'ri-error-warning-line',
        color: p.status === 'success' ? 'text-green-600' : 'text-red-600',
        content: p.content.slice(0, 30) + (p.content.length > 30 ? '...' : ''),
      };
    });

    return { totalPosts, successRate, todayPosts, recentActivities };
  }, [postHistory]);

  // スケジュール設定から次回投稿時刻を計算
  const nextPostTime = useMemo(() => {
    return calculateNextPostTime(settings.postTimes, settings.activeDays);
  }, [settings.postTimes, settings.activeDays]);

  // statusをsettingsと連動させる
  const status = useMemo(() => ({
    totalPosts: stats.totalPosts,
    successRate: stats.successRate,
    todayPosts: stats.todayPosts,
    nextPostTime,
    isRunning: settings.enabled,
    recentActivities: stats.recentActivities,
  }), [stats, nextPostTime, settings.enabled]);

  // 設定が変更されたらlocalStorageに保存
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // 初回レンダリングかどうかを追跡
  const isFirstRender = useRef(true);

  // 設定が変更されたらNotionに同期
  useEffect(() => {
    // 初回レンダリング時はスキップ
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // デバウンス: 連続した変更をまとめる
    const timeoutId = setTimeout(() => {
      saveSettingsToNotion({
        // スケジュール関連
        postTimes: settings.postTimes,
        activeDays: settings.activeDays,
        topics: settings.topics,
        enabled: settings.enabled,
        // 投稿生成関連
        persona: settings.persona,
        tone: settings.tone,
        contentDirection: settings.contentDirection,
        maxLength: settings.maxLength,
        useEmoji: settings.useEmoji,
        useHashtags: settings.useHashtags,
        hashtagRules: settings.hashtagRules,
        mustInclude: settings.mustInclude,
        mustExclude: settings.mustExclude,
        structureTemplate: settings.structureTemplate,
        referenceInfo: settings.referenceInfo,
        examplePosts: settings.examplePosts,
        // X投稿戦略設定
        contentCategory: settings.contentCategory,
        contentFormat: settings.contentFormat,
        firstLinePattern: settings.firstLinePattern,
        provenPatterns: settings.provenPatterns,
        writingRules: settings.writingRules,
        // アルゴリズム対策
        avoidUrls: settings.avoidUrls,
        preferImages: settings.preferImages,
        targetDwellTime: settings.targetDwellTime,
      }).then(success => {
        if (success) {
          console.log('Settings synced to Notion');
        }
      });
    }, 1000); // 1秒後に保存

    return () => clearTimeout(timeoutId);
  }, [
    settings.postTimes,
    settings.activeDays,
    settings.topics,
    settings.enabled,
    settings.persona,
    settings.tone,
    settings.contentDirection,
    settings.maxLength,
    settings.useEmoji,
    settings.useHashtags,
    settings.hashtagRules,
    settings.mustInclude,
    settings.mustExclude,
    settings.structureTemplate,
    settings.referenceInfo,
    settings.examplePosts,
    // X投稿戦略設定
    settings.contentCategory,
    settings.contentFormat,
    settings.firstLinePattern,
    settings.provenPatterns,
    settings.writingRules,
    // アルゴリズム対策
    settings.avoidUrls,
    settings.preferImages,
    settings.targetDwellTime,
  ]);

  const handleToggleEnabled = () => {
    setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'settings':
        return <SettingsTab settings={settings} setSettings={setSettings} />;
      case 'schedule':
        return <ScheduleTab settings={settings} setSettings={setSettings} />;
      case 'history':
        return <HistoryTab />;
      case 'test':
        return <TestTab settings={settings} />;
      case 'status':
        return <StatusTab status={status} />;
      default:
        return <SettingsTab settings={settings} setSettings={setSettings} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-['Inter']">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar 
          activeTab={activeTab} 
          status={status}
          enabled={settings.enabled}
          onToggle={handleToggleEnabled}
        />
        <main className="flex-1 overflow-y-auto p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
