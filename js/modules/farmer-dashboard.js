/* =========================================================
   CropMate AI — Farmer Season Dashboard logic
   Read (R) + AI-2 Season Checklist Generator.
   Dữ liệu đọc qua API (mock/LocalStorage), không hardcode.
   ========================================================= */
(function (global) {
  const App = global.App;
  const API = global.API;
  const AI = global.AI;

  let allSeasons = [];
  let cropById = {};   // fieldId → crop
  let lastResult = null;
  let lastSeasonId = null;

  // ---- DOM refs ----
  const $ = (id) => document.getElementById(id);

  function show(el) { el && el.classList.remove("hidden"); }
  function hide(el) { el && el.classList.add("hidden"); }

  // ============ LOAD DATA ============
  async function loadData() {
    show($("seasons-loading"));
    hide($("seasons-empty"));
    hide($("season-list"));
    hide($("page-error"));

    try {
      const [seasons, fields, logs, requests] = await Promise.all([
        API.getAll("seasons"),
        API.getAll("fields"),
        API.getAll("fieldLogs"),
        API.getAll("helpRequests"),
      ]);

      allSeasons = seasons.filter((s) => !s.archived);
      cropById = {};
      fields.forEach((f) => (cropById[f.id] = f.crop));

      renderStats(allSeasons, logs, requests);
      renderSeasons($("season-filter").value);
      populateAiSeasons();
    } catch (err) {
      hide($("seasons-loading"));
      const box = $("page-error");
      box.textContent = "Không tải được dữ liệu mùa vụ. Vui lòng thử lại. (" + err.message + ")";
      show(box);
    }
  }

  // ============ STATS ============
  function renderStats(seasons, logs, requests) {
    const active = seasons.filter((s) => s.status === "active").length;
    const pending = requests.filter((r) => r.status === "pending" || r.status === "in_review").length;
    const resolved = requests.filter((r) => r.status === "resolved").length;
    $("stat-seasons").textContent = active;
    $("stat-logs").textContent = logs.filter((l) => !l.archived).length;
    $("stat-pending").textContent = pending;
    $("stat-resolved").textContent = resolved;
  }

  // ============ SEASON LIST ============
  const STATUS_META = {
    active: { label: "Đang diễn ra", cls: "badge--success" },
    done: { label: "Đã thu hoạch", cls: "badge--info" },
    paused: { label: "Tạm dừng", cls: "badge--warning" },
  };

  function renderSeasons(filter) {
    hide($("seasons-loading"));
    const list = $("season-list");
    let rows = allSeasons;
    if (filter && filter !== "all") rows = rows.filter((s) => s.status === filter);

    if (allSeasons.length === 0) {
      hide(list);
      show($("seasons-empty"));
      return;
    }
    hide($("seasons-empty"));

    if (rows.length === 0) {
      list.innerHTML = `<div class="state">Không có mùa vụ nào khớp bộ lọc này.</div>`;
      show(list);
      return;
    }

    list.innerHTML = rows
      .map((s) => {
        const meta = STATUS_META[s.status] || { label: s.status, cls: "badge--info" };
        const crop = cropById[s.fieldId] || "—";
        const hasChecklist = Array.isArray(s.checklist) && s.checklist.length;
        return `
        <article class="card season-card" data-id="${s.id}">
          <div class="season-card-head">
            <h3>${escapeHtml(s.name)}</h3>
            <span class="badge ${meta.cls}">${meta.label}</span>
          </div>
          <dl class="season-meta">
            <div><dt>Cây trồng</dt><dd>${escapeHtml(crop)}</dd></div>
            <div><dt>Giai đoạn</dt><dd>${escapeHtml(s.stage || "—")}</dd></div>
            <div><dt>Từ</dt><dd>${s.startDate || "—"}</dd></div>
            <div><dt>Đến</dt><dd>${s.endDate || "—"}</dd></div>
          </dl>
          ${hasChecklist
            ? `<div class="season-checklist"><strong>Checklist đã lưu (${s.checklist.length}):</strong>
                 <ul class="checklist checklist--sm">${s.checklist.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ul></div>`
            : `<p class="muted small">Chưa có checklist. Dùng trợ lý AI bên dưới để tạo.</p>`}
          <div class="season-card-actions">
            <button class="btn btn--ghost btn--sm" data-ai-for="${s.id}">🤖 Tạo checklist AI</button>
            <a class="btn btn--ghost btn--sm" href="farmer-field-log.html">Xem nhật ký</a>
          </div>
        </article>`;
      })
      .join("");

    show(list);

    // Nút "Tạo checklist AI" trên mỗi thẻ → cuộn xuống form AI và chọn sẵn mùa vụ
    list.querySelectorAll("[data-ai-for]").forEach((btn) =>
      btn.addEventListener("click", () => {
        $("ai-season").value = btn.getAttribute("data-ai-for");
        $("ai-stage").value = "";
        document.querySelector(".panel--ai").scrollIntoView({ behavior: "smooth" });
      })
    );
  }

  // ============ AI-2 FLOW ============
  function populateAiSeasons() {
    const sel = $("ai-season");
    sel.innerHTML =
      `<option value="">— Chọn mùa vụ —</option>` +
      allSeasons
        .map((s) => `<option value="${s.id}">${escapeHtml(s.name)} (${escapeHtml(cropById[s.fieldId] || "—")})</option>`)
        .join("");
  }

  function onGenerate(e) {
    if (e) e.preventDefault();
    const form = $("ai-form");
    const ok = App.validate(form, {
      season: (v) => (v ? true : "Vui lòng chọn một mùa vụ."),
    });
    if (!ok) return;

    const seasonId = $("ai-season").value;
    const season = allSeasons.find((s) => String(s.id) === String(seasonId));
    const crop = cropById[season.fieldId] || "";
    const stage = $("ai-stage").value.trim() || season.stage || "";
    lastSeasonId = seasonId;

    // BƯỚC 2: Đang xử lý
    hide($("ai-result"));
    show($("ai-loading"));
    $("ai-generate").disabled = true;

    // Giả lập độ trễ gọi model
    setTimeout(() => {
      hide($("ai-loading"));
      $("ai-generate").disabled = false;
      const result = AI.generateSeasonChecklist({ crop, stage });
      lastResult = result;
      renderAiResult(result);
    }, 900);
  }

  function renderAiResult(result) {
    const box = $("ai-result");
    const conf = $("ai-confidence");
    const statusText = $("ai-status-text");
    const expl = $("ai-explanation");
    const items = $("ai-items");

    if (result.status === "error") {
      conf.className = "badge badge--danger";
      conf.textContent = "Không đủ dữ liệu";
      statusText.textContent = "";
      expl.textContent = result.message;
      items.innerHTML = "";
      $("ai-accept").disabled = true;
      show(box);
      return;
    }

    $("ai-accept").disabled = false;
    const pct = Math.round((result.confidence || 0) * 100);
    if (result.status === "uncertain") {
      conf.className = "badge badge--warning";
      conf.textContent = `Độ tin cậy thấp · ${pct}%`;
      statusText.textContent = result.message || "AI chưa chắc chắn về kết quả này.";
    } else {
      conf.className = "badge badge--success";
      conf.textContent = `Độ tin cậy ${pct}%`;
      statusText.textContent = "Kết quả gợi ý từ AI";
    }

    expl.textContent = result.explanation || "";
    items.innerHTML = result.items
      .map((it, i) => `<li><span class="chk-index">${i + 1}</span><span>${escapeHtml(it)}</span></li>`)
      .join("");
    show(box);
  }

  function onAccept() {
    if (!lastResult || lastResult.status === "error") return;
    // BƯỚC 6: Lưu vào trạng thái ứng dụng (persist qua API)
    API.update("seasons", lastSeasonId, { checklist: lastResult.items }).then(() => {
      App.toast("Đã lưu checklist vào mùa vụ.", "success");
      resetAi();
      loadData();
    });
  }

  function onEdit() {
    if (!lastResult || !lastResult.items) return;
    const text = lastResult.items.join("\n");
    const edited = prompt("Chỉnh sửa checklist (mỗi dòng một công việc):", text);
    if (edited === null) return;
    lastResult.items = edited.split("\n").map((s) => s.trim()).filter(Boolean);
    renderAiResult(lastResult);
    App.toast("Đã cập nhật nội dung. Bấm Chấp nhận để lưu.", "info");
  }

  function onRegenerate() {
    onGenerate();
  }

  function onReject() {
    resetAi();
    App.toast("Đã bỏ qua gợi ý AI.", "info");
  }

  function resetAi() {
    lastResult = null;
    hide($("ai-result"));
  }

  // ============ UTIL ============
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  // ============ INIT ============
  function init() {
    $("season-filter").addEventListener("change", (e) => renderSeasons(e.target.value));
    $("ai-form").addEventListener("submit", onGenerate);
    $("ai-accept").addEventListener("click", onAccept);
    $("ai-edit").addEventListener("click", onEdit);
    $("ai-regenerate").addEventListener("click", onRegenerate);
    $("ai-reject").addEventListener("click", onReject);
    loadData();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})(window);
