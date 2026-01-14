import { TwitterApi } from 'twitter-api-v2';

function getClient(): TwitterApi {
  return new TwitterApi({
    appKey: process.env.X_API_KEY!,
    appSecret: process.env.X_API_SECRET!,
    accessToken: process.env.X_ACCESS_TOKEN!,
    accessSecret: process.env.X_ACCESS_SECRET!,
  });
}

export async function postTweet(content: string): Promise<{ id: string; text: string }> {
  const client = getClient();
  const rwClient = client.readWrite;
  const result = await rwClient.v2.tweet(content);
  return {
    id: result.data.id,
    text: result.data.text,
  };
}

export async function verifyCredentials(): Promise<boolean> {
  try {
    const client = getClient();
    await client.v2.me();
    return true;
  } catch {
    return false;
  }
}
