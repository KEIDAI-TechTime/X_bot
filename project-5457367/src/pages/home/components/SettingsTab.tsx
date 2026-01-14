
import { Dispatch, SetStateAction, useState } from 'react';
import type { PostSettings } from '../../../services/api';

interface SettingsTabProps {
  settings: PostSettings;
  setSettings: Dispatch<SetStateAction<PostSettings>>;
  onSave?: (settings: Partial<PostSettings>) => Promise<void>;
}

export default function SettingsTab({ settings, setSettings, onSave }: SettingsTabProps) {
  const toneOptions = ['カジュアル', 'フォーマル', 'ユーモア', 'カスタム'];
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (onSave) {
      setSaving(true);
      try {
        await onSave(settings);
        alert('設定を保存しました');
      } catch (err) {
        alert('保存に失敗しました');
      } finally {
        setSaving(false);
      }
    } else {
      alert('設定を保存しました');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <section className="bg-white rounded-xl p-8 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">基本設定</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">設定名</label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-sm"
            />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl p-8 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">キャラクター・トーン</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">ペルソナ</label>
            <textarea
              value={settings.persona}
              onChange={(e) => setSettings({ ...settings, persona: e.target.value })}
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-sm resize-none"
              placeholder="投稿者のキャラクター設定を入力してください"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">トーン</label>
            <div className="flex gap-3">
              {toneOptions.map((tone) => (
                <button
                  key={tone}
                  onClick={() => setSettings({ ...settings, tone })}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                    settings.tone === tone
                      ? 'bg-[#4F46E5] text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-[#4F46E5]'
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl p-8 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">投稿内容の指示</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">テーマ・話題</label>
            <textarea
              value={settings.topic}
              onChange={(e) => setSettings({ ...settings, topic: e.target.value })}
              className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">内容の方向性</label>
            <textarea
              value={settings.contentDirection}
              onChange={(e) => setSettings({ ...settings, contentDirection: e.target.value })}
              className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">必ず含める要素</label>
            <textarea
              value={settings.mustInclude}
              onChange={(e) => setSettings({ ...settings, mustInclude: e.target.value })}
              className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">避ける要素</label>
            <textarea
              value={settings.mustExclude}
              onChange={(e) => setSettings({ ...settings, mustExclude: e.target.value })}
              className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-sm resize-none"
            />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl p-8 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">投稿の構成</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">構成テンプレート</label>
            <textarea
              value={settings.structureTemplate}
              onChange={(e) => setSettings({ ...settings, structureTemplate: e.target.value })}
              className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-sm resize-none"
            />
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">最大文字数</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="50"
                  max="280"
                  value={settings.maxLength}
                  onChange={(e) => setSettings({ ...settings, maxLength: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <input
                  type="number"
                  value={settings.maxLength}
                  onChange={(e) => setSettings({ ...settings, maxLength: parseInt(e.target.value) })}
                  className="w-20 h-10 px-3 border border-gray-300 rounded-lg text-center text-sm"
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.useEmoji}
                  onChange={(e) => setSettings({ ...settings, useEmoji: e.target.checked })}
                  className="w-5 h-5 text-[#4F46E5] rounded cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700">絵文字を使用</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.useHashtags}
                  onChange={(e) => setSettings({ ...settings, useHashtags: e.target.checked })}
                  className="w-5 h-5 text-[#4F46E5] rounded cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700">ハッシュタグを使用</span>
              </label>
            </div>
            {settings.useHashtags && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ハッシュタグルール</label>
                <input
                  type="text"
                  value={settings.hashtagRules}
                  onChange={(e) => setSettings({ ...settings, hashtagRules: e.target.value })}
                  className="w-full h-10 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-sm"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl p-8 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">参考情報</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">AIへの追加コンテキスト</label>
            <textarea
              value={settings.referenceInfo}
              onChange={(e) => setSettings({ ...settings, referenceInfo: e.target.value })}
              className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-sm resize-none"
              placeholder="AIが参考にする追加情報を入力してください"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">参考にする投稿例</label>
            <textarea
              value={settings.examplePosts}
              onChange={(e) => setSettings({ ...settings, examplePosts: e.target.value })}
              className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-sm resize-none"
              placeholder="理想的な投稿例を入力してください"
            />
          </div>
        </div>
      </section>

      <div className="flex justify-center pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-60 h-14 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white rounded-lg font-semibold text-base hover:scale-105 transition-transform duration-200 cursor-pointer whitespace-nowrap disabled:opacity-50"
        >
          {saving ? '保存中...' : '設定を保存'}
        </button>
      </div>
    </div>
  );
}
