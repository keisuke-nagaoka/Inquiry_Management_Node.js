SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS inquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('unread', 'in_progress', 'done') NOT NULL DEFAULT 'unread',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO inquiries (name, email, subject, message, status) VALUES
  ('山田太郎', 'yamada@example.com', '料金プランについて', '料金プランの詳細を教えてください。', 'unread'),
  ('鈴木花子', 'suzuki@example.com', '不具合報告', 'ログイン画面でエラーが発生します。', 'in_progress');
