/* =========================================================
   SmartAgri — journal.js
   Trang: Nhật ký canh đồng (Field Journal)
   ========================================================= */

const AUTH_KEY = 'smartagri_auth';
const USER_KEY = 'smartagri_user';
const STORE_KEY = 'smartagri_journal_v1';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_PHOTOS = 6;
const NOTE_MIN = 5;
const NOTE_MAX = 600;
const EARLIEST_DATE = '2000-01-01';

const BASE_TYPES = ['Bón phân', 'Phun thuốc', 'Tưới nước', 'Làm cỏ', 'Thu hoạch'];
const STAGES = ['Làm đất', 'Gieo sạ', 'Đẻ nhánh', 'Làm đòng', 'Trổ bông', 'Chín – Thu hoạch'];

/* Danh mục loại hoạt động nối từ trang Cài đặt hệ thống (smartagri_settings.jobs) */
function readTypeCatalog() {
  try {
    const s = JSON.parse(localStorage.getItem('smartagri_settings') || '{}');
    if (s && Array.isArray(s.jobs)) {
      const out = s.jobs.filter((x) => typeof x === 'string' && x.trim());
      if (out.length) return out;
    }
  } catch (err) { /* bỏ qua */ }
  return BASE_TYPES.slice();
}
const TYPES = readTypeCatalog();

const $ = (sel) => document.querySelector(sel);
const pad = (n) => String(n).padStart(2, '0');

/* Ánh xạ loại hoạt động → class chip màu */
const TYPE_CHIP = {
  'Bón phân': 'chip--fertilizer',
  'Phun thuốc': 'chip--spray',
  'Tưới nước': 'chip--water',
  'Làm cỏ': 'chip--weeding',
  'Thu hoạch': 'chip--harvest'
};

/* ---------- Dữ liệu mẫu — chỉ nạp ở lần chạy đầu tiên ---------- */
const SEED_ENTRIES = [
  { id: 5, date: '2024-05-18', time: '07:30', type: 'Phun thuốc', stage: 'Làm đòng', status: 'done', photos: [{ url: 'assets/thumb-la-benh.svg', name: 'la-lua-dot-nau.jpg' }], note: 'Phun Actara 25WG liều 0.3kg/ha phòng rầy nâu, trời nắng nhẹ, đã kiểm tra kỹ mép ruộng phía đông.' },
  { id: 4, date: '2024-05-16', time: '16:00', type: 'Bón phân', stage: 'Đẻ nhánh', status: 'done', photos: [{ url: 'assets/thumb-bon-phan.svg', name: 'bon-thuc-A1.jpg' }], note: 'Bón thúc NPK 16-16-8 liều 20kg/ha cho lô A1, kết hợp sục bùn giữ ẩm sau bón.' },
  { id: 3, date: '2024-05-14', time: '06:45', type: 'Tưới nước', stage: 'Đẻ nhánh', status: 'done', photos: [{ url: 'assets/thumb-tuoi-nuoc.svg', name: 'muc-nuoc-A1.jpg' }], note: 'Tưới giữ mực nước 3-5cm, kiểm tra bờ bao không rò rỉ, nước vào đều khắp mặt ruộng.' },
  { id: 2, date: '2024-05-12', time: '06:15', type: 'Làm cỏ', stage: 'Đẻ nhánh', status: 'done', photos: [{ url: 'assets/thumb-lam-co.svg', name: 'co-bor-A1.jpg' }], note: 'Làm cỏ thủ công quanh bờ và các khóm lúa bị cỏ lấn, gom cỏ ủ phân xanh tại góc ruộng.' },
  { id: 1, date: '2024-05-10', time: '09:20', type: 'Thu hoạch', stage: 'Chín – Thu hoạch', status: 'done', photos: [{ url: 'assets/thumb-thu-hoach.svg', name: 'lua-chin-A1.jpg' }], note: 'Thu hoạch lúa lô A1, năng suất ước đạt 6.2 tấn/ha, hạt chắc vàng, phơi khô đạt ẩm 14%.' }
];

function emptyAi() {
  return { status: 'none', diag: '', note: '', confidence: 0, source: '', at: '' };
}

function seedState() {
  return {
    entries: SEED_ENTRIES.map((e) => Object.assign({}, e, { ai: null })),
    nextId: 6,
    ai: emptyAi()
  };
}

/* Bản ghi chỉ hợp lệ khi ngày đúng định dạng và các giá trị nằm trong danh sách.
   Loại hoạt động chỉ cần là chuỗi không rỗng để việc bỏ một loại khỏi danh mục
   trong Cài đặt không làm mất bản ghi cũ. */
function isEntry(e) {
  return !!e
    && /^\d{4}-\d{2}-\d{2}$/.test(String(e.date))
    && typeof e.type === 'string' && e.type.trim() !== ''
    && STAGES.indexOf(e.stage) !== -1
    && typeof e.note === 'string';
}

/* ---------- Bộ nhớ: giữ nguyên dữ liệu sau khi tải lại trang ---------- */
function loadState() {
  const fallback = seedState();
  let raw = null;
  try { raw = localStorage.getItem(STORE_KEY); } catch (err) { return { state: fallback, fresh: true }; }
  if (!raw) return { state: fallback, fresh: true };
  try {
    const p = JSON.parse(raw);
    if (!p || !Array.isArray(p.entries)) return { state: fallback, fresh: true };
    const list = p.entries.filter(isEntry).map((e) => Object.assign({
      id: 0, time: '00:00', status: 'done', photos: [], ai: null
    }, e, {
      id: Number(e.id) || 0,
      photos: Array.isArray(e.photos) ? e.photos.filter((ph) => ph && typeof ph.url === 'string') : []
    }));
    const maxId = list.reduce((m, e) => Math.max(m, e.id), 0);
    return {
      state: {
        entries: list,
        nextId: Math.max(Number(p.nextId) || 0, maxId + 1, 1),
        ai: p.ai && p.ai.status ? p.ai : emptyAi()
      },
      fresh: false
    };
  } catch (err) {
    return { state: fallback, fresh: true };
  }
}

const boot = loadState();
const state = boot.state;
const entries = state.entries;

let lastSaveFailed = false;
function saveState() {
  state.updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    lastSaveFailed = false;
  } catch (err) {
    lastSaveFailed = true;
  }
  renderStoreNote();
  return !lastSaveFailed;
}

/* ---------- Ảnh đang chọn trong form ---------- */
let photos = [];

/* Danh sách thông báo do Trợ lý AI AgrBrain sinh từ dữ liệu các trang. */

/* ---------- Tham chiếu DOM ---------- */
const layout = $('#layout');
const scrim = $('#scrim');
const toast = $('#toast');

const journalForm = $('#journalForm');
const editId = $('#editId');
const fDate = $('#fDate');
const fType = $('#fType');
const fStage = $('#fStage');
const fNote = $('#fNote');
const noteCount = $('#noteCount');
const saveLabel = $('#saveLabel');
const storeNote = $('#storeNote');

const jDrop = $('#jDrop');
const jFile = $('#jFile');
const thumbs = $('#thumbs');
const thumbsCount = $('#thumbsCount');
const photoError = $('#photoError');

const journalList = $('#journalList');
const listEmpty = $('#listEmpty');
const countPill = $('#countPill');
const searchInput = $('#searchInput');
const filterStage = $('#filterStage');
const filterType = $('#filterType');

/* Nạp danh mục loại hoạt động vào select (form + bộ lọc) theo cấu hình Cài đặt */
function fillTypeOptions(sel, placeholder) {
  const cur = sel.value;
  sel.innerHTML = '';
  const ph = document.createElement('option');
  ph.value = '';
  ph.textContent = placeholder;
  sel.appendChild(ph);
  TYPES.forEach((t) => {
    const o = document.createElement('option');
    o.value = t;
    o.textContent = t;
    sel.appendChild(o);
  });
  if (cur && TYPES.indexOf(cur) !== -1) sel.value = cur;
}
fillTypeOptions(fType, '— Chọn loại hoạt động —');
fillTypeOptions(filterType, '— Tất cả loại —');

const aiBadge = $('#aiBadge');
const aiThumb = $('#aiThumb');
const aiEmpty = $('#aiEmpty');
const aiResult = $('#aiResult');
const aiDiag = $('#aiDiag');
const aiNote = $('#aiNote');
const aiConf = $('#aiConf');
const aiMeter = $('#aiMeter');
const aiSource = $('#aiSource');
const aiReview = $('#aiReview');
const btnDiagnose = $('#btnDiagnose');
const btnConfirmAi = $('#btnConfirmAi');
const btnEditAi = $('#btnEditAi');
const btnRejectAi = $('#btnRejectAi');

/* ---------- 1. Toggle sidebar ---------- */
const btnMenu = $('#btnMenu');
const isDesktopNav = () => window.matchMedia('(min-width: 1025px)').matches;

function setNav(open) {
  if (isDesktopNav()) {
    layout.classList.toggle('nav-closed', !open);
    layout.classList.remove('nav-open');
    scrim.hidden = true;
    sessionStorage.setItem('smartagri_nav', open ? 'open' : 'closed');
  } else {
    layout.classList.toggle('nav-open', open);
    scrim.hidden = !open;
  }
  btnMenu.setAttribute('aria-expanded', String(open));
}

btnMenu.setAttribute('aria-expanded', String(isDesktopNav()));
if (isDesktopNav() && sessionStorage.getItem('smartagri_nav') === 'closed') setNav(false);

btnMenu.addEventListener('click', () => {
  const open = isDesktopNav()
    ? layout.classList.contains('nav-closed')
    : !layout.classList.contains('nav-open');
  setNav(open);
});
scrim.addEventListener('click', () => setNav(false));

/* ---------- 2. Đăng xuất ---------- */
function doLogout() {
  sessionStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(USER_KEY);
  location.replace('login.html');
}
$('#btnLogout').addEventListener('click', doLogout);

/* ---------- 3. Toast ---------- */
let toastTimer;
function showToast(message, kind) {
  toast.textContent = message;
  toast.className = 'toast is-show' + (kind ? ' is-' + kind : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.className = 'toast'; }, 2800);
}

/* ---------- 4. Thông báo ---------- */
const notifList = $('#notifList');
const notifCount = $('#notifCount');
const notifPanel = $('#notifPanel');
const btnBell = $('#btnBell');

function renderNotifications() {
  if (window.AgrBrain) {
    window.AgrBrain.renderNotifications(notifList, notifCount);
    return;
  }
  notifCount.hidden = true;
}

/* Deep link: cuộn tới và báo sáng đúng mục cần xử lý */
function revealTarget() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return;
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('is-target');
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const field = ['[contenteditable="true"]', 'textarea', 'input:not([type=hidden]), select']
    .map((sel) => el.querySelector(sel)).find(Boolean);
  if (field) field.focus({ preventScroll: true });
  setTimeout(() => el.classList.remove('is-target'), 2400);
}
window.addEventListener('load', revealTarget);
window.addEventListener('hashchange', revealTarget);

btnBell.addEventListener('click', () => {
  const open = notifPanel.hidden;
  if (open && window.AgrBrain) window.AgrBrain.renderNotifications(notifList, notifCount);
  notifPanel.hidden = !open;
  btnBell.setAttribute('aria-expanded', String(open));
});
/* ---------- 4b. Menu tài khoản chuyên gia ---------- */
const btnAccount = $('#btnAccount');
const accountPanel = $('#accountPanel');
const userName = sessionStorage.getItem(USER_KEY) || 'Nguyễn Văn Nam';
const nameParts = userName.trim().split(/\s+/);
const initials = (nameParts[0][0] + (nameParts[nameParts.length - 1][0] || '')).toUpperCase();

btnAccount.querySelector('.account__text strong').textContent = userName;
btnAccount.querySelector('.avatar').textContent = initials;
$('#accName').textContent = userName;
$('#accAvatar').textContent = initials;

btnAccount.addEventListener('click', () => {
  const open = accountPanel.hidden;
  accountPanel.hidden = !open;
  notifPanel.hidden = true;
  btnBell.setAttribute('aria-expanded', 'false');
  btnAccount.setAttribute('aria-expanded', String(open));
});
$('#accLogout').addEventListener('click', doLogout);

document.addEventListener('click', (e) => {
  if (!notifPanel.hidden && !e.target.closest('.notif')) {
    notifPanel.hidden = true;
    btnBell.setAttribute('aria-expanded', 'false');
  }
  if (!accountPanel.hidden && !e.target.closest('.account-wrap')) {
    accountPanel.hidden = true;
    btnAccount.setAttribute('aria-expanded', 'false');
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !accountPanel.hidden) {
    accountPanel.hidden = true;
    btnAccount.setAttribute('aria-expanded', 'false');
    btnAccount.focus();
  }
});

/* ---------- 5. Modal dùng chung ---------- */
const modal = $('#modal');
const modalTitle = $('#modalTitle');
const modalBody = $('#modalBody');
const modalFoot = $('#modalFoot');
let lastFocused = null;

function openModal(title, bodyNode, actions) {
  lastFocused = document.activeElement;
  modalTitle.textContent = title;
  modalBody.innerHTML = '';
  modalBody.appendChild(bodyNode);
  modalFoot.innerHTML = '';
  actions.forEach((a) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn ' + (a.primary ? 'btn--primary' : (a.danger ? 'btn--danger' : 'btn--muted'));
    btn.textContent = a.label;
    btn.addEventListener('click', a.onClick);
    modalFoot.appendChild(btn);
  });
  modal.hidden = false;
  const first = modalBody.querySelector('select, textarea, input, button');
  if (first) first.focus();
}
function closeModal() {
  modal.hidden = true;
  if (lastFocused) lastFocused.focus();
}
$('#modalClose').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target.hasAttribute('data-close')) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

/* ---------- 6. Tiện ích ngày ---------- */
function todayISO() {
  const d = new Date();
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}
function formatDate(iso) {
  const p = iso.split('-');
  return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
}
function stamp() {
  const d = new Date();
  return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() +
    ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

/* ---------- 7. Ảnh đính kèm (lưu dạng data URL để không mất khi tải lại) ---------- */
function showPhotoError(msg) {
  photoError.textContent = msg;
  photoError.hidden = !msg;
}

function renderThumbs() {
  thumbs.innerHTML = '';
  photos.forEach((ph, idx) => {
    const li = document.createElement('li');
    if (ph.url) {
      const img = document.createElement('img');
      img.src = ph.url;
      img.alt = ph.name;
      li.appendChild(img);
    } else {
      const pending = document.createElement('span');
      pending.className = 'thumbs__pending';
      pending.textContent = 'Đang nạp…';
      li.appendChild(pending);
    }
    const rm = document.createElement('button');
    rm.type = 'button';
    rm.className = 'thumbs__remove';
    rm.setAttribute('aria-label', 'Gỡ ảnh ' + ph.name);
    rm.innerHTML = '<svg class="icon"><use href="#i-close"></use></svg>';
    rm.addEventListener('click', () => {
      const i = photos.indexOf(ph);
      if (i !== -1) photos.splice(i, 1);
      renderThumbs();
    });
    li.append(rm);
    thumbs.appendChild(li);
  });
  const n = photos.length;
  thumbsCount.hidden = n === 0;
  thumbsCount.textContent = n + ' ảnh đã chọn';
}

/* Nén ảnh về bản nhỏ trước khi ghi vào bộ nhớ để tránh đầy localStorage */
function shrinkImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const max = 480;
      const scale = Math.min(1, max / Math.max(img.width || max, img.height || max));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      try { resolve(canvas.toDataURL('image/jpeg', 0.72)); } catch (err) { reject(err); }
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function readPhoto(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      shrinkImage(String(reader.result)).then(resolve).catch(() => resolve(String(reader.result)));
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

function addFiles(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) return;
  showPhotoError('');
  let overflow = false;

  files.forEach((f) => {
    if (ALLOWED_TYPES.indexOf(f.type) === -1) {
      showPhotoError('Tệp "' + f.name + '" không được hỗ trợ. Chỉ nhận PNG, JPG, WEBP.');
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      showPhotoError('Tệp "' + f.name + '" vượt quá 5MB.');
      return;
    }
    if (photos.length >= MAX_PHOTOS) {
      overflow = true;
      return;
    }
    const slot = { url: '', name: f.name };
    photos.push(slot);
    renderThumbs();
    readPhoto(f).then((url) => {
      if (url) slot.url = url;
      else {
        const i = photos.indexOf(slot);
        if (i !== -1) photos.splice(i, 1);
        showPhotoError('Không đọc được ảnh "' + f.name + '".');
      }
      renderThumbs();
    });
  });

  if (overflow) showPhotoError('Chỉ được đính kèm tối đa ' + MAX_PHOTOS + ' ảnh.');
  renderThumbs();
}

jDrop.addEventListener('click', () => jFile.click());
jDrop.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jFile.click(); }
});
jFile.addEventListener('change', () => { addFiles(jFile.files); jFile.value = ''; });
['dragenter', 'dragover'].forEach((t) => jDrop.addEventListener(t, (e) => { e.preventDefault(); jDrop.classList.add('is-over'); }));
['dragleave', 'drop'].forEach((t) => jDrop.addEventListener(t, (e) => { e.preventDefault(); jDrop.classList.remove('is-over'); }));
jDrop.addEventListener('drop', (e) => addFiles(e.dataTransfer.files));

/* ---------- 8. Render danh sách ---------- */
function getFilteredEntries() {
  const q = searchInput.value.trim().toLowerCase();
  const st = filterStage.value;
  const ty = filterType.value;
  const list = entries.filter((e) => {
    if (st && e.stage !== st) return false;
    if (ty && e.type !== ty) return false;
    if (q) {
      const hay = (e.note + ' ' + e.type + ' ' + e.stage + ' ' + formatDate(e.date)).toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  });
  list.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  return list;
}

function buildItem(entry) {
  const li = document.createElement('li');
  li.className = 'jitem';

  const dot = document.createElement('span');
  dot.className = 'jitem__dot';

  const card = document.createElement('div');
  card.className = 'jitem__card';

  // -- dòng đầu: ngày + chip loại --
  const top = document.createElement('div');
  top.className = 'jitem__top';
  const date = document.createElement('span');
  date.className = 'jitem__date';
  date.innerHTML = '<svg class="icon"><use href="#i-calendar"></use></svg>';
  date.appendChild(document.createTextNode(' ' + formatDate(entry.date) + ' · ' + entry.time));
  const chip = document.createElement('span');
  chip.className = 'chip ' + (TYPE_CHIP[entry.type] || 'chip--other');
  chip.textContent = entry.type;
  top.append(date, chip);

  // -- thân: ảnh + mô tả --
  const body = document.createElement('div');
  body.className = 'jitem__body';
  const first = (entry.photos || [])[0];
  if (first) {
    const img = document.createElement('img');
    img.className = 'jitem__thumb';
    img.src = first.url;
    img.alt = 'Ảnh nhật ký — ' + entry.type;
    body.appendChild(img);
  }
  const textWrap = document.createElement('div');
  const p = document.createElement('p');
  p.className = 'jitem__text';
  p.textContent = entry.note;
  const stage = document.createElement('p');
  stage.className = 'jitem__stage';
  stage.textContent = 'Giai đoạn: ' + entry.stage;
  textWrap.append(p, stage);
  if (entry.ai) textWrap.appendChild(aiLine(entry.ai));
  body.appendChild(textWrap);

  // -- chân: trạng thái + nút --
  const foot = document.createElement('div');
  foot.className = 'jitem__foot';
  const status = document.createElement('span');
  status.className = 'status status--' + entry.status;
  const useIcon = entry.status === 'done' ? 'i-check' : 'i-clock';
  status.innerHTML = '<svg class="icon"><use href="#' + useIcon + '"></use></svg>';
  status.appendChild(document.createTextNode(entry.status === 'done' ? 'Hoàn thành' : 'Đang chờ'));

  const acts = document.createElement('div');
  acts.className = 'jitem__acts';
  const viewBtn = document.createElement('button');
  viewBtn.type = 'button';
  viewBtn.className = 'btn-sm btn-sm--view';
  viewBtn.innerHTML = '<svg class="icon"><use href="#i-search"></use></svg>';
  viewBtn.appendChild(document.createTextNode('Xem'));
  viewBtn.addEventListener('click', () => viewEntry(entry.id));
  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'btn-sm btn-sm--edit';
  editBtn.innerHTML = '<svg class="icon"><use href="#i-pencil"></use></svg>';
  editBtn.appendChild(document.createTextNode('Sửa'));
  editBtn.addEventListener('click', () => startEdit(entry.id));
  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'btn-sm btn-sm--del';
  delBtn.innerHTML = '<svg class="icon"><use href="#i-trash"></use></svg>';
  delBtn.appendChild(document.createTextNode('Xóa'));
  delBtn.addEventListener('click', () => confirmDelete(entry.id));
  acts.append(viewBtn, editBtn, delBtn);

  foot.append(status, acts);
  card.append(top, body, foot);
  li.append(dot, card);
  return li;
}

function renderList() {
  journalList.innerHTML = '';
  const items = getFilteredEntries();
  items.forEach((e) => journalList.appendChild(buildItem(e)));
  countPill.textContent = items.length;
  listEmpty.hidden = items.length !== 0;
}

/* ---------- 9. Kiểm tra dữ liệu bắt buộc & định dạng ---------- */
function isRealDate(iso) {
  const p = iso.split('-').map(Number);
  const d = new Date(p[0], p[1] - 1, p[2]);
  return d.getFullYear() === p[0] && d.getMonth() === p[1] - 1 && d.getDate() === p[2];
}

function dateProblem(v) {
  if (!v) return 'Ngày thực hiện là bắt buộc.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return 'Ngày phải theo định dạng DD/MM/YYYY.';
  if (!isRealDate(v)) return 'Ngày không có thật trong lịch, kiểm tra lại nhé.';
  if (v > todayISO()) return 'Không thể ghi nhật ký cho ngày trong tương lai.';
  if (v < EARLIEST_DATE) return 'Ngày phải từ ' + formatDate(EARLIEST_DATE) + ' trở về sau.';
  return '';
}

function noteProblem(v) {
  const n = v.trim();
  if (!n) return 'Mô tả hoạt động là bắt buộc.';
  if (n.length < NOTE_MIN) return 'Hãy mô tả rõ hơn: tối thiểu ' + NOTE_MIN + ' ký tự (hiện có ' + n.length + ').';
  if (n.length > NOTE_MAX) return 'Mô tả tối đa ' + NOTE_MAX + ' ký tự (hiện có ' + n.length + ').';
  return '';
}

const FIELD_CHECKS = [
  { input: fDate, box: 'dateError', problem: () => dateProblem(fDate.value) },
  { input: fType, box: 'typeError', problem: () => (fType.value ? '' : 'Loại hoạt động là bắt buộc.') },
  { input: fStage, box: 'stageError', problem: () => (STAGES.indexOf(fStage.value) === -1 ? 'Giai đoạn là bắt buộc.' : '') },
  { input: fNote, box: 'noteError', problem: () => noteProblem(fNote.value) }
];

function markField(field, msg) {
  const box = document.getElementById(field.box);
  field.input.classList.toggle('invalid', !!msg);
  if (msg) field.input.setAttribute('aria-invalid', 'true');
  else field.input.removeAttribute('aria-invalid');
  box.textContent = msg;
  box.hidden = !msg;
}

function validateForm() {
  let firstBad = null;
  let count = 0;
  FIELD_CHECKS.forEach((field) => {
    const msg = field.problem();
    markField(field, msg);
    if (msg) {
      count++;
      if (!firstBad) firstBad = field.input;
    }
  });
  if (!count) return true;
  firstBad.focus();
  showToast(count === 1 ? FIELD_CHECKS.find((f) => f.problem()).problem() : 'Còn ' + count + ' trường chưa hợp lệ.', 'bad');
  return false;
}

/* Xoá báo lỗi ngay khi người dùng sửa trường đó đúng */
FIELD_CHECKS.forEach((field) => {
  const sync = () => {
    if (field.input.classList.contains('invalid') && !field.problem()) markField(field, '');
  };
  field.input.addEventListener('input', sync);
  field.input.addEventListener('change', sync);
});
fNote.addEventListener('input', () => { noteCount.textContent = String(fNote.value.trim().length); });

/* ---------- 10. Thêm / sửa / xem ---------- */
const AI_STATUS_LABEL = { pending: 'chờ xác nhận', confirmed: 'đã xác nhận', edited: 'đã chỉnh sửa' };

function aiLine(ai) {
  const box = document.createElement('p');
  box.className = 'jitem__ai';
  box.innerHTML = '<svg class="icon"><use href="#i-ai"></use></svg>';
  const b = document.createElement('b');
  b.textContent = 'AI: ' + ai.diag;
  const s = document.createElement('span');
  s.textContent = ' · ' + (AI_STATUS_LABEL[ai.status] || ai.status) +
    (ai.confidence ? ' (' + ai.confidence + '%)' : '');
  box.append(b, s);
  return box;
}

function resetForm() {
  editId.value = '';
  fDate.value = todayISO();
  fillTypeOptions(fType, '— Chọn loại hoạt động —');
  fStage.selectedIndex = 0;
  fNote.value = '';
  noteCount.textContent = '0';
  FIELD_CHECKS.forEach((field) => markField(field, ''));
  photos = [];
  renderThumbs();
  saveLabel.textContent = 'Lưu nhật ký';
}

function startEdit(id) {
  const e = entries.find((x) => x.id === id);
  if (!e) return;
  editId.value = String(e.id);
  fDate.value = e.date;
  if (e.type && TYPES.indexOf(e.type) === -1) {
    const o = document.createElement('option');
    o.value = e.type;
    o.textContent = e.type + ' (đã bỏ khỏi danh mục)';
    fType.appendChild(o);
  }
  fType.value = e.type;
  fStage.value = e.stage;
  fNote.value = e.note;
  noteCount.textContent = String(e.note.trim().length);
  FIELD_CHECKS.forEach((field) => markField(field, ''));
  photos = (e.photos || []).map((ph) => ({ url: ph.url, name: ph.name || 'anh-nhat-ky.jpg' }));
  renderThumbs();
  if (e.ai) {
    state.ai = Object.assign({}, e.ai);
    renderAi();
  }
  saveLabel.textContent = 'Cập nhật nhật ký';
  journalForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  showToast('Đang sửa nhật ký ' + formatDate(e.date) + '.');
}

function handleSave() {
  if (!validateForm()) return;

  const note = fNote.value.trim();
  const shots = photos.filter((ph) => ph.url).map((ph) => ({ url: ph.url, name: ph.name }));
  const ai = (state.ai.status === 'confirmed' || state.ai.status === 'edited')
    ? Object.assign({}, state.ai, { at: state.ai.at || stamp() })
    : null;

  let msg;
  if (editId.value) {
    const e = entries.find((x) => x.id === Number(editId.value));
    if (!e) {
      showToast('Không tìm thấy bản ghi cần cập nhật.', 'bad');
      return;
    }
    Object.assign(e, {
      date: fDate.value, type: fType.value, stage: fStage.value,
      note: note, photos: shots, ai: ai || e.ai || null
    });
    msg = 'Đã cập nhật nhật ký ngày ' + formatDate(e.date) + '.';
  } else {
    const now = new Date();
    entries.push({
      id: state.nextId++,
      date: fDate.value,
      time: pad(now.getHours()) + ':' + pad(now.getMinutes()),
      type: fType.value,
      stage: fStage.value,
      status: 'done',
      photos: shots,
      note: note,
      ai: ai
    });
    msg = 'Đã lưu nhật ký ' + fType.value + ' ngày ' + formatDate(fDate.value) + '.';
  }

  renderList();
  const saved = saveState();
  resetForm();
  showToast(msg + (ai ? ' Kèm kết quả AI đã duyệt.' : '') +
    (saved ? '' : ' Bộ nhớ trình duyệt đầy — hãy gỡ bớt ảnh.'), saved ? 'ok' : 'bad');
}

$('#btnSave').addEventListener('click', handleSave);
journalForm.addEventListener('submit', (e) => { e.preventDefault(); handleSave(); });

function viewEntry(id) {
  const e = entries.find((x) => x.id === id);
  if (!e) return;

  const wrap = document.createElement('div');
  wrap.className = 'detail';
  const dl = document.createElement('dl');
  dl.className = 'detail__rows';

  function row(label) {
    const r = document.createElement('div');
    r.className = 'detail__row';
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    r.appendChild(dt);
    r.appendChild(dd);
    dl.appendChild(r);
    return dd;
  }

  row('Ngày – giờ').textContent = formatDate(e.date) + ' · ' + e.time;
  row('Hoạt động').textContent = e.type;
  row('Giai đoạn').textContent = e.stage;
  row('Trạng thái').textContent = e.status === 'done' ? 'Hoàn thành' : 'Đang chờ';
  const noteCell = row('Mô tả');
  noteCell.className = 'detail__note';
  noteCell.textContent = e.note;

  if (e.photos && e.photos.length) {
    const cell = row('Đính kèm (' + e.photos.length + ')');
    cell.className = 'detail__photos';
    e.photos.forEach((ph) => {
      const img = document.createElement('img');
      img.src = ph.url;
      img.alt = ph.name || 'Ảnh nhật ký';
      cell.appendChild(img);
    });
  }
  wrap.appendChild(dl);

  if (e.ai) {
    const box = document.createElement('div');
    box.className = 'detail__ai';
    const t = document.createElement('p');
    t.innerHTML = '<strong></strong>';
    t.querySelector('strong').textContent = 'Kết quả AI — ' + (AI_STATUS_LABEL[e.ai.status] || e.ai.status);
    const d = document.createElement('p');
    d.textContent = e.ai.diag + (e.ai.confidence ? ' (' + e.ai.confidence + '%)' : '');
    const n = document.createElement('p');
    n.textContent = e.ai.note;
    const at = document.createElement('p');
    at.className = 'ai-source';
    at.textContent = 'Chuyên gia duyệt lúc ' + e.ai.at;
    box.append(t, d, n, at);
    wrap.appendChild(box);
  }

  openModal('Chi tiết nhật ký', wrap, [
    { label: 'Đóng', onClick: closeModal },
    { label: 'Sửa bản ghi này', primary: true, onClick: () => { closeModal(); startEdit(e.id); } }
  ]);
}

/* ---------- 11. Xóa ---------- */
function confirmDelete(id) {
  const e = entries.find((x) => x.id === id);
  if (!e) return;
  const wrap = document.createElement('p');
  wrap.textContent = 'Xóa nhật ký "' + e.type + '" ngày ' + formatDate(e.date) + '? Hành động này không thể hoàn tác.';
  openModal('Xác nhận xóa', wrap, [
    { label: 'Hủy', onClick: closeModal },
    {
      label: 'Xóa', danger: true, onClick: () => {
        const idx = entries.findIndex((x) => x.id === id);
        if (idx !== -1) entries.splice(idx, 1);
        if (editId.value === String(id)) resetForm();
        renderList();
        saveState();
        closeModal();
        showToast('Đã xóa nhật ký và cập nhật bộ nhớ.', 'ok');
      }
    }
  ]);
}

/* ---------- 11b. Khôi phục dữ liệu mẫu ---------- */
$('#btnSeed').addEventListener('click', () => {
  const wrap = document.createElement('p');
  wrap.textContent = 'Thay toàn bộ nhật ký hiện có bằng ' + SEED_ENTRIES.length + ' bản ghi mẫu? Dữ liệu bạn đã ghi sẽ bị xóa khỏi trình duyệt.';
  openModal('Khôi phục dữ liệu mẫu', wrap, [
    { label: 'Hủy', onClick: closeModal },
    {
      label: 'Khôi phục', danger: true, onClick: () => {
        const fresh = seedState();
        entries.length = 0;
        Array.prototype.push.apply(entries, fresh.entries);
        state.nextId = fresh.nextId;
        state.ai = fresh.ai;
        renderAi();
        renderList();
        resetForm();
        saveState();
        closeModal();
        showToast('Đã khôi phục dữ liệu mẫu.', 'ok');
      }
    }
  ]);
});

/* ---------- 11c. Dòng trạng thái bộ nhớ ---------- */
function renderStoreNote() {
  const n = state.entries.length;
  const at = state.updatedAt ? new Date(state.updatedAt) : null;
  const time = at ? pad(at.getHours()) + ':' + pad(at.getMinutes()) : '—';
  storeNote.textContent = 'Đang lưu trong trình duyệt · ' + n + ' bản ghi · cập nhật lúc ' + time;
  if (lastSaveFailed) storeNote.textContent += ' · ⚠ không ghi được, hãy gỡ bớt ảnh';
}

/* ---------- 12. Tìm kiếm & lọc ---------- */
searchInput.addEventListener('input', renderList);
filterStage.addEventListener('change', renderList);
filterType.addEventListener('change', renderList);
$('#btnReset').addEventListener('click', () => {
  searchInput.value = '';
  filterStage.value = '';
  filterType.value = '';
  renderList();
  showToast('Đã làm mới bộ lọc.');
});

/* ---------- 14. Field Issue Classifier: AI chẩn đoán → chuyên gia duyệt ---------- */
const AI_RULES = [
  {
    test: (s) => s.damaged > 0.26 && s.brown >= s.yellow,
    diag: 'Đốm nâu trên lá (Bệnh Cercospora)',
    note: 'AI ghi nhận các đốm nâu hình bầu dục rải rác trên phiến lá, tỉ lệ vùng hoại tử cao và ẩm độ thuận lợi cho nấm phát triển. Khuyến nghị phun thuốc đặc trị nhóm triazole, giữ mực nước hợp lý và vệ sinh tàn dư cây bệnh sau phun.',
    base: 79
  },
  {
    test: (s) => s.damaged > 0.2 && s.yellow > s.brown,
    diag: 'Vàng lá sinh lý / thiếu đạm',
    note: 'Màu lá nhạt hơn ngưỡng chuẩn ở giai đoạn hiện tại, chưa quan sát thấy mô hoại tử rõ. Khuyến nghị bón thúc đạm chia nhỏ, kiểm tra mực nước và bộ rễ trước khi kết luận bệnh hại.',
    base: 72
  },
  {
    test: (s) => s.green > 0.5 && s.damaged < 0.16,
    diag: 'Chưa phát hiện bất thường rõ',
    note: 'Màu lá đồng đều, mật độ đốm bệnh thấp. Tiếp tục theo dõi bẫy côn trùng và ghi nhật ký thăm đồng định kỳ 3 ngày một lần.',
    base: 88
  }
];

const AI_FALLBACK = {
  diag: 'Rầy nâu gây hại mức nhẹ',
  note: 'AI thấy các vệt chích hút lấm tấm ở bẹ và phiến lá nhưng mật độ chưa vượt ngưỡng xử lý. Khuyến nghị thăm đồng lại sau 48 giờ, giữ nước 3–5cm và hạn chế phun phối hợp khi chưa xác định rõ tác nhân.',
  base: 68
};

const AI_BADGE = {
  none: ['badge--idle', 'Chưa có kết quả'],
  pending: ['badge--wait', 'Chờ chuyên gia xác nhận'],
  confirmed: ['badge--ok', 'Đã xác nhận'],
  edited: ['badge--edit', 'Đã chỉnh sửa']
};

/* Đếm tỉ lệ màu trên ảnh ngay trong trình duyệt — không tải ảnh đi đâu cả */
function analyzePhoto(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const size = 96;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, size, size);
      let data;
      try { data = ctx.getImageData(0, 0, size, size).data; } catch (err) { resolve(null); return; }
      let green = 0, brown = 0, yellow = 0, total = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        if (Math.max(r, g, b) < 40) continue;
        total++;
        if (g > r && g > b) green++;
        else if (r > 150 && g > 110 && b < 110) yellow++;
        else if (r >= g && g >= b) brown++;
      }
      if (!total) { resolve(null); return; }
      resolve({ green: green / total, brown: brown / total, yellow: yellow / total, damaged: (brown + yellow) / total });
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function renderAi() {
  const ai = state.ai;
  const has = ai.status !== 'none';
  const badge = AI_BADGE[ai.status] || AI_BADGE.none;

  aiEmpty.hidden = has;
  aiResult.hidden = !has;
  aiReview.hidden = ai.status !== 'pending';
  btnConfirmAi.disabled = ai.status !== 'pending';
  btnEditAi.disabled = !has;
  btnRejectAi.disabled = !has;
  aiBadge.className = 'badge ' + badge[0];
  aiBadge.textContent = badge[1];

  if (!has) {
    aiDiag.textContent = '';
    aiNote.textContent = '';
    aiConf.textContent = '0%';
    aiMeter.style.width = '0';
    aiSource.textContent = '';
    return;
  }
  aiDiag.textContent = ai.diag;
  aiNote.textContent = ai.note;
  aiConf.textContent = ai.confidence + '%';
  aiMeter.style.width = ai.confidence + '%';
  aiSource.textContent = (ai.source ? 'Nguồn ảnh: ' + ai.source + ' · ' : '') +
    'Tạo lúc ' + (ai.at || '—');
}

btnDiagnose.addEventListener('click', () => {
  if (photos.some((ph) => !ph.url)) {
    showToast('Ảnh đang được nạp, chờ chút rồi bấm lại nhé.', 'bad');
    return;
  }
  const shot = photos.find((ph) => ph.url);
  const url = shot ? shot.url : 'assets/thumb-la-benh.svg';
  const label = shot ? shot.name : 'Ảnh mẫu trong thư viện';

  btnDiagnose.disabled = true;
  aiBadge.className = 'badge badge--busy';
  aiBadge.textContent = 'Đang phân tích…';
  aiThumb.src = url;

  analyzePhoto(url).then((stats) => {
    const rule = (stats && AI_RULES.find((r) => r.test(stats))) || AI_FALLBACK;
    let conf = rule.base + (stats ? Math.round(stats.damaged * 20) : 0) - (shot ? 0 : 6);
    state.ai = {
      status: 'pending',
      diag: rule.diag,
      note: rule.note,
      confidence: Math.max(60, Math.min(96, conf)),
      source: label + (stats ? ' · phân tích màu trên máy' : ' · không đọc được ảnh, dùng kịch bản mẫu'),
      at: stamp()
    };
    btnDiagnose.disabled = false;
    renderAi();
    saveState();
    journalForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('AI đã có kết quả sơ bộ — hãy xác nhận hoặc chỉnh sửa.');
  });
});

btnConfirmAi.addEventListener('click', () => {
  if (state.ai.status !== 'pending') return;
  state.ai.status = 'confirmed';
  state.ai.at = stamp();
  renderAi();
  saveState();
  showToast('Đã xác nhận kết quả AI. Bấm Lưu nhật ký để gắn kết quả vào bản ghi.', 'ok');
});

btnRejectAi.addEventListener('click', () => {
  state.ai = emptyAi();
  renderAi();
  saveState();
  showToast('Đã bỏ kết quả chẩn đoán.');
});

btnEditAi.addEventListener('click', () => {
  if (state.ai.status === 'none') return;

  const wrap = document.createElement('div');
  wrap.innerHTML =
    '<div class="field"><label for="aiDiagInput">Vấn đề / Bệnh <span class="req">*</span></label>' +
    '<input id="aiDiagInput" type="text" maxlength="120"><p class="field-error" id="aiDiagErr" hidden></p></div>' +
    '<div class="field"><label for="aiNoteInput">Mô tả &amp; khuyến nghị <span class="req">*</span></label>' +
    '<textarea id="aiNoteInput" maxlength="600"></textarea><p class="field-error" id="aiNoteErr" hidden></p></div>' +
    '<div class="field"><label for="aiConfInput">Độ tin cậy (%) <span class="req">*</span></label>' +
    '<input id="aiConfInput" type="number" min="10" max="100"><p class="field-error" id="aiConfErr" hidden></p></div>';

  const diagIn = wrap.querySelector('#aiDiagInput');
  const noteIn = wrap.querySelector('#aiNoteInput');
  const confIn = wrap.querySelector('#aiConfInput');
  diagIn.value = state.ai.diag;
  noteIn.value = state.ai.note;
  confIn.value = state.ai.confidence || '';

  function flag(input, boxId, msg) {
    const box = wrap.querySelector('#' + boxId);
    input.classList.toggle('invalid', !!msg);
    box.textContent = msg;
    box.hidden = !msg;
    return !msg;
  }

  function apply() {
    const d = diagIn.value.trim();
    const n = noteIn.value.trim();
    const c = Number(confIn.value);
    const okDiag = flag(diagIn, 'aiDiagErr', d.length < 4 ? 'Tên bệnh cần tối thiểu 4 ký tự.' : '');
    const okNote = flag(noteIn, 'aiNoteErr', n.length < 10 ? 'Khuyến nghị cần tối thiểu 10 ký tự.' : '');
    const okConf = flag(confIn, 'aiConfErr',
      (confIn.value === '' || isNaN(c) || c < 10 || c > 100) ? 'Độ tin cậy phải là số từ 10 đến 100.' : '');
    if (!okDiag || !okNote || !okConf) {
      showToast('Kết quả chỉnh sửa chưa hợp lệ.', 'bad');
      return;
    }
    state.ai.diag = d;
    state.ai.note = n;
    state.ai.confidence = Math.round(c);
    state.ai.status = 'edited';
    state.ai.at = stamp();
    renderAi();
    saveState();
    closeModal();
    showToast('Đã lưu kết quả AI do chuyên gia chỉnh sửa.', 'ok');
  }

  openModal('Chỉnh sửa kết quả AI', wrap, [
    { label: 'Hủy', onClick: closeModal },
    { label: 'Lưu kết quả', primary: true, onClick: apply }
  ]);
});

/* ---------- 15. Nút Trợ lý AI AgrBrain do js/agrbrain.js đảm nhiệm ---------- */

/* ---------- Khởi động ---------- */
if (boot.fresh) saveState(); else renderStoreNote();
renderNotifications();
resetForm();
renderAi();
renderList();
