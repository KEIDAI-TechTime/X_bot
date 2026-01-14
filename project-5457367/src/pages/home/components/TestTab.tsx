
import { useState } from 'react';
import { postApi, type PostSettings } from '../../../services/api';

interface TestTabProps {
  settings: PostSettings;
}

export default function TestTab({ settings }: TestTabProps) {
  const [generatedPost, setGeneratedPost] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await postApi.generate(settings);
      setGeneratedPost(result.content);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePostNow = async () => {
    if (!confirm('この内容で今すぐ投稿しますか？')) return;

    setIsPosting(true);
    setError(null);
    try {
      await postApi.postNow();
      alert('投稿しました！');
      setGeneratedPost('');
    } catch (err: any) {
      setError(err.message);
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

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex-1 h-12 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:border-[#4F46E5] hover:text-[#4F46E5] transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    <i className="ri-refresh-line mr-2"></i>
                    再生成
                  </button>
                  <button
                    onClick={handlePostNow}
                    disabled={isPosting}
                    className="flex-1 h-12 bg-[#4F46E5] text-white rounded-lg font-medium hover:bg-[#4338CA] transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    <i className="ri-send-plane-fill mr-2"></i>
                    {isPosting ? '投稿中...' : '今すぐ投稿'}
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
