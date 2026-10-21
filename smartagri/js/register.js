/* =========================================================
   SmartAgri — Logic trang đăng ký
   1) Kiểm tra định dạng từng trường (validation)
   2) Tự động tính tuổi từ năm sinh
   3) Chống trùng số điện thoại bằng localStorage
   4) Đăng ký giả lập + thông báo + quay về trang đăng nhập
   ========================================================= */

const STORAGE_KEY = 'smartagri_accounts';
const MIN_AGE = 16;
const CURRENT_YEAR = new Date().getFullYear();

const registerForm = document.getElementById('registerForm');
const phoneInput = document.getElementById('phone');
const fullnameInput = document.getElementById('fullname');
const birthYearInput = document.getElementById('birthYear');
const addressInput = document.getElementById('address');
const phoneError = document.getElementById('phoneError');
const fullnameError = document.getElementById('fullnameError');
const birthYearError = document.getElementById('birthYearError');
const addressError = document.getElementById('addressError');
const ageHint = document.getElementById('ageHint');
const submitBtn = document.getElementById('submitBtn');
const btnText = submitBtn.querySelector('.btn-text');
const toast = document.getElementById('toast');

let toastTimer = null;

/* ---------- Lưu tài khoản đã đăng ký (localStorage thay database) ---------- */
function loadAccounts() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveAccount(account) {
  const list = loadAccounts();
  list.push(account);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/* ---------- Helper báo lỗi ---------- */
function setError(input, errorEl, message) {
  errorEl.textContent = message;
  input.classList.toggle('is-invalid', message !== '');
}

/* ---------- 1. Validation ---------- */
function validatePhone() {
  const value = phoneInput.value.trim();
  const digits = value.replace(/[.\s-]/g, '');

  if (value === '') return 'Bạn chưa nhập số điện thoại.';
  if (!/^(\+?84|0)\d{9,10}$/.test(digits)) return 'Số điện thoại không hợp lệ (ví dụ 0912345678).';
  return '';
}

function validateFullname() {
  const value = fullnameInput.value.trim();

  if (value === '') return 'Bạn chưa nhập họ tên.';
  if (value.length < 3) return 'Họ tên phải có ít nhất 3 ký tự.';
  if (!/^[A-Za-zÀ-ỹ\s.]+$/.test(value)) return 'Họ tên không được chứa số hoặc ký tự đặc biệt.';
  return '';
}

function validateBirthYear() {
  const raw = birthYearInput.value.trim();

  if (raw === '') return 'Bạn chưa nhập năm sinh.';
  const year = Number(raw);
  if (!Number.isInteger(year)) return 'Năm sinh phải là số nguyên.';
  if (year < 1930 || year > CURRENT_YEAR) return 'Năm sinh không hợp lệ.';
  if (CURRENT_YEAR - year < MIN_AGE) return 'Bạn phải đủ ' + MIN_AGE + ' tuổi để đăng ký.';
  return '';
}

function validateAddress() {
  const value = addressInput.value.trim();

  if (value === '') return 'Bạn chưa nhập địa chỉ.';
  if (value.length < 5) return 'Địa chỉ phải có ít nhất 5 ký tự.';
  return '';
}

function validateAll() {
  const checks = [
    [phoneInput, phoneError, validatePhone()],
    [fullnameInput, fullnameError, validateFullname()],
    [birthYearInput, birthYearError, validateBirthYear()],
    [addressInput, addressError, validateAddress()]
  ];

  let ok = true;
  checks.forEach(function (item) {
    setError(item[0], item[1], item[2]);
    if (item[2] !== '') ok = false;
  });
  return ok;
}

/* ---------- 2. Tính tuổi khi gõ năm sinh ---------- */
birthYearInput.addEventListener('input', function () {
  const year = Number(birthYearInput.value.trim());
  const age = CURRENT_YEAR - year;

  if (Number.isInteger(year) && year >= 1930 && year <= CURRENT_YEAR) {
    ageHint.textContent = 'Đó là ' + age + ' tuổi.';
  } else {
    ageHint.textContent = '';
  }
});

/* ---------- 3. Xoá lỗi khi người dùng gõ lại ---------- */
[[phoneInput, phoneError], [fullnameInput, fullnameError],
 [birthYearInput, birthYearError], [addressInput, addressError]].forEach(function (pair) {
  pair[0].addEventListener('input', function () {
    setError(pair[0], pair[1], '');
  });
});

/* ---------- Toast ---------- */
function showToast(message, isError) {
  toast.textContent = message;
  toast.classList.toggle('is-error', Boolean(isError));
  toast.hidden = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.hidden = true;
  }, 2800);
}

function failSubmit(message) {
  showToast(message, true);
  submitBtn.classList.add('is-shaking');
  setTimeout(function () {
    submitBtn.classList.remove('is-shaking');
  }, 500);
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  btnText.innerHTML = isLoading
    ? '<span class="spinner" aria-hidden="true"></span>Đang gửi...'
    : 'Đăng Ký';
}

/* ---------- 4. Xử lý đăng ký ---------- */
registerForm.addEventListener('submit', function (event) {
  event.preventDefault();

  if (!validateAll()) return;

  const phone = phoneInput.value.trim().replace(/[.\s-]/g, '');
  const exists = loadAccounts().some(function (item) {
    return item.phone === phone;
  });

  if (exists) {
    setError(phoneInput, phoneError, 'Số điện thoại này đã đăng ký rồi.');
    failSubmit('Số điện thoại này đã đăng ký rồi.');
    return;
  }

  setLoading(true);

  // Giả lập thời gian gửi dữ liệu lên server
  setTimeout(function () {
    saveAccount({
      phone: phone,
      fullname: fullnameInput.value.trim(),
      birthYear: Number(birthYearInput.value.trim()),
      address: addressInput.value.trim()
    });

    setLoading(false);
    showToast('Đăng ký thành công! Đang quay về trang đăng nhập...', false);

    setTimeout(function () {
      window.location.href = 'login.html';
    }, 1400);
  }, 1200);
});
