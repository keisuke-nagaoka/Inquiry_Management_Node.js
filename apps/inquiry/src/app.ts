import path from 'path';
import express, { Express } from 'express';
import morgan from 'morgan';
import { inquiriesRouter } from './routes/inquiries.routes';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';

// Expressアプリの生成とミドルウェアの適用順を一か所で管理する。
export function createApp(): Express {
  const app = express();

  // 共通ミドルウェアは個別ルーターより先に登録し、すべてのリクエストへ適用する。
  app.use(morgan('dev'));
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.use('/api/inquiries', inquiriesRouter);

  // ルートに一致しなかったリクエストと処理中の例外を、最後に共通形式へ変換する。
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
