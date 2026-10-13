/* =========================================================
   SmartAgri — login.js
   Trang: Đăng nhập cho chuyên gia
   Xác thực phía client cho bản demo học phần (không thay thế
   xác thực thật ở server).
   ========================================================= */

const AUTH_KEY = 'smartagri_auth';
const USER_KEY = 'smartagri_user';

const DEMO_USERS = [
  { username: 'chuyengia', password: '123456', name: 'Nguyễn Văn Nam' }
];

const $ = (sel) => document.querySelector(sel);

const form = $('#loginForm');
const usernameInput = $('#username');
const passwordInput = $('#password');
const usernameError = $('#usernameError');
const passwordError = $('#passwordError');
const formError = $('#formError');
const btnLogin = $('#btnLogin');
const btnEye = $('#btnEye');
const card = form;

/* Đã đăng nhập thì vào thẳng trang tổng quan */
if (sessionStorage.getItem(AUTH_KEY) === '1') {
  location.replace('dashboard.html');
}

/* ---------- Hiện / ẩn mật khẩu ---------- */
btnEye.addEventListener('click', () => {
  const showing = passwordInput.type === 'text';
  passwordInput.type = showing ? 'password' : 'text';
  btnEye.setAttribute('aria-pressed', String(!showing));
  btnEye.setAttribute('aria-label', showing ? 'Hiện mật khẩu' : 'Ẩn mật khẩu');
  btnEye.querySelector('.eye-open').toggleAttribute('hidden', !showing);
  btnEye.querySelector('.eye-closed').toggleAttribute('hidden', showing);
  passwordInput.focus();
});

/* ---------- Báo lỗi từng trường ---------- */
function setFieldError(input, errorEl, message) {
  if (message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
    input.classList.add('is-invalid');
  } else {
    errorEl.textContent = '';
    errorEl.hidden = true;
    input.classList.remove('is-invalid');
  }
}

usernameInput.addEventListener('input', () => setFieldError(usernameInput, usernameError, ''));
passwordInput.addEventListener('input', () => setFieldError(passwordInput, passwordError, ''));

/* ---------- Gửi form ---------- */
form.addEventListener('submit', (e) => {
  e.preventDefault();
  formError.hidden = true;

  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  let valid = true;

  if (!username) {
    setFieldError(usernameInput, usernameError, 'Vui lòng nhập tên đăng nhập.');
    valid = false;
  }
  if (!password) {
    setFieldError(passwordInput, passwordError, 'Vui lòng nhập mật khẩu.');
    valid = false;
  }
  if (!valid) return;

  const user = DEMO_USERS.find((u) => u.username === username && u.password === password);

  if (!user) {
    formError.textContent = 'Sai tên đăng nhập hoặc mật khẩu. Vui lòng thử lại.';
    formError.hidden = false;
    card.classList.remove('is-shake');
    void card.offsetWidth;
    card.classList.add('is-shake');
    passwordInput.select();
    return;
  }

  sessionStorage.setItem(AUTH_KEY, '1');
  sessionStorage.setItem(USER_KEY, user.name);
  btnLogin.disabled = true;
  btnLogin.textContent = 'Đang đăng nhập...';
  location.replace('dashboard.html');
});

/* ---------- Quay lại ---------- */
$('#btnBack').addEventListener('click', (e) => {
  e.preventDefault();
  if (history.length > 1) history.back();
});
