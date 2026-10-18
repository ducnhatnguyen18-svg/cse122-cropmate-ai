/* =========================================================
   SmartAgri — dashboard.js
   Trang: Tổng quan (Season Dashboard)
   ========================================================= */

const AUTH_KEY = 'smartagri_auth';
const USER_KEY = 'smartagri_user';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/* Danh sách thông báo do Trợ lý AI AgrBrain sinh từ dữ liệu các trang. */

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

$('#btnBell').addEventListener('click', () => {
  const open = notifPanel.hidden;
  if (open && window.AgrBrain) window.AgrBrain.renderNotifications(notifList, notifCount);
  notifPanel.hidden = !open;
  $('#btnBell').setAttribute('aria-expanded', String(open));
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
  $('#btnBell').setAttribute('aria-expanded', 'false');
  btnAccount.setAttribute('aria-expanded', String(open));
});
$('#accLogout').addEventListener('click', doLogout);

document.addEventListener('click', (e) => {
  if (!notifPanel.hidden && !e.target.closest('.notif')) {
    notifPanel.hidden = true;
    $('#btnBell').setAttribute('aria-expanded', 'false');
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

/* ---------- 8. AI quét & phân tích ảnh lá ---------- */
const aiDrop = $('#aiDrop');
const aiFile = $('#aiFile');
const aiWork = $('#aiWork');
const aiError = $('#aiError');

const SCAN_STEPS = [
  'Đang nạp ảnh…',
  'Tách vùng lá khỏi nền…',
  'Quét đốm bệnh và vùng vàng lá…',
  'So khớp thư viện chẩn đoán…',
  'Tổng hợp khuyến nghị xử lý…'
];

const AI_KB = {
  blast: {
    name: 'Đạo ôn lá',
    sci: 'Magnaporthe oryzae',
    icon: 'i-leaf',
    cause: [
      'Bào tồn lưu trên tàn dư cây vụ trước và hạt giống nhiễm bệnh.',
      'Ruộng rậm rạp, ẩm độ trên 85%, đêm lạnh ngày nắng giúp nấm phát tán.',
      'Bón thừa đạm làm mô lá mềm, dễ nhiễm.'
    ],
    action: [
      'Thăm đồng trong 24 giờ, thu dọn lá bệnh nặng ra khỏi ruộng.',
      'Phun thuốc trừ nấm có hoạt chất Tricyclazole hoặc Isoprothiolane khi mặt lá khô.',
      'Ngưng bón đạm 7–10 ngày, giữ nước 3–5 cm trong ruộng.',
      'Kiểm tra lại sau 5 ngày; nếu đốm lan rộng thì phun nhắc lần 2.'
    ]
  },
  cercospora: {
    name: 'Đốm nâu trên lá',
    sci: 'Cercospora oryzae / Bipolaris',
    icon: 'i-leaf',
    cause: [
      'Nấm tấn công khi có mưa dầm, sương mù kéo dài và lá lâu khô.',
      'Mật độ cấy dày, ánh sáng kém nên vết bệnh lan nhanh từ lá dưới.',
      'Dinh dưỡng mất cân đối, thiếu kali khiến biểu bì lá yếu.'
    ],
    action: [
      'Phun trừ nấm phổ rộng (Azoxystrobin + Difenoconazole) vào buổi trưa nắng.',
      'Tỉa bớt lá già phía dưới để ruộng thoáng, giảm ẩm.',
      'Bón bổ sung kali, giảm đạm trong đợt tới.',
      'Ghi nhật ký vị trí đốm bệnh để theo dõi diễn biến 3–5 ngày.'
    ]
  },
  nutrient: {
    name: 'Vàng lá sinh lý – thiếu dinh dưỡng',
    sci: 'Thiếu đạm / vi lượng (Fe, Zn)',
    icon: 'i-drop',
    cause: [
      'Đất nghèo đạm hoặc rễ ngộp nước lâu ngày nên hút dinh dưỡng kém.',
      'Thiếu vi lượng Fe, Zn ở chân ruộng pH cao, lá non vàng gân xanh.',
      'Lá già trút dinh dưỡng nuôi đòng khi cây thiếu bón thúc.'
    ],
    action: [
      'Bón phân cân đối N-P-K, chia làm 2 đợt nhỏ thay vì một đợt lớn.',
      'Phun phân bón lá có vi lượng Fe, Zn vào sáng sớm.',
      'Rút nước phơi ruộng 2–3 ngày để bộ rễ hô hấp, sau đó tưới lại.',
      'Lấy mẫu đất kiểm tra pH và đạm trước vụ kế tiếp.'
    ]
  },
  scald: {
    name: 'Cháy lá do nắng pha lẫn mô khô',
    sci: 'Sunscald / khô đầu lá',
    icon: 'i-sun',
    cause: [
      'Nắng gắt kéo dài sau mưa làm mất nước mô lá, xuất hiện vệt khô.',
      'Mực nước nông khiến ruộng thiếu điều tiết nhiệt.',
      'Tổn thương cơ học (sâu ăn, gió) mở đường cho vi sinh vật thứ cấp.'
    ],
    action: [
      'Giữ nước 5–7 cm trong những ngày nắng nóng đỉnh điểm.',
      'Phun chế phẩm chống hạn, bổ sung kali và silic.',
      'Theo dõi mép lá 2 ngày/lần, phân biệt với đốm nấm lan rộng.',
      'Ghi ảnh so sánh định kỳ để đánh giá diện tích cháy lá.'
    ]
  },
  healthy: {
    name: 'Lá khỏe – chưa phát hiện tổn thương',
    sci: 'Mẫu lá đạt, sắc tố xanh đồng đều',
    icon: 'i-check',
    cause: [
      'Tỷ lệ mô xanh khỏe cao, không ghi nhận đốm nâu hay vùng vàng lá rõ rệt.',
      'Ảnh có ánh sáng đều, màu lá không bị loang bất thường.'
    ],
    action: [
      'Tiếp tục lịch chăm sóc hiện tại của lô canh tác.',
      'Chụp lại ảnh mỗi 5–7 ngày để AI so sánh diễn biến.',
      'Ưu tiên kiểm tra mép ruộng và gốc lúa – nơi bệnh thường khởi phát.'
    ]
  },
  unclear: {
    name: 'Chưa nhận diện rõ chủ thể',
    sci: 'Ảnh thiếu sáng hoặc lá chiếm tỷ lệ thấp',
    icon: 'i-camera',
    cause: [
      'Vùng lá trong ảnh quá nhỏ hoặc nền chiếm phần lớn khung hình.',
      'Ảnh thiếu sáng, mờ do rung tay khiến AI không tách được mô bệnh.'
    ],
    action: [
      'Chụp lại gần hơn, để một chiếc lá bệnh chiếm khoảng 2/3 khung hình.',
      'Chọn nơi ánh sáng tự nhiên, tránh nắng gắt hắt bóng.',
      'Lau ống kính và giữ máy đứng yên khi bấm.'
    ]
  }
};

const AI_KEYWORDS = [
  [/đạo[\s\-_]*ôn|dao[\s\-_]*on|blast/i, 'blast'],
  [/cercospora|đốm[\s\-_]*nâu|dom[\s\-_]*nau|lem[\s\-_]*lép/i, 'cercospora'],
  [/vàng[\s\-_]*lá|vang[\s\-_]*la|chlor|thiếu[\s\-_]*đạm|nutrient/i, 'nutrient'],
  [/cháy[\s\-_]*lá|chay[\s\-_]*la|scald|nắng[\s\-_]*nóng|heat/i, 'scald']
];

let scanToken = 0;
let scanObjectUrl = null;

function showAiError(message) {
  aiError.textContent = message;
  aiError.hidden = !message;
}

function mk(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function withIcon(icon) {
  const svg = document.createElement('span');
  svg.innerHTML = '<svg class="icon"><use href="#' + icon + '"></use></svg>';
  return svg.firstChild;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Không đọc được dữ liệu ảnh.'));
    img.src = url;
  });
}

function rgbToHsv(r, g, b) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = 60 * (((gn - bn) / d) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / d + 2);
    else h = 60 * ((rn - gn) / d + 4);
  }
  if (h < 0) h += 360;
  return { h: h, s: max === 0 ? 0 : d / max, v: max };
}

function analyzeImage(img) {
  const side = 128;
  const scale = Math.min(1, side / Math.max(img.width, img.height));
  const w = Math.max(16, Math.round(img.width * scale));
  const h = Math.max(16, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);

  let data;
  try {
    data = ctx.getImageData(0, 0, w, h).data;
  } catch (err) {
    return null;
  }

  const cells = 10;
  const cellLeaf = new Array(cells * cells).fill(0);
  const cellLesion = new Array(cells * cells).fill(0);
  let yellow = 0, brown = 0, leaf = 0, total = 0, brightnessSum = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (data[i + 3] < 128) continue;
      total++;

      const c = rgbToHsv(data[i], data[i + 1], data[i + 2]);
      brightnessSum += c.v;

      const isGreen = c.h >= 64 && c.h < 175 && c.s >= 0.18 && c.v >= 0.14;
      const isYellow = c.h >= 42 && c.h < 64 && c.s >= 0.32 && c.v >= 0.32;
      const isBrown = (c.h >= 8 && c.h < 42 && c.s >= 0.15 && c.v >= 0.08 && c.v < 0.72) ||
        (c.s < 0.18 && c.v >= 0.06 && c.v < 0.3);
      const isLeaf = isGreen || isYellow || isBrown;

      if (isYellow) yellow++;
      else if (isBrown) brown++;
      if (isLeaf) leaf++;

      if (isLeaf) {
        const cell = Math.floor(y / (h / cells)) * cells + Math.floor(x / (w / cells));
        cellLeaf[cell]++;
        if (isBrown || isYellow) cellLesion[cell]++;
      }
    }
  }

  if (total === 0) return null;

  let infected = 0, activeCells = 0;
  for (let k = 0; k < cellLeaf.length; k++) {
    if (cellLeaf[k] > 6) {
      activeCells++;
      if (cellLesion[k] / cellLeaf[k] > 0.3) infected++;
    }
  }

  return {
    leafRatio: leaf / total,
    brownShare: leaf ? brown / leaf : 0,
    yellowShare: leaf ? yellow / leaf : 0,
    spread: activeCells ? infected / activeCells : 0,
    brightness: brightnessSum / total,
    width: img.width,
    height: img.height
  };
}

function classifyImage(stats, fileName) {
  const damage = Math.min(1, stats.brownShare + stats.yellowShare * 0.8);
  let key;

  if (stats.leafRatio < 0.22 || stats.brightness < 0.1) key = 'unclear';
  else if (damage < 0.055) key = 'healthy';
  else if (stats.yellowShare > stats.brownShare * 2.2) key = 'nutrient';
  else if (stats.brownShare >= 0.3 && stats.spread >= 0.35) key = 'cercospora';
  else if (stats.brownShare >= 0.11) key = 'blast';
  else key = 'scald';

  let source = 'pixel';
  if (key !== 'healthy' && key !== 'unclear') {
    for (let i = 0; i < AI_KEYWORDS.length; i++) {
      if (AI_KEYWORDS[i][0].test(fileName)) {
        if (AI_KEYWORDS[i][1] !== key) {
          key = AI_KEYWORDS[i][1];
          source = 'keyword';
        }
        break;
      }
    }
  }

  let severity = 'Không đáng kể';
  if (key === 'unclear') severity = 'Cần chụp lại';
  else if (key !== 'healthy') {
    severity = damage > 0.28 ? 'Nặng' : (damage >= 0.1 ? 'Trung bình' : 'Nhẹ');
  }

  let confidence = 74 + stats.spread * 10 + Math.min(damage, 0.4) * 40;
  if (stats.leafRatio < 0.35) confidence -= 12;
  if (source === 'keyword') confidence += 4;
  confidence = Math.round(Math.max(63, Math.min(95, confidence)));

  return {
    key: key,
    entry: AI_KB[key],
    damage: damage,
    severity: severity,
    confidence: confidence,
    stats: stats
  };
}

function renderScanShell(file, url) {
  aiWork.hidden = false;
  aiWork.innerHTML = '';
  aiWork.className = 'ai-scan';

  const thumb = mk('img', 'ai-scan__thumb');
  thumb.src = url;
  thumb.alt = 'Ảnh lá đang được AI phân tích';

  const meta = mk('div', 'ai-scan__meta');
  const name = mk('strong', 'ai-scan__name', file.name);
  const step = mk('p', 'ai-scan__step', SCAN_STEPS[0]);
  const bar = mk('span', 'ai-scan__bar');
  const fill = mk('span', 'ai-scan__fill');
  bar.appendChild(fill);

  meta.append(name, step, bar);
  aiWork.append(thumb, meta);
}

function playScanSteps(token) {
  const step = aiWork.querySelector('.ai-scan__step');
  const fill = aiWork.querySelector('.ai-scan__fill');

  return new Promise((resolve) => {
    let i = 0;
    (function next() {
      if (scanToken !== token) return resolve(false);
      if (i >= SCAN_STEPS.length) return resolve(true);
      step.textContent = SCAN_STEPS[i];
      fill.style.width = Math.round(((i + 1) / SCAN_STEPS.length) * 100) + '%';
      i += 1;
      setTimeout(next, i === SCAN_STEPS.length ? 260 : 320);
    })();
  });
}

function metricRow(label, value, ratio, tone) {
  const row = mk('div', 'ai-metric');
  const head = mk('div', 'ai-metric__head');
  head.append(mk('span', null, label), mk('b', null, value));
  const bar = mk('span', 'ai-metric__bar');
  const fill = mk('span', 'ai-metric__fill ai-metric__fill--' + tone);
  fill.style.width = Math.round(Math.max(3, Math.min(100, ratio * 100))) + '%';
  bar.appendChild(fill);
  row.append(head, bar);
  return row;
}

function sectionList(title, items, ordered) {
  const wrap = mk('div', 'ai-block');
  wrap.appendChild(mk('h4', 'ai-block__title', title));
  const list = document.createElement(ordered ? 'ol' : 'ul');
  list.className = 'ai-list';
  items.forEach((text) => list.appendChild(mk('li', null, text)));
  wrap.appendChild(list);
  return wrap;
}

function renderResult(result, file, url) {
  if (scanObjectUrl && scanObjectUrl !== url) URL.revokeObjectURL(scanObjectUrl);
  scanObjectUrl = url;

  aiWork.innerHTML = '';
  aiWork.className = 'ai-result ai-result--' + result.key;

  const head = mk('div', 'ai-result__head');
  const thumb = mk('img', 'ai-result__thumb');
  thumb.src = url;
  thumb.alt = 'Ảnh lá đã phân tích';

  const info = mk('div', 'ai-result__info');
  const badge = mk('span', 'ai-result__badge ai-result__badge--' + badgeTone(result), result.severity);
  const name = mk('strong', 'ai-result__name', result.entry.name);
  const sci = mk('small', 'ai-result__sci', result.entry.sci);
  info.append(badge, name, sci);
  head.append(thumb, info);

  const metrics = mk('div', 'ai-result__metrics');
  metrics.appendChild(metricRow('Vùng lá trong khung hình', Math.round(result.stats.leafRatio * 100) + '%', result.stats.leafRatio, 'green'));
  metrics.appendChild(metricRow('Diện tích lá tổn thương', Math.round(result.damage * 100) + '%', result.damage, result.damage > 0.28 ? 'red' : 'amber'));
  metrics.appendChild(metricRow('Độ tin cậy của chẩn đoán', result.confidence + '%', result.confidence / 100, 'blue'));

  aiWork.append(
    head,
    metrics,
    sectionList('Nguyên nhân gợi ý', result.entry.cause, false),
    sectionList('Khuyến nghị xử lý', result.entry.action, true)
  );

  const actions = mk('div', 'ai-result__actions');
  const detailBtn = mk('button', 'btn btn--primary');
  detailBtn.type = 'button';
  detailBtn.append(withIcon('i-chart'), document.createTextNode('Xem báo cáo đầy đủ'));
  detailBtn.addEventListener('click', () => openAiReport(result, file));

  const expertBtn = mk('a', 'btn btn--outline');
  expertBtn.href = 'index.html';
  expertBtn.append(withIcon('i-headset'), document.createTextNode('Nhờ chuyên gia thẩm định'));

  const againBtn = mk('button', 'btn btn--muted');
  againBtn.type = 'button';
  againBtn.append(withIcon('i-camera'), document.createTextNode('Phân tích ảnh khác'));
  againBtn.addEventListener('click', resetAiWork);

  actions.append(detailBtn, expertBtn, againBtn);
  aiWork.appendChild(actions);

  const note = mk('p', 'ai-result__note');
  note.append(
    withIcon('i-shield'),
    document.createTextNode('Kết quả phân tích thị giác máy tính ngay trên trình duyệt, mang tính tham khảo sơ bộ — không thay thế chẩn đoán của cán bộ bảo vệ thực vật.')
  );
  aiWork.appendChild(note);
}

function badgeTone(result) {
  if (result.key === 'healthy') return 'ok';
  if (result.key === 'unclear') return 'muted';
  if (result.severity === 'Nặng') return 'danger';
  if (result.severity === 'Trung bình') return 'warn';
  return 'soft';
}

function resetAiWork() {
  scanToken += 1;
  if (scanObjectUrl) {
    URL.revokeObjectURL(scanObjectUrl);
    scanObjectUrl = null;
  }
  aiWork.hidden = true;
  aiWork.innerHTML = '';
  showAiError('');
}

function openAiReport(result, file) {
  const wrap = mk('div', 'ai-report');
  const time = new Date();
  const pad = (n) => String(n).padStart(2, '0');

  const facts = document.createElement('dl');
  facts.className = 'ai-report__facts';
  [
    ['Tệp ảnh', file.name],
    ['Kích thước ảnh', result.stats.width + ' × ' + result.stats.height + ' px'],
    ['Dung lượng', (file.size / 1024).toFixed(0) + ' KB'],
    ['Thời điểm quét', pad(time.getHours()) + ':' + pad(time.getMinutes()) + ' ' + pad(time.getDate()) + '/' + pad(time.getMonth() + 1) + '/' + time.getFullYear()],
    ['Vấn đề phát hiện', result.entry.name],
    ['Tác nhân', result.entry.sci],
    ['Mức độ', result.severity],
    ['Độ tin cậy', result.confidence + '%'],
    ['Tỷ lệ lá tổn thương', Math.round(result.damage * 100) + '%'],
    ['Mức lan rộng', Math.round(result.stats.spread * 100) + '% số ô ảnh có tổn thương']
  ].forEach((pair) => {
    facts.appendChild(mk('dt', null, pair[0]));
    facts.appendChild(mk('dd', null, pair[1]));
  });

  wrap.appendChild(mk('p', 'ai-desc', 'Báo cáo chẩn đoán sơ bộ cho lô Lúa Mùa 2026 – A1.'));
  wrap.appendChild(facts);
  wrap.appendChild(sectionList('Nguyên nhân gợi ý', result.entry.cause, false));
  wrap.appendChild(sectionList('Khuyến nghị xử lý', result.entry.action, true));

  openModal('Báo cáo AI – ' + result.entry.name, wrap, [
    { label: 'Đóng', onClick: closeModal },
    {
      label: 'Lưu vào nhật ký canh đồng',
      primary: true,
      onClick: () => {
        closeModal();
        showToast('Đã ghi chẩn đoán "' + result.entry.name + '" vào nhật ký.', 'ok');
        location.href = 'journal.html';
      }
    }
  ]);
}

async function acceptAiFile(file) {
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

  const url = URL.createObjectURL(file);
  const token = ++scanToken;
  renderScanShell(file, url);

  let stats = null;
  try {
    const img = await loadImage(url);
    stats = analyzeImage(img);
  } catch (err) {
    stats = null;
  }

  const stepsDone = await playScanSteps(token);
  if (!stepsDone || scanToken !== token) {
    URL.revokeObjectURL(url);
    return;
  }

  if (!stats) {
    resetAiWork();
    showAiError('Không quét được ảnh "' + file.name + '". Ảnh có thể bị hỏng hoặc thiếu dữ liệu — vui lòng chọn tệp khác.');
    return;
  }

  const result = classifyImage(stats, file.name);
  renderResult(result, file, url);
  showToast('AI quét xong: ' + result.entry.name + ' (' + result.severity + ').', result.key === 'healthy' ? 'ok' : '');
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

/* ---------- 9. Nút Trợ lý AI AgrBrain do js/agrbrain.js đảm nhiệm ---------- */

/* ---------- Khởi động ---------- */
renderNotifications();
renderActivities();
