import type { VercelRequest, VercelResponse } from '@vercel/node';
import { updateSettings } from './lib/notion';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { enabled } = req.body;
    const settings = await updateSettings({ enabled });

    return res.json({ success: true, data: { enabled: settings.enabled } });
  } catch (error: any) {
    console.error('Toggle API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
