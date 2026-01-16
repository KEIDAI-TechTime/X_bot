import { Dispatch, SetStateAction, useState } from 'react';
import type { Settings } from '../../../mocks/postSettings';
import type {
  ContentCategory,
  ContentFormat,
  FirstLinePattern,
  ProvenPattern,
} from '../../../types/xStrategy';
import {
  CONTENT_CATEGORIES,
  CONTENT_FORMATS,
  FIRST_LINE_PATTERNS,
  PROVEN_PATTERNS,
  ALGORITHM_SCORES,
  STRATEGY_CHECKLIST,
} from '../../../config/xStrategy';

interface SettingsTabProps {
  settings: Settings;
  setSettings: Dispatch<SetStateAction<Settings>>;
}

export default function SettingsTab({ settings, setSettings }: SettingsTabProps) {
  const toneOptions = ['カジュアル', 'フォーマル', 'ユーモア', 'カスタム'];
  const [newTopic, setNewTopic] = useState('');
  const [activeStrategyTab, setActiveStrategyTab] = useState<'category' | 'format' | 'firstline' | 'algorithm'>('category');

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTopic();
    }
  };

  const handleProvenPatternToggle = (patternId: ProvenPattern) => {
    const current = settings.provenPatterns || [];
    if (current.includes(patternId)) {
      setSettings({
        ...settings,
        provenPatterns: current.filter(p => p !== patternId)
      });
    } else {
      setSettings({
        ...settings,
        provenPatterns: [...current, patternId]
      });
    }
  };

  const handleSave = () => {
    alert('設定を保存しました');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 基本設定 */}
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

      {/* キャラクター・トーン */}
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

      {/* X投稿戦略設定（新規追加） */}
      <section className="bg-white rounded-xl p-8 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">X投稿戦略</h3>
        <p className="text-sm text-gray-500 mb-6">バズるコンテンツの作成方法を設定します</p>

        {/* 戦略タブ */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {[
            { id: 'category', label: 'コンテンツタイプ' },
            { id: 'format', label: '投稿の型' },
            { id: 'firstline', label: '1行目パターン' },
            { id: 'algorithm', label: 'アルゴリズム対策' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveStrategyTab(tab.id as typeof activeStrategyTab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeStrategyTab === tab.id
                  ? 'border-[#4F46E5] text-[#4F46E5]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* コンテンツタイプ */}
        {activeStrategyTab === 'category' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">バズるコンテンツの4つの基本パターンから選択してください。<span className="text-green-600 font-medium">「共感できる」が最もおすすめです。</span></p>
            <div className="grid grid-cols-2 gap-4">
              {CONTENT_CATEGORIES.map((category) => (
                <div
                  key={category.id}
                  onClick={() => setSettings({ ...settings, contentCategory: category.id })}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    settings.contentCategory === category.id
                      ? 'border-[#4F46E5] bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{category.name}</h4>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      category.riskLevel === 'low' ? 'bg-green-100 text-green-700' :
                      category.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {category.riskLevel === 'low' ? '低リスク' :
                       category.riskLevel === 'medium' ? '中リスク' : '高リスク'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                  <div className="space-y-1">
                    {category.tips.slice(0, 2).map((tip, i) => (
                      <p key={i} className="text-xs text-gray-500 flex items-start gap-1">
                        <span className="text-green-500">✓</span> {tip}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 投稿の型 */}
        {activeStrategyTab === 'format' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">6つの投稿フォーマットから選択してください。実績のある型を使うことでバズりやすくなります。</p>
            <div className="grid grid-cols-2 gap-4">
              {CONTENT_FORMATS.map((format) => (
                <div
                  key={format.id}
                  onClick={() => setSettings({ ...settings, contentFormat: format.id })}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    settings.contentFormat === format.id
                      ? 'border-[#4F46E5] bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{format.name}</h4>
                    {format.hasImage && (
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                        画像付き
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{format.description}</p>
                  {format.exampleLikes && (
                    <p className="text-xs text-indigo-600">
                      実績: {format.exampleLikes.toLocaleString()}いいね
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 1行目パターン */}
        {activeStrategyTab === 'firstline' && (
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-600 mb-4">1行目は読者が続きを読むかどうかを決める最重要ポイントです。効果的なパターンを選択してください。</p>
              <div className="space-y-3">
                {FIRST_LINE_PATTERNS.map((pattern) => (
                  <div
                    key={pattern.id}
                    onClick={() => setSettings({ ...settings, firstLinePattern: pattern.id })}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      settings.firstLinePattern === pattern.id
                        ? 'border-[#4F46E5] bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        settings.firstLinePattern === pattern.id
                          ? 'border-[#4F46E5] bg-[#4F46E5]'
                          : 'border-gray-300'
                      }`}>
                        {settings.firstLinePattern === pattern.id && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{pattern.name}</h4>
                        <p className="text-sm text-gray-500">テンプレート: {pattern.template}</p>
                        <p className="text-xs text-indigo-600 mt-1">例: {pattern.example}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 実績のある表現パターン */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-semibold text-gray-900 mb-3">実績のある表現パターン（複数選択可）</h4>
              <p className="text-sm text-gray-500 mb-4">投稿に活用できる実績のあるパターンを選択してください</p>
              <div className="grid grid-cols-2 gap-3">
                {PROVEN_PATTERNS.map((pattern) => (
                  <label
                    key={pattern.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                      (settings.provenPatterns || []).includes(pattern.id)
                        ? 'border-[#4F46E5] bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={(settings.provenPatterns || []).includes(pattern.id)}
                      onChange={() => handleProvenPatternToggle(pattern.id)}
                      className="mt-0.5 w-4 h-4 text-[#4F46E5] rounded"
                    />
                    <div>
                      <span className="font-medium text-sm text-gray-900">{pattern.name}</span>
                      <p className="text-xs text-gray-500">{pattern.template}</p>
                      {pattern.exampleLikes && (
                        <p className="text-xs text-indigo-600">{pattern.exampleLikes.toLocaleString()}いいね実績</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* アルゴリズム対策 */}
        {activeStrategyTab === 'algorithm' && (
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-600 mb-4">Xのアルゴリズムを理解し、表示優先度を高める設定を行います。</p>

              {/* アルゴリズム採点基準 */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">アルゴリズム採点基準（参考）</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {ALGORITHM_SCORES.map((score) => (
                    <div key={score.action} className="flex justify-between items-center py-1">
                      <span className="text-gray-600">{score.description}</span>
                      <span className={`font-mono ${score.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {score.points >= 0 ? '+' : ''}{score.points}点
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* アルゴリズム対策設定 */}
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-[#4F46E5]">
                  <div>
                    <span className="font-medium text-gray-900">URLリンクを避ける</span>
                    <p className="text-sm text-gray-500">外部リンクは表示が抑制されます（lazy linking）</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.avoidUrls}
                    onChange={(e) => setSettings({ ...settings, avoidUrls: e.target.checked })}
                    className="w-5 h-5 text-[#4F46E5] rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-[#4F46E5]">
                  <div>
                    <span className="font-medium text-gray-900">画像付き投稿を優先</span>
                    <p className="text-sm text-gray-500">画像があると情報量が増え、滞在時間が伸びます</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.preferImages}
                    onChange={(e) => setSettings({ ...settings, preferImages: e.target.checked })}
                    className="w-5 h-5 text-[#4F46E5] rounded"
                  />
                </label>

                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-medium text-gray-900">目標滞在時間</span>
                      <p className="text-sm text-gray-500">2分以上の滞在で+11点のスコア</p>
                    </div>
                    <span className="text-lg font-semibold text-[#4F46E5]">{settings.targetDwellTime}秒</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="300"
                    step="30"
                    value={settings.targetDwellTime}
                    onChange={(e) => setSettings({ ...settings, targetDwellTime: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>60秒</span>
                    <span>120秒（推奨）</span>
                    <span>300秒</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* トピック設定 */}
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
                    onKeyDown={handleKeyDown}
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

      {/* 投稿の構成 */}
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

      {/* ライティングルール */}
      <section className="bg-white rounded-xl p-8 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">ライティングルール</h3>
        <p className="text-sm text-gray-500 mb-6">読みやすい文章を書くためのルール設定</p>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">読みやすさレベル</label>
            <div className="flex gap-2">
              {[
                { id: 'middle_school', label: '中学生' },
                { id: 'high_school', label: '高校生' },
                { id: 'college', label: '大学生' },
              ].map((level) => (
                <button
                  key={level.id}
                  onClick={() => setSettings({
                    ...settings,
                    writingRules: { ...settings.writingRules, readabilityLevel: level.id as 'middle_school' | 'high_school' | 'college' }
                  })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    settings.writingRules.readabilityLevel === level.id
                      ? 'bg-[#4F46E5] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">推奨: 中学生（誰でも理解できる）</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ひらがな:漢字 比率 ({settings.writingRules.hiraganaRatio}:{settings.writingRules.kanjiRatio})
            </label>
            <input
              type="range"
              min="50"
              max="90"
              value={settings.writingRules.hiraganaRatio}
              onChange={(e) => {
                const hiragana = parseInt(e.target.value);
                setSettings({
                  ...settings,
                  writingRules: {
                    ...settings.writingRules,
                    hiraganaRatio: hiragana,
                    kanjiRatio: 100 - hiragana
                  }
                });
              }}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-2">推奨: 70:30（漢字を使いすぎない）</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              同じ語尾の最大連続回数: {settings.writingRules.maxConsecutiveSameEnding}回
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={settings.writingRules.maxConsecutiveSameEnding}
              onChange={(e) => setSettings({
                ...settings,
                writingRules: { ...settings.writingRules, maxConsecutiveSameEnding: parseInt(e.target.value) }
              })}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-2">推奨: 2回（バリエーションを持たせる）</p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.writingRules.useHalfWidthNumbers}
                onChange={(e) => setSettings({
                  ...settings,
                  writingRules: { ...settings.writingRules, useHalfWidthNumbers: e.target.checked }
                })}
                className="w-5 h-5 text-[#4F46E5] rounded"
              />
              <span className="text-sm font-medium text-gray-700">数字は半角を使用</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.writingRules.omitConjunctions}
                onChange={(e) => setSettings({
                  ...settings,
                  writingRules: { ...settings.writingRules, omitConjunctions: e.target.checked }
                })}
                className="w-5 h-5 text-[#4F46E5] rounded"
              />
              <span className="text-sm font-medium text-gray-700">順接の接続詞を省略</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.writingRules.useListFormat}
                onChange={(e) => setSettings({
                  ...settings,
                  writingRules: { ...settings.writingRules, useListFormat: e.target.checked }
                })}
                className="w-5 h-5 text-[#4F46E5] rounded"
              />
              <span className="text-sm font-medium text-gray-700">箇条書きを積極的に使用</span>
            </label>
          </div>
        </div>
      </section>

      {/* 参考情報 */}
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

      {/* 戦略チェックリスト */}
      <section className="bg-white rounded-xl p-8 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">戦略チェックリスト</h3>
        <p className="text-sm text-gray-500 mb-6">投稿前に確認すべき項目</p>

        <div className="grid grid-cols-2 gap-6">
          {Object.entries(STRATEGY_CHECKLIST).map(([category, items]) => (
            <div key={category} className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3 capitalize">
                {category === 'algorithm' ? 'アルゴリズム対策' :
                 category === 'positioning' ? 'ポジショニング' :
                 category === 'content' ? 'コンテンツ' : '運用姿勢'}
              </h4>
              <div className="space-y-2">
                {items.map((item) => (
                  <label key={item.id} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-[#4F46E5] rounded" />
                    <span className="text-sm text-gray-700">{item.text}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
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
