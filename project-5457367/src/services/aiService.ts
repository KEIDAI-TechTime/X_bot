/**
 * AI連携サービス
 * Anthropic Claude APIを使用して投稿文を生成する
 */

import Anthropic from '@anthropic-ai/sdk';

// 環境変数からAPIキーを取得
const getAnthropicClient = (): Anthropic | null => {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn('VITE_ANTHROPIC_API_KEY が設定されていません');
    return null;
  }

  return new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true, // 開発用。本番環境ではバックエンド経由で呼び出すこと
  });
};

export interface GeneratePostOptions {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface GeneratePostResult {
  success: boolean;
  content: string;
  error?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Claude APIを使用して投稿文を生成
 */
export async function generatePostWithAI(
  options: GeneratePostOptions
): Promise<GeneratePostResult> {
  const { prompt, maxTokens = 500, temperature = 0.7 } = options;

  const client = getAnthropicClient();

  if (!client) {
    return {
      success: false,
      content: '',
      error: 'Anthropic APIキーが設定されていません。.envファイルにVITE_ANTHROPIC_API_KEYを設定してください。',
    };
  }

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      system: 'あなたはX（旧Twitter）の投稿を作成する専門家です。指示に従って、バズりやすい投稿文を作成してください。投稿文のみを出力し、余計な説明は不要です。',
    });

    // レスポンスからテキストを抽出
    const textContent = response.content.find(block => block.type === 'text');
    const content = textContent && 'text' in textContent ? textContent.text.trim() : '';

    return {
      success: true,
      content,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
    console.error('AI生成エラー:', error);

    return {
      success: false,
      content: '',
      error: `AI生成に失敗しました: ${errorMessage}`,
    };
  }
}

/**
 * 投稿を改善する
 */
export async function improvePostWithAI(
  originalPost: string,
  improvements: string[]
): Promise<GeneratePostResult> {
  const prompt = `以下のX投稿を改善してください。

【元の投稿】
${originalPost}

【改善点】
${improvements.map((imp, i) => `${i + 1}. ${imp}`).join('\n')}

【指示】
上記の改善点を反映した投稿文を作成してください。
元の投稿の意図やトーンは維持しつつ、指摘された点を改善してください。
改善後の投稿文のみを出力してください。`;

  return generatePostWithAI({ prompt, temperature: 0.5 });
}

/**
 * APIキーが設定されているかチェック
 */
export function isAIConfigured(): boolean {
  return !!import.meta.env.VITE_ANTHROPIC_API_KEY;
}

/**
 * 利用可能なモデル一覧
 */
export const AVAILABLE_MODELS = [
  { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5', description: '最高品質・最新モデル' },
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', description: 'バランスの良いモデル' },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: '高速・低コスト' },
] as const;
