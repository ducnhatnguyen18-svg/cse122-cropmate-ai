/* =========================================================
   CropMate AI — Shared navigation (sidebar + topbar) + role guard
   Mọi trang role chỉ cần 3 thẻ script: main.js, api.js, nav.js
   và 2 slot: <aside id="sidebar"> + <header id="topbar">
   ========================================================= */
(function (global) {
  const App = global.App || (global.App = { state: {} });

  // ---- Role → menu mapping ----
  const ROLE_LABEL = {
    farmer: "Nông dân",
    expert: "Chuyên gia",
    coordinator: "Điều phối HTX",
    admin: "Quản trị viên",
  };

  const HOME_BY_ROLE = {
    farmer: "farmer-season-dashboard.html",
    expert: "expert-request-queue.html",
    coordinator: "coordinator-farm-overview.html",
    admin: "admin-dashboard.html",
  };

  const MENU = {
    farmer: [
      { file: "farmer-season-dashboard.html", label: "Season Dashboard", icon: "🌾" },
      { file: "farmer-field-log.html", label: "Field Log", icon: "📓" },
      { file: "farmer-help-request.html", label: "Help Request", icon: "🆘" },
    ],
    expert: [
      { file: "expert-request-queue.html", label: "Request Queue", icon: "📥" },
      { file: "expert-request-detail.html", label: "Request Detail", icon: "🔎" },
      { file: "expert-resource-library.html", label: "Resource Library", icon: "📚" },
    ],
    coordinator: [
      { file: "coordinator-farm-overview.html", label: "Farm Overview", icon: "🗺️" },
      { file: "coordinator-calendar.html", label: "Calendar", icon: "📅" },
      { file: "coordinator-season-summary.html", label: "Season Summary", icon: "📊" },
    ],
    admin: [
      { file: "admin-dashboard.html", label: "Dashboard", icon: "📈" },
      { file: "admin-crop-management.html", label: "Crop Management", icon: "🌱" },
      { file: "admin-user-management.html", label: "User Management", icon: "👥" },
    ],
  };

  // ---- Helpers ----
  function currentFile() {
    return location.pathname.split("/").pop() || "index.html";
  }

  function roleFromFile(file) {
    const m = file.match(/^(farmer|expert|coordinator|admin)-/);
    return m ? m[1] : null;
  }

  // ---- Role guard: trang của role khác → 403 ----
  function guard() {
    const file = currentFile();
    const required = roleFromFile(file);
    if (!required) return true; // index/login/403/404/profile: public
    const current = App.state.role;
    if (current && current !== required) {
      location.replace("403.html");
      return false;
    }
    if (!current) {
      location.replace("login.html");
      return false;
    }
    return true;
  }

  // ---- Render sidebar ----
  function renderSidebar() {
    const el = document.getElementById("sidebar");
    if (!el) return;
    const role = App.state.role || "farmer";
    const active = currentFile();
    const items = MENU[role] || [];

    const links = items
      .map(
        (it) => `
      <a class="nav-link${it.file === active ? " nav-link--active" : ""}"
         href="${it.file}" aria-current="${it.file === active ? "page" : "false"}">
        <span class="nav-icon" aria-hidden="true">${it.icon}</span>
        <span>${it.label}</span>
      </a>`
      )
      .join("");

    el.innerHTML = `
      <div class="brand">
        <span class="brand-mark" aria-hidden="true">🌿</span>
        <span class="brand-name">CropMate <strong>AI</strong></span>
      </div>
      <nav class="nav" aria-label="Điều hướng chính">
        ${links}
      </nav>
      <div class="nav-footer">
        <a class="nav-link" href="index.html"><span class="nav-icon">🏠</span><span>Trang chủ</span></a>
        <button class="nav-link nav-link--btn" id="switch-role" type="button">
          <span class="nav-icon">🔄</span><span>Đổi vai trò</span>
        </button>
        <button class="nav-link nav-link--btn" id="logout" type="button">
          <span class="nav-icon">⎋</span><span>Đăng xuất</span>
        </button>
      </div>`;

    const sw = document.getElementById("switch-role");
    if (sw) sw.addEventListener("click", () => (location.href = "login.html"));
    const lo = document.getElementById("logout");
    if (lo)
      lo.addEventListener("click", () => {
        localStorage.removeItem("cm_role");
        localStorage.removeItem("cm_user");
        location.href = "login.html";
      });
  }

  // ---- Render topbar ----
  function renderTopbar(title) {
    const el = document.getElementById("topbar");
    if (!el) return;
    const role = App.state.role || "guest";
    const label = ROLE_LABEL[role] || "Khách";
    el.innerHTML = `
      <button class="icon-btn" id="nav-toggle" aria-label="Mở menu" type="button">☰</button>
      <h1 class="topbar-title">${title || document.title || "CropMate AI"}</h1>
      <div class="topbar-right">
        <span class="badge badge--success">${label}</span>
      </div>`;
    const toggle = document.getElementById("nav-toggle");
    const sb = document.getElementById("sidebar");
    if (toggle && sb) toggle.addEventListener("click", () => sb.classList.toggle("sidebar--open"));
  }

  // ---- Boot ----
  function boot() {
    if (!guard()) return;
    renderSidebar();
    renderTopbar();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  global.Nav = { MENU, ROLE_LABEL, HOME_BY_ROLE, renderTopbar, currentFile };
})(window);
