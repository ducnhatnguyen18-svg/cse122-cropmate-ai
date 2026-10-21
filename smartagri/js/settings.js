/* =========================================================
   SmartAgri — Cài đặt
   1) Chuyển tab (chuột + phím mũi tên)
   2) Hồ sơ: nạp/lưu/validate, hiện lại tên trên topbar
   3) Lô ruộng: thêm / xoá
   4) Thông báo: công tắc + lưu + gửi thử
   5) Giao diện: cỡ chữ, tương phản, giảm hiệu ứng -> gắn class lên <html>
   6) Bảo mật: thanh đo độ mạnh mật khẩu + danh sách phiên
   7) Dữ liệu: liệt kê localStorage, xuất/nhập JSON, xoá toàn bộ (modal xác nhận)
   ========================================================= */

const SETTINGS_KEY = 'smartagri.settings.v1';

const DEFAULTS = {
  profile: {
    name: '',
    phone: '',
    email: '',
    born: '',
    address: '',
    crop: 'Lúa',
    exp: '3den10',
    unit: 'ha',
    isPublic: false
  },
  plots: [
    { name: 'A1', area: 0.7, soil: 'Đất phù sa' },
    { name: 'A2', area: 0.3, soil: 'Đất phèn' },
    { name: 'B1', area: 0.2, soil: 'Đất phù sa' }
  ],
  notify: {
    pest: true,
    weather: true,
    expert: true,
    plan: true,
    news: false,
    channel: 'app',
    quiet: '21:00'
  },
  display: {
    fs: '15',
    contrast: false,
    motion: false
  }
};

const SESSIONS = [
  { device: '📱 Điện thoại — trình duyệt Chrome', place: 'Cao Lãnh, Đồng Tháp', last: 'Đang hoạt động', self: true },
  { device: '💻 Máy tính bàn — Firefox', place: 'Cao Lãnh, Đồng Tháp', last: 'Hôm qua 19:42', self: false },
  { device: '📱 Điện thoại cũ — Samsung Internet', place: 'Mỹ Tho, Tiền Giang', last: '12/05/2026 06:15', self: false }
];

let settings = loadSettings();
let sessions = SESSIONS.slice();
let toastTimer = null;

function $(id) {
  return document.getElementById(id);
}

/* ---------- 1. Đọc/ ghi ---------- */
function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const data = raw ? JSON.parse(raw) : null;
    if (data && typeof data === 'object') {
      return {
        profile: Object.assign({}, DEFAULTS.profile, data.profile),
        plots: Array.isArray(data.plots) ? data.plots : DEFAULTS.plots.slice(),
        notify: Object.assign({}, DEFAULTS.notify, data.notify),
        display: Object.assign({}, DEFAULTS.display, data.display)
      };
    }
  } catch (error) {
    /* dữ liệu hỏng -> dùng mặc định */
  }
  return JSON.parse(JSON.stringify(DEFAULTS));
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/* ---------- 2. Tab ---------- */
const tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));

function openPanel(name) {
  tabs.forEach(function (tab) {
    const on = tab.dataset.panel === name;
    tab.classList.toggle('is-active', on);
    tab.setAttribute('aria-selected', String(on));
    $('panel-' + tab.dataset.panel).hidden = !on;
  });
}

tabs.forEach(function (tab, index) {
  tab.addEventListener('click', function () {
    openPanel(tab.dataset.panel);
  });

  tab.addEventListener('keydown', function (event) {
    let next = -1;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    if (next === -1) return;
    event.preventDefault();
    tabs[next].focus();
    openPanel(tabs[next].dataset.panel);
  });
});

/* ---------- 3. Hồ sơ ---------- */
const profileForm = $('profileForm');

function fillProfileForm() {
  $('pfName').value = settings.profile.name;
  $('pfPhone').value = settings.profile.phone;
  $('pfEmail').value = settings.profile.email;
  $('pfBorn').value = settings.profile.born;
  $('pfAddress').value = settings.profile.address;
  $('pfCrop').value = settings.profile.crop;
  $('pfExp').value = settings.profile.exp;
  $('pfUnit').value = settings.profile.unit;
  $('pfPublic').checked = settings.profile.isPublic;
}

function expLabel(value) {
  const map = { Duoi3: 'dưới 3 năm kinh nghiệm', '3den10': '3–10 năm kinh nghiệm', Tren10: 'trên 10 năm kinh nghiệm' };
  return map[value] || value;
}

function renderProfilePreview() {
  const profile = settings.profile;
  const name = profile.name || 'Nông dân';
  $('previewName').textContent = name;
  $('chipName').textContent = name;
  $('previewMeta').textContent = [
    profile.crop,
    profile.address || 'chưa cập nhật địa chỉ',
    expLabel(profile.exp)
  ].join(' · ');
}

profileForm.addEventListener('submit', function (event) {
  event.preventDefault();

  const name = $('pfName').value.trim();
  const phone = $('pfPhone').value.trim();
  const email = $('pfEmail').value.trim();
  const born = $('pfBorn').value.trim();
  let ok = true;

  if (name.length < 3) {
    fail('pfName', 'pfNameError', 'Họ tên cần tối thiểu 3 ký tự.');
    ok = false;
  } else {
    clear('pfName', 'pfNameError');
  }

  if (phone !== '' && !/^[0-9+\s.-]{8,15}$/.test(phone)) {
    fail('pfPhone', 'pfPhoneError', 'Số điện thoại chỉ gồm 8–15 chữ số.');
    ok = false;
  } else {
    clear('pfPhone', 'pfPhoneError');
  }

  if (email !== '' && email.indexOf('@') < 1) {
    fail('pfEmail', 'pfEmailError', 'Email chưa đúng định dạng.');
    ok = false;
  } else {
    clear('pfEmail', 'pfEmailError');
  }

  if (born !== '' && (Number(born) < 1930 || Number(born) > 2010)) {
    fail('pfBorn', 'pfBornError', 'Năm sinh phải trong khoảng 1930–2010.');
    ok = false;
  } else {
    clear('pfBorn', 'pfBornError');
  }

  if (!ok) return;

  settings.profile = {
    name: name,
    phone: phone,
    email: email,
    born: born,
    address: $('pfAddress').value.trim(),
    crop: $('pfCrop').value,
    exp: $('pfExp').value,
    unit: $('pfUnit').value,
    isPublic: $('pfPublic').checked
  };

  saveSettings();
  renderProfilePreview();
  showToast('Đã lưu hồ sơ của ' + name + '.');
});

$('pfResetBtn').addEventListener('click', function () {
  settings.profile = Object.assign({}, DEFAULTS.profile);
  saveSettings();
  fillProfileForm();
  renderProfilePreview();
  showToast('Đã khôi phục hồ sơ về mặc định.');
});

function fail(inputId, errorId, message) {
  $(inputId).classList.add('is-invalid');
  $(errorId).textContent = message;
}

function clear(inputId, errorId) {
  $(inputId).classList.remove('is-invalid');
  $(errorId).textContent = '';
}

['pfName', 'pfPhone', 'pfEmail', 'pfBorn'].forEach(function (id) {
  $(id).addEventListener('input', function () {
    clear(id, id + 'Error');
  });
});

/* ---------- 4. Lô ruộng ---------- */
function renderPlots() {
  const list = $('plotList');
  list.innerHTML = '';

  settings.plots.forEach(function (plot, index) {
    const li = document.createElement('li');
    li.className = 'plot-item';

    const mark = document.createElement('span');
    mark.className = 'plot-mark';
    mark.textContent = plot.name.slice(0, 2).toUpperCase();

    const body = document.createElement('div');
    body.className = 'plot-body';

    const strong = document.createElement('strong');
    strong.textContent = 'Lô ' + plot.name;

    const meta = document.createElement('span');
    meta.textContent = plot.area + ' ha · ' + plot.soil;

    body.append(strong, meta);

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'plot-del';
    del.setAttribute('aria-label', 'Xoá lô ' + plot.name);
    del.textContent = '✕';
    del.addEventListener('click', function () {
      settings.plots.splice(index, 1);
      saveSettings();
      renderPlots();
      showToast('Đã xoá lô ' + plot.name + '.');
    });

    li.append(mark, body, del);
    list.appendChild(li);
  });

  $('plotEmpty').hidden = settings.plots.length > 0;
}

$('plotForm').addEventListener('submit', function (event) {
  event.preventDefault();

  const name = $('plotName').value.trim();
  const area = Number($('plotArea').value);

  if (name.length < 1) {
    fail('plotName', 'plotNameError', 'Tên lô không được để trống.');
    return;
  }
  if (settings.plots.some(function (plot) {
    return plot.name.toLowerCase() === name.toLowerCase();
  })) {
    fail('plotName', 'plotNameError', 'Lô này đã có trong danh sách.');
    return;
  }
  if (!(area >= 0.1 && area <= 50)) {
    fail('plotArea', 'plotAreaError', 'Diện tích phải từ 0,1 đến 50 ha.');
    return;
  }

  clear('plotName', 'plotNameError');
  clear('plotArea', 'plotAreaError');

  settings.plots.push({ name: name, area: Math.round(area * 10) / 10, soil: $('plotSoil').value });
  saveSettings();
  $('plotName').value = '';
  renderPlots();
  showToast('Đã thêm lô ' + name + '.');
});

/* ---------- 5. Thông báo ---------- */
function fillNotifyForm() {
  $('ntPest').checked = settings.notify.pest;
  $('ntWeather').checked = settings.notify.weather;
  $('ntExpert').checked = settings.notify.expert;
  $('ntPlan').checked = settings.notify.plan;
  $('ntNews').checked = settings.notify.news;
  $('ntChannel').value = settings.notify.channel;
  $('ntQuiet').value = settings.notify.quiet;
}

function readNotifyForm() {
  settings.notify = {
    pest: $('ntPest').checked,
    weather: $('ntWeather').checked,
    expert: $('ntExpert').checked,
    plan: $('ntPlan').checked,
    news: $('ntNews').checked,
    channel: $('ntChannel').value,
    quiet: $('ntQuiet').value
  };
}

$('ntSaveBtn').addEventListener('click', function () {
  readNotifyForm();
  saveSettings();
  showToast('Đã lưu cài đặt thông báo.');
});

$('ntTestBtn').addEventListener('click', function () {
  readNotifyForm();
  saveSettings();
  const channel = { app: 'trong ứng dụng', sms: 'tin nhắn SMS', email: 'email' }[settings.notify.channel];
  showToast('Đã gửi thông báo thử qua ' + channel + '.');
});

/* ---------- 6. Giao diện ---------- */
function applyDisplay() {
  const display = settings.display;
  const root = document.documentElement;

  root.classList.remove('fs-sm', 'fs-lg', 'fs-xl');
  if (display.fs === '14') root.classList.add('fs-sm');
  if (display.fs === '17') root.classList.add('fs-lg');
  if (display.fs === '19') root.classList.add('fs-xl');

  root.classList.toggle('high-contrast', Boolean(display.contrast));
  root.classList.toggle('no-motion', Boolean(display.motion));
}

function fillDisplayForm() {
  const radios = document.querySelectorAll('input[name="fs"]');
  radios.forEach(function (radio) {
    radio.checked = radio.value === settings.display.fs;
  });
  $('dpContrast').checked = Boolean(settings.display.contrast);
  $('dpMotion').checked = Boolean(settings.display.motion);
}

document.querySelectorAll('input[name="fs"]').forEach(function (radio) {
  radio.addEventListener('change', function () {
    settings.display.fs = this.value;
    saveSettings();
    applyDisplay();
  });
});

$('dpContrast').addEventListener('change', function () {
  settings.display.contrast = this.checked;
  saveSettings();
  applyDisplay();
  showToast(this.checked ? 'Đã bật tương phản cao.' : 'Đã tắt tương phản cao.');
});

$('dpMotion').addEventListener('change', function () {
  settings.display.motion = this.checked;
  saveSettings();
  applyDisplay();
  showToast(this.checked ? 'Đã giảm hiệu ứng chuyển động.' : 'Đã bật lại hiệu ứng.');
});

/* ---------- 7. Bảo mật ---------- */
function scorePassword(value) {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[0-9]/.test(value) && /[a-zA-ZÀ-ỹ]/.test(value)) score += 1;
  if (/[^a-zA-Z0-9\s]/.test(value)) score += 1;
  return score;
}

function renderStrength(value) {
  const labels = ['chưa nhập', 'rất yếu', 'yếu', 'khá', 'mạnh'];
  const colors = ['#e4ebe4', 'var(--red-600)', '#e17c0b', 'var(--amber)', 'var(--green-500)'];
  const score = value === '' ? 0 : scorePassword(value);

  $('strengthBar').style.width = (score / 4) * 100 + '%';
  $('strengthBar').style.backgroundColor = colors[score];
  $('strengthText').textContent = 'Độ mạnh: ' + labels[score];
}

$('pwNew').addEventListener('input', function () {
  renderStrength(this.value);
});

$('passwordForm').addEventListener('submit', function (event) {
  event.preventDefault();

  const oldPw = $('pwOld').value;
  const newPw = $('pwNew').value;
  const confirmPw = $('pwConfirm').value;
  let ok = true;

  if (oldPw === '') {
    fail('pwOld', 'pwOldError', 'Bạn cần nhập mật khẩu hiện tại.');
    ok = false;
  } else {
    clear('pwOld', 'pwOldError');
  }

  if (newPw.length < 8 || scorePassword(newPw) < 3) {
    fail('pwNew', 'pwNewError', 'Mật khẩu mới cần tối thiểu 8 ký tự, có số và chữ.');
    ok = false;
  } else {
    clear('pwNew', 'pwNewError');
  }

  if (newPw !== confirmPw) {
    fail('pwConfirm', 'pwConfirmError', 'Mật khẩu nhập lại chưa khớp.');
    ok = false;
  } else {
    clear('pwConfirm', 'pwConfirmError');
  }

  if (!ok) return;

  this.reset();
  renderStrength('');
  showToast('Đã đổi mật khẩu (minh hoạ — trang chưa có máy chủ).');
});

function renderSessions() {
  const body = $('sessionBody');
  body.innerHTML = '';

  sessions.forEach(function (session, index) {
    const tr = document.createElement('tr');

    const tdDevice = document.createElement('td');
    tdDevice.textContent = session.device;

    const tdPlace = document.createElement('td');
    tdPlace.textContent = session.place;

    const tdLast = document.createElement('td');
    tdLast.textContent = session.last;

    const tdAction = document.createElement('td');
    if (session.self) {
      const badge = document.createElement('span');
      badge.className = 'badge badge-green';
      badge.textContent = 'Thiết bị này';
      tdAction.appendChild(badge);
    } else {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'link-btn link-danger';
      btn.textContent = 'Đăng xuất';
      btn.addEventListener('click', function () {
        sessions.splice(index, 1);
        renderSessions();
        showToast('Đã đăng xuất thiết bị này.');
      });
      tdAction.appendChild(btn);
    }

    tr.append(tdDevice, tdPlace, tdLast, tdAction);
    body.appendChild(tr);
  });
}

$('logoutOthersBtn').addEventListener('click', function () {
  sessions = sessions.filter(function (session) {
    return session.self;
  });
  renderSessions();
  showToast('Đã đăng xuất khỏi các thiết bị khác.');
});

/* ---------- 8. Dữ liệu ---------- */
function smartKeys() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && key.indexOf('smartagri.') === 0) keys.push(key);
  }
  return keys.sort();
}

function renderStore() {
  const box = $('storeList');
  box.innerHTML = '';

  const keys = smartKeys();

  if (keys.length === 0) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = 'Chưa có dữ liệu nào được lưu trên trình duyệt này.';
    box.appendChild(p);
    return;
  }

  keys.forEach(function (key) {
    const value = localStorage.getItem(key) || '';
    const row = document.createElement('div');
    row.className = 'store-row';

    const name = document.createElement('strong');
    name.textContent = key;

    const size = document.createElement('span');
    size.textContent = (value.length / 1024).toFixed(2) + ' KB';

    row.append(name, size);
    box.appendChild(row);
  });
}

$('exportBtn').addEventListener('click', function () {
  const dump = {};
  smartKeys().forEach(function (key) {
    dump[key] = localStorage.getItem(key);
  });

  const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'smartagri-du-lieu.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);

  showToast('Đã xuất ' + Object.keys(dump).length + ' mục dữ liệu ra tệp JSON.');
});

$('importInput').addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function () {
    try {
      const data = JSON.parse(String(reader.result));
      if (typeof data !== 'object' || data === null) throw new Error('Sai định dạng');

      Object.keys(data).forEach(function (key) {
        if (key.indexOf('smartagri.') === 0) localStorage.setItem(key, String(data[key]));
      });
      showToast('Đã nhập dữ liệu, trang sẽ tải lại.');
      setTimeout(function () {
        location.reload();
      }, 900);
    } catch (error) {
      showToast('Tệp không hợp lệ. Cần tệp JSON do SmartAgri xuất ra.', true);
    }
  };
  reader.readAsText(file);
  this.value = '';
});

/* Modal xác nhận xoá */
const wipeModal = $('wipeModal');

$('wipeBtn').addEventListener('click', function () {
  wipeModal.hidden = false;
  $('wipeConfirmCheck').checked = false;
  $('wipeConfirmBtn').disabled = true;
});

wipeModal.querySelectorAll('[data-close-modal]').forEach(function (el) {
  el.addEventListener('click', function () {
    wipeModal.hidden = true;
  });
});

$('wipeConfirmCheck').addEventListener('change', function () {
  $('wipeConfirmBtn').disabled = !this.checked;
});

$('wipeConfirmBtn').addEventListener('click', function () {
  smartKeys().forEach(function (key) {
    localStorage.removeItem(key);
  });
  showToast('Đã xoá toàn bộ dữ liệu. Trang sẽ tải lại.');
  setTimeout(function () {
    location.reload();
  }, 900);
});

/* ---------- Thông báo + sidebar ---------- */
$('menuToggle').addEventListener('click', function () {
  $('sidebar').classList.toggle('is-open');
});

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape' && !wipeModal.hidden) wipeModal.hidden = true;
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
function init() {
  fillProfileForm();
  renderProfilePreview();
  renderPlots();
  fillNotifyForm();
  fillDisplayForm();
  applyDisplay();
  renderSessions();
  renderStore();
  renderStrength('');
  openPanel('profile');
}

init();
