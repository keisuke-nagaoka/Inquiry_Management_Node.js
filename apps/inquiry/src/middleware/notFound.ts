import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';

export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(`Not Found: ${req.originalUrl}`, 404));
}
