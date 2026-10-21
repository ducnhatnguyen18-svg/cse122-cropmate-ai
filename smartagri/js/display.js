/* =========================================================
   SmartAgri — Áp dụng tuỳ chọn "Giao diện" đã lưu lên MỌI trang.
   Nạp ở <head> (trước CSS của trang) để không bị nháy chữ.
   Đọc cùng khoá localStorage với trang Cài đặt: smartagri.settings.v1
   ========================================================= */

(function () {
  const SETTINGS_KEY = 'smartagri.settings.v1';
  const root = document.documentElement;

  function apply(fs, contrast, motion) {
    root.classList.remove('fs-sm', 'fs-lg', 'fs-xl');
    if (fs === '14') root.classList.add('fs-sm');
    if (fs === '17') root.classList.add('fs-lg');
    if (fs === '19') root.classList.add('fs-xl');

    root.classList.toggle('high-contrast', Boolean(contrast));
    root.classList.toggle('no-motion', Boolean(motion));
  }

  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return apply('15', false, false);

    const saved = JSON.parse(raw);
    const display = (saved && saved.display) || {};
    apply(display.fs || '15', display.contrast, display.motion);
  } catch (error) {
    // localStorage bị chặn hoặc dữ liệu hỏng: dùng giao diện mặc định.
    apply('15', false, false);
  }
})();
