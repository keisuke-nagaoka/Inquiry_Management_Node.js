import { Request, Response } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db/pool';
import { AppError } from '../utils/AppError';
import { CreateInquiryInput, Inquiry, UpdateInquiryInput } from '../types/inquiry';

export async function listInquiries(req: Request, res: Response): Promise<void> {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const offset = (page - 1) * limit;

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM inquiries ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [limit, offset],
  );
  const [countRows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM inquiries');
  const total = Number(countRows[0]?.total ?? 0);

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

export async function getInquiry(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM inquiries WHERE id = ?', [id]);
  const inquiry = rows[0];
  if (!inquiry) {
    throw new AppError(`Inquiry not found: ${id}`, 404);
  }
  res.json({ data: inquiry as Inquiry });
}

export async function createInquiry(req: Request, res: Response): Promise<void> {
  const input = req.body as CreateInquiryInput;
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO inquiries (name, email, subject, message) VALUES (?, ?, ?, ?)',
    [input.name, input.email, input.subject, input.message],
  );
  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM inquiries WHERE id = ?', [result.insertId]);
  res.status(201).json({ data: rows[0] as Inquiry });
}

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

  const setClause = fields.map((field) => `${field} = ?`).join(', ');
  const values = fields.map((field) => input[field]);
  await pool.query(`UPDATE inquiries SET ${setClause} WHERE id = ?`, [...values, id]);

  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM inquiries WHERE id = ?', [id]);
  res.json({ data: rows[0] as Inquiry });
}

export async function deleteInquiry(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const [result] = await pool.query<ResultSetHeader>('DELETE FROM inquiries WHERE id = ?', [id]);
  if (result.affectedRows === 0) {
    throw new AppError(`Inquiry not found: ${id}`, 404);
  }
  res.status(204).send();
}
