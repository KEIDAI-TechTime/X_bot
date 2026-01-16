/**
 * AIプロンプトビルダー
 * X投稿戦略に基づいてAI生成用のプロンプトを構築する
 */

import type {
  ContentCategory,
  ContentFormat,
  FirstLinePattern,
  ProvenPattern,
  WritingRules,
  XStrategySettings,
} from '../types/xStrategy';
import {
  CONTENT_CATEGORIES,
  CONTENT_FORMATS,
  FIRST_LINE_PATTERNS,
  PROVEN_PATTERNS,
  DEFAULT_WRITING_RULES,
} from '../config/xStrategy';

// ========================================
// ヘルパー関数
// ========================================

function getContentCategoryInfo(category: ContentCategory) {
  return CONTENT_CATEGORIES.find(c => c.id === category);
}

function getContentFormatInfo(format: ContentFormat) {
  return CONTENT_FORMATS.find(f => f.id === format);
}

function getFirstLinePatternInfo(pattern: FirstLinePattern) {
  return FIRST_LINE_PATTERNS.find(p => p.id === pattern);
}

function getProvenPatternInfo(pattern: ProvenPattern) {
  return PROVEN_PATTERNS.find(p => p.id === pattern);
}

// ========================================
// ライティングルール説明生成
// ========================================

function buildWritingRulesPrompt(rules: WritingRules): string {
  const instructions: string[] = [];

  // 読みやすさレベル
  const levelMap = {
    middle_school: '中学生',
    high_school: '高校生',
    college: '大学生',
  };
  instructions.push(`・${levelMap[rules.readabilityLevel]}が理解できるレベルの言葉遣いで書く`);

  // ひらがな/漢字比率
  instructions.push(`・ひらがなと漢字の比率は約${rules.hiraganaRatio}:${rules.kanjiRatio}を目安にする（漢字を使いすぎない）`);

  // 数字
  if (rules.useHalfWidthNumbers) {
    instructions.push('・数字は半角で書く（例: 3つ、10個）');
  }

  // 語尾
  instructions.push(`・同じ語尾は${rules.maxConsecutiveSameEnding}回以上続けない`);
  instructions.push('・語尾のバリエーション: です/ます/体言止め/疑問形/！など');

  // 接続詞
  if (rules.omitConjunctions) {
    instructions.push('・順接の接続詞（そして、だから等）は省略できるなら省く');
  }

  // 箇条書き
  if (rules.useListFormat) {
    instructions.push('・箇条書きを積極的に使って読みやすくする');
  }

  return instructions.join('\n');
}

// ========================================
// コンテンツカテゴリプロンプト
// ========================================

function buildCategoryPrompt(category: ContentCategory): string {
  const info = getContentCategoryInfo(category);
  if (!info) return '';

  let prompt = `【投稿スタイル】${info.name}\n`;
  prompt += `${info.description}\n\n`;
  prompt += '重要なポイント:\n';
  info.tips.forEach(tip => {
    prompt += `・${tip}\n`;
  });

  // カテゴリ別の追加指示
  switch (category) {
    case 'empathy':
      prompt += '\n※自分の失敗談や経験を「あるある」と共感できる形で表現してください。';
      prompt += '\n※自分を下げる表現で親しみやすさを出してください。';
      break;
    case 'informative':
      prompt += '\n※具体的で実用的な情報を提供してください。';
      prompt += '\n※読者がすぐに実践できるヒントを含めてください。';
      break;
    case 'humorous':
      prompt += '\n※ウケを狙いすぎず、自然なユーモアを心がけてください。';
      prompt += '\n※倫理的に際どい内容は避けてください。';
      break;
    case 'positive':
      prompt += '\n※明るく前向きなトーンで書いてください。';
      prompt += '\n※読者を元気づける内容にしてください。';
      break;
  }

  return prompt;
}

// ========================================
// コンテンツフォーマットプロンプト
// ========================================

function buildFormatPrompt(format: ContentFormat): string {
  const info = getContentFormatInfo(format);
  if (!info) return '';

  let prompt = `【投稿フォーマット】${info.name}\n`;
  prompt += `${info.description}\n\n`;
  prompt += '構成テンプレート:\n';
  prompt += info.templateStructure;

  if (info.examplePost) {
    prompt += `\n\n参考例（${info.exampleLikes?.toLocaleString() || '多数'}いいね獲得）:\n`;
    prompt += info.examplePost;
  }

  return prompt;
}

// ========================================
// 1行目パターンプロンプト
// ========================================

function buildFirstLinePrompt(pattern: FirstLinePattern): string {
  const info = getFirstLinePatternInfo(pattern);
  if (!info) return '';

  let prompt = `【1行目のパターン】${info.name}\n`;
  prompt += `テンプレート: ${info.template}\n`;
  prompt += `例: ${info.example}\n\n`;
  prompt += '※1行目は読者が続きを読むかどうかを決める最重要ポイントです。';

  return prompt;
}

// ========================================
// 実績パターンプロンプト
// ========================================

function buildProvenPatternsPrompt(patterns: ProvenPattern[]): string {
  if (patterns.length === 0) return '';

  let prompt = '【活用できる表現パターン】\n';
  patterns.forEach(patternId => {
    const info = getProvenPatternInfo(patternId);
    if (info) {
      prompt += `・${info.name}: ${info.template}`;
      if (info.exampleLikes) {
        prompt += `（実績: ${info.exampleLikes.toLocaleString()}いいね）`;
      }
      prompt += '\n';
    }
  });

  return prompt;
}

// ========================================
// アルゴリズム対策プロンプト
// ========================================

function buildAlgorithmPrompt(avoidUrls: boolean): string {
  let prompt = '【Xアルゴリズム対策】\n';
  prompt += '以下の点を意識して投稿を作成してください:\n';

  if (avoidUrls) {
    prompt += '・URLリンクは含めない（リプライ欄で共有する想定）\n';
  }

  prompt += '・読者が2分以上滞在したくなる情報量を目指す\n';
  prompt += '・リプライやリポストを促す内容にする\n';
  prompt += '・ブロック・ミュートされるようなネガティブな内容は避ける\n';

  return prompt;
}

// ========================================
// メインプロンプトビルダー
// ========================================

export interface PromptBuilderOptions {
  topic: string;
  persona: string;
  tone: string;
  contentCategory: ContentCategory;
  contentFormat: ContentFormat;
  firstLinePattern: FirstLinePattern;
  provenPatterns: ProvenPattern[];
  writingRules: WritingRules;
  maxLength: number;
  useEmoji: boolean;
  useHashtags: boolean;
  hashtagRules: string;
  mustInclude: string;
  mustExclude: string;
  avoidUrls: boolean;
  referenceInfo?: string;
  examplePosts?: string;
}

export function buildAIPrompt(options: PromptBuilderOptions): string {
  const sections: string[] = [];

  // システムプロンプト
  sections.push(`あなたはX（旧Twitter）の投稿を作成する専門家です。
以下の指示に従って、バズりやすく、読者に価値を提供する投稿を作成してください。`);

  // ペルソナ
  sections.push(`【投稿者のペルソナ】
${options.persona}`);

  // トーン
  sections.push(`【トーン】
${options.tone}なトーンで書いてください。`);

  // トピック
  sections.push(`【今回のトピック】
${options.topic}`);

  // コンテンツカテゴリ
  sections.push(buildCategoryPrompt(options.contentCategory));

  // フォーマット
  sections.push(buildFormatPrompt(options.contentFormat));

  // 1行目パターン
  sections.push(buildFirstLinePrompt(options.firstLinePattern));

  // 実績パターン
  const provenPrompt = buildProvenPatternsPrompt(options.provenPatterns);
  if (provenPrompt) {
    sections.push(provenPrompt);
  }

  // ライティングルール
  sections.push(`【ライティングルール】
${buildWritingRulesPrompt(options.writingRules)}`);

  // 文字数・絵文字・ハッシュタグ
  let formatRules = `【フォーマット要件】
・文字数: ${options.maxLength}文字以内`;

  if (options.useEmoji) {
    formatRules += '\n・絵文字: 適度に使用して視覚的なアクセントを加える';
  } else {
    formatRules += '\n・絵文字: 使用しない';
  }

  if (options.useHashtags) {
    formatRules += `\n・ハッシュタグ: ${options.hashtagRules}`;
  } else {
    formatRules += '\n・ハッシュタグ: 使用しない';
  }

  sections.push(formatRules);

  // 必須/禁止要素
  if (options.mustInclude) {
    sections.push(`【必ず含める要素】
${options.mustInclude}`);
  }

  if (options.mustExclude) {
    sections.push(`【避ける要素】
${options.mustExclude}`);
  }

  // アルゴリズム対策
  sections.push(buildAlgorithmPrompt(options.avoidUrls));

  // 参考情報
  if (options.referenceInfo) {
    sections.push(`【参考情報】
${options.referenceInfo}`);
  }

  // 参考投稿例
  if (options.examplePosts) {
    sections.push(`【参考にする投稿例】
${options.examplePosts}`);
  }

  // 最終指示
  sections.push(`【出力形式】
上記の指示を踏まえて、すぐにXに投稿できる形式で1つの投稿文を作成してください。
余計な説明は不要です。投稿文のみを出力してください。`);

  return sections.join('\n\n');
}

// ========================================
// 設定オブジェクトからプロンプトを生成
// ========================================

export function buildPromptFromSettings(
  settings: Partial<XStrategySettings>,
  topic: string
): string {
  const options: PromptBuilderOptions = {
    topic,
    persona: settings.persona || 'フレンドリーな専門家',
    tone: settings.tone || 'カジュアル',
    contentCategory: settings.contentCategory || 'empathy',
    contentFormat: settings.contentFormat || 'long_post',
    firstLinePattern: settings.firstLinePattern || 'method',
    provenPatterns: settings.provenPatterns || [],
    writingRules: settings.writingRules || DEFAULT_WRITING_RULES,
    maxLength: settings.maxLength || 280,
    useEmoji: settings.useEmoji ?? true,
    useHashtags: settings.useHashtags ?? true,
    hashtagRules: settings.hashtagRules || '最大3個まで',
    mustInclude: settings.mustInclude || '',
    mustExclude: settings.mustExclude || '',
    avoidUrls: settings.avoidUrls ?? true,
    referenceInfo: settings.referenceInfo,
    examplePosts: settings.examplePosts,
  };

  return buildAIPrompt(options);
}

// ========================================
// シンプルなプロンプト生成（既存システムとの互換性用）
// ========================================

export function buildSimplePrompt(
  topic: string,
  persona: string,
  tone: string,
  maxLength: number = 280
): string {
  return `あなたはX（旧Twitter）の投稿を作成するアシスタントです。

【ペルソナ】${persona}
【トーン】${tone}
【トピック】${topic}
【文字数】${maxLength}文字以内

以下のポイントを意識して投稿を作成してください:
- 1行目で読者の興味を引く
- 中学生でも理解できる言葉遣い
- 漢字を使いすぎない（ひらがな70%:漢字30%程度）
- 同じ語尾を続けない
- URLリンクは含めない
- ネガティブな内容は避ける

投稿文のみを出力してください。`;
}

// ========================================
// 投稿改善プロンプト
// ========================================

export function buildImprovementPrompt(
  originalPost: string,
  issues: { code: string; message: string }[]
): string {
  let prompt = `以下のX投稿を改善してください。

【元の投稿】
${originalPost}

【指摘された問題点】
`;

  issues.forEach(issue => {
    prompt += `・${issue.message}\n`;
  });

  prompt += `
【改善の指示】
上記の問題点を修正した投稿を作成してください。
元の投稿の意図やトーンは維持しつつ、指摘された点を改善してください。
改善後の投稿文のみを出力してください。`;

  return prompt;
}
