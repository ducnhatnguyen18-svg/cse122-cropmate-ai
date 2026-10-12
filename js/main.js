/* =========================================================
   SmartAgri — main.js
   Trang: Chi tiết yêu cầu & Tư vấn (role: Chuyên gia nông nghiệp)
   ========================================================= */

/* ---------- Dữ liệu mẫu (mảng object) ---------- */

const timelineData = [
  { date: '12/05', icon: 'i-flask', label: 'Bón phân NPK 16-16-8', value: '5 kg/1.000 m²' },
  { date: '14/05', icon: 'i-drop', label: 'Độ ẩm đất tăng đột biến', value: '92%' },
  { date: '15/05', icon: 'i-rain', label: 'Mưa vừa', value: '25 mm' },
  { date: '16/05', icon: 'i-leaf', label: 'Lúa có dấu hiệu vàng lá', value: 'Quan sát' }
];

const notifications = [
  { title: 'Yêu cầu mới #1182', body: 'Nông hộ Trần Văn Bình gửi ảnh hiện trường lô A1.' },
  { title: 'AI-3 đã có kết quả', body: 'Bản tóm tắt nhật ký 14 ngày đã sẵn sàng.' },
  { title: 'Nhắc phản hồi', body: 'Yêu cầu còn 03 giờ nữa quá hạn tư vấn.' }
];

const libraryItems = [
  { title: 'Quy trình bón phân lót cho lúa ST25', body: 'Hướng dẫn 6 bước chuẩn kỹ thuật.' },
  { title: 'Bảng chẩn đoán vàng lá theo triệu chứng', body: 'So sánh thiếu đạm / thiếu sắt / ngộ phèn.' },
  { title: 'Ngưỡng độ ẩm đất an toàn', body: 'Dải 60–75% cho giai đoạn đẻ nhánh.' },
  { title: 'Mẫu phản hồi tư vấn cho nông hộ', body: 'Cấu trúc 3 phần: chuẩn đoán – giải pháp – lịch theo dõi.' }
];

const experts = [
  { id: 'e1', name: 'Lê Thị Hương — chuyên gia thổ nhưỡng' },
  { id: 'e2', name: 'Phạm Minh Tuấn — chuyên gia bảo vệ thực vật' },
  { id: 'e3', name: 'Võ Quốc Bảo — chuyên gia thủy nông' }
];

const aiSummary =
  'Trong 2-14 ngày gần nhất, 3 ngày trước đã bón phân NPK; 2 ngày trước độ ẩm tăng đột biến; ' +
  'cây trồng có dấu hiệu vàng lá và sinh trưởng chậm.';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MIN_ADVICE = 20;

/* ---------- Bẫy DOM ---------- */
const $ = (sel) => document.querySelector(sel);

const layout = $('#layout');
const sidebar = $('#sidebar');
const scrim = $('#scrim');

/* ---------- 1. Toggle sidebar (Responsive) ---------- */
function setNav(open) {
  layout.classList.toggle('nav-open', open);
  scrim.hidden = !open;
}

$('#btnMenu').addEventListener('click', () => {
  setNav(!layout.classList.contains('nav-open'));
});
scrim.addEventListener('click', () => setNav(false));

/* ---------- 2. Thông báo ---------- */
const notifList = $('#notifList');
const notifCount = $('#notifCount');
const notifPanel = $('#notifPanel');

function renderNotifications() {
  notifList.innerHTML = '';

  for (let i = 0; i < notifications.length; i++) {
    const item = notifications[i];
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    const p = document.createElement('span');

    strong.textContent = item.title;
    p.textContent = item.body;
    li.append(strong, p);
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

/* ---------- 3. AI hiển thị kiểu đang xử lý ---------- */
function runAiSummarizer() {
  const skeleton = $('#aiSkeleton');
  const result = $('#aiResult');

  skeleton.hidden = false;
  result.hidden = true;
  result.querySelector('p:last-child').textContent = '';

  setTimeout(() => {
    skeleton.hidden = true;
    result.hidden = false;
    result.querySelector('p:last-child').textContent = aiSummary;
  }, 1600);
}

/* ---------- 4. Render dòng thời gian từ mảng ---------- */
const timelineEl = $('#timeline');

function renderTimeline() {
  timelineEl.innerHTML = '';
  $('#timelineEmpty').hidden = timelineData.length > 0;

  for (let i = 0; i < timelineData.length; i++) {
    const item = timelineData[i];
    const li = document.createElement('li');

    const dot = document.createElement('span');
    dot.className = 'dot';

    const date = document.createElement('span');
    date.className = 'date';
    date.textContent = item.date;

    const event = document.createElement('span');
    event.className = 'event';
    event.innerHTML = '<svg class="icon"><use href="#' + item.icon + '"></use></svg>';
    event.appendChild(document.createTextNode(item.label));

    const value = document.createElement('span');
    value.className = 'value';
    value.textContent = item.value;

    li.append(date, dot, event, value);
    timelineEl.appendChild(li);
  }
}

function addTimelineEntry(entry) {
  timelineData.push(entry);
  renderTimeline();
}

/* ---------- 5. Status badge ---------- */
const statusBadge = $('#statusBadge');
const statusText = $('#statusText');

function setStatus(kind) {
  const map = {
    new: 'Trạng thái: Mới',
    progress: 'Trạng thái: Đang tư vấn',
    done: 'Trạng thái: Đã gửi tư vấn'
  };
  statusBadge.dataset.status = kind;
  statusText.textContent = map[kind];
}

/* ---------- 6. Toast ---------- */
const toast = $('#toast');
let toastTimer;

function showToast(message, kind) {
  toast.textContent = message;
  toast.className = 'toast is-show' + (kind ? ' is-' + kind : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.className = 'toast'; }, 2800);
}

/* ---------- 7. Modal dùng chung ---------- */
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

/* ---------- 8. Trình soạn thảo nội dung ---------- */
const editor = $('#editor');
const charCount = $('#charCount');
const adviceError = $('#adviceError');

function updateCounter() {
  const len = editor.textContent.trim().length;
  charCount.textContent = len;
  if (len >= MIN_ADVICE) {
    adviceError.hidden = true;
    editor.classList.remove('is-invalid');
  }
  return len;
}

editor.addEventListener('input', updateCounter);

function applyCmd(cmd) {
  editor.focus();

  if (cmd === 'bold') {
    document.execCommand('bold');
  } else if (cmd === 'title') {
    document.execCommand('formatBlock', false, 'h3');
  } else if (cmd === 'clear') {
    document.execCommand('removeFormat');
    document.execCommand('formatBlock', false, 'p');
  }
  updateCounter();
}

document.querySelectorAll('.tool').forEach((btn) => {
  btn.addEventListener('click', () => applyCmd(btn.dataset.cmd));
});

$('#blockType').addEventListener('change', (e) => {
  editor.focus();
  document.execCommand('formatBlock', false, e.target.value);
});

/* ---------- 9. Kéo thả ảnh ---------- */
const dropzone = $('#dropzone');
const fileInput = $('#fileInput');
const fileError = $('#fileError');
const attachments = $('#attachments');
const files = [];

function showFileError(message) {
  fileError.textContent = message;
  fileError.hidden = !message;
}

function renderAttachments() {
  attachments.innerHTML = '';

  files.forEach((item, index) => {
    const li = document.createElement('li');
    const img = document.createElement('img');
    img.src = item.url;
    img.alt = 'Ảnh đính kèm ' + item.file.name;

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = item.file.name;

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove';
    remove.setAttribute('aria-label', 'Xóa ' + item.file.name);
    remove.innerHTML = '<svg class="icon"><use href="#i-close"></use></svg>';
    remove.addEventListener('click', () => {
      URL.revokeObjectURL(item.url);
      files.splice(index, 1);
      renderAttachments();
    });

    li.append(img, name, remove);
    attachments.appendChild(li);
  });
}

function acceptFiles(list) {
  let added = 0;

  for (let i = 0; i < list.length; i++) {
    const file = list[i];

    if (ALLOWED_TYPES.indexOf(file.type) === -1) {
      showFileError('Tệp "' + file.name + '" không được hỗ trợ. Chỉ nhận PNG, JPG, WEBP.');
      continue;
    }
    if (file.size > MAX_FILE_SIZE) {
      showFileError('Tệp "' + file.name + '" vượt quá 5MB.');
      continue;
    }

    files.push({ file: file, url: URL.createObjectURL(file) });
    added++;
  }

  if (added > 0) {
    showFileError('');
    renderAttachments();
    showToast('Đã đính kèm ' + added + ' ảnh.', 'ok');
  }
}

dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fileInput.click();
  }
});
fileInput.addEventListener('change', () => {
  acceptFiles(fileInput.files);
  fileInput.value = '';
});

['dragenter', 'dragover'].forEach((type) => {
  dropzone.addEventListener(type, (e) => {
    e.preventDefault();
    dropzone.classList.add('is-over');
  });
});
['dragleave', 'drop'].forEach((type) => {
  dropzone.addEventListener(type, (e) => {
    e.preventDefault();
    dropzone.classList.remove('is-over');
  });
});
dropzone.addEventListener('drop', (e) => acceptFiles(e.dataTransfer.files));

/* ---------- 10. Gửi tư vấn (validation) ---------- */
$('#adviceForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const length = updateCounter();

  if (length < MIN_ADVICE) {
    adviceError.textContent = 'Nội dung tư vấn cần tối thiểu ' + MIN_ADVICE + ' ký tự (hiện có ' + length + ').';
    adviceError.hidden = false;
    editor.classList.add('is-invalid');
    editor.focus();
    showToast('Chưa gửi được — nội dung còn quá ngắn.', 'bad');
    return;
  }

  setStatus('done');
  $('#btnSend').disabled = true;
  $('#btnSend').innerHTML = '<svg class="icon"><use href="#i-check"></use></svg> Đã gửi tư vấn';
  showToast('Đã gửi lời khuyên cho nông hộ Trần Văn Bình.', 'ok');
});

/* ---------- 11. Yêu cầu bổ sung ---------- */
$('#btnRequestMore').addEventListener('click', () => {
  const form = document.createElement('div');
  form.innerHTML =
    '<div class="field"><label for="needType">Thông tin cần nông hộ bổ sung</label>' +
    '<select id="needType">' +
    '<option value="Ảnh cận cảnh bộ rễ">Ảnh cận cảnh bộ rễ</option>' +
    '<option value="Kết quả kiểm tra độ pH đất">Kết quả kiểm tra độ pH đất</option>' +
    '<option value="Lịch bón phân 3 vụ gần nhất">Lịch bón phân 3 vụ gần nhất</option>' +
    '</select></div>' +
    '<div class="field"><label for="needNote">Ghi chú gửi nông hộ</label>' +
    '<textarea id="needNote" placeholder="Ví dụ: chụp rõ phần gốc và lá bị vàng..."></textarea></div>';

  function submit() {
    const note = form.querySelector('#needNote');

    if (note.value.trim().length < 5) {
      note.classList.add('invalid');
      showToast('Hãy ghi rõ lý do cần bổ sung thông tin.', 'bad');
      return;
    }

    addTimelineEntry({
      date: 'Hôm nay',
      icon: 'i-chat',
      label: 'Chuyên gia yêu cầu bổ sung: ' + form.querySelector('#needType').value,
      value: 'Chờ nông hộ'
    });
    setStatus('progress');
    closeModal();
    showToast('Đã gửi yêu cầu bổ sung tới nông hộ.', 'ok');
  }

  openModal('Yêu cầu bổ sung thông tin', form, [
    { label: 'Hủy', onClick: closeModal },
    { label: 'Gửi yêu cầu', primary: true, onClick: submit }
  ]);
});

/* ---------- 12. Chuyển tiếp chuyên gia khác ---------- */
$('#btnTransfer').addEventListener('click', () => {
  const form = document.createElement('div');
  const options = experts.map((x) => '<option value="' + x.id + '">' + x.name + '</option>').join('');

  form.innerHTML =
    '<div class="field"><label for="expert">Chọn chuyên gia tiếp nhận</label>' +
    '<select id="expert"><option value="">— Chọn chuyên gia —</option>' + options + '</select></div>' +
    '<div class="field"><label for="reason">Lý do chuyển tiếp</label>' +
    '<textarea id="reason" placeholder="Ví dụ: cần chuyên gia thổ nhưỡng đọc mẫu đất..."></textarea></div>';

  function submit() {
    const pick = form.querySelector('#expert');
    const reason = form.querySelector('#reason');

    if (pick.value === '') {
      pick.classList.add('invalid');
      showToast('Bạn chưa chọn chuyên gia tiếp nhận.', 'bad');
      return;
    }
    if (reason.value.trim().length < 5) {
      reason.classList.add('invalid');
      showToast('Cần nêu lý do chuyển tiếp.', 'bad');
      return;
    }

    const name = pick.options[pick.selectedIndex].text;
    addTimelineEntry({ date: 'Hôm nay', icon: 'i-users', label: 'Chuyển tiếp cho ' + name, value: 'Đã chuyển' });
    setStatus('progress');
    closeModal();
    showToast('Đã chuyển yêu cầu tới ' + name + '.', 'ok');
  }

  openModal('Chuyển tiếp cho chuyên gia khác', form, [
    { label: 'Hủy', onClick: closeModal },
    { label: 'Xác nhận chuyển tiếp', primary: true, onClick: submit }
  ]);
});

/* ---------- 13. Chèn tài nguyên từ thư viện ---------- */
$('#btnLibrary').addEventListener('click', () => {
  const wrap = document.createElement('div');
  wrap.className = 'lib';
  const picked = [];

  libraryItems.forEach((item) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.innerHTML = '<strong></strong><span></span>';
    btn.querySelector('strong').textContent = item.title;
    btn.querySelector('span').textContent = item.body;

    btn.addEventListener('click', () => {
      btn.classList.toggle('is-picked');
      const at = picked.indexOf(item);
      if (at === -1) { picked.push(item); } else { picked.splice(at, 1); }
    });
    wrap.appendChild(btn);
  });

  function insert() {
    if (picked.length === 0) {
      showToast('Chọn ít nhất một tài nguyên.', 'bad');
      return;
    }
    editor.focus();
    picked.forEach((item, i) => {
      document.execCommand('insertText', false, (i ? '\n' : '') + '• ' + item.title + ' — ' + item.body);
    });
    updateCounter();
    closeModal();
    showToast('Đã chèn ' + picked.length + ' tài nguyên.', 'ok');
  }

  openModal('Thư viện tài nguyên', wrap, [
    { label: 'Hủy', onClick: closeModal },
    { label: 'Chèn vào nội dung', primary: true, onClick: insert }
  ]);
});

/* ---------- 14. Trợ lý AI AgrBrain ---------- */
$('#btnAssistant').addEventListener('click', () => {
  const wrap = document.createElement('div');
  wrap.className = 'lib';

  const suggestions = [
    'Kiểm tra thoát nước và phơi ruộng 2–3 ngày, tránh để độ ẩm vượt 90%.',
    'Lấy mẫu đất kiểm tra pH và sắt trước khi bón phân đợt tiếp theo.',
    'Tạm dừng bón đạm, theo dõi triệu chứng vàng lá trong 5 ngày.'
  ];

  suggestions.forEach((text) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.innerHTML = '<strong>Gợi ý</strong><span></span>';
    btn.querySelector('span').textContent = text;
    btn.addEventListener('click', () => {
      editor.focus();
      document.execCommand('insertText', false, text + '\n');
      updateCounter();
      closeModal();
      showToast('Đã chèn gợi ý của AI vào nội dung.', 'ok');
    });
    wrap.appendChild(btn);
  });

  openModal('Trợ lý AI AgrBrain', wrap, [{ label: 'Đóng', onClick: closeModal }]);
});

/* ---------- Khởi động ---------- */
renderNotifications();
renderTimeline();
updateCounter();
runAiSummarizer();
