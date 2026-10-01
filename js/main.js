/* =========================================================
   CropMate AI — App bootstrap: navigation, shared state, UI helpers
   ========================================================= */
(function (global) {
  const App = {};

  // ---- Shared UI state (role, current user) ----
  App.state = {
    role: localStorage.getItem("cm_role") || "farmer",
    user: JSON.parse(localStorage.getItem("cm_user") || "null"),
  };

  App.setRole = function (role) {
    App.state.role = role;
    localStorage.setItem("cm_role", role);
  };

  // ---- Toast (success / error / info) ----
  App.toast = function (message, type = "info") {
    let host = document.getElementById("toast-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "toast-host";
      host.style.cssText = "position:fixed;top:16px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:8px;";
      document.body.appendChild(host);
    }
    const el = document.createElement("div");
    el.className = `card badge--${type === "error" ? "danger" : type === "success" ? "success" : "info"}`;
    el.textContent = message;
    host.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  };

  // ---- Empty / loading / error state renderers ----
  App.renderState = function (container, kind, text) {
    if (!container) return;
    const labels = {
      empty: text || "Chưa có dữ liệu.",
      loading: "Đang tải…",
      error: text || "Đã xảy ra lỗi. Vui lòng thử lại.",
    };
    container.innerHTML = `<div class="state" data-state="${kind}">${labels[kind] || ""}</div>`;
  };

  // ---- Simple form validation helper ----
  App.validate = function (form, rules) {
    // rules: { fieldName: (value) => true | "error message" }
    let ok = true;
    for (const [field, rule] of Object.entries(rules)) {
      const input = form.elements[field];
      if (!input) continue;
      const result = rule(input.value.trim());
      const msg = result === true ? "" : result;
      const errEl = form.querySelector(`[data-error-for="${field}"]`);
      if (errEl) errEl.textContent = msg;
      input.classList.toggle("input--invalid", !!msg);
      if (msg) ok = false;
    }
    return ok;
  };

  global.App = App;
})(window);
