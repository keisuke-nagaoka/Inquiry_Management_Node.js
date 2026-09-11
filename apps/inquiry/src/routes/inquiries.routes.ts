import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { validateRequest } from '../middleware/validateRequest';
import {
  createInquiryValidator,
  idParamValidator,
  listQueryValidator,
  updateInquiryValidator,
} from '../middleware/validators/inquiry.validator';
import {
  createInquiry,
  deleteInquiry,
  getInquiry,
  listInquiries,
  updateInquiry,
} from '../controllers/inquiries.controller';

export const inquiriesRouter = Router();

inquiriesRouter.get('/', listQueryValidator, validateRequest, asyncHandler(listInquiries));
inquiriesRouter.get('/:id', idParamValidator, validateRequest, asyncHandler(getInquiry));
inquiriesRouter.post('/', createInquiryValidator, validateRequest, asyncHandler(createInquiry));
inquiriesRouter.put('/:id', updateInquiryValidator, validateRequest, asyncHandler(updateInquiry));
inquiriesRouter.delete('/:id', idParamValidator, validateRequest, asyncHandler(deleteInquiry));
