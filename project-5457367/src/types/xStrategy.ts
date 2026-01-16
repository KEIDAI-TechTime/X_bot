/**
 * X投稿戦略に関する型定義
 * 参考: X投稿戦略完全ガイド
 */

// ========================================
// アルゴリズム関連
// ========================================

/** アルゴリズム採点アクション */
export type AlgorithmAction =
  | 'reply_to_reply'    // リプライへの返信 +75点
  | 'received_reply'    // リプライされる +27点
  | 'profile_visit'     // プロフィール訪問→反応 +12点
  | 'dwell_time'        // 2分以上滞在 +11点
  | 'repost'            // リポスト +1点
  | 'like'              // いいね +0.5点
  | 'block_mute'        // ブロック・ミュート -74点
  | 'report';           // 通報 -369点

/** アルゴリズムスコア */
export interface AlgorithmScore {
  action: AlgorithmAction;
  points: number;
  description: string;
}

/** 投稿タイプと効果 */
export type PostMediaType =
  | 'text_only'         // テキストのみ
  | 'with_image'        // 画像付き（伸びる）
  | 'with_link'         // リンク付き（伸びない）
  | 'long_text';        // 長文（伸びる）

// ========================================
// コンテンツタイプ（4つの基本パターン）
// ========================================

/** バズるコンテンツの4タイプ */
export type ContentCategory =
  | 'empathy'           // 共感できる（あるあるネタ）
  | 'informative'       // ためになる（知識として役立つ）
  | 'humorous'          // 笑える（ユーモラス）
  | 'positive';         // とにかく明るくやる

export interface ContentCategoryInfo {
  id: ContentCategory;
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  frequency: 'daily' | 'occasional' | 'rare';
  tips: string[];
}

// ========================================
// コンテンツの型（6パターン）
// ========================================

/** 投稿の型 */
export type ContentFormat =
  | 'points_3'          // ポイント3つ解説型
  | 'list_7_8'          // 7か条・8か条型
  | 'book_review'       // 本の画像＋感想一言
  | 'handwritten'       // 手書き
  | 'memo_text'         // メモ帳テキスト
  | 'long_post';        // 長文ポスト

export interface ContentFormatInfo {
  id: ContentFormat;
  name: string;
  description: string;
  hasImage: boolean;
  templateStructure: string;
  exampleLikes?: number;
  examplePost?: string;
}

// ========================================
// 1行目パターン
// ========================================

/** 効果的な1行目のパターン */
export type FirstLinePattern =
  | 'method'            // 方法提示
  | 'question_what'     // 質問（〇〇とは？）
  | 'question_why'      // 質問（なぜ？）
  | 'secret'            // 秘密公開
  | 'target';           // ターゲット指定

export interface FirstLinePatternInfo {
  id: FirstLinePattern;
  name: string;
  template: string;
  example: string;
}

/** 実績のある表現パターン */
export type ProvenPattern =
  | 'thought_process'     // 〜な人の思考回路を言語化
  | 'brain_inside'        // 〜な人の脳内はこんな感じ
  | 'solution'            // 〜を何とかしてくれる方法/本
  | 'breathing_habit'     // 〜な人が息を吸うようにやっている行動
  | 'authority'           // 権威のある人が言っていたよ構文
  | 'staircase'           // 階段型構文（「〜は非効率」を繰り返す）
  | 'foolish';            // 馬鹿だった構文

export interface ProvenPatternInfo {
  id: ProvenPattern;
  name: string;
  template: string;
  exampleLikes?: number;
}

// ========================================
// ライティングルール
// ========================================

export interface WritingRules {
  /** 中高生が理解できるレベル */
  readabilityLevel: 'middle_school' | 'high_school' | 'college';

  /** ひらがな:漢字の比率（推奨: 70:30） */
  hiraganaRatio: number; // 0-100
  kanjiRatio: number;    // 0-100

  /** 数字は半角 */
  useHalfWidthNumbers: boolean;

  /** 同じ語尾を続けない回数 */
  maxConsecutiveSameEnding: number;

  /** 順接の接続詞を省略 */
  omitConjunctions: boolean;

  /** 箇条書きを積極的に使う */
  useListFormat: boolean;
}

/** 語尾のレパートリー */
export type SentenceEnding =
  | 'desu'               // です
  | 'masu'               // ます
  | 'da'                 // だ
  | 'question'           // ですよね / ？
  | 'taigen'             // 体言止め
  | 'exclamation'        // ！
  | 'kana';              // かな

// ========================================
// 投稿検証結果
// ========================================

export interface ValidationResult {
  isValid: boolean;
  score: number;          // 0-100
  issues: ValidationIssue[];
  suggestions: string[];
  algorithmScore: number;
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  position?: { start: number; end: number };
}

/** 検証チェック項目 */
export type ValidationCheck =
  | 'url_link'            // URLリンク検出
  | 'char_count'          // 文字数チェック
  | 'hiragana_ratio'      // ひらがな比率
  | 'kanji_ratio'         // 漢字比率
  | 'same_ending'         // 語尾重複
  | 'first_line'          // 1行目の効果
  | 'dwell_potential'     // 滞在時間ポテンシャル
  | 'negative_content';   // ネガティブコンテンツ

// ========================================
// 投稿設定（拡張版）
// ========================================

export interface XStrategySettings {
  // 基本設定
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

  // アルゴリズム対策
  avoidUrls: boolean;
  preferImages: boolean;
  targetDwellTime: number; // 秒
}

// ========================================
// 3C分析
// ========================================

export interface ThreeCAnalysis {
  customer: {
    targetAudience: string;
    needs: string[];
    painPoints: string[];
  };
  competitor: {
    accounts: CompetitorAccount[];
    commonStrengths: string[];
    gaps: string[];
  };
  company: {
    uniqueStrengths: string[];
    experience: string[];
    differentiators: string[];
  };
}

export interface CompetitorAccount {
  name: string;
  url: string;
  followers: number;
  topPosts: TopPost[];
  analysisNotes: string;
}

export interface TopPost {
  content: string;
  likes: number;
  growthFactors: string[];
}

// ========================================
// ポジショニング
// ========================================

export interface Positioning {
  /** 便益: 選ぶ理由 */
  benefit: string;

  /** 独自性: 他を選ばない理由 */
  uniqueness: string;

  /** 「〇〇といえば、XXさん」のXX */
  positionStatement: string;
}

// ========================================
// プロフィール設計
// ========================================

export interface ProfileDesign {
  icon: {
    type: 'illustration' | 'photo' | 'logo';
    description: string;
  };
  accountName: string;
  header: {
    mainMessage: string;
    visualDescription: string;
  };
  bio: {
    whoYouAre: string;
    targetAudience: string;
    whatYouPost: string;
    authority: string[];
  };
  location: string; // URL誘導用
}
