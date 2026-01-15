
export const mockPostSettings = {
  id: 1,
  name: 'デフォルト投稿設定',
  enabled: true,
  persona: 'テクノロジーとビジネスに詳しい、フレンドリーな専門家。最新のトレンドを分かりやすく解説します。',
  tone: 'カジュアル',
  topic: 'AI・テクノロジー・ビジネス',
  // 複数トピック対応（ローテーション用）
  topics: [
    'AI・機械学習の最新動向',
    'リモートワーク・生産性向上',
    'データ分析・ビジネスインテリジェンス',
    'スタートアップ・起業',
    'クラウドサービス・SaaS',
    'プログラミング・開発ツール'
  ],
  topicRotation: true,  // トピックローテーション有効
  avoidRecentTopics: true,  // 最近のトピックを避ける
  recentTopicsToAvoid: 3,  // 直近N件の投稿と類似トピックを避ける
  contentDirection: '最新のAIトレンドやビジネスに役立つ情報を、初心者にも分かりやすく解説。実用的なヒントを含める。',
  mustInclude: '具体例、実用的なアドバイス',
  mustExclude: '専門用語の羅列、ネガティブな内容',
  structureTemplate: '【導入】興味を引く一文\n【本文】具体的な説明\n【結論】アクションを促す',
  maxLength: 280,
  useEmoji: true,
  useHashtags: true,
  hashtagRules: '最大3個まで、関連性の高いものを選択',
  referenceInfo: '最新のAI技術動向、ビジネストレンド、生産性向上ツール',
  examplePosts: '🤖 ChatGPTの新機能が登場！音声会話がさらに自然になりました。これでミーティング中のメモ取りが楽になりそう✨ #AI #生産性向上',
  postTimes: ['07:00', '12:00', '19:00'],
  activeDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
  timezone: 'Asia/Tokyo',
  maxPostsPerDay: 10
};

export const mockPostHistory = [
  {
    id: 1,
    settingId: 1,
    postedAt: '2025-01-15 07:00:00',
    content: '🚀 AIの進化が止まらない！最新のGPT-4 Turboは処理速度が2倍に。これでリアルタイム翻訳もスムーズになりますね。ビジネスの効率化に期待大です💡 #AI #テクノロジー #ビジネス',
    status: 'success',
    errorMessage: null
  },
  {
    id: 2,
    settingId: 1,
    postedAt: '2025-01-15 12:00:00',
    content: '📊 データ分析の新常識：ノーコードツールが主流に。プログラミング不要で誰でも高度な分析が可能に。これからはデータリテラシーが必須スキルですね #データ分析 #ノーコード',
    status: 'success',
    errorMessage: null
  },
  {
    id: 3,
    settingId: 1,
    postedAt: '2025-01-15 19:00:00',
    content: '💼 リモートワークの生産性を3倍にする方法：①タスク管理ツールの活用 ②定期的な休憩 ③コミュニケーションの最適化。小さな工夫で大きな変化が生まれます✨ #リモートワーク #生産性',
    status: 'success',
    errorMessage: null
  },
  {
    id: 4,
    settingId: 1,
    postedAt: '2025-01-14 19:00:00',
    content: '🎯 目標達成のコツは「小さく始める」こと。大きな目標を細分化して、毎日少しずつ進めることが成功への近道です。今日から始めてみませんか？ #目標達成 #自己啓発',
    status: 'success',
    errorMessage: null
  },
  {
    id: 5,
    settingId: 1,
    postedAt: '2025-01-14 12:00:00',
    content: '⚡️ 作業効率を上げるショートカットキー5選：Ctrl+C、Ctrl+V、Ctrl+Z、Ctrl+F、Alt+Tab。これだけで作業時間が30%短縮できます！ #生産性向上 #仕事術',
    status: 'failed',
    errorMessage: 'API rate limit exceeded'
  }
];

export const mockStatus = {
  totalPosts: 1247,
  successRate: 98.5,
  todayPosts: 3,
  nextPostTime: '2025-01-16 07:00:00',
  isRunning: true
};
