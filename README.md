# node_docker

Node.js / Express アプリのローカル開発環境。`go_docker` と同じ考え方で、
1つのnginxの配下にパス単位 (`/inquiry/`, `/other/`, ...) で複数アプリを振り分ける構成。
本番では `node.keisuke-nagaoka.com` 配下の同じEC2・同じnginxにコンテナを追加してリバースプロキシする想定。

## 構成

```
node_docker/
├── compose.yml
├── docker/
│   ├── node/
│   │   └── Dockerfile        # 全アプリ共通のNode.jsビルド用イメージ
│   ├── mysql/
│   │   └── init/              # 初回起動時に実行されるDDL/シード
│   └── nginx/
│       ├── default.conf       # パスごとにupstream/locationを追加して振り分け
│       ├── server.crt
│       └── server.key
└── apps/
    └── inquiry/                # 問い合わせ管理システム (TypeScript + Express + MySQL)
        ├── src/
        ├── public/
        └── README.md
```

## 起動

```bash
cd node_docker
cp apps/inquiry/.env.example apps/inquiry/.env
docker compose up -d
```

- http://localhost:9200/inquiry/ (画面)
- https://localhost:9643/inquiry/ (自己署名証明書)
- MySQLはホストから `localhost:3307` でも接続可能

## 新しいアプリを追加する手順

1. `apps/inquiry` を参考に `apps/<新アプリ名>` を作成する
2. `compose.yml` にサービスを追加する (コメントアウトされている `other-api` を参考にする)
3. `docker/nginx/default.conf` に `upstream` と `location /<新アプリ名>/` ブロックを追加する
4. `docker compose up -d --build` で反映する

## ローカルと本番でDBを切り替える構成

コードは `DB_HOST` などの環境変数しか見ないため、ローカル/本番でコード変更は不要。

```
ローカル: docker compose up          → inquiry-api → MySQLコンテナ(db)
本番    : docker compose -f compose.prod.yml up → inquiry-api → Amazon RDS for MySQL
```

- `compose.yml` … ローカル開発用。`db`(MySQLコンテナ)を含み、ソースをbind mountしてホットリロード
- `compose.prod.yml` … EC2用。`db`サービスは持たず、`apps/inquiry/.env.production` の `DB_HOST` にRDSのエンドポイントを設定する
- `docker/node/Dockerfile.prod` … ビルド成果物(`dist`)をイメージに焼き込む本番用マルチステージビルド
- `docker/nginx/default.prod.conf` … `server_name` を本番ドメイン(`node.keisuke-nagaoka.com`)にした本番用nginx設定

RDS側は以下を想定:

- Public access: **No**(EC2と同一VPC内のみ)
- セキュリティグループ: 3306番ポートはEC2のセキュリティグループからのみ許可
- 接続元がインターネットに公開されるのはEC2のnginx(443)のみで、RDSへは直接到達できない
- 本番の接続情報(`.env.production`)はGitHubにコミットしない(`.gitignore`で除外済み)
