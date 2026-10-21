/* =========================================================
   SmartAgri — Logic trang đăng nhập
   1) Hiện / ẩn mật khẩu
   2) Kiểm tra dữ liệu nhập (validation)
   3) Đăng nhập giả lập + thông báo + chuyển trang
   ========================================================= */

// Tài khoản demo (mô phỏng dữ liệu trả về từ server)
const accounts = [
  { username: 'nongdan', password: '123456', role: 'Nông dân' },
  { username: 'chuyen_gia', password: 'agri2026', role: 'Chuyên gia' }
];

const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const usernameError = document.getElementById('usernameError');
const passwordError = document.getElementById('passwordError');
const submitBtn = document.getElementById('submitBtn');
const btnText = submitBtn.querySelector('.btn-text');
const toggleBtn = document.getElementById('togglePassword');
const toast = document.getElementById('toast');

const EYE_ON = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 5c-4.4 0-8.2 2.6-10 6.5C3.8 15.4 7.6 18 12 18s8.2-2.6 10-6.5C20.2 7.6 16.4 5 12 5Zm0 10.5A4 4 0 1 1 12 8a4 4 0 0 1 0 7.5Z"/></svg>';
const EYE_OFF = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 5c-4.4 0-8.2 2.6-10 6.5C3.8 15.4 7.6 18 12 18s8.2-2.6 10-6.5C20.2 7.6 16.4 5 12 5Zm0 10.5A4 4 0 1 1 12 8a4 4 0 0 1 0 7.5Z"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M4 20 20 4"/></svg>';

let toastTimer = null;

/* ---------- 1. Hiện / ẩn mật khẩu ---------- */
toggleBtn.addEventListener('click', function () {
  const isHidden = passwordInput.type === 'password';
  passwordInput.type = isHidden ? 'text' : 'password';
  toggleBtn.classList.toggle('is-on', isHidden);
  toggleBtn.innerHTML = isHidden ? EYE_OFF : EYE_ON;
  toggleBtn.setAttribute('aria-pressed', String(isHidden));
  toggleBtn.setAttribute('aria-label', isHidden ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
  passwordInput.focus();
});

/* ---------- 2. Validation ---------- */
function setFieldError(input, errorEl, message) {
  errorEl.textContent = message;
  input.classList.toggle('is-invalid', message !== '');
}

function validate() {
  const user = usernameInput.value.trim();
  const pass = passwordInput.value;
  let ok = true;

  if (user === '') {
    setFieldError(usernameInput, usernameError, 'Bạn chưa nhập tên người dùng.');
    ok = false;
  } else if (user.length < 4) {
    setFieldError(usernameInput, usernameError, 'Tên người dùng phải có ít nhất 4 ký tự.');
    ok = false;
  } else {
    setFieldError(usernameInput, usernameError, '');
  }

  if (pass === '') {
    setFieldError(passwordInput, passwordError, 'Bạn chưa nhập mật khẩu.');
    ok = false;
  } else if (pass.length < 6) {
    setFieldError(passwordInput, passwordError, 'Mật khẩu phải có ít nhất 6 ký tự.');
    ok = false;
  } else {
    setFieldError(passwordInput, passwordError, '');
  }

  return ok;
}

usernameInput.addEventListener('input', function () {
  setFieldError(usernameInput, usernameError, '');
});

passwordInput.addEventListener('input', function () {
  setFieldError(passwordInput, passwordError, '');
});

/* ---------- 3. Đăng nhập giả lập ---------- */
function findAccount(user, pass) {
  for (let i = 0; i < accounts.length; i += 1) {
    if (accounts[i].username === user && accounts[i].password === pass) {
      return accounts[i];
    }
  }
  return null;
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  btnText.innerHTML = isLoading
    ? '<span class="spinner" aria-hidden="true"></span>Đang đăng nhập...'
    : 'Đăng nhập';
}

function failLogin(message) {
  setFieldError(passwordInput, passwordError, message);
  submitBtn.classList.add('is-shaking');
  setTimeout(function () {
    submitBtn.classList.remove('is-shaking');
  }, 500);
  showToast(message, true);
}

function showToast(message, isError) {
  toast.textContent = message;
  toast.classList.toggle('is-error', Boolean(isError));
  toast.hidden = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.hidden = true;
  }, 2600);
}

loginForm.addEventListener('submit', function (event) {
  event.preventDefault();
  if (!validate()) return;

  const user = usernameInput.value.trim();
  const pass = passwordInput.value;

  setLoading(true);

  // Giả lập thời gian gọi API để giao diện có phản hồi với người dùng
  setTimeout(function () {
    const account = findAccount(user, pass);

    if (!account) {
      setLoading(false);
      failLogin('Sai tên đăng nhập hoặc mật khẩu.');
      return;
    }

    setLoading(false);
    showToast('Xin chào ' + account.role + '! Đang mở bảng điều khiển...', false);
    setTimeout(function () {
      window.location.href = 'index.html';
    }, 1000);
  }, 1200);
});
