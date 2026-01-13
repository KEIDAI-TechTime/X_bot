# X Bot Backend

X自動投稿ボットのバックエンドサーバーです。

## 技術スタック

- **ランタイム**: Node.js + TypeScript
- **フレームワーク**: Express
- **AI生成**: Claude API (Anthropic)
- **データベース**: Notion API
- **X投稿**: Twitter API v2
- **スケジューラー**: node-cron

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、各APIキーを設定してください。

```bash
cp .env.example .env
```

### 3. Notionデータベースの作成

以下の2つのデータベースをNotionに作成してください。

#### post_settings データベース

| プロパティ名 | タイプ |
|-------------|--------|
| name | タイトル |
| enabled | チェックボックス |
| persona | テキスト |
| tone | テキスト |
| topic | テキスト |
| contentDirection | テキスト |
| mustInclude | テキスト |
| mustExclude | テキスト |
| structureTemplate | テキスト |
| maxLength | 数値 |
| useEmoji | チェックボックス |
| useHashtags | チェックボックス |
| hashtagRules | テキスト |
| referenceInfo | テキスト |
| examplePosts | テキスト |
| postTimes | テキスト (JSON配列) |
| activeDays | マルチセレクト |
| timezone | テキスト |
| maxPostsPerDay | 数値 |

#### post_history データベース

| プロパティ名 | タイプ |
|-------------|--------|
| content | タイトル |
| settingId | テキスト |
| postedAt | 日付 |
| status | セレクト (success / failed) |
| errorMessage | テキスト |

### 4. 開発サーバーの起動

```bash
npm run dev
```

### 5. ビルド＆本番起動

```bash
npm run build
npm start
```

## API エンドポイント

| エンドポイント | メソッド | 説明 |
|--------------|---------|------|
| GET /api/settings | GET | 設定取得 |
| PUT /api/settings | PUT | 設定更新 |
| GET /api/history | GET | 履歴取得 |
| POST /api/generate | POST | 投稿プレビュー生成 |
| GET /api/status | GET | ステータス取得 |
| POST /api/status/toggle | POST | 有効/無効切替 |
| POST /api/status/post-now | POST | 即時投稿 |
| GET /health | GET | ヘルスチェック |

## 環境変数

| 変数名 | 説明 |
|--------|------|
| PORT | サーバーポート (デフォルト: 8080) |
| ANTHROPIC_API_KEY | Claude APIキー |
| NOTION_API_KEY | Notion APIキー |
| NOTION_SETTINGS_DATABASE_ID | 設定データベースID |
| NOTION_HISTORY_DATABASE_ID | 履歴データベースID |
| X_API_KEY | X API Key |
| X_API_SECRET | X API Secret |
| X_ACCESS_TOKEN | X Access Token |
| X_ACCESS_SECRET | X Access Secret |
