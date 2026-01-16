/**
 * X投稿戦略の設定値
 * 参考: X投稿戦略完全ガイド
 */

import type {
  AlgorithmScore,
  ContentCategoryInfo,
  ContentFormatInfo,
  FirstLinePatternInfo,
  ProvenPatternInfo,
  WritingRules,
} from '../types/xStrategy';

// ========================================
// アルゴリズム採点基準（2023年GitHub公開時点）
// ========================================

export const ALGORITHM_SCORES: AlgorithmScore[] = [
  { action: 'reply_to_reply', points: 75, description: 'リプライへの返信' },
  { action: 'received_reply', points: 27, description: 'リプライされる' },
  { action: 'profile_visit', points: 12, description: '投稿経由でプロフィール訪問→反応' },
  { action: 'dwell_time', points: 11, description: '投稿を開いて2分以上滞在' },
  { action: 'repost', points: 1, description: 'リポスト/リツイート' },
  { action: 'like', points: 0.5, description: 'いいね' },
  { action: 'block_mute', points: -74, description: 'ブロック・ミュート' },
  { action: 'report', points: -369, description: '通報される' },
];

// ========================================
// 投稿タイプの効果
// ========================================

export const POST_TYPE_EFFECTS = {
  with_link: {
    effect: 'negative',
    reason: '他媒体に離脱→滞在時間短縮',
    note: '2024年11月: URLリンク付き投稿は「lazy linking」扱いで表示抑制',
  },
  with_image: {
    effect: 'positive',
    reason: '情報量が多く滞在時間延長',
  },
  long_text: {
    effect: 'positive',
    reason: '読むのに時間がかかる',
  },
  text_only: {
    effect: 'neutral',
    reason: '内容次第',
  },
} as const;

// ========================================
// コンテンツカテゴリ（4つの基本パターン）
// ========================================

export const CONTENT_CATEGORIES: ContentCategoryInfo[] = [
  {
    id: 'empathy',
    name: '共感できる（あるあるネタ）',
    description: '自分の失敗や経験を「あー、わかるわかる」と思えるように書く',
    riskLevel: 'low',
    frequency: 'daily',
    tips: [
      '自分を下げておけば誰も傷つかない',
      'アンチができにくい',
      '黒歴史を供養できる',
      '効率的でリスクが低い',
      '最もおすすめ',
    ],
  },
  {
    id: 'informative',
    name: 'ためになる（知識として役立つ）',
    description: '日常のライフハック、仕事や勉強で得た知識を共有',
    riskLevel: 'low',
    frequency: 'daily',
    tips: [
      '日常のライフハック系',
      '仕事で得た知識',
      '勉強して得た知識をSNSで流す→一石二鳥',
    ],
  },
  {
    id: 'humorous',
    name: '笑える（ユーモラス）',
    description: '人気を集めやすいが注意点あり',
    riskLevel: 'high',
    frequency: 'occasional',
    tips: [
      'ウケを狙いすぎる傾向になりやすい',
      '「倫理的に際どい」「嘘松化」で炎上リスク増',
      '99%の確率で滑る',
      '思いついたときだけにする',
    ],
  },
  {
    id: 'positive',
    name: 'とにかく明るくやる',
    description: '明るく、楽しく、元気よく',
    riskLevel: 'low',
    frequency: 'daily',
    tips: [
      'SNSを続けていると頭がおかしくなりそうになる',
      '暗くなるとファンはつかない、人は離れていく',
      '明るく、楽しく、元気よく',
    ],
  },
];

// ========================================
// コンテンツの型（6パターン）
// ========================================

export const CONTENT_FORMATS: ContentFormatInfo[] = [
  {
    id: 'points_3',
    name: 'ポイント3つ解説型',
    description: '「〇〇のポイント3つ」＋具体的エピソード',
    hasImage: true,
    templateStructure: `【タイトル】〇〇のポイント3つ

1️⃣ ポイント1
   → 具体的な説明やエピソード

2️⃣ ポイント2
   → 具体的な説明やエピソード

3️⃣ ポイント3
   → 具体的な説明やエピソード`,
    exampleLikes: 1301,
    examplePost: '「仕事を頼まれたら息を吸うようにやれ」と言われた3つのこと',
  },
  {
    id: 'list_7_8',
    name: '7か条・8か条型',
    description: '3つにまとめにくい場合は縦長画像で条数を増やす',
    hasImage: true,
    templateStructure: `【タイトル】〇〇の7箇条

①
②
③
④
⑤
⑥
⑦`,
    exampleLikes: 7507,
    examplePost: '「人に仕事を頼むときに絶対守ること」7箇条',
  },
  {
    id: 'book_review',
    name: '本の画像＋感想一言',
    description: '最も手軽。Xはテキスト好きが多く、本紹介への反応が良い',
    hasImage: true,
    templateStructure: `📚 『本のタイトル』

一言感想や気づき

#読書 #おすすめ本`,
  },
  {
    id: 'handwritten',
    name: '手書き',
    description: '手間がかかっている感・手作り感が出る。読み手の反応を得やすい',
    hasImage: true,
    templateStructure: '（手書きメモの画像を添付）',
    exampleLikes: 2734,
    examplePost: 'コンサル1年目で当たり前にやれと言われたことメモ',
  },
  {
    id: 'memo_text',
    name: 'メモ帳テキスト',
    description: 'テキストメモを画像化するだけでも効果的',
    hasImage: true,
    templateStructure: '（メモ帳スクリーンショットの画像を添付）',
    exampleLikes: 885,
    examplePost: '在庫管理フローの改善提案書',
  },
  {
    id: 'long_post',
    name: '長文ポスト',
    description: '1行目だけ書いて「さらに表示」で続きを読ませる',
    hasImage: false,
    templateStructure: `【1行目：興味を引くフック】

【中盤：具体的な内容】
・結論と目次を先に提示
・困りごとを生々しく描写

【締め】
読者に取ってほしいアクションを明示`,
    exampleLikes: 5197,
    examplePost: '『知的複眼思考法』の紹介',
  },
];

// ========================================
// 1行目パターン
// ========================================

export const FIRST_LINE_PATTERNS: FirstLinePatternInfo[] = [
  {
    id: 'method',
    name: '方法提示',
    template: '「〇〇」と言われないための3つのコツ',
    example: '「何言ってるかわからん」と言われないための3つのコツ',
  },
  {
    id: 'question_what',
    name: '質問（〇〇とは？）',
    template: 'わかるようでわからない「〇〇」とは？',
    example: 'わかるようでわからない「インサイト」とは？',
  },
  {
    id: 'question_why',
    name: '質問（なぜ？）',
    template: 'どうして〇〇できないのか？',
    example: 'どうして聞かれた質問に結論から答えられないのか？',
  },
  {
    id: 'secret',
    name: '秘密公開',
    template: '〇〇で△△した秘訣',
    example: '大学院でオールAを取った秘訣',
  },
  {
    id: 'target',
    name: 'ターゲット指定',
    template: '〇〇に困っている方へ',
    example: '1on1ミーティングの話題に困っている方へ',
  },
];

// ========================================
// 実績のある表現パターン
// ========================================

export const PROVEN_PATTERNS: ProvenPatternInfo[] = [
  {
    id: 'thought_process',
    name: '思考回路言語化',
    template: '〇〇な人の思考回路を言語化',
    exampleLikes: 31000,
  },
  {
    id: 'brain_inside',
    name: '脳内可視化',
    template: '〇〇な人の脳内はこんな感じ',
    exampleLikes: 31000,
  },
  {
    id: 'solution',
    name: '解決提案',
    template: '〇〇を何とかしてくれる方法/本',
  },
  {
    id: 'breathing_habit',
    name: '息を吸うように',
    template: '〇〇な人が息を吸うようにやっている行動',
    exampleLikes: 1269,
  },
  {
    id: 'authority',
    name: '権威引用',
    template: '〇〇（権威のある人）が言っていたよ',
  },
  {
    id: 'staircase',
    name: '階段型構文',
    template: '「〇〇は非効率」を繰り返す構成',
  },
  {
    id: 'foolish',
    name: '馬鹿だった構文',
    template: '〇〇だと思っていた自分は馬鹿だった',
  },
];

// ========================================
// デフォルトライティングルール
// ========================================

export const DEFAULT_WRITING_RULES: WritingRules = {
  readabilityLevel: 'middle_school',
  hiraganaRatio: 70,
  kanjiRatio: 30,
  useHalfWidthNumbers: true,
  maxConsecutiveSameEnding: 2,
  omitConjunctions: true,
  useListFormat: true,
};

// ========================================
// 語尾レパートリー
// ========================================

export const SENTENCE_ENDINGS = [
  { id: 'desu', text: 'です', category: 'polite' },
  { id: 'masu', text: 'ます', category: 'polite' },
  { id: 'da', text: 'だ', category: 'casual' },
  { id: 'question', text: 'ですよね / ？', category: 'interactive' },
  { id: 'taigen', text: '体言止め', category: 'impactful' },
  { id: 'exclamation', text: '！', category: 'energetic' },
  { id: 'kana', text: 'かな', category: 'soft' },
];

// ========================================
// 禁じ手リスト
// ========================================

export const FORBIDDEN_TECHNIQUES = [
  {
    id: 'trolling',
    name: 'ツッコミどころが多いコンテンツ',
    description: '「おいおい、そうじゃないだろ」とコメントしたくなる投稿',
    risks: [
      'アンチが増える',
      '何を書いてもボロクソに叩かれるようになる',
      '高等技術なので手を出さない方が無難',
    ],
    note: 'ガバガバ適当ロジックを炸裂させると伸びる可能性あり（ただしリスク大）',
  },
  {
    id: 'url_spam',
    name: 'URLリンクの多用',
    description: '外部リンクを含む投稿は表示が抑制される',
    risks: [
      'アルゴリズムにより表示優先度が下がる',
      '2024年11月以降「lazy linking」扱い',
    ],
  },
  {
    id: 'negativity',
    name: 'ネガティブなコンテンツ',
    description: '暗い内容や批判的な投稿',
    risks: [
      '人が離れていく',
      'ファンがつかない',
    ],
  },
];

// ========================================
// チェックリスト項目
// ========================================

export const STRATEGY_CHECKLIST = {
  algorithm: [
    { id: 'avoid_urls', text: 'URLリンクを避ける' },
    { id: 'use_images', text: '画像付き or 長文で投稿' },
    { id: 'dwell_time', text: '2分以上滞在させる情報量' },
    { id: 'premium', text: 'Xプレミアム加入を検討' },
  ],
  positioning: [
    { id: '3c_analysis', text: '3C分析を実施' },
    { id: 'benefit_uniqueness', text: '「便益」と「独自性」を言語化' },
    { id: 'profile_optimize', text: 'プロフィールを最適化' },
    { id: 'competitor_research', text: '競合アカウントを3つ以上調査' },
  ],
  content: [
    { id: 'empathy_base', text: '共感できるあるあるネタを軸に' },
    { id: 'use_formats', text: '6つの型から選んで投稿' },
    { id: 'first_line', text: '1行目に全力を注ぐ' },
    { id: 'avoid_anti', text: '自分を下げてアンチを作らない' },
  ],
  operation: [
    { id: 'not_perfect', text: '完璧を目指さない' },
    { id: 'daily_continue', text: '毎日継続する' },
    { id: 'stay_positive', text: '明るく、楽しく、元気よく' },
    { id: 'avoid_forbidden', text: '禁じ手は避ける' },
  ],
};

// ========================================
// バズ投稿検索クエリ
// ========================================

export const BUZZ_SEARCH_TEMPLATES = {
  minFaves: (keyword: string, minLikes: number) =>
    `${keyword} min_faves:${minLikes}`,
  examples: [
    { query: '本 min_faves:1000', description: '本について1000いいね以上' },
    { query: 'ビジネス書 min_faves:500', description: 'ビジネス書について500いいね以上' },
  ],
};

// ========================================
// 投稿時間の推奨
// ========================================

export const RECOMMENDED_POST_TIMES = [
  { time: '07:00', reason: '通勤時間帯、朝のチェック' },
  { time: '12:00', reason: 'ランチタイム、休憩中のSNSチェック' },
  { time: '19:00', reason: '帰宅時間帯、夜のリラックスタイム' },
  { time: '21:00', reason: '就寝前のSNSチェック' },
];
