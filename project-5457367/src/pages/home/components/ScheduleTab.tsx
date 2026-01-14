
import { Dispatch, SetStateAction, useState } from 'react';
import type { PostSettings } from '../../../services/api';

interface ScheduleTabProps {
  settings: PostSettings;
  setSettings: Dispatch<SetStateAction<PostSettings>>;
  onSave?: (settings: Partial<PostSettings>) => Promise<void>;
}

export default function ScheduleTab({ settings, setSettings, onSave }: ScheduleTabProps) {
  const [newTime, setNewTime] = useState('12:00');
  const [saving, setSaving] = useState(false);

  const weekDays = [
    { id: 'mon', label: '月' },
    { id: 'tue', label: '火' },
    { id: 'wed', label: '水' },
    { id: 'thu', label: '木' },
    { id: 'fri', label: '金' },
    { id: 'sat', label: '土' },
    { id: 'sun', label: '日' },
  ];

  const addTime = () => {
    if (!settings.postTimes.includes(newTime)) {
      setSettings({ ...settings, postTimes: [...settings.postTimes, newTime].sort() });
    }
  };

  const removeTime = (time: string) => {
    setSettings({ ...settings, postTimes: settings.postTimes.filter(t => t !== time) });
  };

  const toggleDay = (dayId: string) => {
    if (settings.activeDays.includes(dayId)) {
      setSettings({ ...settings, activeDays: settings.activeDays.filter(d => d !== dayId) });
    } else {
      setSettings({ ...settings, activeDays: [...settings.activeDays, dayId] });
    }
  };

  const setPreset = (preset: 'all' | 'weekday' | 'weekend') => {
    const presets = {
      all: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      weekday: ['mon', 'tue', 'wed', 'thu', 'fri'],
      weekend: ['sat', 'sun'],
    };
    setSettings({ ...settings, activeDays: presets[preset] });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <section className="bg-white rounded-xl p-8 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">投稿時間</h3>
        <div className="space-y-4">
          {settings.postTimes.map((time) => (
            <div key={time} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <i className="ri-time-line text-2xl text-[#4F46E5]"></i>
                <span className="text-2xl font-mono font-medium text-gray-900">{time}</span>
              </div>
              <button
                onClick={() => removeTime(time)}
                className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="flex-1 h-12 px-4 border-2 border-dashed border-gray-300 rounded-lg focus:outline-none focus:border-[#4F46E5] text-sm"
            />
            <button
              onClick={addTime}
              className="px-6 h-12 bg-[#4F46E5] text-white rounded-lg font-medium hover:bg-[#4338CA] transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line mr-2"></i>
              時間を追加
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl p-8 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">投稿曜日</h3>
        <div className="space-y-6">
          <div className="grid grid-cols-7 gap-3">
            {weekDays.map((day) => (
              <button
                key={day.id}
                onClick={() => toggleDay(day.id)}
                className={`aspect-square rounded-xl text-lg font-semibold transition-all duration-200 cursor-pointer ${
                  settings.activeDays.includes(day.id)
                    ? 'bg-[#4F46E5] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setPreset('all')}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap"
            >
              毎日
            </button>
            <button
              onClick={() => setPreset('weekday')}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap"
            >
              平日のみ
            </button>
            <button
              onClick={() => setPreset('weekend')}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap"
            >
              週末のみ
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl p-8 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">制限設定</h3>
        <div className="flex items-center justify-center gap-6">
          <label className="text-sm font-medium text-gray-700">1日の最大投稿数</label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSettings({ ...settings, maxPostsPerDay: Math.max(1, settings.maxPostsPerDay - 1) })}
              className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              <i className="ri-subtract-line text-xl"></i>
            </button>
            <span className="text-5xl font-bold text-[#4F46E5] w-24 text-center">{settings.maxPostsPerDay}</span>
            <button
              onClick={() => setSettings({ ...settings, maxPostsPerDay: settings.maxPostsPerDay + 1 })}
              className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              <i className="ri-add-line text-xl"></i>
            </button>
          </div>
          <span className="text-sm text-gray-500">件</span>
        </div>
      </section>

      <div className="flex justify-center pt-4">
        <button
          onClick={async () => {
            if (onSave) {
              setSaving(true);
              try {
                await onSave({ postTimes: settings.postTimes, activeDays: settings.activeDays, maxPostsPerDay: settings.maxPostsPerDay });
                alert('スケジュール設定を保存しました');
              } catch {
                alert('保存に失敗しました');
              } finally {
                setSaving(false);
              }
            }
          }}
          disabled={saving}
          className="w-60 h-14 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white rounded-lg font-semibold text-base hover:scale-105 transition-transform duration-200 cursor-pointer whitespace-nowrap disabled:opacity-50"
        >
          {saving ? '保存中...' : 'スケジュールを保存'}
        </button>
      </div>
    </div>
  );
}
