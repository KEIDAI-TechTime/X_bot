import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getHistory } from './lib/notion';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const history = await getHistory(limit);
    return res.json({ success: true, data: history });
  } catch (error: any) {
    console.error('History API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
