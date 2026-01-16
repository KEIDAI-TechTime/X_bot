import type {
  ContentCategory,
  ContentFormat,
  FirstLinePattern,
  ProvenPattern,
  WritingRules,
} from '../types/xStrategy';

/**
 * 拡張版Settings型
 * X投稿戦略に対応した設定項目
 */
export interface Settings {
  // 基本設定
  id: number;
  name: string;
  enabled: boolean;

  // ペルソナ・トーン
  persona: string;
  tone: string;

  // トピック設定
  topic: string;
  topics: string[];
  topicRotation: boolean;
  avoidRecentTopics: boolean;
  recentTopicsToAvoid: number;

  // 戦略設定（新規追加）
  contentCategory: ContentCategory;
  contentFormat: ContentFormat;
  firstLinePattern: FirstLinePattern;
  provenPatterns: ProvenPattern[];

  // ライティング設定
  writingRules: WritingRules;

  // コンテンツ方向性
  contentDirection: string;
  mustInclude: string;
  mustExclude: string;

  // 構成設定
  structureTemplate: string;
  maxLength: number;
  useEmoji: boolean;
  useHashtags: boolean;
  hashtagRules: string;

  // 参考情報
  referenceInfo: string;
  examplePosts: string;

  // アルゴリズム対策（新規追加）
  avoidUrls: boolean;
  preferImages: boolean;
  targetDwellTime: number;

  // スケジュール設定
  postTimes: string[];
  activeDays: string[];
  timezone: string;
  maxPostsPerDay: number;
}

/**
 * デフォルトライティングルール
 */
export const defaultWritingRules: WritingRules = {
  readabilityLevel: 'middle_school',
  hiraganaRatio: 70,
  kanjiRatio: 30,
  useHalfWidthNumbers: true,
  maxConsecutiveSameEnding: 2,
  omitConjunctions: true,
  useListFormat: true,
};

/**
 * デフォルト投稿設定（拡張版）
 */
export const mockPostSettings: Settings = {
  id: 1,
  name: 'デフォルト投稿設定',
  enabled: true,

  // ペルソナ・トーン
  persona: 'テクノロジーとビジネスに詳しい、フレンドリーな専門家。最新のトレンドを分かりやすく解説します。',
  tone: 'カジュアル',

  // トピック設定
  topic: 'AI・テクノロジー・ビジネス',
  topics: [
    'AI・機械学習の最新動向',
    'リモートワーク・生産性向上',
    'データ分析・ビジネスインテリジェンス',
    'スタートアップ・起業',
    'クラウドサービス・SaaS',
    'プログラミング・開発ツール'
  ],
  topicRotation: true,
  avoidRecentTopics: true,
  recentTopicsToAvoid: 3,

  // 戦略設定
  contentCategory: 'empathy',
  contentFormat: 'points_3',
  firstLinePattern: 'method',
  provenPatterns: ['breathing_habit', 'thought_process'],

  // ライティング設定
  writingRules: defaultWritingRules,

  // コンテンツ方向性
  contentDirection: '最新のAIトレンドやビジネスに役立つ情報を、初心者にも分かりやすく解説。実用的なヒントを含める。',
  mustInclude: '具体例、実用的なアドバイス',
  mustExclude: '専門用語の羅列、ネガティブな内容、URLリンク',

  // 構成設定
  structureTemplate: `【導入】興味を引く1行目
【本文】具体的な説明（箇条書き推奨）
【結論】アクションを促す`,
  maxLength: 280,
  useEmoji: true,
  useHashtags: true,
  hashtagRules: '最大3個まで、関連性の高いものを選択',

  // 参考情報
  referenceInfo: '最新のAI技術動向、ビジネストレンド、生産性向上ツール',
  examplePosts: `🤖 ChatGPTの新機能が登場！音声会話がさらに自然になりました。これでミーティング中のメモ取りが楽になりそう✨ #AI #生産性向上

📚 「仕事を頼まれたら息を吸うようにやれ」と言われた3つのこと
1️⃣ 即レスする（考える前に「承知しました」）
2️⃣ 期限の半分で一度見せる
3️⃣ 完璧より完了を優先する
#仕事術`,

  // アルゴリズム対策
  avoidUrls: true,
  preferImages: true,
  targetDwellTime: 120,

  // スケジュール設定
  postTimes: ['07:00', '12:00', '19:00'],
  activeDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
  timezone: 'Asia/Tokyo',
  maxPostsPerDay: 10
};

/**
 * 投稿履歴
 */
export const mockPostHistory = [
  {
    id: 1,
    settingId: 1,
    postedAt: '2025-01-15 07:00:00',
    content: '🚀 AIの進化が止まらない！最新のGPT-4 Turboは処理速度が2倍に。これでリアルタイム翻訳もスムーズになりますね。ビジネスの効率化に期待大です💡 #AI #テクノロジー #ビジネス',
    status: 'success' as const,
    errorMessage: null,
    topic: 'AI・機械学習の最新動向',
    contentCategory: 'informative' as ContentCategory,
    algorithmScore: 75,
  },
  {
    id: 2,
    settingId: 1,
    postedAt: '2025-01-15 12:00:00',
    content: '📊 データ分析の新常識：ノーコードツールが主流に。プログラミング不要で誰でも高度な分析が可能に。これからはデータリテラシーが必須スキルですね #データ分析 #ノーコード',
    status: 'success' as const,
    errorMessage: null,
    topic: 'データ分析・ビジネスインテリジェンス',
    contentCategory: 'informative' as ContentCategory,
    algorithmScore: 72,
  },
  {
    id: 3,
    settingId: 1,
    postedAt: '2025-01-15 19:00:00',
    content: '💼 リモートワークの生産性を3倍にする方法：①タスク管理ツールの活用 ②定期的な休憩 ③コミュニケーションの最適化。小さな工夫で大きな変化が生まれます✨ #リモートワーク #生産性',
    status: 'success' as const,
    errorMessage: null,
    topic: 'リモートワーク・生産性向上',
    contentCategory: 'informative' as ContentCategory,
    algorithmScore: 80,
  },
  {
    id: 4,
    settingId: 1,
    postedAt: '2025-01-14 19:00:00',
    content: '新入社員の頃、上司に「報連相が足りない」と言われまくった私。今ならわかる。報連相って「報告・連絡・相談」じゃなくて「安心させる」ってことだったんだなと。#あるある #仕事術',
    status: 'success' as const,
    errorMessage: null,
    topic: '仕事術・キャリア',
    contentCategory: 'empathy' as ContentCategory,
    algorithmScore: 85,
  },
  {
    id: 5,
    settingId: 1,
    postedAt: '2025-01-14 12:00:00',
    content: '⚡️ 作業効率を上げるショートカットキー5選：Ctrl+C、Ctrl+V、Ctrl+Z、Ctrl+F、Alt+Tab。これだけで作業時間が30%短縮できます！ #生産性向上 #仕事術',
    status: 'failed' as const,
    errorMessage: 'API rate limit exceeded',
    topic: 'プログラミング・開発ツール',
    contentCategory: 'informative' as ContentCategory,
    algorithmScore: 70,
  }
];

/**
 * ステータス
 */
export const mockStatus = {
  totalPosts: 1247,
  successRate: 98.5,
  todayPosts: 3,
  nextPostTime: '2025-01-16 07:00:00',
  isRunning: true,
  averageAlgorithmScore: 76.4,
  topPerformingCategory: 'empathy' as ContentCategory,
};

/**
 * トピック別モック投稿（戦略対応版）
 */
export const mockPostsByTopic: Record<string, Array<{
  content: string;
  category: ContentCategory;
  format: ContentFormat;
}>> = {
  'AI・機械学習の最新動向': [
    {
      content: '🤖 機械学習モデルのファインチューニングが簡単に！数行のコードで自社データに最適化できる時代。専門知識がなくてもAI活用が可能に #AI #機械学習',
      category: 'informative',
      format: 'long_post',
    },
    {
      content: 'AIツールを使いこなせる人の思考回路を言語化してみた\n\n①まず「何を自動化したいか」を明確にする\n②完璧を求めず70%の精度で回す\n③人間のチェックは最後の一手\n\n意外とシンプルだった #AI活用',
      category: 'empathy',
      format: 'points_3',
    },
  ],
  'リモートワーク・生産性向上': [
    {
      content: '在宅勤務3年目にしてやっと気づいた。生産性が上がらないのは「環境」じゃなくて「切り替え」の問題だった。朝、作業服に着替えるだけで集中力が全然違う。#リモートワーク #生産性向上',
      category: 'empathy',
      format: 'long_post',
    },
    {
      content: '⏰ ポモドーロテクニックを1ヶ月試した結果→集中力が劇的に向上。25分集中、5分休憩のリズムが最強です #生産性向上 #タイムマネジメント',
      category: 'informative',
      format: 'long_post',
    },
  ],
  'データ分析・ビジネスインテリジェンス': [
    {
      content: '📊 データドリブン経営の実践法：KPIを3つに絞り込むことで意思決定スピードが劇的に向上。シンプルが最強です #データ分析 #経営戦略',
      category: 'informative',
      format: 'long_post',
    },
    {
      content: '「このグラフ、何が言いたいの？」\n\n新人の頃、上司に何度も言われた言葉。\n\nダッシュボード作成で大事なのは「見る人の次のアクション」を意識すること。データは行動につながらないと意味がない\n\n#BI #データ可視化',
      category: 'empathy',
      format: 'long_post',
    },
  ],
  'スタートアップ・起業': [
    {
      content: '🚀 スタートアップの成功法則：MVPを最速で出して、ユーザーの声を聞く。完璧を目指さず、まず市場に出すことが大事 #スタートアップ #起業',
      category: 'informative',
      format: 'long_post',
    },
    {
      content: '起業して1年目に学んだこと3つ\n\n1️⃣ 資金より顧客が先\n2️⃣ 完璧な計画より小さな実験\n3️⃣ 孤独との付き合い方\n\n3つ目が一番難しかった #起業 #スタートアップ',
      category: 'empathy',
      format: 'points_3',
    },
  ],
  'クラウドサービス・SaaS': [
    {
      content: '☁️ SaaS選定のポイント：APIの充実度を必ずチェック。将来の拡張性と他ツールとの連携が競争力の源泉に #SaaS #クラウド',
      category: 'informative',
      format: 'long_post',
    },
    {
      content: '「また新しいツール導入？」\n\nチームから冷たい目で見られた経験がある人、挙手🙋‍♂️\n\nSaaS導入で失敗するパターンは「機能」で選ぶこと。「課題」から逆算しないとツールだらけになる\n\n#SaaS #業務改善',
      category: 'empathy',
      format: 'long_post',
    },
  ],
  'プログラミング・開発ツール': [
    {
      content: '⚡️ コードレビューの効率化：AIペアプログラミングツールで品質を保ちながら開発スピード2倍に。もう一人で悩まない #開発効率化 #AI',
      category: 'informative',
      format: 'long_post',
    },
    {
      content: 'プログラミング学習で挫折しそうな人へ\n\n私も3回挫折した経験あり。でも続けられたのは「写経」をやめて「改造」を始めたから。\n\n動くコードを少しずつ変えていく方が100倍楽しい\n\n#プログラミング #学習',
      category: 'empathy',
      format: 'long_post',
    },
  ],
  'default': [
    {
      content: '🚀 テクノロジーの進化が止まらない！最新トレンドをキャッチアップして、ビジネスに活かしましょう #テック #ビジネス',
      category: 'positive',
      format: 'long_post',
    },
    {
      content: '💡 イノベーションは「不便」から生まれる。日常の小さな困りごとにビジネスチャンスが眠っています #イノベーション',
      category: 'informative',
      format: 'long_post',
    },
  ]
};
