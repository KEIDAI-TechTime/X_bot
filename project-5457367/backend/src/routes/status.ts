import { Router } from 'express';
import { getStatus, updateSettings } from '../services/notion.js';
import { startScheduler, stopScheduler, postNow, getSchedulerStatus } from '../services/scheduler.js';

const router = Router();

// GET /api/status - ステータスを取得
router.get('/', async (req, res) => {
  try {
    const status = await getStatus();
    const schedulerStatus = getSchedulerStatus();

    res.json({
      success: true,
      data: {
        ...status,
        schedulerJobs: schedulerStatus.jobCount,
      },
    });
  } catch (error: any) {
    console.error('Failed to get status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/toggle - 有効/無効を切り替え
router.post('/toggle', async (req, res) => {
  try {
    const { enabled } = req.body;

    const settings = await updateSettings({ enabled });

    if (enabled) {
      await startScheduler();
    } else {
      stopScheduler();
    }

    res.json({ success: true, data: { enabled: settings.enabled } });
  } catch (error: any) {
    console.error('Failed to toggle:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/post-now - 即時投稿
router.post('/post-now', async (req, res) => {
  try {
    const result = await postNow();
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Failed to post now:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
