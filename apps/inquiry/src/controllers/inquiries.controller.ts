import { Request, Response } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db/pool';
import { AppError } from '../utils/AppError';
import { CreateInquiryInput, Inquiry, UpdateInquiryInput } from '../types/inquiry';

// コントローラーはHTTP入出力とDB操作を仲介し、レスポンスの形を決める。
export async function listInquiries(req: Request, res: Response): Promise<void> {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const offset = (page - 1) * limit;

  // プレースホルダーへ値を渡し、SQL文字列へ入力値を直接埋め込まない。
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM inquiries ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [limit, offset],
  );
  const [countRows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM inquiries');
  const total = Number(countRows[0]?.total ?? 0);

  // データ本体とページ情報をまとめ、クライアント側でページ送りを判断できるようにする。
  res.json({
    data: rows as Inquiry[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
  });
}

// URLパラメーターのidに対応する問い合わせを1件返す。
export async function getInquiry(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM inquiries WHERE id = ?', [id]);
  const inquiry = rows[0];
  if (!inquiry) {
    throw new AppError(`Inquiry not found: ${id}`, 404);
  }
  res.json({ data: inquiry as Inquiry });
}

// 検証済みのリクエスト本文を登録し、作成されたレコードを返す。
export async function createInquiry(req: Request, res: Response): Promise<void> {
  const input = req.body as CreateInquiryInput;
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO inquiries (name, email, subject, message) VALUES (?, ?, ?, ?)',
    [input.name, input.email, input.subject, input.message],
  );
  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM inquiries WHERE id = ?', [result.insertId]);
  res.status(201).json({ data: rows[0] as Inquiry });
}

// リクエストに含まれた項目だけでSET句を組み立て、部分更新する。
export async function updateInquiry(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const input = req.body as UpdateInquiryInput;

  const [existingRows] = await pool.query<RowDataPacket[]>('SELECT * FROM inquiries WHERE id = ?', [id]);
  if (!existingRows[0]) {
    throw new AppError(`Inquiry not found: ${id}`, 404);
  }

  const fields = Object.keys(input) as (keyof UpdateInquiryInput)[];
  if (fields.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  // 値はプレースホルダー化し、入力された順序とvaluesの順序を一致させる。
  const setClause = fields.map((field) => `${field} = ?`).join(', ');
  const values = fields.map((field) => input[field]);
  await pool.query(`UPDATE inquiries SET ${setClause} WHERE id = ?`, [...values, id]);

  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM inquiries WHERE id = ?', [id]);
  res.json({ data: rows[0] as Inquiry });
}

// DELETEの更新件数を使い、対象が存在しない場合は404として扱う。
export async function deleteInquiry(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const [result] = await pool.query<ResultSetHeader>('DELETE FROM inquiries WHERE id = ?', [id]);
  if (result.affectedRows === 0) {
    throw new AppError(`Inquiry not found: ${id}`, 404);
  }
  res.status(204).send();
}
