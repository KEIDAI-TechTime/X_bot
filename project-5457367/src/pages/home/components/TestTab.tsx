import { useState, useMemo } from 'react';
import { mockPostHistory, mockPostsByTopic, type Settings } from '../../../mocks/postSettings';
import {
  validatePost,
  analyzeFirstLine,
  estimateDwellTime,
  calculateAlgorithmPotential,
  calculateHiraganaRatio,
  calculateKanjiRatio,
} from '../../../services/postValidator';
import { buildPromptFromSettings } from '../../../services/aiPromptBuilder';
import { CONTENT_CATEGORIES, CONTENT_FORMATS } from '../../../config/xStrategy';
import type { ValidationResult } from '../../../types/xStrategy';

interface TestTabProps {
  settings: Settings;
}

export default function TestTab({ settings }: TestTabProps) {
  const [generatedPost, setGeneratedPost] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasImage, setHasImage] = useState(false);

  // 最近の投稿から使用されたトピックを抽出
  const getRecentTopicsFromHistory = (): string[] => {
    if (!settings.avoidRecentTopics) return [];

    const recentPosts = mockPostHistory
      .slice(0, settings.recentTopicsToAvoid)
      .map(p => p.content);

    return settings.topics.filter(topic => {
      const topicKeywords = topic.toLowerCase().split(/[・/]/);
      return recentPosts.some(post =>
        topicKeywords.some(keyword => post.toLowerCase().includes(keyword))
      );
    });
  };

  // 使用可能なトピックを選択
  const selectNextTopic = (): string => {
    if (!settings.topicRotation || settings.topics.length === 0) {
      return settings.topic;
    }

    const recentTopics = getRecentTopicsFromHistory();
    const availableTopics = settings.topics.filter(t => !recentTopics.includes(t));

    const topicsToChooseFrom = availableTopics.length > 0 ? availableTopics : settings.topics;
    return topicsToChooseFrom[Math.floor(Math.random() * topicsToChooseFrom.length)];
  };

  // 投稿検証結果
  const validationResult = useMemo((): ValidationResult | null => {
    if (!generatedPost) return null;
    return validatePost(generatedPost, {
      maxLength: settings.maxLength,
      writingRules: settings.writingRules,
      hasImage,
    });
  }, [generatedPost, settings.maxLength, settings.writingRules, hasImage]);

  // 1行目分析
  const firstLineAnalysis = useMemo(() => {
    if (!generatedPost) return null;
    return analyzeFirstLine(generatedPost);
  }, [generatedPost]);

  // 滞在時間分析
  const dwellTimeAnalysis = useMemo(() => {
    if (!generatedPost) return null;
    return estimateDwellTime(generatedPost, hasImage);
  }, [generatedPost, hasImage]);

  // アルゴリズムポテンシャル
  const algorithmAnalysis = useMemo(() => {
    if (!generatedPost) return null;
    const hasUrl = /https?:\/\/[^\s]+/.test(generatedPost);
    return calculateAlgorithmPotential(generatedPost, hasImage, hasUrl);
  }, [generatedPost, hasImage]);

  // 文字種比率
  const charRatios = useMemo(() => {
    if (!generatedPost) return null;
    return {
      hiragana: calculateHiraganaRatio(generatedPost),
      kanji: calculateKanjiRatio(generatedPost),
    };
  }, [generatedPost]);

  // AIプロンプト生成
  const generatedPrompt = useMemo(() => {
    return buildPromptFromSettings(settings, selectedTopic || settings.topic);
  }, [settings, selectedTopic]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const topic = selectNextTopic();
      setSelectedTopic(topic);

      // トピックに対応する投稿を取得
      const postsForTopic = mockPostsByTopic[topic] || mockPostsByTopic['default'];
      const randomPost = postsForTopic[Math.floor(Math.random() * postsForTopic.length)];

      setGeneratedPost(randomPost.content);
      setHasImage(CONTENT_FORMATS.find(f => f.id === settings.contentFormat)?.hasImage || false);
      setIsGenerating(false);
    }, 1500);
  };

  const handlePostNow = () => {
    if (confirm('この内容で今すぐ投稿しますか？')) {
      alert('投稿しました！');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const selectedCategory = CONTENT_CATEGORIES.find(c => c.id === settings.contentCategory);
  const selectedFormat = CONTENT_FORMATS.find(f => f.id === settings.contentFormat);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-5 gap-6">
        {/* 左サイドバー */}
        <div className="col-span-2 space-y-6">
          {/* コントロールパネル */}
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">コントロールパネル</h3>

            {/* 画像トグル */}
            <label className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg cursor-pointer">
              <div>
                <span className="font-medium text-gray-900">画像付き投稿</span>
                <p className="text-xs text-gray-500">画像があるとアルゴリズムスコアが上がります</p>
              </div>
              <input
                type="checkbox"
                checked={hasImage}
                onChange={(e) => setHasImage(e.target.checked)}
                className="w-5 h-5 text-[#4F46E5] rounded"
              />
            </label>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full h-14 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white rounded-lg font-semibold text-base hover:scale-105 transition-transform duration-200 cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                  生成中...
                </>
              ) : (
                <>
                  <i className="ri-magic-line mr-2"></i>
                  生成してプレビュー
                </>
              )}
            </button>

            <button
              onClick={() => setShowPrompt(!showPrompt)}
              className="w-full mt-3 h-10 text-[#4F46E5] border border-[#4F46E5] rounded-lg text-sm hover:bg-indigo-50 transition-colors"
            >
              {showPrompt ? 'AIプロンプトを隠す' : 'AIプロンプトを表示'}
            </button>

            <p className="text-xs text-gray-500 mt-4 leading-relaxed">
              ※ このタブは設定変更時の確認用です。通常運用では自動投稿されるため、このタブを使用する必要はありません。
            </p>
          </div>

          {/* 現在の戦略設定 */}
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">適用中の戦略</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-gray-500 w-28 shrink-0">コンテンツタイプ:</span>
                <span className="font-medium text-gray-900">{selectedCategory?.name}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-500 w-28 shrink-0">投稿の型:</span>
                <span className="font-medium text-gray-900">{selectedFormat?.name}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-500 w-28 shrink-0">トーン:</span>
                <span className="font-medium text-gray-900">{settings.tone}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-500 w-28 shrink-0">ローテーション:</span>
                <span className="font-medium text-gray-900">
                  {settings.topicRotation ? `有効（${settings.topics.length}件）` : '無効'}
                </span>
              </div>
              {settings.topicRotation && settings.avoidRecentTopics && (
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 w-28 shrink-0">重複防止:</span>
                  <span className="font-medium text-green-600">
                    直近{settings.recentTopicsToAvoid}件を回避
                  </span>
                </div>
              )}
              {selectedTopic && (
                <div className="p-2 bg-blue-50 rounded-lg border border-blue-200 mt-2">
                  <span className="text-gray-500 text-xs">選択されたトピック:</span>
                  <p className="font-medium text-blue-600">{selectedTopic}</p>
                </div>
              )}
            </div>
          </div>

          {/* AIプロンプト表示 */}
          {showPrompt && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AIプロンプト</h3>
              <pre className="text-xs text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg max-h-96 overflow-auto">
                {generatedPrompt}
              </pre>
            </div>
          )}
        </div>

        {/* メインコンテンツ */}
        <div className="col-span-3 space-y-6">
          {/* プレビュー */}
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">プレビュー</h3>
            {generatedPost ? (
              <div className="space-y-6">
                <div className="border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-full flex items-center justify-center">
                      <i className="ri-user-line text-white text-xl"></i>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">X Auto Poster</div>
                      <div className="text-sm text-gray-500">@xautoposter · 今</div>
                    </div>
                  </div>
                  <p className="text-lg text-gray-900 leading-relaxed mb-4 whitespace-pre-wrap">{generatedPost}</p>

                  {/* 画像プレースホルダー */}
                  {hasImage && (
                    <div className="mb-4 bg-gray-100 rounded-xl aspect-video flex items-center justify-center">
                      <div className="text-center text-gray-400">
                        <i className="ri-image-line text-4xl"></i>
                        <p className="text-sm mt-2">画像が添付されます</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-8 text-gray-500 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 cursor-pointer hover:text-blue-500">
                      <i className="ri-chat-3-line text-xl"></i>
                      <span className="text-sm">0</span>
                    </div>
                    <div className="flex items-center gap-2 cursor-pointer hover:text-green-500">
                      <i className="ri-repeat-line text-xl"></i>
                      <span className="text-sm">0</span>
                    </div>
                    <div className="flex items-center gap-2 cursor-pointer hover:text-red-500">
                      <i className="ri-heart-line text-xl"></i>
                      <span className="text-sm">0</span>
                    </div>
                    <div className="flex items-center gap-2 cursor-pointer hover:text-blue-500">
                      <i className="ri-share-line text-xl"></i>
                    </div>
                  </div>
                </div>

                {/* 文字数表示 */}
                <div className="flex items-center justify-between px-2">
                  <span className="text-sm text-gray-500">
                    文字数: {generatedPost.length} / {settings.maxLength}
                  </span>
                  <span className={`text-sm font-medium ${generatedPost.length > settings.maxLength ? 'text-red-600' : 'text-green-600'}`}>
                    {generatedPost.length <= settings.maxLength ? '制限内' : `${generatedPost.length - settings.maxLength}文字オーバー`}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleGenerate}
                    className="flex-1 h-12 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:border-[#4F46E5] hover:text-[#4F46E5] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-refresh-line mr-2"></i>
                    再生成
                  </button>
                  <button
                    onClick={handlePostNow}
                    className="flex-1 h-12 bg-[#4F46E5] text-white rounded-lg font-medium hover:bg-[#4338CA] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-send-plane-fill mr-2"></i>
                    今すぐ投稿
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
                <i className="ri-article-line text-6xl text-gray-300 mb-4"></i>
                <p className="text-gray-500">「生成してプレビュー」ボタンをクリックして投稿を生成してください</p>
              </div>
            )}
          </div>

          {/* 検証結果 */}
          {validationResult && generatedPost && (
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">戦略検証結果</h3>

              {/* スコアサマリー */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className={`p-4 rounded-lg ${getScoreBgColor(validationResult.algorithmScore)}`}>
                  <p className="text-xs text-gray-600 mb-1">アルゴリズムスコア</p>
                  <p className={`text-2xl font-bold ${getScoreColor(validationResult.algorithmScore)}`}>
                    {validationResult.algorithmScore}
                    <span className="text-sm font-normal">/100</span>
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${getScoreBgColor(validationResult.score)}`}>
                  <p className="text-xs text-gray-600 mb-1">総合スコア</p>
                  <p className={`text-2xl font-bold ${getScoreColor(validationResult.score)}`}>
                    {validationResult.score}
                    <span className="text-sm font-normal">/100</span>
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${dwellTimeAnalysis?.meetsTarget ? 'bg-green-100' : 'bg-yellow-100'}`}>
                  <p className="text-xs text-gray-600 mb-1">推定滞在時間</p>
                  <p className={`text-2xl font-bold ${dwellTimeAnalysis?.meetsTarget ? 'text-green-600' : 'text-yellow-600'}`}>
                    {dwellTimeAnalysis?.estimatedSeconds}
                    <span className="text-sm font-normal">秒</span>
                  </p>
                </div>
              </div>

              {/* 詳細分析 */}
              <div className="space-y-4">
                {/* 1行目分析 */}
                {firstLineAnalysis && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">1行目の効果</h4>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${firstLineAnalysis.isEffective ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {firstLineAnalysis.isEffective ? '効果的' : '改善余地あり'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">「{firstLineAnalysis.line.slice(0, 50)}...」</p>
                    {firstLineAnalysis.matchedPatterns.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {firstLineAnalysis.matchedPatterns.map((pattern) => (
                          <span key={pattern} className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded">
                            {pattern}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 文字種比率 */}
                {charRatios && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">文字種比率</h4>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span>ひらがな</span>
                          <span className={charRatios.hiragana >= 60 ? 'text-green-600' : 'text-yellow-600'}>
                            {charRatios.hiragana}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${charRatios.hiragana >= 60 ? 'bg-green-500' : 'bg-yellow-500'}`}
                            style={{ width: `${charRatios.hiragana}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span>漢字</span>
                          <span className={charRatios.kanji <= 40 ? 'text-green-600' : 'text-red-600'}>
                            {charRatios.kanji}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${charRatios.kanji <= 40 ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${charRatios.kanji}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">推奨: ひらがな70% / 漢字30%</p>
                  </div>
                )}

                {/* アルゴリズム要因 */}
                {algorithmAnalysis && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">アルゴリズム評価要因</h4>
                    <div className="space-y-2">
                      {algorithmAnalysis.factors.map((factor, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className={factor.achieved ? 'text-gray-700' : 'text-gray-400'}>
                            {factor.achieved ? '✓' : '○'} {factor.name}
                          </span>
                          <span className={factor.achieved ? 'text-green-600 font-medium' : 'text-gray-400'}>
                            {factor.impact}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 問題点 */}
                {validationResult.issues.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">検出された問題</h4>
                    <div className="space-y-2">
                      {validationResult.issues.map((issue, i) => (
                        <div key={i} className={`flex items-start gap-2 text-sm p-2 rounded ${
                          issue.type === 'error' ? 'bg-red-50 text-red-700' :
                          issue.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                          'bg-blue-50 text-blue-700'
                        }`}>
                          <span>
                            {issue.type === 'error' ? '⚠️' : issue.type === 'warning' ? '⚡' : 'ℹ️'}
                          </span>
                          <span>{issue.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 改善提案 */}
                {validationResult.suggestions.length > 0 && (
                  <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <h4 className="font-semibold text-indigo-900 mb-3">改善提案</h4>
                    <ul className="space-y-1">
                      {validationResult.suggestions.map((suggestion, i) => (
                        <li key={i} className="text-sm text-indigo-700 flex items-start gap-2">
                          <span className="text-indigo-500">💡</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
