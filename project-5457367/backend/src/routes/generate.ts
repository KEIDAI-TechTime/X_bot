import { Router } from 'express';
import { generatePost } from '../services/claude.js';
import { getSettings } from '../services/notion.js';

const router = Router();

// POST /api/generate - 投稿を生成（プレビュー用）
router.post('/', async (req, res) => {
  try {
    // リクエストボディから設定を取得するか、Notionから取得
    let settings = req.body.settings;

    if (!settings) {
      settings = await getSettings();
    }

    if (!settings) {
      return res.status(400).json({
        success: false,
        error: 'No settings provided or found',
      });
    }

    const content = await generatePost(settings);

    res.json({
      success: true,
      data: {
        content,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Failed to generate post:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
