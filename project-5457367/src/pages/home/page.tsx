
import { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import SettingsTab from './components/SettingsTab';
import ScheduleTab from './components/ScheduleTab';
import HistoryTab from './components/HistoryTab';
import TestTab from './components/TestTab';
import StatusTab from './components/StatusTab';
import { mockPostSettings, mockStatus } from '../../mocks/postSettings';

type TabType = 'settings' | 'schedule' | 'history' | 'test' | 'status';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>('settings');
  const [settings, setSettings] = useState(mockPostSettings);
  const [status, setStatus] = useState(mockStatus);

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
