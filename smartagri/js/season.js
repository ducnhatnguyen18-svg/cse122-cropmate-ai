/* =========================================================
   SmartAgri — Mùa vụ
   1) Chuyển đổi giữa các mùa vụ (tab)
   2) Tính tiến độ + suy ra giai đoạn sinh trưởng theo ngày tuổi
   3) Kế hoạch canh tác: thêm / đánh dấu xong / xoá / tìm kiếm / lọc
   4) Bảng lô ruộng + ghi chú kỹ thuật
   5) Modal thêm mùa vụ mới (validate) — tất cả lưu localStorage
   ========================================================= */

const STORE_KEY = 'smartagri.seasons.v1';

/* Tỉ lệ % tổng số ngày của từng giai đoạn (dùng để tự chia lịch sinh trưởng) */
const PHASES = [
  { name: 'Gieo sạ – mạ', ratio: 0.15, note: 'Giữ ẩm mặt luống, theo dõi mầm bệnh cổ rễ.' },
  { name: 'Đẻ nhánh', ratio: 0.45, note: 'Bón thúc đợt 1, giữ nước 3–5 cm.' },
  { name: 'Làm đòng', ratio: 0.7, note: 'Bón thúc đợt 2, phun ngừa đạo ôn cổ lá.' },
  { name: 'Trổ bông', ratio: 0.85, note: 'Theo dõi sâu cuốn lá, giữ nước đều.' },
  { name: 'Chín – thu hoạch', ratio: 1, note: 'Rút nước trước thu hoạch 7–10 ngày.' }
];

const seedSeasons = [
  {
    id: 'lua-mua-2026',
    name: 'Vụ Lúa Mùa 2026',
    plot: 'Lô A1',
    variety: 'OM 18',
    area: 1.2,
    start: '2026-05-05',
    total: 90,
    day: 35,
    status: 'Đang thực hiện',
    yield: 7.2,
    cost: 8.4,
    plots: [
      { name: 'A1', area: 0.7, stage: 'Đẻ nhánh', state: 'Tốt', cls: 'badge-green' },
      { name: 'A2', area: 0.3, stage: 'Đẻ nhánh', state: 'Vàng lá nhẹ', cls: 'badge-amber' },
      { name: 'B1', area: 0.2, stage: 'Gieo sạ – mạ', state: 'Đang theo dõi', cls: 'badge-blue' }
    ],
    notes: [
      'Ruộng A2 nhiễm phèn cục bộ, đã bón 18 kg vôi/sào.',
      'Kênh mương nội đồng đoạn B1 bồi lắng, cần nạo vét trước mùa mưa.',
      'Ghi nhớ kiểm tra mật độ rầy vào sáng sớm 2 lần/tuần.'
    ],
    plans: [
      { id: 'p1', name: 'Bón phân đợt 2 (NPK 20-20-15)', date: '2026-06-02', group: 'Dinh dưỡng', done: true },
      { id: 'p2', name: 'Phun thuốc trừ sâu cuốn lá', date: '2026-06-09', group: 'Bảo vệ', done: true },
      { id: 'p3', name: 'Rút nước phơi ruộng 3 ngày', date: '2026-06-18', group: 'Nước', done: false },
      { id: 'p4', name: 'Bón thúc đợt 3 trước trổ 15 ngày', date: '2026-06-25', group: 'Dinh dưỡng', done: false },
      { id: 'p5', name: 'Kiểm tra đồng ruộng cuối kỳ đẻ nhánh', date: '2026-06-12', group: 'Khác', done: false }
    ]
  },
  {
    id: 'lua-dx-2025',
    name: 'Vụ Lúa Đông Xuân 2025–2026',
    plot: 'Lô A1',
    variety: 'OM 5451',
    area: 1.2,
    start: '2025-11-05',
    total: 105,
    day: 105,
    status: 'Đã thu hoạch',
    yield: 8.1,
    cost: 9.2,
    plots: [
      { name: 'A1', area: 1.2, stage: 'Đã thu hoạch', state: 'Kết thúc', cls: 'badge-grey' }
    ],
    notes: [
      'Năng suất thực thu 6,8 tấn/ha, cao hơn vụ trước 0,4 tấn.',
      'Bán cho đại lý tại xã, giá 6.400 đ/kg lúa tươi.'
    ],
    plans: [
      { id: 'p1', name: 'Vệ sinh đồng ruộng sau thu hoạch', date: '2026-02-20', group: 'Khác', done: true },
      { id: 'p2', name: 'Đốt và vùi rơm rạ', date: '2026-02-24', group: 'Khác', done: true }
    ]
  },
  {
    id: 'ngo-2026',
    name: 'Vụ Ngô Hè Thu 2026',
    plot: 'Lô C3',
    variety: 'NK 7327',
    area: 0.5,
    start: '2026-04-10',
    total: 110,
    day: 0,
    status: 'Kế hoạch',
    yield: 4.5,
    cost: 0,
    plots: [
      { name: 'C3', area: 0.5, stage: 'Chưa gieo', state: 'Chuẩn bị đất', cls: 'badge-blue' }
    ],
    notes: [
      'Dự kiến gieo sau khi thu hoạch lúa vụ Đông Xuân 10 ngày.',
      'Cần mua thêm giống và phân bón lót.'
    ],
    plans: [
      { id: 'p1', name: 'Cày phơi ải ải đất lô C3', date: '2026-03-28', group: 'Giống', done: false },
      { id: 'p2', name: 'Bón lót phân hữu cơ', date: '2026-04-05', group: 'Dinh dưỡng', done: false }
    ]
  }
];

let seasons = loadSeasons();
let activeId = seasons[0].id;
let toastTimer = null;

/* ---------- Lấy thẻ HTML ---------- */
function $(id) {
  return document.getElementById(id);
}

const tabsBox = $('seasonTabs');
const planList = $('planList');
const planSearch = $('planSearch');
const planFilter = $('planFilter');
const planState = $('planState');

/* ---------- 1. Lưu / nạp localStorage ---------- */
function loadSeasons() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const data = raw ? JSON.parse(raw) : null;
    if (Array.isArray(data) && data.length > 0) return data;
  } catch (error) {
    /* Dữ liệu hỏng -> dùng dữ liệu mẫu, không làm trang trắng */
  }
  return JSON.parse(JSON.stringify(seedSeasons));
}

function saveSeasons() {
  localStorage.setItem(STORE_KEY, JSON.stringify(seasons));
}

function current() {
  return seasons.find(function (item) {
    return item.id === activeId;
  });
}

/* ---------- 2. Tiện vụ ngày/tháng ---------- */
function pad(n) {
  return n < 10 ? '0' + n : String(n);
}

function formatDate(iso) {
  if (!iso) return '—';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return parts[2] + '/' + parts[1] + '/' + parts[0];
}

function addDays(iso, days) {
  const date = new Date(iso + 'T00:00:00');
  date.setDate(date.getDate() + days);
  return pad(date.getDate()) + '/' + pad(date.getMonth() + 1) + '/' + date.getFullYear();
}

function progressOf(season) {
  if (!season.total) return 0;
  return Math.round((season.day / season.total) * 100);
}

/* Chia lịch sinh trưởng theo tỉ lệ PHASES + ngày tuổi hiện tại */
function stageRows(season) {
  return PHASES.map(function (phase, index) {
    const from = index === 0 ? 1 : Math.round(season.total * PHASES[index - 1].ratio) + 1;
    const to = Math.round(season.total * phase.ratio);
    let state = 'upcoming';
    if (season.day > to) state = 'done';
    else if (season.day >= from) state = 'active';
    return { name: phase.name, note: phase.note, from: from, to: to, state: state };
  });
}

function currentStageName(season) {
  const rows = stageRows(season);
  const active = rows.find(function (row) {
    return row.state === 'active';
  });
  if (active) return active.name;
  return season.day <= 0 ? 'Chưa gieo' : 'Đã kết thúc';
}

/* ---------- 3. Tab chọn mùa vụ ---------- */
function renderTabs() {
  tabsBox.innerHTML = '';

  seasons.forEach(function (season) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'season-tab' + (season.id === activeId ? ' is-active' : '');
    btn.setAttribute('aria-pressed', String(season.id === activeId));

    const name = document.createElement('p');
    name.className = 'st-name';
    name.textContent = season.name;

    const meta = document.createElement('p');
    meta.className = 'st-meta';
    meta.textContent = season.plot + ' · ' + season.area + ' ha · ' + progressOf(season) + '%';

    const bar = document.createElement('span');
    bar.className = 'st-bar';
    const fill = document.createElement('span');
    fill.style.width = progressOf(season) + '%';
    bar.appendChild(fill);

    btn.append(name, meta, bar);
    btn.addEventListener('click', function () {
      if (season.id === activeId) return;
      activeId = season.id;
      renderAll();
    });
    tabsBox.appendChild(btn);
  });
}

/* ---------- 4. Thẻ chi tiết ---------- */
function renderDetail() {
  const season = current();
  const percent = progressOf(season);

  $('detail-title').textContent = season.name + ' — ' + season.plot;
  $('detailSub').textContent = 'Giống ' + season.variety + ' · ' + season.area + ' ha · xuống giống ' + formatDate(season.start);

  const badge = $('detailStatus');
  badge.textContent = season.status;
  badge.className = 'badge ' + (season.status === 'Đang thực hiện' ? 'badge-green' : season.status === 'Đã thu hoạch' ? 'badge-grey' : 'badge-blue');

  const fill = $('progressFill');
  fill.style.width = '0%';
  requestAnimationFrame(function () {
    fill.style.width = percent + '%';
  });
  $('progressValue').textContent = percent;
  $('progressTrack').setAttribute('aria-valuenow', String(percent));

  $('factDay').textContent = season.day;
  $('factTotal').textContent = season.total;
  $('factStage').textContent = currentStageName(season);
  $('factLeft').textContent = Math.max(0, season.total - season.day) + ' ngày';
  $('factHarvest').textContent = addDays(season.start, season.total);

  $('gaugeArea').textContent = season.area + ' ha';
  $('gaugeYield').textContent = season.yield + ' tấn';
  $('gaugeCost').textContent = season.cost + ' tr';
  renderPlanCount();
}

/* ---------- 5. Giai đoạn sinh trưởng ---------- */
function renderStages() {
  const list = $('stageList');
  list.innerHTML = '';

  stageRows(current()).forEach(function (row, index) {
    const li = document.createElement('li');
    li.className = 'stage ' + row.state;

    const indexEl = document.createElement('span');
    indexEl.className = 'stage-index';
    indexEl.textContent = row.state === 'done' ? '✓' : String(index + 1);

    const title = document.createElement('h3');
    title.textContent = row.name;

    const range = document.createElement('p');
    range.className = 'stage-range';
    range.textContent = 'Ngày ' + row.from + '–' + row.to;

    const note = document.createElement('p');
    note.className = 'stage-note';
    note.textContent = row.note;

    li.append(indexEl, title, range, note);
    list.appendChild(li);
  });
}

/* ---------- 6. Kế hoạch canh tác ---------- */
function visiblePlans() {
  const text = planSearch.value.trim().toLowerCase();
  const group = planFilter.value;
  const state = planState.value;

  return current().plans.filter(function (plan) {
    if (text !== '' && plan.name.toLowerCase().indexOf(text) === -1) return false;
    if (group !== 'all' && plan.group !== group) return false;
    if (state === 'done' && !plan.done) return false;
    if (state === 'todo' && plan.done) return false;
    return true;
  });
}

function renderPlans() {
  planList.innerHTML = '';
  const rows = visiblePlans();

  rows.forEach(function (plan) {
    const li = document.createElement('li');
    li.className = 'plan-item' + (plan.done ? ' is-done' : '');

    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = plan.done;
    check.setAttribute('aria-label', 'Đánh dấu "' + plan.name + '" đã hoàn thành');
    check.addEventListener('change', function () {
      plan.done = check.checked;
      saveSeasons();
      renderPlans();
      renderPlanCount();
      if (plan.done) showToast('Đã đánh dấu hoàn thành: ' + plan.name);
    });

    const body = document.createElement('div');
    body.className = 'plan-body';

    const name = document.createElement('p');
    name.className = 'plan-name';
    name.textContent = plan.name;

    const meta = document.createElement('p');
    meta.className = 'plan-meta';
    meta.textContent = '📆 ' + formatDate(plan.date) + ' · ' + groupLabel(plan.group);

    body.append(name, meta);

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'plan-del';
    del.setAttribute('aria-label', 'Xoá công việc ' + plan.name);
    del.textContent = '✕';
    del.addEventListener('click', function () {
      const season = current();
      season.plans = season.plans.filter(function (item) {
        return item.id !== plan.id;
      });
      saveSeasons();
      renderPlans();
      renderPlanCount();
      showToast('Đã xoá "' + plan.name + '".');
    });

    li.append(check, body, del);
    planList.appendChild(li);
  });

  $('planEmpty').hidden = rows.length > 0;
}

function groupLabel(group) {
  const map = {
    'Giống': 'Giống & gieo sạ',
    'Dinh dưỡng': 'Dinh dưỡng',
    'Bảo vệ': 'Bảo vệ thực vật',
    'Nước': 'Tưới tiêu',
    'Khác': 'Khác'
  };
  return map[group] || group;
}

function renderPlanCount() {
  const plans = current().plans;
  const done = plans.filter(function (plan) {
    return plan.done;
  }).length;
  $('planCount').textContent = plans.length;
  $('gaugeDone').textContent = done + ' / ' + plans.length;
}

/* ---------- 7. Lô ruộng + ghi chú ---------- */
function renderPlots() {
  const body = $('plotBody');
  body.innerHTML = '';

  current().plots.forEach(function (plot) {
    const tr = document.createElement('tr');

    const tdName = document.createElement('td');
    tdName.innerHTML = '<strong></strong>';
    tdName.querySelector('strong').textContent = plot.name;

    const tdArea = document.createElement('td');
    tdArea.textContent = plot.area + ' ha';

    const tdStage = document.createElement('td');
    tdStage.textContent = plot.stage;

    const tdState = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = 'badge ' + plot.cls;
    badge.textContent = plot.state;
    tdState.appendChild(badge);

    tr.append(tdName, tdArea, tdStage, tdState);
    body.appendChild(tr);
  });

  const notes = $('noteList');
  notes.innerHTML = '';
  current().notes.forEach(function (text) {
    const li = document.createElement('li');
    li.textContent = text;
    notes.appendChild(li);
  });
}

/* ---------- 8. Form thêm kế hoạch ---------- */
const planForm = $('planForm');
const planName = $('planName');

$('togglePlanForm').addEventListener('click', function () {
  const open = planForm.hidden;
  planForm.hidden = !open;
  this.setAttribute('aria-expanded', String(open));
  this.textContent = open ? '－ Đóng form' : '＋ Thêm việc';
  if (open) planName.focus();
});

$('cancelPlanBtn').addEventListener('click', function () {
  planForm.hidden = true;
  $('togglePlanForm').setAttribute('aria-expanded', 'false');
  $('togglePlanForm').textContent = '＋ Thêm việc';
});

planForm.addEventListener('submit', function (event) {
  event.preventDefault();

  const name = planName.value.trim();
  if (name.length < 3) {
    showError(planName, 'planNameError', 'Tên công việc cần tối thiểu 3 ký tự.');
    return;
  }
  clearError(planName, 'planNameError');

  const season = current();
  season.plans.push({
    id: 'p' + Date.now(),
    name: name,
    date: $('planDate').value || season.start,
    group: $('planGroup').value,
    done: false
  });

  saveSeasons();
  planName.value = '';
  $('planDate').value = '';
  renderPlans();
  renderPlanCount();
  showToast('Đã thêm công việc vào ' + season.name + '.');
});

/* ---------- 9. Modal thêm mùa vụ ---------- */
const seasonModal = $('seasonModal');

function openModal() {
  seasonModal.hidden = false;
  $('newName').focus();
}

function closeModal() {
  seasonModal.hidden = true;
  ['newName', 'newPlot', 'newVariety'].forEach(function (id) {
    $(id).value = '';
  });
  ['newArea', 'newDays'].forEach(function (id) {
    $(id).value = id === 'newArea' ? '1' : '90';
  });
  ['newNameError', 'newAreaError', 'newDaysError'].forEach(function (id) {
    $(id).textContent = '';
  });
}

$('newSeasonBtn').addEventListener('click', openModal);

seasonModal.querySelectorAll('[data-close-modal]').forEach(function (el) {
  el.addEventListener('click', closeModal);
});

$('seasonForm').addEventListener('submit', function (event) {
  event.preventDefault();

  const name = $('newName').value.trim();
  const area = Number($('newArea').value);
  const total = Number($('newDays').value);
  let ok = true;

  if (name.length < 3) {
    showError($('newName'), 'newNameError', 'Tên mùa vụ cần tối thiểu 3 ký tự.');
    ok = false;
  } else {
    clearError($('newName'), 'newNameError');
  }

  if (!(area >= 0.1 && area <= 50)) {
    showError($('newArea'), 'newAreaError', 'Diện tích phải từ 0,1 đến 50 ha.');
    ok = false;
  } else {
    clearError($('newArea'), 'newAreaError');
  }

  if (!(total >= 30 && total <= 365)) {
    showError($('newDays'), 'newDaysError', 'Tổng số ngày phải từ 30 đến 365.');
    ok = false;
  } else {
    clearError($('newDays'), 'newDaysError');
  }

  if (!ok) return;

  const season = {
    id: 'ms' + Date.now(),
    name: name,
    plot: $('newPlot').value.trim() || 'Chưa đặt tên',
    variety: $('newVariety').value.trim() || 'Chưa rõ',
    area: Math.round(area * 10) / 10,
    start: $('newStart').value || '2026-06-01',
    total: Math.round(total),
    day: 0,
    status: 'Kế hoạch',
    yield: 0,
    cost: 0,
    plots: [{ name: $('newPlot').value.trim() || 'Mới', area: Math.round(area * 10) / 10, stage: 'Chưa gieo', state: 'Chuẩn bị đất', cls: 'badge-blue' }],
    notes: ['Mùa vụ vừa tạo — hãy cập nhật ngày xuống giống và giống cây trồng.'],
    plans: []
  };

  seasons.push(season);
  activeId = season.id;
  saveSeasons();
  closeModal();
  renderAll();
  showToast('Đã tạo mùa vụ "' + season.name + '".');
});

/* ---------- 10. Validate nhẹ ---------- */
function showError(input, errorId, message) {
  input.classList.add('is-invalid');
  $(errorId).textContent = message;
}

function clearError(input, errorId) {
  input.classList.remove('is-invalid');
  $(errorId).textContent = '';
}

[planName, $('newName'), $('newArea'), $('newDays')].forEach(function (input) {
  input.addEventListener('input', function () {
    input.classList.remove('is-invalid');
    const error = input.closest('.form-row').querySelector('.field-error');
    if (error) error.textContent = '';
  });
});

/* ---------- 11. Lọc kế hoạch ---------- */
[planSearch, planFilter, planState].forEach(function (el) {
  el.addEventListener('input', renderPlans);
});

/* ---------- 12. Thông báo + sidebar ---------- */
const bellBtn = $('bellBtn');
const bellDropdown = $('bellDropdown');
const bellBadge = $('bellBadge');

bellBtn.addEventListener('click', function (event) {
  event.stopPropagation();
  const willOpen = bellDropdown.hidden;
  bellDropdown.hidden = !willOpen;
  bellBtn.setAttribute('aria-expanded', String(willOpen));
  if (willOpen) bellBadge.hidden = true;
});

document.addEventListener('click', function (event) {
  if (!event.target.closest('.bell-wrap')) bellDropdown.hidden = true;
});

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    bellDropdown.hidden = true;
    if (!seasonModal.hidden) closeModal();
  }
});

$('menuToggle').addEventListener('click', function () {
  $('sidebar').classList.toggle('is-open');
});

function showToast(message, isError) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.toggle('is-error', Boolean(isError));
  toast.hidden = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.hidden = true;
  }, 2800);
}

/* ---------- Khởi động ---------- */
function renderAll() {
  renderTabs();
  renderDetail();
  renderStages();
  renderPlans();
  renderPlots();
}

renderAll();
