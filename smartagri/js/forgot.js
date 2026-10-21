/* =========================================================
   SmartAgri — Logic trang quên mật khẩu
   1) Kiểm tra dữ liệu nhập (tên đăng nhập HOẶC email)
   2) Gửi liên kết đặt lại giả lập + spinner + thông báo
   3) Đổi sang trạng thái "đã gửi", đếm ngược 60s cho nút Gửi lại
   4) Che (mask) địa chỉ email trước khi hiển thị
   ========================================================= */

/* Tài khoản demo — chỉ để trang chạy được không cần server.
   Đăng ký thật (register.html) lưu bằng số điện thoại nên không có email ở đây. */
const DEMO_ACCOUNTS = [
  { username: 'nongdan', email: 'nongdan.chien@example.com' },
  { username: 'chuyen_gia', email: 'chuyen.gia@example.com' }
];

const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_USERNAME = 4;
const RESEND_WAIT = 60; // giây

const requestPanel = document.getElementById('requestPanel');
const sentPanel = document.getElementById('sentPanel');
const forgotForm = document.getElementById('forgotForm');
const accountInput = document.getElementById('account');
const accountError = document.getElementById('accountError');
const sendBtn = document.getElementById('sendBtn');
const sendText = sendBtn.querySelector('.btn-text');
const sentTitle = document.getElementById('sentTitle');
const sentTarget = document.getElementById('sentTarget');
const resendBtn = document.getElementById('resendBtn');
const resendText = resendBtn.querySelector('.btn-text');
const backToFormBtn = document.getElementById('backToFormBtn');
const toast = document.getElementById('toast');

let toastTimer = null;
let countdownId = null;
let secondsLeft = 0;

/* ---------- 1. Validation ---------- */
function setError(message) {
  accountError.textContent = message;
  accountInput.classList.toggle('is-invalid', message !== '');
}

function looksLikeEmail(value) {
  return value.indexOf('@') !== -1;
}

function validate() {
  const value = accountInput.value.trim();

  if (value === '') {
    setError('Bạn chưa nhập tên đăng nhập hoặc email.');
    return false;
  }

  if (looksLikeEmail(value)) {
    if (!EMAIL_RULE.test(value)) {
      setError('Email không hợp lệ (ví dụ nongdan@example.com).');
      return false;
    }
    setError('');
    return true;
  }

  if (value.length < MIN_USERNAME) {
    setError('Tên đăng nhập phải có ít nhất ' + MIN_USERNAME + ' ký tự.');
    return false;
  }

  setError('');
  return true;
}

accountInput.addEventListener('input', function () {
  setError('');
});

/* ---------- 2. Che địa chỉ email ---------- */
/* nongdan.chien@example.com -> no***@example.com */
function maskEmail(email) {
  const at = email.indexOf('@');
  const name = email.slice(0, at);
  const domain = email.slice(at + 1);
  const kept = name.length > 2 ? name.slice(0, 2) : name.slice(0, 1);
  return kept + '***@' + domain;
}

function targetOf(value) {
  if (looksLikeEmail(value)) {
    return maskEmail(value);
  }

  const typed = value.toLowerCase();
  for (let i = 0; i < DEMO_ACCOUNTS.length; i += 1) {
    if (DEMO_ACCOUNTS[i].username === typed) {
      return maskEmail(DEMO_ACCOUNTS[i].email);
    }
  }

  /* Không tìm thấy vẫn báo giống hệt — tránh lộ thông tin tài khoản nào có thật. */
  return 'email đã đăng ký của tài khoản này';
}

/* ---------- 3. Gửi liên kết (giả lập gọi API) ---------- */
function setSending(isSending) {
  sendBtn.disabled = isSending;
  resendBtn.disabled = true;
  sendText.innerHTML = isSending
    ? '<span class="spinner" aria-hidden="true"></span>Đang gửi liên kết...'
    : 'Gửi liên kết đặt lại mật khẩu';
}

function showSent(value) {
  sentTarget.textContent = targetOf(value);
  requestPanel.hidden = true;
  sentPanel.hidden = false;
  sentTitle.focus();
  startCountdown();
}

forgotForm.addEventListener('submit', function (event) {
  event.preventDefault();
  if (!validate()) {
    sendBtn.classList.add('is-shaking');
    setTimeout(function () {
      sendBtn.classList.remove('is-shaking');
    }, 500);
    return;
  }

  const value = accountInput.value.trim();
  setSending(true);

  setTimeout(function () {
    setSending(false);
    showSent(value);
    showToast('Đã gửi liên kết đặt lại mật khẩu.');
  }, 1200);
});

/* ---------- 4. Đếm ngược cho nút "Gửi lại" ---------- */
function startCountdown() {
  stopCountdown();
  secondsLeft = RESEND_WAIT;
  paintCountdown();
  countdownId = setInterval(function () {
    secondsLeft -= 1;
    paintCountdown();
    if (secondsLeft <= 0) stopCountdown();
  }, 1000);
}

function paintCountdown() {
  if (secondsLeft > 0) {
    resendBtn.disabled = true;
    resendText.textContent = 'Gửi lại sau ' + secondsLeft + ' giây';
    return;
  }
  resendBtn.disabled = false;
  resendText.textContent = 'Gửi lại liên kết';
}

function stopCountdown() {
  if (countdownId) {
    clearInterval(countdownId);
    countdownId = null;
  }
}

resendBtn.addEventListener('click', function () {
  const value = accountInput.value.trim();

  resendBtn.disabled = true;
  resendText.innerHTML = '<span class="spinner" aria-hidden="true"></span>Đang gửi lại...';

  setTimeout(function () {
    resendText.textContent = 'Gửi lại liên kết';
    startCountdown();
    showToast('Đã gửi lại liên kết đặt lại mật khẩu.');
  }, 900);
});

/* ---------- 5. Quay lại nhập tài khoản khác ---------- */
backToFormBtn.addEventListener('click', function () {
  stopCountdown();
  sentPanel.hidden = true;
  requestPanel.hidden = false;
  accountInput.focus();
});

/* ---------- Toast ---------- */
function showToast(message, isError) {
  toast.textContent = message;
  toast.classList.toggle('is-error', Boolean(isError));
  toast.hidden = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.hidden = true;
  }, 2600);
}
