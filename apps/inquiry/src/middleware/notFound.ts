import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';

// どのルートにも一致しなかったリクエストを、共通エラー処理へ404として渡す。
export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(`Not Found: ${req.originalUrl}`, 404));
}
