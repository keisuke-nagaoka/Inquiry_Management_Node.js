import { body, param, query } from 'express-validator';

export const createInquiryValidator = [
  body('name').trim().notEmpty().withMessage('name is required').isLength({ max: 100 }),
  body('email').trim().notEmpty().withMessage('email is required').isEmail().withMessage('invalid email'),
  body('subject').trim().notEmpty().withMessage('subject is required').isLength({ max: 255 }),
  body('message').trim().notEmpty().withMessage('message is required'),
];

export const updateInquiryValidator = [
  param('id').isInt({ min: 1 }).withMessage('id must be a positive integer'),
  body('name').optional().trim().isLength({ max: 100 }),
  body('email').optional().trim().isEmail().withMessage('invalid email'),
  body('subject').optional().trim().isLength({ max: 255 }),
  body('message').optional().trim().notEmpty(),
  body('status').optional().isIn(['unread', 'in_progress', 'done']),
];

export const idParamValidator = [param('id').isInt({ min: 1 }).withMessage('id must be a positive integer')];

export const listQueryValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];
