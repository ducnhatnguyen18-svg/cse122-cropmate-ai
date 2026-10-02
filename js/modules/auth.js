/* =========================================================
   CropMate AI — Mock authentication (login)
   Không có backend thật: nhận email + role, lưu LocalStorage, chuyển trang.
   ========================================================= */
(function (global) {
  const App = global.App;
  const Nav = global.Nav;

  // Demo accounts — mỗi role một tài khoản mẫu để đăng nhập nhanh.
  const DEMO_ACCOUNTS = {
    farmer: { email: "nongdan@cropmate.vn", name: "Anh Ba Lúa" },
    expert: { email: "chuyengia@cropmate.vn", name: "KS. Minh Nông" },
    coordinator: { email: "dieuphoi@cropmate.vn", name: "Cô Chín HTX" },
    admin: { email: "admin@cropmate.vn", name: "Quản Trị Viên" },
  };

  function roleFromQuery() {
    return new URLSearchParams(location.search).get("role");
  }

  function init() {
    const form = document.getElementById("login-form");
    const roleSelect = document.getElementById("role");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const demoHint = document.getElementById("demo-hint");
    if (!form) return;

    // Chọn trước role từ index.html?role=
    const q = roleFromQuery();
    if (q && DEMO_ACCOUNTS[q] && roleSelect) roleSelect.value = q;

    function fillDemo() {
      const acc = DEMO_ACCOUNTS[roleSelect.value];
      if (!acc) return;
      emailInput.value = acc.email;
      passwordInput.value = "123456";
      if (demoHint) demoHint.textContent = `Đã điền tài khoản demo: ${acc.email} / 123456`;
    }
    roleSelect && roleSelect.addEventListener("change", fillDemo);
    fillDemo();

    const demoBtn = document.getElementById("use-demo");
    demoBtn && demoBtn.addEventListener("click", fillDemo);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const ok = App.validate(form, {
        email: (v) => (!v ? "Vui lòng nhập email." : (/^\S+@\S+\.\S+$/.test(v) ? true : "Email không hợp lệ.")),
        password: (v) => (!v ? "Vui lòng nhập mật khẩu." : (v.length >= 6 ? true : "Mật khẩu tối thiểu 6 ký tự.")),
        role: (v) => (v ? true : "Vui lòng chọn vai trò."),
      });
      if (!ok) return;

      const role = roleSelect.value;
      const acc = DEMO_ACCOUNTS[role];
      // Mock: chấp nhận đúng email demo hoặc bất kỳ email hợp lệ nào cho role đã chọn.
      const user = { name: acc ? acc.name : emailInput.value.split("@")[0], email: emailInput.value, role };

      const btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = "Đang đăng nhập…"; }

      // Giả lập độ trễ gọi API
      setTimeout(() => {
        App.setRole(role, user);
        location.href = (Nav && Nav.HOME_BY_ROLE[role]) || "index.html";
      }, 500);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})(window);
