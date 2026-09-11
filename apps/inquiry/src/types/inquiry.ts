export type InquiryStatus = 'unread' | 'in_progress' | 'done';

export interface Inquiry {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: InquiryStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateInquiryInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface UpdateInquiryInput {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  status?: InquiryStatus;
}
