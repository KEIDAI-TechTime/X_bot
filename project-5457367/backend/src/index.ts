import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import settingsRouter from './routes/settings.js';
import historyRouter from './routes/history.js';
import generateRouter from './routes/generate.js';
import statusRouter from './routes/status.js';
import { startScheduler } from './services/scheduler.js';

const app = express();
const PORT = process.env.PORT || 8080;

// ミドルウェア
app.use(cors());
app.use(express.json());

// ルート
app.use('/api/settings', settingsRouter);
app.use('/api/history', historyRouter);
app.use('/api/generate', generateRouter);
app.use('/api/status', statusRouter);

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// サーバー起動
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  // スケジューラーを起動
  try {
    await startScheduler();
    console.log('Scheduler initialized');
  } catch (error) {
    console.error('Failed to initialize scheduler:', error);
  }
});
