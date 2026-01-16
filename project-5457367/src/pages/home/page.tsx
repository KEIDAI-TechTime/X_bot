
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import SettingsTab from './components/SettingsTab';
import ScheduleTab from './components/ScheduleTab';
import HistoryTab from './components/HistoryTab';
import TestTab from './components/TestTab';
import StatusTab from './components/StatusTab';
import { mockPostSettings, mockStatus, type Settings } from '../../mocks/postSettings';

type TabType = 'settings' | 'schedule' | 'history' | 'test' | 'status';

const SETTINGS_STORAGE_KEY = 'x-auto-poster-settings';

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
  const [status, setStatus] = useState(mockStatus);

  // 設定が変更されたらlocalStorageに保存
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const handleToggleEnabled = () => {
    setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
    setStatus(prev => ({ ...prev, isRunning: !prev.isRunning }));
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
