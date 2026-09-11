import { body, param, query } from 'express-validator';

// 登録時は必須項目の空文字、形式、DBカラム長をAPIへ到達する前に検証する。
export const createInquiryValidator = [
  body('name').trim().notEmpty().withMessage('name is required').isLength({ max: 100 }),
  body('email').trim().notEmpty().withMessage('email is required').isEmail().withMessage('invalid email'),
  body('subject').trim().notEmpty().withMessage('subject is required').isLength({ max: 255 }),
  body('message').trim().notEmpty().withMessage('message is required'),
];

// 更新時は送信された項目だけを検証し、statusは定義済みの値だけを許可する。
export const updateInquiryValidator = [
  param('id').isInt({ min: 1 }).withMessage('id must be a positive integer'),
  body('name').optional().trim().isLength({ max: 100 }),
  body('email').optional().trim().isEmail().withMessage('invalid email'),
  body('subject').optional().trim().isLength({ max: 255 }),
  body('message').optional().trim().notEmpty(),
  body('status').optional().isIn(['unread', 'in_progress', 'done']),
];

// パスパラメーターはMySQLの採番idとして有効な正の整数に限定する。
export const idParamValidator = [param('id').isInt({ min: 1 }).withMessage('id must be a positive integer')];

// 一覧取得の件数に上限を設け、過大な検索によるDB負荷を抑える。
export const listQueryValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];
