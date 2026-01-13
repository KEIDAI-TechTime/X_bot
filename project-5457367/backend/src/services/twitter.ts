import { TwitterApi } from 'twitter-api-v2';

// Twitter API クライアントを初期化
function getClient(): TwitterApi {
  return new TwitterApi({
    appKey: process.env.X_API_KEY!,
    appSecret: process.env.X_API_SECRET!,
    accessToken: process.env.X_ACCESS_TOKEN!,
    accessSecret: process.env.X_ACCESS_SECRET!,
  });
}

// ツイートを投稿
export async function postTweet(content: string): Promise<{ id: string; text: string }> {
  try {
    const client = getClient();
    const rwClient = client.readWrite;

    const result = await rwClient.v2.tweet(content);

    return {
      id: result.data.id,
      text: result.data.text,
    };
  } catch (error: any) {
    console.error('Failed to post tweet:', error);

    // エラーメッセージを整形
    if (error.code === 403) {
      throw new Error('Twitter API access denied. Please check your API credentials and permissions.');
    } else if (error.code === 429) {
      throw new Error('Twitter API rate limit exceeded. Please try again later.');
    } else if (error.data?.detail) {
      throw new Error(`Twitter API error: ${error.data.detail}`);
    }

    throw error;
  }
}

// 認証情報を確認
export async function verifyCredentials(): Promise<boolean> {
  try {
    const client = getClient();
    await client.v2.me();
    return true;
  } catch (error) {
    console.error('Failed to verify Twitter credentials:', error);
    return false;
  }
}
