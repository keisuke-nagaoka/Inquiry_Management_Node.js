// APIから受け取る問い合わせデータの形をフロントエンド側でも定義する。
interface Inquiry {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'in_progress' | 'done';
  created_at: string;
  updated_at: string;
}

// 一覧APIは問い合わせ配列に加えて、ページ移動に必要な情報を返す。
interface ListResponse {
  data: Inquiry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API上のステータス値と、画面に表示する日本語を対応付ける。
const STATUS_LABEL: Record<Inquiry['status'], string> = {
  unread: '未対応',
  in_progress: '対応中',
  done: '対応済み',
};

// index.htmlが常にnginxの/inquiry/配下で開かれる前提なので、相対パスでAPIを呼べば
// ローカル(http://localhost:9200/inquiry/api/...)でも本番(/inquiry/api/...)でも動く
const API_BASE = 'api/inquiries';

// 一覧の表示位置と、フォームが新規登録・編集のどちらかを管理する画面状態。
let currentPage = 1;
const pageLimit = 10;
let editingId: number | null = null;

// 一覧とページ送りに使うDOM要素。
const listBody = document.getElementById('inquiry-list') as HTMLTableSectionElement;
const pageInfo = document.getElementById('page-info') as HTMLSpanElement;
const prevButton = document.getElementById('prev-page') as HTMLButtonElement;
const nextButton = document.getElementById('next-page') as HTMLButtonElement;

// 登録・編集フォームに使うDOM要素。
const form = document.getElementById('inquiry-form') as HTMLFormElement;
const formTitle = document.getElementById('form-title') as HTMLHeadingElement;
const formError = document.getElementById('form-error') as HTMLParagraphElement;
const idInput = document.getElementById('inquiry-id') as HTMLInputElement;
const nameInput = document.getElementById('name') as HTMLInputElement;
const emailInput = document.getElementById('email') as HTMLInputElement;
const subjectInput = document.getElementById('subject') as HTMLInputElement;
const messageInput = document.getElementById('message') as HTMLTextAreaElement;
const statusField = document.getElementById('status-field') as HTMLDivElement;
const statusSelect = document.getElementById('status') as HTMLSelectElement;
const submitButton = document.getElementById('submit-button') as HTMLButtonElement;
const cancelButton = document.getElementById('cancel-button') as HTMLButtonElement;

// 問い合わせの詳細表示に使うDOM要素。
const detailSection = document.getElementById('detail-section') as HTMLElement;
const detailContent = document.getElementById('detail-content') as HTMLDListElement;
const closeDetailButton = document.getElementById('close-detail') as HTMLButtonElement;

// 指定ページのデータをAPIから取得し、取得成功後に一覧を描画する。
async function fetchInquiries(page: number): Promise<void> {
  const res = await fetch(`${API_BASE}?page=${page}&limit=${pageLimit}`);
  if (!res.ok) {
    throw new Error(`failed to fetch inquiries: ${res.status}`);
  }
  const body = (await res.json()) as ListResponse;
  renderList(body);
}

// APIレスポンスをテーブル行へ変換し、ページ送りボタンの状態も更新する。
function renderList(body: ListResponse): void {
  listBody.innerHTML = '';
  for (const inquiry of body.data) {
    const tr = document.createElement('tr');
    // ユーザー入力を含む文字列は、HTMLとして解釈されないようエスケープする。
    tr.innerHTML = `
      <td>${inquiry.id}</td>
      <td>${escapeHtml(inquiry.name)}</td>
      <td>${escapeHtml(inquiry.subject)}</td>
      <td>${STATUS_LABEL[inquiry.status]}</td>
      <td>${inquiry.created_at}</td>
      <td class="row-actions"></td>
    `;
    const actionsCell = tr.querySelector('.row-actions') as HTMLTableCellElement;

    const detailBtn = document.createElement('button');
    detailBtn.textContent = '詳細';
    detailBtn.className = 'secondary';
    detailBtn.addEventListener('click', () => showDetail(inquiry));

    const editBtn = document.createElement('button');
    editBtn.textContent = '編集';
    editBtn.addEventListener('click', () => startEdit(inquiry));

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '削除';
    deleteBtn.className = 'danger';
    deleteBtn.addEventListener('click', () => removeInquiry(inquiry.id));

    actionsCell.append(detailBtn, editBtn, deleteBtn);
    listBody.appendChild(tr);
  }

  currentPage = body.pagination.page;
  pageInfo.textContent = `${body.pagination.page} / ${body.pagination.totalPages} ページ`;
  prevButton.disabled = currentPage <= 1;
  nextButton.disabled = currentPage >= body.pagination.totalPages;
}

// 選択した問い合わせの全項目を詳細欄へ表示する。
function showDetail(inquiry: Inquiry): void {
  detailContent.innerHTML = `
    <dt>ID</dt><dd>${inquiry.id}</dd>
    <dt>名前</dt><dd>${escapeHtml(inquiry.name)}</dd>
    <dt>メール</dt><dd>${escapeHtml(inquiry.email)}</dd>
    <dt>件名</dt><dd>${escapeHtml(inquiry.subject)}</dd>
    <dt>内容</dt><dd>${escapeHtml(inquiry.message)}</dd>
    <dt>ステータス</dt><dd>${STATUS_LABEL[inquiry.status]}</dd>
    <dt>登録日時</dt><dd>${inquiry.created_at}</dd>
    <dt>更新日時</dt><dd>${inquiry.updated_at}</dd>
  `;
  detailSection.hidden = false;
}

// 選択したデータをフォームへ設定し、新規登録モードから編集モードへ切り替える。
function startEdit(inquiry: Inquiry): void {
  editingId = inquiry.id;
  idInput.value = String(inquiry.id);
  nameInput.value = inquiry.name;
  emailInput.value = inquiry.email;
  subjectInput.value = inquiry.subject;
  messageInput.value = inquiry.message;
  statusSelect.value = inquiry.status;
  statusField.hidden = false;
  formTitle.textContent = `編集 (ID: ${inquiry.id})`;
  submitButton.textContent = '更新';
  cancelButton.hidden = false;
  formError.hidden = true;
}

// 編集状態と入力値を破棄し、フォームを新規登録モードへ戻す。
function resetForm(): void {
  editingId = null;
  form.reset();
  statusField.hidden = true;
  formTitle.textContent = '新規登録';
  submitButton.textContent = '登録';
  cancelButton.hidden = true;
  formError.hidden = true;
}

// 誤操作を防ぐ確認ダイアログを表示してから、削除APIを呼び出す。
async function removeInquiry(id: number): Promise<void> {
  if (!confirm(`ID:${id} を削除しますか？`)) {
    return;
  }
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) {
    alert('削除に失敗しました');
    return;
  }
  await fetchInquiries(currentPage);
}

// editingIdの有無に応じて、新規登録と更新で送信先・HTTPメソッドを切り替える。
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  formError.hidden = true;

  const payload = {
    name: nameInput.value,
    email: emailInput.value,
    subject: subjectInput.value,
    message: messageInput.value,
    ...(editingId ? { status: statusSelect.value } : {}),
  };

  const url = editingId ? `${API_BASE}/${editingId}` : API_BASE;
  const method = editingId ? 'PUT' : 'POST';

  try {
    // JSON形式でフォーム内容を送信し、API側のエラーメッセージも画面へ表示する。
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error ?? '保存に失敗しました');
    }
    resetForm();
    await fetchInquiries(editingId ? currentPage : 1);
  } catch (err) {
    formError.textContent = err instanceof Error ? err.message : String(err);
    formError.hidden = false;
  }
});

// 各ボタンの操作を、対応する画面更新やAPI取得へ結び付ける。
cancelButton.addEventListener('click', () => resetForm());
closeDetailButton.addEventListener('click', () => {
  detailSection.hidden = true;
});
prevButton.addEventListener('click', () => fetchInquiries(currentPage - 1));
nextButton.addEventListener('click', () => fetchInquiries(currentPage + 1));

// textContentへ一度代入し、HTML特殊文字を安全な文字参照へ変換する。
function escapeHtml(value: string): string {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

// 初期表示は新規登録フォームを整え、一覧の1ページ目を読み込む。
resetForm();
fetchInquiries(1).catch((err) => console.error(err));
