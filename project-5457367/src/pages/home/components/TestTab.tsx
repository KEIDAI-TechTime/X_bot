
import { useState } from 'react';

interface Settings {
  persona: string;
  tone: string;
  topic: string;
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

interface TestTabProps {
  settings: Settings;
}

export default function TestTab({ settings }: TestTabProps) {
  const [generatedPost, setGeneratedPost] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const mockGeneratedPosts = [
    '🚀 2025年のAIトレンド予測！自然言語処理がさらに進化し、誰でも簡単にAIを活用できる時代に。今から準備を始めましょう💡 #AI #テクノロジー #未来',
    '💼 リモートワークの新常識：非同期コミュニケーションが鍵。時間に縛られない働き方で生産性が2倍に！あなたのチームは準備できていますか？ #リモートワーク #働き方改革',
    '📊 データドリブン経営の実践法：KPIを3つに絞り込むことで意思決定スピードが劇的に向上。シンプルが最強です✨ #データ分析 #経営戦略',
    '🎯 目標達成率を上げる秘訣：毎朝5分の振り返りタイム。小さな習慣が大きな成果を生みます。今日から始めてみませんか？ #自己啓発 #習慣化',
  ];

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const randomPost = mockGeneratedPosts[Math.floor(Math.random() * mockGeneratedPosts.length)];
      setGeneratedPost(randomPost);
      setIsGenerating(false);
    }, 1500);
  };

  const [isPosting, setIsPosting] = useState(false);

  const handlePostNow = async () => {
    if (!confirm('この内容で今すぐ投稿しますか？')) {
      return;
    }

    setIsPosting(true);
    try {
      const response = await fetch('/api/post-tweet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: generatedPost }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`投稿しました！\nTweet ID: ${data.tweet.id}`);
        setGeneratedPost('');
      } else {
        alert(`投稿に失敗しました: ${data.error}\n${data.details || ''}`);
      }
    } catch (error) {
      alert('投稿に失敗しました。ネットワークエラーが発生しました。');
      console.error('Post error:', error);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">コントロールパネル</h3>
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
            <p className="text-xs text-gray-500 mt-4 leading-relaxed">
              ※ このタブは設定変更時の確認用です。通常運用では自動投稿されるため、このタブを使用する必要はありません。
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">現在の設定</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">トーン:</span>
                <span className="ml-2 font-medium text-gray-900">{settings.tone}</span>
              </div>
              <div>
                <span className="text-gray-500">テーマ:</span>
                <span className="ml-2 font-medium text-gray-900">{settings.topic}</span>
              </div>
              <div>
                <span className="text-gray-500">最大文字数:</span>
                <span className="ml-2 font-medium text-gray-900">{settings.maxLength}文字</span>
              </div>
              <div>
                <span className="text-gray-500">絵文字:</span>
                <span className="ml-2 font-medium text-gray-900">{settings.useEmoji ? '使用する' : '使用しない'}</span>
              </div>
              <div>
                <span className="text-gray-500">ハッシュタグ:</span>
                <span className="ml-2 font-medium text-gray-900">{settings.useHashtags ? '使用する' : '使用しない'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-3">
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
                  <p className="text-lg text-gray-900 leading-relaxed mb-4">{generatedPost}</p>
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
                    disabled={isPosting}
                    className="flex-1 h-12 bg-[#4F46E5] text-white rounded-lg font-medium hover:bg-[#4338CA] transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPosting ? (
                      <>
                        <i className="ri-loader-4-line animate-spin mr-2"></i>
                        投稿中...
                      </>
                    ) : (
                      <>
                        <i className="ri-send-plane-fill mr-2"></i>
                        今すぐ投稿
                      </>
                    )}
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
        </div>
      </div>
    </div>
  );
}
