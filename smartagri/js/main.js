const season = { name: 'Vụ Lúa Mùa 2026 — Lô A1', passedDays: 35, totalDays: 90, progress: 62 };

const activities = [
  { time: '16/05/2026 07:30', type: 'Ghi nhật ký', content: 'Bón phân đợt 2 cho lúa', status: 'done' },
  { time: '15/05/2026 14:15', type: 'Ghi nhật ký', content: 'Ghi nhận sâu cuốn lá nhỏ', status: 'done' },
  { time: '14/05/2026 09:20', type: 'Ghi nhật ký', content: 'Tưới nước ruộng A1', status: 'done' },
  { time: '13/05/2026 16:45', type: 'Báo cáo sự cố', content: 'Đề nghị hỗ trợ về sâu bệnh', status: 'wait' },
  { time: '12/05/2026 11:00', type: 'Hỏi chuyên gia', content: 'Hỏi về cách phòng bệnh đạo ôn', status: 'wait' },
  { time: '11/05/2026 08:10', type: 'Ghi nhật ký', content: 'Kiểm tra pH đất lô A2', status: 'done' },
  { time: '10/05/2026 15:40', type: 'Báo cáo sự cố', content: 'Cháy một bóng đèn chuồng trại', status: 'done' }
];

const notifications = [
  { title: 'Cảnh báo mưa lớn', detail: 'Khu vực của bạn có mưa vừa đến mưa to trong 24 giờ tới.' },
  { title: 'Chuyên gia đã trả lời', detail: 'Câu hỏi về bệnh đạo ôn đã có phản hồi.' }
];

const STATUS_LABEL = { done: 'Hoàn thành', wait: 'Đang chờ' };
const STATUS_CLASS = { done: 'badge-done', wait: 'badge-wait' };

const PREVIEW_LIMIT = 5;
let showAll = false;
let unreadCount = notifications.length;

const activityBody = document.getElementById('activityBody');
const activityEmpty = document.getElementById('activityEmpty');
const activitySearch = document.getElementById('activitySearch');
const activityType = document.getElementById('activityType');
const toggleLimitBtn = document.getElementById('toggleLimit');
const progressFill = document.getElementById('progressFill');
const progressValue = document.getElementById('progressValue');
const progressTrack = document.getElementById('progressTrack');
const dayCount = document.getElementById('dayCount');
const totalDays = document.getElementById('totalDays');
const bellBtn = document.getElementById('bellBtn');
const bellBadge = document.getElementById('bellBadge');
const bellDropdown = document.getElementById('bellDropdown');
const dropdownList = document.getElementById('dropdownList');
const userBtn = document.getElementById('userBtn');
const userDropdown = document.getElementById('userDropdown');
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const dropHint = document.getElementById('dropHint');
const preview = document.querySelector('.preview');
const analyzeBtn = document.getElementById('analyzeBtn');
const aiResult = document.getElementById('aiResult');
const logModal = document.getElementById('logModal');
const askModal = document.getElementById('askModal');
const logForm = document.getElementById('logForm');
const askForm = document.getElementById('askForm');
const toast = document.getElementById('toast');
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');

function currentNow() {
  const d = new Date();
  const pad = function (n) { return n < 10 ? '0' + n : String(n); };
  return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(function () { toast.hidden = true; }, 3200);
}

function renderActivities() {
  const keyword = activitySearch.value.trim().toLowerCase();
  const type = activityType.value;

  let list = activities.filter(function (item) {
    const matchText = item.content.toLowerCase().includes(keyword);
    const matchType = type === 'all' || item.type === type;
    return matchText && matchType;
  });

  if (showAll === false) list = list.slice(0, PREVIEW_LIMIT);

  activityBody.innerHTML = '';

  list.forEach(function (item) {
    const row = document.createElement('tr');
    row.innerHTML =
      '<td class="log-time">' + item.time + '</td>' +
      '<td>' + item.type + '</td>' +
      '<td>' + item.content + '</td>' +
      '<td><span class="badge ' + STATUS_CLASS[item.status] + '">' + STATUS_LABEL[item.status] + '</span></td>';
    activityBody.appendChild(row);
  });

  activityEmpty.hidden = list.length > 0;
  toggleLimitBtn.textContent = showAll ? '← Thu gọn' : 'Xem tất cả →';
}

function animateProgress() {
  const percent = season.progress;

  dayCount.textContent = season.passedDays;
  totalDays.textContent = season.totalDays;

  setTimeout(function () {
    progressFill.style.width = percent + '%';
    progressTrack.setAttribute('aria-valuenow', percent);
  }, 150);

  let current = 0;
  const counter = setInterval(function () {
    current += 2;
    if (current >= percent) {
      current = percent;
      clearInterval(counter);
    }
    progressValue.textContent = current + '%';
  }, 30);
}

function renderNotifications() {
  dropdownList.innerHTML = '';

  if (notifications.length === 0) {
    dropdownList.innerHTML = '<li class="dropdown-item">Không có thông báo nào.</li>';
    return;
  }

  notifications.forEach(function (item) {
    const li = document.createElement('li');
    li.className = 'dropdown-item';
    li.innerHTML = '<div><strong>' + item.title + '</strong><span>' + item.detail + '</span></div>';
    dropdownList.appendChild(li);
  });
}

function updateBell() {
  bellBadge.textContent = unreadCount;
  bellBadge.hidden = unreadCount === 0;
}

function closeDropdowns() {
  bellDropdown.hidden = true;
  userDropdown.hidden = true;
  bellBtn.setAttribute('aria-expanded', 'false');
  userBtn.setAttribute('aria-expanded', 'false');
}

function openModal(modal) {
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
  modal.hidden = true;
  document.body.style.overflow = '';
}

function setFieldError(input, errorEl, message) {
  document.getElementById(errorEl).textContent = message;
  input.classList.toggle('is-invalid', message !== '');
  return message === '';
}

bellBtn.addEventListener('click', function (event) {
  event.stopPropagation();
  const willOpen = bellDropdown.hidden;
  closeDropdowns();
  bellDropdown.hidden = !willOpen;
  bellBtn.setAttribute('aria-expanded', String(willOpen));

  if (willOpen) {
    unreadCount = 0;
    updateBell();
  }
});

userBtn.addEventListener('click', function (event) {
  event.stopPropagation();
  const willOpen = userDropdown.hidden;
  closeDropdowns();
  userDropdown.hidden = !willOpen;
  userBtn.setAttribute('aria-expanded', String(willOpen));
});

document.addEventListener('click', function (event) {
  if (event.target.closest('.bell-wrap, .user-chip-wrap') === null) closeDropdowns();
});

activitySearch.addEventListener('input', renderActivities);
activityType.addEventListener('change', renderActivities);

toggleLimitBtn.addEventListener('click', function () {
  showAll = !showAll;
  renderActivities();
});

document.querySelectorAll('.side-link').forEach(function (link) {
  link.addEventListener('click', function () {
    document.querySelectorAll('.side-link').forEach(function (el) { el.classList.remove('is-active'); });
    link.classList.add('is-active');
    sidebar.classList.remove('is-open');
  });
});

menuToggle.addEventListener('click', function (event) {
  event.stopPropagation();
  sidebar.classList.toggle('is-open');
});

document.addEventListener('click', function (event) {
  if (window.innerWidth > 760) return;
  if (event.target.closest('.sidebar, .btn-menu') === null) sidebar.classList.remove('is-open');
});

dropzone.addEventListener('click', function () {
  fileInput.click();
});

dropzone.addEventListener('keydown', function (event) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    fileInput.click();
  }
});

dropzone.addEventListener('dragover', function (event) {
  event.preventDefault();
  dropzone.classList.add('is-over');
});

dropzone.addEventListener('dragleave', function () {
  dropzone.classList.remove('is-over');
});

dropzone.addEventListener('drop', function (event) {
  event.preventDefault();
  dropzone.classList.remove('is-over');
  if (event.dataTransfer.files.length > 0) loadFile(event.dataTransfer.files[0]);
});

fileInput.addEventListener('change', function () {
  if (fileInput.files.length > 0) loadFile(fileInput.files[0]);
});

function loadFile(file) {
  if (file.type.startsWith('image') === false) {
    showToast('Tệp chọn không phải là ảnh. Vui lòng chọn tệp ảnh.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function (event) {
    preview.src = event.target.result;
    preview.hidden = false;
    dropHint.hidden = true;
    dropzone.classList.add('has-image');
    analyzeBtn.disabled = false;
    aiResult.hidden = true;
  };
  reader.readAsDataURL(file);
}

analyzeBtn.addEventListener('click', function () {
  analyzeBtn.disabled = true;
  analyzeBtn.textContent = 'Đang phân tích...';

  setTimeout(function () {
    const confidence = 82 + Math.floor(Math.random() * 15);

    aiResult.innerHTML =
      '<h3>Kết quả chẩn đoán sơ bộ</h3>' +
      '<p><strong>Dấu hiệu:</strong> đốm nâu nhỏ ở rìa lá, viền vàng quanh vết bệnh.</p>' +
      '<p><strong>Khả năng:</strong> Bệnh đạo ôn lá — độ tin cậy <strong>' + confidence + '%</strong></p>' +
      '<ul>' +
      '<li>Ngưng bón phân đạm trong 7 ngày tới.</li>' +
      '<li>Kiểm tra mật độ ở các khóm lân cận.</li>' +
      '<li>Nếu lan rộng, liên hệ chuyên gia để được hướng dẫn thuốc đặc trị.</li>' +
      '</ul>' +
      '<p><em>Kết quả chỉ mang tính tham khảo, không thay thế chẩn đoán của cán bộ bảo vệ thực vật.</em></p>';

    aiResult.hidden = false;
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = 'Chẩn đoán sơ bộ';
    showToast('AI đã hoàn thành chẩn đoán sơ bộ.');
  }, 1400);
});

document.getElementById('openLogBtn').addEventListener('click', function () {
  openModal(logModal);
});

document.getElementById('openAskBtn').addEventListener('click', function () {
  openModal(askModal);
});

[logModal, askModal].forEach(function (modal) {
  modal.addEventListener('click', function (event) {
    if (event.target.closest('[data-close-modal]') !== null) closeModal(modal);
  });
});

document.addEventListener('keydown', function (event) {
  if (event.key !== 'Escape') return;
  if (logModal.hidden === false) closeModal(logModal);
  if (askModal.hidden === false) closeModal(askModal);
  closeDropdowns();
});

logForm.addEventListener('submit', function (event) {
  event.preventDefault();

  const typeInput = document.getElementById('logType');
  const contentInput = document.getElementById('logContent');
  const ok = setFieldError(contentInput, 'logContentError',
    contentInput.value.trim().length >= 8 ? '' : 'Nội dung cần tối thiểu 8 ký tự.');

  if (ok === false) {
    contentInput.focus();
    return;
  }

  activities.unshift({
    time: currentNow(),
    type: typeInput.value,
    content: contentInput.value.trim(),
    status: 'done'
  });

  showAll = false;
  renderActivities();
  logForm.reset();
  closeModal(logModal);
  showToast('Đã lưu nhật ký mới và đưa lên đầu danh sách.');
});

askForm.addEventListener('submit', function (event) {
  event.preventDefault();

  const topicInput = document.getElementById('askTopic');
  const contentInput = document.getElementById('askContent');

  const topicOk = setFieldError(topicInput, 'askTopicError',
    topicInput.value === '' ? 'Vui lòng chọn chủ đề.' : '');
  const contentOk = setFieldError(contentInput, 'askContentError',
    contentInput.value.trim().length >= 15 ? '' : 'Câu hỏi cần tối thiểu 15 ký tự.');

  if (topicOk === false || contentOk === false) return;

  activities.unshift({
    time: currentNow(),
    type: 'Hỏi chuyên gia',
    content: '[' + topicInput.value + '] ' + contentInput.value.trim(),
    status: 'wait'
  });

  showAll = false;
  renderActivities();
  askForm.reset();
  closeModal(askModal);
  showToast('Đã gửi câu hỏi. Chuyên gia sẽ trả lời trong 24 giờ.');
});

[document.getElementById('logContent'), document.getElementById('askContent'), document.getElementById('askTopic')].forEach(function (input) {
  input.addEventListener('input', function () {
    input.classList.remove('is-invalid');
    const error = input.parentElement.querySelector('.field-error');
    if (error !== null) error.textContent = '';
  });
});

document.getElementById('logoutBtn2').addEventListener('click', function () {
  closeDropdowns();
  showToast('Bạn đã đăng xuất khỏi SmartAgri.');
});

function init() {
  renderActivities();
  renderNotifications();
  updateBell();
  animateProgress();
}

init();
