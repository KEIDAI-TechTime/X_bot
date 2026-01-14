import { Router } from 'express';
import { getHistory } from '../services/notion.js';

const router = Router();

// GET /api/history - 履歴を取得
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const history = await getHistory(limit);
    res.json({ success: true, data: history });
  } catch (error: any) {
    console.error('Failed to get history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
