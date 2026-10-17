/* =========================================================
   SmartAgri — journal.js
   Trang: Nhật ký canh đồng (Field Journal)
   ========================================================= */

const AUTH_KEY = 'smartagri_auth';
const USER_KEY = 'smartagri_user';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_PHOTOS = 6;

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

/* ---------- Dữ liệu mẫu ---------- */
let nextId = 6;
const entries = [
  { id: 5, date: '2024-05-18', time: '07:30', type: 'Phun thuốc', stage: 'Làm đòng', status: 'done', thumb: 'assets/thumb-la-benh.svg', note: 'Phun Actara 25WG liều 0.3kg/ha phòng rầy nâu, trời nắng nhẹ, đã kiểm tra kỹ mép ruộng phía đông.' },
  { id: 4, date: '2024-05-16', time: '16:00', type: 'Bón phân', stage: 'Đẻ nhánh', status: 'done', thumb: 'assets/thumb-bon-phan.svg', note: 'Bón thúc NPK 16-16-8 liều 20kg/ha cho lô A1, kết hợp sục bùn giữ ẩm sau bón.' },
  { id: 3, date: '2024-05-14', time: '06:45', type: 'Tưới nước', stage: 'Đẻ nhánh', status: 'done', thumb: 'assets/thumb-tuoi-nuoc.svg', note: 'Tưới giữ mực nước 3-5cm, kiểm tra bờ bao không rò rỉ, nước vào đều khắp mặt ruộng.' },
  { id: 2, date: '2024-05-12', time: '06:15', type: 'Làm cỏ', stage: 'Đẻ nhánh', status: 'done', thumb: 'assets/thumb-lam-co.svg', note: 'Làm cỏ thủ công quanh bờ và các khóm lúa bị cỏ lấn, gom cỏ ủ phân xanh tại góc ruộng.' },
  { id: 1, date: '2024-05-10', time: '09:20', type: 'Thu hoạch', stage: 'Chín – Thu hoạch', status: 'done', thumb: 'assets/thumb-thu-hoach.svg', note: 'Thu hoạch lúa lô A1, năng suất ước đạt 6.2 tấn/ha, hạt chắc vàng, phơi khô đạt ẩm 14%.' }
];

/* Mỗi thông báo trỏ thẳng tới mục cần xử lý (trang + neo). */
const notifications = [
  { title: 'Cảnh báo đạo ôn cấp khẩn cấp — lô B2', body: 'AI phát hiện vết bệnh trên 3/10 ảnh ngày 12/10, ẩm độ 82%.', to: 'Mở cảnh báo để xử lý', href: 'alerts.html#alert-1' },
  { title: 'Yêu cầu #1182 chờ phản hồi', body: 'Nông hộ Trần Văn Bình đã gửi ảnh hiện trường lô A1.', to: 'Viết tư vấn cho nông hộ', href: 'index.html#advice-1182' },
  { title: 'Nhắc ghi nhật ký canh đồng', body: 'Hôm nay chưa có hoạt động nào được ghi lại.', to: 'Thêm hoạt động vào nhật ký', href: 'journal.html#journalForm' },
  { title: 'Hồ sơ nông hộ chờ duyệt', body: 'Lê Văn Tuấn — 2.4 ha lúa tại Tháp Mười, gửi ngày 10/10.', to: 'Xem đơn chờ duyệt', href: 'households.html#pending-1' },
  { title: 'Báo cáo tuần đã hoàn tất', body: 'Bảng tổng hợp hoạt động 05/10 – 12/10 đã sẵn sàng.', to: 'Xuất báo cáo tuần', href: 'reports.html#rep-export' }
];

/* ---------- Ảnh đang chọn trong form ---------- */
let photos = [
  { url: 'assets/thumb-la-benh.svg', name: 'la-lua-dot-nau.jpg', obj: false },
  { url: 'assets/thumb-tuoi-nuoc.svg', name: 'canh-dong-A1.jpg', obj: false }
];

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
const noteError = $('#noteError');
const saveLabel = $('#saveLabel');

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

const aiBadge = $('#aiBadge');
const aiDiag = $('#aiDiag');
const aiNote = $('#aiNote');

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
  notifList.innerHTML = '';
  notifications.forEach((item) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.className = 'notif__item';
    link.href = item.href;
    const strong = document.createElement('strong');
    const body = document.createElement('span');
    const go = document.createElement('em');
    strong.textContent = item.title;
    body.textContent = item.body;
    go.className = 'notif__go';
    go.textContent = item.to + ' →';
    link.append(strong, body, go);
    li.appendChild(link);
    notifList.appendChild(li);
  });
  notifCount.textContent = notifications.length;
  notifCount.hidden = notifications.length === 0;
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

/* ---------- 7. Ảnh đính kèm ---------- */
function showPhotoError(msg) {
  photoError.textContent = msg;
  photoError.hidden = !msg;
}

function renderThumbs() {
  thumbs.innerHTML = '';
  photos.forEach((ph, idx) => {
    const li = document.createElement('li');
    const img = document.createElement('img');
    img.src = ph.url;
    img.alt = ph.name;
    const rm = document.createElement('button');
    rm.type = 'button';
    rm.className = 'thumbs__remove';
    rm.setAttribute('aria-label', 'Gỡ ảnh ' + ph.name);
    rm.innerHTML = '<svg class="icon"><use href="#i-close"></use></svg>';
    rm.addEventListener('click', () => {
      if (ph.obj) URL.revokeObjectURL(ph.url);
      photos.splice(idx, 1);
      renderThumbs();
    });
    li.append(img, rm);
    thumbs.appendChild(li);
  });
  const n = photos.length;
  thumbsCount.hidden = n === 0;
  thumbsCount.textContent = n + (n === 1 ? ' ảnh đã chọn' : ' ảnh đã chọn');
}

function addFiles(fileList) {
  showPhotoError('');
  const files = Array.from(fileList || []);
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (ALLOWED_TYPES.indexOf(f.type) === -1) {
      showPhotoError('Tệp "' + f.name + '" không được hỗ trợ. Chỉ nhận PNG, JPG, WEBP.');
      continue;
    }
    if (f.size > MAX_FILE_SIZE) {
      showPhotoError('Tệp "' + f.name + '" vượt quá 5MB.');
      continue;
    }
    if (photos.length >= MAX_PHOTOS) {
      showPhotoError('Chỉ được đính kèm tối đa ' + MAX_PHOTOS + ' ảnh.');
      break;
    }
    photos.push({ url: URL.createObjectURL(f), name: f.name, obj: true });
  }
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
  chip.className = 'chip ' + (TYPE_CHIP[entry.type] || '');
  chip.textContent = entry.type;
  top.append(date, chip);

  // -- thân: ảnh + mô tả --
  const body = document.createElement('div');
  body.className = 'jitem__body';
  if (entry.thumb) {
    const img = document.createElement('img');
    img.className = 'jitem__thumb';
    img.src = entry.thumb;
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
  acts.append(editBtn, delBtn);

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

/* ---------- 9. Form: reset / sửa / lưu ---------- */
function clearPhotos() {
  photos.forEach((ph) => { if (ph.obj) URL.revokeObjectURL(ph.url); });
  photos = [];
}

function resetForm() {
  editId.value = '';
  fDate.value = todayISO();
  fType.selectedIndex = 0;
  fStage.value = 'Đẻ nhánh';
  fNote.value = '';
  fNote.classList.remove('invalid');
  fDate.classList.remove('invalid');
  noteError.hidden = true;
  clearPhotos();
  renderThumbs();
  saveLabel.textContent = 'Lưu nhật ký';
}

function startEdit(id) {
  const e = entries.find((x) => x.id === id);
  if (!e) return;
  editId.value = String(e.id);
  fDate.value = e.date;
  fType.value = e.type;
  fStage.value = e.stage;
  fNote.value = e.note;
  fNote.classList.remove('invalid');
  noteError.hidden = true;
  clearPhotos();
  photos = e.thumb ? [{ url: e.thumb, name: 'anh-nhat-ky.jpg', obj: false }] : [];
  renderThumbs();
  saveLabel.textContent = 'Cập nhật nhật ký';
  journalForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  showToast('Đang sửa nhật ký ' + formatDate(e.date) + '.');
}

function handleSave() {
  let ok = true;

  if (!fDate.value) {
    fDate.classList.add('invalid');
    ok = false;
  } else {
    fDate.classList.remove('invalid');
  }

  const note = fNote.value.trim();
  if (note.length < 5) {
    fNote.classList.add('invalid');
    noteError.textContent = 'Hãy mô tả hoạt động rõ hơn (tối thiểu 5 ký tự).';
    noteError.hidden = false;
    ok = false;
  } else {
    fNote.classList.remove('invalid');
    noteError.hidden = true;
  }

  if (!ok) {
    showToast('Vui lòng kiểm tra lại dữ liệu trong form.', 'bad');
    return;
  }

  const thumb = photos.length ? photos[0].url : '';

  if (editId.value) {
    const e = entries.find((x) => x.id === Number(editId.value));
    if (e) {
      e.date = fDate.value;
      e.type = fType.value;
      e.stage = fStage.value;
      e.note = note;
      e.thumb = thumb;
    }
    showToast('Đã cập nhật nhật ký.', 'ok');
  } else {
    const now = new Date();
    entries.push({
      id: nextId++,
      date: fDate.value,
      time: pad(now.getHours()) + ':' + pad(now.getMinutes()),
      type: fType.value,
      stage: fStage.value,
      status: 'done',
      thumb: thumb,
      note: note
    });
    showToast('Đã lưu nhật ký: ' + fType.value + '.', 'ok');
  }

  renderList();
  resetForm();
}

$('#btnSave').addEventListener('click', handleSave);

/* ---------- 10. Xóa ---------- */
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
        closeModal();
        showToast('Đã xóa nhật ký.', 'ok');
      }
    }
  ]);
}

/* ---------- 11. Tìm kiếm & lọc ---------- */
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

/* ---------- 12. Trợ lý AI ---------- */
$('#btnDiagnose').addEventListener('click', () => {
  aiBadge.textContent = 'Đang phân tích…';
  aiBadge.className = 'badge badge--busy';
  $('#btnDiagnose').disabled = true;
  setTimeout(() => {
    aiBadge.textContent = 'Đã sẵn sàng';
    aiBadge.className = 'badge badge--ok';
    $('#btnDiagnose').disabled = false;
    showToast('AI chẩn đoán: ' + aiDiag.textContent + '.', 'ok');
  }, 1400);
});

$('#btnConfirmAi').addEventListener('click', () => {
  const suggest = '[AI] ' + aiDiag.textContent.trim() + ' — ' + aiNote.textContent.replace(/\s+/g, ' ').trim();
  if (fNote.value.indexOf('[AI]') === -1) {
    fNote.value = (fNote.value.trim() ? fNote.value.trim() + '\n' : '') + suggest;
  }
  fNote.classList.remove('invalid');
  noteError.hidden = true;
  showToast('Đã đưa kết quả AI vào ghi chú hiện trường.', 'ok');
});

$('#btnEditAi').addEventListener('click', () => {
  const wrap = document.createElement('div');
  wrap.innerHTML =
    '<div class="field"><label for="aiDiagInput">Vấn đề / Bệnh</label>' +
    '<input id="aiDiagInput" type="text"></div>' +
    '<div class="field"><label for="aiNoteInput">Mô tả &amp; khuyến nghị</label>' +
    '<textarea id="aiNoteInput"></textarea></div>';
  wrap.querySelector('#aiDiagInput').value = aiDiag.textContent.trim();
  wrap.querySelector('#aiNoteInput').value = aiNote.textContent.replace(/\s+/g, ' ').trim();

  function apply() {
    const d = wrap.querySelector('#aiDiagInput').value.trim();
    const n = wrap.querySelector('#aiNoteInput').value.trim();
    if (!d) { showToast('Tên bệnh không được để trống.', 'bad'); return; }
    aiDiag.textContent = d;
    aiNote.textContent = n;
    closeModal();
    showToast('Đã cập nhật kết quả chẩn đoán.', 'ok');
  }

  openModal('Chỉnh sửa kết quả AI', wrap, [
    { label: 'Hủy', onClick: closeModal },
    { label: 'Lưu thay đổi', primary: true, onClick: apply }
  ]);
});

/* ---------- 13. Trợ lý AI AgrBrain (sidebar) ---------- */
$('#btnAssistant').addEventListener('click', () => {
  const wrap = document.createElement('div');
  wrap.className = 'lib';
  const suggestions = [
    'Độ ẩm cao kéo dài — tăng nguy cơ đốm nâu Cercospora, nên phun phòng.',
    'Ghi nhật ký bón thúc đợt 2 cho lô A1 vào cuối tuần này.',
    'Kiểm tra lại mực nước 3-5cm trước khi bón phân để tránh thất thoát.'
  ];
  suggestions.forEach((text) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.innerHTML = '<strong>Gợi ý</strong><span></span>';
    btn.querySelector('span').textContent = text;
    btn.addEventListener('click', () => { closeModal(); showToast('Gợi ý: ' + text, 'ok'); });
    wrap.appendChild(btn);
  });
  openModal('Trợ lý AI AgrBrain', wrap, [{ label: 'Đóng', onClick: closeModal }]);
});

/* ---------- Khởi động ---------- */
renderNotifications();
renderThumbs();
fDate.value = todayISO();
renderList();
