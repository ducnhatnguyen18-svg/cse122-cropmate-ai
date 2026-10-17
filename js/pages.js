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
     ========================================================= */
  const SEV_LABEL = { urgent: 'Khẩn cấp', high: 'Cao', mid: 'Trung bình', low: 'Theo dõi' };

  function initAlerts() {
    let alerts = [
      { id: 1, sev: 'urgent', icon: 'i-flask', iconKind: 'red', title: 'Nguy cơ đạo ôn lá cổ bông — lô B2', text: 'AI nhận diện vết bệnh điển hình trên 3/10 ảnh gửi ngày 12/10, ẩm độ duy trì 82% trong 4 ngày liên tục.', meta: [['i-pin', 'Lô B2 · 0.8 ha'], ['i-clock', 'Cách đây 3 giờ'], ['i-ai', 'Độ tin cậy 91%']] },
      { id: 2, sev: 'high', icon: 'i-rain', iconKind: 'amber', title: 'Rầy nâu mật độ cao ở giai đoạn đẻ nhánh', text: 'Mật độ trung bình 2.100 con/m², vượt ngưỡng 1.500. Khuyến nghị phun khi tuổi rầy còn non.', meta: [['i-pin', 'Lô A1 · 1.2 ha'], ['i-clock', 'Hôm nay 07:20'], ['i-ai', 'Độ tin cậy 87%']] },
      { id: 3, sev: 'high', icon: 'i-leaf', iconKind: 'amber', title: 'Đốm nâu Cercospora lan ở mép đông', text: 'Đã ghi nhận trong nhật ký ngày 18/05. Diện tích nghi nhiễm khoảng 0.3 ha, cần tách khu vực phun riêng.', meta: [['i-pin', 'Lô A1 · mép đông'], ['i-clock', 'Hôm qua 16:40'], ['i-ai', 'Độ tin cậy 84%']] },
      { id: 4, sev: 'mid', icon: 'i-drop', iconKind: 'blue', title: 'Thiếu nước ở đoạn kênh cuối', text: 'Mực nước đo được thấp hơn 2cm so với yêu cầu giai đoạn làm đòng. Đề nghị tăng ca tưới về đêm.', meta: [['i-pin', 'Lô C3 · 1.4 ha'], ['i-clock', 'Hôm qua 06:10'], ['i-ai', 'Độ tin cậy 78%']] },
      { id: 5, sev: 'mid', icon: 'i-wind', iconKind: 'blue', title: 'Gió mạnh dần về chiều, cân nhắc lịch phun thuốc', text: 'Dự báo gió cấp 4–5 sau 15h, phun thuốc dễ bay trôi sang ruộng kế bên.', meta: [['i-pin', 'Toàn trang trại'], ['i-clock', 'Hôm qua 15:05'], ['i-ai', 'Độ tin cậy 80%']] },
      { id: 6, sev: 'low', icon: 'i-sun', title: 'Nắng nóng cục bộ 35–36°C trong 2 ngày tới', text: 'Tăng tần suất tưới dưỡng, che phủ gốc bằng rơm rạ để giữ ẩm.', meta: [['i-pin', 'Toàn trang trại'], ['i-clock', '2 ngày trước'], ['i-ai', 'Độ tin cậy 72%']] }
    ];

    let history = [
      { date: '11/10', title: 'Sâu cuốn lá giai đoạn 3 tuổi — lô A1', by: 'Nguyễn Văn Nam', result: 'Đã phun, mật độ giảm 80%' },
      { date: '08/10', title: 'Ngập úng sau mưa lớn 90mm', by: 'Trần Thị Hoa', result: 'Đã tiêu nước, không thiệt hại' },
      { date: '04/10', title: 'Vàng lá sinh lý — lô C3', by: 'Nguyễn Văn Nam', result: 'Bón bổ sung kali, lá xanh trở lại' }
    ];

    const listEl = $('#alertList');
    const emptyEl = $('#alertEmpty');
    const summaryEl = $('#alertSummary');
    let filterSev = '';

    function render() {
      listEl.innerHTML = '';
      const shown = alerts.filter((a) => !filterSev || a.sev === filterSev);
      shown.forEach((a) => {
        const row = listRow(listEl, {
          icon: a.icon,
          iconKind: a.iconKind,
          title: a.title,
          chip: SEV_LABEL[a.sev],
          chipKind: a.sev,
          text: a.text,
          meta: a.meta,
          acts: [
            actBtn('Xem', 'edit', 'i-eye', () => {
              const wrap = h('div');
              wrap.appendChild(h('p', 'row__text', a.text));
              wrap.appendChild(detailList([['Mức độ', SEV_LABEL[a.sev]], ['Khu vực', a.meta[0][1]], ['Phát hiện', a.meta[1][1]], ['Nguồn', a.meta[2][1]]]));
              wrap.appendChild(h('div', 'note', 'Khuyến nghị: ghi lại biện pháp đã áp dụng vào Nhật ký canh đồng để AI học và dự báo chính xác hơn.'));
              openModal('Chi tiết cảnh báo', wrap, [{ label: 'Đóng', onClick: closeModal }]);
            }),
            actBtn('Ghi nhận', 'ok', 'i-check', () => {
              const idx = alerts.findIndex((x) => x.id === a.id);
              if (idx !== -1) alerts.splice(idx, 1);
              history.unshift({ date: 'Hôm nay', title: a.title, by: 'Nguyễn Văn Nam', result: 'Đã ghi nhận và xử lý' });
              renderHistory();
              render();
              showToast('Đã ghi nhận cảnh báo: ' + SEV_LABEL[a.sev].toLowerCase() + '.', 'ok');
            })
          ]
        });
        row.id = 'alert-' + a.id;
      });
      emptyEl.hidden = shown.length !== 0;
      const urgent = alerts.filter((a) => a.sev === 'urgent' || a.sev === 'high').length;
      summaryEl.textContent = alerts.length + ' cảnh báo đang mở · ' + urgent + ' ở mức cao hoặc khẩn cấp';
    }

    function renderHistory() {
      const body = $('#historyBody');
      body.innerHTML = '';
      history.forEach((r) => tableRow(body, [r.date, r.title, r.by, { node: chip('Đã xử lý', 'done') }]));
    }

    qa('#alertFilters .pill').forEach((p) => {
      p.addEventListener('click', () => {
        qa('#alertFilters .pill').forEach((x) => x.classList.remove('is-on'));
        p.classList.add('is-on');
        filterSev = p.dataset.sev;
        render();
      });
    });

    $('#btnAckAll').addEventListener('click', () => {
      if (!alerts.length) { showToast('Hiện không còn cảnh báo nào để ghi nhận.'); return; }
      const n = alerts.length;
      alerts.forEach((a) => history.unshift({ date: 'Hôm nay', title: a.title, by: 'Nguyễn Văn Nam', result: 'Ghi nhận hàng loạt' }));
      alerts = [];
      renderHistory();
      render();
      showToast('Đã ghi nhận ' + n + ' cảnh báo.', 'ok');
    });

    const risks = [
      ['Đạo ôn lá — lô B2', 86, 'red'],
      ['Đốm nâu Cercospora — lô A1', 64, 'amber'],
      ['Rầy nâu tuổi 1–2', 58, 'amber'],
      ['Khô vằn giai đoạn làm đòng', 32, 'green'],
      ['Ngập úng sau mưa lớn', 18, 'green']
    ];
    risks.forEach((r) => meter($('#riskMeters'), r[0], r[1] + '%', r[1], r[2] === 'green' ? '' : r[2]));

    const forecast = [
      { l: 'T2', v: 2 }, { l: 'T3', v: 0 }, { l: 'T4', v: 6 },
      { l: 'T5', v: 24 }, { l: 'T6', v: 41 }, { l: 'T7', v: 12 }, { l: 'CN', v: 3 }
    ];
    barChart($('#forecastBars'), forecast.map((d) => ({ l: d.l, v: d.v, unit: ' mm', kind: d.v > 20 ? 'blue' : '' })));
    const peak = forecast.reduce((a, b) => (b.v > a.v ? b : a));
    $('#forecastNote').textContent = 'Ngày ' + peak.l + ' có mưa lớn ' + peak.v + ' mm — nên hoãn phun thuốc và kiểm tra bờ bao, rãnh thoát nước trước 1 ngày.';

    const range = $('#subThreshold');
    range.addEventListener('input', () => { $('#subThresholdOut').textContent = range.value + '%'; });

    $('#subForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const picked = ['#subSick', '#subWeather', '#subWater', '#subPrice'].filter((s) => $(s).checked);
      if (!picked.length) { showToast('Chọn ít nhất một loại cảnh báo.', 'bad'); return; }
      showToast('Đã lưu: ' + picked.length + ' loại cảnh báo cho ' + $('#subRegion').value + '.', 'ok');
    });

    render();
    renderHistory();
  }

  /* =========================================================
     2. NÔNG HỘ & HTX
     ========================================================= */
  function initHouseholds() {
    let households = [
      { id: 1, name: 'Trần Văn Bình', crop: 'Lúa', area: '1.2 ha', loc: 'Xã Bình Thạnh, Chợ Mới', phone: '0913 456 781', status: 'Đã xác thực', rating: 4.9, note: 'Đang canh tác vụ Mùa, có 3 lô theo dõi.' },
      { id: 2, name: 'Nguyễn Thị Kim Ngân', crop: 'Xoài', area: '0.6 ha', loc: 'Xã Hòa An, Chợ Mới', phone: '0907 221 145', status: 'Đã xác thực', rating: 4.7, note: 'Xoài cát Chu, đang xử lý ra hoa.' },
      { id: 3, name: 'Lê Văn Tuấn', crop: 'Lúa', area: '2.4 ha', loc: 'Xã Mỹ An, Tháp Mười', phone: '0978 330 209', status: 'Chờ xác thực', rating: 0, note: 'Hồ sơ gửi ngày 10/10, chờ duyệt giấy tờ.' },
      { id: 4, name: 'Phạm Hoàng Long', crop: 'Sầu riêng', area: '1.1 ha', loc: 'Xã Xuân Đông, Long Khánh', phone: '0905 771 226', status: 'Đã xác thực', rating: 4.6, note: 'Sầu riêng Ri6 năm thứ 4, cần tư vấn bón phân.' },
      { id: 5, name: 'Võ Thị Đẹp', crop: 'Rau màu', area: '0.35 ha', loc: 'Xã Nhơn Mỹ, Chợ Mới', phone: '0918 004 776', status: 'Tạm ngưng', rating: 4.1, note: 'Ngưng canh tác 1 vụ do ngập úng.' },
      { id: 6, name: 'Huỳnh Văn Sơn', crop: 'Lúa', area: '3.0 ha', loc: 'Xã Vĩnh Bình, Hòn Đất', phone: '0946 812 330', status: 'Đã xác thực', rating: 4.8, note: 'Thành viên HTX Nông Phát, liên kết bao tiêu.' }
    ];

    const coops = [
      { name: 'HTX Nông Phát', members: 42, area: '68 ha', crop: 'Lúa chất lượng cao', rating: 4.9 },
      { name: 'HTX Xanh Đồng Tháp', members: 27, area: '35 ha', crop: 'Xoài + lúa', rating: 4.7 },
      { name: 'Tổ hợp tác Mỹ Hòa', members: 15, area: '12 ha', crop: 'Rau màu', rating: 4.4 },
      { name: 'HTX Sầu riêng Long Khánh', members: 21, area: '24 ha', crop: 'Sầu riêng', rating: 4.8 }
    ];

    let pending = [
      { id: 1, name: 'Lê Văn Tuấn', type: 'Đăng ký nông hộ mới', detail: '2.4 ha lúa tại Tháp Mười — đã tải giấy sử dụng đất.' },
      { id: 2, name: 'Nguyễn Thành Duy', type: 'Đề nghị hỗ trợ kỹ thuật', detail: 'Xin tư vấn bệnh cháy bìa lá trên 1.8 ha.' },
      { id: 3, name: 'HTX Green Rice', type: 'Kết nối HTX', detail: 'Đề nghị tích hợp 38 hộ thành viên lên nền tảng.' },
      { id: 4, name: 'Trần Văn Bình', type: 'Gia hạn hồ sơ', detail: 'Cần cập nhật diện tích tăng thêm 0.4 ha.' }
    ];

    const listEl = $('#hhList');
    const emptyEl = $('#hhEmpty');

    function render() {
      const q = $('#hhSearch').value.trim().toLowerCase();
      const crop = $('#hhCrop').value;
      const st = $('#hhStatus').value;
      listEl.innerHTML = '';
      const shown = households.filter((x) => {
        if (crop && x.crop !== crop) return false;
        if (st && x.status !== st) return false;
        if (q && (x.name + ' ' + x.loc + ' ' + x.phone + ' ' + x.crop).toLowerCase().indexOf(q) === -1) return false;
        return true;
      });

      shown.forEach((x) => {
        const statusKind = x.status === 'Đã xác thực' ? 'done' : x.status === 'Chờ xác thực' ? 'wait' : 'off';
        const side = [];
        if (x.rating) {
          const r = h('span', 'rating');
          r.innerHTML = icon('i-star');
          r.appendChild(document.createTextNode(' ' + x.rating.toFixed(1)));
          side.push(r);
        }
        listRow(listEl, {
          icon: 'i-user',
          title: x.name,
          chip: x.status,
          chipKind: statusKind,
          text: x.note,
          meta: [['i-sprout', x.crop + ' · ' + x.area], ['i-pin', x.loc], ['i-chat', x.phone]],
          side: side,
          acts: [
            actBtn('Hồ sơ', 'edit', 'i-eye', () => {
              const wrap = h('div');
              wrap.appendChild(h('p', 'row__text', x.note));
              wrap.appendChild(detailList([['Cây trồng', x.crop], ['Diện tích', x.area], ['Địa chỉ', x.loc], ['Điện thoại', x.phone], ['Trạng thái', x.status], ['Đánh giá', x.rating ? x.rating.toFixed(1) + '/5' : 'Chưa có']]));
              openModal('Hồ sơ nông hộ — ' + x.name, wrap, [
                { label: 'Đóng', onClick: closeModal },
                { label: 'Gửi tư vấn', primary: true, onClick: () => { closeModal(); location.href = 'index.html'; } }
              ]);
            }),
            (() => {
              const a = h('a', 'btn-sm btn-sm--ok');
              a.href = 'index.html';
              a.innerHTML = icon('i-send');
              a.appendChild(document.createTextNode('Tư vấn'));
              return a;
            })()
          ]
        });
      });

      emptyEl.hidden = shown.length !== 0;
      $('#hhSummary').textContent = shown.length + ' / ' + households.length + ' nông hộ đang hiển thị';
    }

    function renderPending() {
      const host = $('#pendingList');
      host.innerHTML = '';
      pending.forEach((p) => {
        const row = listRow(host, {
          icon: 'i-clock',
          iconKind: 'amber',
          title: p.name,
          chip: p.type,
          chipKind: 'mid',
          text: p.detail,
          acts: [
            actBtn('Duyệt', 'ok', 'i-check', () => {
              pending = pending.filter((x) => x.id !== p.id);
              renderPending();
              showToast('Đã duyệt yêu cầu của ' + p.name + '.', 'ok');
            }),
            actBtn('Từ chối', 'del', 'i-close', () => {
              pending = pending.filter((x) => x.id !== p.id);
              renderPending();
              showToast('Đã từ chối yêu cầu của ' + p.name + '.');
            })
          ]
        });
        row.id = 'pending-' + p.id;
      });
      $('#pendingEmpty').hidden = pending.length !== 0;
    }

    function renderCoops() {
      const host = $('#coopList');
      coops.forEach((c) => {
        const r = h('span', 'rating');
        r.innerHTML = icon('i-star');
        r.appendChild(document.createTextNode(' ' + c.rating.toFixed(1)));
        listRow(host, {
          icon: 'i-shield',
          iconKind: 'blue',
          title: c.name,
          text: c.crop,
          meta: [['i-users', c.members + ' thành viên'], ['i-sprout', c.area]],
          side: [r]
        });
      });
    }

    function renderSupport() {
      const body = $('#supportBody');
      [
        ['Trần Văn Bình', 'Đạo ôn lá', '4.9'],
        ['Phạm Hoàng Long', 'Bón phân cho sầu riêng', '4.7'],
        ['Nguyễn Thị Kim Ngân', 'Xử lý ra hoa xoài', '4.8'],
        ['Huỳnh Văn Sơn', 'Liên kết bao tiêu', '4.6'],
        ['Võ Thị Đẹp', 'Cải tạo đất sau ngập', '4.3']
      ].forEach((row) => tableRow(body, [row[0], row[1], { text: row[2], cls: 'num' }]));
    }

    $('#hhSearch').addEventListener('input', render);
    $('#hhCrop').addEventListener('change', render);
    $('#hhStatus').addEventListener('change', render);

    $('#btnAddHousehold').addEventListener('click', () => {
      const form = h('div');
      form.innerHTML =
        '<div class="field"><label for="nhName">Họ và tên nông hộ</label><input id="nhName" type="text" placeholder="Ví dụ: Nguyễn Văn A"></div>' +
        '<div class="form__row"><div class="field"><label for="nhCrop">Cây trồng chính</label><select id="nhCrop"><option>Lúa</option><option>Xoài</option><option>Sầu riêng</option><option>Rau màu</option></select></div>' +
        '<div class="field"><label for="nhArea">Diện tích (ha)</label><input id="nhArea" type="number" min="0.1" step="0.1" value="1.0"></div></div>' +
        '<div class="field"><label for="nhLoc">Địa chỉ</label><input id="nhLoc" type="text" placeholder="Xã, huyện, tỉnh"></div>' +
        '<div class="field"><label for="nhPhone">Số điện thoại</label><input id="nhPhone" type="tel" placeholder="09xx xxx xxx"></div>';

      function submit() {
        const name = form.querySelector('#nhName').value.trim();
        const phone = form.querySelector('#nhPhone').value.trim();
        const loc = form.querySelector('#nhLoc').value.trim();
        if (name.length < 3) { showToast('Hãy nhập họ tên nông hộ.', 'bad'); return; }
        if (phone.replace(/\D/g, '').length < 9) { showToast('Số điện thoại chưa hợp lệ.', 'bad'); return; }
        households.unshift({
          id: Date.now(),
          name: name,
          crop: form.querySelector('#nhCrop').value,
          area: Number(form.querySelector('#nhArea').value || 0).toFixed(1) + ' ha',
          loc: loc || 'Chưa cập nhật',
          phone: phone,
          status: 'Chờ xác thực',
          rating: 0,
          note: 'Vừa được chuyên gia thêm vào danh bạ.'
        });
        render();
        closeModal();
        showToast('Đã thêm nông hộ ' + name + '.', 'ok');
      }

      openModal('Thêm nông hộ mới', form, [
        { label: 'Hủy', onClick: closeModal },
        { label: 'Lưu hồ sơ', primary: true, onClick: submit }
      ]);
    });

    render();
    renderPending();
    renderCoops();
    renderSupport();
  }

  /* =========================================================
     3. THƯ VIỆN TÀI NGUYÊN
     ========================================================= */
  function initLibrary() {
    const CAT_ICON = { 'Quy trình': 'i-file', 'Sổ tay': 'i-book', 'Tài liệu AI': 'i-ai', 'Video': 'i-play', 'Biểu mẫu': 'i-check' };
    const CAT_KIND = { 'Quy trình': '', 'Sổ tay': '', 'Tài liệu AI': 'blue', 'Video': 'amber', 'Biểu mẫu': '' };

    let docs = [
      { id: 1, title: 'Quy trình quản lý tổng hợp bệnh đạo ôn (IPM)', cat: 'Quy trình', crop: 'Lúa', desc: '6 bước giám sát, ngưỡng phun và lịch bón phân phòng bệnh.', downloads: 842, updated: '12/10', size: '2.4 MB' },
      { id: 2, title: 'Sổ tay canh tác lúa chất lượng cao, phát thải thấp', cat: 'Sổ tay', crop: 'Lúa', desc: 'Tài liệu chuẩn cho đề án 1 triệu ha lúa chất lượng cao.', downloads: 1290, updated: '09/10', size: '6.1 MB' },
      { id: 3, title: 'Hướng dẫn chụp ảnh lá để AI chẩn đoán chính xác', cat: 'Tài liệu AI', crop: 'Lúa', desc: 'Khoảng cách, ánh sáng, góc chụp và cách lấy mẫu 10 lá.', downloads: 615, updated: '11/10', size: '1.2 MB' },
      { id: 4, title: 'Video: Sục bùn và bón phân đón đòng đúng cách', cat: 'Video', crop: 'Lúa', desc: 'Thời lượng 12 phút, quay tại mô hình Chợ Mới.', downloads: 431, updated: '05/10', size: '148 MB' },
      { id: 5, title: 'Nhật ký canh đồng mẫu (bản in và bản số)', cat: 'Biểu mẫu', crop: 'Mọi cây', desc: 'Biểu mẫu ghi chép hoạt động cho nông hộ không dùng điện thoại.', downloads: 356, updated: '01/10', size: '320 KB' },
      { id: 6, title: 'Quy trình xử lý ra hoa xoài cát Chu', cat: 'Quy trình', crop: 'Xoài', desc: 'Lịch xiết nước, dosis phân bón và xử lý chất điều hòa sinh trưởng.', downloads: 288, updated: '28/09', size: '1.8 MB' },
      { id: 7, title: 'Bảng tra liều thuốc bảo vệ thực vật theo ngưỡng', cat: 'Sổ tay', crop: 'Lúa', desc: 'Danh mục thuốc được phép sử dụng, liều lượng và thời gian cách ly.', downloads: 702, updated: '15/09', size: '980 KB' },
      { id: 8, title: 'Tài liệu AI dự báo năng suất theo thời tiết', cat: 'Tài liệu AI', crop: 'Lúa', desc: 'Cách mô hình đọc dữ liệu nhật ký và cho ra khuyến nghị.', downloads: 197, updated: '20/09', size: '2.1 MB' },
      { id: 9, title: 'Video: Tiêu nước và phơi ải sau thu hoạch', cat: 'Video', crop: 'Lúa', desc: 'Giảm nguồn bệnh vụ sau, 9 phút.', downloads: 264, updated: '12/09', size: '112 MB' }
    ];

    let mine = [
      { title: 'Khuyến cáo bón phân cho sầu riêng giai đoạn kiến thiết', cat: 'Quy trình', status: 'Đã đăng' },
      { title: 'Bộ ảnh mẫu lá lúa bị đốm nâu để huấn luyện AI', cat: 'Tài liệu AI', status: 'Đang kiểm duyệt' },
      { title: 'Biểu mẫu thống kê chi phí sản xuất vụ Mùa', cat: 'Biểu mẫu', status: 'Trả về bổ sung' }
    ];

    let cat = '';
    const grid = $('#libGrid');
    const STATUS_KIND = { 'Đã đăng': 'done', 'Đang kiểm duyệt': 'wait', 'Trả về bổ sung': 'urgent' };

    function render() {
      const q = $('#libSearch').value.trim().toLowerCase();
      const sort = $('#libSort').value;
      let shown = docs.filter((d) => {
        if (cat && d.cat !== cat) return false;
        if (q && (d.title + ' ' + d.desc + ' ' + d.crop).toLowerCase().indexOf(q) === -1) return false;
        return true;
      });
      if (sort === 'hot') shown = shown.slice().sort((a, b) => b.downloads - a.downloads);
      if (sort === 'az') shown = shown.slice().sort((a, b) => a.title.localeCompare(b.title, 'vi'));
      if (sort === 'new') shown = shown.slice().sort((a, b) => b.id - a.id);

      grid.innerHTML = '';
      shown.forEach((d) => {
        const card = h('article', 'res');
        const top = h('div', 'res__top');
        const ic = h('span', 'res__icon' + (CAT_KIND[d.cat] ? ' res__icon--' + CAT_KIND[d.cat] : ''));
        ic.innerHTML = icon(CAT_ICON[d.cat] || 'i-file');
        top.append(ic, chip(d.cat, d.cat === 'Video' ? 'mid' : 'low'));
        card.appendChild(top);
        card.appendChild(h('p', 'res__title', d.title));
        card.appendChild(h('p', 'res__desc', d.desc));

        const meta = h('div', 'res__meta');
        [['i-download', d.downloads + ' lượt tải'], ['i-calendar', d.updated], ['i-sprout', d.crop]].forEach((p) => {
          const s = h('span');
          s.innerHTML = icon(p[0]);
          s.appendChild(document.createTextNode(' ' + p[1]));
          meta.appendChild(s);
        });
        card.appendChild(meta);

        const acts = h('div', 'res__acts');
        acts.append(
          actBtn('Tải xuống', 'ok', 'i-download', () => {
            d.downloads += 1;
            render();
            showToast('Đang tải: ' + d.title.slice(0, 34) + '…', 'ok');
          }),
          actBtn('Xem trước', 'edit', 'i-eye', () => {
            const wrap = h('div');
            wrap.appendChild(h('p', 'row__text', d.desc));
            wrap.appendChild(detailList([['Chuyên mục', d.cat], ['Cây trồng', d.crop], ['Dung lượng', d.size], ['Cập nhật', d.updated], ['Lượt tải', String(d.downloads)]]));
            openModal('Xem trước tài nguyên', wrap, [{ label: 'Đóng', onClick: closeModal }]);
          })
        );
        card.appendChild(acts);
        grid.appendChild(card);
      });

      $('#libEmpty').hidden = shown.length !== 0;
      $('#libSummary').textContent = shown.length + ' tài nguyên · ' + docs.reduce((s, d) => s + d.downloads, 0).toLocaleString('vi-VN') + ' lượt tải';
    }

    function renderMine() {
      const host = $('#myDocs');
      host.innerHTML = '';
      mine.forEach((m) => {
        listRow(host, {
          icon: 'i-file',
          title: m.title,
          chip: m.status,
          chipKind: STATUS_KIND[m.status] || 'wait',
          meta: [['i-book', m.cat]]
        });
      });
    }

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
      $('#upTitle').scrollIntoView({ behavior: 'smooth', block: 'center' });
      $('#upTitle').focus();
      showToast('Điền thông tin ở khung “Đóng góp tài liệu”.');
    });

    /* tải tệp lên */
    const drop = $('#libDrop');
    const fileInput = $('#libFile');
    const nameEl = $('#libFileName');
    const errEl = $('#libFileError');
    let picked = [];

    function setErr(msg) { errEl.textContent = msg; errEl.hidden = !msg; }

    function accept(files) {
      setErr('');
      const okExt = ['.pdf', '.docx', '.pptx', '.mp4', '.png', '.jpg', '.jpeg'];
      Array.from(files || []).forEach((f) => {
        const hit = okExt.some((e) => f.name.toLowerCase().endsWith(e));
        if (!hit) { setErr('Tệp "' + f.name + '" không được hỗ trợ.'); return; }
        if (f.size > 25 * 1024 * 1024) { setErr('Tệp "' + f.name + '" vượt quá 25MB.'); return; }
        picked.push(f.name);
      });
      nameEl.hidden = picked.length === 0;
      nameEl.innerHTML = icon('i-check');
      nameEl.appendChild(document.createTextNode(' ' + picked.length + ' tệp đã chọn: ' + picked.join(', ')));
    }

    drop.addEventListener('click', () => fileInput.click());
    drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
    fileInput.addEventListener('change', () => { accept(fileInput.files); fileInput.value = ''; });
    ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
    ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('is-over'); }));
    drop.addEventListener('drop', (e) => accept(e.dataTransfer.files));

    $('#uploadForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const title = $('#upTitle').value.trim();
      if (title.length < 8) { showToast('Tên tài nguyên cần tối thiểu 8 ký tự.', 'bad'); return; }
      mine.unshift({ title: title, cat: $('#upCat').value, status: 'Đang kiểm duyệt' });
      docs.unshift({ id: Date.now(), title: title, cat: $('#upCat').value, crop: $('#upCrop').value, desc: 'Tài liệu do chuyên gia đóng góp, đang chờ ban quản trị kiểm duyệt.', downloads: 0, updated: 'Hôm nay', size: picked.length ? '—' : 'Chưa đính kèm' });
      renderMine();
      render();
      $('#upTitle').value = '';
      picked = [];
      nameEl.hidden = true;
      showToast('Đã gửi tài liệu chờ kiểm duyệt.', 'ok');
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
      ['Nhật ký canh đồng', 'nhật ký']
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
    renderMine();
  }

  /* =========================================================
     4. QUẢN LÝ CHUYÊN GIA
     ========================================================= */
  function initExperts() {
    let experts = [
      { id: 1, name: 'Nguyễn Văn Nam', field: 'Bảo vệ thực vật', exp: 12, rating: 4.9, cases: 214, duty: 'on', note: 'Chuyên đạo ôn, rầy nâu và khoanh vùng dịch trên ảnh vệ tinh.' },
      { id: 2, name: 'Trần Thị Hoa', field: 'Thổ nhưỡng & phân bón', exp: 9, rating: 4.8, cases: 176, duty: 'on', note: 'Phân tích đất, lập công thức bón phân theo giai đoạn sinh trưởng.' },
      { id: 3, name: 'Lê Minh Tuấn', field: 'Thủy nông', exp: 7, rating: 4.6, cases: 98, duty: 'off', note: 'Thiết kế lịch tưới, tiêu nước và chống hạn mặn đầu vụ.' },
      { id: 4, name: 'Phạm Thu Hà', field: 'Cây ăn trái', exp: 11, rating: 4.7, cases: 143, duty: 'on', note: 'Xoài, sầu riêng: xử lý ra hoa và nuôi trái.' },
      { id: 5, name: 'Võ Quốc Bảo', field: 'Bảo vệ thực vật', exp: 5, rating: 4.4, cases: 61, duty: 'off', note: 'Quản lý dịch hại tổng hợp, sử dụng thuốc an toàn.' },
      { id: 6, name: 'Đặng Ngọc Linh', field: 'Cây ăn trái', exp: 8, rating: 4.8, cases: 112, duty: 'on', note: 'Canh tác trái vụ, liên kết bao tiêu sản phẩm.' }
    ];

    let apps = [
      { id: 1, name: 'Bùi Thanh Phong', field: 'Bảo vệ thực vật', exp: 6, note: 'Tốt nghiệp ĐH Cần Thơ, 6 năm tại Chi cục BVTV Đồng Tháp.' },
      { id: 2, name: 'Hồ Gia Khánh', field: 'Thủy nông', exp: 4, note: 'Kinh nghiệm quy hoạch nội đồng vùng ngọt hóa.' },
      { id: 3, name: 'Ngô Thị Mai', field: 'Cây ăn trái', exp: 9, note: 'Chuyên canh sầu riêng Ri6, mô hình 3 ha tại Long Khánh.' },
      { id: 4, name: 'Tạ Duy Khang', field: 'Thổ nhưỡng & phân bón', exp: 3, note: 'Kỹ sư nông nghiệp, phụ trách thử nghiệm phân chậm tan.' },
      { id: 5, name: 'Lâm Bích Tuyền', field: 'Bảo vệ thực vật', exp: 7, note: 'Cộng tác viên dự án IPM lúa vùng Đồng Tháp Mười.' }
    ];

    const listEl = $('#exList');

    function ratingNode(v) {
      const r = h('span', 'rating');
      r.innerHTML = icon('i-star');
      r.appendChild(document.createTextNode(' ' + v.toFixed(1)));
      return r;
    }

    function render() {
      const q = $('#exSearch').value.trim().toLowerCase();
      const field = $('#exField').value;
      const duty = $('#exDuty').value;
      listEl.innerHTML = '';
      const shown = experts.filter((x) => {
        if (field && x.field !== field) return false;
        if (duty === 'on' && x.duty !== 'on') return false;
        if (duty === 'off' && x.duty !== 'off') return false;
        if (q && (x.name + ' ' + x.field + ' ' + x.note).toLowerCase().indexOf(q) === -1) return false;
        return true;
      });

      shown.forEach((x) => {
        const face = h('span', 'face' + (x.duty === 'on' ? '' : ' face--amber'));
        face.textContent = initials(x.name);
        listRow(listEl, {
          icon: null,
          iconNode: face,
          title: x.name,
          chip: x.duty === 'on' ? 'Đang trực' : 'Ngoài giờ',
          chipKind: x.duty === 'on' ? 'done' : 'off',
          text: x.note,
          meta: [['i-shield', x.field], ['i-clock', x.exp + ' năm kinh nghiệm'], ['i-chat', x.cases + ' ca tư vấn']],
          side: [ratingNode(x.rating)],
          acts: [
            actBtn('Hồ sơ', 'edit', 'i-eye', () => {
              const wrap = h('div');
              wrap.appendChild(h('p', 'row__text', x.note));
              wrap.appendChild(detailList([['Chuyên môn', x.field], ['Kinh nghiệm', x.exp + ' năm'], ['Ca trực', x.duty === 'on' ? 'Đang trực' : 'Ngoài giờ'], ['Ca đã tư vấn', String(x.cases)], ['Đánh giá', x.rating.toFixed(1) + '/5']]));
              openModal('Hồ sơ chuyên gia — ' + x.name, wrap, [{ label: 'Đóng', onClick: closeModal }]);
            }),
            actBtn('Đánh giá', 'ok', 'i-star', () => {
              const form = h('div');
              form.innerHTML =
                '<div class="field"><label for="rateScore">Số sao</label><select id="rateScore"><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select></div>' +
                '<div class="field"><label for="rateText">Nhận xét</label><textarea id="rateText" placeholder="Ví dụ: Phản hồi nhanh, hướng dẫn cụ thể liều phun."></textarea></div>';
              openModal('Đánh giá ' + x.name, form, [
                { label: 'Hủy', onClick: closeModal },
                {
                  label: 'Gửi đánh giá', primary: true, onClick: () => {
                    const score = Number(form.querySelector('#rateScore').value);
                    const text = form.querySelector('#rateText').value.trim();
                    if (text.length < 5) { showToast('Hãy viết nhận xét ngắn gọn.', 'bad'); return; }
                    x.rating = Math.round(((x.rating * 9 + score) / 10) * 10) / 10;
                    render();
                    closeModal();
                    showToast('Cảm ơn bạn đã đánh giá ' + x.name + '.', 'ok');
                  }
                }
              ]);
            })
          ]
        });
      });

      $('#exEmpty').hidden = shown.length !== 0;
      $('#exSummary').textContent = shown.length + ' chuyên gia · ' + experts.filter((x) => x.duty === 'on').length + ' người đang trực';
    }

    function renderApps() {
      const host = $('#exPending');
      host.innerHTML = '';
      apps.forEach((a) => {
        listRow(host, {
          icon: 'i-user',
          iconKind: 'blue',
          title: a.name,
          chip: a.field,
          chipKind: 'mid',
          text: a.note,
          meta: [['i-clock', a.exp + ' năm kinh nghiệm']],
          acts: [
            actBtn('Duyệt', 'ok', 'i-check', () => {
              experts.unshift({ id: Date.now(), name: a.name, field: a.field, exp: a.exp, rating: 4.5, cases: 0, duty: 'off', note: 'Chuyên gia mới được duyệt — đang trong thời gian thử việc.' });
              apps = apps.filter((x) => x.id !== a.id);
              renderApps();
              render();
              showToast('Đã duyệt hồ sơ ' + a.name + '.', 'ok');
            }),
            actBtn('Từ chối', 'del', 'i-close', () => {
              apps = apps.filter((x) => x.id !== a.id);
              renderApps();
              showToast('Đã từ chối hồ sơ ' + a.name + '.');
            })
          ]
        });
      });
      $('#exPendingEmpty').hidden = apps.length !== 0;
    }

    $('#btnApproveAll').addEventListener('click', () => {
      if (!apps.length) { showToast('Không còn đơn nào để duyệt.'); return; }
      const n = apps.length;
      apps.forEach((a) => experts.unshift({ id: Date.now() + a.id, name: a.name, field: a.field, exp: a.exp, rating: 4.5, cases: 0, duty: 'off', note: 'Chuyên gia mới được duyệt hàng loạt.' }));
      apps = [];
      renderApps();
      render();
      showToast('Đã duyệt ' + n + ' hồ sơ chuyên gia.', 'ok');
    });

    $('#btnAddExpert').addEventListener('click', () => {
      const form = h('div');
      form.innerHTML =
        '<div class="field"><label for="exName">Họ và tên</label><input id="exName" type="text"></div>' +
        '<div class="form__row"><div class="field"><label for="exFieldInput">Chuyên môn</label><select id="exFieldInput"><option>Bảo vệ thực vật</option><option>Thổ nhưỡng &amp; phân bón</option><option>Thủy nông</option><option>Cây ăn trái</option></select></div>' +
        '<div class="field"><label for="exExp">Năm kinh nghiệm</label><input id="exExp" type="number" min="1" max="40" value="5"></div></div>' +
        '<div class="field"><label for="exNote">Mô tả ngắn</label><textarea id="exNote" placeholder="Lĩnh vực chuyên sâu, mô hình đã triển khai…"></textarea></div>';
      openModal('Thêm chuyên gia vào mạng lưới', form, [
        { label: 'Hủy', onClick: closeModal },
        {
          label: 'Lưu hồ sơ', primary: true, onClick: () => {
            const name = form.querySelector('#exName').value.trim();
            const note = form.querySelector('#exNote').value.trim();
            if (name.length < 3) { showToast('Hãy nhập họ tên chuyên gia.', 'bad'); return; }
            experts.unshift({
              id: Date.now(), name: name,
              field: form.querySelector('#exFieldInput').value.replace('&amp;', '&'),
              exp: Number(form.querySelector('#exExp').value) || 1,
              rating: 4.5, cases: 0, duty: 'off',
              note: note || 'Chuyên gia mới được thêm vào hệ thống.'
            });
            render();
            closeModal();
            showToast('Đã thêm chuyên gia ' + name + '.', 'ok');
          }
        }
      ]);
    });

    $('#exSearch').addEventListener('input', render);
    $('#exField').addEventListener('change', render);
    $('#exDuty').addEventListener('change', render);

    [
      ['Phản hồi trong 24 giờ', 92, ''],
      ['Nông hộ hài lòng', 88, ''],
      ['Đúng chuyên môn được giao', 81, 'amber'],
      ['Chất lượng ảnh hiện trường nhận được', 67, 'amber']
    ].forEach((r) => meter($('#exMeters'), r[0], r[1] + '%', r[1], r[2]));

    [
      ['Bệnh đạo ôn', 46, ''],
      ['Dinh dưỡng & phân bón', 33, ''],
      ['Sâu hại khác', 24, 'amber'],
      ['Thủy nông & thời tiết', 17, 'blue'],
      ['Thị trường & giá', 9, 'green']
    ].forEach((r) => meter($('#criteriaMeters'), r[0], r[1] + ' ca', Math.min(100, r[1] * 2), r[2] === 'green' ? '' : r[2]));

    const dutyBody = $('#dutyBody');
    [
      ['Thứ 2', 'Nguyễn Văn Nam', 'Trần Thị Hoa', 'Phạm Thu Hà'],
      ['Thứ 3', 'Lê Minh Tuấn', 'Nguyễn Văn Nam', 'Trần Thị Hoa'],
      ['Thứ 4', 'Phạm Thu Hà', 'Võ Quốc Bảo', 'Lê Minh Tuấn'],
      ['Thứ 5', 'Trần Thị Hoa', 'Đặng Ngọc Linh', 'Nguyễn Văn Nam'],
      ['Thứ 6', 'Võ Quốc Bảo', 'Phạm Thu Hà', 'Đặng Ngọc Linh'],
      ['Thứ 7', 'Đặng Ngọc Linh', '—', 'Nguyễn Văn Nam'],
      ['CN', '—', '—', 'Trần Thị Hoa']
    ].forEach((r) => tableRow(dutyBody, r));

    render();
    renderApps();
  }

  /* =========================================================
     5. BÁO CÁO & THỐNG KÊ
     ========================================================= */
  function initReports() {
    const YIELD = {
      2026: [
        { l: 'T1', v: 128 }, { l: 'T2', v: 96 }, { l: 'T3', v: 210 }, { l: 'T4', v: 268 },
        { l: 'T5', v: 312 }, { l: 'T6', v: 244 }, { l: 'T7', v: 158 }, { l: 'T8', v: 132 },
        { l: 'T9', v: 96 }, { l: 'T10', v: 74 }, { l: 'T11', v: 0 }, { l: 'T12', v: 0 }
      ],
      2025: [
        { l: 'T1', v: 104 }, { l: 'T2', v: 88 }, { l: 'T3', v: 176 }, { l: 'T4', v: 232 },
        { l: 'T5', v: 286 }, { l: 'T6', v: 208 }, { l: 'T7', v: 142 }, { l: 'T8', v: 118 },
        { l: 'T9', v: 84 }, { l: 'T10', v: 62 }, { l: 'T11', v: 0 }, { l: 'T12', v: 0 }
      ]
    };

    function renderBars() {
      const year = $('#chartYear').value;
      barChart($('#yieldBars'), YIELD[year].map((d) => ({ l: d.l, v: d.v, unit: ' tấn', kind: d.v < 100 ? 'blue' : '' })));
    }

    const jobs = [
      ['Bón phân', 34, '#2e7d4f'],
      ['Tưới nước', 24, '#58a86b'],
      ['Phun thuốc', 18, '#3d7fb5'],
      ['Làm cỏ', 16, '#e0b455'],
      ['Thu hoạch', 8, '#c98a24']
    ];
    const legend = $('#jobLegend');
    jobs.forEach((j) => {
      const li = h('li');
      const i = h('i');
      i.style.background = j[2];
      li.appendChild(i);
      li.appendChild(document.createTextNode(j[0]));
      li.appendChild(h('b', '', Math.round(486 * j[1] / 100) + ' lần · ' + j[1] + '%'));
      legend.appendChild(li);
    });

    const plots = [
      ['Lô A1 — 1.2 ha', 148, 4, '6.6', 'up'],
      ['Lô B2 — 0.8 ha', 96, 6, '5.9', 'down'],
      ['Lô C3 — 1.4 ha', 132, 2, '6.8', 'up'],
      ['Vườn xoài — 0.6 ha', 54, 3, '—', 'flat'],
      ['Ruộng rau — 0.35 ha', 41, 1, '—', 'up'],
      ['Lô liên kết HTX', 15, 0, '6.1', 'flat']
    ];

    function renderPlots() {
      const body = $('#plotBody');
      body.innerHTML = '';
      plots.forEach((p) => {
        const mark = h('span', 'sev sev--' + (p[4] === 'up' ? 'done' : p[4] === 'down' ? 'urgent' : 'off'), p[4] === 'up' ? 'Tốt lên' : p[4] === 'down' ? 'Cần theo dõi' : 'Ổn định');
        tableRow(body, [p[0], { text: String(p[1]), cls: 'num' }, { text: String(p[2]), cls: 'num' }, { text: p[3] + ' tấn/ha', cls: 'num' }, { node: mark }]);
      });
    }

    [
      ['Sâu bệnh hại lá', 46, ''],
      ['Dinh dưỡng & bón phân', 38, ''],
      ['Nước tưới & thủy lợi', 27, 'blue'],
      ['Giống và lịch thời vụ', 19, 'amber'],
      ['Thu hoạch & sau thu hoạch', 12, 'amber'],
      ['Thị trường, giá bán', 8, 'green']
    ].forEach((r) => meter($('#topicMeters'), r[0], r[1] + ' ca', Math.min(100, r[1] * 2), r[2] === 'green' ? '' : r[2]));

    const weekBody = $('#weekBody');
    [
      ['12/10', 'Phun thuốc phòng đạo ôn', 14],
      ['11/10', 'Bón phân đón đòng', 21],
      ['10/10', 'Kiểm tra sâu cuốn lá', 9],
      ['09/10', 'Tưới nước tạo ẩm', 17],
      ['08/10', 'Làm cỏ bờ kênh', 6],
      ['07/10', 'Ghi nhận ảnh hiện trường', 23],
      ['06/10', 'Thu hoạch thử nghiệm', 3]
    ].forEach((r) => tableRow(weekBody, [r[0], r[1], { text: String(r[2]), cls: 'num' }]));

    $('#chartYear').addEventListener('change', renderBars);

    $('#btnRecalc').addEventListener('click', () => {
      plots.forEach((p) => { p[1] += 1; });
      renderPlots();
      showToast('Đã tính lại số liệu từ nhật ký mới nhất.', 'ok');
    });

    $('#exportForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const fmt = $('#exFormat').value.split(' ')[0];
      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true;
      showToast('Đang tổng hợp báo cáo ' + $('#exPeriod').value.toLowerCase() + '…');
      setTimeout(() => {
        btn.disabled = false;
        showToast('Đã tạo báo cáo ' + fmt + ' kèm ' + ($('#exCharts').checked ? 'biểu đồ' : 'bảng số liệu') + '.', 'ok');
      }, 1200);
    });

    renderBars();
    renderPlots();
  }

  /* =========================================================
     6. CÀI ĐẶT HỆ THỐNG
     ========================================================= */
  function initSettings() {
    const STORE = 'smartagri_settings';
    const state = {
      profile: {},
      jobs: ['Bón phân', 'Phun thuốc', 'Tưới nước', 'Làm cỏ', 'Thu hoạch', 'Kiểm tra sâu bệnh'],
      crops: ['Lúa', 'Xoài', 'Sầu riêng'],
      switches: {}
    };
    const ALL_CROPS = ['Lúa', 'Xoài', 'Sầu riêng', 'Rau màu', 'Điều', 'Cao su', 'Ngô'];

    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || '{}');
      Object.assign(state, saved);
    } catch (err) { /* bỏ qua dữ liệu hỏng */ }

    function persist() {
      localStorage.setItem(STORE, JSON.stringify(state));
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
      $('#aiModel').value = state.ai.model;
      aiRange.value = state.ai.threshold;
      $('#aiRetention').value = state.ai.retention;
    }
    $('#aiThresholdOut').textContent = aiRange.value + '%';
    aiRange.addEventListener('input', () => { $('#aiThresholdOut').textContent = aiRange.value + '%'; });
    $('#aiForm').addEventListener('submit', (e) => {
      e.preventDefault();
      if ($('#aiKey').value.trim().length < 8) { showToast('Khóa API không hợp lệ.', 'bad'); return; }
      state.ai = { model: $('#aiModel').value, threshold: aiRange.value, retention: $('#aiRetention').value };
      persist();
      showToast('Đã lưu cấu hình mô hình AI.', 'ok');
    });

    /* tài khoản */
    let users = [
      { name: 'Nguyễn Văn Nam', role: 'Chuyên gia', scope: '3 lô ruộng', active: true },
      { name: 'Trần Thị Hoa', role: 'Chuyên gia', scope: 'Toàn huyện', active: true },
      { name: 'Lê Minh Tuấn', role: 'Cán bộ xã', scope: 'Xã Bình Thạnh', active: true },
      { name: 'admin.smartagri', role: 'Quản trị', scope: 'Toàn hệ thống', active: true },
      { name: 'Võ Thị Đẹp', role: 'Nông hộ', scope: 'Tự quản lý', active: false }
    ];
    const userBody = $('#userBody');

    function renderUsers() {
      userBody.innerHTML = '';
      users.forEach((u, idx) => {
        const badge = h('span', 'sev sev--' + (u.role === 'Quản trị' ? 'urgent' : u.role === 'Chuyên gia' ? 'low' : 'mid'), u.role);
        const acts = h('div', 'row__acts');
        acts.append(
          actBtn(u.active ? 'Vô hiệu hóa' : 'Kích hoạt', u.active ? 'del' : 'ok', u.active ? 'i-close' : 'i-check', () => {
            users[idx].active = !users[idx].active;
            renderUsers();
            showToast('Tài khoản ' + u.name + ' đã ' + (users[idx].active ? 'kích hoạt.' : 'vô hiệu hóa.'));
          })
        );
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
