
import { Dispatch, SetStateAction, useState } from 'react';

interface Settings {
  name: string;
  enabled: boolean;
  persona: string;
  tone: string;
  topic: string;
  topics: string[];
  topicRotation: boolean;
  avoidRecentTopics: boolean;
  recentTopicsToAvoid: number;
  contentDirection: string;
  mustInclude: string;
  mustExclude: string;
  structureTemplate: string;
  maxLength: number;
  useEmoji: boolean;
  useHashtags: boolean;
  hashtagRules: string;
  referenceInfo: string;
  examplePosts: string;
}

interface SettingsTabProps {
  settings: Settings;
  setSettings: Dispatch<SetStateAction<Settings>>;
}

export default function SettingsTab({ settings, setSettings }: SettingsTabProps) {
  const toneOptions = ['カジュアル', 'フォーマル', 'ユーモア', 'カスタム'];
  const [newTopic, setNewTopic] = useState('');

  const handleAddTopic = () => {
    if (newTopic.trim() && !settings.topics.includes(newTopic.trim())) {
      setSettings({ ...settings, topics: [...settings.topics, newTopic.trim()] });
      setNewTopic('');
    }
  };

  const handleRemoveTopic = (topicToRemove: string) => {
    setSettings({
      ...settings,
      topics: settings.topics.filter(t => t !== topicToRemove)
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTopic();
    }
  };

  const handleSave = () => {
    alert('設定を保存しました');
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

        {/* トピックローテーション設定 */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-700">トピックローテーション</h4>
              <p className="text-xs text-gray-500 mt-1">複数のトピックを順番に使って投稿の多様性を確保します</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.topicRotation}
                onChange={(e) => setSettings({ ...settings, topicRotation: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4F46E5]"></div>
            </label>
          </div>

          {settings.topicRotation && (
            <>
              {/* トピックリスト */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  トピックリスト（{settings.topics.length}件）
                </label>
                <div className="flex flex-wrap gap-2 mb-3 min-h-[40px] p-2 bg-white rounded-lg border border-gray-200">
                  {settings.topics.map((topic, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-[#4F46E5] text-white text-sm rounded-full"
                    >
                      {topic}
                      <button
                        onClick={() => handleRemoveTopic(topic)}
                        className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                  {settings.topics.length === 0 && (
                    <span className="text-gray-400 text-sm">トピックを追加してください</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="新しいトピックを入力..."
                    className="flex-1 h-10 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-sm"
                  />
                  <button
                    onClick={handleAddTopic}
                    className="px-4 h-10 bg-[#4F46E5] text-white rounded-lg text-sm font-medium hover:bg-[#4338CA] transition-colors"
                  >
                    追加
                  </button>
                </div>
              </div>

              {/* 重複防止設定 */}
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <label className="flex items-center gap-3 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={settings.avoidRecentTopics}
                    onChange={(e) => setSettings({ ...settings, avoidRecentTopics: e.target.checked })}
                    className="w-5 h-5 text-[#4F46E5] rounded cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">最近の投稿と類似トピックを避ける</span>
                    <p className="text-xs text-gray-500">同じトピックばかり投稿されるのを防ぎます</p>
                  </div>
                </label>
                {settings.avoidRecentTopics && (
                  <div className="flex items-center gap-2 mt-2 ml-8">
                    <span className="text-sm text-gray-600">直近</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={settings.recentTopicsToAvoid}
                      onChange={(e) => setSettings({ ...settings, recentTopicsToAvoid: parseInt(e.target.value) || 3 })}
                      className="w-16 h-8 px-2 border border-gray-300 rounded text-center text-sm"
                    />
                    <span className="text-sm text-gray-600">件の投稿と異なるトピックを選択</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {settings.topicRotation ? 'デフォルトテーマ（ローテーション無効時に使用）' : 'テーマ・話題'}
            </label>
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
          className="w-60 h-14 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white rounded-lg font-semibold text-base hover:scale-105 transition-transform duration-200 cursor-pointer whitespace-nowrap"
        >
          設定を保存
        </button>
      </div>
    </div>
  );
}
