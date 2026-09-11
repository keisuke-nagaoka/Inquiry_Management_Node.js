import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from '../utils/AppError';

// 各validatorが蓄積した検証結果を確認し、問題があればコントローラーを呼ばず400を返す。
export function validateRequest(req: Request, _res: Response, next: NextFunction): void {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const message = result
      .array()
      .map((e) => e.msg)
      .join(', ');
    next(new AppError(message, 400));
    return;
  }
  // nextを呼ぶことで、ルート定義上の次のミドルウェアへ処理を渡す。
  next();
}
