# アフィリエイトポータル MVP

POSLINKアフィリエイトポータルのMVP（最小実行可能製品）版です。

## 主要機能

### 1. 提携企業管理
- 企業一覧の表示
- カテゴリ別フィルター
- 検索機能
- 報酬条件の表示

### 2. アフィリエイトリンク生成
- ワンクリックでリンク生成
- 0120/050番号の自動生成
- トラッキングコード付きURL
- リンクのコピー機能

### 3. ユーザー管理
- ユーザー登録/ログイン
- JWT認証
- セキュアなセッション管理

### 4. ダッシュボード
- リアルタイム統計表示
- 成約件数・報酬額の確認
- パフォーマンス分析
- 成約推移グラフ

### 5. レポート機能
- カスタム期間レポート
- 月次レポート
- CSVエクスポート
- 詳細な成約データ

## 技術スタック

- **フロントエンド**: React + TypeScript
- **バックエンド**: Node.js + Express + TypeScript
- **データベース**: SQLite
- **認証**: JWT (JSON Web Tokens)

## セットアップ方法

### 必要な環境
- Node.js 16以上
- npm または yarn

### インストール手順

1. プロジェクトのクローン
```bash
git clone [repository-url]
cd poslink-affiliate-portal
```

2. 依存関係のインストール
```bash
# ルートディレクトリで
npm install

# バックエンドの依存関係
cd backend
npm install

# フロントエンドの依存関係
cd ..
npm install
```

3. 環境変数の設定
バックエンドの`.env`ファイルを確認し、必要に応じて編集：
```
PORT=3001
JWT_SECRET=your-secret-key-change-in-production
DATABASE_PATH=../database/affiliate.db
```

## 起動方法

### 方法1: 一括起動（推奨）
```bash
./start.sh
```

### 方法2: 個別起動

バックエンドの起動：
```bash
cd backend
npm run dev
```

フロントエンドの起動（別ターミナル）：
```bash
npm start
```

## アクセス情報

- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:3001
- **APIヘルスチェック**: http://localhost:3001/api/health

## デモアカウント

```
ユーザー名: admin
パスワード: admin123
```

## データベース構造

### テーブル一覧
- `users` - ユーザー情報
- `companies` - 提携企業情報
- `affiliate_links` - 生成されたアフィリエイトリンク
- `conversions` - 成約データ
- `reports` - レポート履歴

## API エンドポイント

### 認証
- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン

### 企業
- `GET /api/companies` - 企業一覧取得
- `GET /api/companies/categories` - カテゴリ一覧
- `GET /api/companies/:id` - 企業詳細

### リンク
- `POST /api/links/generate` - リンク生成
- `GET /api/links/my-links` - マイリンク一覧
- `POST /api/links/track/:trackingCode` - クリックトラッキング

### ダッシュボード
- `GET /api/dashboard/stats` - 統計情報
- `GET /api/dashboard/chart-data` - グラフデータ

### レポート
- `GET /api/reports/generate` - レポート生成
- `GET /api/reports/monthly` - 月次レポート

## サンプルデータ

初期状態で以下のサンプル企業が登録されています：
- 楽天モバイル（通信）
- Amazon Prime（サブスクリプション）
- クレジットカードA（金融）
- オンライン英会話（教育）
- プログラミングスクール（教育）

## 開発時の注意事項

- SQLiteデータベースは`database/affiliate.db`に保存されます
- JWTトークンは7日間有効です
- 本番環境では必ず`.env`のJWT_SECRETを変更してください

## トラブルシューティング

### ポートが使用中の場合
```bash
# 3000番ポートを使用しているプロセスを確認
lsof -i :3000

# 3001番ポートを使用しているプロセスを確認
lsof -i :3001
```

### データベースのリセット
```bash
rm database/affiliate.db
# その後、バックエンドを再起動すると自動的に再作成されます
```

## ライセンス

MIT License

## サポート

問題が発生した場合は、Issueを作成してください。