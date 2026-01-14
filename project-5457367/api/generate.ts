import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSettings } from './lib/notion';
import { generatePost } from './lib/claude';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { settings: customSettings } = req.body || {};

    let settings = customSettings;
    if (!settings) {
      settings = await getSettings();
    }

    if (!settings) {
      return res.status(400).json({ success: false, error: 'No settings found' });
    }

    const content = await generatePost(settings);
    return res.json({
      success: true,
      data: {
        content,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Generate API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
