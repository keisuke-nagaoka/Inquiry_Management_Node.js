import dotenv from 'dotenv';

// .envの値をprocess.envへ読み込み、以降は型を整えたenvオブジェクト経由で参照する。
dotenv.config();

// 必須値がない場合は起動時に失敗させ、不完全な設定のままAPIが動くことを防ぐ。
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// 文字列として渡される環境変数を、アプリ内で扱いやすい型へ変換する。
export const env = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  db: {
    host: required('DB_HOST'),
    port: Number(process.env.DB_PORT ?? 3306),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    database: required('DB_NAME'),
    // RDSなど暗号化通信が必要な本番DBに接続する場合のみ true にする
    ssl: process.env.DB_SSL === 'true',
  },
};
