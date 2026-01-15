/**
 * 投稿検証サービス
 * X投稿戦略に基づいて投稿内容を検証し、スコアリングを行う
 */

import type {
  ValidationResult,
  ValidationIssue,
  WritingRules,
  PostMediaType,
} from '../types/xStrategy';
import { DEFAULT_WRITING_RULES, ALGORITHM_SCORES } from '../config/xStrategy';

// ========================================
// URL検出
// ========================================

const URL_REGEX = /https?:\/\/[^\s]+|www\.[^\s]+/gi;

export function detectUrls(text: string): string[] {
  const matches = text.match(URL_REGEX);
  return matches || [];
}

export function hasUrl(text: string): boolean {
  return URL_REGEX.test(text);
}

// ========================================
// 文字種別カウント
// ========================================

export function countCharacterTypes(text: string): {
  hiragana: number;
  katakana: number;
  kanji: number;
  numbers: number;
  halfWidthNumbers: number;
  fullWidthNumbers: number;
  other: number;
  total: number;
} {
  let hiragana = 0;
  let katakana = 0;
  let kanji = 0;
  let halfWidthNumbers = 0;
  let fullWidthNumbers = 0;
  let other = 0;

  for (const char of text) {
    const code = char.charCodeAt(0);

    // ひらがな
    if (code >= 0x3040 && code <= 0x309f) {
      hiragana++;
    }
    // カタカナ
    else if (code >= 0x30a0 && code <= 0x30ff) {
      katakana++;
    }
    // 漢字（CJK統合漢字）
    else if (code >= 0x4e00 && code <= 0x9faf) {
      kanji++;
    }
    // 半角数字
    else if (code >= 0x30 && code <= 0x39) {
      halfWidthNumbers++;
    }
    // 全角数字
    else if (code >= 0xff10 && code <= 0xff19) {
      fullWidthNumbers++;
    }
    // その他（スペース、記号、絵文字など）
    else {
      other++;
    }
  }

  const total = hiragana + katakana + kanji + halfWidthNumbers + fullWidthNumbers;

  return {
    hiragana,
    katakana,
    kanji,
    numbers: halfWidthNumbers + fullWidthNumbers,
    halfWidthNumbers,
    fullWidthNumbers,
    other,
    total,
  };
}

export function calculateHiraganaRatio(text: string): number {
  const counts = countCharacterTypes(text);
  const japaneseChars = counts.hiragana + counts.kanji;
  if (japaneseChars === 0) return 0;
  return Math.round((counts.hiragana / japaneseChars) * 100);
}

export function calculateKanjiRatio(text: string): number {
  const counts = countCharacterTypes(text);
  const japaneseChars = counts.hiragana + counts.kanji;
  if (japaneseChars === 0) return 0;
  return Math.round((counts.kanji / japaneseChars) * 100);
}

// ========================================
// 語尾検出
// ========================================

const SENTENCE_ENDING_PATTERNS = [
  { pattern: /です[。！？]?$/u, type: 'desu' },
  { pattern: /ます[。！？]?$/u, type: 'masu' },
  { pattern: /だ[。！？]?$/u, type: 'da' },
  { pattern: /ですよね[。？]?$/u, type: 'question' },
  { pattern: /[？?]$/u, type: 'question' },
  { pattern: /[！!]$/u, type: 'exclamation' },
  { pattern: /かな[。？]?$/u, type: 'kana' },
  { pattern: /[^。！？!?]$/u, type: 'taigen' }, // 体言止め
];

export function detectSentenceEndings(text: string): string[] {
  const sentences = text.split(/[。\n]/u).filter(s => s.trim().length > 0);
  return sentences.map(sentence => {
    const trimmed = sentence.trim();
    for (const { pattern, type } of SENTENCE_ENDING_PATTERNS) {
      if (pattern.test(trimmed)) {
        return type;
      }
    }
    return 'other';
  });
}

export function findConsecutiveSameEndings(endings: string[], maxAllowed: number): number[] {
  const violations: number[] = [];
  let currentType = '';
  let count = 0;

  endings.forEach((ending, index) => {
    if (ending === currentType) {
      count++;
      if (count > maxAllowed) {
        violations.push(index);
      }
    } else {
      currentType = ending;
      count = 1;
    }
  });

  return violations;
}

// ========================================
// 1行目の効果判定
// ========================================

const EFFECTIVE_FIRST_LINE_PATTERNS = [
  { pattern: /のコツ|ポイント|方法|やり方/u, type: 'method' },
  { pattern: /とは[？?]?$/u, type: 'question_what' },
  { pattern: /なぜ|どうして|どうやって/u, type: 'question_why' },
  { pattern: /秘訣|秘密|実は/u, type: 'secret' },
  { pattern: /の方へ|向け[。]?$/u, type: 'target' },
  { pattern: /思考回路|脳内/u, type: 'proven_thought' },
  { pattern: /息を吸うように/u, type: 'proven_breathing' },
  { pattern: /馬鹿だった|間違っていた/u, type: 'proven_foolish' },
];

export function analyzeFirstLine(text: string): {
  line: string;
  isEffective: boolean;
  matchedPatterns: string[];
  score: number;
} {
  const firstLine = text.split('\n')[0].trim();
  const matchedPatterns: string[] = [];

  for (const { pattern, type } of EFFECTIVE_FIRST_LINE_PATTERNS) {
    if (pattern.test(firstLine)) {
      matchedPatterns.push(type);
    }
  }

  const isEffective = matchedPatterns.length > 0;
  const score = Math.min(100, matchedPatterns.length * 25 + (isEffective ? 50 : 0));

  return {
    line: firstLine,
    isEffective,
    matchedPatterns,
    score,
  };
}

// ========================================
// 滞在時間ポテンシャル
// ========================================

export function estimateDwellTime(text: string, hasImage: boolean): {
  estimatedSeconds: number;
  meetsTarget: boolean;
  factors: string[];
} {
  const factors: string[] = [];
  let seconds = 0;

  // 文字数による読み取り時間（日本語: 約400-600文字/分）
  const charCount = text.length;
  const readingTime = (charCount / 500) * 60;
  seconds += readingTime;
  factors.push(`文字数${charCount}文字: 約${Math.round(readingTime)}秒`);

  // 画像がある場合
  if (hasImage) {
    seconds += 10;
    factors.push('画像あり: +10秒');
  }

  // 箇条書きがある場合
  const listItems = (text.match(/[①②③④⑤⑥⑦⑧⑨⑩]|[1-9]\.|・/g) || []).length;
  if (listItems > 0) {
    const listTime = listItems * 3;
    seconds += listTime;
    factors.push(`箇条書き${listItems}項目: +${listTime}秒`);
  }

  // 絵文字が多い場合
  const emojiCount = (text.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  if (emojiCount > 3) {
    seconds += 5;
    factors.push('絵文字多め: +5秒');
  }

  return {
    estimatedSeconds: Math.round(seconds),
    meetsTarget: seconds >= 120, // 2分以上
    factors,
  };
}

// ========================================
// アルゴリズムスコア計算
// ========================================

export function calculateAlgorithmPotential(
  text: string,
  hasImage: boolean,
  hasUrl: boolean
): {
  score: number;
  maxScore: number;
  factors: { name: string; impact: string; achieved: boolean }[];
} {
  const factors: { name: string; impact: string; achieved: boolean }[] = [];
  let score = 50; // ベーススコア
  const maxScore = 100;

  // URL検出（マイナス要因）
  if (hasUrl) {
    score -= 20;
    factors.push({ name: 'URLリンクあり', impact: '-20', achieved: false });
  } else {
    score += 10;
    factors.push({ name: 'URLリンクなし', impact: '+10', achieved: true });
  }

  // 画像（プラス要因）
  if (hasImage) {
    score += 15;
    factors.push({ name: '画像付き', impact: '+15', achieved: true });
  }

  // 長文（プラス要因）
  if (text.length > 200) {
    score += 10;
    factors.push({ name: '長文（200文字以上）', impact: '+10', achieved: true });
  }

  // 1行目の効果
  const firstLineAnalysis = analyzeFirstLine(text);
  if (firstLineAnalysis.isEffective) {
    score += 10;
    factors.push({ name: '効果的な1行目', impact: '+10', achieved: true });
  }

  // 滞在時間ポテンシャル
  const dwellTime = estimateDwellTime(text, hasImage);
  if (dwellTime.meetsTarget) {
    score += 15;
    factors.push({ name: '2分以上の滞在時間', impact: '+15', achieved: true });
  }

  return {
    score: Math.max(0, Math.min(maxScore, score)),
    maxScore,
    factors,
  };
}

// ========================================
// メイン検証関数
// ========================================

export function validatePost(
  text: string,
  options: {
    maxLength?: number;
    writingRules?: WritingRules;
    hasImage?: boolean;
  } = {}
): ValidationResult {
  const {
    maxLength = 280,
    writingRules = DEFAULT_WRITING_RULES,
    hasImage = false,
  } = options;

  const issues: ValidationIssue[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // 1. URLリンク検出
  const urls = detectUrls(text);
  if (urls.length > 0) {
    issues.push({
      type: 'warning',
      code: 'URL_DETECTED',
      message: `URLリンクが${urls.length}件検出されました。アルゴリズムにより表示が抑制される可能性があります。`,
    });
    suggestions.push('URLはリプライ欄に記載することを検討してください');
    score -= 15;
  }

  // 2. 文字数チェック
  if (text.length > maxLength) {
    issues.push({
      type: 'error',
      code: 'CHAR_LIMIT_EXCEEDED',
      message: `文字数が上限（${maxLength}文字）を超えています: ${text.length}文字`,
    });
    score -= 20;
  }

  // 3. ひらがな/漢字比率
  const hiraganaRatio = calculateHiraganaRatio(text);
  const kanjiRatio = calculateKanjiRatio(text);

  if (kanjiRatio > 40) {
    issues.push({
      type: 'warning',
      code: 'HIGH_KANJI_RATIO',
      message: `漢字の比率が高めです（${kanjiRatio}%）。推奨は30%以下です。`,
    });
    suggestions.push('漢字をひらがなに置き換えて読みやすくしましょう');
    score -= 5;
  }

  // 4. 全角数字検出
  const charCounts = countCharacterTypes(text);
  if (charCounts.fullWidthNumbers > 0 && writingRules.useHalfWidthNumbers) {
    issues.push({
      type: 'info',
      code: 'FULL_WIDTH_NUMBERS',
      message: `全角数字が${charCounts.fullWidthNumbers}文字あります。半角にすると文字数を節約できます。`,
    });
    suggestions.push('数字は半角に統一しましょう');
  }

  // 5. 語尾重複チェック
  const endings = detectSentenceEndings(text);
  const violations = findConsecutiveSameEndings(endings, writingRules.maxConsecutiveSameEnding);
  if (violations.length > 0) {
    issues.push({
      type: 'warning',
      code: 'SAME_ENDING_REPEATED',
      message: `同じ語尾が${violations.length}箇所で${writingRules.maxConsecutiveSameEnding}回以上続いています。`,
    });
    suggestions.push('語尾にバリエーションを持たせましょう（体言止め、疑問形など）');
    score -= 5;
  }

  // 6. 1行目の効果
  const firstLineAnalysis = analyzeFirstLine(text);
  if (!firstLineAnalysis.isEffective) {
    issues.push({
      type: 'info',
      code: 'WEAK_FIRST_LINE',
      message: '1行目をより効果的なパターンに変更することで、読まれる確率が上がります。',
    });
    suggestions.push('1行目に「方法提示」「質問」「秘密公開」などのパターンを使ってみましょう');
  }

  // 7. 滞在時間ポテンシャル
  const dwellTime = estimateDwellTime(text, hasImage);
  if (!dwellTime.meetsTarget) {
    issues.push({
      type: 'info',
      code: 'LOW_DWELL_TIME',
      message: `推定滞在時間: ${dwellTime.estimatedSeconds}秒（目標: 120秒以上）`,
    });
    suggestions.push('画像を追加したり、箇条書きを増やして滞在時間を伸ばしましょう');
  }

  // アルゴリズムスコア計算
  const algorithmAnalysis = calculateAlgorithmPotential(text, hasImage, urls.length > 0);

  return {
    isValid: issues.filter(i => i.type === 'error').length === 0,
    score: Math.max(0, score),
    issues,
    suggestions,
    algorithmScore: algorithmAnalysis.score,
  };
}

// ========================================
// 投稿タイプ判定
// ========================================

export function detectPostMediaType(
  text: string,
  hasImage: boolean
): PostMediaType {
  const hasUrlInText = hasUrl(text);

  if (hasUrlInText) {
    return 'with_link';
  }

  if (hasImage) {
    return 'with_image';
  }

  if (text.length > 200) {
    return 'long_text';
  }

  return 'text_only';
}

// ========================================
// 改善提案生成
// ========================================

export function generateImprovementSuggestions(
  validationResult: ValidationResult
): string[] {
  const prioritizedSuggestions: string[] = [];

  // エラーがある場合は最優先
  const errors = validationResult.issues.filter(i => i.type === 'error');
  if (errors.length > 0) {
    prioritizedSuggestions.push('まず文字数オーバーなどのエラーを修正してください');
  }

  // スコアが低い場合の提案
  if (validationResult.algorithmScore < 60) {
    prioritizedSuggestions.push('画像を追加してアルゴリズムスコアを上げましょう');
  }

  // 既存の提案を追加
  prioritizedSuggestions.push(...validationResult.suggestions);

  return prioritizedSuggestions;
}
