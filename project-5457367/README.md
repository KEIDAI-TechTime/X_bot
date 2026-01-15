
# X自動投稿ボット管理システム

生成AIと連携したX（Twitter）自動投稿ボットの管理ダッシュボードです。

## 概要

このシステムは、生成AIを活用してX（Twitter）への投稿を自動化する管理ツールです。投稿の方向性、構成、スケジュールを設定するだけで、AIが自動的に投稿文を生成し、指定した時間に投稿します。

## 主な機能

### 1. 投稿設定
- **キャラクター・トーン設定**: 投稿者のペルソナとトーンを定義
- **内容指示**: テーマ、方向性、含める要素・避ける要素を指定
- **トピックローテーション**: 複数のトピックを設定し、投稿ごとに異なるテーマを自動選択
- **重複防止機能**: 直近N件の投稿と類似するトピックを自動的に回避
- **構成設定**: 投稿の構成テンプレート、文字数、絵文字・ハッシュタグの使用設定
- **参考情報**: AIへの追加コンテキストと参考投稿例

### 2. スケジュール管理
- **投稿時間設定**: 複数の投稿時間を設定可能
- **曜日選択**: 投稿する曜日を選択（プリセット機能付き）
- **投稿制限**: 1日の最大投稿数を設定

### 3. 投稿履歴
- 過去の投稿内容と結果を一覧表示
- 成功/失敗のステータス確認
- エラーメッセージの表示
- CSV形式でのエクスポート機能

### 4. テスト投稿
- 設定変更時の確認用プレビュー機能
- AI生成結果のリアルタイムプレビュー
- 再生成機能
- 即時投稿機能

### 5. ステータス監視
- 総投稿数、成功率、今日の投稿数の統計表示
- 次回投稿予定時刻とカウントダウン
- 最近のアクティビティログ
- システム状態の監視

## システム構成

```
x-auto-poster/
├── src/
│   ├── pages/
│   │   └── home/
│   │       ├── page.tsx              # メインページ
│   │       └── components/
│   │           ├── Sidebar.tsx       # サイドバーナビゲーション
│   │           ├── TopBar.tsx        # トップバー
│   │           ├── SettingsTab.tsx   # 投稿設定タブ
│   │           ├── ScheduleTab.tsx   # スケジュールタブ
│   │           ├── HistoryTab.tsx    # 投稿履歴タブ
│   │           ├── TestTab.tsx       # テスト投稿タブ
│   │           └── StatusTab.tsx     # ステータスタブ
│   ├── mocks/
│   │   └── postSettings.ts           # モックデータ
│   └── router/
│       └── config.tsx                # ルーティング設定
├── index.html
├── package.json
└── README.md
```

## セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` にアクセスしてください。

### 3. ビルド

```bash
npm run build
```

## 使用方法

### 初回設定

1. **投稿設定タブ**で基本設定を行います
   - ペルソナとトーンを設定
   - 投稿内容の方向性を指定
   - 構成テンプレートを作成

2. **スケジュールタブ**で投稿スケジュールを設定
   - 投稿時間を追加
   - 投稿する曜日を選択
   - 1日の最大投稿数を設定

3. **テスト投稿タブ**で動作確認
   - 「生成してプレビュー」で投稿内容を確認
   - 問題なければ設定を有効化

### 通常運用

- 設定を有効化すると、スケジュールに従って自動的に投稿されます
- **投稿履歴タブ**で過去の投稿を確認できます
- **ステータスタブ**でシステムの稼働状況を監視できます
- 緊急時は「緊急停止」ボタンで即座に停止できます

## データベース設計

### post_settings テーブル
投稿設定を保存します。

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | INTEGER | 主キー |
| name | TEXT | 設定名 |
| enabled | BOOLEAN | 有効/無効 |
| persona | TEXT | ペルソナ |
| tone | TEXT | トーン |
| topic | TEXT | テーマ |
| content_direction | TEXT | 内容の方向性 |
| must_include | TEXT | 必ず含める要素 |
| must_exclude | TEXT | 避ける要素 |
| structure_template | TEXT | 構成テンプレート |
| max_length | INTEGER | 最大文字数 |
| use_emoji | BOOLEAN | 絵文字使用 |
| use_hashtags | BOOLEAN | ハッシュタグ使用 |
| hashtag_rules | TEXT | ハッシュタグルール |
| reference_info | TEXT | 参考情報 |
| example_posts | TEXT | 参考投稿例 |
| topics | TEXT | トピックリスト（JSON配列） |
| topic_rotation | BOOLEAN | トピックローテーション有効 |
| avoid_recent_topics | BOOLEAN | 最近のトピック回避有効 |
| recent_topics_to_avoid | INTEGER | 回避する直近投稿数 |
| post_times | TEXT | 投稿時間（JSON） |
| active_days | TEXT | 投稿曜日（JSON） |
| timezone | TEXT | タイムゾーン |
| max_posts_per_day | INTEGER | 1日の最大投稿数 |

### post_history テーブル
投稿履歴を保存します。

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | INTEGER | 主キー |
| setting_id | INTEGER | 設定ID |
| posted_at | DATETIME | 投稿日時 |
| content | TEXT | 投稿内容 |
| status | TEXT | ステータス（success/failed） |
| error_message | TEXT | エラーメッセージ |

## AI生成プロンプト

設定された情報を基に、以下の形式でAIにプロンプトを送信します：

```
X投稿を作成してください。

ペルソナ: {persona}
トーン: {tone}
テーマ: {selected_topic}  // トピックローテーションで選択されたテーマ
方向性: {content_direction}
含める要素: {must_include}
避ける要素: {must_exclude}
構成: {structure_template}
最大文字数: {max_length}
絵文字: {use_emoji ? "可" : "不可"}
ハッシュタグ: {use_hashtags ? "可" : "不可"}
参考情報: {reference_info}
参考例: {example_posts}

【重複防止】以下のテーマは最近投稿済みのため避けてください：
{recent_topics}  // 直近の投稿から抽出したトピック

投稿文のみ出力。説明不要。
```

### トピック選択アルゴリズム

1. **トピックローテーション有効時**:
   - 設定されたトピックリストから順番に選択
   - 「最近のトピック回避」が有効な場合、直近N件の投稿と類似するトピックを除外
   - 利用可能なトピックがない場合は、全トピックからランダムに選択

2. **重複判定ロジック**:
   - 投稿履歴のコンテンツからキーワードを抽出
   - 各トピックのキーワードと照合
   - 類似度が高いトピックを回避リストに追加

## API設計（バックエンド実装時）

| エンドポイント | メソッド | 説明 |
|--------------|---------|------|
| /api/settings | GET | 設定取得 |
| /api/settings | PUT | 設定更新 |
| /api/history | GET | 履歴取得 |
| /api/generate | POST | プレビュー生成 |
| /api/post-now | POST | 即時投稿 |
| /api/toggle | POST | 有効/無効切替 |
| /api/status | GET | 稼働状況取得 |

## 環境変数（バックエンド実装時）

```env
X_API_KEY=your_x_api_key
X_API_SECRET=your_x_api_secret
X_ACCESS_TOKEN=your_access_token
X_ACCESS_SECRET=your_access_secret
OPENAI_API_KEY=your_openai_api_key
AI_PROVIDER=openai
APP_PORT=8080
```

## 技術スタック

- **フロントエンド**: React 19, TypeScript, Tailwind CSS
- **ルーティング**: React Router v7
- **日付処理**: date-fns
- **アイコン**: Remix Icon
- **フォント**: Inter (Google Fonts)

## ライセンス

MIT License

## サポート

問題が発生した場合は、GitHubのIssuesセクションで報告してください。
