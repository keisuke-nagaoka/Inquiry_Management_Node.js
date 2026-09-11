import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';

// 引数4つはExpressがエラーハンドリングミドルウェアと認識するために必須
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  // 想定外エラーの詳細はクライアントへ公開せず、固定メッセージに置き換える。
  const message = isAppError ? err.message : 'Internal Server Error';

  if (!isAppError) {
    console.error(err);
  }

  res.status(statusCode).json({ error: message });
}
