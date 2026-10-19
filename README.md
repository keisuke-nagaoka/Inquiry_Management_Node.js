# node_docker

Node.js / Express アプリの開発・本番環境。`go_docker` と同じ考え方で、
1つのnginxの配下にパス単位 (`/inquiry/`, `/other/`, ...) で複数アプリを振り分ける構成。
本番では `node.keisuke-nagaoka.com` のEC2上で同じ構成を動かし、DBはAmazon RDS for MySQLを使う。

## 構成

```
node_docker/
├── compose.yml                  # ローカル開発用 (nginx + inquiry-api + MySQLコンテナ)
├── compose.prod.yml             # 本番(EC2)用 (nginx + inquiry-api、DBはRDS)
├── docker/
│   ├── node/
│   │   ├── Dockerfile           # 開発用。ソースをbind mountして npm run dev で起動
│   │   └── Dockerfile.prod      # 本番用マルチステージビルド。dist をイメージに焼き込む
│   ├── mysql/
│   │   ├── init/                # 初回起動時に実行されるDDL/シード
│   │   └── data/                # MySQLのデータ (自動生成・Git管理外)
│   └── nginx/
│       ├── default.conf         # ローカル用。パスごとにupstream/locationを追加して振り分け
│       ├── default.prod.conf    # 本番用。server_name が node.keisuke-nagaoka.com
│       ├── server.crt           # TLS証明書 (各自で用意・Git管理外)
│       └── server.key           # TLS秘密鍵 (各自で用意・Git管理外)
└── apps/
    └── inquiry/                 # 問い合わせ管理システム (TypeScript + Express + MySQL)
        ├── src/                 # サーバー側 (Express)
        ├── public/              # 画面 (public/ts をコンパイルして public/js を生成)
        ├── .env.example                 # ローカル用環境変数のテンプレート
        ├── .env.production.example      # 本番用環境変数のテンプレート
        └── README.md
```

## ローカルで起動

### 1. 環境変数ファイルを用意する

```bash
cd node_docker
cp apps/inquiry/.env.example apps/inquiry/.env
```

### 2. 自己署名証明書を作成する

`server.crt` / `server.key` はGit管理外のため、初回のみ作成する。

```bash
openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
  -keyout docker/nginx/server.key \
  -out docker/nginx/server.crt \
  -subj "/CN=localhost"
```

> 証明書を作る前に `docker compose up` すると、Dockerが `server.crt` / `server.key` を空ディレクトリとして作ってしまい、nginxが起動しない。その場合はディレクトリを削除してから作り直す。

### 3. 起動する

```bash
docker compose up -d
```

- http://localhost:9200/inquiry/ (画面)
- https://localhost:9643/inquiry/ (自己署名証明書)
- MySQLはホストから `localhost:3307` でも接続可能 (ユーザー: `inquiry_user` / パスワード: `inquiry_pass` / DB: `inquiry_db`)

`inquiry-api` コンテナは起動時に `npm install && npm run dev` を実行し、サーバー (`tsx watch`) とクライアントTS (`tsc -w`) の両方をホットリロードする。

`docker/mysql/init/` のSQLはデータディレクトリが空のとき (初回起動時) にのみ実行される。DBを作り直したい場合は `docker compose down` の後に `docker/mysql/data/` の中身を削除して再起動する。

## 本番 (EC2) で起動

```bash
cd node_docker
cp apps/inquiry/.env.production.example apps/inquiry/.env.production
# .env.production の DB_HOST / DB_USER / DB_PASSWORD などをRDSの値に書き換える
# docker/nginx/server.crt / server.key に正式な証明書 (Let's Encrypt等) を配置する
docker compose -f compose.prod.yml up -d --build
```

- nginxはホストの80/443番ポートで待ち受け、`https://node.keisuke-nagaoka.com/inquiry/` で公開される
- `inquiry-api` は `Dockerfile.prod` でビルドした成果物 (`dist`, `public`) を `node dist/index.js` で実行する
- 各コンテナは `restart: unless-stopped` で、EC2再起動時も自動で立ち上がる

## ローカルと本番でDBを切り替える構成

コードは `DB_HOST` などの環境変数しか見ないため、ローカル/本番でコード変更は不要。

```
ローカル: docker compose up -d                            → inquiry-api → MySQLコンテナ(db)
本番    : docker compose -f compose.prod.yml up -d --build → inquiry-api → Amazon RDS for MySQL
```

| | ローカル | 本番 |
|---|---|---|
| Composeファイル | `compose.yml` | `compose.prod.yml` |
| 環境変数 | `apps/inquiry/.env` | `apps/inquiry/.env.production` |
| Dockerfile | `docker/node/Dockerfile` (bind mount + ホットリロード) | `docker/node/Dockerfile.prod` (ビルド成果物を焼き込み) |
| nginx設定 | `docker/nginx/default.conf` (`localhost`) | `docker/nginx/default.prod.conf` (`node.keisuke-nagaoka.com`) |
| ポート | 9200 (HTTP) / 9643 (HTTPS) | 80 (HTTP) / 443 (HTTPS) |
| DB | `db` サービス (MySQL 8.0コンテナ) | Amazon RDS for MySQL (`DB_SSL=true` で通信を暗号化) |

RDS側は以下を想定:

- Public access: **No**(EC2と同一VPC内のみ)
- セキュリティグループ: 3306番ポートはEC2のセキュリティグループからのみ許可
- 接続元がインターネットに公開されるのはEC2のnginx(443)のみで、RDSへは直接到達できない
- 本番の接続情報(`.env.production`)はGitHubにコミットしない(`apps/inquiry/.gitignore`で除外済み)

## 新しいアプリを追加する手順

1. `apps/inquiry` を参考に `apps/<新アプリ名>` を作成する (`.env.example` / `.env.production.example` も用意する)
2. `compose.yml` にサービスを追加する (コメントアウトされている `other-api` を参考にし、必要に応じて `env_file` を追加する)
3. `docker/nginx/default.conf` に `upstream` と `location /<新アプリ名>/` ブロックを追加する (HTTP/HTTPS両方の `server` に追加。コメントアウトされている `other` を参考にする)
4. 本番用に `compose.prod.yml` にもサービスを追加する (コメントアウトされている `other-api` を参考にする)
5. `docker/nginx/default.prod.conf` にも `upstream` と `location /<新アプリ名>/` ブロックを追加する (`inquiry` のブロックを参考にする)
6. ローカルは `docker compose up -d --build`、本番は `docker compose -f compose.prod.yml up -d --build` で反映する
