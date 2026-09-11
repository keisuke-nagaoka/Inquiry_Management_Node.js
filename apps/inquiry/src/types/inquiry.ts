// DBで管理する問い合わせの対応状態を、許可された文字列だけに制限する。
export type InquiryStatus = 'unread' | 'in_progress' | 'done';

// inquiriesテーブルから取得する1レコードの形。
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

// 新規登録ではDBが採番・設定するid、status、日時を受け取らない。
export interface CreateInquiryInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// 更新APIは部分更新を許可するため、変更可能な項目をすべて任意にする。
export interface UpdateInquiryInput {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  status?: InquiryStatus;
}
