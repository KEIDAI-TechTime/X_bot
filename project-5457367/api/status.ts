import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStatus } from './lib/notion';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const status = await getStatus();
    return res.json({ success: true, data: status });
  } catch (error: any) {
    console.error('Status API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
