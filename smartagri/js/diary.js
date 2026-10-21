/* =========================================================
   SmartAgri — Nhật ký
   1) Render danh sách nhật ký từ mảng
   2) Tìm kiếm + 3 bộ lọc + làm mới
   3) Thêm / sửa / xóa nhật ký (modal xác nhận)
   4) Kéo–thả nhiều ảnh, xem trước, xoá từng ảnh
   5) Chẩn đoán AI mô phỏng + xác nhận / chỉnh sửa kết quả
   ========================================================= */

const TYPE_META = {
  'Bón phân': 'tag-fert',
  'Phun thuốc': 'tag-spray',
  'Tưới nước': 'tag-water',
  'Làm cỏ': 'tag-weed',
  'Thu hoạch': 'tag-harvest'
};

const DIAGNOSES = [
  {
    name: 'Đốm nâu trên lá (Bệnh Cercospora)',
    explain: 'Nấm Cercospora gây các đốm tròn màu nâu trên lá, làm giảm khả năng quang hợp và ảnh hưởng đến năng suất cuối vụ. Nên phun thuốc gốc copper hydroxide và rút nước ruộng 3–5 ngày.'
  },
  {
    name: 'Khô vằn (Rhizoctonia solani)',
    explain: 'Vết loang màu vàng nâu lan thành từng đám, thường xuất hiện khi ruộng rậm rạp và ẩm độ cao. Cần tỉa thưa, ngừng bón đạm và phun thuốc đặc trị ở phần thân sát mặt nước.'
  },
  {
    name: 'Thiếu đạm nhẹ',
    explain: 'Lá già vàng đều từ chóp xuống, khóm lúa sinh trưởng chậm. Nên bón bổ sung ure theo liều 40 kg/ha kết hợp giữ mực nước nông 3 cm.'
  }
];

let entries = [
  {
    id: 1, date: '2024-05-18', time: '07:30', type: 'Phun thuốc', stage: 'Đẻ nhánh', status: 'done',
    desc: 'Phun thuốc trừ sâu cho lúa giai đoạn đẻ nhánh. Sử dụng thuốc Actara 25WG liều lượng 0.3kg/ha.',
    photos: ['assets/hero-rice.png']
  },
  {
    id: 2, date: '2024-05-16', time: '16:00', type: 'Bón phân', stage: 'Đẻ nhánh', status: 'done',
    desc: 'Bón phân NPK 16-16-8 cho lúa. Liều lượng 20kg/ha cho toàn bộ lô A1.',
    photos: ['assets/register-field.png']
  },
  {
    id: 3, date: '2024-05-14', time: '06:45', type: 'Tưới nước', stage: 'Đẻ nhánh', status: 'done',
    desc: 'Tưới nước giữ ẩm cho khu sau khi bón phân. Mực nước duy trì 3–5cm.',
    photos: ['assets/hero-rice.png']
  },
  {
    id: 4, date: '2024-05-12', time: '08:15', type: 'Làm cỏ', stage: 'Làm đòng', status: 'done',
    desc: 'Làm cỏ bờ kênh và dọn tàn dư thực vật quanh ruộng.',
    photos: ['assets/login-farmer.png']
  },
  {
    id: 5, date: '2024-05-10', time: '09:20', type: 'Thu hoạch', stage: 'Chín', status: 'wait',
    desc: 'Thu hoạch lúa vụ Đông Xuân. Năng suất ước đạt 6.2 tấn/ha.',
    photos: ['assets/register-field.png']
  }
];

let nextId = 6;
let editingId = null;
let pendingDeleteId = null;
let photos = [];
let toastTimer = null;

const diaryForm = document.getElementById('diaryForm');
const dateInput = document.getElementById('entryDate');
const typeInput = document.getElementById('entryType');
const stageInput = document.getElementById('entryStage');
const descInput = document.getElementById('entryDesc');
const doneInput = document.getElementById('entryDone');
const dateError = document.getElementById('dateError');
const typeError = document.getElementById('typeError');
const descError = document.getElementById('descError');
const saveBtn = document.getElementById('saveBtn');
const resetFormBtn = document.getElementById('resetFormBtn');

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const thumbsBox = document.getElementById('thumbs');
const photoCount = document.getElementById('photoCount');

const aiRunBtn = document.getElementById('aiRunBtn');
const aiConfirmBtn = document.getElementById('aiConfirmBtn');
const aiEditBtn = document.getElementById('aiEditBtn');
const aiDisease = document.getElementById('aiDisease');
const aiExplain = document.getElementById('aiExplain');

const timeline = document.getElementById('timeline');
const emptyBox = document.getElementById('emptyBox');
const countPill = document.getElementById('countPill');
const searchInput = document.getElementById('searchInput');
const filterStage = document.getElementById('filterStage');
const filterType = document.getElementById('filterType');
const filterStatus = document.getElementById('filterStatus');
const resetFilterBtn = document.getElementById('resetFilterBtn');

const confirmModal = document.getElementById('confirmModal');
const confirmText = document.getElementById('confirmText');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const toast = document.getElementById('toast');

/* ---------- Định dạng ngày dd/MM/yyyy ---------- */
function formatDate(iso) {
  const parts = iso.split('-');
  return parts[2] + '/' + parts[1] + '/' + parts[0];
}

function nowTime() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return hh + ':' + mm;
}

/* ---------- 1. Render danh sách ---------- */
function buildEntry(entry) {
  const li = document.createElement('li');
  li.className = 'entry';
  if (entry.status === 'wait') li.classList.add('is-wait');
  if (entry.id === editingId) li.classList.add('is-editing');
  li.dataset.id = entry.id;

  const dateBox = document.createElement('div');
  dateBox.className = 'entry-date';
  dateBox.innerHTML = '<strong></strong><span></span>';
  dateBox.querySelector('strong').textContent = formatDate(entry.date);
  dateBox.querySelector('span').textContent = entry.time;

  const rail = document.createElement('div');
  rail.className = 'entry-rail';
  rail.innerHTML = '<span></span>';

  const body = document.createElement('div');
  body.className = 'entry-body';

  const thumb = document.createElement('img');
  thumb.className = 'entry-thumb';
  thumb.src = entry.photos.length ? entry.photos[0] : 'assets/logo.svg';
  thumb.alt = 'Ảnh minh hoạ cho hoạt động ' + entry.type;

  const info = document.createElement('div');
  info.className = 'entry-info';
  const tag = document.createElement('span');
  tag.className = 'tag ' + (TYPE_META[entry.type] || 'tag-weed');
  tag.textContent = entry.type;
  const text = document.createElement('p');
  text.className = 'entry-text';
  text.textContent = entry.desc;
  const note = document.createElement('p');
  note.className = 'entry-note';
  note.textContent = 'Giai đoạn: ' + entry.stage + ' · ' + entry.photos.length + ' ảnh';
  info.append(tag, text, note);

  const side = document.createElement('div');
  side.className = 'entry-side';
  const statusEl = document.createElement('span');
  statusEl.className = 'status ' + (entry.status === 'done' ? 'status-done' : 'status-wait');
  statusEl.textContent = entry.status === 'done' ? 'Hoàn thành' : 'Đang chờ';
  const actions = document.createElement('div');
  actions.className = 'entry-actions';
  actions.innerHTML =
    '<button class="mini-btn mini-edit" type="button" data-action="edit">✏️ Sửa</button>' +
    '<button class="mini-btn mini-del" type="button" data-action="delete">🗑️ Xóa</button>';
  side.append(statusEl, actions);

  body.append(thumb, info, side);
  li.append(dateBox, rail, body);
  return li;
}

/* ---------- 2. Tìm kiếm + lọc ---------- */
function getFiltered() {
  const q = searchInput.value.trim().toLowerCase();
  const stage = filterStage.value;
  const type = filterType.value;
  const status = filterStatus.value;

  return entries
    .filter(function (item) {
      const matchText = item.desc.toLowerCase().indexOf(q) !== -1 ||
        item.type.toLowerCase().indexOf(q) !== -1;
      return matchText &&
        (stage === 'all' || item.stage === stage) &&
        (type === 'all' || item.type === type) &&
        (status === 'all' || item.status === status);
    })
    .sort(function (a, b) {
      return (b.date + b.time).localeCompare(a.date + a.time);
    });
}

function renderEntries() {
  const list = getFiltered();
  timeline.innerHTML = '';
  list.forEach(function (item) {
    timeline.appendChild(buildEntry(item));
  });
  countPill.textContent = list.length;
  emptyBox.hidden = list.length !== 0;
}

searchInput.addEventListener('input', renderEntries);
filterStage.addEventListener('change', renderEntries);
filterType.addEventListener('change', renderEntries);
filterStatus.addEventListener('change', renderEntries);

resetFilterBtn.addEventListener('click', function () {
  searchInput.value = '';
  filterStage.value = 'all';
  filterType.value = 'all';
  filterStatus.value = 'all';
  renderEntries();
  showToast('Đã xoá toàn bộ bộ lọc.');
});

/* ---------- 3. Validation + thêm / sửa ---------- */
function setError(input, errorEl, message) {
  errorEl.textContent = message;
  input.classList.toggle('is-invalid', message !== '');
}

function validateForm() {
  let ok = true;

  if (dateInput.value === '') {
    setError(dateInput, dateError, 'Bạn chưa chọn ngày thực hiện.');
    ok = false;
  } else {
    setError(dateInput, dateError, '');
  }

  if (typeInput.value === '') {
    setError(typeInput, typeError, 'Hãy chọn loại hoạt động.');
    ok = false;
  } else {
    setError(typeInput, typeError, '');
  }

  if (descInput.value.trim().length < 10) {
    setError(descInput, descError, 'Mô tả cần ít nhất 10 ký tự để sau này dễ tra cứu.');
    ok = false;
  } else {
    setError(descInput, descError, '');
  }

  return ok;
}

diaryForm.addEventListener('submit', function (event) {
  event.preventDefault();
  if (!validateForm()) {
    showToast('Vui lòng kiểm tra lại các trường còn thiếu.', true);
    return;
  }

  const record = {
    date: dateInput.value,
    time: nowTime(),
    type: typeInput.value,
    stage: stageInput.value,
    status: doneInput.checked ? 'done' : 'wait',
    desc: descInput.value.trim(),
    photos: photos.slice()
  };

  if (editingId === null) {
    record.id = nextId;
    nextId += 1;
    entries.unshift(record);
    showToast('Đã thêm nhật ký mới vào danh sách.');
  } else {
    const found = entries.find(function (item) {
      return item.id === editingId;
    });
    found.date = record.date;
    found.type = record.type;
    found.stage = record.stage;
    found.status = record.status;
    found.desc = record.desc;
    found.photos = record.photos;
    editingId = null;
    saveBtn.textContent = 'Lưu nhật ký';
    showToast('Đã cập nhật nhật ký.');
  }

  resetForm();
  renderEntries();
});

function resetForm() {
  diaryForm.reset();
  dateInput.value = todayISO();
  photos = [];
  renderThumbs();
  setError(dateInput, dateError, '');
  setError(typeInput, typeError, '');
  setError(descInput, descError, '');
}

function todayISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + mm + '-' + dd;
}

resetFormBtn.addEventListener('click', function () {
  editingId = null;
  saveBtn.textContent = 'Lưu nhật ký';
  resetForm();
  renderEntries();
});

/* ---------- 4. Sửa / xóa từ danh sách (event delegation) ---------- */
timeline.addEventListener('click', function (event) {
  const btn = event.target.closest('[data-action]');
  if (!btn) return;

  const id = Number(btn.closest('.entry').dataset.id);

  if (btn.dataset.action === 'edit') {
    startEdit(id);
  } else {
    askDelete(id);
  }
});

function startEdit(id) {
  const entry = entries.find(function (item) {
    return item.id === id;
  });

  editingId = id;
  dateInput.value = entry.date;
  typeInput.value = entry.type;
  stageInput.value = entry.stage;
  descInput.value = entry.desc;
  doneInput.checked = entry.status === 'done';
  photos = entry.photos.slice();
  renderThumbs();

  saveBtn.textContent = 'Cập nhật nhật ký';
  renderEntries();
  diaryForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  showToast('Đang chỉnh sửa nhật ký ngày ' + formatDate(entry.date) + '.');
}

function askDelete(id) {
  pendingDeleteId = id;
  const entry = entries.find(function (item) {
    return item.id === id;
  });
  confirmText.textContent = 'Xoá nhật ký "' + entry.type + ' ngày ' + formatDate(entry.date) + '"? Hành động này không thể hoàn tác.';
  confirmModal.hidden = false;
}

confirmDeleteBtn.addEventListener('click', function () {
  entries = entries.filter(function (item) {
    return item.id !== pendingDeleteId;
  });

  if (editingId === pendingDeleteId) {
    editingId = null;
    saveBtn.textContent = 'Lưu nhật ký';
    resetForm();
  }

  pendingDeleteId = null;
  confirmModal.hidden = true;
  renderEntries();
  showToast('Đã xoá nhật ký.');
});

confirmModal.addEventListener('click', function (event) {
  if (event.target.closest('[data-close-modal]')) {
    confirmModal.hidden = true;
  }
});

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    confirmModal.hidden = true;
    closeDropdowns();
  }
});

/* ---------- 5. Ảnh: kéo–thả, xem trước, loại bỏ ---------- */
dropzone.addEventListener('click', function () {
  fileInput.click();
});

dropzone.addEventListener('keydown', function (event) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    fileInput.click();
  }
});

fileInput.addEventListener('change', function () {
  addFiles(fileInput.files);
  fileInput.value = '';
});

['dragover', 'dragenter'].forEach(function (name) {
  dropzone.addEventListener(name, function (event) {
    event.preventDefault();
    dropzone.classList.add('is-over');
  });
});

['dragleave', 'drop'].forEach(function (name) {
  dropzone.addEventListener(name, function () {
    dropzone.classList.remove('is-over');
  });
});

dropzone.addEventListener('drop', function (event) {
  event.preventDefault();
  addFiles(event.dataTransfer.files);
});

function addFiles(fileList) {
  Array.prototype.forEach.call(fileList, function (file) {
    if (!file.type.startsWith('image/')) {
      showToast('Bỏ qua "' + file.name + '" vì không phải ảnh.', true);
      return;
    }
    const reader = new FileReader();
    reader.onload = function () {
      photos.push(reader.result);
      renderThumbs();
    };
    reader.readAsDataURL(file);
  });
}

function renderThumbs() {
  thumbsBox.innerHTML = '';

  photos.forEach(function (src, index) {
    const box = document.createElement('div');
    box.className = 'thumb';
    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Ảnh minh hoạ ' + (index + 1);
    const del = document.createElement('button');
    del.type = 'button';
    del.setAttribute('aria-label', 'Loại ảnh ' + (index + 1));
    del.textContent = '✕';
    del.addEventListener('click', function () {
      photos.splice(index, 1);
      renderThumbs();
    });
    box.append(img, del);
    thumbsBox.appendChild(box);
  });

  photoCount.textContent = photos.length === 0 ? '' : photos.length + ' ảnh đã chọn';
}

/* ---------- 6. Trợ lý AI (mô phỏng) ---------- */
aiRunBtn.addEventListener('click', function () {
  if (photos.length === 0) {
    showToast('Hãy chọn ít nhất một ảnh trước khi chẩn đoán.', true);
    return;
  }

  aiRunBtn.disabled = true;
  aiRunBtn.textContent = 'Đang phân tích...';

  setTimeout(function () {
    const pick = DIAGNOSES[Math.floor(Math.random() * DIAGNOSES.length)];
    aiDisease.textContent = pick.name;
    aiExplain.textContent = pick.explain;
    aiRunBtn.disabled = false;
    aiRunBtn.textContent = 'Chẩn đoán bằng AI';
    aiConfirmBtn.disabled = false;
    aiEditBtn.disabled = false;
    showToast('AI đã trả kết quả chẩn đoán sơ bộ.');
  }, 1400);
});

aiConfirmBtn.addEventListener('click', function () {
  if (aiDisease.textContent.indexOf('Chưa chạy') !== -1) return;

  const note = '[Chẩn đoán AI: ' + aiDisease.textContent + '] ';
  if (descInput.value.indexOf(note) === -1) {
    descInput.value = note + descInput.value;
  }
  showToast('Đã gắn kết quả AI vào phần mô tả.');
});

aiEditBtn.addEventListener('click', function () {
  const editable = aiExplain.getAttribute('contenteditable') === 'true';
  aiExplain.setAttribute('contenteditable', String(!editable));
  aiEditBtn.textContent = editable ? 'Chỉnh sửa' : 'Xong';
  if (!editable) aiExplain.focus();
});

/* ---------- Thông báo + sidebar ---------- */
const bellBtn = document.getElementById('bellBtn');
const bellDropdown = document.getElementById('bellDropdown');
const bellBadge = document.getElementById('bellBadge');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');

bellBtn.addEventListener('click', function (event) {
  event.stopPropagation();
  const willOpen = bellDropdown.hidden;
  bellDropdown.hidden = !willOpen;
  bellBtn.setAttribute('aria-expanded', String(willOpen));
  if (willOpen) bellBadge.hidden = true;
});

document.addEventListener('click', function (event) {
  if (!event.target.closest('.bell-wrap')) closeDropdowns();
});

function closeDropdowns() {
  bellDropdown.hidden = true;
  bellBtn.setAttribute('aria-expanded', 'false');
}

menuToggle.addEventListener('click', function () {
  sidebar.classList.toggle('is-open');
});

function showToast(message, isError) {
  toast.textContent = message;
  toast.classList.toggle('is-error', Boolean(isError));
  toast.hidden = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.hidden = true;
  }, 2600);
}

/* ---------- Khởi động ---------- */
function init() {
  dateInput.value = todayISO();
  renderThumbs();
  renderEntries();
}

init();
