
import { useState } from 'react';
import { mockPostHistory } from '../../../mocks/postSettings';

interface Settings {
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

interface TestTabProps {
  settings: Settings;
}

export default function TestTab({ settings }: TestTabProps) {
  const [generatedPost, setGeneratedPost] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // トピックごとのモック投稿（実際にはAIが生成）
  const mockPostsByTopic: { [key: string]: string[] } = {
    'AI・機械学習の最新動向': [
      '🤖 機械学習モデルのファインチューニングが簡単に！数行のコードで自社データに最適化できる時代。専門知識がなくてもAI活用が可能に #AI #機械学習',
      '💡 AIエージェントが注目を集めています。タスクを自動で実行してくれる「働くAI」の時代がすぐそこに。あなたの業務はどう変わる？ #AIエージェント #自動化',
    ],
    'リモートワーク・生産性向上': [
      '💼 リモートワークの新常識：非同期コミュニケーションが鍵。時間に縛られない働き方で生産性が2倍に！ #リモートワーク #働き方改革',
      '⏰ ポモドーロテクニックを1ヶ月試した結果→集中力が劇的に向上。25分集中、5分休憩のリズムが最強です #生産性向上 #タイムマネジメント',
    ],
    'データ分析・ビジネスインテリジェンス': [
      '📊 データドリブン経営の実践法：KPIを3つに絞り込むことで意思決定スピードが劇的に向上。シンプルが最強です #データ分析 #経営戦略',
      '📈 ダッシュボード作成のコツ：見る人の「次のアクション」を意識すること。データは行動につながらないと意味がない #BI #データ可視化',
    ],
    'スタートアップ・起業': [
      '🚀 スタートアップの成功法則：MVPを最速で出して、ユーザーの声を聞く。完璧を目指さず、まず市場に出すことが大事 #スタートアップ #起業',
      '💰 資金調達よりも大切なこと→プロダクトマーケットフィット。解決すべき課題が明確なら、投資家は後からついてくる #PMF #起業家',
    ],
    'クラウドサービス・SaaS': [
      '☁️ SaaS選定のポイント：APIの充実度を必ずチェック。将来の拡張性と他ツールとの連携が競争力の源泉に #SaaS #クラウド',
      '🔧 NoCodeツールでSaaS構築！プログラミング不要で本格的なサービスが作れる時代。アイデアがあれば誰でも起業家に #NoCode #SaaS',
    ],
    'プログラミング・開発ツール': [
      '⚡️ コードレビューの効率化：AIペアプログラミングツールで品質を保ちながら開発スピード2倍に。もう一人で悩まない #開発効率化 #AI',
      '🛠️ 開発者体験（DevEx）が重視される時代。良いツールへの投資は長期的に見てコスト削減につながる #DX #開発ツール',
    ],
    'default': [
      '🚀 テクノロジーの進化が止まらない！最新トレンドをキャッチアップして、ビジネスに活かしましょう #テック #ビジネス',
      '💡 イノベーションは「不便」から生まれる。日常の小さな困りごとにビジネスチャンスが眠っています #イノベーション',
    ]
  };

  // 最近の投稿から使用されたトピックを抽出
  const getRecentTopicsFromHistory = (): string[] => {
    if (!settings.avoidRecentTopics) return [];

    const recentPosts = mockPostHistory
      .slice(0, settings.recentTopicsToAvoid)
      .map(p => p.content);

    // 各トピックが最近の投稿に含まれているかチェック
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

    // 利用可能なトピックがない場合は全トピックからランダムに選択
    const topicsToChooseFrom = availableTopics.length > 0 ? availableTopics : settings.topics;
    return topicsToChooseFrom[Math.floor(Math.random() * topicsToChooseFrom.length)];
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const topic = selectNextTopic();
      setSelectedTopic(topic);

      // トピックに対応する投稿を取得、なければデフォルト
      const postsForTopic = mockPostsByTopic[topic] || mockPostsByTopic['default'];
      const randomPost = postsForTopic[Math.floor(Math.random() * postsForTopic.length)];

      setGeneratedPost(randomPost);
      setIsGenerating(false);
    }, 1500);
  };

  const handlePostNow = () => {
    if (confirm('この内容で今すぐ投稿しますか？')) {
      alert('投稿しました！');
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
                <span className="text-gray-500">トピックローテーション:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {settings.topicRotation ? `有効（${settings.topics.length}件）` : '無効'}
                </span>
              </div>
              {settings.topicRotation && settings.avoidRecentTopics && (
                <div>
                  <span className="text-gray-500">重複防止:</span>
                  <span className="ml-2 font-medium text-green-600">
                    直近{settings.recentTopicsToAvoid}件を回避
                  </span>
                </div>
              )}
              {selectedTopic && (
                <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-gray-500">選択されたトピック:</span>
                  <span className="ml-2 font-medium text-blue-600">{selectedTopic}</span>
                </div>
              )}
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
        </div>
      </div>
    </div>
  );
}
