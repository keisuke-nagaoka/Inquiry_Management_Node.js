# inquiry (問い合わせ管理システム)

TypeScript + Express + MySQL で実装したCRUD + 簡易画面のポートフォリオ用アプリ。

## 技術スタック

- Backend: Node.js / Express / TypeScript
- DB: MySQL (`mysql2/promise` でコネクションプール)
- Frontend: HTML / CSS / TypeScript (フレームワークなし、`tsc`でビルド)
- Validation: `express-validator`
- Logging: `morgan`

## エンドポイント

```
GET    /api/inquiries       一覧 (page, limit でページネーション)
GET    /api/inquiries/:id   詳細
POST   /api/inquiries       登録
PUT    /api/inquiries/:id   更新
DELETE /api/inquiries/:id   削除
```

## ディレクトリ構成

```
src/
├── index.ts              サーバ起動
├── app.ts                Expressアプリの組み立て(ミドルウェア登録)
├── config/env.ts         環境変数の読み込み・検証
├── db/pool.ts             MySQLコネクションプール
├── routes/                ルーティング定義
├── controllers/           リクエストハンドラ(DBアクセス+レスポンス生成)
├── middleware/
│   ├── errorHandler.ts    集約エラーハンドラ
│   ├── notFound.ts        404ハンドラ
│   ├── validateRequest.ts express-validatorの結果をAppErrorに変換
│   └── validators/        エンドポイントごとのバリデーションルール
├── utils/AppError.ts      ステータスコード付きの想定内エラー
└── utils/asyncHandler.ts  非同期controllerのtry/catchを共通化
public/
├── index.html             一覧・登録・編集・詳細画面
├── css/style.css
└── ts/main.ts              fetch APIでバックエンドを呼び出す画面ロジック
```

## ローカル開発

```bash
cd node_docker
cp apps/inquiry/.env.example apps/inquiry/.env
docker compose up -d
```

- 画面: http://localhost:9200/inquiry/
- API: http://localhost:9200/inquiry/api/inquiries

`inquiry-api` コンテナは `npm run dev` で `tsx watch`(サーバ) と `tsc -w`(画面用TS) を同時実行し、
ソース変更を検知して自動反映する。
