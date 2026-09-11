import { createApp } from './app';
import { env } from './config/env';

// アプリケーションの起動だけを担当するエントリーポイント。
// Expressの設定をapp.tsへ分けることで、HTTPサーバーを起動せずにアプリをテストできる。
const app = createApp();

app.listen(env.port, () => {
  console.log(`inquiry-api listening on :${env.port} (env=${env.nodeEnv})`);
});
