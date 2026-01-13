import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSettings, updateSettings } from './lib/notion';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const settings = await getSettings();
      return res.json({ success: true, data: settings });
    }

    if (req.method === 'PUT') {
      const settings = await updateSettings(req.body);
      return res.json({ success: true, data: settings });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Settings API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
