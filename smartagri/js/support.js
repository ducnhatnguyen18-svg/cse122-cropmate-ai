/* =========================================================
   SmartAgri — Yêu cầu hỗ trợ kỹ thuật
   1) Chọn mức độ khẩn cấp (radio thẻ)
   2) Đếm ký tự mô tả 0/300
   3) Kéo–thả nhiều ảnh đính kèm
   4) Validation + gửi yêu cầu mới -> thêm vào đầu danh sách
   5) Bấm một yêu cầu -> nạp "Phản hồi từ chuyên gia"
   6) Xem thêm / thu gọn, đóng mở panel, đánh dấu đã đọc
   ========================================================= */

const STATUS = {
  wait: { label: 'Đang chờ tiếp nhận', cls: 'pill-wait' },
  advised: { label: 'Đã được tư vấn', cls: 'pill-advised' },
  more: { label: 'Cần bổ sung thông tin', cls: 'pill-more' },
  closed: { label: 'Đã đóng / Hoàn thành', cls: 'pill-closed' },
  read: { label: 'Đã đọc', cls: 'pill-advised' }
};

const requests = [
  {
    id: 'HS-2026-0054',
    title: 'Lúa bị vàng lá đốm nâu diện rộng',
    date: '16/05/2026 07:30',
    status: 'wait',
    urgency: 'Khẩn cấp',
    reply: 'Qua hình ảnh và mô tả, cây lúa của bà con có dấu hiệu bị bệnh đạo ôn lá kết hợp ngộ độc phèn. Vui lòng theo dõi giải pháp bên dưới và theo dõi diễn biến. Nếu cần hỗ trợ thêm, hãy phản hồi lại cho chúng tôi.',
    steps: [
      'Vệ sinh đồng ruộng, loại bỏ lá bệnh nặng.',
      'Điều chỉnh mực nước 3–5 cm, không để ruộng khô hạn.',
      'Phun thuốc đặc trị Validacin 3SL hoặc Beam 75WP theo liều khuyến cáo đã bao bì.',
      'Bón bổ sung kali để tăng sức đề kháng cho cây.',
      'Theo dõi 3–5 ngày, nếu bệnh không giảm, liên hệ lại.'
    ],
    doc: { name: 'Hướng dẫn phòng trừ đạo ôn và khô vằn', size: '1.2 MB' }
  },
  {
    id: 'HS-2026-0048',
    title: 'Sâu cuốn lá nhỏ gây hại',
    date: '15/05/2026 14:15',
    status: 'advised',
    urgency: 'Thường',
    reply: 'Ngưỡng gây hại đã vượt 20 con/m². Bà con nên phun vào chiều mát khi sâu tuổi 1–2 để đạt hiệu quả cao nhất.',
    steps: [
      'Kiểm tra mật độ sâu buổi sáng sớm.',
      'Ngừng bón đạm thúc trong 7 ngày tới.',
      'Phun thuốc trừ sâu có hoạt chất Chlorantraniliprole.',
      'Sau 5 ngày kiểm tra lại và phản hồi kết quả.'
    ],
    doc: { name: 'Quy tắc phun thuốc an toàn 4 đúng', size: '860 KB' }
  },
  {
    id: 'HS-2026-0042',
    title: 'Lúa bị nghẹt rễ, vàng lá',
    date: '14/05/2026 09:20',
    status: 'more',
    urgency: 'Khẩn cấp',
    reply: 'Chúng tôi cần thêm thông tin về mực nước và loại phân đã bón để chẩn đoán chính xác. Bà con bổ sung giúp nhé.',
    steps: [
      'Rút nước phơi ruộng 3–5 ngày.',
      'Bón vôi bột 15–20 kg/sào để khử phèn.',
      'Phun chế phẩm Trichoderma vùng rễ.',
      'Bổ sung ảnh bộ rễ để chúng tôi đánh giá thêm.'
    ],
    doc: { name: 'Khắc phục nghẹt rễ trên lúa', size: '1.5 MB' }
  },
  {
    id: 'HS-2026-0035',
    title: 'Rầy nâu xuất hiện nhiều',
    date: '15/05/2026 16:45',
    status: 'advised',
    urgency: 'Báo động',
    reply: 'Rầy nâu tuổi 2–3 mật độ cao ở khóm lúa. Cần xử lý ngay để tránh cháy ổ.',
    steps: [
      'Giữ nước ruộng 3–5 cm để hạn chế rầy nhảy.',
      'Phun thuốc tiếp xúc khi rầy tuổi 1–2.',
      'Dọn cỏ quanh bờ ruộng.',
      'Kiểm tra lại sau 3 ngày.'
    ],
    doc: { name: 'Hướng dẫn quản lý rầy nâu', size: '980 KB' }
  },
  {
    id: 'HS-2026-0029',
    title: 'Bệnh đạo ôn trên lá',
    date: '12/05/2026 11:00',
    status: 'closed',
    urgency: 'Thường',
    reply: 'Yêu cầu đã hoàn thành. Bà con xác nhận bệnh đã giảm sau 7 ngày phun.',
    steps: [
      'Ngừng bón phân đạm.',
      'Phun thuốc đặc trị đạo ôn 2 lần cách nhau 5 ngày.',
      'Theo dõi và ghi lại nhật ký.'
    ],
    doc: { name: 'Sổ tay nhận diện bệnh lúa', size: '2.1 MB' }
  },
  {
    id: 'HS-2026-0022',
    title: 'Lúa không trổ thoát sau khi phun thuốc',
    date: '08/05/2026 08:10',
    status: 'closed',
    urgency: 'Khẩn cấp',
    reply: 'Hiện tượng nghẹn đòng do thiếu nước cục bộ. Đã hướng dẫn bà con bổ sung nước và phun kích thích.',
    steps: ['Đưa nước vào ruộng 5–7 cm.', 'Phun chế phẩm kích thích trổ đều.', 'Theo dõi 3 ngày.'],
    doc: { name: 'Kỹ thuật tưới ngập khô xen kẽ', size: '1.1 MB' }
  },
  {
    id: 'HS-2026-0018',
    title: 'Chuột phá hại bờ ruộng',
    date: '05/05/2026 15:40',
    status: 'closed',
    urgency: 'Thường',
    reply: 'Đã hướng dẫn đặt bẫy và phát quang bờ ruộng.',
    steps: ['Phát quang cỏ bờ ruộng.', 'Đặt bẫy keo vào buổi chiều.', 'Kiểm tra bẫy mỗi sáng.'],
    doc: { name: 'Kinh nghiệm diệt chuột an toàn', size: '640 KB' }
  }
];

const PREVIEW_LIMIT = 5;

let nextNumber = 55;
let showAll = false;
let activeId = requests[0].id;
let photos = [];
let toastTimer = null;

const supportForm = document.getElementById('supportForm');
const titleInput = document.getElementById('reqTitle');
const titleError = document.getElementById('titleError');
const descInput = document.getElementById('reqDesc');
const descError = document.getElementById('descError');
const charCount = document.getElementById('charCount');
const urgencyBox = document.getElementById('urgencyBox');
const privacyCheck = document.getElementById('privacyCheck');

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const thumbsBox = document.getElementById('thumbs');

const reqList = document.getElementById('reqList');
const emptyBox = document.getElementById('emptyBox');
const moreBtn = document.getElementById('moreBtn');

const expertPanel = document.getElementById('expertPanel');
const supportGrid = document.getElementById('supportGrid');
const panelId = document.getElementById('panelId');
const panelDate = document.getElementById('panelDate');
const replyBox = document.getElementById('replyBox');
const stepsBox = document.getElementById('stepsBox');
const docName = document.getElementById('docName');
const docSize = document.getElementById('docSize');
const docBtn = document.getElementById('docBtn');
const markReadBtn = document.getElementById('markReadBtn');
const toast = document.getElementById('toast');

/* ---------- Tiện ích ---------- */
function nowDateTime() {
  const d = new Date();
  const pad = function (n) {
    return String(n).padStart(2, '0');
  };
  return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function pickedUrgency() {
  const checked = urgencyBox.querySelector('input:checked');
  return checked ? checked.value : 'Thường';
}

/* ---------- 1. Thẻ mức độ khẩn cấp ---------- */
function paintUrgency() {
  urgencyBox.querySelectorAll('.urgency-item').forEach(function (item) {
    const input = item.querySelector('input');
    item.classList.toggle('is-picked', input.checked);
  });
}

urgencyBox.addEventListener('change', paintUrgency);

/* ---------- 2. Đếm ký tự ---------- */
descInput.addEventListener('input', function () {
  charCount.textContent = descInput.value.length;
  descError.textContent = '';
  descInput.classList.remove('is-invalid');
});

/* ---------- 3. Ảnh đính kèm ---------- */
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

dropzone.addEventListener('dragleave', function () {
  dropzone.classList.remove('is-over');
});

dropzone.addEventListener('drop', function (event) {
  event.preventDefault();
  dropzone.classList.remove('is-over');
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
    img.alt = 'Ảnh hiện trường ' + (index + 1);

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
}

/* ---------- 4. Gửi yêu cầu ---------- */
function validateForm() {
  let ok = true;

  if (titleInput.value.trim().length < 5) {
    titleError.textContent = 'Tiêu đề cần ít nhất 5 ký tự.';
    titleInput.classList.add('is-invalid');
    ok = false;
  } else {
    titleError.textContent = '';
    titleInput.classList.remove('is-invalid');
  }

  if (descInput.value.trim().length < 20) {
    descError.textContent = 'Mô tả cần ít nhất 20 ký tự để chuyên gia chẩn đoán đúng.';
    descInput.classList.add('is-invalid');
    ok = false;
  } else {
    descError.textContent = '';
    descInput.classList.remove('is-invalid');
  }

  return ok;
}

supportForm.addEventListener('submit', function (event) {
  event.preventDefault();

  if (!validateForm()) {
    showToast('Vui lòng kiểm tra lại tiêu đề và mô tả.', true);
    return;
  }
  if (!privacyCheck.checked) {
    showToast('Bạn cần đồng ý với điều khoản bảo mật dữ liệu.', true);
    return;
  }

  const id = 'HS-2026-' + String(nextNumber).padStart(4, '0');
  nextNumber += 1;

  requests.unshift({
    id: id,
    title: titleInput.value.trim(),
    date: nowDateTime(),
    status: 'wait',
    urgency: pickedUrgency(),
    reply: '',
    steps: [],
    doc: null
  });

  activeId = id;
  showAll = true;
  photos = [];
  renderThumbs();
  supportForm.reset();
  charCount.textContent = '0';
  paintUrgency();
  renderList();
  renderPanel();
  openPanel();
  showToast('Đã gửi yêu cầu ' + id + '. Chuyên gia sẽ phản hồi sớm.');
});

/* ---------- 5. Danh sách yêu cầu ---------- */
function renderList() {
  const list = showAll ? requests : requests.slice(0, PREVIEW_LIMIT);

  reqList.innerHTML = '';
  list.forEach(function (item) {
    const li = document.createElement('li');
    li.className = 'req-item';
    li.dataset.id = item.id;
    li.tabIndex = 0;
    li.setAttribute('role', 'button');
    if (item.id === activeId) li.classList.add('is-active');

    const head = document.createElement('div');
    head.innerHTML = '<span class="req-id"></span>';
    head.querySelector('.req-id').textContent = '#' + item.id;

    const right = document.createElement('div');
    right.className = 'req-right';
    const pill = document.createElement('span');
    pill.className = 'pill ' + STATUS[item.status].cls;
    pill.textContent = STATUS[item.status].label;
    const chev = document.createElement('span');
    chev.className = 'chev';
    chev.textContent = '›';
    right.append(pill, chev);

    const name = document.createElement('p');
    name.className = 'req-name';
    name.textContent = item.title;

    const date = document.createElement('span');
    date.className = 'req-date';
    date.textContent = '📅 ' + item.date;

    li.append(head, right, name, date);
    reqList.appendChild(li);
  });

  emptyBox.hidden = requests.length !== 0;
  moreBtn.textContent = showAll ? 'Thu gọn ⌃' : 'Xem thêm ' + requests.length + ' ⌄';
  moreBtn.hidden = requests.length <= PREVIEW_LIMIT && !showAll;
}

reqList.addEventListener('click', function (event) {
  const item = event.target.closest('.req-item');
  if (!item) return;
  selectRequest(item.dataset.id);
});

reqList.addEventListener('keydown', function (event) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const item = event.target.closest('.req-item');
  if (!item) return;
  event.preventDefault();
  selectRequest(item.dataset.id);
});

function selectRequest(id) {
  activeId = id;
  renderList();
  renderPanel();
  openPanel();
}

moreBtn.addEventListener('click', function () {
  showAll = !showAll;
  renderList();
});

/* ---------- 6. Panel phản hồi ---------- */
function currentRequest() {
  return requests.find(function (item) {
    return item.id === activeId;
  });
}

function openPanel() {
  expertPanel.classList.remove('is-hidden');
  supportGrid.classList.remove('is-2col');
}

function closePanel() {
  expertPanel.classList.add('is-hidden');
  supportGrid.classList.add('is-2col');
  activeId = null;
  renderList();
}

function renderPanel() {
  const item = currentRequest();
  if (!item) return;

  panelId.textContent = '#' + item.id;
  panelDate.textContent = item.date;

  replyBox.innerHTML = '';
  stepsBox.innerHTML = '';

  if (item.reply) {
    const p = document.createElement('p');
    p.textContent = item.reply;
    replyBox.appendChild(p);
  } else {
    const p = document.createElement('p');
    p.textContent = 'Yêu cầu của bạn đang chờ chuyên gia tiếp nhận. Chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.';
    replyBox.appendChild(p);
  }

  item.steps.forEach(function (text) {
    const li = document.createElement('li');
    li.textContent = text;
    stepsBox.appendChild(li);
  });

  const hasDoc = Boolean(item.doc);
  document.querySelector('.doc-row').hidden = !hasDoc;
  if (hasDoc) {
    docName.textContent = item.doc.name;
    docSize.textContent = item.doc.size;
  }

  const read = item.status === 'read' || item.status === 'closed';
  markReadBtn.disabled = read;
  markReadBtn.textContent = read ? '✔ Đã đọc' : '✔ Đánh dấu đã đọc';
}

document.getElementById('closePanelBtn').addEventListener('click', closePanel);
document.getElementById('closePanelBtn2').addEventListener('click', closePanel);

markReadBtn.addEventListener('click', function () {
  const item = currentRequest();
  if (!item) return;
  item.status = 'read';
  renderList();
  renderPanel();
  showToast('Đã đánh dấu yêu cầu #' + item.id + ' là đã đọc.');
});

docBtn.addEventListener('click', function () {
  const item = currentRequest();
  if (item && item.doc) {
    showToast('Đang tải: ' + item.doc.name + ' (' + item.doc.size + ')');
  }
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
  if (!event.target.closest('.bell-wrap')) bellDropdown.hidden = true;
});

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    bellDropdown.hidden = true;
    closePanel();
  }
});

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
  }, 2800);
}

/* ---------- Khởi động ---------- */
function init() {
  paintUrgency();
  renderList();
  renderPanel();
}

init();
