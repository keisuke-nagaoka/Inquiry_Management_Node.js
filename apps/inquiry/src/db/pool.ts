import mysql from 'mysql2/promise';
import { env } from '../config/env';

// リクエストごとの接続作成を避けるため、再利用可能なコネクションプールを共有する。
export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  // MySQLの日付をJavaScriptのDateへ変換せず、APIレスポンス用の文字列として受け取る。
  dateStrings: true,
  ssl: env.db.ssl ? { rejectUnauthorized: true } : undefined,
});
