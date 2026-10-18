/* =========================================================
   SmartAgri — shell.js
   Dựng khung trang dùng chung (sprite + sidebar + topbar +
   modal + toast) cho các trang: AI Cảnh báo, Nông hộ & HTX,
   Thư viện, Quản lý chuyên gia, Báo cáo, Cài đặt.
   Trang chỉ cần: <body data-page="..." data-title="..." data-sub="...">
   và một <main class="board">...</main>.
   ========================================================= */

const SA_ICONS = `
<symbol id="i-home" viewBox="0 0 24 24"><path d="M4 10.5 12 4l8 6.5V20H4v-9.5Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></symbol>
<symbol id="i-sprout" viewBox="0 0 24 24"><path d="M12 20v-8m0 0c0-3.3-2.7-6-6-6 0 3.3 2.7 6 6 6Zm0 0c0-3.3 2.7-6 6-6 0 3.3-2.7 6-6 6Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
<symbol id="i-ai" viewBox="0 0 24 24"><rect x="3.5" y="6" width="17" height="13" rx="3" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="9" cy="12.5" r="1.3" fill="currentColor"/><circle cx="15" cy="12.5" r="1.3" fill="currentColor"/><path d="M12 6V3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
<symbol id="i-chat" viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4V5Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></symbol>
<symbol id="i-users" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M16 6.2A3 3 0 0 1 16 12m1 8c0-2-.6-3.4-1.6-4.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
<symbol id="i-book" viewBox="0 0 24 24"><path d="M5 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H5V4Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M19 4h-6v14h6V4Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></symbol>
<symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
<symbol id="i-chart" viewBox="0 0 24 24"><path d="M4 20h16M7 20v-6m5 6V7m5 13v-9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
<symbol id="i-gear" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
<symbol id="i-bell" viewBox="0 0 24 24"><path d="M7 10a5 5 0 0 1 10 0c0 4 1.5 5.5 1.5 5.5h-13S7 14 7 10Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M10.2 18.5a2 2 0 0 0 3.6 0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
<symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
<symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 8v4.5l3 1.8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
<symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></symbol>
<symbol id="i-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-chevron" viewBox="0 0 24 24"><path d="m7 10 5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-logout" viewBox="0 0 24 24"><path d="M15 4H6v16h9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 12h9m0 0-3.4-3.4M20 12l-3.4 3.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-drop" viewBox="0 0 24 24"><path d="M12 3.5c3.5 4 6 6.8 6 10a6 6 0 0 1-12 0c0-3.2 2.5-6 6-10Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></symbol>
<symbol id="i-rain" viewBox="0 0 24 24"><path d="M7 15a4 4 0 0 1 .6-7.9 5 5 0 0 1 9.3 1.4A3.5 3.5 0 0 1 17 15H7Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9 18.5 8 21m5-2.5L12 21m5-2.5L16 21" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
<symbol id="i-leaf" viewBox="0 0 24 24"><path d="M5 19C5 10 11 5 20 4.5 19.5 13 14 19 5 19Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M5 19c3-4 6.5-6.5 10-8.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
<symbol id="i-flask" viewBox="0 0 24 24"><path d="M10 3h4M11 3v6L5.5 19a1.5 1.5 0 0 0 1.3 2.2h10.4A1.5 1.5 0 0 0 18.5 19L13 9V3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></symbol>
<symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 3v2.3M12 18.7V21M3 12h2.3M18.7 12H21M5.8 5.8l1.6 1.6M16.6 16.6l1.6 1.6M18.2 5.8l-1.6 1.6M7.4 16.6l-1.6 1.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
<symbol id="i-wind" viewBox="0 0 24 24"><path d="M3 8.5h10.5a2.8 2.8 0 1 0-2.8-2.8M3 12.5h14.5a2.8 2.8 0 1 1-2.8 2.8M3 16.5h7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
<symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 21s-6.5-5.4-6.5-10a6.5 6.5 0 0 1 13 0C18.5 15.6 12 21 12 21Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="12" cy="10.6" r="2.3" fill="currentColor"/></symbol>
<symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3l7 2.6v5.2c0 4.6-3 8.2-7 10.2-4-2-7-5.6-7-10.2V5.6Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="m9 11.6 2.2 2.2 4.2-4.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-calendar" viewBox="0 0 24 24"><rect x="4" y="5.5" width="16" height="15" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M4 10.5h16M8.5 3.5v4M15.5 3.5v4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
<symbol id="i-camera" viewBox="0 0 24 24"><path d="M4 8.5h3.2L8.8 6h6.4l1.6 2.5H20v10H4Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.2" fill="none" stroke="currentColor" stroke-width="1.7"/></symbol>
<symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m16 16 4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
<symbol id="i-trash" viewBox="0 0 24 24"><path d="M4.5 7h15M9.5 7V5h5v2M6.5 7l1 13h9l1-13" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M10.5 10.5v6m3-6v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></symbol>
<symbol id="i-pencil" viewBox="0 0 24 24"><path d="M4.5 19.5h4L19 9a2.1 2.1 0 0 0-3-3L5.5 16.5v3Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M15 6.5 18 9.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
<symbol id="i-refresh" viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M20 4v4.5h-4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-image" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="14" rx="2.4" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="8.8" cy="10" r="1.6" fill="currentColor"/><path d="m5 17 4.5-4.5L13 16l3-2.5L19 17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-alert" viewBox="0 0 24 24"><path d="M12 4 21 19H3L12 4Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M12 10v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="16.6" r="1.1" fill="currentColor"/></symbol>
<symbol id="i-download" viewBox="0 0 24 24"><path d="M12 4v10m0 0-3.6-3.6M12 14l3.6-3.6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.5 17.5V20h15v-2.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
<symbol id="i-file" viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6V3Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M14 3v4h4M9 12h6M9 16h6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></symbol>
<symbol id="i-play" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.4" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="m10 8.6 6 3.4-6 3.4V8.6Z" fill="currentColor"/></symbol>
<symbol id="i-star" viewBox="0 0 24 24"><path d="m12 4 2.4 5 5.4.7-4 3.7 1 5.4-4.8-2.7-4.8 2.7 1-5.4-4-3.7 5.4-.7L12 4Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></symbol>
<symbol id="i-trend" viewBox="0 0 24 24"><path d="M4 16.5 10 10l3.5 3.5L20 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.5 7H20v4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-send" viewBox="0 0 24 24"><path d="M4 12 20 4l-7 16-2.2-6.6L4 12Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></symbol>
<symbol id="i-eye" viewBox="0 0 24 24"><path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12S18 18.2 12 18.2 2.5 12 2.5 12Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="12" cy="12" r="2.8" fill="none" stroke="currentColor" stroke-width="1.7"/></symbol>
<symbol id="i-sliders" viewBox="0 0 24 24"><path d="M4 8h11M19 8h1M4 16h5M13 16h7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="17" cy="8" r="2.2" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="11" cy="16" r="2.2" fill="none" stroke="currentColor" stroke-width="1.7"/></symbol>`;

const SA_NAV = [
  { key: 'overview', href: 'dashboard.html', icon: 'i-home', label: 'Tổng quan' },
  { key: 'journal', href: 'journal.html', icon: 'i-sprout', label: 'Nhật ký canh đồng' },
  { key: 'alerts', href: 'alerts.html', icon: 'i-ai', label: 'AI Cảnh báo & Dự báo' },
  { key: 'support', href: 'index.html', icon: 'i-chat', label: 'Yêu cầu hỗ trợ' },
  { key: 'households', href: 'households.html', icon: 'i-users', label: 'Nông hộ & HTX' },
  { key: 'library', href: 'library.html', icon: 'i-book', label: 'Thư viện tài nguyên' },
  { key: 'experts', href: 'experts.html', icon: 'i-user', label: 'Quản lý chuyên gia' },
  { key: 'reports', href: 'reports.html', icon: 'i-chart', label: 'Báo cáo & Thống kê' },
  { key: 'settings', href: 'settings.html', icon: 'i-gear', label: 'Cài đặt hệ thống' }
];

/* Danh sách thông báo do Trợ lý AI AgrBrain sinh từ dữ liệu 6 trang. */

(function buildShell() {
  const body = document.body;
  const page = body.dataset.page || '';
  const title = body.dataset.title || 'SmartAgri';
  const sub = body.dataset.sub || '';
  const main = body.querySelector('main');

  const navHtml = SA_NAV.map((n) =>
    '<li><a class="nav__item' + (n.key === page ? ' nav__item--active' : '') + '" href="' + n.href + '"' +
    (n.key === page ? ' aria-current="page"' : '') + '><svg class="icon"><use href="#' + n.icon + '"></use></svg><span>' +
    n.label + '</span></a></li>').join('');

  const shell = document.createElement('div');
  shell.innerHTML =
    '<svg hidden aria-hidden="true">' + SA_ICONS + '</svg>' +
    '<div class="layout" id="layout">' +
      '<aside class="sidebar" id="sidebar" aria-label="Menu chính">' +
        '<a class="brand" href="dashboard.html" aria-label="SmartAgri — Trang tổng quan">' +
          '<img class="brand__logo" src="assets/logo.svg" alt="">' +
          '<span class="brand__text"><span class="brand__name">SmartAgri</span>' +
          '<span class="brand__tag">Trí tuệ cho mùa vàng</span></span></a>' +
        '<nav class="nav" aria-label="Điều hướng chính"><ul class="nav__list">' + navHtml + '</ul></nav>' +
        '<button class="assistant" type="button" id="btnAssistant">' +
          '<span class="assistant__badge">AI</span><span>Trợ lý AI AgrBrain</span></button>' +
        '<svg class="sidebar__plants" viewBox="0 0 200 120" aria-hidden="true">' +
          '<path d="M20 120C18 84 34 62 62 52c-6 34-22 56-42 68Z" fill="#cfe6c4"/>' +
          '<path d="M46 120C52 92 70 76 96 70c-8 28-26 46-50 50Z" fill="#a9d59a"/>' +
          '<path d="M150 120c6-38 26-58 44-64-2 34-18 56-44 64Z" fill="#8cc47c"/>' +
          '<path d="M112 120c2-26 14-42 34-50-4 26-16 42-34 50Z" fill="#cfe6c4"/>' +
          '<path d="M0 120h200" stroke="#8cc47c" stroke-width="3"/></svg>' +
        '<button class="sidebar__logout" type="button" id="btnLogout">' +
          '<svg class="icon"><use href="#i-logout"></use></svg><span>Đăng xuất</span></button>' +
      '</aside>' +
      '<div class="scrim" id="scrim" hidden></div>' +
      '<div class="content">' +
        '<header class="topbar">' +
          '<button class="icon-btn" id="btnMenu" type="button" aria-label="Mở hoặc đóng menu">' +
            '<svg class="icon"><use href="#i-menu"></use></svg></button>' +
          '<div class="topbar__titles"><h1>' + title + '</h1>' +
            (sub ? '<p class="topbar__greet"><svg class="icon"><use href="#i-leaf"></use></svg>' + sub + '</p>' : '') +
          '</div>' +
          '<div class="topbar__actions"><div class="notif">' +
            '<button class="icon-btn" id="btnBell" type="button" aria-label="Thông báo" aria-expanded="false">' +
              '<svg class="icon"><use href="#i-bell"></use></svg>' +
              '<span class="notif__count" id="notifCount" hidden></span></button>' +
            '<section class="notif__panel" id="notifPanel" hidden aria-label="Danh sách thông báo">' +
              '<h2 class="notif__title">Thông báo</h2>' +
              '<p class="notif__hint">Bấm vào một thông báo để mở đúng mục cần xử lý.</p>' +
              '<ul class="notif__list" id="notifList"></ul></section>' +
          '</div>' +
          '<div class="account-wrap"><button class="account" type="button" id="btnAccount" aria-expanded="false" aria-haspopup="true">' +
            '<span class="avatar" aria-hidden="true">NN</span>' +
            '<span class="account__text"><strong>Nguyễn Văn Nam</strong>' +
            '<small>Chuyên gia nông nghiệp</small></span>' +
            '<svg class="icon account__chevron"><use href="#i-chevron"></use></svg></button>' +
            '<section class="account__panel" id="accountPanel" hidden aria-label="Tài khoản chuyên gia">' +
              '<header class="account__head"><span class="avatar avatar--lg" id="accAvatar" aria-hidden="true">NN</span>' +
                '<span class="account__who"><strong id="accName">Nguyễn Văn Nam</strong>' +
                '<small id="accMail">chuyengia@smartagri.vn</small></span></header>' +
              '<ul class="account__menu">' +
                '<li><a href="experts.html"><svg class="icon"><use href="#i-user"></use></svg> Hồ sơ chuyên gia</a></li>' +
                '<li><a href="index.html"><svg class="icon"><use href="#i-chat"></use></svg> Yêu cầu đang phụ trách</a></li>' +
                '<li><a href="journal.html"><svg class="icon"><use href="#i-sprout"></use></svg> Nhật ký canh đồng</a></li>' +
                '<li><a href="settings.html"><svg class="icon"><use href="#i-gear"></use></svg> Cài đặt hệ thống</a></li>' +
              '</ul>' +
              '<button class="account__logout" type="button" id="accLogout">' +
                '<svg class="icon"><use href="#i-logout"></use></svg> Đăng xuất</button>' +
            '</section></div>' +
          '</div>' +
        '</header>' +
        '<footer class="footer"><p>SmartAgri — Nền tảng hỗ trợ nông hộ và HTX · Học phần CSE122</p></footer>' +
      '</div>' +
    '</div>' +
    '<div class="modal" id="modal" hidden><div class="modal__backdrop" data-close></div>' +
      '<section class="modal__box" role="dialog" aria-modal="true" aria-labelledby="modalTitle">' +
        '<header class="modal__head"><h2 id="modalTitle">Tiêu đề</h2>' +
        '<button class="icon-btn" type="button" id="modalClose" aria-label="Đóng hộp thoại">' +
        '<svg class="icon"><use href="#i-close"></use></svg></button></header>' +
        '<div class="modal__body" id="modalBody"></div>' +
        '<footer class="modal__foot" id="modalFoot"></footer></section></div>' +
    '<p class="toast" id="toast" role="status" aria-live="polite"></p>';

  body.insertBefore(shell, body.firstChild);
  if (main) shell.querySelector('.content').insertBefore(main, shell.querySelector('.footer'));

  /* ---------- Hành vi dùng chung ---------- */
  const $ = (sel) => document.querySelector(sel);
  const layout = $('#layout');
  const scrim = $('#scrim');
  const toast = $('#toast');
  const notifList = $('#notifList');
  const notifPanel = $('#notifPanel');
  const btnBell = $('#btnBell');
  const modal = $('#modal');
  let toastTimer, lastFocused = null;

  /* Desktop: bấm ☰ để thu gọn/ mở lại sidebar. Mobile (≤1024px): drawer + scrim. */
  const btnMenu = $('#btnMenu');
  const isDesktopNav = () => window.matchMedia('(min-width: 1025px)').matches;

  function setNav(open) {
    if (isDesktopNav()) {
      layout.classList.toggle('nav-closed', !open);
      layout.classList.remove('nav-open');
      scrim.hidden = true;
      sessionStorage.setItem('smartagri_nav', open ? 'open' : 'closed');
    } else {
      layout.classList.toggle('nav-open', open);
      scrim.hidden = !open;
    }
    btnMenu.setAttribute('aria-expanded', String(open));
  }

  btnMenu.setAttribute('aria-expanded', String(isDesktopNav()));
  if (isDesktopNav() && sessionStorage.getItem('smartagri_nav') === 'closed') setNav(false);

  btnMenu.addEventListener('click', () => {
    const open = isDesktopNav()
      ? layout.classList.contains('nav-closed')
      : !layout.classList.contains('nav-open');
    setNav(open);
  });
  scrim.addEventListener('click', () => setNav(false));

  function doLogout() {
    sessionStorage.removeItem('smartagri_auth');
    sessionStorage.removeItem('smartagri_user');
    location.replace('login.html');
  }
  $('#btnLogout').addEventListener('click', doLogout);

  function showToast(message, kind) {
    toast.textContent = message;
    toast.className = 'toast is-show' + (kind ? ' is-' + kind : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.className = 'toast'; }, 2800);
  }

  if (window.AgrBrain) window.AgrBrain.renderNotifications(notifList, $('#notifCount'));

  /* Deep link: cuộn tới và báo sáng đúng mục cần xử lý */
  function revealTarget() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('is-target');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const field = ['[contenteditable="true"]', 'textarea', 'input:not([type=hidden]), select']
      .map((sel) => el.querySelector(sel)).find(Boolean);
    if (field) field.focus({ preventScroll: true });
    setTimeout(() => el.classList.remove('is-target'), 2400);
  }
  window.addEventListener('load', revealTarget);
  window.addEventListener('hashchange', revealTarget);

  btnBell.addEventListener('click', () => {
    const open = notifPanel.hidden;
    if (open && window.AgrBrain) window.AgrBrain.renderNotifications(notifList, $('#notifCount'));
    notifPanel.hidden = !open;
    btnBell.setAttribute('aria-expanded', String(open));
  });
  /* Menu tài khoản chuyên gia */
  const btnAccount = $('#btnAccount');
  const accountPanel = $('#accountPanel');
  const userName = sessionStorage.getItem('smartagri_user') || 'Nguyễn Văn Nam';
  const nameParts = userName.trim().split(/\s+/);
  const initials = (nameParts[0][0] + (nameParts[nameParts.length - 1][0] || '')).toUpperCase();

  btnAccount.querySelector('.account__text strong').textContent = userName;
  btnAccount.querySelector('.avatar').textContent = initials;
  $('#accName').textContent = userName;
  $('#accAvatar').textContent = initials;

  btnAccount.addEventListener('click', () => {
    const open = accountPanel.hidden;
    accountPanel.hidden = !open;
    notifPanel.hidden = true;
    btnBell.setAttribute('aria-expanded', 'false');
    btnAccount.setAttribute('aria-expanded', String(open));
  });
  $('#accLogout').addEventListener('click', doLogout);

  document.addEventListener('click', (e) => {
    if (!notifPanel.hidden && !e.target.closest('.notif')) {
      notifPanel.hidden = true;
      btnBell.setAttribute('aria-expanded', 'false');
    }
    if (!accountPanel.hidden && !e.target.closest('.account-wrap')) {
      accountPanel.hidden = true;
      btnAccount.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !accountPanel.hidden) {
      accountPanel.hidden = true;
      btnAccount.setAttribute('aria-expanded', 'false');
      btnAccount.focus();
    }
  });

  function openModal(title, bodyNode, actions) {
    lastFocused = document.activeElement;
    $('#modalTitle').textContent = title;
    const mb = $('#modalBody');
    const mf = $('#modalFoot');
    mb.innerHTML = '';
    mb.appendChild(bodyNode);
    mf.innerHTML = '';
    (actions || []).forEach((a) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn ' + (a.primary ? 'btn--primary' : a.danger ? 'btn--danger' : 'btn--muted');
      btn.textContent = a.label;
      btn.addEventListener('click', a.onClick);
      mf.appendChild(btn);
    });
    modal.hidden = false;
    const first = mb.querySelector('select, textarea, input, button');
    if (first) first.focus();
  }
  function closeModal() {
    modal.hidden = true;
    if (lastFocused) lastFocused.focus();
  }
  $('#modalClose').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target.hasAttribute('data-close')) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  /* Nút Trợ lý AI do js/agrbrain.js đảm nhiệm (click + số việc ưu tiên). */
  if (window.AgrBrain) window.AgrBrain.bind();

  /* API cho js/pages.js */
  window.SA = {
    $: $,
    qa: (sel) => Array.from(document.querySelectorAll(sel)),
    icon: (id) => '<svg class="icon"><use href="#' + id + '"></use></svg>',
    showToast: showToast,
    openModal: openModal,
    closeModal: closeModal,
    page: page
  };

  document.dispatchEvent(new CustomEvent('sa:ready'));
})();
