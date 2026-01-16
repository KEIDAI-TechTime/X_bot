/**
 * X（旧Twitter）投稿サービス
 * Vercel API Routeを経由してX APIに投稿
 */

export interface PostToXResult {
  success: boolean;
  tweetId?: string;
  text?: string;
  error?: string;
}

/**
 * Xに投稿する
 */
export async function postToX(content: string): Promise<PostToXResult> {
  try {
    const response = await fetch('/api/post-to-x', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      tweetId: data.tweetId,
      text: data.text,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `ネットワークエラー: ${errorMessage}`,
    };
  }
}

/**
 * X API接続確認
 */
export async function checkXConnection(): Promise<boolean> {
  try {
    // 簡易的な接続確認（実際のエンドポイントは後で実装可能）
    return true;
  } catch {
    return false;
  }
}
