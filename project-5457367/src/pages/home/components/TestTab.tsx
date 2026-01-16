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
import { generatePostWithAI, isAIConfigured } from '../../../services/aiService';
import { postToX } from '../../../services/xPostService';
import { CONTENT_CATEGORIES, CONTENT_FORMATS } from '../../../config/xStrategy';
import type { ValidationResult } from '../../../types/xStrategy';

interface TestTabProps {
  settings: Settings;
}

export default function TestTab({ settings }: TestTabProps) {
  const [generatedPost, setGeneratedPost] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [postResult, setPostResult] = useState<{ success: boolean; message: string; tweetId?: string } | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasImage, setHasImage] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [aiError, setAiError] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<{ input: number; output: number } | null>(null);

  const aiConfigured = isAIConfigured();

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

  // モックデータから投稿を取得（フォールバック用）
  const generateFromMock = (topic: string): string => {
    const postsForTopic = mockPostsByTopic[topic] || mockPostsByTopic['default'];
    const randomPost = postsForTopic[Math.floor(Math.random() * postsForTopic.length)];
    return randomPost.content;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setAiError(null);
    setTokenUsage(null);

    const topic = selectNextTopic();
    setSelectedTopic(topic);

    // 戦略設定に基づいたプロンプトを生成
    const prompt = buildPromptFromSettings(settings, topic);

    if (useAI && aiConfigured) {
      // AI APIを呼び出して投稿を生成
      const result = await generatePostWithAI({
        prompt,
        maxTokens: 500,
        temperature: 0.7,
      });

      if (result.success) {
        setGeneratedPost(result.content);
        if (result.usage) {
          setTokenUsage({
            input: result.usage.inputTokens,
            output: result.usage.outputTokens,
          });
        }
      } else {
        setAiError(result.error || 'AI生成に失敗しました');
        // フォールバック: モックデータを使用
        setGeneratedPost(generateFromMock(topic));
      }
    } else {
      // モックデータを使用（AI未設定時）
      await new Promise(resolve => setTimeout(resolve, 500)); // 少し待機
      setGeneratedPost(generateFromMock(topic));
    }

    setHasImage(CONTENT_FORMATS.find(f => f.id === settings.contentFormat)?.hasImage || false);
    setIsGenerating(false);
  };

  const handlePostNow = async () => {
    if (!generatedPost) return;

    if (!confirm('この内容で今すぐXに投稿しますか？')) {
      return;
    }

    setIsPosting(true);
    setPostResult(null);

    try {
      const result = await postToX(generatedPost);

      if (result.success) {
        setPostResult({
          success: true,
          message: '投稿が完了しました！',
          tweetId: result.tweetId,
        });
      } else {
        setPostResult({
          success: false,
          message: result.error || '投稿に失敗しました',
        });
      }
    } catch (error) {
      setPostResult({
        success: false,
        message: error instanceof Error ? error.message : '予期しないエラーが発生しました',
      });
    } finally {
      setIsPosting(false);
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

            {/* AI設定状態 */}
            <div className={`mb-4 p-3 rounded-lg ${aiConfigured ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${aiConfigured ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                <span className={`text-sm font-medium ${aiConfigured ? 'text-green-700' : 'text-yellow-700'}`}>
                  {aiConfigured ? 'AI連携: 有効' : 'AI連携: 未設定'}
                </span>
              </div>
              {!aiConfigured && (
                <p className="text-xs text-yellow-600 mt-1">
                  ANTHROPIC_API_KEYを設定してください
                </p>
              )}
            </div>

            {/* AI使用トグル */}
            {aiConfigured && (
              <label className="flex items-center justify-between mb-4 p-3 bg-indigo-50 rounded-lg cursor-pointer border border-indigo-200">
                <div>
                  <span className="font-medium text-indigo-900">AI生成を使用</span>
                  <p className="text-xs text-indigo-600">OFFにするとモックデータを使用します</p>
                </div>
                <input
                  type="checkbox"
                  checked={useAI}
                  onChange={(e) => setUseAI(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded"
                />
              </label>
            )}

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
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {useAI && aiConfigured ? 'AI生成中...' : '生成中...'}
                </span>
              ) : (
                <span>
                  {useAI && aiConfigured ? '🤖 AIで生成' : '生成してプレビュー'}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowPrompt(!showPrompt)}
              className="w-full mt-3 h-10 text-[#4F46E5] border border-[#4F46E5] rounded-lg text-sm hover:bg-indigo-50 transition-colors"
            >
              {showPrompt ? 'AIプロンプトを隠す' : 'AIプロンプトを表示'}
            </button>

            {/* トークン使用量 */}
            {tokenUsage && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                <p className="font-medium text-gray-700 mb-2">トークン使用量</p>
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="block text-gray-400">入力</span>
                    <span className="font-mono">{tokenUsage.input}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400">出力</span>
                    <span className="font-mono">{tokenUsage.output}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400">合計</span>
                    <span className="font-mono font-medium">{tokenUsage.input + tokenUsage.output}</span>
                  </div>
                </div>
              </div>
            )}

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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AIプロンプト（実際にAIに送信される内容）</h3>
              <pre className="text-xs text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg max-h-96 overflow-auto border border-gray-200">
                {generatedPrompt}
              </pre>
            </div>
          )}
        </div>

        {/* メインコンテンツ */}
        <div className="col-span-3 space-y-6">
          {/* AIエラー表示 */}
          {aiError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-red-500 text-xl">⚠️</span>
                <div>
                  <p className="font-medium text-red-800">AI生成エラー</p>
                  <p className="text-sm text-red-600 mt-1">{aiError}</p>
                  <p className="text-xs text-red-500 mt-2">モックデータを使用して表示しています</p>
                </div>
              </div>
            </div>
          )}

          {/* プレビュー */}
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">プレビュー</h3>
              {generatedPost && useAI && aiConfigured && !aiError && (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  🤖 AI生成
                </span>
              )}
            </div>
            {generatedPost ? (
              <div className="space-y-6">
                <div className="border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                      </svg>
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
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm mt-2">画像が添付されます</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-8 text-gray-500 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 cursor-pointer hover:text-blue-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="text-sm">0</span>
                    </div>
                    <div className="flex items-center gap-2 cursor-pointer hover:text-green-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="text-sm">0</span>
                    </div>
                    <div className="flex items-center gap-2 cursor-pointer hover:text-red-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span className="text-sm">0</span>
                    </div>
                    <div className="flex items-center gap-2 cursor-pointer hover:text-blue-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
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

                {/* 投稿結果表示 */}
                {postResult && (
                  <div className={`p-4 rounded-lg ${postResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{postResult.success ? '✅' : '❌'}</span>
                      <div>
                        <p className={`font-medium ${postResult.success ? 'text-green-800' : 'text-red-800'}`}>
                          {postResult.message}
                        </p>
                        {postResult.tweetId && (
                          <a
                            href={`https://x.com/i/web/status/${postResult.tweetId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                          >
                            投稿を確認する →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || isPosting}
                    className="flex-1 h-12 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:border-[#4F46E5] hover:text-[#4F46E5] transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    再生成
                  </button>
                  <button
                    onClick={handlePostNow}
                    disabled={isPosting || !generatedPost}
                    className="flex-1 h-12 bg-[#4F46E5] text-white rounded-lg font-medium hover:bg-[#4338CA] transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPosting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        投稿中...
                      </span>
                    ) : (
                      '今すぐ投稿'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500">「{useAI && aiConfigured ? '🤖 AIで生成' : '生成してプレビュー'}」ボタンをクリックして投稿を生成してください</p>
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
                    <p className="text-sm text-gray-700 mb-2">「{firstLineAnalysis.line.slice(0, 50)}{firstLineAnalysis.line.length > 50 ? '...' : ''}」</p>
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
