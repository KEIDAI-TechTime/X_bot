/**
 * AI連携サービス
 * OpenAI APIを使用して投稿文を生成する
 */

import OpenAI from 'openai';

// 環境変数からAPIキーを取得
const getOpenAIClient = (): OpenAI | null => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('VITE_OPENAI_API_KEY が設定されていません');
    return null;
  }

  return new OpenAI({
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
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * OpenAI APIを使用して投稿文を生成
 */
export async function generatePostWithAI(
  options: GeneratePostOptions
): Promise<GeneratePostResult> {
  const { prompt, maxTokens = 500, temperature = 0.7 } = options;

  const client = getOpenAIClient();

  if (!client) {
    return {
      success: false,
      content: '',
      error: 'OpenAI APIキーが設定されていません。.envファイルにVITE_OPENAI_API_KEYを設定してください。',
    };
  }

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini', // コスト効率の良いモデル
      messages: [
        {
          role: 'system',
          content: 'あなたはX（旧Twitter）の投稿を作成する専門家です。指示に従って、バズりやすい投稿文を作成してください。投稿文のみを出力し、余計な説明は不要です。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: maxTokens,
      temperature,
    });

    const content = response.choices[0]?.message?.content?.trim() || '';

    return {
      success: true,
      content,
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      } : undefined,
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
  return !!import.meta.env.VITE_OPENAI_API_KEY;
}

/**
 * 利用可能なモデル一覧
 */
export const AVAILABLE_MODELS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'コスト効率が良く、高速' },
  { id: 'gpt-4o', name: 'GPT-4o', description: '最高品質、コスト高め' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: '低コスト、基本的な品質' },
] as const;
