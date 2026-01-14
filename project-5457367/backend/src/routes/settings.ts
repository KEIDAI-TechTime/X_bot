import { Router } from 'express';
import { getSettings, updateSettings } from '../services/notion.js';
import { startScheduler, stopScheduler } from '../services/scheduler.js';

const router = Router();

// GET /api/settings - 設定を取得
router.get('/', async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({ success: true, data: settings });
  } catch (error: any) {
    console.error('Failed to get settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/settings - 設定を更新
router.put('/', async (req, res) => {
  try {
    const settings = await updateSettings(req.body);

    // スケジューラーを再起動
    if (settings.enabled) {
      await startScheduler();
    } else {
      stopScheduler();
    }

    res.json({ success: true, data: settings });
  } catch (error: any) {
    console.error('Failed to update settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
