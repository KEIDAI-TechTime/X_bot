
import { Dispatch, SetStateAction } from 'react';

type TabType = 'settings' | 'schedule' | 'history' | 'test' | 'status';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: Dispatch<SetStateAction<TabType>>;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const tabs = [
    { id: 'settings' as TabType, label: '投稿設定', icon: 'ri-settings-3-line' },
    { id: 'schedule' as TabType, label: 'スケジュール', icon: 'ri-calendar-line' },
    { id: 'history' as TabType, label: '投稿履歴', icon: 'ri-history-line' },
    { id: 'test' as TabType, label: 'テスト投稿', icon: 'ri-flask-line' },
    { id: 'status' as TabType, label: 'ステータス', icon: 'ri-line-chart-line' },
  ];

  const handleEmergencyStop = () => {
    if (confirm('本当に緊急停止しますか？すべての自動投稿が停止されます。')) {
      alert('緊急停止しました');
    }
  };

  return (
    <aside className="w-[280px] bg-[#1A2332] text-white flex flex-col h-screen">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img 
            src="https://public.readdy.ai/ai/img_res/8689f43b-d57e-4e11-bd57-fc2ed5daca5f.png" 
            alt="X Auto Poster Logo" 
            className="w-12 h-12 rounded-full object-cover"
          />
          <h1 className="text-xl font-semibold whitespace-nowrap">X Auto Poster</h1>
        </div>
      </div>

      <nav className="flex-1 py-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full h-14 px-4 flex items-center gap-3 text-sm font-medium transition-all duration-200 relative cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-white bg-white/5'
                : 'text-white/70 hover:bg-white/5'
            }`}
          >
            {activeTab === tab.id && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#4F46E5]"></div>
            )}
            <i className={`${tab.icon} text-xl w-6 h-6 flex items-center justify-center`}></i>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4">
        <button
          onClick={handleEmergencyStop}
          className="w-full h-12 bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors duration-200 cursor-pointer whitespace-nowrap"
        >
          <i className="ri-stop-circle-line text-lg"></i>
          <span>緊急停止</span>
        </button>
      </div>
    </aside>
  );
}
