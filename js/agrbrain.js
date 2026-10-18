/* =========================================================
   SmartAgri — agrbrain.js
   Trợ lý AI AgrBrain: đọc dữ liệu đã lưu của cả 6 trang
   (nhật ký, cảnh báo, nông hộ, thư viện, chuyên gia, cài đặt),
   xếp việc ưu tiên + lời khuyên cho chuyên gia và đẩy thông báo
   vào chuông của shell. Toàn bộ chạy mô phỏng trên trình duyệt,
   không gọi mạng và không gửi dữ liệu ra ngoài.
   ========================================================= */

(function () {
  'use strict';

  const KEYS = {
    journal: 'smartagri_journal_v1',
    alerts: 'smartagri_alerts_v1',
    households: 'smartagri_households_v1',
    library: 'smartagri_library_v1',
    experts: 'smartagri_experts_v1',
    settings: 'smartagri_settings'
  };

  const CAT_ORDER = { alerts: 0, requests: 1, experts: 2, households: 3, journal: 4, library: 5 };
  const PANEL_LIMIT = 10;

  /* ---------- tiện ích ---------- */
  const pad = (n) => String(n).padStart(2, '0');

  function read(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function hoursAgo(h) {
    return new Date(Date.now() - h * 3600000).toISOString();
  }

  function hoursSince(iso) {
    const t = new Date(iso).getTime();
    return isFinite(t) ? (Date.now() - t) / 3600000 : 0;
  }

  function when(iso) {
    const t = new Date(iso).getTime();
    if (!isFinite(t)) return 'không rõ thời điểm';
    const mins = Math.max(0, Math.round((Date.now() - t) / 60000));
    if (mins < 1) return 'vừa xong';
    if (mins < 60) return mins + ' phút trước';
    if (mins < 2880) return Math.round(mins / 60) + ' giờ trước';
    return Math.round(mins / 1440) + ' ngày trước';
  }

  function fmtDate(date) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date));
    return m ? m[3] + '/' + m[2] + '/' + m[1] : String(date);
  }

  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function monthKey() {
    return todayStr().slice(0, 7);
  }

  function monthLabel() {
    const d = new Date();
    return 'tháng ' + (d.getMonth() + 1) + '/' + d.getFullYear();
  }

  function clock() {
    const d = new Date();
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function nameOfUser() {
    return (sessionStorage.getItem('smartagri_user') || 'Nguyễn Văn Nam').trim();
  }

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  /* ---------- Dữ liệu mẫu thu gọn, khớp với các trang ----------
     Chỉ dùng khi trang tương ứng chưa từng được mở (chưa có khóa
     localStorage), để trợ lý vẫn có việc thật để đề xuất. */
  const SEED_ALERTS = [
    { id: 1, sev: 'urgent', title: 'Nguy cơ đạo ôn lá cổ bông — lô B2', region: 'Lô B2', conf: 91, at: hoursAgo(3) },
    { id: 2, sev: 'high', title: 'Rầy nâu mật độ cao ở giai đoạn đẻ nhánh', region: 'Lô A1', conf: 87, at: hoursAgo(5) },
    { id: 3, sev: 'high', title: 'Đốm nâu Cercospora lan ở mép đông', region: 'Lô A1', conf: 84, at: hoursAgo(22) },
    { id: 4, sev: 'mid', title: 'Thiếu nước ở đoạn kênh cuối', region: 'Lô C3', conf: 78, at: hoursAgo(26) },
    { id: 5, sev: 'mid', title: 'Gió mạnh dần về chiều, cân nhắc lịch phun thuốc', region: 'Toàn trang trại', conf: 80, at: hoursAgo(17) },
    { id: 6, sev: 'low', title: 'Nắng nóng cục bộ 35–36°C trong 2 ngày tới', region: 'Toàn trang trại', conf: 72, at: hoursAgo(49) }
  ];

  const SEED_EXPERTS = [
    { id: 1, name: 'Nguyễn Văn Nam', field: 'Bảo vệ thực vật', duty: 'on', status: 'active' },
    { id: 2, name: 'Trần Thị Hoa', field: 'Thổ nhưỡng & phân bón', duty: 'on', status: 'active' },
    { id: 3, name: 'Lê Minh Tuấn', field: 'Thủy nông', duty: 'off', status: 'active' },
    { id: 4, name: 'Phạm Thu Hà', field: 'Cây ăn trái', duty: 'on', status: 'active' },
    { id: 5, name: 'Võ Quốc Bảo', field: 'Bảo vệ thực vật', duty: 'off', status: 'active' },
    { id: 6, name: 'Đặng Ngọc Linh', field: 'Sau thu hoạch & chế biến', duty: 'on', status: 'active' }
  ];

  const SEED_REQS = [
    { id: 1, hh: 'Trần Văn Bình', crop: 'Lúa', topic: 'Đạo ôn lá sữa', field: 'Bảo vệ thực vật', at: hoursAgo(4), status: 'open', expertId: 0 },
    { id: 2, hh: 'Nguyễn Thị Kim Ngân', crop: 'Xoài', topic: 'Xử lý ra hoa xoài cát Chu', field: 'Cây ăn trái', at: hoursAgo(9), status: 'open', expertId: 0 },
    { id: 3, hh: 'Lê Văn Tuấn', crop: 'Lúa', topic: 'Ngập mặn đầu vụ', field: 'Thủy nông', at: hoursAgo(20), status: 'open', expertId: 0 },
    { id: 4, hh: 'Phạm Hoàng Long', crop: 'Sầu riêng', topic: 'Sầu riêng Ri6 rụng trái non', field: 'Cây ăn trái', at: hoursAgo(30), status: 'assigned', expertId: 4 },
    { id: 5, hh: 'Trần Quang Huy', crop: 'Cà phê', topic: 'Tỉa cành và bón phân phục hồi sau thu hoạch', field: 'Thổ nhưỡng & phân bón', at: hoursAgo(8), status: 'assigned', expertId: 2 },
    { id: 6, hh: 'Huỳnh Văn Sơn', crop: 'Lúa', topic: 'Công thức bón phân đòng', field: 'Thổ nhưỡng & phân bón', at: hoursAgo(70), status: 'done', expertId: 2 }
  ];

  const SEED_APPS = [
    { id: 101, name: 'Bùi Thanh Phong', field: 'Bảo vệ thực vật', exp: 6, at: hoursAgo(30), status: 'pending' },
    { id: 102, name: 'Hồ Gia Khánh', field: 'Thủy nông', exp: 4, at: hoursAgo(96), status: 'pending' },
    { id: 103, name: 'Ngô Thị Mai', field: 'Cây ăn trái', exp: 9, at: hoursAgo(200), status: 'pending' }
  ];

  const SEED_PENDING = [
    { id: 1, name: 'Lê Văn Tuấn', type: 'Đăng ký nông hộ mới', detail: '2.4 ha lúa tại Tháp Mười — đã tải giấy sử dụng đất.', at: hoursAgo(30) },
    { id: 2, name: 'Mai Văn Đạt', type: 'Đề nghị hỗ trợ kỹ thuật', detail: 'Xin tư vấn sâu đục thân trên 1.4 ha điều tại Bù Đăng.', at: hoursAgo(8) },
    { id: 3, name: 'HTX Green Rice', type: 'Kết nối HTX', detail: 'Đề nghị tích hợp 38 hộ thành viên lên nền tảng.', at: hoursAgo(60) },
    { id: 4, name: 'Trần Văn Bình', type: 'Gia hạn hồ sơ', detail: 'Cần cập nhật diện tích tăng thêm 0.4 ha sau vụ Mùa.', at: hoursAgo(76) }
  ];

  const SEED_PENDING_DOCS = [
    { id: 10, title: 'Quy trình tưới ướt – khô xen kẽ vụ Đông Xuân', cat: 'Quy trình', crop: 'Lúa', at: hoursAgo(3), status: 'pending' },
    { id: 11, title: 'Bộ ảnh lá lúa đốm nâu phục vụ huấn luyện AI', cat: 'Tài liệu AI', crop: 'Lúa', at: hoursAgo(28), status: 'pending' },
    { id: 12, title: 'Video phun thuốc bằng UAV trên ruộng lớn', cat: 'Video', crop: 'Lúa', at: hoursAgo(52), status: 'pending' }
  ];

  /* ---------- Đọc toàn bộ dữ liệu 6 trang ---------- */
  function validEntry(e) {
    return !!e && typeof e.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.date);
  }

  function validPending(p) {
    return !!p && typeof p.name === 'string' && p.name.trim() !== '' && isFinite(new Date(p.at).getTime());
  }

  function validReq(r) {
    return !!r && typeof r === 'object' && ['open', 'assigned', 'done'].indexOf(r.status) !== -1;
  }

  /* Cảnh báo dẫn xuất từ nhật ký — cùng cách tính với alerts.html */
  function journalAlerts(entries) {
    return entries
      .filter((e) => e && e.ai && (e.ai.status === 'confirmed' || e.ai.status === 'edited') && e.ai.diag)
      .slice(0, 4)
      .map((e) => {
        const lot = /lô\s*([a-c]\s*\d)/i.exec((e.note || '') + ' ' + (e.stage || ''));
        const whenDate = new Date(e.date + 'T' + (e.time || '07:00') + ':00');
        return {
          id: 'j' + e.id,
          sev: Number(e.ai.confidence) >= 80 ? 'high' : 'mid',
          title: e.ai.diag + ' — ghi từ nhật ký canh đồng',
          region: lot ? 'Lô ' + lot[1].toUpperCase().replace(/\s+/g, '') : 'Toàn trang trại',
          conf: Number(e.ai.confidence) || 0,
          at: isNaN(whenDate.getTime()) ? new Date().toISOString() : whenDate.toISOString()
        };
      });
  }

  function collect() {
    const settings = read(KEYS.settings) || {};

    const journalState = read(KEYS.journal);
    const entries = journalState && Array.isArray(journalState.entries)
      ? journalState.entries.filter(validEntry)
      : [];

    const alertState = read(KEYS.alerts) || {};
    const handled = alertState && alertState.handled && typeof alertState.handled === 'object' ? alertState.handled : {};
    const alerts = SEED_ALERTS.concat(journalAlerts(entries)).map((a) => ({
      id: a.id,
      sev: a.sev,
      title: a.title,
      region: a.region || 'Toàn trang trại',
      conf: Number(a.conf) || 0,
      at: a.at,
      open: !handled[a.id]
    }));

    const hhState = read(KEYS.households);
    const pending = hhState && Array.isArray(hhState.pending)
      ? hhState.pending.filter(validPending)
      : SEED_PENDING.slice();
    const householdsTotal = hhState && Array.isArray(hhState.households) ? hhState.households.length : 11;

    const libState = read(KEYS.library);
    const docCount = libState && Array.isArray(libState.docs) ? libState.docs.length : 13;
    const docs = libState && Array.isArray(libState.docs) ? libState.docs : SEED_PENDING_DOCS.slice();
    const pendingDocs = docs.filter((d) => d && d.status === 'pending');

    const exState = read(KEYS.experts);
    const experts = exState && Array.isArray(exState.experts) ? exState.experts : SEED_EXPERTS.slice();
    const apps = exState && Array.isArray(exState.apps) ? exState.apps : SEED_APPS.slice();
    const requests = exState && Array.isArray(exState.requests) ? exState.requests.filter(validReq) : SEED_REQS.slice();

    return {
      name: nameOfUser(),
      settings: settings,
      entries: entries,
      alerts: alerts,
      householdsTotal: householdsTotal,
      pending: pending,
      docsTotal: docCount,
      pendingDocs: pendingDocs,
      experts: experts,
      apps: apps,
      pendingApps: apps.filter((a) => a && a.status === 'pending'),
      requests: requests,
      openRequests: requests.filter((r) => r.status === 'open'),
      assignedRequests: requests.filter((r) => r.status === 'assigned')
    };
  }

  function gapFields(d) {
    const gaps = {};
    d.openRequests.forEach((r) => {
      const covered = d.experts.some((x) => x && x.field === r.field && x.duty === 'on' && x.status !== 'probation');
      if (!covered) (gaps[r.field] = gaps[r.field] || []).push(r);
    });
    return gaps;
  }

  /* ---------- Xếp việc cần làm ---------- */
  function buildTasks(d) {
    const tasks = [];
    let seq = 0;
    function push(t) {
      seq += 1;
      t.seq = seq;
      tasks.push(t);
    }

    d.alerts.filter((a) => a.open && (a.sev === 'urgent' || a.sev === 'high')).forEach((a) => {
      const urgent = a.sev === 'urgent';
      push({
        id: 'alert-' + a.id,
        cat: 'alerts',
        pri: urgent ? 0 : 1,
        title: (urgent ? 'Xử lý khẩn: ' : 'Xử lý cảnh báo: ') + a.title,
        detail: a.region + ' · AI tin cậy ' + a.conf + '% · phát hiện ' + when(a.at),
        href: 'alerts.html#alert-' + a.id,
        cta: 'Mở cảnh báo'
      });
    });

    const minorAlerts = d.alerts.filter((a) => a.open && (a.sev === 'mid' || a.sev === 'low'));
    if (minorAlerts.length) {
      push({
        id: 'alerts-minor',
        cat: 'alerts',
        pri: 2,
        title: 'Rà soát ' + minorAlerts.length + ' cảnh báo mức trung bình/thấp',
        detail: 'Các cảnh báo này chưa được đánh dấu xử lý — kiểm tra để tránh bỏ sót diễn biến nhỏ.',
        href: 'alerts.html',
        cta: 'Rà soát cảnh báo'
      });
    }

    d.assignedRequests.forEach((r) => {
      if (hoursSince(r.at) < 48) return;
      const expert = d.experts.filter((x) => x && x.id === r.expertId)[0];
      push({
        id: 'req-assigned-' + r.id,
        cat: 'requests',
        pri: 1,
        title: 'Đốc thúc phản hồi — yêu cầu #' + r.id,
        detail: (expert ? expert.name : 'Chuyên gia') + ' đã nhận ' + when(r.at) + ' nhưng chưa đóng yêu cầu "' + r.topic + '".',
        href: 'experts.html#req-' + r.id,
        cta: 'Đốc thúc phản hồi'
      });
    });

    const gaps = gapFields(d);
    Object.keys(gaps).forEach((field) => {
      const list = gaps[field];
      push({
        id: 'gap-' + field,
        cat: 'experts',
        pri: hoursSince(list[0].at) >= 24 ? 0 : 1,
        title: 'Bố trí người trực — ' + field,
        detail: list.length + ' yêu cầu đang mở nhưng không có chuyên gia nào đang trực ở lĩnh vực này.',
        href: 'experts.html#req-' + list[0].id,
        cta: 'Bố trí người trực'
      });
    });

    d.openRequests.forEach((r) => {
      const age = hoursSince(r.at);
      push({
        id: 'req-' + r.id,
        cat: 'requests',
        pri: age >= 24 ? 0 : 1,
        title: 'Phân công chuyên gia — yêu cầu #' + r.id + ': ' + r.topic,
        detail: r.hh + ' · ' + r.crop + ' · ' + r.field + ' · chờ ' + when(r.at),
        href: 'experts.html#req-' + r.id,
        cta: 'Phân công ngay'
      });
    });

    d.pendingApps.forEach((a) => {
      push({
        id: 'app-' + a.id,
        cat: 'experts',
        pri: hoursSince(a.at) >= 72 ? 1 : 2,
        title: 'Duyệt đơn chuyên gia — ' + a.name,
        detail: a.field + ' · ' + a.exp + ' năm kinh nghiệm · chờ ' + when(a.at),
        href: 'experts.html#app-' + a.id,
        cta: 'Duyệt đơn'
      });
    });

    d.pending.forEach((p) => {
      push({
        id: 'hh-' + p.id,
        cat: 'households',
        pri: 1,
        title: 'Duyệt hồ sơ — ' + p.name,
        detail: p.type + ' · ' + p.detail + ' · chờ ' + when(p.at),
        href: 'households.html#pending-' + p.id,
        cta: 'Duyệt hồ sơ'
      });
    });

    const todayEntries = d.entries.filter((e) => e.date === todayStr());
    if (!todayEntries.length) {
      push({
        id: 'journal-today',
        cat: 'journal',
        pri: 1,
        title: 'Ghi nhật ký canh đồng hôm nay',
        detail: 'Chưa có hoạt động nào cho hôm nay — nhật ký là nguồn số liệu cho báo cáo tháng.',
        href: 'journal.html#journalForm',
        cta: 'Ghi nhật ký'
      });
    }

    const pendingAi = d.entries.filter((e) => e.ai && e.ai.status === 'pending');
    if (pendingAi.length) {
      push({
        id: 'journal-ai',
        cat: 'journal',
        pri: 1,
        title: 'Xác nhận chẩn đoán AI còn treo',
        detail: pendingAi.length + ' bản ghi nhật ký đang chờ bạn xác nhận hoặc chỉnh sửa kết quả chẩn đoán.',
        href: 'journal.html',
        cta: 'Xác nhận kết quả AI'
      });
    }

    d.pendingDocs.forEach((doc) => {
      push({
        id: 'doc-' + doc.id,
        cat: 'library',
        pri: 2,
        title: 'Kiểm duyệt tài liệu — ' + doc.title,
        detail: doc.cat + ' · ' + doc.crop + ' · gửi ' + when(doc.at),
        href: 'library.html#doc-' + doc.id,
        cta: 'Kiểm duyệt tài liệu'
      });
    });

    tasks.sort((a, b) =>
      (a.pri - b.pri) ||
      ((CAT_ORDER[a.cat] || 9) - (CAT_ORDER[b.cat] || 9)) ||
      (a.seq - b.seq));

    return tasks;
  }

  /* ---------- Lời khuyên cho chuyên gia ---------- */
  function buildAdvice(d) {
    const out = [];
    const severe = d.alerts.filter((a) => a.open && (a.sev === 'urgent' || a.sev === 'high'));
    const urgentCount = severe.filter((a) => a.sev === 'urgent').length;

    if (severe.length) {
      out.push('Có ' + severe.length + ' cảnh báo nghiêm trọng chưa xử lý' +
        (urgentCount ? ', trong đó ' + urgentCount + ' cảnh báo khẩn' : '') +
        '. Nên kiểm tra ảnh và ghi kết quả xử lý trong 48 giờ để tránh lây sang lô bên cạnh.');
    } else {
      out.push('Không còn cảnh báo nghiêm trọng nào đang mở. Duy trì kiểm tra ảnh lá 2 ngày/lần ở giai đoạn làm đòng.');
    }

    if (d.openRequests.length) {
      const oldest = d.openRequests.slice().sort((a, b) => new Date(a.at) - new Date(b.at))[0];
      out.push('Có ' + d.openRequests.length + ' yêu cầu tư vấn chưa phân công, lâu nhất là "' + oldest.topic +
        '" (' + when(oldest.at) + '). Nên giao chuyên gia trong ngày để giữ cam kết phản hồi 24 giờ.');
    } else {
      out.push('Mọi yêu cầu tư vấn đã được phân công. Kiểm tra các yêu cầu đã giao quá 48 giờ để nhắc chuyên gia phản hồi.');
    }

    const sevenDaysAgo = Date.now() - 7 * 86400000;
    const recentEntries = d.entries.filter((e) => {
      const t = new Date(e.date + 'T00:00:00').getTime();
      return isFinite(t) && t >= sevenDaysAgo;
    });
    const lastEntry = d.entries.slice().sort((a, b) => (a.date + (a.time || '') < b.date + (b.time || '') ? 1 : -1))[0];
    const demoOnly = d.entries.length > 0 && d.entries.every((e) => e.date < '2025-01-01');
    if (lastEntry) {
      out.push('Nhật ký: ' + d.entries.length + ' bản ghi' + (demoOnly ? ' (toàn bộ là dữ liệu mẫu)' : '') +
        ', ' + recentEntries.length + ' hoạt động trong 7 ngày qua; gần nhất ' + fmtDate(lastEntry.date) +
        (lastEntry.type ? ' (' + lastEntry.type + ')' : '') + '.');
    } else {
      out.push('Nhật ký canh đồng chưa có bản ghi nào trên máy này. Ghi ít nhất một hoạt động mỗi ngày để báo cáo tháng và mô hình AI có dữ liệu.');
    }

    const gaps = gapFields(d);
    const gapNames = Object.keys(gaps);
    if (gapNames.length) {
      out.push('Lĩnh vực ' + gapNames.join(', ') + ' đang có yêu cầu mở nhưng không có chuyên gia trực. Cân nhắc đổi lịch trực hoặc điều chuyên gia từ lĩnh vực gần nhất.');
    } else {
      const onCount = d.experts.filter((x) => x && x.duty === 'on' && x.status !== 'probation').length;
      out.push('Đội ngũ: ' + onCount + '/' + d.experts.length + ' chuyên gia đang trực và phủ đủ các lĩnh vực có yêu cầu mở.');
    }

    const queues = [];
    if (d.pending.length) queues.push(d.pending.length + ' hồ sơ nông hộ');
    if (d.pendingApps.length) queues.push(d.pendingApps.length + ' đơn chuyên gia');
    if (d.pendingDocs.length) queues.push(d.pendingDocs.length + ' tài liệu');
    if (queues.length) {
      out.push('Hàng đợi kiểm duyệt: ' + queues.join(', ') + '. Nên chốt hồ sơ cũ trước để không chặn nông hộ mới đăng ký.');
    } else {
      out.push('Hàng đợi kiểm duyệt đang trống — hồ sơ, đơn chuyên gia và tài liệu đều đã được xử lý.');
    }

    const inMonth = d.entries.filter((e) => String(e.date).slice(0, 7) === monthKey());
    const doneReqs = d.requests.filter((r) => r.status === 'done').length;
    if (inMonth.length) {
      out.push('Báo cáo ' + monthLabel() + ' đã có ' + inMonth.length + ' hoạt động và ' + doneReqs +
        ' yêu cầu hoàn tất — đủ số liệu để xuất khi cần.');
    } else {
      out.push('Báo cáo ' + monthLabel() + ' chưa có hoạt động nào. Ghi nhật ký trước khi chốt số liệu tháng.');
    }

    if (Array.isArray(d.settings.jobs)) {
      out.push('Cấu hình: danh mục ' + d.settings.jobs.length + ' loại hoạt động và ' +
        (Array.isArray(d.settings.crops) ? d.settings.crops.length : 0) + ' cây trồng đang áp dụng cho nhật ký và báo cáo.');
    }

    return out;
  }

  function coverageOf(d) {
    return {
      alerts: d.alerts.filter((a) => a.open).length + '/' + d.alerts.length,
      journal: d.entries.length,
      households: d.pending.length + '/' + d.householdsTotal,
      library: d.pendingDocs.length + '/' + d.docsTotal,
      experts: d.openRequests.length,
      settings: d.settings.updatedAt ? 'đã lưu' : 'mặc định'
    };
  }

  /* ---------- Thông báo cho chuông ---------- */
  function getBriefing() {
    const data = collect();
    const tasks = buildTasks(data);
    return {
      name: data.name,
      tasks: tasks,
      advice: buildAdvice(data),
      coverage: coverageOf(data),
      urgent: tasks.filter((t) => t.pri === 0).length,
      scannedAt: new Date().toISOString()
    };
  }

  function getNotifications() {
    const brief = getBriefing();
    const tasks = brief.tasks;
    const out = [{
      kind: 'brief',
      title: 'AgrBrain đã quét 6 nguồn dữ liệu',
      body: tasks.length
        ? tasks.length + ' việc được xếp ưu tiên' + (brief.urgent ? ' · ' + brief.urgent + ' việc khẩn' : '') + ' · cập nhật ' + clock()
        : 'Không có việc gấp — cảnh báo, nhật ký, hồ sơ và kiểm duyệt đều ổn · ' + clock(),
      to: 'Mở bảng công việc của trợ lý',
      href: '#',
      tag: 'Trợ lý AI',
      action: 'agrbrain'
    }];

    if (!tasks.length) return out;

    const byCat = {};
    tasks.forEach((t) => { (byCat[t.cat] = byCat[t.cat] || []).push(t); });
    const firsts = Object.keys(byCat).map((k) => byCat[k][0]).sort((a, b) => a.pri - b.pri);
    const chosen = [];
    firsts.forEach((t) => { if (chosen.length < 6) chosen.push(t); });
    tasks.forEach((t) => { if (chosen.length < 6 && chosen.indexOf(t) === -1) chosen.push(t); });

    chosen.forEach((t) => {
      out.push({
        kind: 'task',
        title: t.title,
        body: t.detail,
        to: t.cta,
        href: t.href,
        tag: 'Trợ lý AI'
      });
    });

    return out;
  }

  /* ---------- Giao diện ---------- */
  function modalApi() {
    if (window.SA && typeof window.SA.openModal === 'function') {
      return { open: window.SA.openModal, close: window.SA.closeModal };
    }
    if (typeof window.openModal === 'function' && typeof window.closeModal === 'function') {
      return { open: window.openModal, close: window.closeModal };
    }
    return null;
  }

  function toast(message, kind) {
    if (window.SA && typeof window.SA.showToast === 'function') window.SA.showToast(message, kind);
    else if (typeof window.showToast === 'function') window.showToast(message, kind);
  }

  function closeNotifPanel() {
    const panel = document.getElementById('notifPanel');
    if (panel) panel.hidden = true;
    const bell = document.getElementById('btnBell');
    if (bell) bell.setAttribute('aria-expanded', 'false');
  }

  function heroText(brief) {
    const hour = new Date().getHours();
    const greet = hour < 11 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
    const wrap = el('div');
    wrap.appendChild(el('strong', '', greet + ', ' + brief.name + '.'));
    wrap.appendChild(el('p', '', brief.tasks.length
      ? brief.tasks.length + ' việc cần bạn xử lý' + (brief.urgent ? ', trong đó ' + brief.urgent + ' việc khẩn' : '') +
        '. Tôi đã đối chiếu cảnh báo, nhật ký, nông hộ, thư viện, chuyên gia và cấu hình hệ thống.'
      : 'Không có việc nào đang chờ. Tôi đã quét cảnh báo, nhật ký, nông hộ, thư viện, chuyên gia và cấu hình hệ thống.'));
    return wrap;
  }

  function chipsNode(coverage) {
    const list = el('div', 'ab-chips');
    const items = [
      ['Cảnh báo mở', coverage.alerts, true],
      ['Nhật ký', coverage.journal],
      ['Nông hộ chờ', coverage.households],
      ['Tài liệu chờ', coverage.library],
      ['Yêu cầu mở', coverage.experts],
      ['Cài đặt', coverage.settings]
    ];
    items.forEach((it) => {
      const chip = el('span', 'ab-chip' + (it[2] ? ' is-alert' : ''));
      chip.appendChild(document.createTextNode(it[0] + ' '));
      chip.appendChild(el('b', '', String(it[1])));
      list.appendChild(chip);
    });
    return list;
  }

  function tasksNode(tasks) {
    const section = el('section', 'ab-section');
    const head = el('h3');
    head.appendChild(document.createTextNode('Việc ưu tiên'));
    head.appendChild(el('span', '', tasks.length + ' việc'));
    section.appendChild(head);

    const list = el('div', 'ab-tasks');
    if (!tasks.length) {
      list.appendChild(el('div', 'ab-empty', 'Không có việc nào đang chờ. Bạn có thể tập trung kiểm tra đồng ruộng hoặc xuất báo cáo.'));
    } else {
      tasks.slice(0, PANEL_LIMIT).forEach((t) => {
        const link = el('a', 'ab-task');
        link.href = t.href;
        const pri = el('span', 'ab-pri ab-pri--' + t.pri, t.pri === 0 ? 'Khẩn' : t.pri === 1 ? 'Cao' : 'Sớm');
        const mid = el('div');
        mid.appendChild(el('b', '', t.title));
        mid.appendChild(el('small', '', t.detail));
        link.append(pri, mid, el('span', 'ab-go', '→'));
        list.appendChild(link);
      });
      if (tasks.length > PANEL_LIMIT) {
        list.appendChild(el('p', 'ab-more', 'Còn ' + (tasks.length - PANEL_LIMIT) + ' việc mức thấp hơn — mở từng trang để xem đầy đủ.'));
      }
    }
    section.appendChild(list);
    return section;
  }

  function adviceNode(advice) {
    const section = el('section', 'ab-section');
    const head = el('h3');
    head.appendChild(document.createTextNode('Lời khuyên cho chuyên gia'));
    head.appendChild(el('span', '', 'từ dữ liệu hiện tại'));
    section.appendChild(head);
    const list = el('ul', 'ab-advice');
    advice.forEach((text) => list.appendChild(el('li', '', text)));
    section.appendChild(list);
    return section;
  }

  function open() {
    const brief = getBriefing();
    const m = modalApi();
    if (!m) {
      toast('Không mở được bảng công việc AgrBrain trên trang này.', 'bad');
      return;
    }
    paintBadge(brief.tasks);

    const wrap = el('div', 'ab-wrap');
    const hero = el('div', 'ab-hero');
    hero.appendChild(el('span', 'ab-orb', 'AI'));
    hero.appendChild(heroText(brief));
    wrap.appendChild(hero);
    wrap.appendChild(chipsNode(brief.coverage));
    wrap.appendChild(tasksNode(brief.tasks));
    wrap.appendChild(adviceNode(brief.advice));
    wrap.appendChild(el('p', 'ab-foot', 'AgrBrain chạy mô phỏng ngay trên trình duyệt, không gửi dữ liệu ra ngoài. Quét lúc ' +
      clock() + ' ngày ' + fmtDate(todayStr()) + '.'));

    const actions = [{ label: 'Đóng', onClick: m.close }];
    if (brief.tasks.length) {
      actions.unshift({
        label: 'Đi tới việc ưu tiên',
        primary: true,
        onClick: () => { location.href = brief.tasks[0].href; }
      });
    }
    m.open('Trợ lý AI AgrBrain', wrap, actions);
  }

  function buildNotificationItem(item) {
    const li = el('li');
    const link = el('a', 'notif__item');
    link.href = item.href;
    if (item.tag) link.appendChild(el('span', 'notif__tag', item.tag));
    link.appendChild(el('strong', '', item.title));
    link.appendChild(el('span', '', item.body));
    const go = el('em', 'notif__go', item.to + ' →');
    link.appendChild(go);
    if (item.action === 'agrbrain') {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        closeNotifPanel();
        open();
      });
    }
    li.appendChild(link);
    return li;
  }

  function renderNotifications(listEl, countEl) {
    if (!listEl) return;
    const list = getNotifications();
    listEl.innerHTML = '';
    list.forEach((item) => listEl.appendChild(buildNotificationItem(item)));
    if (countEl) {
      countEl.textContent = list.length;
      countEl.hidden = list.length === 0;
    }
  }

  function paintBadge(tasks) {
    const btn = document.getElementById('btnAssistant');
    if (!btn) return;
    const list = tasks || buildTasks(collect());
    let badge = btn.querySelector('.ab-count');
    if (!badge) {
      badge = el('span', 'ab-count');
      btn.appendChild(badge);
    }
    badge.hidden = list.length === 0;
    badge.textContent = list.length > 9 ? '9+' : String(list.length);
    btn.title = list.length + ' việc AgrBrain đề xuất';
  }

  function bind() {
    const btn = document.getElementById('btnAssistant');
    if (!btn || btn.dataset.abBound === '1') return;
    btn.dataset.abBound = '1';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      open();
    });
    paintBadge();
  }

  /* Style dùng chung cho panel + nhãn thông báo */
  function injectStyle() {
    if (document.getElementById('agrbrain-css')) return;
    const style = document.createElement('style');
    style.id = 'agrbrain-css';
    style.textContent =
      '.ab-count{margin-left:auto;min-width:20px;height:20px;padding:0 6px;display:grid;place-items:center;' +
      'background:var(--green);color:#fff;border-radius:999px;font-size:11px;font-weight:700;}' +
      '.ab-count[hidden]{display:none;}' +
      '.notif__tag{display:inline-block;margin-bottom:5px;padding:2px 7px;border-radius:999px;' +
      'background:var(--green-soft);color:var(--green-dark);font-size:10px;font-weight:700;letter-spacing:.02em;}' +
      '.ab-wrap{display:flex;flex-direction:column;gap:14px;}' +
      '.ab-hero{display:flex;align-items:flex-start;gap:12px;padding:14px;border:1px solid var(--green-line);' +
      'border-radius:14px;background:linear-gradient(135deg,#eaf5e6,#f8fbf5);}' +
      '.ab-orb{width:40px;height:40px;flex:none;display:grid;place-items:center;border-radius:12px;' +
      'background:var(--green);color:#fff;font-size:13px;font-weight:800;box-shadow:0 6px 14px rgba(21,127,61,.25);}' +
      '.ab-hero strong{display:block;font-size:14.5px;color:var(--green-dark);}' +
      '.ab-hero p{margin-top:3px;font-size:12.5px;line-height:1.5;color:var(--muted);}' +
      '.ab-chips{display:flex;flex-wrap:wrap;gap:6px;}' +
      '.ab-chip{display:inline-flex;align-items:center;gap:5px;padding:5px 9px;border:1px solid var(--line);' +
      'border-radius:999px;background:#f6f1e6;color:#4d5b51;font-size:11.5px;}' +
      '.ab-chip b{color:var(--ink);}' +
      '.ab-chip.is-alert{background:var(--red-soft);border-color:#f3c9c1;color:#8f2f24;}' +
      '.ab-chip.is-alert b{color:#8f2f24;}' +
      '.ab-section h3{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;' +
      'font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);}' +
      '.ab-section h3 span{font-size:11px;font-weight:600;text-transform:none;letter-spacing:0;color:#98a49b;}' +
      '.ab-tasks{display:flex;flex-direction:column;gap:8px;}' +
      '.ab-task{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:start;padding:11px 12px;' +
      'border:1px solid var(--line);border-radius:12px;background:#fff;color:inherit;text-decoration:none;}' +
      '.ab-task:hover{border-color:var(--green-line);background:#fbfdf9;}' +
      '.ab-pri{margin-top:2px;padding:2px 7px;border-radius:999px;font-size:10.5px;font-weight:700;white-space:nowrap;}' +
      '.ab-pri--0{background:var(--red-soft);color:#a12f22;}' +
      '.ab-pri--1{background:var(--amber-soft);color:#8c5a10;}' +
      '.ab-pri--2{background:var(--blue-soft);color:#2f5f8d;}' +
      '.ab-task b{display:block;font-size:13.5px;line-height:1.4;color:var(--ink);}' +
      '.ab-task small{display:block;margin-top:3px;font-size:12px;line-height:1.5;color:var(--muted);}' +
      '.ab-go{margin-top:1px;color:var(--green);font-size:16px;}' +
      '.ab-advice{display:flex;flex-direction:column;gap:7px;margin:0;padding:0;list-style:none;}' +
      '.ab-advice li{position:relative;padding-left:24px;font-size:13px;line-height:1.55;color:#3a473f;}' +
      '.ab-advice li::before{content:"✓";position:absolute;left:0;top:1px;width:16px;height:16px;display:grid;' +
      'place-items:center;border-radius:50%;background:var(--green-soft);color:var(--green);font-size:10px;font-weight:800;}' +
      '.ab-empty{padding:14px;border:1px dashed var(--green-line);border-radius:12px;background:#f7fbf4;' +
      'text-align:center;font-size:13px;color:var(--green-dark);}' +
      '.ab-more{margin:2px 0 0;font-size:11.5px;color:var(--muted);}' +
      '.ab-foot{padding-top:10px;border-top:1px dashed var(--line);font-size:11.5px;line-height:1.5;color:var(--muted);}';
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectStyle);
  } else {
    injectStyle();
  }
  document.addEventListener('DOMContentLoaded', bind);
  document.addEventListener('sa:ready', bind);
  bind();

  window.AgrBrain = {
    getBriefing: getBriefing,
    getNotifications: getNotifications,
    renderNotifications: renderNotifications,
    open: open,
    bind: bind,
    refreshBadge: paintBadge
  };
})();
