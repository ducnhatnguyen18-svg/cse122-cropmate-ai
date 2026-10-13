/* =========================================================
   SmartAgri — dashboard.js
   Trang: Tổng quan (Season Dashboard)
   ========================================================= */

const AUTH_KEY = 'smartagri_auth';
const USER_KEY = 'smartagri_user';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const notifications = [
  { title: 'Yêu cầu mới #1182', body: 'Nông hộ Trần Văn Bình gửi ảnh hiện trường lô A1.' },
  { title: 'AI-3 đã có kết quả', body: 'Bản tóm tắt nhật ký 14 ngày đã sẵn sàng.' },
  { title: 'Nhắc phản hồi', body: 'Yêu cầu còn 03 giờ nữa quá hạn tư vấn.' }
];

const activities = [
  { icon: 'i-sprout', time: '16/05/2026 07:30', kind: 'Ghi nhật ký', text: 'Bón phân đợt 2 cho lúa', status: 'done' },
  { icon: 'i-leaf', time: '15/05/2026 14:15', kind: 'Ghi nhật ký', text: 'Ghi nhận sâu cuốn lá nhẹ', status: 'done' },
  { icon: 'i-drop', time: '14/05/2026 09:20', kind: 'Ghi nhật ký', text: 'Tưới nước ruộng', status: 'done' },
  { icon: 'i-flask', time: '13/05/2026 16:45', kind: 'Báo cáo sự cố', text: 'Đề nghị hỗ trợ về sâu bệnh', status: 'wait' },
  { icon: 'i-headset', time: '12/05/2026 11:00', kind: 'Hỏi chuyên gia', text: 'Hỏi về cách phòng bệnh đạo ôn', status: 'wait' }
];

const STATUS_LABEL = { done: 'Hoàn thành', wait: 'Đang chờ' };

const $ = (sel) => document.querySelector(sel);

const layout = $('#layout');
const scrim = $('#scrim');

/* ---------- 1. Toggle sidebar ---------- */
function setNav(open) {
  layout.classList.toggle('nav-open', open);
  scrim.hidden = !open;
}

$('#btnMenu').addEventListener('click', () => {
  setNav(!layout.classList.contains('nav-open'));
});
scrim.addEventListener('click', () => setNav(false));

/* ---------- 2. Đăng xuất ---------- */
$('#btnLogout').addEventListener('click', () => {
  sessionStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(USER_KEY);
  location.replace('login.html');
});

/* ---------- 3. Toast ---------- */
const toast = $('#toast');
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

function renderNotifications() {
  notifList.innerHTML = '';

  for (let i = 0; i < notifications.length; i++) {
    const item = notifications[i];
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    const body = document.createElement('span');

    strong.textContent = item.title;
    body.textContent = item.body;
    li.append(strong, body);
    notifList.appendChild(li);
  }

  notifCount.textContent = notifications.length;
  notifCount.hidden = notifications.length === 0;
}

$('#btnBell').addEventListener('click', () => {
  const open = notifPanel.hidden;
  notifPanel.hidden = !open;
  $('#btnBell').setAttribute('aria-expanded', String(open));
});

document.addEventListener('click', (e) => {
  if (!notifPanel.hidden && !e.target.closest('.notif')) {
    notifPanel.hidden = true;
    $('#btnBell').setAttribute('aria-expanded', 'false');
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

  for (let i = 0; i < actions.length; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn ' + (actions[i].primary ? 'btn--primary' : 'btn--muted');
    btn.textContent = actions[i].label;
    btn.addEventListener('click', actions[i].onClick);
    modalFoot.appendChild(btn);
  }

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
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.hidden) closeModal();
});

/* ---------- 6. Hoạt động gần đây ---------- */
const activityList = $('#activityList');

function renderActivities() {
  activityList.innerHTML = '';

  for (let i = 0; i < activities.length; i++) {
    const item = activities[i];
    const li = document.createElement('li');

    const icon = document.createElement('span');
    icon.className = 'activity__icon';
    icon.innerHTML = '<svg class="icon"><use href="#' + item.icon + '"></use></svg>';

    const time = document.createElement('span');
    time.className = 'activity__time';
    time.textContent = item.time;

    const kind = document.createElement('span');
    kind.className = 'activity__kind';
    kind.textContent = item.kind;

    const text = document.createElement('span');
    text.className = 'activity__text';
    text.textContent = item.text;

    const status = document.createElement('span');
    status.className = 'activity__status activity__status--' + item.status;
    status.textContent = STATUS_LABEL[item.status];

    li.append(icon, time, kind, text, status);
    activityList.appendChild(li);
  }
}

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() +
    ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

/* ---------- 7. Ghi nhật ký nhanh ---------- */
const JOB_ICONS = {
  'Bón phân': 'i-flask',
  'Tưới nước': 'i-drop',
  'Phun thuốc': 'i-rain',
  'Kiểm tra sâu bệnh': 'i-leaf'
};

$('#btnQuickLog').addEventListener('click', () => {
  const form = document.createElement('div');
  form.innerHTML =
    '<div class="field"><label for="jobType">Loại công việc</label>' +
    '<select id="jobType">' +
    Object.keys(JOB_ICONS).map((k) => '<option value="' + k + '">' + k + '</option>').join('') +
    '</select></div>' +
    '<div class="field"><label for="jobNote">Nội dung ghi nhật ký</label>' +
    '<textarea id="jobNote" placeholder="Ví dụ: bón 5 kg NPK cho lô A1..."></textarea></div>';

  function submit() {
    const type = form.querySelector('#jobType').value;
    const note = form.querySelector('#jobNote');

    if (note.value.trim().length < 5) {
      note.classList.add('invalid');
      showToast('Hãy mô tả công việc rõ hơn một chút.', 'bad');
      return;
    }

    activities.unshift({
      icon: JOB_ICONS[type],
      time: nowStamp(),
      kind: 'Ghi nhật ký',
      text: type + ' — ' + note.value.trim(),
      status: 'done'
    });
    renderActivities();
    closeModal();
    showToast('Đã ghi nhật ký: ' + type + '.', 'ok');
  }

  openModal('Ghi nhật ký nhanh', form, [
    { label: 'Hủy', onClick: closeModal },
    { label: 'Lưu nhật ký', primary: true, onClick: submit }
  ]);
});

$('#btnViewAll').addEventListener('click', (e) => {
  e.preventDefault();
  location.href = 'journal.html';
});

/* ---------- 8. AI phân loại ảnh lá ---------- */
const aiDrop = $('#aiDrop');
const aiFile = $('#aiFile');
const aiPreview = $('#aiPreview');
const aiError = $('#aiError');

function showAiError(message) {
  aiError.textContent = message;
  aiError.hidden = !message;
}

function acceptAiFile(file) {
  if (!file) return;

  if (ALLOWED_TYPES.indexOf(file.type) === -1) {
    showAiError('Tệp "' + file.name + '" không được hỗ trợ. Chỉ nhận PNG, JPG, WEBP.');
    return;
  }
  if (file.size > MAX_FILE_SIZE) {
    showAiError('Tệp "' + file.name + '" vượt quá 5MB.');
    return;
  }

  showAiError('');
  aiPreview.hidden = false;
  aiPreview.innerHTML = '<svg class="icon"><use href="#i-check"></use></svg>';
  aiPreview.appendChild(document.createTextNode('Đã nhận ảnh "' + file.name + '" — AI đang phân loại sơ bộ.'));
  showToast('Đã gửi ảnh cho trợ lý phân loại.', 'ok');
}

aiDrop.addEventListener('click', () => aiFile.click());
aiDrop.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    aiFile.click();
  }
});
aiFile.addEventListener('change', () => {
  acceptAiFile(aiFile.files[0]);
  aiFile.value = '';
});

['dragenter', 'dragover'].forEach((type) => {
  aiDrop.addEventListener(type, (e) => {
    e.preventDefault();
    aiDrop.classList.add('is-over');
  });
});
['dragleave', 'drop'].forEach((type) => {
  aiDrop.addEventListener(type, (e) => {
    e.preventDefault();
    aiDrop.classList.remove('is-over');
  });
});
aiDrop.addEventListener('drop', (e) => acceptAiFile(e.dataTransfer.files[0]));

/* ---------- 9. Trợ lý AI AgrBrain ---------- */
$('#btnAssistant').addEventListener('click', () => {
  const wrap = document.createElement('div');
  wrap.className = 'lib';

  const suggestions = [
    'Độ ẩm đất đang cao, hạn chế tưới thêm trong 2 ngày tới.',
    'Theo dõi sâu cuốn lá ở mép ruộng phía đông lô A1.',
    'Chuẩn bị lịch bón đón đòng cho ngày 20/05.'
  ];

  suggestions.forEach((text) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.innerHTML = '<strong>Gợi ý</strong><span></span>';
    btn.querySelector('span').textContent = text;
    btn.addEventListener('click', () => {
      closeModal();
      showToast('Gợi ý: ' + text, 'ok');
    });
    wrap.appendChild(btn);
  });

  openModal('Trợ lý AI AgrBrain', wrap, [{ label: 'Đóng', onClick: closeModal }]);
});

/* ---------- Khởi động ---------- */
renderNotifications();
renderActivities();
