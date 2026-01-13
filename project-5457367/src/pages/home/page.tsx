import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import SettingsTab from './components/SettingsTab';
import ScheduleTab from './components/ScheduleTab';
import HistoryTab from './components/HistoryTab';
import TestTab from './components/TestTab';
import StatusTab from './components/StatusTab';
import { settingsApi, statusApi, postApi, type PostSettings, type BotStatus } from '../../services/api';
import { mockPostSettings, mockStatus } from '../../mocks/postSettings';

type TabType = 'settings' | 'schedule' | 'history' | 'test' | 'status';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>('settings');
  const [settings, setSettings] = useState<PostSettings>(mockPostSettings as PostSettings);
  const [status, setStatus] = useState<BotStatus>(mockStatus);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [settingsData, statusData] = await Promise.all([
          settingsApi.get(),
          statusApi.get(),
        ]);
        if (settingsData) {
          setSettings(settingsData);
        }
        setStatus(statusData);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleToggleEnabled = async () => {
    try {
      const newEnabled = !settings.enabled;
      await postApi.toggle(newEnabled);
      setSettings(prev => ({ ...prev, enabled: newEnabled }));
      setStatus(prev => ({ ...prev, isRunning: newEnabled }));
    } catch (err: any) {
      console.error('Failed to toggle:', err);
      setError(err.message);
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<PostSettings>) => {
    try {
      const updated = await settingsApi.update(newSettings);
      setSettings(updated);
    } catch (err: any) {
      console.error('Failed to update settings:', err);
      setError(err.message);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      );
    }

    switch (activeTab) {
      case 'settings':
        return <SettingsTab settings={settings} setSettings={setSettings} onSave={handleUpdateSettings} />;
      case 'schedule':
        return <ScheduleTab settings={settings} setSettings={setSettings} onSave={handleUpdateSettings} />;
      case 'history':
        return <HistoryTab />;
      case 'test':
        return <TestTab settings={settings} />;
      case 'status':
        return <StatusTab status={status} />;
      default:
        return <SettingsTab settings={settings} setSettings={setSettings} onSave={handleUpdateSettings} />;
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
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
