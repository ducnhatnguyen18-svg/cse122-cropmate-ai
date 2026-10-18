/* =========================================================
   SmartAgri — pages.js
   Logic riêng cho từng trang dùng chung shell (js/shell.js).
   Trang được nhận diện qua <body data-page="...">.
   ========================================================= */

(function () {
  if (!window.SA) return;

  const $ = SA.$;
  const qa = SA.qa;
  const icon = SA.icon;
  const showToast = SA.showToast;
  const openModal = SA.openModal;
  const closeModal = SA.closeModal;
  const page = SA.page;

  /* ---------- Tiện ích dựng DOM ---------- */
  function h(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function chip(text, kind) { return h('span', 'sev sev--' + kind, text); }

  function actBtn(label, kind, iconName, onClick) {
    const b = h('button', 'btn-sm btn-sm--' + kind);
    b.type = 'button';
    b.innerHTML = icon(iconName);
    b.appendChild(document.createTextNode(label));
    b.addEventListener('click', onClick);
    return b;
  }

  function listRow(host, o) {
    const row = h('div', 'row');
    const ic = h('span', 'row__icon' + (o.iconKind ? ' row__icon--' + o.iconKind : '') + (o.iconNode ? ' row__icon--bare' : ''));
    if (o.iconNode) ic.appendChild(o.iconNode);
    else ic.innerHTML = icon(o.icon || 'i-leaf');
    const main = h('div', 'row__main');
    const title = h('div', 'row__title');
    title.appendChild(document.createTextNode(o.title));
    if (o.chip) title.appendChild(chip(o.chip, o.chipKind || 'low'));
    main.appendChild(title);
    if (o.text) main.appendChild(h('p', 'row__text', o.text));
    if (o.meta && o.meta.length) {
      const m = h('p', 'row__meta');
      o.meta.forEach((pair) => {
        const s = h('span');
        s.innerHTML = icon(pair[0]);
        s.appendChild(document.createTextNode(' ' + pair[1]));
        m.appendChild(s);
      });
      main.appendChild(m);
    }
    const side = h('div', 'row__side');
    if (o.side) o.side.forEach((n) => side.appendChild(n));
    if (o.acts && o.acts.length) {
      const a = h('div', 'row__acts');
      o.acts.forEach((n) => a.appendChild(n));
      side.appendChild(a);
    }
    row.append(ic, main, side);
    host.appendChild(row);
    return row;
  }

  function meter(host, label, value, pct, kind) {
    const item = h('div', 'meters__item');
    item.appendChild(h('span', 'meters__label', label));
    item.appendChild(h('span', 'meters__val', value));
    const bar = h('span', 'meter' + (kind ? ' meter--' + kind : ''));
    const fill = h('span');
    fill.style.width = pct + '%';
    bar.appendChild(fill);
    item.appendChild(bar);
    host.appendChild(item);
  }

  function barChart(host, data) {
    host.innerHTML = '';
    const max = Math.max.apply(null, data.map((d) => d.v)) || 1;
    data.forEach((d) => {
      const col = h('div', 'bars__col');
      col.appendChild(h('span', 'bars__val', d.v + (d.unit || '')));
      const bar = h('span', 'bars__stack' + (d.kind ? ' bars__stack--' + d.kind : ''));
      bar.style.height = Math.max(6, Math.round((d.v / max) * 100)) + '%';
      bar.title = d.l + ': ' + d.v + (d.unit || '');
      col.appendChild(bar);
      col.appendChild(h('span', 'bars__label', d.l));
      host.appendChild(col);
    });
  }

  function tableRow(host, cells) {
    const tr = h('tr');
    cells.forEach((c) => {
      const td = h('td', typeof c === 'object' ? c.cls : '', typeof c === 'object' ? c.text : c);
      if (typeof c === 'object' && c.node) td.appendChild(c.node);
      tr.appendChild(td);
    });
    host.appendChild(tr);
    return tr;
  }

  function initials(name) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
  }

  function detailList(pairs) {
    const dl = h('dl', 'kv');
    pairs.forEach((p) => {
      const wrap = h('div');
      const dt = h('dt', '', p[0]);
      const dd = h('dd', '', p[1]);
      wrap.append(dt, dd);
      dl.appendChild(wrap);
    });
    return dl;
  }

  /* =========================================================
     1. AI CẢNH BÁO & DỰ BÁO
     Một bản ghi cảnh báo duy nhất nuôi cả danh sách, bộ lọc,
     4 thẻ chỉ số, thanh nguy cơ và bảng lịch sử.
     ========================================================= */
  const SEV_LABEL = { urgent: 'Khẩn cấp', high: 'Cao', mid: 'Trung bình', low: 'Theo dõi' };
  const SEV_RANK = { urgent: 0, high: 1, mid: 2, low: 3 };

  function initAlerts() {
    const ALERT_KEY = 'smartagri_alerts_v1';
    const JOURNAL_KEY = 'smartagri_journal_v1';
    const AREA = { 'Lô A1': '1.2 ha', 'Lô B2': '0.8 ha', 'Lô C3': '1.4 ha', 'Toàn trang trại': '3.4 ha' };
    const userName = sessionStorage.getItem('smartagri_user') || 'Nguyễn Văn Nam';

    /* Nhãn nguồn: mọi bản ghi demo đều là số liệu dựng sẵn, không lấy từ API nào. */
    const ORIGIN = {
      demo: { cls: 'src--demo', icon: 'i-file', text: 'Dữ liệu mẫu' },
      real: { cls: 'src--real', icon: 'i-sprout', text: 'Dữ liệu thật' }
    };

    function pad2(n) { return (n < 10 ? '0' : '') + n; }
    function agoIso(hours) { return new Date(Date.now() - hours * 3600000).toISOString(); }
    function dayLabel(iso) { const d = new Date(iso); return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear(); }
    function timeLabel(iso) {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return 'Không rõ thời điểm';
      const hrs = Math.round((Date.now() - d.getTime()) / 3600000);
      if (hrs < 1) return 'Cách đây ít phút';
      if (hrs < 24) return 'Cách đây ' + hrs + ' giờ';
      const days = Math.round(hrs / 24);
      if (days > 30) return 'Ngày ' + dayLabel(iso);
      if (days === 1) return 'Hôm qua ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
      return days + ' ngày trước';
    }
    function srcBadge(origin, source) {
      const o = ORIGIN[origin];
      const s = h('span', 'src ' + o.cls);
      s.innerHTML = icon(o.icon);
      s.appendChild(document.createTextNode(o.text));
      s.title = 'Nguồn: ' + source;
      return s;
    }

    const SEED_ALERTS = [
      { id: 1, sev: 'urgent', icon: 'i-flask', iconKind: 'red', region: 'Lô B2', title: 'Nguy cơ đạo ôn lá cổ bông — lô B2', text: 'AI nhận diện vết bệnh điển hình trên 3/10 ảnh gửi ngày 12/10, ẩm độ duy trì 82% trong 4 ngày liên tục.', at: agoIso(3), conf: 91, origin: 'demo', source: 'Mô-đun AI phân tích ảnh (chạy mô phỏng trên máy)' },
      { id: 2, sev: 'high', icon: 'i-rain', iconKind: 'amber', region: 'Lô A1', title: 'Rầy nâu mật độ cao ở giai đoạn đẻ nhánh', text: 'Mật độ trung bình 2.100 con/m², vượt ngưỡng 1.500. Khuyến nghị phun khi tuổi rầy còn non.', at: agoIso(5), conf: 87, origin: 'demo', source: 'Số liệu mẫu từ bẫy côn trùng' },
      { id: 3, sev: 'high', icon: 'i-leaf', iconKind: 'amber', region: 'Lô A1', title: 'Đốm nâu Cercospora lan ở mép đông', text: 'Đã ghi nhận trong nhật ký canh đồng. Diện tích nghi nhiễm khoảng 0.3 ha, cần tách khu vực phun riêng.', at: agoIso(22), conf: 84, origin: 'demo', source: 'Số liệu mẫu dẫn xuất từ nhật ký canh đồng' },
      { id: 4, sev: 'mid', icon: 'i-drop', iconKind: 'blue', region: 'Lô C3', title: 'Thiếu nước ở đoạn kênh cuối', text: 'Mực nước đo được thấp hơn 2cm so với yêu cầu giai đoạn làm đòng. Đề nghị tăng ca tưới về đêm.', at: agoIso(26), conf: 78, origin: 'demo', source: 'Số liệu mẫu đo mực nước kênh nội đồng' },
      { id: 5, sev: 'mid', icon: 'i-wind', iconKind: 'blue', region: 'Toàn trang trại', title: 'Gió mạnh dần về chiều, cân nhắc lịch phun thuốc', text: 'Dự báo gió cấp 4–5 sau 15h, phun thuốc dễ bay trôi sang ruộng kế bên.', at: agoIso(17), conf: 80, origin: 'demo', source: 'Mô-đun thời tiết demo, chưa kết nối API thật' },
      { id: 6, sev: 'low', icon: 'i-sun', iconKind: '', region: 'Toàn trang trại', title: 'Nắng nóng cục bộ 35–36°C trong 2 ngày tới', text: 'Tăng tần suất tưới dưỡng, che phủ gốc bằng rơm rạ để giữ ẩm.', at: agoIso(49), conf: 72, origin: 'demo', source: 'Mô-đun thời tiết demo, chưa kết nối API thật' }
    ];

    /* Cảnh báo lấy từ dữ liệu thật của người dùng: bản ghi nhật ký đã được xác nhận chẩn đoán. */
    function journalAlerts() {
      let raw = null;
      try { raw = localStorage.getItem(JOURNAL_KEY); } catch (err) { return []; }
      if (!raw) return [];
      let st = null;
      try { st = JSON.parse(raw); } catch (err) { return []; }
      if (!st || !Array.isArray(st.entries)) return [];
      return st.entries
        .filter((e) => e && e.ai && (e.ai.status === 'confirmed' || e.ai.status === 'edited') && e.ai.diag)
        .slice(0, 4)
        .map((e) => {
          const lot = /lô\s*([a-c]\s*\d)/i.exec((e.note || '') + ' ' + (e.stage || ''));
          const guess = lot ? 'Lô ' + lot[1].toUpperCase().replace(/\s+/g, '') : 'Toàn trang trại';
          const when = new Date(e.date + 'T' + (e.time || '07:00') + ':00');
          return {
            id: 'j' + e.id,
            sev: e.ai.confidence >= 80 ? 'high' : 'mid',
            icon: 'i-sprout',
            iconKind: 'amber',
            region: AREA[guess] ? guess : 'Toàn trang trại',
            title: e.ai.diag + ' — ghi từ nhật ký canh đồng',
            text: (e.ai.note || '').slice(0, 200) || 'Bản ghi nhật ký có chẩn đoán AI đã được xác nhận, cần theo dõi thêm tại ruộng.',
            at: isNaN(when.getTime()) ? new Date().toISOString() : when.toISOString(),
            conf: e.ai.confidence || 0,
            origin: 'real',
            source: 'Nhật ký ' + e.type + ' ngày ' + dayLabel(e.date) + ' bạn đã lưu trên máy này'
          };
        });
    }

    const SEED_HISTORY = [
      { key: 'demo-1', at: agoIso(72), title: 'Sâu cuốn lá giai đoạn 3 tuổi — lô A1', by: 'Nguyễn Văn Nam', result: 'Đã phun, mật độ giảm 80%', origin: 'demo' },
      { key: 'demo-2', at: agoIso(144), title: 'Ngập úng sau mưa lớn 90mm', by: 'Trần Thị Hoa', result: 'Đã tiêu nước, không thiệt hại', origin: 'demo' },
      { key: 'demo-3', at: agoIso(288), title: 'Vàng lá sinh lý — lô C3', by: 'Nguyễn Văn Nam', result: 'Bón bổ sung kali, lá xanh trở lại', origin: 'demo' }
    ];

    const alerts = SEED_ALERTS.concat(journalAlerts());

    /* ---------- Trạng thái "đã xử lý" lưu trên máy ---------- */
    let handled = {};
    (function loadHandled() {
      let raw = null;
      try { raw = localStorage.getItem(ALERT_KEY); } catch (err) { return; }
      if (!raw) return;
      let st = null;
      try { st = JSON.parse(raw); } catch (err) { return; }
      if (!st || typeof st !== 'object' || !st.handled) return;
      Object.keys(st.handled).forEach((k) => {
        const v = st.handled[k];
        if (v && typeof v.at === 'string' && !isNaN(new Date(v.at).getTime())) {
          handled[k] = {
            at: v.at,
            by: typeof v.by === 'string' && v.by ? v.by : userName,
            result: typeof v.result === 'string' && v.result ? v.result : 'Đã ghi nhận và xử lý'
          };
        }
      });
    })();

    let savedOk = true;
    function saveHandled() {
      try {
        localStorage.setItem(ALERT_KEY, JSON.stringify({ handled: handled, updatedAt: new Date().toISOString() }));
        savedOk = true;
      } catch (err) {
        savedOk = false;
      }
    }

    const listEl = $('#alertList');
    const emptyEl = $('#alertEmpty');
    const historyEl = $('#historyBody');
    const regionEl = $('#regionFilter');
    let filterSev = '';
    let filterRegion = '';

    const isOpen = (a) => !handled[a.id];
    const openAlerts = () => alerts.filter(isOpen);
    const severeOf = (list) => list.filter((a) => a.sev === 'urgent' || a.sev === 'high').length;

    function matchFilter(a) {
      return (!filterSev || a.sev === filterSev) && (!filterRegion || a.region === filterRegion);
    }

    function historyRows() {
      const fromUser = alerts
        .filter((a) => handled[a.id])
        .map((a) => ({ key: 'alert-' + a.id, alertId: a.id, at: handled[a.id].at, title: a.title, by: handled[a.id].by, result: handled[a.id].result, origin: handled[a.id].origin || a.origin }));
      return SEED_HISTORY.concat(fromUser).sort((x, y) => new Date(y.at) - new Date(x.at));
    }

    /* ---------- Danh sách cảnh báo ---------- */
    function render() {
      listEl.innerHTML = '';
      const open = openAlerts();
      const shown = open.filter(matchFilter).sort((a, b) => (SEV_RANK[a.sev] - SEV_RANK[b.sev]) || (new Date(b.at) - new Date(a.at)));

      shown.forEach((a) => {
        const row = listRow(listEl, {
          icon: a.icon,
          iconKind: a.iconKind,
          title: a.title,
          chip: SEV_LABEL[a.sev],
          chipKind: a.sev,
          text: a.text,
          meta: [['i-pin', a.region + ' · ' + AREA[a.region]], ['i-clock', timeLabel(a.at)], ['i-ai', 'Độ tin cậy ' + a.conf + '%']],
          acts: [
            actBtn('Xem', 'edit', 'i-eye', () => openDetail(a)),
            actBtn('Đã xử lý', 'ok', 'i-check', () => markHandled(a.id))
          ]
        });
        row.id = 'alert-' + a.id;
        row.querySelector('.row__title').appendChild(srcBadge(a.origin, a.source));
      });

      const filtering = filterSev || filterRegion;
      emptyEl.hidden = shown.length !== 0;
      emptyEl.textContent = !open.length
        ? 'Toàn bộ ' + alerts.length + ' cảnh báo đã được đánh dấu xử lý. Xem lại và hủy đánh dấu ở bảng Lịch sử xử lý.'
        : 'Không có cảnh báo nào khớp bộ lọc. ' + open.length + ' cảnh báo đang mở ở mức độ / khu vực khác.';

      const demoOpen = open.filter((a) => a.origin === 'demo').length;
      $('#alertSummary').textContent = open.length + ' cảnh báo đang mở · ' + severeOf(open) +
        ' ở mức cao hoặc khẩn cấp · ' + (alerts.length - open.length) + ' đã đánh dấu xử lý';

      const info = $('#filterInfo');
      info.textContent = '';
      info.appendChild(document.createTextNode(
        'Hiển thị ' + shown.length + '/' + open.length + ' cảnh báo đang mở · lọc theo ' +
        (filterSev ? 'mức độ ' + SEV_LABEL[filterSev].toLowerCase() : 'mọi mức độ') + ' và ' +
        (filterRegion || 'mọi khu vực') + '.'
      ));
      if (filtering) {
        const clear = h('button', 'linkbtn', 'Xóa bộ lọc');
        clear.type = 'button';
        clear.addEventListener('click', () => {
          filterSev = '';
          filterRegion = '';
          regionEl.value = '';
          qa('#alertFilters .pill').forEach((x) => x.classList.toggle('is-on', x.dataset.sev === ''));
          render();
        });
        info.appendChild(document.createTextNode(' '));
        info.appendChild(clear);
      }

      renderStats(demoOpen, open);
      renderRisks(open);
      renderHistory();
    }

    /* ---------- 4 thẻ chỉ số: tất cả tính lại từ danh sách ---------- */
    function renderStats(demoOpen, open) {
      const done = historyRows();
      const weekAgo = Date.now() - 7 * 86400000;
      const recent = done.filter((r) => new Date(r.at).getTime() >= weekAgo).length;
      const confs = open.filter((a) => a.conf > 0);
      const avg = confs.length ? Math.round(confs.reduce((s, a) => s + a.conf, 0) / confs.length) : 0;

      $('#statOpen').textContent = pad2(open.length);
      $('#statOpenDelta').textContent = demoOpen + ' dữ liệu mẫu · ' + (open.length - demoOpen) + ' dữ liệu thật';
      $('#statSevere').textContent = pad2(severeOf(open));
      $('#statSevereDelta').textContent = 'Còn mở: ' + open.filter((a) => a.sev === 'urgent').length + ' khẩn cấp, ' +
        open.filter((a) => a.sev === 'high').length + ' mức cao';
      $('#statHandled').textContent = pad2(done.length);
      $('#statHandledDelta').textContent = recent + ' trong 7 ngày qua · ' + alerts.filter((a) => handled[a.id]).length + ' do bạn đánh dấu';
      $('#statConf').textContent = avg ? avg + '%' : '—';
      $('#statConfDelta').textContent = avg ? 'Trung bình của ' + confs.length + ' cảnh báo đang mở' : 'Chưa có cảnh báo nào đang mở';
    }

    /* ---------- Thanh nguy cơ: cùng nguồn với danh sách ---------- */
    const RISKS = [
      { label: 'Đạo ôn lá', region: 'Lô B2', alert: 1 },
      { label: 'Đốm nâu Cercospora', region: 'Lô A1', alert: 3 },
      { label: 'Rầy nâu tuổi 1–2', region: 'Lô A1', alert: 2 },
      { label: 'Khô vằn giai đoạn làm đòng', region: 'Lô C3', alert: null, base: 32 },
      { label: 'Ngập úng sau mưa lớn', region: 'Toàn trang trại', alert: null, base: 18 }
    ];

    function renderRisks(open) {
      const host = $('#riskMeters');
      host.innerHTML = '';
      const shown = RISKS.filter((r) => !filterRegion || r.region === filterRegion || r.region === 'Toàn trang trại');
      shown.forEach((r) => {
        const a = r.alert ? alerts.find((x) => x.id === r.alert) : null;
        let pct = r.base || 0;
        let tail = 'nguy cơ nền';
        if (a) {
          if (handled[a.id]) { pct = Math.round(a.conf * 0.4); tail = 'đã xử lý, còn ' + dayLabel(handled[a.id].at); }
          else { pct = a.conf; tail = 'đang mở · ' + SEV_LABEL[a.sev].toLowerCase(); }
        }
        meter(host, r.label + ' — ' + r.region, pct + '%', pct, pct >= 75 ? 'red' : pct >= 50 ? 'amber' : '');
        host.lastChild.title = tail;
      });
      $('#riskCaption').textContent = shown.length + ' nhóm nguy cơ' + (filterRegion ? ' liên quan ' + filterRegion : '') +
        ' · mức % lấy theo độ tin cậy cảnh báo đang mở (dữ liệu mẫu)';
    }

    /* ---------- Bảng lịch sử xử lý ---------- */
    function renderHistory() {
      const rows = historyRows();
      historyEl.innerHTML = '';
      rows.forEach((r) => {
        const acts = h('div', 'row__acts');
        if (r.alertId != null) {
          acts.appendChild(actBtn('Hủy đánh dấu', 'edit', 'i-refresh', () => {
            delete handled[r.alertId];
            saveHandled();
            render();
            showToast('Đã chuyển cảnh báo về danh sách đang mở.', 'ok');
          }));
        }
        const tr = tableRow(historyEl, [
          dayLabel(r.at),
          r.title,
          r.by,
          r.result,
          { node: srcBadge(r.origin, r.origin === 'real' ? 'Hành động của bạn trên máy này' : 'Bản ghi mẫu dựng sẵn') },
          { node: acts }
        ]);
        if (r.alertId != null) tr.id = 'alert-' + r.alertId;
      });
      const mine = alerts.filter((a) => handled[a.id]).length;
      $('#historyCaption').textContent = rows.length + ' bản ghi · ' + SEED_HISTORY.length + ' bản ghi mẫu + ' + mine + ' cảnh báo bạn đánh dấu đã xử lý' +
        (savedOk ? ' (lưu trên máy này)' : ' (không lưu được: bộ nhớ trình duyệt đầy)');
    }

    /* ---------- Chi tiết ---------- */
    function openDetail(a) {
      const wrap = h('div');
      wrap.appendChild(h('p', 'row__text', a.text));
      const head = h('p', 'row__meta');
      head.appendChild(srcBadge(a.origin, a.source));
      wrap.appendChild(head);
      const done = handled[a.id];
      wrap.appendChild(detailList([
        ['Mức độ', SEV_LABEL[a.sev]],
        ['Khu vực', a.region + ' · ' + AREA[a.region]],
        ['Phát hiện', timeLabel(a.at)],
        ['Độ tin cậy', a.conf + '%'],
        ['Nguồn dữ liệu', ORIGIN[a.origin].text + ' — ' + a.source],
        ['Trạng thái', done ? 'Đã xử lý ngày ' + dayLabel(done.at) + ' bởi ' + done.by : 'Đang mở, chưa ghi nhận xử lý']
      ]));
      wrap.appendChild(h('div', 'note', done
        ? 'Cảnh báo đã ghi nhận. Nếu cần mở lại, dùng nút "Hủy đánh dấu" ở bảng Lịch sử xử lý.'
        : 'Khuyến nghị: ghi lại biện pháp đã áp dụng vào Nhật ký canh đồng để AI học và dự báo chính xác hơn.'));
      openModal('Chi tiết cảnh báo', wrap, done
        ? [{ label: 'Hủy đánh dấu', onClick: () => { closeModal(); markUndo(a.id); } }, { label: 'Đóng', onClick: closeModal }]
        : [{ label: 'Đánh dấu đã xử lý', primary: true, onClick: () => { closeModal(); markHandled(a.id); } }, { label: 'Đóng', onClick: closeModal }]);
    }

    function markHandled(id) {
      if (handled[id]) { showToast('Cảnh báo này đã được đánh dấu xử lý.'); return; }
      handled[id] = { at: new Date().toISOString(), by: userName, result: 'Đã ghi nhận và xử lý', origin: 'real' };
      saveHandled();
      render();
      const a = alerts.find((x) => x.id === id);
      showToast(savedOk
        ? 'Đã đánh dấu xử lý: ' + (a ? SEV_LABEL[a.sev].toLowerCase() : 'cảnh báo') + '. Có thể hủy ở Lịch sử xử lý.'
        : 'Đã đánh dấu trong phiên này nhưng không ghi được xuống bộ nhớ trình duyệt.', savedOk ? 'ok' : 'bad');
    }

    function markUndo(id) {
      delete handled[id];
      saveHandled();
      render();
      showToast('Đã hủy đánh dấu, cảnh báo trở lại danh sách đang mở.', 'ok');
    }

    /* ---------- Bộ lọc ---------- */
    const regions = [];
    alerts.forEach((a) => { if (regions.indexOf(a.region) === -1) regions.push(a.region); });
    ['Lô A1', 'Lô B2', 'Lô C3'].forEach((r) => { if (regions.indexOf(r) === -1) regions.push(r); });
    regions.sort();
    regions.forEach((r) => {
      const o = document.createElement('option');
      o.value = r;
      o.textContent = r + ' — ' + AREA[r];
      regionEl.appendChild(o);
    });
    regionEl.addEventListener('change', () => { filterRegion = regionEl.value; render(); });

    qa('#alertFilters .pill').forEach((p) => {
      p.addEventListener('click', () => {
        qa('#alertFilters .pill').forEach((x) => x.classList.remove('is-on'));
        p.classList.add('is-on');
        filterSev = p.dataset.sev;
        render();
      });
    });

    $('#btnAckAll').addEventListener('click', () => {
      const open = openAlerts();
      if (!open.length) { showToast('Hiện không còn cảnh báo nào đang mở để đánh dấu.'); return; }
      const n = open.length;
      open.forEach((a) => { handled[a.id] = { at: new Date().toISOString(), by: userName, result: 'Ghi nhận hàng loạt', origin: 'real' }; });
      saveHandled();
      render();
      showToast('Đã đánh dấu ' + n + ' cảnh báo đã xử lý. Hủy từng bản ghi ở Lịch sử xử lý nếu ghi nhầm.', 'ok');
    });

    const forecast = [
      { l: 'T2', v: 2 }, { l: 'T3', v: 0 }, { l: 'T4', v: 6 },
      { l: 'T5', v: 24 }, { l: 'T6', v: 41 }, { l: 'T7', v: 12 }, { l: 'CN', v: 3 }
    ];
    barChart($('#forecastBars'), forecast.map((d) => ({ l: d.l, v: d.v, unit: ' mm', kind: d.v > 20 ? 'blue' : '' })));
    const peak = forecast.reduce((a, b) => (b.v > a.v ? b : a));
    $('#forecastNote').textContent = 'Ngày ' + peak.l + ' có mưa lớn ' + peak.v + ' mm (số liệu demo) — nên hoãn phun thuốc và kiểm tra bờ bao, rãnh thoát nước trước 1 ngày.';

    const range = $('#subThreshold');
    range.addEventListener('input', () => { $('#subThresholdOut').textContent = range.value + '%'; });

    $('#subForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const picked = ['#subSick', '#subWeather', '#subWater', '#subPrice'].filter((s) => $(s).checked);
      if (!picked.length) { showToast('Chọn ít nhất một loại cảnh báo.', 'bad'); return; }
      showToast('Đã lưu: ' + picked.length + ' loại cảnh báo cho ' + $('#subRegion').value + '.', 'ok');
    });

    render();
  }

  /* =========================================================
     2. NÔNG HỘ & HTX
     Một hồ sơ = một bản ghi có cấu trúc cố định (see blankHH).
     Danh bạ, 4 thẻ chỉ số, biểu diện donut, bảng tư vấn và
     khối đối chiếu diện tích đều tính lại từ đúng danh sách đó.
     ========================================================= */
  function initHouseholds() {
    const HH_KEY = 'smartagri_households_v1';

    const GROUPS = [
      { name: 'Lúa', color: '#2e7d4f', crops: ['Lúa', 'Lúa nếp'] },
      { name: 'Cây ăn trái', color: '#58a86b', crops: ['Xoài', 'Sầu riêng', 'Cam'] },
      { name: 'Rau màu', color: '#3d7fb5', crops: ['Rau màu'] },
      { name: 'Cây công nghiệp', color: '#e0b455', crops: ['Cà phê', 'Điều', 'Tiêu'] }
    ];
    const STATUSES = ['Đã xác thực', 'Chờ xác thực', 'Tạm ngưng'];
    const STATUS_KIND = { 'Đã xác thực': 'done', 'Chờ xác thực': 'wait', 'Tạm ngưng': 'off' };
    const CROPS = GROUPS.reduce((acc, g) => acc.concat(g.crops), []);
    const groupOf = (crop) => (GROUPS.find((g) => g.crops.indexOf(crop) !== -1) || GROUPS[0]).name;

    const COOPS = [
      { id: 'np', name: 'HTX Nông Phát', crop: 'Lúa chất lượng cao', members: 42, areaHa: 68, rating: 4.9 },
      { id: 'xt', name: 'HTX Xanh Đồng Tháp', crop: 'Xoài + lúa', members: 27, areaHa: 35, rating: 4.7 },
      { id: 'mh', name: 'Tổ hợp tác Mỹ Hòa', crop: 'Rau màu', members: 15, areaHa: 12, rating: 4.4 },
      { id: 'lk', name: 'HTX Sầu riêng Long Khánh', crop: 'Sầu riêng', members: 21, areaHa: 24, rating: 4.8 }
    ];
    const coopName = (id) => { const c = COOPS.find((x) => x.id === id); return c ? c.name : 'Chưa tham gia tổ nhóm'; };

    /* Cấu trúc hồ sơ: id, name, crop, areaHa (số), loc, phone, status,
       rating, coopId, joined, topic, note, origin ('demo' | 'local'). */
    function blankHH() {
      return { id: 0, name: '', crop: 'Lúa', areaHa: 0, loc: '', phone: '', status: 'Chờ xác thực', rating: 0, coopId: null, joined: '', topic: '', note: '', origin: 'local' };
    }
    function isHH(x) {
      return !!x && typeof x.name === 'string' && x.name.length >= 3 &&
        CROPS.indexOf(x.crop) !== -1 &&
        typeof x.areaHa === 'number' && isFinite(x.areaHa) && x.areaHa > 0 && x.areaHa <= 500 &&
        typeof x.loc === 'string' && /^\d{8,11}$/.test(String(x.phone || '').replace(/\D/g, ''));
    }
    function fmtArea(n) { return (Math.round(n * 100) / 100).toFixed(2) + ' ha'; }
    function fmtPhone(v) {
      const d = String(v).replace(/\D/g, '');
      return d.length === 10 ? d.slice(0, 4) + ' ' + d.slice(4, 7) + ' ' + d.slice(7) : d;
    }
    function agoH(hours) { return new Date(Date.now() - hours * 3600000).toISOString(); }
    function fold(s) { return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0111/g, 'd').toLowerCase(); }
    function digits(s) { return String(s).replace(/\D/g, ''); }

    const SEED_HH = [
      { id: 1, name: 'Trần Văn Bình', crop: 'Lúa', areaHa: 1.2, loc: 'Xã Bình Thạnh, Chợ Mới, An Giang', phone: '0913 456 781', status: 'Đã xác thực', rating: 4.9, coopId: 'np', joined: '2023-06-12', topic: 'Đạo ôn lá cổ bông', note: 'Đang canh tác vụ Mùa, có 3 lô theo dõi.' },
      { id: 2, name: 'Nguyễn Thị Kim Ngân', crop: 'Xoài', areaHa: 0.6, loc: 'Xã Hòa An, Chợ Mới, An Giang', phone: '0907 221 145', status: 'Đã xác thực', rating: 4.7, coopId: 'xt', joined: '2023-11-04', topic: 'Xử lý ra hoa xoài', note: 'Xoài cát Chu, đang xử lý ra hoa.' },
      { id: 3, name: 'Lê Văn Tuấn', crop: 'Lúa', areaHa: 2.4, loc: 'Xã Mỹ An, Tháp Mười, Đồng Tháp', phone: '0978 330 209', status: 'Chờ xác thực', rating: 0, coopId: null, joined: '2026-10-10', topic: '', note: 'Hồ sơ gửi ngày 10/10, chờ duyệt giấy tờ.' },
      { id: 4, name: 'Phạm Hoàng Long', crop: 'Sầu riêng', areaHa: 1.1, loc: 'Xã Xuân Đông, Long Khánh, Đồng Nai', phone: '0905 771 226', status: 'Đã xác thực', rating: 4.6, coopId: 'lk', joined: '2024-02-20', topic: 'Bón phân cho sầu riêng', note: 'Sầu riêng Ri6 năm thứ 4, cần tư vấn bón phân.' },
      { id: 5, name: 'Võ Thị Đẹp', crop: 'Rau màu', areaHa: 0.35, loc: 'Xã Nhơn Mỹ, Chợ Mới, An Giang', phone: '0918 004 776', status: 'Tạm ngưng', rating: 4.1, coopId: null, joined: '2022-09-15', topic: 'Cải tạo đất sau ngập', note: 'Ngưng canh tác 1 vụ do ngập úng.' },
      { id: 6, name: 'Huỳnh Văn Sơn', crop: 'Lúa', areaHa: 3.0, loc: 'Xã Vĩnh Bình, Hòn Đất, Kiên Giang', phone: '0946 812 330', status: 'Đã xác thực', rating: 4.8, coopId: 'np', joined: '2022-12-01', topic: 'Liên kết bao tiêu', note: 'Thành viên HTX Nông Phát, liên kết bao tiêu.' },
      { id: 7, name: 'Danh Thị Tuyết', crop: 'Rau màu', areaHa: 0.5, loc: 'Xã Mỹ Khánh, Chợ Mới, An Giang', phone: '0932 118 604', status: 'Chờ xác thực', rating: 0, coopId: 'mh', joined: '2026-09-28', topic: '', note: 'Chờ duyệt giấy tờ của Tổ hợp tác Mỹ Hòa.' },
      { id: 8, name: 'Thạch Sương', crop: 'Lúa', areaHa: 1.8, loc: 'Xã Ngọc Chúc, Giồng Riềng, Kiên Giang', phone: '0919 620 447', status: 'Đã xác thực', rating: 4.4, coopId: 'np', joined: '2024-05-08', topic: 'Phòng rầy nâu tuổi 1–2', note: 'Canh tác theo hướng giảm lượng giống sạ.' },
      { id: 9, name: 'Trần Quang Huy', crop: 'Cà phê', areaHa: 2.2, loc: 'Xã Quảng Trực, Tuy Đức, Đắk Nông', phone: '0947 305 188', status: 'Đã xác thực', rating: 4.5, coopId: null, joined: '2023-03-19', topic: 'Cắt tỉa cành sau thu hoạch', note: 'Vườn cà phê kinh doanh năm thứ 7.' },
      { id: 10, name: 'Mai Văn Đạt', crop: 'Điều', areaHa: 1.4, loc: 'Xã Bom Bo, Bù Đăng, Bình Phước', phone: '0903 556 772', status: 'Đã xác thực', rating: 4.2, coopId: null, joined: '2025-01-11', topic: 'Sâu đục thân hại điều', note: 'Đã gửi 6 ảnh hiện trường, chờ chuyên gia phản hồi.' },
      { id: 11, name: 'Hồ Ngọc Anh', crop: 'Xoài', areaHa: 0.9, loc: 'Xã An Bình, Châu Thành, Đồng Tháp', phone: '0917 442 006', status: 'Đã xác thực', rating: 4.0, coopId: 'xt', joined: '2024-08-23', topic: 'Bệnh thán thư trên xoài', note: 'Chuyển sang tưới nhỏ giọt từ vụ trước.' }
    ].map((x) => Object.assign(blankHH(), x, { origin: 'demo' }));

    const SEED_PENDING = [
      { id: 1, hhId: 3, name: 'Lê Văn Tuấn', type: 'Đăng ký nông hộ mới', detail: '2.4 ha lúa tại Tháp Mười — đã tải giấy sử dụng đất.', at: agoH(30) },
      { id: 2, hhId: 10, name: 'Mai Văn Đạt', type: 'Đề nghị hỗ trợ kỹ thuật', detail: 'Xin tư vấn sâu đục thân trên 1.4 ha điều tại Bù Đăng.', at: agoH(8) },
      { id: 3, hhId: null, name: 'HTX Green Rice', type: 'Kết nối HTX', detail: 'Đề nghị tích hợp 38 hộ thành viên lên nền tảng.', at: agoH(60) },
      { id: 4, hhId: 1, name: 'Trần Văn Bình', type: 'Gia hạn hồ sơ', detail: 'Cần cập nhật diện tích tăng thêm 0.4 ha sau vụ Mùa.', at: agoH(76) }
    ];

    function seedState() {
      return { households: SEED_HH.map((x) => Object.assign({}, x)), pending: SEED_PENDING.map((x) => Object.assign({}, x)), resolved: [], updatedAt: '' };
    }

    /* ---------- Nạp / lưu ---------- */
    let state = seedState();
    let loadedFrom = 'mẫu';
    (function load() {
      let raw = null;
      try { raw = localStorage.getItem(HH_KEY); } catch (err) { return; }
      if (!raw) return;
      let st = null;
      try { st = JSON.parse(raw); } catch (err) { return; }
      if (!st || !Array.isArray(st.households)) return;
      const ok = st.households.filter(isHH).map((x) => Object.assign(blankHH(), x));
      if (!ok.length) return;
      state = {
        households: ok,
        pending: Array.isArray(st.pending) ? st.pending : [],
        resolved: Array.isArray(st.resolved) ? st.resolved : [],
        updatedAt: typeof st.updatedAt === 'string' ? st.updatedAt : ''
      };
      loadedFrom = 'máy này';
    })();

    let savedOk = true;
    function save() {
      state.updatedAt = new Date().toISOString();
      try { localStorage.setItem(HH_KEY, JSON.stringify(state)); savedOk = true; } catch (err) { savedOk = false; }
      return savedOk;
    }

    let households = state.households;
    const listEl = $('#hhList');
    const emptyEl = $('#hhEmpty');
    const searchEl = $('#hhSearch');
    const cropEl = $('#hhCrop');
    const statusEl = $('#hhStatus');

    CROPS.slice().sort().forEach((c) => {
      const o = document.createElement('option');
      o.value = c;
      o.textContent = c + ' (' + groupOf(c) + ')';
      cropEl.appendChild(o);
    });

    /* ---------- Tìm kiếm + lọc ---------- */
    function matchedFields(x, q) {
      const where = [];
      const nq = fold(q).trim();
      const dq = digits(q);
      if (nq && fold(x.name).indexOf(nq) !== -1) where.push('tên');
      if (nq && fold(x.loc).indexOf(nq) !== -1) where.push('địa chỉ');
      if (dq.length >= 3 && digits(x.phone).indexOf(dq) !== -1) where.push('số điện thoại');
      if (nq && fold(x.crop).indexOf(nq) !== -1) where.push('cây trồng');
      return where;
    }

    function visible() {
      const q = searchEl.value.trim();
      const crop = cropEl.value;
      const st = statusEl.value;
      return households.filter((x) => {
        if (crop && x.crop !== crop) return false;
        if (st && x.status !== st) return false;
        if (q && !matchedFields(x, q).length) return false;
        return true;
      });
    }

    function render() {
      const shown = visible();
      listEl.innerHTML = '';
      shown.forEach((x) => {
        const side = [];
        if (x.rating) {
          const r = h('span', 'rating');
          r.innerHTML = icon('i-star');
          r.appendChild(document.createTextNode(' ' + x.rating.toFixed(1)));
          side.push(r);
        }
        const row = listRow(listEl, {
          icon: 'i-user',
          title: x.name,
          chip: x.status,
          chipKind: STATUS_KIND[x.status] || 'off',
          text: x.note,
          meta: [['i-sprout', x.crop + ' · ' + fmtArea(x.areaHa) + ' · ' + groupOf(x.crop)], ['i-pin', x.loc], ['i-chat', x.phone]],
          side: side,
          acts: [
            actBtn('Hồ sơ', 'edit', 'i-eye', () => openDetail(x)),
            actBtn('Sửa', 'ok', 'i-pencil', () => openForm(x))
          ]
        });
        row.id = 'hh-' + x.id;
        const title = row.querySelector('.row__title');
        title.appendChild(srcTag(x));
      });

      const q = searchEl.value.trim();
      const filtering = q || cropEl.value || statusEl.value;
      emptyEl.hidden = shown.length !== 0;
      emptyEl.textContent = households.length && !shown.length
        ? 'Không tìm thấy nông hộ nào khớp. Thử nhập một phần tên, xã/huyện hoặc 4 số bất kỳ của số điện thoại.'
        : 'Danh bạ trống. Bấm "Thêm nông hộ" để tạo hồ sơ đầu tiên.';
      if (!emptyEl.hidden && filtering) {
        const clr = h('button', 'linkbtn', ' Xóa bộ lọc');
        clr.type = 'button';
        clr.addEventListener('click', clearFilters);
        emptyEl.appendChild(clr);
      }

      $('#hhSummary').textContent = 'Toàn bộ ' + households.length + ' hồ sơ trong danh bạ · ' + fmtArea(totalArea(households)) + ' canh tác';
      const info = $('#hhInfo');
      info.textContent = '';
      info.appendChild(document.createTextNode('Đang hiển thị ' + shown.length + '/' + households.length + ' hồ sơ (' + fmtArea(totalArea(shown)) + ')' +
        (filtering ? ' · đang lọc' + (q ? ' theo "' + q + '"' : '') + (cropEl.value ? ' · cây trồng ' + cropEl.value : '') + (statusEl.value ? ' · ' + statusEl.value : '') : ' · không lọc.')));
      if (q && shown.length) {
        const hits = {};
        shown.forEach((x) => matchedFields(x, q).forEach((f) => { hits[f] = (hits[f] || 0) + 1; }));
        info.appendChild(document.createTextNode(' Khớp theo: ' + Object.keys(hits).map((k) => k + ' (' + hits[k] + ')').join(', ') + '.'));
      }

      renderStats();
      renderDonut();
      renderCoops();
      renderSupport();
      renderPending();
    }

    function clearFilters() {
      searchEl.value = '';
      cropEl.value = '';
      statusEl.value = '';
      render();
    }

    function srcTag(x) {
      const s = h('span', 'src ' + (x.origin === 'local' ? 'src--real' : 'src--demo'));
      s.innerHTML = icon(x.origin === 'local' ? 'i-pencil' : 'i-file');
      s.appendChild(document.createTextNode(x.origin === 'local' ? 'Hồ sơ bạn thêm' : 'Dữ liệu mẫu'));
      s.title = x.origin === 'local' ? 'Bạn tạo/sửa trực tiếp trên máy này' : 'Hồ sơ mẫu dựng sẵn cho bản demo';
      return s;
    }

    const totalArea = (list) => list.reduce((s, x) => s + (x.areaHa || 0), 0);

    /* ---------- 4 thẻ chỉ số ---------- */
    function renderStats() {
      const all = households;
      const pad = (n) => (n < 10 ? '0' : '') + n;
      const verified = all.filter((x) => x.status === 'Đã xác thực').length;
      const waiting = all.filter((x) => x.status === 'Chờ xác thực').length;
      const paused = all.filter((x) => x.status === 'Tạm ngưng').length;
      const linked = all.filter((x) => x.coopId).length;
      const total = totalArea(all);
      const byGroup = GROUPS.map((g) => ({ g: g, ha: totalArea(all.filter((x) => groupOf(x.crop) === g.name)) }))
        .sort((a, b) => b.ha - a.ha);
      const old = state.pending.filter((p) => Date.now() - new Date(p.at).getTime() > 172800000).length;

      $('#statHH').textContent = pad(all.length);
      $('#statHHDelta').textContent = verified + ' đã xác thực · ' + waiting + ' chờ duyệt · ' + paused + ' tạm ngưng';
      $('#statCoop').textContent = pad(COOPS.length);
      $('#statCoopDelta').textContent = linked + ' hộ có liên kết · ' + (all.length - linked) + ' hộ chưa ở trong tổ nhóm';
      $('#statArea').textContent = fmtArea(total);
      $('#statAreaDelta').textContent = byGroup[0].g.name + ' chiếm ' + Math.round((byGroup[0].ha / (total || 1)) * 100) + '% diện tích';
      $('#statPending').textContent = pad(state.pending.length);
      $('#statPendingDelta').textContent = state.resolved.length + ' yêu cầu đã xử lý · ' + old + ' quá 48 giờ';
    }

    /* ---------- Biểu đồ diện tích ---------- */
    function renderDonut() {
      const all = households;
      const total = totalArea(all);
      const rows = GROUPS.map((g) => ({ g: g, ha: totalArea(all.filter((x) => groupOf(x.crop) === g.name)) }));
      const pie = $('#donutPie');
      const legend = $('#cropLegend');
      let acc = 0;
      const stops = [];
      rows.forEach((r) => {
        const from = acc;
        acc += total ? (r.ha / total) * 100 : 0;
        stops.push(r.g.color + ' ' + from.toFixed(2) + '% ' + acc.toFixed(2) + '%');
      });
      pie.style.background = stops.length ? 'conic-gradient(' + stops.join(',') + ')' : '#eceadf';
      $('#donutTotal').textContent = fmtArea(total);

      legend.innerHTML = '';
      rows.forEach((r) => {
        const li = h('li');
        const dot = h('i');
        dot.style.background = r.g.color;
        li.appendChild(dot);
        li.appendChild(document.createTextNode(' ' + r.g.name + ' '));
        const b = h('b', '', fmtArea(r.ha) + ' · ' + Math.round((r.ha / (total || 1)) * 100) + '%');
        li.appendChild(b);
        legend.appendChild(li);
      });

      /* Đối chiếu: thống kê phải khớp từng hồ sơ trong danh bạ. */
      const bad = all.filter((x) => !(x.areaHa > 0 && x.areaHa <= 500));
      const groupSum = rows.reduce((s, r) => s + r.ha, 0);
      const diff = Math.abs(total - groupSum);
      const box = $('#hhCheck');
      const text = $('#hhCheckText');
      text.textContent = '';
      text.appendChild(document.createTextNode(
        'Đối chiếu thống kê ↔ danh sách: ' + (all.length - bad.length) + '/' + all.length + ' hồ sơ có diện tích hợp lệ (0 – 500 ha) · ' +
        'tổng danh bạ ' + fmtArea(total) + ' · tổng 4 nhóm cây trồng ' + fmtArea(groupSum) + ' · lệch ' + fmtArea(diff) + ' → ' +
        (bad.length ? 'có ' + bad.length + ' hồ sơ cần nhập lại: ' + bad.map((x) => x.name).join(', ') : diff < 0.005 ? 'khớp hoàn toàn' : 'LỆCH, cần kiểm tra lại') + '.'
      ));
      const btn = h('button', 'linkbtn', ' Kiểm tra lại ngay');
      btn.type = 'button';
      btn.addEventListener('click', () => {
        renderStats();
        renderDonut();
        showToast(bad.length || diff >= 0.005 ? 'Thống kê đang lệch so với danh bạ, xem chi tiết ở khối đối chiếu.' : 'Thống kê diện tích khớp với ' + all.length + ' hồ sơ trong danh bạ.', bad.length || diff >= 0.005 ? 'bad' : 'ok');
      });
      text.appendChild(btn);
      box.className = 'note' + (bad.length || diff >= 0.005 ? ' note--bad' : '');
      box.querySelector('use').setAttribute('href', bad.length || diff >= 0.005 ? '#i-alert' : '#i-check');
      $('#areaCaption').textContent = 'Tính trực tiếp từ ' + all.length + ' hồ sơ trong danh bạ, không phụ thuộc bộ lọc đang áp dụng';
    }

    /* ---------- HTX: số liệu khai báo + số liệu có hồ sơ trên nền tảng ---------- */
    function renderCoops() {
      const host = $('#coopList');
      host.innerHTML = '';
      COOPS.forEach((c) => {
        const mine = households.filter((x) => x.coopId === c.id);
        const r = h('span', 'rating');
        r.innerHTML = icon('i-star');
        r.appendChild(document.createTextNode(' ' + c.rating.toFixed(1)));
        listRow(host, {
          icon: 'i-shield',
          iconKind: 'blue',
          title: c.name,
          text: c.crop,
          meta: [['i-users', mine.length + '/' + c.members + ' thành viên đã có hồ sơ'], ['i-sprout', fmtArea(totalArea(mine)) + ' / ' + fmtArea(c.areaHa)]],
          side: [r]
        });
      });
    }

    /* ---------- Bảng tư vấn: lấy từ chính hồ sơ ---------- */
    function renderSupport() {
      const body = $('#supportBody');
      body.innerHTML = '';
      const rows = households.filter((x) => x.topic && x.rating > 0).sort((a, b) => b.rating - a.rating);
      rows.forEach((x) => {
        const tr = tableRow(body, [x.name, x.topic, { text: fmtArea(x.areaHa), cls: 'num' }, { text: x.rating.toFixed(1), cls: 'num' }]);
        tr.id = 'consult-' + x.id;
      });
      $('#supportCaption').textContent = rows.length + ' chuyên đề đang mở, lấy từ hồ sơ có chuyên đề và đã được đánh giá trong danh bạ';
    }

    /* ---------- Yêu cầu chờ duyệt ---------- */
    function renderPending() {
      const host = $('#pendingList');
      host.innerHTML = '';
      state.pending.slice().sort((a, b) => new Date(a.at) - new Date(b.at)).forEach((p) => {
        const hrs = Math.round((Date.now() - new Date(p.at).getTime()) / 3600000);
        listRow(host, {
          icon: 'i-clock',
          iconKind: hrs > 48 ? 'red' : 'amber',
          title: p.name,
          chip: p.type,
          chipKind: hrs > 48 ? 'urgent' : 'mid',
          text: p.detail,
          meta: [['i-chat', hrs < 1 ? 'Vừa gửi' : hrs < 24 ? hrs + ' giờ trước' : Math.round(hrs / 24) + ' ngày trước'], ['i-pin', p.hhId ? 'Hồ sơ #' + p.hhId : 'Chưa gắn hồ sơ']],
          acts: [
            actBtn('Duyệt', 'ok', 'i-check', () => resolvePending(p, 'Đã duyệt')),
            actBtn('Từ chối', 'del', 'i-close', () => resolvePending(p, 'Từ chối'))
          ]
        }).id = 'pending-' + p.id;
      });
      $('#pendingEmpty').hidden = state.pending.length !== 0;
      $('#pendingCaption').textContent = state.pending.length + ' yêu cầu đang chờ · ' + state.resolved.length + ' yêu cầu đã xử lý trong phiên dữ liệu này';
    }

    function resolvePending(p, result) {
      state.pending = state.pending.filter((x) => x.id !== p.id);
      state.resolved.unshift({ id: p.id, name: p.name, type: p.type, result: result, at: new Date().toISOString() });
      if (p.hhId) {
        const hh = households.find((x) => x.id === p.hhId);
        if (hh) {
          hh.status = result === 'Đã duyệt' ? 'Đã xác thực' : 'Tạm ngưng';
          hh.note = (result === 'Đã duyệt' ? 'Hồ sơ đã được duyệt ngày ' : 'Hồ sơ bị từ chối ngày ') + new Date().toLocaleDateString('vi-VN') + '. ' + hh.note;
        }
      }
      save();
      render();
      showToast(result + ' yêu cầu của ' + p.name + (p.hhId ? ', trạng thái hồ sơ đã cập nhật.' : '.'), 'ok');
    }

    /* ---------- Xem chi tiết ---------- */
    function openDetail(x) {
      const wrap = h('div');
      wrap.appendChild(h('p', 'row__text', x.note || 'Chưa có ghi chú.'));
      const line = h('p', 'row__meta');
      line.appendChild(srcTag(x));
      wrap.appendChild(line);
      wrap.appendChild(detailList([
        ['Họ tên', x.name],
        ['Cây trồng', x.crop + ' — nhóm ' + groupOf(x.crop)],
        ['Diện tích', fmtArea(x.areaHa)],
        ['Địa chỉ', x.loc],
        ['Điện thoại', x.phone],
        ['Trạng thái', x.status],
        ['Tổ nhóm', coopName(x.coopId)],
        ['Vào hệ thống', x.joined || 'Chưa rõ'],
        ['Chuyên đề tư vấn', x.topic || 'Chưa có'],
        ['Đánh giá', x.rating ? x.rating.toFixed(1) + '/5' : 'Chưa đánh giá']
      ]));
      openModal('Hồ sơ nông hộ — ' + x.name, wrap, [
        { label: 'Sửa hồ sơ', onClick: () => { closeModal(); openForm(x); } },
        { label: 'Xóa', danger: true, onClick: () => { closeModal(); confirmDelete(x); } },
        x.rating || x.topic ? { label: 'Gửi tư vấn', primary: true, onClick: () => { location.href = 'index.html'; } } : { label: 'Đóng', onClick: closeModal }
      ]);
    }

    function confirmDelete(x) {
      const wrap = h('div');
      const p = h('p', 'row__text');
      p.textContent = 'Xóa hồ sơ ' + x.name + ' (' + x.crop + ' · ' + fmtArea(x.areaHa) + ') khỏi danh bạ? Thống kê diện tích và biểu đồ sẽ tính lại ngay.';
      wrap.appendChild(p);
      wrap.appendChild(h('div', 'note note--warn', 'Bạn có thể bấm "Khôi phục dữ liệu mẫu" để lấy lại 11 hồ sơ ban đầu.'));
      openModal('Xóa nông hộ', wrap, [
        { label: 'Giữ lại', onClick: closeModal },
        { label: 'Xóa hồ sơ', danger: true, onClick: () => {
            households = households.filter((y) => y.id !== x.id);
            state.households = households;
            state.pending = state.pending.filter((q) => q.hhId !== x.id);
            const ok = save();
            closeModal();
            render();
            showToast('Đã xóa ' + x.name + ' khỏi danh bạ.' + (ok ? '' : ' (không ghi được xuống bộ nhớ trình duyệt)'), 'ok');
          } }
      ]);
    }

    /* ---------- Thêm / sửa ---------- */
    function openForm(x) {
      const isNew = !x;
      const rec = x || blankHH();
      const form = h('div', 'form');
      form.innerHTML =
        '<div class="form__row">' +
          '<div class="field"><label for="nhName">Họ và tên nông hộ <span class="req">*</span></label><input id="nhName" type="text" maxlength="60" placeholder="Ví dụ: Nguyễn Văn A"><p class="field__err" id="eName" hidden></p></div>' +
          '<div class="field"><label for="nhPhone">Số điện thoại <span class="req">*</span></label><input id="nhPhone" type="tel" maxlength="15" placeholder="09xx xxx xxx" inputmode="tel"><p class="field__err" id="ePhone" hidden></p></div>' +
        '</div>' +
        '<div class="form__row">' +
          '<div class="field"><label for="nhCrop">Cây trồng chính <span class="req">*</span></label><select id="nhCrop"></select><p class="field__hint" id="nhHint"></p></div>' +
          '<div class="field"><label for="nhArea">Diện tích canh tác (ha) <span class="req">*</span></label><input id="nhArea" type="number" min="0.01" max="500" step="0.05" inputmode="decimal"><p class="field__err" id="eArea" hidden></p></div>' +
        '</div>' +
        '<div class="field"><label for="nhLoc">Địa chỉ (xã, huyện, tỉnh) <span class="req">*</span></label><input id="nhLoc" type="text" maxlength="90" placeholder="Xã, huyện, tỉnh"><p class="field__err" id="eLoc" hidden></p></div>' +
        '<div class="form__row">' +
          '<div class="field"><label for="nhStatus">Trạng thái hồ sơ</label><select id="nhStatus"></select></div>' +
          '<div class="field"><label for="nhCoop">Tổ nhóm / HTX</label><select id="nhCoop"></select></div>' +
        '</div>' +
        '<div class="form__row">' +
          '<div class="field"><label for="nhRating">Điểm đánh giá (0–5)</label><input id="nhRating" type="number" min="0" max="5" step="0.1"><p class="field__err" id="eRating" hidden></p></div>' +
          '<div class="field"><label for="nhTopic">Chuyên đề đang tư vấn</label><input id="nhTopic" type="text" maxlength="70" placeholder="Để trống nếu chưa có"></div>' +
        '</div>' +
        '<div class="field"><label for="nhNote">Ghi chú</label><textarea id="nhNote" maxlength="200" placeholder="Tình trạng vườn, lịch sử dịch bệnh…"></textarea></div>' +
        '<p class="field__hint">' + (isNew ? 'Hồ sơ mới sẽ tự được đưa vào danh sách "Yêu cầu hỗ trợ chờ duyệt".' : 'Thay đổi chỉ lưu trên trình duyệt này.') + '</p>';

      const f = (id) => form.querySelector('#' + id);
      CROPS.slice().sort().forEach((c) => {
        const o = document.createElement('option');
        o.value = c; o.textContent = c + ' (' + groupOf(c) + ')';
        f('nhCrop').appendChild(o);
      });
      STATUSES.forEach((s) => {
        const o = document.createElement('option');
        o.value = s; o.textContent = s;
        f('nhStatus').appendChild(o);
      });
      const co = document.createElement('option');
      co.value = ''; co.textContent = 'Chưa tham gia tổ nhóm';
      f('nhCoop').appendChild(co);
      COOPS.forEach((c) => {
        const o = document.createElement('option');
        o.value = c.id; o.textContent = c.name;
        f('nhCoop').appendChild(o);
      });

      f('nhName').value = rec.name;
      f('nhPhone').value = rec.phone;
      f('nhCrop').value = rec.crop;
      f('nhArea').value = rec.areaHa || '';
      f('nhLoc').value = rec.loc;
      f('nhStatus').value = rec.status;
      f('nhCoop').value = rec.coopId || '';
      f('nhRating').value = rec.rating || '';
      f('nhTopic').value = rec.topic || '';
      f('nhNote').value = rec.note;

      function hint() { f('nhHint').textContent = 'Nhóm cây trồng: ' + groupOf(f('nhCrop').value); }
      f('nhCrop').addEventListener('change', hint);
      hint();

      const CHECKS = [
        { input: f('nhName'), box: 'eName', bad: () => f('nhName').value.trim().length < 3, msg: 'Họ tên phải từ 3 ký tự trở lên.' },
        { input: f('nhPhone'), box: 'ePhone', bad: () => { const d = digits(f('nhPhone').value); return d.length < 9 || d.length > 11 || d.charAt(0) !== '0'; }, msg: 'Số điện thoại Việt Nam phải có 10–11 số và bắt đầu bằng 0.' },
        { input: f('nhArea'), box: 'eArea', bad: () => { const v = Number(f('nhArea').value); return !(v > 0 && v <= 500); }, msg: 'Diện tích phải là số lớn hơn 0 và không quá 500 ha.' },
        { input: f('nhLoc'), box: 'eLoc', bad: () => f('nhLoc').value.trim().length < 4, msg: 'Địa chỉ là bắt buộc, ghi rõ xã và huyện.' },
        { input: f('nhRating'), box: 'eRating', bad: () => { const v = f('nhRating').value; return v !== '' && !(Number(v) >= 0 && Number(v) <= 5); }, msg: 'Điểm đánh giá từ 0 đến 5.' }
      ];

      function submit() {
        let bad = 0;
        CHECKS.forEach((c) => {
          const isBad = c.bad();
          const box = f(c.box);
          box.hidden = !isBad;
          box.textContent = c.msg;
          c.input.classList.toggle('invalid', isBad);
          if (isBad && !bad) { c.input.focus(); }
          if (isBad) bad++;
        });
        if (bad) { showToast('Còn ' + bad + ' trường chưa hợp lệ.', 'bad'); return; }

        const dup = households.find((y) => digits(y.phone) === digits(f('nhPhone').value) && y.id !== rec.id);
        if (dup) {
          const box = f('ePhone');
          box.hidden = false;
          box.textContent = 'Số điện thoại này đã có trong danh bạ (' + dup.name + ').';
          f('nhPhone').classList.add('invalid');
          showToast('Trùng số điện thoại của ' + dup.name + '.', 'bad');
          return;
        }

        const data = {
          name: f('nhName').value.trim(),
          phone: fmtPhone(f('nhPhone').value),
          crop: f('nhCrop').value,
          areaHa: Math.round(Number(f('nhArea').value) * 100) / 100,
          loc: f('nhLoc').value.trim(),
          status: f('nhStatus').value,
          coopId: f('nhCoop').value || null,
          rating: f('nhRating').value === '' ? 0 : Math.round(Number(f('nhRating').value) * 10) / 10,
          topic: f('nhTopic').value.trim(),
          note: f('nhNote').value.trim() || (isNew ? 'Vừa được chuyên gia thêm vào danh bạ.' : '')
        };

        if (isNew) {
          const id = households.reduce((m, y) => Math.max(m, Number(y.id) || 0), 0) + 1;
          const hh = Object.assign(blankHH(), data, { id: id, joined: new Date().toISOString().slice(0, 10), origin: 'local' });
          households.unshift(hh);
          state.pending.push({ id: Date.now(), hhId: id, name: hh.name, type: 'Đăng ký nông hộ mới', detail: fmtArea(hh.areaHa) + ' ' + hh.crop.toLowerCase() + ' tại ' + hh.loc + '.', at: new Date().toISOString() });
        } else {
          Object.assign(rec, data);
          rec.origin = 'local';
        }
        const ok = save();
        closeModal();
        render();
        showToast((isNew ? 'Đã thêm hồ sơ ' : 'Đã cập nhật hồ sơ ') + data.name + ' · ' + fmtArea(data.areaHa) + '.' + (ok ? '' : ' (không ghi được xuống bộ nhớ)'), 'ok');
      }

      openModal(isNew ? 'Thêm nông hộ mới' : 'Sửa hồ sơ — ' + rec.name, form, [
        { label: 'Hủy', onClick: closeModal },
        { label: isNew ? 'Lưu hồ sơ' : 'Cập nhật', primary: true, onClick: submit }
      ]);
      f('nhName').focus();
    }

    /* ---------- Nút phụ ---------- */
    $('#btnAddHousehold').addEventListener('click', () => openForm(null));
    $('#btnHhSeed').addEventListener('click', () => {
      const wrap = h('div');
      wrap.appendChild(h('p', 'row__text', 'Thay toàn bộ danh bạ hiện tại bằng ' + SEED_HH.length + ' hồ sơ mẫu và ' + SEED_PENDING.length + ' yêu cầu chờ duyệt ban đầu?'));
      wrap.appendChild(h('div', 'note note--warn', 'Mọi hồ sơ bạn đã thêm hoặc sửa trên trình duyệt này sẽ bị xóa.'));
      openModal('Khôi phục dữ liệu mẫu', wrap, [
        { label: 'Hủy', onClick: closeModal },
        { label: 'Khôi phục', danger: true, onClick: () => {
            state = seedState();
            households = state.households;
            const ok = save();
            closeModal();
            clearFilters();
            showToast('Đã khôi phục ' + SEED_HH.length + ' hồ sơ mẫu.' + (ok ? '' : ' (không ghi được xuống bộ nhớ)'), 'ok');
          } }
      ]);
    });

    searchEl.addEventListener('input', render);
    cropEl.addEventListener('change', render);
    statusEl.addEventListener('change', render);

    render();
    if (loadedFrom !== 'máy này') save();
  }

  /* =========================================================
     3. THƯ VIỆN TÀI NGUYÊN
     ========================================================= */
  function initLibrary() {
    const LIB_KEY = 'smartagri_library_v1';
    const userName = sessionStorage.getItem('smartagri_user') || 'Nguyễn Văn Nam';

    const CATS = ['Quy trình', 'Sổ tay', 'Tài liệu AI', 'Video', 'Biểu mẫu'];
    const CAT_ICON = { 'Quy trình': 'i-file', 'Sổ tay': 'i-book', 'Tài liệu AI': 'i-ai', 'Video': 'i-play', 'Biểu mẫu': 'i-check' };
    const CAT_KIND = { 'Quy trình': '', 'Sổ tay': '', 'Tài liệu AI': 'blue', 'Video': 'amber', 'Biểu mẫu': '' };
    const ST = {
      pending: { label: 'Chờ duyệt', kind: 'wait' },
      approved: { label: 'Được duyệt', kind: 'done' },
      rejected: { label: 'Từ chối', kind: 'urgent' }
    };
    const MAX_BYTES = 25 * 1024 * 1024;
    const FORMATS = [
      { ext: '.pdf', kind: 'PDF', mime: ['application/pdf'] },
      { ext: '.docx', kind: 'DOCX', mime: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'] },
      { ext: '.pptx', kind: 'PPTX', mime: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'] },
      { ext: '.mp4', kind: 'MP4', mime: ['video/mp4'] },
      { ext: '.png', kind: 'PNG', mime: ['image/png'] },
      { ext: '.jpg', kind: 'JPG', mime: ['image/jpeg'] },
      { ext: '.jpeg', kind: 'JPG', mime: ['image/jpeg'] }
    ];
    const RULE_TEXT = 'Định dạng: PDF, DOCX, PPTX, MP4, PNG, JPG · 1 tệp · tối đa 25MB';

    /* Một tài liệu = một bản ghi: title, cat, crop, desc, source, kind,
       sizeKb, downloads, at, status, note, reviewer, file, origin. */
    function blankDoc() {
      return {
        id: 0, title: '', cat: 'Quy trình', crop: 'Lúa', desc: '', source: '', kind: 'PDF',
        sizeKb: 0, downloads: 0, at: new Date().toISOString(), status: 'pending', note: '',
        reviewer: '', file: '', origin: 'local'
      };
    }
    function isDoc(d) {
      return !!d && typeof d.title === 'string' && d.title.length >= 3
        && CATS.indexOf(d.cat) !== -1
        && typeof d.desc === 'string' && d.desc.length >= 5
        && typeof d.source === 'string' && d.source.length >= 2
        && typeof d.sizeKb === 'number' && isFinite(d.sizeKb) && d.sizeKb >= 0
        && typeof d.downloads === 'number' && isFinite(d.downloads)
        && ['pending', 'approved', 'rejected'].indexOf(d.status) !== -1
        && !isNaN(new Date(d.at).getTime());
    }

    const agoH = (hh) => new Date(Date.now() - hh * 3600000).toISOString();
    const fold = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase();
    const cut = (s) => (s.length > 32 ? s.slice(0, 32) + '…' : s);
    const fmtSize = (kb) => (kb < 1 ? Math.round(kb * 1024) + ' B' : kb >= 1024 ? (kb / 1024).toFixed(1).replace(/\.0$/, '') + ' MB' : Math.round(kb) + ' KB');
    const fmtDay = (iso) => { const d = new Date(iso); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1); };
    const pad = (n) => (n < 10 ? '0' : '') + n;
    function agoText(iso) {
      const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
      if (mins < 60) return mins + ' phút trước';
      if (mins < 2880) return Math.round(mins / 60) + ' giờ trước';
      return Math.round(mins / 1440) + ' ngày trước';
    }

    const SEED_DOCS = [
      { id: 1, title: 'Quy trình quản lý tổng hợp bệnh đạo ôn (IPM)', cat: 'Quy trình', crop: 'Lúa', desc: '6 bước giám sát, ngưỡng phun và lịch bón phân phòng bệnh.', source: 'Cục Trồng trọt & Bảo vệ thực vật', kind: 'PDF', sizeKb: 2458, downloads: 842, at: agoH(72), status: 'approved', reviewer: 'Ban Kiểm duyệt' },
      { id: 2, title: 'Sổ tay canh tác lúa chất lượng cao, phát thải thấp', cat: 'Sổ tay', crop: 'Lúa', desc: 'Tài liệu chuẩn cho đề án 1 triệu ha lúa chất lượng cao.', source: 'Bộ NN&PTNT', kind: 'PDF', sizeKb: 6246, downloads: 1290, at: agoH(120), status: 'approved', reviewer: 'Ban Kiểm duyệt' },
      { id: 3, title: 'Hướng dẫn chụp ảnh lá để AI chẩn đoán chính xác', cat: 'Tài liệu AI', crop: 'Lúa', desc: 'Khoảng cách, ánh sáng, góc chụp và cách lấy mẫu 10 lá.', source: 'Đội ngũ SmartAgri', kind: 'PDF', sizeKb: 1229, downloads: 615, at: agoH(96), status: 'approved', reviewer: 'Ban Kiểm duyệt' },
      { id: 4, title: 'Video: Sục bùn và bón phân đón đòng đúng cách', cat: 'Video', crop: 'Lúa', desc: 'Thời lượng 12 phút, quay tại mô hình Chợ Mới, An Giang.', source: 'Khuyến nông Quốc gia', kind: 'MP4', sizeKb: 151552, downloads: 431, at: agoH(240), status: 'approved', reviewer: 'Ban Kiểm duyệt' },
      { id: 5, title: 'Nhật ký canh đồng mẫu (bản in và bản số)', cat: 'Biểu mẫu', crop: 'Mọi cây', desc: 'Biểu mẫu ghi chép hoạt động cho nông hộ không dùng điện thoại.', source: 'Sở NN&PTNT An Giang', kind: 'DOCX', sizeKb: 320, downloads: 356, at: agoH(360), status: 'approved', reviewer: 'Ban Kiểm duyệt' },
      { id: 6, title: 'Quy trình xử lý ra hoa xoài cát Chu', cat: 'Quy trình', crop: 'Xoài', desc: 'Lịch xiết nước, liều phân bón và chất điều hòa sinh trưởng.', source: 'Viện Cây ăn quả miền Nam', kind: 'PDF', sizeKb: 1843, downloads: 288, at: agoH(480), status: 'approved', reviewer: 'Ban Kiểm duyệt' },
      { id: 7, title: 'Bảng tra liều thuốc bảo vệ thực vật theo ngưỡng', cat: 'Sổ tay', crop: 'Lúa', desc: 'Danh mục thuốc được phép dùng, liều lượng và thời gian cách ly.', source: 'Chi cục Trồng trọt & BVTV Đồng Tháp', kind: 'PDF', sizeKb: 980, downloads: 702, at: agoH(720), status: 'approved', reviewer: 'Ban Kiểm duyệt' },
      { id: 8, title: 'Tài liệu AI dự báo năng suất theo thời tiết', cat: 'Tài liệu AI', crop: 'Lúa', desc: 'Cách mô hình đọc dữ liệu nhật ký và cho ra khuyến nghị.', source: 'Đại học Cần Thơ', kind: 'PPTX', sizeKb: 2150, downloads: 197, at: agoH(900), status: 'approved', reviewer: 'Ban Kiểm duyệt' },
      { id: 9, title: 'Video: Tiêu nước và phơi ải sau thu hoạch', cat: 'Video', crop: 'Lúa', desc: 'Giảm nguồn bệnh cho vụ sau, thời lượng 9 phút.', source: 'Khuyến nông Quốc gia', kind: 'MP4', sizeKb: 114688, downloads: 264, at: agoH(1080), status: 'approved', reviewer: 'Ban Kiểm duyệt' },
      { id: 10, title: 'Quy trình tưới ướt – khô xen kẽ vụ Đông Xuân', cat: 'Quy trình', crop: 'Lúa', desc: 'Lịch tưới 3 giai đoạn, cách đo mực nước và ghi nhật ký đồng.', source: 'Viện Khoa học Thủy lợi Việt Nam', kind: 'PDF', sizeKb: 1840, downloads: 0, at: agoH(3), status: 'pending' },
      { id: 11, title: 'Bộ ảnh lá lúa đốm nâu phục vụ huấn luyện AI', cat: 'Tài liệu AI', crop: 'Lúa', desc: '2.400 ảnh đồng ruộng đã gán nhãn theo 6 lớp bệnh.', source: 'Đại học Cần Thơ – Khoa NN&TT', kind: 'PNG', sizeKb: 12800, downloads: 0, at: agoH(28), status: 'pending' },
      { id: 12, title: 'Video phun thuốc bằng UAV trên ruộng lớn', cat: 'Video', crop: 'Lúa', desc: 'Kỹ thuật bay, an toàn thuốc và bài toán chi phí cho 10 ha.', source: 'Công ty Nông nghiệp số MEKONG', kind: 'MP4', sizeKb: 245760, downloads: 0, at: agoH(52), status: 'pending' },
      { id: 13, title: 'Bảng giá vật tư nông nghiệp năm 2024', cat: 'Biểu mẫu', crop: 'Mọi cây', desc: 'Bảng kê giá phân bón và thuốc BVTV theo thương lái.', source: 'Cơ sở tự tổng hợp', kind: 'DOCX', sizeKb: 210, downloads: 0, at: agoH(1200), status: 'rejected', reviewer: 'Ban Kiểm duyệt', note: 'Số liệu cũ hơn 12 tháng, không ghi đơn vị ban hành nên không đủ điều kiện phổ biến.' }
    ].map((x) => Object.assign(blankDoc(), x, { origin: 'demo' }));

    function seedState() {
      return { version: 1, updatedAt: new Date().toISOString(), docs: SEED_DOCS.map((d) => Object.assign({}, d)) };
    }

    let state = seedState();
    let loadedFrom = 'mẫu';
    try {
      const raw = localStorage.getItem(LIB_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        const good = p && Array.isArray(p.docs) ? p.docs.filter(isDoc) : [];
        if (good.length) {
          state = { version: 1, updatedAt: p.updatedAt || state.updatedAt, docs: good.map((d) => Object.assign(blankDoc(), d)) };
          loadedFrom = 'máy này';
        }
      }
    } catch (err) { state = seedState(); }

    let docs = state.docs;
    function save() {
      state.updatedAt = new Date().toISOString();
      try { localStorage.setItem(LIB_KEY, JSON.stringify(state)); } catch (err) { showToast('Không lưu được vào trình duyệt (bộ nhớ đầy).', 'bad'); }
    }
    const nextId = () => docs.reduce((m, d) => Math.max(m, d.id), 0) + 1;

    /* Tệp thật chỉ sống trong phiên này; localStorage không chứa binary. */
    const blobs = {};

    let cat = '';
    let st = '';
    const grid = $('#libGrid');

    function matchedFields(d, q) {
      const where = [];
      if (q && fold(d.title).indexOf(q) !== -1) where.push('tên');
      if (q && fold(d.desc).indexOf(q) !== -1) where.push('mô tả');
      if (q && fold(d.source).indexOf(q) !== -1) where.push('nguồn');
      if (q && (fold(d.crop).indexOf(q) !== -1 || fold(d.cat).indexOf(q) !== -1 || fold(d.kind).indexOf(q) !== -1)) where.push('loại');
      return where;
    }
    function visible() {
      const q = fold($('#libSearch').value.trim());
      return docs.filter((d) => {
        if (st && d.status !== st) return false;
        if (cat && d.cat !== cat) return false;
        if (q && !matchedFields(d, q).length) return false;
        return true;
      });
    }

    function render() {
      const sort = $('#libSort').value;
      let shown = visible();
      if (sort === 'hot') shown = shown.slice().sort((a, b) => b.downloads - a.downloads);
      if (sort === 'az') shown = shown.slice().sort((a, b) => a.title.localeCompare(b.title, 'vi'));
      if (sort === 'new') shown = shown.slice().sort((a, b) => new Date(b.at) - new Date(a.at));

      grid.innerHTML = '';
      shown.forEach(resCard);

      const q = $('#libSearch').value.trim();
      const filtering = q || cat || st;
      const emptyEl = $('#libEmpty');
      emptyEl.hidden = shown.length !== 0;
      emptyEl.textContent = docs.length
        ? 'Không có tài liệu nào khớp bộ lọc hiện tại.'
        : 'Thư viện trống. Bấm "Thêm tài liệu" để gửi tệp đầu tiên.';
      if (!emptyEl.hidden && filtering) {
        const clr = h('button', 'linkbtn', ' Xóa bộ lọc');
        clr.type = 'button';
        clr.addEventListener('click', clearFilters);
        emptyEl.appendChild(clr);
      }

      $('#libSummary').textContent = docs.length + ' tài liệu · ' + count('approved') + ' đã duyệt, hiển thị công khai';
      const info = $('#libInfo');
      info.textContent = 'Đang hiển thị ' + shown.length + '/' + docs.length + ' tài liệu · ' +
        (st ? 'trạng thái ' + ST[st].label : 'mọi trạng thái') + (cat ? ' · loại ' + cat : '') +
        (q ? ' · từ khóa "' + q + '"' : '');
      if (q && shown.length) {
        const hits = {};
        shown.forEach((d) => matchedFields(d, fold(q)).forEach((f) => { hits[f] = (hits[f] || 0) + 1; }));
        info.appendChild(document.createTextNode(' Khớp theo: ' + Object.keys(hits).map((k) => k + ' (' + hits[k] + ')').join(', ') + '.'));
      }
      if (filtering) {
        const clr = h('button', 'linkbtn', 'Xóa bộ lọc');
        clr.type = 'button';
        clr.addEventListener('click', clearFilters);
        info.appendChild(document.createTextNode(' '));
        info.appendChild(clr);
      }

      renderStats();
      renderQueue();
      renderMine();
    }

    const count = (s) => docs.filter((d) => d.status === s).length;

    function clearFilters() {
      $('#libSearch').value = '';
      cat = '';
      st = '';
      qa('#libCats .pill').forEach((p, i) => p.classList.toggle('is-on', i === 0));
      qa('#libStatus .pill').forEach((p, i) => p.classList.toggle('is-on', i === 3));
      render();
    }

    function metaLine(host, pairs) {
      const meta = h('div', 'res__meta');
      pairs.forEach((p) => {
        const s = h('span');
        s.innerHTML = icon(p[0]);
        s.appendChild(document.createTextNode(' ' + p[1]));
        meta.appendChild(s);
      });
      host.appendChild(meta);
    }

    function resCard(d) {
      const card = h('article', 'res');
      card.id = 'doc-' + d.id;
      const top = h('div', 'res__top');
      const ic = h('span', 'res__icon' + (CAT_KIND[d.cat] ? ' res__icon--' + CAT_KIND[d.cat] : ''));
      ic.innerHTML = icon(CAT_ICON[d.cat] || 'i-file');
      const badges = h('div', 'res__badges');
      badges.append(chip(d.kind, 'off'), chip(ST[d.status].label, ST[d.status].kind));
      top.append(ic, badges);
      card.appendChild(top);
      card.appendChild(h('p', 'res__title', d.title));
      card.appendChild(h('p', 'res__desc', d.desc));
      const src = h('p', 'res__src');
      src.innerHTML = icon('i-shield');
      src.appendChild(document.createTextNode(' Nguồn: ' + d.source));
      card.appendChild(src);
      metaLine(card, [['i-book', d.cat], ['i-sprout', d.crop], ['i-file', fmtSize(d.sizeKb)], ['i-download', d.downloads + ' lượt tải'], ['i-calendar', fmtDay(d.at)]]);

      const acts = h('div', 'res__acts');
      acts.append(
        actBtn('Xem', 'edit', 'i-eye', () => openDoc(d)),
        actBtn('Tải', 'ok', 'i-download', () => downloadDoc(d))
      );
      if (d.status === 'pending') acts.append(actBtn('Duyệt', 'ok', 'i-check', () => approve(d)));
      if (d.status === 'rejected') acts.append(actBtn('Gửi lại hàng đợi', 'edit', 'i-refresh', () => reopen(d)));
      card.appendChild(acts);
      grid.appendChild(card);
    }

    /* ---------- 4 thẻ chỉ số, tính lại từ đúng danh sách ---------- */
    function renderStats() {
      const pend = docs.filter((d) => d.status === 'pending').sort((a, b) => new Date(a.at) - new Date(b.at));
      const totalDl = docs.reduce((s, d) => s + d.downloads, 0);
      const top = docs.slice().sort((a, b) => b.downloads - a.downloads)[0];
      const nDemo = docs.filter((d) => d.origin === 'demo').length;

      $('#statDocs').textContent = pad(docs.length);
      $('#statDocsDelta').textContent = nDemo + ' tài liệu mẫu · ' + (docs.length - nDemo) + ' do bạn gửi trên máy này';
      $('#statApproved').textContent = pad(count('approved'));
      $('#statApprovedDelta').textContent = count('rejected') + ' tài liệu bị từ chối · ' + CATS.length + ' loại tài liệu';
      $('#statPending').textContent = pad(pend.length);
      $('#statPendingDelta').textContent = pend.length ? 'Chờ lâu nhất: ' + agoText(pend[0].at) : 'Hàng đợi trống';
      $('#statDownloads').textContent = totalDl.toLocaleString('vi-VN');
      $('#statDownloadsDelta').textContent = top && top.downloads ? 'Nhiều nhất: ' + cut(top.title) : 'Chưa có lượt tải nào';
    }

    /* ---------- Hàng đợi kiểm duyệt ---------- */
    function renderQueue() {
      const host = $('#queueList');
      host.innerHTML = '';
      const pend = docs.filter((d) => d.status === 'pending').sort((a, b) => new Date(a.at) - new Date(b.at));
      $('#queueEmpty').hidden = pend.length !== 0;
      pend.forEach((d) => {
        const row = listRow(host, {
          icon: CAT_ICON[d.cat] || 'i-file',
          iconKind: CAT_KIND[d.cat],
          title: d.title,
          chip: d.kind,
          chipKind: 'off',
          text: d.desc,
          meta: [['i-shield', d.source], ['i-book', d.cat], ['i-clock', 'gửi ' + agoText(d.at)]],
          acts: [
            actBtn('Xem', 'edit', 'i-eye', () => openDoc(d)),
            actBtn('Duyệt', 'ok', 'i-check', () => approve(d)),
            actBtn('Từ chối', 'del', 'i-close', () => rejectFlow(d))
          ]
        });
        row.id = 'queue-' + d.id;
      });
      $('#queueCaption').textContent = count('pending') + ' chờ duyệt · ' + count('approved') + ' đã duyệt · ' + count('rejected') + ' từ chối';
    }

    function renderMine() {
      const host = $('#myDocs');
      host.innerHTML = '';
      const mine = docs.filter((d) => d.origin === 'local');
      $('#myEmpty').hidden = mine.length !== 0;
      mine.forEach((d) => {
        const row = listRow(host, {
          icon: CAT_ICON[d.cat] || 'i-file',
          title: d.title,
          chip: ST[d.status].label,
          chipKind: ST[d.status].kind,
          text: d.status === 'rejected' ? 'Lý do từ chối: ' + d.note : (d.status === 'approved' ? 'Đã công khai trong kho' + (d.reviewer ? ' · người duyệt: ' + d.reviewer : '') : 'Đang chờ ban kiểm duyệt xử lý'),
          meta: [['i-book', d.cat], ['i-shield', d.source], ['i-clock', agoText(d.at)]]
        });
        row.id = 'mine-' + d.id;
        const acts = h('div', 'row__acts');
        acts.append(actBtn('Xem', 'edit', 'i-eye', () => openDoc(d)));
        if (d.status === 'rejected') acts.append(actBtn('Gửi lại', 'ok', 'i-refresh', () => reopen(d)));
        row.querySelector('.row__side').appendChild(acts);
      });
    }

    function approve(d) {
      d.status = 'approved';
      d.reviewer = userName;
      d.note = '';
      d.reviewedAt = new Date().toISOString();
      save();
      render();
      showToast('Đã duyệt "' + cut(d.title) + '". Tài liệu xuất hiện trong kho.', 'ok');
    }

    function reopen(d) {
      d.status = 'pending';
      d.note = '';
      d.reviewer = '';
      save();
      render();
      showToast('Đã đưa "' + cut(d.title) + '" về hàng đợi kiểm duyệt.', 'ok');
    }

    function rejectFlow(d) {
      const wrap = h('div');
      wrap.appendChild(h('p', 'row__text', 'Nêu rõ lý do để chuyên gia chỉnh sửa rồi gửi lại. Lý do hiển thị ở mục "Tài liệu tôi đã gửi".'));
      const f = h('div', 'field');
      const lab = h('label', '', 'Lý do từ chối *');
      lab.htmlFor = 'rejReason';
      const ta = h('textarea');
      ta.id = 'rejReason';
      ta.rows = 3;
      ta.placeholder = 'Ví dụ: Tài liệu quá 12 tháng, cần ghi rõ đơn vị ban hành.';
      const err = h('p', 'field__err');
      err.hidden = true;
      f.append(lab, ta, err);
      wrap.appendChild(f);
      openModal('Từ chối: ' + cut(d.title), wrap, [
        { label: 'Giữ lại hàng đợi', onClick: closeModal },
        { label: 'Từ chối tài liệu', danger: true, onClick: () => {
            const v = ta.value.trim();
            if (v.length < 8) {
              err.textContent = 'Lý do cần tối thiểu 8 ký tự.';
              err.hidden = false;
              ta.classList.add('invalid');
              ta.focus();
              return;
            }
            d.status = 'rejected';
            d.note = v;
            d.reviewer = userName;
            d.reviewedAt = new Date().toISOString();
            save();
            closeModal();
            render();
            showToast('Đã từ chối "' + cut(d.title) + '".', 'bad');
          } }
      ]);
    }

    /* ---------- Xem và tải tài liệu ---------- */
    function noteBox(text, cls) {
      const n = h('p', 'note' + (cls ? ' ' + cls : ''));
      n.innerHTML = icon('i-alert');
      n.appendChild(document.createTextNode(text));
      return n;
    }

    function previewNode(d) {
      const box = h('div', 'preview');
      const f = blobs[d.id];
      if (f && /^image\//.test(f.mime)) {
        const img = h('img', 'preview__img');
        img.src = f.url;
        img.alt = d.title;
        box.appendChild(img);
      } else if (f && f.mime === 'application/pdf') {
        const fr = h('iframe', 'preview__frame');
        fr.src = f.url;
        fr.title = d.title;
        box.appendChild(fr);
      } else if (f) {
        box.appendChild(noteBox('Tệp ' + f.kind + ' không xem trực tiếp trong trình duyệt được. Bấm "Mở tệp" ở dưới để xem ở tab mới.'));
      } else {
        const sheet = h('div', 'docsheet');
        sheet.appendChild(h('p', 'docsheet__src', d.source));
        sheet.appendChild(h('p', 'docsheet__title', d.title));
        sheet.appendChild(h('p', 'docsheet__body', d.desc));
        sheet.appendChild(h('p', 'docsheet__foot', d.cat + ' · áp dụng cho ' + d.crop + ' · ' + fmtSize(d.sizeKb)));
        box.appendChild(sheet);
        box.appendChild(noteBox('Tài liệu mẫu: bản demo không đính kèm tệp gốc, đây là trang xem trước do hệ thống dựng từ dữ liệu thư viện.'));
      }
      return box;
    }

    function openDoc(d) {
      const wrap = h('div');
      wrap.appendChild(previewNode(d));
      wrap.appendChild(detailList([
        ['Tên tài nguyên', d.title],
        ['Loại tài liệu', d.cat],
        ['Định dạng tệp', d.kind + ' · ' + fmtSize(d.sizeKb)],
        ['Mô tả', d.desc],
        ['Nguồn', d.source],
        ['Áp dụng cho', d.crop],
        ['Trạng thái kiểm duyệt', ST[d.status].label + (d.reviewer ? ' · ' + d.reviewer : '')],
        ['Cập nhật', new Date(d.at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' (' + agoText(d.at) + ')'],
        ['Lượt tải', String(d.downloads)],
        ['Tệp đính kèm', blobs[d.id] ? blobs[d.id].name + ' (phiên này)' : (d.file ? d.file + ' — tệp gốc chỉ có ở phiên đã tải lên' : 'Không có')]
      ]));
      if (d.status === 'rejected') wrap.appendChild(noteBox('Lý do từ chối: ' + d.note, 'note--bad'));
      const acts = [{ label: 'Đóng', onClick: closeModal }];
      if (blobs[d.id]) {
        acts.push({ label: 'Mở tệp', onClick: () => window.open(blobs[d.id].url, '_blank') });
      }
      if (d.status === 'pending') acts.push({ label: 'Duyệt tài liệu', primary: true, onClick: () => { approve(d); closeModal(); } });
      else if (d.status === 'rejected') acts.push({ label: 'Về hàng đợi', primary: true, onClick: () => { reopen(d); closeModal(); } });
      else acts.push({ label: 'Tải xuống', primary: true, onClick: () => downloadDoc(d) });
      openModal('Tài nguyên #' + d.id, wrap, acts);
    }

    const slug = (s) => (fold(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'tai-lieu');

    function textOf(d) {
      return [
        'SMARTAGRI — TÀI LIỆU MINH HỌA TRONG BẢN DEMO',
        '================================================',
        '',
        'Tên tài nguyên : ' + d.title,
        'Loại tài liệu  : ' + d.cat,
        'Định dạng gốc  : ' + d.kind + ' (' + fmtSize(d.sizeKb) + ')',
        'Nguồn          : ' + d.source,
        'Áp dụng cho    : ' + d.crop,
        'Trạng thái     : ' + ST[d.status].label + (d.reviewer ? ' (' + d.reviewer + ')' : ''),
        'Cập nhật       : ' + new Date(d.at).toLocaleString('vi-VN'),
        '',
        'MÔ TẢ',
        d.desc,
        '',
        'Ghi chú: đây là bản demo môn học nên tệp gốc không được lưu trong trình duyệt.',
        'File .txt này do trang Thư viện tài nguyên tạo ra ngay khi bạn bấm Tải xuống.'
      ].join('\n');
    }

    function downloadDoc(d) {
      const f = blobs[d.id];
      let url;
      let name;
      if (f) {
        url = f.url;
        name = f.name;
      } else {
        url = URL.createObjectURL(new Blob(['' + textOf(d)], { type: 'text/plain;charset=utf-8' }));
        name = slug(d.title) + '.txt';
      }
      const a = h('a');
      a.href = url;
      a.download = name;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { a.remove(); if (!f) URL.revokeObjectURL(url); }, 2000);
      d.downloads += 1;
      save();
      render();
      showToast(f ? 'Đang tải tệp ' + name : 'Đang tải bản tóm tắt .txt của tài liệu mẫu.', 'ok');
    }

    /* ---------- Bộ lọc ---------- */
    qa('#libStatus .pill').forEach((p) => {
      p.addEventListener('click', () => {
        qa('#libStatus .pill').forEach((x) => x.classList.remove('is-on'));
        p.classList.add('is-on');
        st = p.dataset.st;
        render();
      });
    });
    qa('#libCats .pill').forEach((p) => {
      p.addEventListener('click', () => {
        qa('#libCats .pill').forEach((x) => x.classList.remove('is-on'));
        p.classList.add('is-on');
        cat = p.dataset.cat;
        render();
      });
    });
    $('#libSearch').addEventListener('input', render);
    $('#libSort').addEventListener('change', render);

    $('#btnNewDoc').addEventListener('click', () => {
      $('#libDrop').scrollIntoView({ behavior: 'smooth', block: 'center' });
      $('#libFile').focus();
      showToast('Chọn tệp và điền thông tin ở khung “Đóng góp tài liệu”.');
    });

    $('#btnLibSeed').addEventListener('click', () => {
      const wrap = h('div');
      wrap.appendChild(h('p', 'row__text', 'Khôi phục 13 tài liệu mẫu và xóa toàn bộ tài liệu bạn đã gửi trên máy này. Hành động này không thể hoàn tác.'));
      openModal('Khôi phục dữ liệu mẫu', wrap, [
        { label: 'Giữ lại', onClick: closeModal },
        { label: 'Khôi phục', danger: true, onClick: () => {
            Object.keys(blobs).forEach((k) => { URL.revokeObjectURL(blobs[k].url); delete blobs[k]; });
            state = seedState();
            docs = state.docs;
            save();
            closeModal();
            clearFilters();
            showToast('Đã khôi phục ' + docs.length + ' tài liệu mẫu.', 'ok');
          } }
      ]);
    });

    /* ---------- Chọn tệp + kiểm tra định dạng, dung lượng ---------- */
    const drop = $('#libDrop');
    const fileInput = $('#libFile');
    const pickedBox = $('#pickedBox');
    const errEl = $('#libFileError');
    let picked = null;

    $('#libRules').textContent = RULE_TEXT;

    function setFileErr(msg) { errEl.textContent = msg || ''; errEl.hidden = !msg; }

    function checkFile(f) {
      const nm = f.name.toLowerCase();
      const fmt = FORMATS.filter((x) => nm.endsWith(x.ext)).pop();
      if (!fmt) return 'Định dạng không được hỗ trợ. Chỉ nhận PDF, DOCX, PPTX, MP4, PNG, JPG (tệp: "' + f.name + '").';
      if (!f.size) return 'Tệp "' + f.name + '" rỗng (0 byte), không tải lên được.';
      if (f.size > MAX_BYTES) return 'Tệp "' + f.name + '" nặng ' + fmtSize(f.size / 1024) + ', vượt mức tối đa 25MB.';
      if (f.type && fmt.mime.indexOf(f.type) === -1) {
        return 'Tệp "' + f.name + '" có phần mở rộng ' + fmt.kind + ' nhưng trình duyệt đọc là ' + f.type + ' — kiểm tra lại tệp.';
      }
      return '';
    }

    function paintPicked() {
      if (!picked) { pickedBox.hidden = true; return; }
      pickedBox.hidden = false;
      $('#pickedName').textContent = picked.name;
      $('#pickedMeta').textContent = picked.kind + ' · ' + fmtSize(picked.sizeKb) + ' · hợp lệ';
    }

    function accept(files) {
      setFileErr('');
      const list = Array.from(files || []);
      if (!list.length) return;
      if (list.length > 1) { setFileErr('Mỗi tài liệu chỉ đính kèm 1 tệp. Bạn vừa chọn ' + list.length + ' tệp, hãy chọn lại.'); return; }
      const f = list[0];
      const err = checkFile(f);
      if (err) { setFileErr(err); picked = null; paintPicked(); return; }
      if (docs.some((d) => d.file === f.name && Math.abs(d.sizeKb - f.size / 1024) < 0.5)) {
        setFileErr('Tệp "' + f.name + '" đã có trong thư viện.');
        return;
      }
      if (picked) URL.revokeObjectURL(picked.url);
      const fmt = FORMATS.filter((x) => f.name.toLowerCase().endsWith(x.ext)).pop();
      picked = { name: f.name, kind: fmt.kind, mime: f.type || fmt.mime[0], sizeKb: f.size / 1024, url: URL.createObjectURL(f) };
      paintPicked();
    }

    drop.addEventListener('click', () => fileInput.click());
    drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
    fileInput.addEventListener('change', () => { accept(fileInput.files); fileInput.value = ''; });
    ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
    ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('is-over'); }));
    drop.addEventListener('drop', (e) => accept(e.dataTransfer.files));
    $('#btnDropFile').addEventListener('click', () => {
      if (picked) URL.revokeObjectURL(picked.url);
      picked = null;
      paintPicked();
      setFileErr('');
    });

    /* ---------- Kiểm tra trường bắt buộc ---------- */
    const FIELDS = [
      { el: '#upTitle', err: '#errTitle', min: 8, msg: 'Tên tài nguyên cần tối thiểu 8 ký tự.' },
      { el: '#upSource', err: '#errSource', min: 3, msg: 'Nguồn / đơn vị ban hành cần tối thiểu 3 ký tự.' },
      { el: '#upDesc', err: '#errDesc', min: 20, msg: 'Mô tả cần tối thiểu 20 ký tự.' }
    ];
    function checkField(f) {
      const node = $(f.el);
      const bad = node.value.trim().length < f.min;
      node.classList.toggle('invalid', bad);
      const e = $(f.err);
      e.textContent = bad ? f.msg : '';
      e.hidden = !bad;
      return !bad;
    }
    FIELDS.forEach((f) => $(f.el).addEventListener('input', () => checkField(f)));

    $('#uploadForm').addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      FIELDS.forEach((f) => { if (!checkField(f)) ok = false; });
      if (!picked) { setFileErr('Chọn một tệp hợp lệ (' + RULE_TEXT + ') trước khi gửi.'); ok = false; }
      if (!ok) { showToast('Chưa gửi được: kiểm tra lại tệp và các trường bắt buộc.', 'bad'); return; }

      const d = Object.assign(blankDoc(), {
        id: nextId(),
        title: $('#upTitle').value.trim(),
        source: $('#upSource').value.trim(),
        desc: $('#upDesc').value.trim(),
        cat: $('#upCat').value,
        crop: $('#upCrop').value,
        kind: picked.kind,
        sizeKb: picked.sizeKb,
        file: picked.name,
        status: 'pending',
        origin: 'local',
        at: new Date().toISOString()
      });
      blobs[d.id] = { url: picked.url, name: picked.name, mime: picked.mime, kind: picked.kind };
      picked = null;
      docs.unshift(d);
      save();
      paintPicked();
      setFileErr('');
      ['#upTitle', '#upSource', '#upDesc'].forEach((s) => { $(s).value = ''; });
      FIELDS.forEach((f) => { $(f.el).classList.remove('invalid'); $(f.err).hidden = true; });
      render();
      showToast('Đã gửi "' + cut(d.title) + '" — đang chờ kiểm duyệt.', 'ok');
    });

    const topics = [
      ['Đạo ôn lá', 'đạo ôn'],
      ['Thuốc bảo vệ thực vật', 'thuốc bảo vệ'],
      ['Bón phân đón đòng', 'bón phân'],
      ['Chụp ảnh lá cho AI', 'chụp ảnh'],
      ['Xử lý ra hoa xoài', 'xoài'],
      ['Tiêu nước sau thu hoạch', 'tiêu nước'],
      ['Phát thải thấp', 'phát thải thấp'],
      ['Dự báo năng suất', 'dự báo'],
      ['Nhật ký canh đồng', 'nhật ký'],
      ['Tưới ướt khô xen kẽ', 'tưới'],
      ['Phun thuốc UAV', 'uav']
    ];
    const tagHost = $('#topicTags');
    topics.forEach((t) => {
      const b = h('button', 'pill', t[0]);
      b.type = 'button';
      b.addEventListener('click', () => {
        $('#libSearch').value = t[1];
        render();
        showToast('Đang lọc theo chủ đề: ' + t[0]);
      });
      tagHost.appendChild(b);
    });

    render();
    if (loadedFrom !== 'máy này') save();
  }

  /* =========================================================
     4. QUẢN LÝ CHUYÊN GIA
     ========================================================= */
  function initExperts() {
    const EX_KEY = 'smartagri_experts_v1';
    const HH_KEY = 'smartagri_households_v1';
    const userName = sessionStorage.getItem('smartagri_user') || 'Nguyễn Văn Nam';

    const FIELDS = ['Bảo vệ thực vật', 'Thổ nhưỡng & phân bón', 'Thủy nông', 'Cây ăn trái', 'Sau thu hoạch & chế biến'];
    const CROPS = ['Lúa', 'Xoài', 'Sầu riêng', 'Rau màu', 'Điều', 'Cà phê'];
    const REQ_ST = {
      open: { label: 'Chờ phân công', kind: 'wait' },
      assigned: { label: 'Đã phân công', kind: 'mid' },
      done: { label: 'Hoàn thành', kind: 'done' }
    };
    const APP_ST = {
      pending: { label: 'Chờ duyệt', kind: 'wait' },
      approved: { label: 'Đã duyệt', kind: 'done' },
      rejected: { label: 'Từ chối', kind: 'urgent' }
    };

    /* Hồ sơ: name, field, exp, rating, cases, duty, status, org, note, origin, joined. */
    function blankExpert() {
      return { id: 0, name: '', field: FIELDS[0], exp: 3, rating: 4.5, cases: 0, duty: 'off', status: 'active', org: '', note: '', origin: 'local', joined: new Date().toISOString() };
    }
    function isExpert(x) {
      return !!x && typeof x.name === 'string' && x.name.length >= 3
        && FIELDS.indexOf(x.field) !== -1
        && typeof x.exp === 'number' && isFinite(x.exp) && x.exp >= 1 && x.exp <= 45
        && typeof x.rating === 'number' && x.rating >= 1 && x.rating <= 5
        && typeof x.cases === 'number' && isFinite(x.cases) && x.cases >= 0
        && ['on', 'off'].indexOf(x.duty) !== -1
        && ['active', 'probation'].indexOf(x.status) !== -1
        && typeof x.org === 'string' && x.org.length >= 2
        && !isNaN(new Date(x.joined).getTime());
    }
    /* Yêu cầu tư vấn: hh, crop, area, topic, detail, field, status, expertId, origin. */
    function blankReq() {
      return { id: 0, hh: '', crop: 'Lúa', area: '', topic: '', detail: '', field: FIELDS[0], at: new Date().toISOString(), status: 'open', expertId: 0, origin: 'local' };
    }
    function isReq(r) {
      return !!r && typeof r.hh === 'string' && r.hh.length >= 2
        && typeof r.topic === 'string' && r.topic.length >= 3
        && FIELDS.indexOf(r.field) !== -1
        && ['open', 'assigned', 'done'].indexOf(r.status) !== -1
        && typeof r.expertId === 'number' && isFinite(r.expertId)
        && !isNaN(new Date(r.at).getTime());
    }
    function isApp(a) {
      return !!a && typeof a.name === 'string' && a.name.length >= 3
        && FIELDS.indexOf(a.field) !== -1
        && typeof a.exp === 'number' && a.exp >= 0 && a.exp <= 45
        && ['pending', 'approved', 'rejected'].indexOf(a.status) !== -1
        && !isNaN(new Date(a.at).getTime());
    }

    const agoH = (hh) => new Date(Date.now() - hh * 3600000).toISOString();
    const fold = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase();
    const pad = (n) => (n < 10 ? '0' : '') + n;
    const cut = (s) => (s.length > 30 ? s.slice(0, 30) + '…' : s);
    function agoText(iso) {
      const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
      if (mins < 60) return mins + ' phút trước';
      if (mins < 2880) return Math.round(mins / 60) + ' giờ trước';
      return Math.round(mins / 1440) + ' ngày trước';
    }
    const expertOf = (id) => experts.filter((x) => x.id === id)[0] || null;

    const SEED_EXPERTS = [
      { id: 1, name: 'Nguyễn Văn Nam', field: 'Bảo vệ thực vật', exp: 12, rating: 4.9, cases: 214, duty: 'on', org: 'Chi cục Trồng trọt & BVTV An Giang', note: 'Chuyên đạo ôn, rầy nâu và khoanh vùng dịch trên ảnh vệ tinh.' },
      { id: 2, name: 'Trần Thị Hoa', field: 'Thổ nhưỡng & phân bón', exp: 9, rating: 4.8, cases: 176, duty: 'on', org: 'Sở NN&PTNT Đồng Tháp', note: 'Phân tích đất, lập công thức bón phân theo giai đoạn sinh trưởng.' },
      { id: 3, name: 'Lê Minh Tuấn', field: 'Thủy nông', exp: 7, rating: 4.6, cases: 98, duty: 'off', org: 'Viện Khoa học Thủy lợi Việt Nam', note: 'Thiết kế lịch tưới, tiêu nước và chống hạn mặn đầu vụ.' },
      { id: 4, name: 'Phạm Thu Hà', field: 'Cây ăn trái', exp: 11, rating: 4.7, cases: 143, duty: 'on', org: 'Viện Cây ăn quả miền Nam', note: 'Xoài, sầu riêng: xử lý ra hoa và nuôi trái.' },
      { id: 5, name: 'Võ Quốc Bảo', field: 'Bảo vệ thực vật', exp: 5, rating: 4.4, cases: 61, duty: 'off', org: 'HTX Nông Phát, Chợ Mới', note: 'Quản lý dịch hại tổng hợp, sử dụng thuốc an toàn.' },
      { id: 6, name: 'Đặng Ngọc Linh', field: 'Sau thu hoạch & chế biến', exp: 8, rating: 4.8, cases: 112, duty: 'on', org: 'Trường ĐH Nông Lâm TP.HCM', note: 'Bảo quản trái cây sau thu hoạch, liên kết bao tiêu sản phẩm.' }
    ].map((x) => Object.assign(blankExpert(), x, { origin: 'demo', joined: agoH(4200) }));

    const SEED_APPS = [
      { id: 101, name: 'Bùi Thanh Phong', field: 'Bảo vệ thực vật', exp: 6, org: 'Chi cục BVTV Đồng Tháp', note: 'Tốt nghiệp ĐH Cần Thơ, 6 năm tại Chi cục BVTV Đồng Tháp.', at: agoH(30), status: 'pending' },
      { id: 102, name: 'Hồ Gia Khánh', field: 'Thủy nông', exp: 4, org: 'Phòng NN&PTNT Tân Châu', note: 'Kinh nghiệm quy hoạch nội đồng vùng ngọt hóa.', at: agoH(96), status: 'pending' },
      { id: 103, name: 'Ngô Thị Mai', field: 'Cây ăn trái', exp: 9, org: 'Hội Nông dân Long Khánh', note: 'Chuyên canh sầu riêng Ri6, mô hình 3 ha tại Long Khánh.', at: agoH(200), status: 'pending' },
      { id: 104, name: 'Tạ Duy Khang', field: 'Thổ nhưỡng & phân bón', exp: 2, org: 'Doanh nghiệp phân bón GreenLife', note: 'Kỹ sư nông nghiệp, phụ trách thử nghiệm phân chậm tan.', at: agoH(150), status: 'rejected', reason: 'Số năm kinh nghiệm thực địa dưới 3 năm theo tiêu chí của nền tảng.', expertId: 0 },
      { id: 105, name: 'Lâm Bích Tuyền', field: 'Bảo vệ thực vật', exp: 7, org: 'Dự án IPM Đồng Tháp Mười', note: 'Cộng tác viên dự án IPM lúa vùng Đồng Tháp Mười.', at: agoH(320), status: 'approved', expertId: 5 }
    ].map((a) => Object.assign({ reason: '', expertId: 0, reviewer: '' }, a));

    const SEED_REQS = [
      { id: 1, hh: 'Trần Văn Bình', crop: 'Lúa', area: '1.2 ha', topic: 'Đạo ôn lá sữa', detail: 'Chẩn đoán ảnh lá và xác định ngưỡng phun cho 3 lô vụ Mùa.', field: 'Bảo vệ thực vật', at: agoH(4), status: 'open', origin: 'demo' },
      { id: 2, hh: 'Nguyễn Thị Kim Ngân', crop: 'Xoài', area: '0.6 ha', topic: 'Xử lý ra hoa xoài cát Chu', detail: 'Đang xiết nước, cần lịch tưới lại và liều chất điều hòa sinh trưởng.', field: 'Cây ăn trái', at: agoH(9), status: 'open', origin: 'demo' },
      { id: 3, hh: 'Lê Văn Tuấn', crop: 'Lúa', area: '2.4 ha', topic: 'Ngập mặn đầu vụ', detail: 'Độ mặn đo tại bờ kênh 2.1‰, cần tư vấn giải pháp tưới và bón lót.', field: 'Thủy nông', at: agoH(20), status: 'open', origin: 'demo' },
      { id: 4, hh: 'Phạm Hoàng Long', crop: 'Sầu riêng', area: '1.1 ha', topic: 'Sầu riêng Ri6 rụng trái non', detail: 'Rụng trái giai đoạn 3 tuần tuổi, đã gửi 6 ảnh hiện trường.', field: 'Cây ăn trái', at: agoH(30), status: 'assigned', expertId: 4, origin: 'demo' },
      { id: 5, hh: 'Trần Quang Huy', crop: 'Cà phê', area: '2.2 ha', topic: 'Tỉa cành và bón phân phục hồi sau thu hoạch', detail: 'Vườn kinh doanh năm thứ 7, cần lịch tỉa cành và công thức bón nuôi quả vụ tới.', field: 'Thổ nhưỡng & phân bón', at: agoH(8), status: 'assigned', expertId: 2, origin: 'demo' },
      { id: 6, hh: 'Huỳnh Văn Sơn', crop: 'Lúa', area: '3.0 ha', topic: 'Công thức bón phân đòng', detail: 'Đã trả lời: 90 kg Ure + 60 kg Kali, nông hộ xác nhận đã bón.', field: 'Thổ nhưỡng & phân bón', at: agoH(70), status: 'done', expertId: 2, origin: 'demo' }
    ].map((r) => Object.assign(blankReq(), r));

    function seedState() {
      return {
        version: 1,
        updatedAt: new Date().toISOString(),
        experts: SEED_EXPERTS.map((x) => Object.assign({}, x)),
        apps: SEED_APPS.map((a) => Object.assign({}, a)),
        requests: SEED_REQS.map((r) => Object.assign({}, r)),
        log: [{ at: agoH(70), by: 'Ban Quản trị', text: 'Khởi tạo mạng lưới 6 chuyên gia và 6 yêu cầu tư vấn mẫu.' }]
      };
    }

    let state = seedState();
    let loadedFrom = 'mẫu';
    try {
      const raw = localStorage.getItem(EX_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p && Array.isArray(p.experts) && Array.isArray(p.apps) && Array.isArray(p.requests)) {
          state = {
            version: 1,
            updatedAt: p.updatedAt || state.updatedAt,
            experts: p.experts.filter(isExpert).map((x) => Object.assign(blankExpert(), x)),
            apps: (Array.isArray(p.apps) ? p.apps.filter(isApp) : []).map((a) => Object.assign({ reason: '', expertId: 0, reviewer: '' }, a)),
            requests: (Array.isArray(p.requests) ? p.requests.filter(isReq) : []).map((r) => Object.assign(blankReq(), r)),
            log: (Array.isArray(p.log) ? p.log : []).filter((l) => l && typeof l.text === 'string' && !isNaN(new Date(l.at).getTime()))
          };
          loadedFrom = 'máy này';
        }
      }
    } catch (err) { state = seedState(); }

    let experts = state.experts;
    let apps = state.apps;
    let requests = state.requests;

    function save() {
      state.updatedAt = new Date().toISOString();
      try { localStorage.setItem(EX_KEY, JSON.stringify(state)); } catch (err) { showToast('Không lưu được vào trình duyệt (bộ nhớ đầy).', 'bad'); }
    }
    function addLog(text) {
      state.log.unshift({ at: new Date().toISOString(), by: userName, text: text });
      state.log = state.log.slice(0, 14);
    }
    const nextId = (list) => list.reduce((m, x) => Math.max(m, x.id), 0) + 1;

    /* Yêu cầu do nông hộ gửi trên trang Nông hộ & HTX = dữ liệu thật trong máy bạn. */
    function syncHouseholdReqs() {
      let hh = null;
      try { hh = JSON.parse(localStorage.getItem(HH_KEY) || 'null'); } catch (err) { hh = null; }
      const pend = hh && Array.isArray(hh.pending) ? hh.pending : [];
      let added = 0;
      pend.filter((p) => p && p.type === 'Đề nghị hỗ trợ kỹ thuật').forEach((p) => {
        const id = 'h' + (p.hhId || p.id);
        if (requests.some((r) => String(r.id) === id)) return;
        const farm = (hh.households || []).filter((x) => x.id === p.hhId)[0] || {};
        const topic = farm.topic || 'Hỗ trợ kỹ thuật theo hồ sơ #' + (p.hhId || p.id);
        requests.push(Object.assign(blankReq(), {
          id: id, hh: p.name || farm.name || 'Nông hộ', crop: farm.crop || 'Chưa ghi',
          area: farm.areaHa ? farm.areaHa + ' ha' : '', topic: topic,
          detail: p.detail || '', field: guessField((p.detail || '') + ' ' + topic + ' ' + (farm.crop || '')),
          at: p.at || new Date().toISOString(), status: 'open', origin: 'real'
        }));
        added += 1;
      });
      return added;
    }
    function guessField(text) {
      const t = fold(text);
      if (/(nuoi|tuoi|tie|ngap|man|han m|thuy loi|noi dong|kenh)/.test(t)) return 'Thủy nông';
      if (/(phan bon|phuc hoi|dam |bo de|dinh duong|mau|tieu nuoi|dat|tinh chat)/.test(t)) return 'Thổ nhưỡng & phân bón';
      if (/(xoai|sau riêng|ra hoa|nuoi trai|cut nhanh|phu sinh|an trai|buoi|sap|trai)/.test(t)) return 'Cây ăn trái';
      if (/(bao quan|che bien|bao tieu|sau thu hoach|dong goi|phân lo|chat luong)/.test(t)) return 'Sau thu hoạch & chế biến';
      return 'Bảo vệ thực vật';
    }

    let reqFilter = '';
    let appFilter = 'pending';
    let dutyFilter = '';
    let fieldFilter = '';

    function ratingNode(v) {
      const r = h('span', 'rating');
      r.innerHTML = icon('i-star');
      r.appendChild(document.createTextNode(' ' + v.toFixed(1)));
      return r;
    }

    function expertMatches(x, r) {
      return x.field === r.field && x.status === 'active';
    }
    function openCount(id) {
      return requests.filter((r) => r.expertId === id && r.status === 'assigned').length;
    }
    function suggestFor(r) {
      return experts.filter((x) => x.status === 'active')
        .sort((a, b) => (expertMatches(b, r) - expertMatches(a, r)) || (openCount(a.id) - openCount(b.id)) || (b.rating - a.rating))[0] || null;
    }

    /* ---------- Danh sách chuyên gia ---------- */
    function visibleExperts() {
      const q = fold($('#exSearch').value.trim());
      return experts.filter((x) => {
        if (fieldFilter && x.field !== fieldFilter) return false;
        if (dutyFilter === 'on' && x.duty !== 'on') return false;
        if (dutyFilter === 'off' && x.duty !== 'off') return false;
        if (dutyFilter === 'probation' && x.status !== 'probation') return false;
        if (q && fold(x.name + ' ' + x.field + ' ' + x.org + ' ' + x.note).indexOf(q) === -1) return false;
        return true;
      });
    }

    function renderExperts() {
      const host = $('#exList');
      host.innerHTML = '';
      const shown = visibleExperts();
      shown.forEach((x) => {
        const face = h('span', 'face' + (x.duty === 'on' ? '' : ' face--amber'));
        face.textContent = initials(x.name);
        const row = listRow(host, {
          icon: null,
          iconNode: face,
          title: x.name,
          chip: x.duty === 'on' ? 'Đang trực' : 'Ngoài giờ',
          chipKind: x.duty === 'on' ? 'done' : 'off',
          text: x.note,
          meta: [['i-shield', x.field], ['i-users', x.org], ['i-clock', x.exp + ' năm kinh nghiệm · ' + x.cases + ' ca tư vấn'], ['i-chat', openCount(x.id) + ' yêu cầu đang phụ trách']],
          side: [ratingNode(x.rating)],
          acts: [
            actBtn('Hồ sơ', 'edit', 'i-eye', () => openExpert(x)),
            actBtn(x.duty === 'on' ? 'Nghỉ trực' : 'Cho trực', x.duty === 'on' ? 'del' : 'ok', x.duty === 'on' ? 'i-close' : 'i-check', () => toggleDuty(x))
          ]
        });
        row.id = 'ex-' + x.id;
        if (x.status === 'probation') row.querySelector('.row__title').appendChild(chip('Đang thử việc', 'wait'));
        const src = h('span', 'src ' + (x.origin === 'local' ? 'src--real' : 'src--demo'));
        src.innerHTML = icon(x.origin === 'local' ? 'i-pencil' : 'i-file');
        src.appendChild(document.createTextNode(x.origin === 'local' ? 'Bạn thêm trên máy này' : 'Dữ liệu mẫu'));
        row.querySelector('.row__title').appendChild(src);
      });
      const q = $('#exSearch').value.trim();
      const filtering = q || fieldFilter || dutyFilter;
      const emptyEl = $('#exEmpty');
      emptyEl.hidden = shown.length !== 0;
      emptyEl.textContent = experts.length ? 'Không có chuyên gia nào khớp bộ lọc.' : 'Mạng lưới trống. Bấm "Thêm chuyên gia" để tạo hồ sơ đầu tiên.';
      $('#exSummary').textContent = experts.length + ' chuyên gia · ' + experts.filter((x) => x.duty === 'on').length + ' người đang trực';
      const info = $('#exInfo');
      info.textContent = 'Đang hiển thị ' + shown.length + '/' + experts.length + ' hồ sơ · ' +
        (fieldFilter ? 'chuyên môn ' + fieldFilter : 'mọi chuyên môn') +
        (dutyFilter ? ' · ' + (dutyFilter === 'probation' ? 'đang thử việc' : dutyFilter === 'on' ? 'đang trực' : 'ngoài giờ') : '') +
        (q ? ' · từ khóa "' + q + '"' : '');
      if (filtering) {
        const clr = h('button', 'linkbtn', 'Xóa bộ lọc');
        clr.type = 'button';
        clr.addEventListener('click', clearFilters);
        info.appendChild(document.createTextNode(' '));
        info.appendChild(clr);
      }
    }

    function clearFilters() {
      $('#exSearch').value = '';
      $('#exField').value = '';
      $('#exDuty').value = '';
      fieldFilter = '';
      dutyFilter = '';
      render();
    }

    /* ---------- Yêu cầu tư vấn ---------- */
    function visibleReqs() {
      const list = reqFilter ? requests.filter((r) => r.status === reqFilter) : requests.slice();
      return list.sort((a, b) => new Date(b.at) - new Date(a.at));
    }

    function renderReqs() {
      const host = $('#reqList');
      host.innerHTML = '';
      const shown = visibleReqs();
      shown.forEach((r) => {
        const ex = expertOf(r.expertId);
        const acts = [];
        if (r.status === 'open') acts.push(actBtn('Phân công', 'ok', 'i-send', () => assignFlow(r, null)));
        else if (r.status === 'assigned') acts.push(actBtn('Hoàn thành', 'ok', 'i-check', () => completeReq(r)), actBtn('Đổi chuyên gia', 'edit', 'i-refresh', () => assignFlow(r, expertOf(r.expertId))));
        else acts.push(actBtn('Mở lại', 'edit', 'i-refresh', () => reopenReq(r)));
        const row = listRow(host, {
          icon: 'i-chat',
          iconKind: r.status === 'open' ? 'amber' : r.status === 'assigned' ? 'blue' : '',
          title: r.hh + (r.area ? ' · ' + r.area : ''),
          chip: REQ_ST[r.status].label,
          chipKind: REQ_ST[r.status].kind,
          text: r.detail,
          meta: [['i-sprout', r.crop], ['i-shield', r.field], ['i-book', r.topic], ['i-clock', agoText(r.at)]],
          acts: acts
        });
        row.id = 'req-' + r.id;
        row.querySelector('.row__title').appendChild(chip(r.origin === 'real' ? 'Từ trang Nông hộ' : 'Dữ liệu mẫu', r.origin === 'real' ? 'done' : 'off'));
        if (ex) {
          const who = h('p', 'row__text');
          who.innerHTML = icon('i-user');
          who.appendChild(document.createTextNode(' Người phụ trách: ' + ex.name + (ex.duty === 'on' ? ' (đang trực)' : ' (ngoài giờ)')));
          row.querySelector('.row__main').appendChild(who);
        }
      });
      $('#reqEmpty').hidden = shown.length !== 0;
      const n = (s) => requests.filter((r) => r.status === s).length;
      $('#reqCaption').textContent = requests.length + ' yêu cầu · ' + n('open') + ' chờ phân công · ' + n('assigned') + ' đang tư vấn · ' + n('done') + ' hoàn thành';
      $('#reqInfo').textContent = 'Đang lọc: ' + (reqFilter ? REQ_ST[reqFilter].label : 'tất cả trạng thái') + ' · ' + shown.length + ' yêu cầu' +
        (requests.some((r) => r.origin === 'real') ? ' · ' + requests.filter((r) => r.origin === 'real').length + ' yêu cầu lấy từ danh bạ Nông hộ & HTX' : '');
    }

    function assignFlow(r, current) {
      const wrap = h('div');
      wrap.appendChild(h('p', 'row__text', r.hh + ' — ' + r.topic + '. Chuyên môn cần thiết: ' + r.field + '.'));
      const box = h('div', 'field');
      const lab = h('label', '', 'Chuyên gia phụ trách');
      lab.htmlFor = 'assignSel';
      const sel = h('select');
      sel.id = 'assignSel';
      const sug = suggestFor(r);
      experts.filter((x) => x.status === 'active' || (current && x.id === current.id)).sort((a, b) => (expertMatches(b, r) - expertMatches(a, r)) || (openCount(a.id) - openCount(b.id))).forEach((x) => {
        const o = document.createElement('option');
        o.value = String(x.id);
        o.textContent = x.name + ' — ' + x.field + ' · ' + x.rating.toFixed(1) + ' sao · ' + openCount(x.id) + ' yêu cầu' + (x.duty === 'on' ? '' : ' · ngoài giờ') + (sug && x.id === sug.id ? ' · đề xuất' : '');
        if (current && current.id === x.id) o.selected = true;
        sel.appendChild(o);
      });
      if (!sel.options.length) {
        wrap.appendChild(h('p', 'note note--warn', 'Mạng lưới chưa có chuyên gia chính thức nào. Duyệt đơn đăng ký hoặc thêm chuyên gia trước.'));
        openModal('Phân công yêu cầu tư vấn', wrap, [{ label: 'Đóng', onClick: closeModal }]);
        return;
      }
      box.append(lab, sel);
      wrap.appendChild(box);
      const hint = h('p', 'field__hint');
      hint.textContent = sug ? 'Đề xuất: ' + sug.name + ' (đúng chuyên môn' + (sug.duty === 'on' ? ', đang trực' : ', ngoài giờ') + ', ' + openCount(sug.id) + ' yêu cầu đang phụ trách).' : 'Chưa có chuyên gia nào khớp chuyên môn này.';
      wrap.appendChild(hint);
      const noteField = h('div', 'field');
      const nlab = h('label', '', 'Ghi chú phân công');
      nlab.htmlFor = 'assignNote';
      const nta = h('textarea');
      nta.id = 'assignNote';
      nta.rows = 2;
      nta.placeholder = 'Ví dụ: phản hồi trong 24 giờ, gửi kèm lịch phun.';
      noteField.append(nlab, nta);
      wrap.appendChild(noteField);
      openModal(current ? 'Đổi chuyên gia: ' + cut(r.hh) : 'Phân công: ' + cut(r.hh), wrap, [
        { label: 'Hủy', onClick: closeModal },
        { label: current ? 'Lưu việc đổi' : 'Phân công', primary: true, onClick: () => {
            const id = Number(sel.value);
            const x = expertOf(id);
            if (!x) { showToast('Chọn chuyên gia trước khi lưu.', 'bad'); return; }
            r.expertId = id;
            r.status = 'assigned';
            r.note = nta.value.trim();
            r.assignedAt = new Date().toISOString();
            save();
            addLog((current ? 'Đổi chuyên gia cho yêu cầu của ' : 'Phân công ' + x.name + ' cho yêu cầu của ') + r.hh + ' — ' + r.topic + '.');
            save();
            closeModal();
            render();
            showToast('Đã phân công ' + x.name + ' cho ' + r.hh + '.', 'ok');
          } }
      ]);
    }

    function completeReq(r) {
      const x = expertOf(r.expertId);
      r.status = 'done';
      r.closedAt = new Date().toISOString();
      if (x) x.cases += 1;
      save();
      addLog('Hoàn thành yêu cầu của ' + r.hh + (x ? ' · chuyên gia ' + x.name : '') + '.');
      save();
      render();
      showToast('Đã đóng yêu cầu của ' + r.hh + (x ? ' · hồ sơ ' + x.name + ' tăng lên ' + x.cases + ' ca tư vấn.' : '.'), 'ok');
    }

    function reopenReq(r) {
      r.status = 'open';
      r.expertId = 0;
      save();
      addLog('Mở lại yêu cầu của ' + r.hh + ' để phân công lại.');
      save();
      render();
      showToast('Yêu cầu của ' + r.hh + ' đã về hàng đợi chờ phân công.', 'ok');
    }

    function toggleDuty(x) {
      x.duty = x.duty === 'on' ? 'off' : 'on';
      save();
      addLog(x.name + ' chuyển sang ' + (x.duty === 'on' ? 'trạng thái Đang trực' : 'Ngoài giờ') + '.');
      save();
      render();
      showToast(x.name + ' — ' + (x.duty === 'on' ? 'đang trực' : 'ngoài giờ') + '.', 'ok');
    }

    /* ---------- Đơn đăng ký ---------- */
    function visibleApps() {
      return (appFilter ? apps.filter((a) => a.status === appFilter) : apps.slice()).sort((a, b) => new Date(a.at) - new Date(b.at));
    }

    function renderApps() {
      const host = $('#exPending');
      host.innerHTML = '';
      const shown = visibleApps();
      shown.forEach((a) => {
        const ex = a.expertId ? expertOf(a.expertId) : null;
        const acts = [];
        if (a.status === 'pending') acts.push(actBtn('Duyệt', 'ok', 'i-check', () => approveApp(a)), actBtn('Từ chối', 'del', 'i-close', () => rejectApp(a)));
        else if (a.status === 'rejected') acts.push(actBtn('Xem lại đơn', 'edit', 'i-refresh', () => reopenApp(a)));
        else acts.push(actBtn('Mở hồ sơ', 'edit', 'i-eye', () => { const t = expertOf(a.expertId); if (t) openExpert(t); else showToast('Hồ sơ chuyên gia của đơn này không còn trong mạng lưới.', 'bad'); }));
        const row = listRow(host, {
          icon: 'i-user',
          iconKind: 'blue',
          title: a.name,
          chip: APP_ST[a.status].label,
          chipKind: APP_ST[a.status].kind,
          text: a.status === 'rejected' ? 'Lý do: ' + a.reason : a.note,
          meta: [['i-shield', a.field], ['i-clock', a.exp + ' năm kinh nghiệm'], ['i-users', a.org || 'Chưa ghi đơn vị công tác'], ['i-calendar', agoText(a.at)]].concat(
            a.status === 'approved' ? [['i-user', 'Hồ sơ: ' + (ex ? ex.name : 'đã xóa')]] : []),
          acts: acts
        });
        row.id = 'app-' + a.id;
      });
      $('#exPendingEmpty').hidden = shown.length !== 0;
      const n = (s) => apps.filter((a) => a.status === s).length;
      $('#appCaption').textContent = n('pending') + ' chờ duyệt · ' + n('approved') + ' đã duyệt · ' + n('rejected') + ' từ chối';
      $('#exPendingEmpty').textContent = appFilter ? 'Không có đơn nào ở trạng thái ' + APP_ST[appFilter].label.toLowerCase() + '.' : 'Chưa có đơn đăng ký nào.';
    }

    function approveApp(a) {
      const x = Object.assign(blankExpert(), {
        id: nextId(experts), name: a.name, field: a.field, exp: a.exp, org: a.org || 'Đơn vị chưa cập nhật',
        note: a.note, rating: 4.5, cases: 0, duty: 'off', status: a.exp >= 3 ? 'active' : 'probation',
        origin: 'local', joined: new Date().toISOString()
      });
      experts.unshift(x);
      a.status = 'approved';
      a.expertId = x.id;
      a.reviewer = userName;
      a.reviewedAt = new Date().toISOString();
      save();
      addLog('Duyệt đơn ' + a.name + ' → hồ sơ chuyên gia "' + x.name + '" (' + (x.status === 'probation' ? 'thử việc' : 'chính thức') + ').');
      save();
      render();
      showToast('Đã duyệt ' + a.name + '. Hồ sơ mới ở trạng thái ' + (x.status === 'probation' ? 'Đang thử việc' : 'Chính thức') + ', ngoài giờ.', 'ok');
    }

    function rejectApp(a) {
      const wrap = h('div');
      wrap.appendChild(h('p', 'row__text', 'Nêu lý do theo tiêu chí của nền tảng. Lý do hiển thị ngay trên đơn và chuyên gia có thể gửi lại.'));
      const f = h('div', 'field');
      const lab = h('label', '', 'Lý do từ chối *');
      lab.htmlFor = 'appReason';
      const ta = h('textarea');
      ta.id = 'appReason';
      ta.rows = 3;
      ta.placeholder = 'Ví dụ: Thiếu chứng chỉ hành nghề BVTV, chưa có đơn vị công tác.';
      const err = h('p', 'field__err');
      err.hidden = true;
      f.append(lab, ta, err);
      wrap.appendChild(f);
      openModal('Từ chối đơn của ' + a.name, wrap, [
        { label: 'Giữ đơn ở hàng đợi', onClick: closeModal },
        { label: 'Từ chối', danger: true, onClick: () => {
            const v = ta.value.trim();
            if (v.length < 8) { err.textContent = 'Lý do cần tối thiểu 8 ký tự.'; err.hidden = false; ta.classList.add('invalid'); ta.focus(); return; }
            a.status = 'rejected';
            a.reason = v;
            a.reviewer = userName;
            a.reviewedAt = new Date().toISOString();
            save();
            addLog('Từ chối đơn ' + a.name + ': ' + v);
            save();
            closeModal();
            render();
            showToast('Đã từ chối đơn của ' + a.name + '.', 'bad');
          } }
      ]);
    }

    function reopenApp(a) {
      a.status = 'pending';
      a.reason = '';
      save();
      addLog('Đưa đơn ' + a.name + ' về hàng đợi chờ duyệt.');
      save();
      render();
      showToast('Đơn của ' + a.name + ' đã về hàng đợi chờ duyệt.', 'ok');
    }

    /* ---------- Hồ sơ chuyên gia ---------- */
    function openExpert(x) {
      const own = requests.filter((r) => r.expertId === x.id);
      const wrap = h('div');
      wrap.appendChild(h('p', 'row__text', x.note));
      wrap.appendChild(detailList([
        ['Họ và tên', x.name],
        ['Chuyên môn', x.field],
        ['Đơn vị công tác', x.org],
        ['Kinh nghiệm', x.exp + ' năm'],
        ['Trạng thái', (x.duty === 'on' ? 'Đang trực' : 'Ngoài giờ') + ' · ' + (x.status === 'active' ? 'Chính thức' : 'Đang thử việc')],
        ['Đánh giá', x.rating.toFixed(1) + '/5'],
        ['Ca đã tư vấn', String(x.cases)],
        ['Yêu cầu đang phụ trách', String(own.filter((r) => r.status === 'assigned').length)],
        ['Vào mạng lưới', new Date(x.joined).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })],
        ['Nguồn hồ sơ', x.origin === 'local' ? 'Bạn tạo/sửa trên máy này' : 'Dữ liệu mẫu của bản demo']
      ]));
      if (own.length) {
        const box = h('div');
        box.appendChild(h('p', 'filters__label', 'Yêu cầu đã nhận (' + own.length + ')'));
        const rows = h('div', 'rows rows--divided');
        own.forEach((r) => listRow(rows, { icon: 'i-chat', title: r.hh, chip: REQ_ST[r.status].label, chipKind: REQ_ST[r.status].kind, text: r.topic, meta: [['i-clock', agoText(r.at)]] }));
        box.appendChild(rows);
        wrap.appendChild(box);
      }
      openModal('Hồ sơ chuyên gia — ' + x.name, wrap, [
        { label: 'Đóng', onClick: closeModal },
        { label: 'Sửa hồ sơ', onClick: () => openExpertForm(x) },
        { label: x.duty === 'on' ? 'Cho nghỉ trực' : 'Cho trực', primary: true, onClick: () => { toggleDuty(x); closeModal(); } },
        { label: 'Xóa hồ sơ', danger: true, onClick: () => deleteExpert(x) }
      ]);
    }

    function deleteExpert(x) {
      const back = requests.filter((r) => r.expertId === x.id && r.status === 'assigned');
      const done = requests.filter((r) => r.expertId === x.id && r.status === 'done').length;
      const app = apps.filter((a) => a.expertId === x.id)[0];
      const wrap = h('div');
      wrap.appendChild(h('p', 'row__text', 'Xóa hồ sơ ' + x.name + ' — ' + x.field + ' khỏi mạng lưới?'));
      wrap.appendChild(h('p', 'row__text', back.length
        ? back.length + ' yêu cầu đang phụ trách sẽ trở về hàng đợi chờ phân công' + (done ? ' (' + done + ' yêu cầu đã hoàn thành vẫn giữ số liệu ca tư vấn).' : '.')
        : 'Hồ sơ này không còn yêu cầu nào đang phụ trách.'));
      if (app) wrap.appendChild(h('p', 'note note--warn', 'Đơn "' + app.name + '" đã duyệt từ hồ sơ này sẽ còn trong danh sách đơn nhưng không mở được hồ sơ.'));
      openModal('Xóa hồ sơ chuyên gia', wrap, [
        { label: 'Giữ lại', onClick: closeModal },
        { label: 'Xóa hồ sơ', danger: true, onClick: () => {
            experts = experts.filter((e) => e.id !== x.id);
            state.experts = experts;
            back.forEach((r) => { r.status = 'open'; r.expertId = 0; });
            save();
            addLog('Xóa hồ sơ ' + x.name + (back.length ? ' · ' + back.length + ' yêu cầu về hàng đợi chờ phân công.' : '.'));
            save();
            closeModal();
            render();
            showToast('Đã xóa hồ sơ ' + x.name + (back.length ? ' và ' + back.length + ' yêu cầu về hàng đợi.' : '.'), 'bad');
          } }
      ]);
    }

    const EFIELDS = [
      { el: '#exName', err: '#errExName', min: 3, msg: 'Họ tên cần tối thiểu 3 ký tự.' },
      { el: '#exOrg', err: '#errExOrg', min: 3, msg: 'Đơn vị công tác cần tối thiểu 3 ký tự.' },
      { el: '#exNote', err: '#errExNote', min: 10, msg: 'Mô tả chuyên đề cần tối thiểu 10 ký tự.' }
    ];

    function openExpertForm(x) {
      const isNew = !x;
      const cur = x || Object.assign(blankExpert(), { duty: 'off' });
      const wrap = h('div');
      wrap.innerHTML =
        '<div class="form">' +
        '<div class="field"><label for="exName">Họ và tên <span class="req">*</span></label><input id="exName" type="text"><p class="field__err" id="errExName" hidden></p></div>' +
        '<div class="field"><label for="exOrg">Đơn vị công tác <span class="req">*</span></label><input id="exOrg" type="text" placeholder="Ví dụ: Chi cục Trồng trọt &amp; BVTV An Giang"><p class="field__err" id="errExOrg" hidden></p></div>' +
        '<div class="form__row">' +
        '<div class="field"><label for="exFieldInput">Chuyên môn</label><select id="exFieldInput"></select></div>' +
        '<div class="field"><label for="exExp">Năm kinh nghiệm <span class="req">*</span></label><input id="exExp" type="number" min="1" max="45"><p class="field__err" id="errExExp" hidden></p></div>' +
        '</div>' +
        '<div class="form__row">' +
        '<div class="field"><label for="exDutySel">Trạng thái trực</label><select id="exDutySel"><option value="off">Ngoài giờ</option><option value="on">Đang trực</option></select></div>' +
        '<div class="field"><label for="exStatusSel">Quy chế</label><select id="exStatusSel"><option value="active">Chính thức</option><option value="probation">Đang thử việc</option></select></div>' +
        '</div>' +
        '<div class="field"><label for="exNote">Chuyên đề phụ trách <span class="req">*</span></label><textarea id="exNote" rows="3" placeholder="Lĩnh vực chuyên sâu, mô hình đã triển khai…"></textarea><p class="field__err" id="errExNote" hidden></p></div>' +
        '<p class="field__hint" id="exFormHint"></p>' +
        '</div>';
      const sel = wrap.querySelector('#exFieldInput');
      FIELDS.forEach((f) => {
        const o = document.createElement('option');
        o.value = f;
        o.textContent = f;
        sel.appendChild(o);
      });
      wrap.querySelector('#exName').value = cur.name;
      wrap.querySelector('#exOrg').value = cur.org;
      sel.value = cur.field;
      wrap.querySelector('#exExp').value = String(cur.exp || 5);
      wrap.querySelector('#exDutySel').value = cur.duty;
      wrap.querySelector('#exStatusSel').value = cur.status;
      wrap.querySelector('#exNote').value = cur.note;
      wrap.querySelector('#exFormHint').textContent = 'Dưới 3 năm kinh nghiệm nên để quy chế "Đang thử việc" theo tiêu chí của nền tảng.';

      const expErr = wrap.querySelector('#errExExp');
      function check() {
        let ok = true;
        EFIELDS.forEach((f) => {
          const n = wrap.querySelector(f.el);
          const bad = n.value.trim().length < f.min;
          n.classList.toggle('invalid', bad);
          const e = wrap.querySelector(f.err);
          e.textContent = bad ? f.msg : '';
          e.hidden = !bad;
          if (bad) ok = false;
        });
        const y = Number(wrap.querySelector('#exExp').value);
        const badY = !(y >= 1 && y <= 45);
        wrap.querySelector('#exExp').classList.toggle('invalid', badY);
        expErr.textContent = badY ? 'Số năm kinh nghiệm phải từ 1 đến 45.' : '';
        expErr.hidden = !badY;
        if (badY) ok = false;
        return ok;
      }
      EFIELDS.forEach((f) => wrap.querySelector(f.el).addEventListener('input', check));
      wrap.querySelector('#exExp').addEventListener('input', check);

      openModal(isNew ? 'Thêm chuyên gia vào mạng lưới' : 'Sửa hồ sơ — ' + cur.name, wrap, [
        { label: 'Hủy', onClick: closeModal },
        { label: isNew ? 'Tạo hồ sơ' : 'Lưu thay đổi', primary: true, onClick: () => {
            if (!check()) { showToast('Chưa lưu được: kiểm tra các trường bắt buộc.', 'bad'); return; }
            const data = {
              name: wrap.querySelector('#exName').value.trim(),
              org: wrap.querySelector('#exOrg').value.trim(),
              field: sel.value,
              exp: Number(wrap.querySelector('#exExp').value),
              duty: wrap.querySelector('#exDutySel').value,
              status: wrap.querySelector('#exStatusSel').value,
              note: wrap.querySelector('#exNote').value.trim()
            };
            if (isNew) {
              const nx = Object.assign(blankExpert(), data, { id: nextId(experts), origin: 'local', joined: new Date().toISOString(), rating: 4.5, cases: 0 });
              experts.unshift(nx);
              save();
              addLog('Thêm chuyên gia ' + nx.name + ' — ' + nx.field + ' (' + (nx.status === 'active' ? 'chính thức' : 'thử việc') + ').');
              save();
              showToast('Đã tạo hồ sơ ' + nx.name + '.', 'ok');
            } else {
              const changedField = cur.field !== data.field;
              Object.assign(cur, data, { origin: 'local' });
              save();
              addLog('Cập nhật hồ sơ ' + cur.name + (changedField ? ' · đổi chuyên môn sang ' + data.field : '') + '.');
              save();
              showToast('Đã lưu thay đổi hồ sơ ' + cur.name + '.', 'ok');
            }
            closeModal();
            render();
          } }
      ]);
    }

    /* ---------- Thống kê ---------- */
    function renderStats() {
      const n = (s) => requests.filter((r) => r.status === s).length;
      const on = experts.filter((x) => x.duty === 'on').length;
      const prob = experts.filter((x) => x.status === 'probation').length;
      const avg = experts.length ? experts.reduce((s, x) => s + x.rating, 0) / experts.length : 0;
      const oldApp = apps.filter((a) => a.status === 'pending').sort((a, b) => new Date(a.at) - new Date(b.at))[0];
      $('#statEx').textContent = pad(experts.length);
      $('#statExDelta').textContent = (experts.length - prob) + ' chính thức · ' + prob + ' đang thử việc';
      $('#statOn').textContent = pad(on);
      $('#statOnDelta').textContent = 'Điểm đánh giá trung bình ' + avg.toFixed(1) + '/5 · ' + experts.reduce((s, x) => s + x.cases, 0) + ' ca đã tư vấn';
      $('#statOpen').textContent = pad(n('open'));
      $('#statOpenDelta').textContent = n('assigned') + ' đang tư vấn · ' + n('done') + ' hoàn thành';
      $('#statApps').textContent = pad(apps.filter((a) => a.status === 'pending').length);
      $('#statAppsDelta').textContent = apps.filter((a) => a.status === 'approved').length + ' đã duyệt · ' +
        (oldApp ? 'chờ lâu nhất ' + agoText(oldApp.at) : 'hàng đợi trống');
    }

    function renderMeters() {
      const host = $('#exMeters');
      host.innerHTML = '';
      const total = requests.length || 1;
      const done = requests.filter((r) => r.status === 'done').length;
      const assigned = requests.filter((r) => r.status === 'assigned').length;
      const on = experts.filter((x) => x.duty === 'on').length;
      const fields = FIELDS.filter((f) => experts.some((x) => x.field === f)).length;
      meter(host, 'Yêu cầu đã có chuyên gia phụ trách', (assigned + done) + '/' + requests.length, Math.round(((assigned + done) / total) * 100), 'blue');
      meter(host, 'Yêu cầu đã hoàn thành', done + '/' + requests.length, Math.round((done / total) * 100), '');
      meter(host, 'Chuyên gia đang trực', on + '/' + experts.length, Math.round((on / (experts.length || 1)) * 100), on ? '' : 'amber');
      meter(host, 'Chuyên môn có người phụ trách', fields + '/' + FIELDS.length, Math.round((fields / FIELDS.length) * 100), fields === FIELDS.length ? '' : 'amber');
      $('#perfCaption').textContent = 'Tính từ ' + experts.length + ' hồ sơ và ' + requests.length + ' yêu cầu trong dữ liệu đang lưu';
    }

    function renderFieldMeters() {
      const host = $('#criteriaMeters');
      host.innerHTML = '';
      FIELDS.forEach((f) => {
        const c = requests.filter((r) => r.field === f).length;
        const people = experts.filter((x) => x.field === f).length;
        meter(host, f, c + ' yêu cầu · ' + people + ' chuyên gia', requests.length ? Math.round((c / requests.length) * 100) : 0, people ? '' : 'amber');
      });
    }

    function renderLog() {
      const host = $('#exLog');
      host.innerHTML = '';
      state.log.forEach((l, i) => {
        const row = listRow(host, {
          icon: 'i-check',
          iconKind: i === 0 ? 'blue' : '',
          title: l.text,
          meta: [['i-user', l.by || 'Hệ thống'], ['i-clock', agoText(l.at)]]
        });
        row.id = 'log-' + i;
      });
      $('#logEmpty').hidden = state.log.length !== 0;
      $('#logCaption').textContent = state.log.length + ' thao tác gần nhất, lưu cùng dữ liệu chuyên gia';
    }

    function render() {
      renderExperts();
      renderReqs();
      renderApps();
      renderStats();
      renderMeters();
      renderFieldMeters();
      renderLog();
    }

    /* ---------- Bộ lọc & sự kiện ---------- */
    FIELDS.forEach((f) => {
      const o = document.createElement('option');
      o.value = f;
      o.textContent = f;
      $('#exField').appendChild(o);
    });
    $('#exSearch').addEventListener('input', renderExperts);
    $('#exField').addEventListener('change', (e) => { fieldFilter = e.target.value; renderExperts(); });
    $('#exDuty').addEventListener('change', (e) => { dutyFilter = e.target.value; renderExperts(); });

    qa('#reqFilters .pill').forEach((p) => {
      p.addEventListener('click', () => {
        qa('#reqFilters .pill').forEach((x) => x.classList.remove('is-on'));
        p.classList.add('is-on');
        reqFilter = p.dataset.rs;
        renderReqs();
      });
    });
    qa('#appFilters .pill').forEach((p) => {
      p.addEventListener('click', () => {
        qa('#appFilters .pill').forEach((x) => x.classList.remove('is-on'));
        p.classList.add('is-on');
        appFilter = p.dataset.as;
        renderApps();
      });
    });

    $('#btnAddExpert').addEventListener('click', () => openExpertForm(null));

    $('#btnApproveAll').addEventListener('click', () => {
      const pend = apps.filter((a) => a.status === 'pending');
      if (!pend.length) { showToast('Không còn đơn nào chờ duyệt.'); return; }
      const wrap = h('div');
      wrap.appendChild(h('p', 'row__text', 'Duyệt ' + pend.length + ' đơn: ' + pend.map((a) => a.name).join(', ') + '. Mỗi đơn sẽ tạo một hồ sơ chuyên gia mới — đơn dưới 3 năm kinh nghiệm vào diện thử việc.'));
      openModal('Duyệt tất cả', wrap, [
        { label: 'Giữ lại', onClick: closeModal },
        { label: 'Duyệt ' + pend.length + ' đơn', primary: true, onClick: () => {
            closeModal();
            pend.forEach((a) => approveApp(a));
            showToast('Đã duyệt ' + pend.length + ' đơn và tạo ' + pend.length + ' hồ sơ chuyên gia.', 'ok');
          } }
      ]);
    });

    $('#btnExSeed').addEventListener('click', () => {
      const wrap = h('div');
      wrap.appendChild(h('p', 'row__text', 'Khôi phục 6 chuyên gia, 5 đơn đăng ký và 6 yêu cầu tư vấn mẫu. Toàn bộ hồ sơ, phân công và nhật ký bạn tạo trên máy này sẽ bị xóa.'));
      openModal('Khôi phục dữ liệu mẫu', wrap, [
        { label: 'Giữ lại', onClick: closeModal },
        { label: 'Khôi phục', danger: true, onClick: () => {
            state = seedState();
            experts = state.experts;
            apps = state.apps;
            requests = state.requests;
            save();
            closeModal();
            clearFilters();
            showToast('Đã khôi phục dữ liệu mẫu cho mạng lưới chuyên gia.', 'ok');
          } }
      ]);
    });

    const added = syncHouseholdReqs();
    if (added) { save(); addLog('Đồng bộ ' + added + ' yêu cầu hỗ trợ kỹ thuật từ trang Nông hộ & HTX.'); }
    render();
    if (loadedFrom !== 'máy này' || added) save();
  }

  /* =========================================================
     5. BÁO CÁO & THỐNG KÊ
     ========================================================= */
  function initReports() {
    const JOURNAL_KEY = 'smartagri_journal_v1';
    const EX_KEY = 'smartagri_experts_v1';
    const HH_KEY = 'smartagri_households_v1';

    const TYPES = (function () {
      try {
        const s = JSON.parse(localStorage.getItem('smartagri_settings') || '{}');
        if (s && Array.isArray(s.jobs)) {
          const out = s.jobs.filter((x) => typeof x === 'string' && x.trim());
          if (out.length) return out;
        }
      } catch (err) { /* bỏ qua */ }
      return ['Bón phân', 'Phun thuốc', 'Tưới nước', 'Làm cỏ', 'Thu hoạch'];
    })();
    const TYPE_COLOR = {
      'Bón phân': '#2e7d4f',
      'Phun thuốc': '#3d7fb5',
      'Tưới nước': '#58a86b',
      'Làm cỏ': '#e0b455',
      'Thu hoạch': '#c98a24'
    };
    function colorOf(t) { return TYPE_COLOR[t] || '#8a6f4d'; }
    const FIELDS = ['Bảo vệ thực vật', 'Thổ nhưỡng & phân bón', 'Thủy nông', 'Cây ăn trái', 'Sau thu hoạch & chế biến'];
    const FIELD_KIND = {
      'Bảo vệ thực vật': 'red',
      'Thổ nhưỡng & phân bón': '',
      'Thủy nông': 'blue',
      'Cây ăn trái': 'amber',
      'Sau thu hoạch & chế biến': ''
    };
    const PLOT_META = { A1: '1.2 ha', B2: '0.8 ha', C3: '1.4 ha' };
    const SCOPE_LABEL = {
      all: 'Toàn bộ dữ liệu (nhật ký + yêu cầu)',
      journal: 'Chỉ nhật ký canh tác',
      requests: 'Chỉ yêu cầu tư vấn'
    };
    const REQ_STATUS = { open: 'Chờ phân công', assigned: 'Đang xử lý', done: 'Hoàn thành' };

    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function isoOf(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
    function todayISO() { return isoOf(new Date()); }
    function addDays(iso, days) {
      const p = iso.split('-').map(Number);
      const d = new Date(p[0], p[1] - 1, p[2]);
      d.setDate(d.getDate() + days);
      return isoOf(d);
    }
    function daysBetween(a, b) {
      const pa = a.split('-').map(Number);
      const pb = b.split('-').map(Number);
      return Math.round((new Date(pb[0], pb[1] - 1, pb[2]) - new Date(pa[0], pa[1] - 1, pa[2])) / 86400000);
    }
    function fmtDate(iso) {
      const p = String(iso || '').slice(0, 10).split('-');
      return p.length === 3 && p[0] ? p[2] + '/' + p[1] + '/' + p[0] : '—';
    }
    function fmtNum(v, digits) {
      if (v == null || isNaN(v)) return '—';
      const s = digits ? Number(v).toFixed(digits) : String(Math.round(Number(v)));
      return s.replace('.', ',');
    }
    function fold(s) { return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0111/g, 'd').toLowerCase(); }
    function agoH(h) { return new Date(Date.now() - h * 3600000).toISOString(); }
    function nowStamp() {
      const d = new Date();
      return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ' ' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
    }
    function fileStamp() {
      const d = new Date();
      return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes());
    }
    function guessField(text) {
      const s = fold(text);
      if (/thu hoach|bao quan|che bien|phoi|say kho/.test(s)) return 'Sau thu hoạch & chế biến';
      if (/thuy loi|tuoi|ngap|man |kenh|muc nuoc|do am/.test(s)) return 'Thủy nông';
      if (/than nhuong|phan bon|\bdat\b|dinh duong|\bph\b/.test(s)) return 'Thổ nhưỡng & phân bón';
      if (/cay an trai|xoai|sau rieng|ra hoa|nuoi trai|trai non/.test(s)) return 'Cây ăn trái';
      return 'Bảo vệ thực vật';
    }

    /* Dữ liệu mẫu chỉ dùng khi trang nguồn chưa từng được mở trên máy này. */
    const DEMO_JOURNAL = [
      { id: 5, date: '2024-05-18', time: '07:30', type: 'Phun thuốc', stage: 'Làm đòng', status: 'done', note: 'Phun Actara 25WG liều 0.3kg/ha phòng rầy nâu, trời nắng nhẹ, đã kiểm tra kỹ mép ruộng phía đông.' },
      { id: 4, date: '2024-05-16', time: '16:00', type: 'Bón phân', stage: 'Đẻ nhánh', status: 'done', note: 'Bón thúc NPK 16-16-8 liều 20kg/ha cho lô A1, kết hợp sục bùn giữ ẩm sau bón.' },
      { id: 3, date: '2024-05-14', time: '06:45', type: 'Tưới nước', stage: 'Đẻ nhánh', status: 'done', note: 'Tưới giữ mực nước 3-5cm, kiểm tra bờ bao không rò rỉ, nước vào đều khắp mặt ruộng.' },
      { id: 2, date: '2024-05-12', time: '06:15', type: 'Làm cỏ', stage: 'Đẻ nhánh', status: 'done', note: 'Làm cỏ thủ công quanh bờ và các khóm lúa bị cỏ lấn, gom cỏ ủ phân xanh tại góc ruộng.' },
      { id: 1, date: '2024-05-10', time: '09:20', type: 'Thu hoạch', stage: 'Chín – Thu hoạch', status: 'done', note: 'Thu hoạch lúa lô A1, năng suất ước đạt 6.2 tấn/ha, hạt chắc vàng, phơi khô đạt ẩm 14%.' }
    ];
    const DEMO_REQS = [
      { id: 1, hh: 'Trần Văn Bình', crop: 'Lúa', field: 'Bảo vệ thực vật', topic: 'Đạo ôn lá sữa', at: agoH(4), status: 'open' },
      { id: 2, hh: 'Nguyễn Thị Kim Ngân', crop: 'Xoài', field: 'Cây ăn trái', topic: 'Xử lý ra hoa xoài cát Chu', at: agoH(9), status: 'open' },
      { id: 3, hh: 'Lê Văn Tuấn', crop: 'Lúa', field: 'Thủy nông', topic: 'Ngập mặn đầu vụ', at: agoH(20), status: 'open' },
      { id: 4, hh: 'Phạm Hoàng Long', crop: 'Sầu riêng', field: 'Cây ăn trái', topic: 'Sầu riêng Ri6 rụng trái non', at: agoH(30), status: 'assigned' },
      { id: 5, hh: 'Trần Quang Huy', crop: 'Cà phê', field: 'Thổ nhưỡng & phân bón', topic: 'Tỉa cành và bón phân phục hồi sau thu hoạch', at: agoH(8), status: 'assigned' },
      { id: 6, hh: 'Huỳnh Văn Sơn', crop: 'Lúa', field: 'Thổ nhưỡng & phân bón', topic: 'Công thức bón phân đòng', at: agoH(70), status: 'done' }
    ];

    let journalFallback = false;
    let reqFallback = false;

    function readJournal() {
      journalFallback = false;
      let raw = null;
      try { raw = localStorage.getItem(JOURNAL_KEY); } catch (err) { raw = null; }
      if (raw == null) {
        journalFallback = true;
        return DEMO_JOURNAL.map((e) => Object.assign({}, e));
      }
      try {
        const p = JSON.parse(raw);
        if (!p || !Array.isArray(p.entries)) return [];
        return p.entries.filter((e) => e
          && /^\d{4}-\d{2}-\d{2}$/.test(String(e.date))
          && typeof e.type === 'string' && e.type.trim() !== ''
          && typeof e.note === 'string')
          .map((e) => ({
            id: e.id,
            date: e.date,
            time: typeof e.time === 'string' ? e.time : '00:00',
            type: e.type,
            stage: typeof e.stage === 'string' ? e.stage : '',
            status: e.status === 'pending' ? 'pending' : 'done',
            note: e.note
          }));
      } catch (err) { return []; }
    }

    function readRequests() {
      reqFallback = false;
      const list = [];
      let exRaw = null;
      try { exRaw = localStorage.getItem(EX_KEY); } catch (err) { exRaw = null; }
      let ex = null;
      if (exRaw != null) {
        try { ex = JSON.parse(exRaw); } catch (err) { ex = null; }
      }
      const stored = ex && Array.isArray(ex.requests) ? ex.requests : [];
      stored.forEach((r) => {
        if (!r || typeof r.hh !== 'string' || !r.hh || typeof r.topic !== 'string' || !r.topic) return;
        const when = new Date(r.at);
        if (isNaN(when.getTime())) return;
        list.push({
          id: String(r.id),
          hh: r.hh,
          crop: r.crop || 'Chưa ghi',
          area: r.area || '',
          topic: r.topic,
          detail: r.detail || '',
          field: FIELDS.indexOf(r.field) !== -1 ? r.field : guessField(r.topic + ' ' + (r.detail || '')),
          at: when.toISOString(),
          date: isoOf(when),
          status: ['open', 'assigned', 'done'].indexOf(r.status) !== -1 ? r.status : 'open',
          origin: r.origin === 'real' ? 'real' : 'demo',
          source: 'Mạng lưới chuyên gia'
        });
      });

      let hh = null;
      try { hh = JSON.parse(localStorage.getItem(HH_KEY) || 'null'); } catch (err) { hh = null; }
      const pending = hh && Array.isArray(hh.pending) ? hh.pending : [];
      pending.filter((p) => p && p.type === 'Đề nghị hỗ trợ kỹ thuật').forEach((p) => {
        const id = 'h' + (p.hhId || p.id);
        if (list.some((r) => r.id === id)) return;
        const farm = (Array.isArray(hh.households) ? hh.households : []).filter((x) => x.id === p.hhId)[0] || {};
        const topic = farm.topic || ('Hỗ trợ kỹ thuật theo hồ sơ #' + (p.hhId || p.id));
        const when = new Date(p.at || Date.now());
        const safeWhen = isNaN(when.getTime()) ? new Date() : when;
        list.push({
          id: id,
          hh: p.name || farm.name || 'Nông hộ',
          crop: farm.crop || 'Chưa ghi',
          area: farm.areaHa ? farm.areaHa + ' ha' : '',
          topic: topic,
          detail: p.detail || '',
          field: guessField((p.detail || '') + ' ' + topic + ' ' + (farm.crop || '')),
          at: safeWhen.toISOString(),
          date: isoOf(safeWhen),
          status: 'open',
          origin: 'real',
          source: 'Nông hộ & HTX'
        });
      });

      if (exRaw == null && list.length === 0) {
        reqFallback = true;
        DEMO_REQS.forEach((r) => list.push(Object.assign({
          area: '', detail: '', origin: 'demo', source: 'Dữ liệu mẫu', date: isoOf(new Date(r.at))
        }, r)));
      }
      return list;
    }

    let journalAll = readJournal();
    let reqAll = readRequests();

    function dataBounds() {
      const dates = journalAll.map((e) => e.date).concat(reqAll.map((r) => r.date)).filter(Boolean).sort();
      return { min: dates[0] || '', max: dates[dates.length - 1] || '' };
    }

    const state = { from: '', to: '', scope: 'all', year: '' };
    let activePreset = 'all';
    let current = { entries: [], requests: [] };

    const fromEl = $('#rfFrom');
    const toEl = $('#rfTo');
    const scopeEl = $('#rfScope');
    const chartYear = $('#chartYear');
    const pills = qa('.report-filter .pill');

    function inRange(date) {
      return !!date && (!state.from || date >= state.from) && (!state.to || date <= state.to);
    }
    function filteredJournal() {
      return state.scope === 'requests' ? [] : journalAll.filter((e) => inRange(e.date));
    }
    function filteredRequests() {
      return state.scope === 'journal' ? [] : reqAll.filter((r) => inRange(r.date));
    }

    function parseYield(note) {
      const s = String(note || '').toLowerCase().replace(/\s+/g, ' ');
      let m = /(\d+(?:[.,]\d+)?)\s*tấn\s*\/\s*ha/.exec(s);
      if (m) return parseFloat(m[1].replace(',', '.'));
      m = /(\d+(?:[.,]\d+)?)\s*tạ\s*\/\s*ha/.exec(s);
      if (m) return parseFloat(m[1].replace(',', '.')) / 10;
      m = /(\d+(?:[.,]\d+)?)\s*kg\s*\/\s*ha/.exec(s);
      if (m) return parseFloat(m[1].replace(',', '.')) / 1000;
      return null;
    }
    function avgYield(list) {
      const vals = list.map((e) => parseYield(e.note)).filter((v) => v != null && isFinite(v) && v > 0);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    }
    function plotOf(entry) {
      const m = /\b([abc][1-9])\b/i.exec(entry.note || '');
      return m ? m[1].toUpperCase() : '';
    }
    function entrySpan(list) {
      const dates = list.map((e) => e.date).filter(Boolean).sort();
      return { from: dates[0] || '', to: dates[dates.length - 1] || '' };
    }
    function trendOf(list, span) {
      if (!list.length) return 'Chưa có';
      if (!span.from || !span.to || span.from === span.to) return 'Trong ngày';
      const mid = addDays(span.from, Math.floor(daysBetween(span.from, span.to) / 2));
      const before = list.filter((e) => e.date <= mid).length;
      const after = list.filter((e) => e.date > mid).length;
      if (after > before) return 'Tăng';
      if (after < before) return 'Giảm';
      return 'Ổn định';
    }
    function trendKind(label) {
      if (label === 'Tăng') return 'done';
      if (label === 'Giảm') return 'urgent';
      return 'off';
    }

    function renderKpis(entries, requests) {
      const harvest = entries.filter((e) => e.type === 'Thu hoạch');
      const yields = harvest.map((e) => parseYield(e.note)).filter((v) => v != null && v > 0);
      const avg = yields.length ? yields.reduce((a, b) => a + b, 0) / yields.length : null;
      const done = requests.filter((r) => r.status === 'done').length;
      const pending = requests.length - done;
      const households = [];
      requests.forEach((r) => {
        const key = fold(r.hh).trim();
        if (key && households.indexOf(key) === -1) households.push(key);
      });

      $('#statJournal').textContent = String(entries.length);
      $('#statJournalSub').textContent = state.scope === 'requests'
        ? 'Ngoài phạm vi — đang chỉ xem yêu cầu'
        : entries.length
          ? harvest.length + ' lượt thu hoạch · ' + new Set(entries.map((e) => e.date)).size + ' ngày có ghi'
          : 'Không có ghi nhận trong kỳ lọc';

      $('#statReq').textContent = String(requests.length);
      $('#statReqSub').textContent = state.scope === 'journal'
        ? 'Ngoài phạm vi — đang chỉ xem nhật ký'
        : requests.length
          ? done + ' đã xử lý · ' + pending + ' chờ xử lý'
          : 'Không có yêu cầu trong kỳ lọc';

      $('#statYield').textContent = avg == null ? '—' : fmtNum(avg, 1);
      $('#statYieldSub').textContent = state.scope === 'requests'
        ? 'Ngoài phạm vi — đang chỉ xem yêu cầu'
        : avg == null
          ? (harvest.length ? harvest.length + ' bản ghi thu hoạch chưa ghi năng suất' : 'Chưa có bản ghi thu hoạch')
          : 'Từ ' + yields.length + ' bản ghi thu hoạch';

      $('#statHH').textContent = String(households.length);
      $('#statHHSub').textContent = state.scope === 'journal'
        ? 'Ngoài phạm vi — đang chỉ xem nhật ký'
        : requests.length
          ? pending + ' yêu cầu chờ xử lý'
          : 'Không có yêu cầu trong kỳ lọc';
    }

    function renderChart(entries, keepYear) {
      const allYears = [];
      journalAll.forEach((e) => {
        const y = e.date.slice(0, 4);
        if (allYears.indexOf(y) === -1) allYears.push(y);
      });
      allYears.sort();
      const years = allYears.length ? allYears : [String(new Date().getFullYear())];

      chartYear.innerHTML = '';
      years.forEach((y) => {
        const o = document.createElement('option');
        o.value = y;
        o.textContent = y;
        chartYear.appendChild(o);
      });
      const yearsWithEntries = years.filter((y) => entries.some((e) => e.date.slice(0, 4) === y));
      let wanted;
      if (keepYear && state.year && years.indexOf(state.year) !== -1) wanted = state.year;
      else if (yearsWithEntries.length) wanted = yearsWithEntries[yearsWithEntries.length - 1];
      else wanted = state.year && years.indexOf(state.year) !== -1 ? state.year : years[years.length - 1];
      chartYear.value = wanted;
      chartYear.disabled = years.length <= 1;
      state.year = wanted;

      const counts = [];
      for (let i = 0; i < 12; i++) counts.push({ l: 'T' + (i + 1), v: 0 });
      entries.forEach((e) => {
        if (e.date.slice(0, 4) === wanted) counts[Number(e.date.slice(5, 7)) - 1].v += 1;
      });
      const total = counts.reduce((a, b) => a + b.v, 0);
      const host = $('#yieldBars');
      const empty = $('#yieldEmpty');
      if (!total) {
        host.innerHTML = '';
        host.hidden = true;
        empty.hidden = false;
        empty.textContent = state.scope === 'requests'
          ? 'Phạm vi “Chỉ yêu cầu tư vấn” không có nhật ký canh tác.'
          : 'Không có nhật ký trong khoảng ngày đang chọn.';
      } else {
        host.hidden = false;
        empty.hidden = true;
        barChart(host, counts.map((d) => ({ l: d.l, v: d.v })));
      }
      $('#yieldCaption').textContent = 'Đơn vị: lượt ghi nhận · năm ' + wanted + ' · ' + (total ? total + ' bản ghi trong kỳ' : 'chưa có bản ghi');
    }

    function renderDonut(entries) {
      const total = entries.length;
      const counts = TYPES.map((t) => ({ t: t, n: entries.filter((e) => e.type === t).length }));
      const pie = $('.donut__pie');
      let acc = 0;
      const stops = [];
      counts.forEach((c) => {
        const pct = total ? (c.n / total) * 100 : 0;
        stops.push(colorOf(c.t) + ' ' + acc.toFixed(2) + '% ' + (acc + pct).toFixed(2) + '%');
        acc += pct;
      });
      pie.style.background = total ? 'conic-gradient(' + stops.join(', ') + ')' : '#eceadf';

      const legend = $('#jobLegend');
      legend.innerHTML = '';
      counts.forEach((c) => {
        const li = h('li');
        const swatch = h('i');
        swatch.style.background = colorOf(c.t);
        li.append(swatch, document.createTextNode(c.t), h('b', '', c.n + ' lần · ' + (total ? Math.round((c.n / total) * 100) : 0) + '%'));
        legend.appendChild(li);
      });
      $('#jobTotal').textContent = String(total);
      $('#jobCaption').textContent = total
        ? 'Theo ' + total + ' nhật ký trong kỳ · đơn vị: lượt ghi nhận'
        : (state.scope === 'requests' ? 'Phạm vi chỉ yêu cầu tư vấn — không có nhật ký.' : 'Chưa có nhật ký trong kỳ lọc.');
    }

    function renderPlots(entries) {
      const keys = ['A1', 'B2', 'C3'];
      entries.forEach((e) => {
        const p = plotOf(e);
        if (p && keys.indexOf(p) === -1) keys.push(p);
      });
      const span = entrySpan(entries);
      const body = $('#plotBody');
      body.innerHTML = '';

      function rowFor(label, list, areaText) {
        const harvest = list.filter((e) => e.type === 'Thu hoạch');
        const avg = avgYield(harvest);
        const trend = trendOf(list, span);
        return [
          label + (areaText ? ' · ' + areaText : ''),
          { text: String(list.length), cls: 'num' },
          { text: String(harvest.length), cls: 'num' },
          { text: avg == null ? '—' : fmtNum(avg, 1) + ' tấn/ha', cls: 'num' },
          { node: chip(trend, trendKind(trend)) }
        ];
      }

      keys.forEach((p) => {
        tableRow(body, rowFor('Lô ' + p, entries.filter((e) => plotOf(e) === p), PLOT_META[p] || ''));
      });
      const unassigned = entries.filter((e) => !plotOf(e));
      tableRow(body, rowFor('Chưa gắn lô', unassigned, ''));

      const totalAvg = avgYield(entries.filter((e) => e.type === 'Thu hoạch'));
      const totalTrend = trendOf(entries, span);
      const totalRow = tableRow(body, [
        { text: 'Tổng' },
        { text: String(entries.length), cls: 'num' },
        { text: String(entries.filter((e) => e.type === 'Thu hoạch').length), cls: 'num' },
        { text: totalAvg == null ? '—' : fmtNum(totalAvg, 1) + ' tấn/ha', cls: 'num' },
        { node: chip(totalTrend, trendKind(totalTrend)) }
      ]);
      totalRow.classList.add('is-total');

      $('#plotCaption').textContent = entries.length
        ? 'Lô nhận diện từ mã A1/B2/C3 trong mô tả nhật ký · ' + unassigned.length + ' bản ghi chưa gắn lô'
        : 'Chưa có nhật ký trong kỳ lọc — số liệu theo lô bằng 0.';
    }

    function renderTopics(requests) {
      const host = $('#topicMeters');
      host.innerHTML = '';
      const total = requests.length;
      const counts = FIELDS.map((f) => ({ f: f, n: requests.filter((r) => r.field === f).length }));
      const max = counts.reduce((m, c) => Math.max(m, c.n), 0);
      if (!total) {
        host.appendChild(h('p', 'empty', state.scope === 'journal'
          ? 'Phạm vi “Chỉ nhật ký canh tác” không có yêu cầu tư vấn.'
          : 'Không có yêu cầu tư vấn trong kỳ lọc.'));
      } else {
        counts.sort((a, b) => b.n - a.n).forEach((c) => {
          meter(host, c.f, c.n + ' ca', max ? Math.round((c.n / max) * 100) : 0, FIELD_KIND[c.f] || '');
        });
      }
      const demo = requests.filter((r) => r.origin === 'demo').length;
      $('#topicCaption').textContent = total
        ? total + ' yêu cầu · ' + new Set(requests.map((r) => r.hh)).size + ' nông hộ · ' + (total - demo) + ' thật / ' + demo + ' mẫu'
        : 'Chưa có yêu cầu trong kỳ lọc.';
    }

    function renderWeek(entries) {
      const body = $('#weekBody');
      body.innerHTML = '';
      const byDate = {};
      entries.forEach((e) => {
        if (!byDate[e.date]) byDate[e.date] = [];
        byDate[e.date].push(e);
      });
      const dates = Object.keys(byDate).sort().reverse().slice(0, 7);
      dates.forEach((d) => {
        const list = byDate[d];
        const parts = TYPES.map((t) => {
          const n = list.filter((e) => e.type === t).length;
          return n ? t + ' (' + n + ')' : '';
        }).filter(Boolean);
        tableRow(body, [fmtDate(d), parts.join(' · '), { text: String(list.length), cls: 'num' }]);
      });
      if (!dates.length) tableRow(body, ['—', 'Không có ghi nhận trong kỳ lọc', { text: '0', cls: 'num' }]);
      $('#weekCaption').textContent = dates.length
        ? dates.length + ' ngày có ghi nhận gần nhất trong kỳ · ' + entries.length + ' bản ghi'
        : 'Chưa có nhật ký trong kỳ lọc.';
    }

    function renderMeta(entries, requests) {
      const period = state.from && state.to ? fmtDate(state.from) + ' – ' + fmtDate(state.to) : 'Chưa giới hạn ngày';
      const bits = [period, 'Phạm vi: ' + SCOPE_LABEL[state.scope], entries.length + ' nhật ký', requests.length + ' yêu cầu'];
      if (journalFallback) bits.push('nhật ký dùng dữ liệu mẫu mặc định');
      if (reqFallback) bits.push('yêu cầu dùng dữ liệu mẫu mặc định');
      $('#rfCaption').textContent = bits.join(' · ');
      $('#exSummary').textContent = period + ' · ' + SCOPE_LABEL[state.scope] + ' · ' + entries.length + ' nhật ký, ' + requests.length + ' yêu cầu';
    }

    function renderAll() {
      const entries = filteredJournal();
      const requests = filteredRequests();
      current = { entries: entries, requests: requests };
      renderKpis(entries, requests);
      renderChart(entries, false);
      renderDonut(entries);
      renderPlots(entries);
      renderTopics(requests);
      renderWeek(entries);
      renderMeta(entries, requests);
    }

    /* ---------- Xuất báo cáo: cùng một mô hình cho CSV, Excel và bản in ---------- */
    function csvCell(v) {
      const s = String(v == null ? '' : v);
      return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }
    function escHtml(v) {
      return String(v == null ? '' : v)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function buildModel(entries, requests, withCharts) {
      const sortedEntries = entries.slice().sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')));
      const sortedReqs = requests.slice().sort((a, b) => String(b.at).localeCompare(String(a.at)));
      const harvest = sortedEntries.filter((e) => e.type === 'Thu hoạch');
      const yields = harvest.map((e) => parseYield(e.note)).filter((v) => v != null && v > 0);
      const avg = yields.length ? yields.reduce((a, b) => a + b, 0) / yields.length : null;
      const done = sortedReqs.filter((r) => r.status === 'done').length;
      const open = sortedReqs.filter((r) => r.status === 'open').length;
      const pending = sortedReqs.length - done;
      const names = [];
      sortedReqs.forEach((r) => {
        const key = fold(r.hh).trim();
        if (key && names.indexOf(key) === -1) names.push(key);
      });

      const kpis = [
        ['Nhật ký canh tác', String(sortedEntries.length), 'lượt ghi nhận', harvest.length + ' lượt thu hoạch · ' + new Set(sortedEntries.map((e) => e.date)).size + ' ngày có ghi'],
        ['Yêu cầu tư vấn', String(sortedReqs.length), 'yêu cầu', done + ' đã xử lý · ' + open + ' chờ phân công'],
        ['Năng suất bình quân', avg == null ? '—' : fmtNum(avg, 1), 'tấn/ha', avg == null ? 'Chưa có năng suất trong nhật ký' : 'Từ ' + yields.length + ' bản ghi thu hoạch'],
        ['Nông hộ được tư vấn', String(names.length), 'nông hộ', pending + ' yêu cầu chờ xử lý']
      ];

      const years = [];
      sortedEntries.forEach((e) => {
        const y = e.date.slice(0, 4);
        if (years.indexOf(y) === -1) years.push(y);
      });
      years.sort();
      const monthlyHead = ['Tháng'].concat(years);
      const monthlyRows = [];
      for (let m = 1; m <= 12; m++) {
        const row = ['T' + m];
        years.forEach((y) => {
          row.push(String(sortedEntries.filter((e) => e.date.slice(0, 4) === y && Number(e.date.slice(5, 7)) === m).length));
        });
        monthlyRows.push(row);
      }
      const monthlyTotal = ['Tổng'].concat(years.map((y) => String(sortedEntries.filter((e) => e.date.slice(0, 4) === y).length)));

      const distRows = TYPES.map((t) => {
        const n = sortedEntries.filter((e) => e.type === t).length;
        return [t, String(n), (sortedEntries.length ? Math.round((n / sortedEntries.length) * 100) : 0) + '%'];
      });

      const span = entrySpan(sortedEntries);
      const plotKeys = ['A1', 'B2', 'C3'];
      sortedEntries.forEach((e) => {
        const p = plotOf(e);
        if (p && plotKeys.indexOf(p) === -1) plotKeys.push(p);
      });
      plotKeys.push('');
      const plotRows = plotKeys.map((p) => {
        const list = p ? sortedEntries.filter((e) => plotOf(e) === p) : sortedEntries.filter((e) => !plotOf(e));
        const hv = list.filter((e) => e.type === 'Thu hoạch');
        const a = avgYield(hv);
        return [p ? 'Lô ' + p : 'Chưa gắn lô', String(list.length), String(hv.length), a == null ? '—' : fmtNum(a, 1) + ' tấn/ha', trendOf(list, span)];
      });
      plotRows.push(['Tổng', String(sortedEntries.length), String(harvest.length),
        avg == null ? '—' : fmtNum(avg, 1) + ' tấn/ha', trendOf(sortedEntries, span)]);

      const topicRows = FIELDS.map((f) => {
        const n = sortedReqs.filter((r) => r.field === f).length;
        return [f, String(n), (sortedReqs.length ? Math.round((n / sortedReqs.length) * 100) : 0) + '%'];
      });

      const byDate = {};
      sortedEntries.forEach((e) => {
        if (!byDate[e.date]) byDate[e.date] = [];
        byDate[e.date].push(e);
      });
      const weekRows = Object.keys(byDate).sort().reverse().slice(0, 7).map((d) => {
        const list = byDate[d];
        const parts = TYPES.map((t) => {
          const n = list.filter((e) => e.type === t).length;
          return n ? t + ' (' + n + ')' : '';
        }).filter(Boolean);
        return [fmtDate(d), parts.join(' · '), String(list.length)];
      });

      const journalRows = sortedEntries.map((e) => [
        fmtDate(e.date), e.time || '—', e.type, e.stage || '—', plotOf(e) ? 'Lô ' + plotOf(e) : 'Chưa gắn', e.note
      ]);
      const reqRows = sortedReqs.map((r) => [
        fmtDate(r.date), r.hh, r.crop, r.field, r.topic, REQ_STATUS[r.status] || r.status,
        (r.origin === 'real' ? 'Dữ liệu thật' : 'Dữ liệu mẫu') + ' · ' + r.source
      ]);

      const tables = [
        { title: 'Chỉ số tổng hợp', head: ['Chỉ số', 'Giá trị', 'Đơn vị', 'Ghi chú'], rows: kpis }
      ];
      if (withCharts && sortedEntries.length) {
        tables.push({ title: 'Nhật ký theo tháng', head: monthlyHead, rows: monthlyRows.concat([monthlyTotal]) });
        tables.push({ title: 'Phân bố loại hoạt động', head: ['Loại hoạt động', 'Số lượt', 'Tỷ lệ'], rows: distRows });
      }
      tables.push({ title: 'Tổng hợp theo lô canh tác', head: ['Lô', 'Nhật ký', 'Thu hoạch', 'Năng suất TB', 'Xu hướng'], rows: plotRows });
      tables.push({ title: 'Yêu cầu tư vấn theo chuyên đề', head: ['Lĩnh vực', 'Số yêu cầu', 'Tỷ lệ'], rows: topicRows });
      tables.push({ title: 'Nhật ký theo ngày (7 ngày gần nhất trong kỳ)', head: ['Ngày', 'Hoạt động', 'Số ghi nhận'], rows: weekRows.length ? weekRows : [['—', 'Không có ghi nhận', '0']] });
      tables.push({ title: 'Chi tiết nhật ký', head: ['Ngày', 'Giờ', 'Loại', 'Giai đoạn', 'Lô', 'Mô tả'], rows: journalRows.length ? journalRows : [['—', '—', '—', '—', '—', 'Không có nhật ký trong kỳ']] });
      tables.push({ title: 'Chi tiết yêu cầu tư vấn', head: ['Ngày', 'Nông hộ', 'Cây trồng', 'Lĩnh vực', 'Chuyên đề', 'Trạng thái', 'Nguồn'], rows: reqRows.length ? reqRows : [['—', '—', '—', '—', '—', '—', 'Không có yêu cầu trong kỳ']] });

      return {
        meta: {
          generatedAt: nowStamp(),
          period: state.from && state.to ? fmtDate(state.from) + ' – ' + fmtDate(state.to) : 'Chưa giới hạn ngày',
          scope: SCOPE_LABEL[state.scope],
          withCharts: withCharts
        },
        kpis: kpis,
        tables: tables,
        monthly: withCharts && sortedEntries.length ? { head: monthlyHead, rows: monthlyRows } : null,
        entries: sortedEntries,
        requests: sortedReqs
      };
    }

    function buildCsv(model) {
      const lines = [];
      const push = (cells) => lines.push(cells.map(csvCell).join(','));
      push(['BÁO CÁO SMARTAGRI']);
      push(['Tạo lúc', model.meta.generatedAt]);
      push(['Kỳ báo cáo', model.meta.period]);
      push(['Phạm vi', model.meta.scope]);
      push(['Kèm biểu đồ', model.meta.withCharts ? 'Có' : 'Không']);
      model.tables.forEach((t) => {
        push([]);
        push([t.title]);
        push(t.head);
        t.rows.forEach((r) => push(r));
      });
      push([]);
      push(['Nguồn: nhật ký canh đồng và yêu cầu tư vấn lưu trong trình duyệt. Số liệu tính tại thời điểm tạo báo cáo.']);
      return '\ufeff' + lines.join('\r\n');
    }

    function tableHtml(t) {
      return '<h2>' + escHtml(t.title) + '</h2><table><thead><tr>' +
        t.head.map((x) => '<th>' + escHtml(x) + '</th>').join('') +
        '</tr></thead><tbody>' +
        t.rows.map((r) => '<tr>' + r.map((c) => '<td>' + escHtml(c) + '</td>').join('') + '</tr>').join('') +
        '</tbody></table>';
    }

    function buildXls(model) {
      return '\ufeff<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">' +
        '<head><meta charset="utf-8"><title>Báo cáo SmartAgri</title>' +
        '<style>body{font-family:Arial,sans-serif;font-size:12px}h1{font-size:18px}h2{font-size:14px;margin:18px 0 6px}table{border-collapse:collapse}th{background:#e8f1e6;text-align:left}td,th{padding:4px 6px;border:1px solid #a9b8ab;vertical-align:top}</style>' +
        '</head><body>' +
        '<h1>BÁO CÁO SMARTAGRI</h1>' +
        '<p>Tạo lúc: ' + escHtml(model.meta.generatedAt) + '<br>Kỳ báo cáo: ' + escHtml(model.meta.period) + '<br>Phạm vi: ' + escHtml(model.meta.scope) + '</p>' +
        model.tables.map(tableHtml).join('') +
        '<p><em>Nguồn: nhật ký canh đồng và yêu cầu tư vấn lưu trong trình duyệt.</em></p>' +
        '</body></html>';
    }

    function buildPrintHtml(model) {
      let chartHtml = '';
      if (model.monthly) {
        let max = 1;
        model.monthly.rows.forEach((r) => {
          r.slice(1).forEach((v) => { max = Math.max(max, Number(v)); });
        });
        const cols = model.monthly.rows.map((r) => {
          const total = r.slice(1).reduce((a, b) => a + Number(b), 0);
          return '<div class="bar"><span class="bar__v">' + total + '</span>' +
            '<div class="bar__track"><span class="bar__fill" style="height:' + Math.max(3, Math.round((total / max) * 100)) + '%"></span></div>' +
            '<span class="bar__l">' + escHtml(r[0]) + '</span></div>';
        }).join('');
        chartHtml = '<section><h2>Nhật ký theo tháng</h2><p class="muted">Đơn vị: lượt ghi nhận · năm: ' +
          escHtml(model.monthly.head.slice(1).join(', ')) + ' · cao nhất: ' + max + ' lượt/tháng</p>' +
          '<div class="bars">' + cols + '</div></section>';
      }

      const kpiHtml = model.kpis.map((k) => '<div class="kpi"><b>' + escHtml(k[1]) + '</b>' +
        '<span>' + escHtml(k[0]) + ' · ' + escHtml(k[2]) + '</span><small>' + escHtml(k[3]) + '</small></div>').join('');

      const tablesHtml = model.tables
        .filter((t) => t.title !== 'Chỉ số tổng hợp')
        .map(tableHtml).join('');

      return '<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>Báo cáo SmartAgri — ' + escHtml(model.meta.period) + '</title>' +
        '<style>' +
        'body{font-family:"Be Vietnam Pro",Arial,sans-serif;color:#22302a;margin:26px;font-size:12px}' +
        'h1{font-size:22px;margin:0 0 6px;color:#1f5430}' +
        'h2{font-size:15px;margin:20px 0 8px;color:#1f5430;border-bottom:2px solid #dce8d8;padding-bottom:4px}' +
        '.meta{color:#5b6b62;margin:0 0 16px;line-height:1.6}' +
        '.muted{color:#5b6b62;font-size:11px;margin:0 0 8px}' +
        '.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0 8px}' +
        '.kpi{border:1px solid #c9d6cc;border-radius:8px;padding:10px}' +
        '.kpi b{display:block;font-size:20px;color:#1f5430}' +
        '.kpi span{display:block;font-size:11px;color:#3c4a42;margin-top:2px}' +
        '.kpi small{display:block;font-size:10px;color:#6b7a70;margin-top:4px}' +
        'table{width:100%;border-collapse:collapse;margin-bottom:10px}' +
        'th{background:#eaf2e7;text-align:left;font-size:11px}' +
        'th,td{border:1px solid #c9d6cc;padding:4px 6px;vertical-align:top}' +
        '.bars{display:flex;align-items:flex-end;gap:6px;height:150px;padding:8px 0}' +
        '.bar{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px;height:100%}' +
        '.bar__v{font-size:10px;font-weight:700;color:#1f5430}' +
        '.bar__track{width:100%;max-width:30px;flex:1;display:flex;align-items:flex-end;background:#f1f4ee;border-radius:4px}' +
        '.bar__fill{display:block;width:100%;background:linear-gradient(180deg,#58a86b,#2e7d4f);border-radius:4px 4px 0 0}' +
        '.bar__l{font-size:10px;color:#5b6b62}' +
        '.toolbar{display:flex;justify-content:flex-end;margin-bottom:12px}' +
        '.toolbar button{padding:8px 16px;border:0;border-radius:8px;background:#2e7d4f;color:#fff;font-weight:600;cursor:pointer;font-size:13px}' +
        '@media print{.toolbar{display:none}body{margin:0}@page{size:A4;margin:14mm}}' +
        '</style></head><body>' +
        '<div class="toolbar"><button type="button" onclick="window.print()">In / Lưu PDF</button></div>' +
        '<h1>BÁO CÁO SMARTAGRI</h1>' +
        '<p class="meta">Tạo lúc: ' + escHtml(model.meta.generatedAt) + ' · Kỳ báo cáo: ' + escHtml(model.meta.period) +
        '<br>Phạm vi: ' + escHtml(model.meta.scope) + ' · ' + model.entries.length + ' nhật ký · ' + model.requests.length + ' yêu cầu</p>' +
        '<div class="kpis">' + kpiHtml + '</div>' +
        chartHtml +
        tablesHtml +
        '<p class="muted">Nguồn: nhật ký canh đồng và yêu cầu tư vấn lưu trong trình duyệt. Số liệu khớp với trang Báo cáo &amp; Thống kê tại thời điểm tạo.</p>' +
        '</body></html>';
    }

    function downloadFile(name, text, mime) {
      const blob = new Blob([text], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        a.remove();
        URL.revokeObjectURL(url);
      }, 600);
    }

    function openPrintReport(model, base) {
      const html = buildPrintHtml(model);
      const w = window.open('', '_blank', 'width=960,height=1000');
      if (!w) {
        downloadFile(base + '.html', html, 'text/html;charset=utf-8');
        return false;
      }
      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => {
        try { w.print(); } catch (err) { /* trình duyệt chặn in thì người dùng vẫn xem được bản trình bày */ }
      }, 400);
      return true;
    }

    pills.forEach((btn) => {
      btn.addEventListener('click', () => {
        activePreset = btn.dataset.days;
        if (activePreset === 'all') {
          const b = dataBounds();
          state.from = b.min;
          state.to = b.max;
        } else {
          state.to = todayISO();
          state.from = addDays(state.to, -(Number(activePreset) - 1));
        }
        fromEl.value = state.from;
        toEl.value = state.to;
        pills.forEach((p) => p.classList.toggle('is-on', p === btn));
        renderAll();
        showToast(activePreset === 'all' ? 'Đang xem toàn bộ dữ liệu đã lưu.' : 'Đang xem ' + activePreset + ' ngày gần nhất.', 'ok');
      });
    });

    function onDateEdit() {
      let from = fromEl.value;
      let to = toEl.value;
      if (from && to && from > to) {
        const tmp = from;
        from = to;
        to = tmp;
        fromEl.value = from;
        toEl.value = to;
        showToast('Đã đổi chỗ ngày bắt đầu và kết thúc cho hợp lệ.');
      }
      state.from = from;
      state.to = to;
      activePreset = '';
      pills.forEach((p) => p.classList.remove('is-on'));
      renderAll();
    }
    fromEl.addEventListener('change', onDateEdit);
    toEl.addEventListener('change', onDateEdit);

    scopeEl.addEventListener('change', () => {
      state.scope = scopeEl.value;
      renderAll();
    });

    chartYear.addEventListener('change', () => {
      state.year = chartYear.value;
      renderChart(current.entries, true);
    });

    $('#btnRecalc').addEventListener('click', () => {
      journalAll = readJournal();
      reqAll = readRequests();
      if (activePreset === 'all') {
        const b = dataBounds();
        state.from = b.min;
        state.to = b.max;
        fromEl.value = state.from;
        toEl.value = state.to;
      }
      renderAll();
      showToast('Đã đọc lại ' + journalAll.length + ' nhật ký và ' + reqAll.length + ' yêu cầu từ bộ nhớ trình duyệt.', 'ok');
    });

    $('#exportForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const entries = current.entries;
      const requests = current.requests;
      if (!entries.length && !requests.length) {
        showToast('Không có dữ liệu trong kỳ và phạm vi đang chọn — hãy đổi bộ lọc trước khi xuất.', 'bad');
        return;
      }
      const withCharts = $('#exCharts').checked;
      const fmt = $('#exFormat').value;
      const model = buildModel(entries, requests, withCharts);
      const base = 'smartagri-bao-cao-' + fileStamp();
      if (fmt.indexOf('CSV') === 0) {
        downloadFile(base + '.csv', buildCsv(model), 'text/csv;charset=utf-8');
        showToast('Đã tải ' + base + '.csv · ' + entries.length + ' nhật ký, ' + requests.length + ' yêu cầu.', 'ok');
      } else if (fmt.indexOf('Excel') === 0) {
        downloadFile(base + '.xls', buildXls(model), 'application/vnd.ms-excel;charset=utf-8');
        showToast('Đã tải ' + base + '.xls · ' + entries.length + ' nhật ký, ' + requests.length + ' yêu cầu.', 'ok');
      } else {
        const opened = openPrintReport(model, base);
        showToast(opened
          ? 'Đã mở bản trình bày — chọn “Save as PDF” trong hộp thoại in.'
          : 'Đã tải bản HTML của báo cáo (trình duyệt chặn cửa sổ in).', 'ok');
      }
    });

    const bootBounds = dataBounds();
    state.from = bootBounds.min;
    state.to = bootBounds.max;
    fromEl.value = state.from;
    toEl.value = state.to;
    scopeEl.value = 'all';
    pills.forEach((p) => p.classList.toggle('is-on', p.dataset.days === 'all'));
    renderAll();
  }

  /* =========================================================
     6. CÀI ĐẶT HỆ THỐNG
     ========================================================= */
  function initSettings() {
    const STORE = 'smartagri_settings';
    const DEFAULTS = {
      jobs: ['Bón phân', 'Phun thuốc', 'Tưới nước', 'Làm cỏ', 'Thu hoạch', 'Kiểm tra sâu bệnh'],
      crops: ['Lúa', 'Xoài', 'Sầu riêng'],
      users: [
        { name: 'Nguyễn Văn Nam', role: 'Chuyên gia', scope: '3 lô ruộng', active: true },
        { name: 'Trần Thị Hoa', role: 'Chuyên gia', scope: 'Toàn huyện', active: true },
        { name: 'Lê Minh Tuấn', role: 'Cán bộ xã', scope: 'Xã Bình Thạnh', active: true },
        { name: 'admin.smartagri', role: 'Quản trị', scope: 'Toàn hệ thống', active: true },
        { name: 'Võ Thị Đẹp', role: 'Nông hộ', scope: 'Tự quản lý', active: false }
      ]
    };
    const ALL_CROPS = ['Lúa', 'Xoài', 'Sầu riêng', 'Rau màu', 'Điều', 'Cao su', 'Ngô'];
    const PROFILE_KEYS = ['setName', 'setEmail', 'setPhone', 'setRegion', 'setLang', 'setUnit'];

    function cleanStrList(v, fallback) {
      if (!Array.isArray(v)) return fallback.slice();
      const out = v.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim());
      return out.length ? out : fallback.slice();
    }
    function cleanUser(u) {
      return u && typeof u.name === 'string' && u.name.trim()
        ? { name: u.name.trim(), role: String(u.role || 'Chuyên gia'), scope: String(u.scope || 'Chưa gán'), active: !!u.active }
        : null;
    }

    const state = {
      profile: {},
      jobs: DEFAULTS.jobs.slice(),
      crops: DEFAULTS.crops.slice(),
      switches: {},
      ai: null,
      users: DEFAULTS.users.map(cleanUser).filter(Boolean),
      updatedAt: null
    };

    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || '{}');
      if (saved && typeof saved === 'object') {
        if (saved.profile && typeof saved.profile === 'object') {
          PROFILE_KEYS.forEach((k) => {
            if (typeof saved.profile[k] === 'string') state.profile[k] = saved.profile[k];
          });
        }
        state.jobs = cleanStrList(saved.jobs, DEFAULTS.jobs);
        state.crops = cleanStrList(saved.crops, DEFAULTS.crops);
        if (saved.switches && typeof saved.switches === 'object') {
          Object.keys(saved.switches).forEach((k) => {
            if (typeof saved.switches[k] === 'boolean') state.switches[k] = saved.switches[k];
          });
        }
        if (saved.ai && typeof saved.ai === 'object') {
          state.ai = {
            model: typeof saved.ai.model === 'string' ? saved.ai.model : '',
            threshold: Number(saved.ai.threshold) || 75,
            retention: typeof saved.ai.retention === 'string' ? saved.ai.retention : ''
          };
        }
        if (Array.isArray(saved.users)) {
          const cleaned = saved.users.map(cleanUser).filter(Boolean);
          state.users = cleaned.length ? cleaned : DEFAULTS.users.map(cleanUser).filter(Boolean);
        }
        if (typeof saved.updatedAt === 'string') state.updatedAt = saved.updatedAt;
      }
    } catch (err) { /* dữ liệu hỏng → dùng giá trị mặc định */ }

    const p2 = (n) => String(n).padStart(2, '0');
    function savedAtLabel() {
      if (!state.updatedAt) return 'Chưa có thay đổi nào được lưu trên máy này.';
      const d = new Date(state.updatedAt);
      return 'Đã lưu lúc ' + p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + '/' + d.getFullYear() +
        ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()) + ' — tải lại trang vẫn giữ nguyên.';
    }
    function renderSavedAt() {
      $('#settingsSavedAt').textContent = savedAtLabel();
    }

    function persist() {
      state.updatedAt = new Date().toISOString();
      try {
        localStorage.setItem(STORE, JSON.stringify(state));
      } catch (err) { /* bộ nhớ trình duyệt đầy */ }
      renderSavedAt();
    }

    /* hồ sơ */
    const profileForm = $('#profileForm');
    const fields = ['setName', 'setEmail', 'setPhone', 'setRegion', 'setLang', 'setUnit'];
    fields.forEach((id) => { if (state.profile[id]) $('#' + id).value = state.profile[id]; });

    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = $('#setEmail').value.trim();
      const phone = $('#setPhone').value.trim();
      if ($('#setName').value.trim().length < 4) { showToast('Tên đơn vị quản lý quá ngắn.', 'bad'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('Email liên hệ chưa hợp lệ.', 'bad'); return; }
      if (phone.replace(/\D/g, '').length < 8) { showToast('Số điện thoại chưa hợp lệ.', 'bad'); return; }
      state.profile = {};
      fields.forEach((id) => { state.profile[id] = $('#' + id).value; });
      persist();
      showToast('Đã lưu hồ sơ hệ thống.', 'ok');
    });

    /* loại hoạt động */
    const jobHost = $('#jobTags');
    const jobErr = $('#jobError');

    function renderJobs() {
      jobHost.innerHTML = '';
      state.jobs.forEach((name, idx) => {
        const tag = h('span', 'tag');
        tag.appendChild(document.createTextNode(name));
        const rm = h('button');
        rm.type = 'button';
        rm.setAttribute('aria-label', 'Xóa ' + name);
        rm.innerHTML = icon('i-close');
        rm.addEventListener('click', () => {
          if (state.jobs.length <= 3) {
            jobErr.textContent = 'Cần giữ tối thiểu 3 loại hoạt động.';
            jobErr.hidden = false;
            return;
          }
          state.jobs.splice(idx, 1);
          jobErr.hidden = true;
          persist();
          renderJobs();
          showToast('Đã bỏ loại “' + name + '”.');
        });
        tag.appendChild(rm);
        jobHost.appendChild(tag);
      });
    }

    $('#btnAddJob').addEventListener('click', () => {
      const input = $('#jobInput');
      const v = input.value.trim();
      if (v.length < 3) { jobErr.textContent = 'Tên loại hoạt động cần tối thiểu 3 ký tự.'; jobErr.hidden = false; return; }
      if (state.jobs.some((j) => j.toLowerCase() === v.toLowerCase())) { jobErr.textContent = '“' + v + '” đã có trong danh mục.'; jobErr.hidden = false; return; }
      state.jobs.push(v);
      input.value = '';
      jobErr.hidden = true;
      persist();
      renderJobs();
      showToast('Đã thêm loại hoạt động “' + v + '”.', 'ok');
    });

    $('#jobInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); $('#btnAddJob').click(); }
    });

    /* cây trồng */
    const cropHost = $('#cropTags');
    function renderCrops() {
      cropHost.innerHTML = '';
      state.crops.forEach((name) => {
        const tag = h('span', 'tag');
        tag.appendChild(document.createTextNode(name));
        const rm = h('button');
        rm.type = 'button';
        rm.setAttribute('aria-label', 'Bỏ theo dõi ' + name);
        rm.innerHTML = icon('i-close');
        rm.addEventListener('click', () => {
          state.crops = state.crops.filter((c) => c !== name);
          persist();
          renderCrops();
          showToast('Đã bỏ theo dõi ' + name + '.');
        });
        tag.appendChild(rm);
        cropHost.appendChild(tag);
      });
      ALL_CROPS.filter((c) => state.crops.indexOf(c) === -1).forEach((c) => {
        const add = h('button', 'pill', '+ ' + c);
        add.type = 'button';
        add.addEventListener('click', () => {
          state.crops.push(c);
          persist();
          renderCrops();
          showToast('Đã thêm cây trồng ' + c + ' vào danh mục theo dõi.', 'ok');
        });
        cropHost.appendChild(add);
      });
    }

    /* công tắc */
    qa('#switchBox input').forEach((box) => {
      const key = box.dataset.set;
      if (typeof state.switches[key] === 'boolean') box.checked = state.switches[key];
      box.addEventListener('change', () => {
        state.switches[key] = box.checked;
        persist();
        const on = qa('#switchBox input').filter((b) => b.checked).length;
        $('#switchSummary').textContent = 'Đã lưu: ' + on + '/' + qa('#switchBox input').length + ' loại cảnh báo đang bật.';
      });
    });
    const onCount = qa('#switchBox input').filter((b) => b.checked).length;
    $('#switchSummary').textContent = 'Đã lưu: ' + onCount + '/' + qa('#switchBox input').length + ' loại cảnh báo đang bật.';

    /* AI */
    const aiRange = $('#aiThreshold');
    if (state.ai) {
      const modelSel = $('#aiModel');
      const optHas = (sel, v) => Array.prototype.some.call(sel.options, (o) => o.value === v);
      if (state.ai.model && optHas(modelSel, state.ai.model)) modelSel.value = state.ai.model;
      aiRange.value = state.ai.threshold;
      if (state.ai.retention && optHas($('#aiRetention'), state.ai.retention)) $('#aiRetention').value = state.ai.retention;
    }
    $('#aiThresholdOut').textContent = aiRange.value + '%';
    aiRange.addEventListener('input', () => { $('#aiThresholdOut').textContent = aiRange.value + '%'; });
    $('#aiForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const typedKey = $('#aiKey').value.trim();
      state.ai = { model: $('#aiModel').value, threshold: aiRange.value, retention: $('#aiRetention').value };
      persist();
      $('#aiKey').value = '';
      showToast(
        typedKey
          ? 'Đã lưu cấu hình AI. Khóa bạn nhập không được lưu — bản demo không gửi khóa đi đâu cả.'
          : 'Đã lưu cấu hình mô hình AI.',
        typedKey ? '' : 'ok'
      );
    });

    /* tài khoản */
    const users = state.users;
    const userBody = $('#userBody');
    const meName = String(sessionStorage.getItem('smartagri_user') || 'Nguyễn Văn Nam').trim();

    function renderUsers() {
      userBody.innerHTML = '';
      users.forEach((u, idx) => {
        const badge = h('span', 'sev sev--' + (u.role === 'Quản trị' ? 'urgent' : u.role === 'Chuyên gia' ? 'low' : 'mid'), u.role);
        const acts = h('div', 'row__acts');
        if (u.name === meName) {
          const lock = h('span', 'u-lock', 'Đang đăng nhập — không thể tự khóa');
          lock.title = 'Bản demo không xác thực quyền thật; khi triển khai thật, máy chủ sẽ chặn thao tác trái phép.';
          acts.appendChild(lock);
        } else {
          acts.append(
            actBtn(u.active ? 'Vô hiệu hóa' : 'Kích hoạt', u.active ? 'del' : 'ok', u.active ? 'i-close' : 'i-check', () => {
              u.active = !u.active;
              persist();
              renderUsers();
              showToast('Tài khoản ' + u.name + ' đã ' + (u.active ? 'kích hoạt.' : 'vô hiệu hóa.'));
            })
          );
        }
        tableRow(userBody, [u.name, { node: badge }, u.scope, { node: acts }]);
      });
    }

    $('#btnAddUser').addEventListener('click', () => {
      const form = h('div');
      form.innerHTML =
        '<div class="field"><label for="uName">Tên đăng nhập / họ tên</label><input id="uName" type="text"></div>' +
        '<div class="field"><label for="uRole">Vai trò</label><select id="uRole"><option>Chuyên gia</option><option>Cán bộ xã</option><option>Nông hộ</option><option>Quản trị</option></select></div>' +
        '<div class="field"><label for="uScope">Phạm vi hoạt động</label><input id="uScope" type="text" placeholder="Ví dụ: Xã Bình Thạnh"></div>';
      openModal('Thêm tài khoản', form, [
        { label: 'Hủy', onClick: closeModal },
        {
          label: 'Tạo tài khoản', primary: true, onClick: () => {
            const name = form.querySelector('#uName').value.trim();
            if (name.length < 3) { showToast('Tên tài khoản quá ngắn.', 'bad'); return; }
            users.push({ name: name, role: form.querySelector('#uRole').value, scope: form.querySelector('#uScope').value.trim() || 'Chưa gán', active: true });
            persist();
            renderUsers();
            closeModal();
            showToast('Đã tạo tài khoản ' + name + '.', 'ok');
          }
        }
      ]);
    });

    $('#btnResetData').addEventListener('click', () => {
      const wrap = h('div');
      wrap.appendChild(h('div', 'note note--bad', 'Toàn bộ cấu hình đã lưu trên trình duyệt sẽ bị xóa và danh mục quay về giá trị ban đầu.'));
      openModal('Đặt lại dữ liệu demo', wrap, [
        { label: 'Hủy', onClick: closeModal },
        {
          label: 'Đặt lại', danger: true, onClick: () => {
            localStorage.removeItem(STORE);
            closeModal();
            showToast('Đã xóa cấu hình đã lưu. Tải lại trang để áp dụng.', 'ok');
          }
        }
      ]);
    });

    renderJobs();
    renderCrops();
    renderUsers();
    renderSavedAt();
  }

  /* ---------- Khởi động theo trang ---------- */
  const INIT = {
    alerts: initAlerts,
    households: initHouseholds,
    library: initLibrary,
    experts: initExperts,
    reports: initReports,
    settings: initSettings
  };

  if (INIT[page]) INIT[page]();
})();
