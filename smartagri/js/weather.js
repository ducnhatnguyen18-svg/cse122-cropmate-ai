/* =========================================================
   SmartAgri — Thời tiết
   1) Chọn khu vực (nhớ lựa chọn bằng localStorage)
   2) Nút "Làm mới số liệu" -> sinh bộ số liệu mới (mô phỏng)
   3) Suy ra chỉ số đồng ruộng + khuyến nghị bằng luật đơn giản
   4) Dải 24 giờ, biểu đồ cột 7 ngày (CSS thuần), bảng 7 ngày
   5) Danh sách cảnh báo
   ========================================================= */

const REGION_KEY = 'smartagri.weather.region.v1';

/* Level = mức cảnh báo; offset nhiệt độ theo giờ (0–23h) dùng để nội suy 24h */
const TEMP_OFFSET = [-3, -4, -5, -5, -4, -2, 0, 2, 3, 4, 5, 5, 5, 4, 3, 2, 1, 0, -1, -1, -2, -2, -3, -3];

const REGIONS = {
  'chau-thanh': {
    label: 'Châu Thành — Đồng Tháp',
    short: 'Châu Thành',
    seed: 20260516,
    now: { temp: 31, feels: 34, hum: 72, desc: 'Có mây, nắng gián đoạn', icon: '🌥️', rain: 2.5, wind: 8, dir: 'Tây Nam', uv: 7, press: 1008, evap: 4.6, sunrise: '05:42', sunset: '18:06' },
    range: { min: 25, max: 33, rainProb: 45 },
    soil: 68,
    alerts: [
      { sev: 'mid', icon: '🌧️', title: 'Mưa rào diện vài nơi trong 3 ngày tới', text: 'Tổng mưa dự kiến 40–70 mm, cần kiểm tra miệng cống thoát nước.', time: 'Hiệu lực đến 18/05/2026' },
      { sev: 'low', icon: '☀️', title: 'Nắng nóng cục bộ buổi trưa', text: 'Nhiệt độ cảm nhận có lúc đạt 36°C, nên tránh ra đồng từ 11h–14h.', time: 'Hằng ngày' }
    ]
  },
  'thap-muoi': {
    label: 'Tháp Mười — Đồng Tháp',
    short: 'Tháp Mười',
    seed: 19981205,
    now: { temp: 33, feels: 37, hum: 64, desc: 'Nắng nóng, ít mây', icon: '☀️', rain: 0, wind: 11, dir: 'Đông Nam', uv: 9, press: 1005, evap: 5.8, sunrise: '05:40', sunset: '18:08' },
    range: { min: 26, max: 36, rainProb: 15 },
    soil: 41,
    alerts: [
      { sev: 'high', icon: '🔥', title: 'Cảnh báo hạn và xâm nhập mặn', text: 'Nguồn nước kênh nội đồng hạ thấp, chủ động tích nước và tưới xen kẽ.', time: 'Cảnh báo cấp 2' }
    ]
  },
  'long-xuyen': {
    label: 'Long Xuyên — An Giang',
    short: 'Long Xuyên',
    seed: 19750430,
    now: { temp: 29, feels: 33, hum: 88, desc: 'Mưa vừa, có dông', icon: '🌧️', rain: 24.5, wind: 19, dir: 'Tây', uv: 3, press: 1002, evap: 2.9, sunrise: '05:44', sunset: '18:05' },
    range: { min: 24, max: 30, rainProb: 85 },
    soil: 92,
    alerts: [
      { sev: 'high', icon: '⛈️', title: 'Dông, lốc và gió giật mạnh', text: 'Khả năng dông chiều và tối, gió giật cấp 6–7. Không phun thuốc khi gió lớn.', time: 'Hiệu lực 24 giờ' },
      { sev: 'mid', icon: '🌊', title: 'Nguy cơ ngập ruộng trũng', text: 'Mưa lớn kết hợp triều cường, kiểm tra bơm cưỡng bức.', time: 'Đợt triều 17–19/05' }
    ]
  },
  'can-tho': {
    label: 'Ninh Kiều — Cần Thơ',
    short: 'Cần Thơ',
    seed: 19880912,
    now: { temp: 30, feels: 34, hum: 80, desc: 'Nhiều mây, có lúc mưa rào', icon: '🌦️', rain: 6.0, wind: 10, dir: 'Tây Nam', uv: 6, press: 1007, evap: 4.0, sunrise: '05:43', sunset: '18:07' },
    range: { min: 25, max: 32, rainProb: 55 },
    soil: 74,
    alerts: [
      { sev: 'mid', icon: '🦟', title: 'Độ ẩm cao, dễ phát sinh đạo ôn lá', text: 'Theo dõi vết bệnh trên lá từ 3 ngày nay, phun ngừa khi tỉ lệ lá bệnh > 5%.', time: 'Theo dõi liên tục' }
    ]
  }
};

const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

let regionId = readRegion();
let refreshCount = 0;
let toastTimer = null;
let NOW = null;

/* ---------- localStorage ---------- */
function readRegion() {
  const saved = localStorage.getItem(REGION_KEY);
  return REGIONS[saved] ? saved : 'chau-thanh';
}

function currentRegion() {
  return REGIONS[regionId];
}

/* ---------- Sinh số liệu ngẫu nhiên có chủ đích (đọc được, không cần backend) ---------- */
function makeRand(seed) {
  let state = seed;
  return function () {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

function iconFor(rainProb, hum) {
  if (rainProb >= 75) return '⛈️';
  if (rainProb >= 50) return '🌧️';
  if (rainProb >= 30) return '🌦️';
  return hum >= 75 ? '🌥️' : '☀️';
}

function descFor(rainProb, hum) {
  if (rainProb >= 75) return 'Mưa to, có dông';
  if (rainProb >= 50) return 'Mưa rào rải rác';
  if (rainProb >= 30) return 'Mây thay đổi, mưa vài nơi';
  return hum >= 75 ? 'Có mây, nắng gián đoạn' : 'Trời nắng, ít mây';
}

/* 7 ngày: ngày 1 là hôm nay */
function buildDays() {
  const region = currentRegion();
  const rand = makeRand(region.seed + refreshCount * 977);
  const days = [];
  const today = new Date();

  for (let i = 0; i < 7; i += 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const min = Math.round(region.range.min + rand() * 2 - 1);
    const max = min + Math.round(6 + rand() * 4);
    const rainProb = Math.max(0, Math.min(100, Math.round(region.range.rainProb + (rand() * 40 - 20))));
    const rainMm = rainProb < 30 ? Math.round(rand() * 20) / 10 : Math.round(rand() * 400) / 10;
    const hum = clamp(Math.round(NOW.hum + rand() * 20 - 10), 35, 99);

    days.push({
      key: i === 0 ? 'Hôm nay' : DAY_NAMES[date.getDay()],
      label: pad(date.getDate()) + '/' + pad(date.getMonth() + 1),
      min: min,
      max: max,
      rainProb: rainProb,
      rainMm: rainMm,
      hum: hum,
      wind: Math.max(0, Math.round(NOW.wind + rand() * 10 - 5)),
      icon: iconFor(rainProb, hum),
      desc: descFor(rainProb, hum)
    });
  }

  return days;
}

function pad(n) {
  return n < 10 ? '0' + n : String(n);
}

/* ---------- 1. Thẻ "Bây giờ" ---------- */
/* Số liệu "hiện tại" = giá trị gốc của khu vực + dao động nhỏ theo lần làm mới.
   Cùng một lần tải trang thì số liệu không đổi; bấm "Làm mới" sẽ có bộ số mới. */
function computeNow() {
  const region = currentRegion();
  const rand = makeRand(region.seed + refreshCount * 7919);

  function jitter(spread) {
    return Math.round(rand() * spread - spread / 2);
  }

  NOW = {
    temp: region.now.temp + jitter(2),
    feels: region.now.feels + jitter(2),
    hum: clamp(region.now.hum + jitter(8), 35, 99),
    desc: region.now.desc,
    icon: region.now.icon,
    rain: Math.max(0, Math.round((region.now.rain + jitter(10) / 10) * 10) / 10),
    wind: Math.max(0, region.now.wind + jitter(6)),
    dir: region.now.dir,
    uv: clamp(region.now.uv + jitter(2), 0, 12),
    press: region.now.press + jitter(6),
    evap: Math.max(0, Math.round((region.now.evap + jitter(10) / 10) * 10) / 10),
    sunrise: region.now.sunrise,
    sunset: region.now.sunset,
    soil: clamp(region.soil + jitter(6), 5, 99)
  };
}

function renderNow() {
  const region = currentRegion();

  $('nowRegion').textContent = region.short;
  $('nowIcon').textContent = NOW.icon;
  $('nowTemp').textContent = NOW.temp;
  $('nowDesc').textContent = NOW.desc;
  $('nowFeel').textContent = NOW.feels;
  $('nowHum').textContent = NOW.hum;

  $('mRain').textContent = NOW.rain + ' mm';
  $('mWind').textContent = NOW.wind + ' km/h';
  $('mDir').textContent = NOW.dir;
  $('mUv').textContent = NOW.uv;
  $('mPress').textContent = NOW.press + ' hPa';
  $('mEvap').textContent = NOW.evap + ' mm/ngày';
  $('mSunrise').textContent = NOW.sunrise;
  $('mSunset').textContent = NOW.sunset;

  const now = new Date();
  $('updatedAt').textContent = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds()) + ' · ' + region.label;
}

/* ---------- 2. Chỉ số đồng ruộng (tính từ độ ẩm, nhiệt, mưa, gió) ---------- */
function levelOf(score) {
  if (score >= 70) return { label: 'Cao', cls: 'badge-red', color: 'var(--red-600)' };
  if (score >= 40) return { label: 'Trung bình', cls: 'badge-amber', color: 'var(--amber)' };
  return { label: 'Thấp', cls: 'badge-green', color: 'var(--green-500)' };
}

function buildIndexes(days) {
  const rain3 = days.slice(0, 3).reduce(function (sum, day) {
    return sum + day.rainMm;
  }, 0);

  /* Điểm sương ước tính: T - (100 - ẩm)/5 */
  const dew = Math.round(NOW.temp - (100 - NOW.hum) / 5);

  /* Nguy cơ đạo ôn: ẩm cao + mát + mưa nhiều */
  let blast = (NOW.hum - 60) * 1.2;
  if (NOW.temp >= 20 && NOW.temp <= 28) blast += 25;
  if (rain3 > 15) blast += 20;
  blast = clamp(Math.round(blast), 0, 100);

  /* Nguy cơ đổ ngã: gió + mưa tích luỹ */
  let lodge = (NOW.wind - 8) * 3;
  if (rain3 > 25) lodge += 30;
  if (rain3 > 50) lodge += 20;
  lodge = clamp(Math.round(lodge), 0, 100);

  return [
    {
      name: 'Độ ẩm đất',
      value: NOW.soil + '%',
      score: NOW.soil,
      note: NOW.soil < 45 ? 'Đất đang khô — nên tưới bổ sung.' : NOW.soil > 85 ? 'Đất bão hoà nước — cần thoát nước.' : 'Độ ẩm đất phù hợp cho lúa đẻ nhánh.'
    },
    {
      name: 'Điểm sương',
      value: dew + '°C',
      score: clamp((dew - 18) * 8, 0, 100),
      note: dew >= 25 ? 'Điểm sương cao, lá giữ ẩm lâu → dễ lây bệnh.' : 'Điểm sương ở mức bình thường.'
    },
    {
      name: 'Nguy cơ đạo ôn lá',
      value: blast + '/100',
      score: blast,
      note: blast >= 70 ? 'Ngưỡng cao — nên phun ngừa khi thấy đốm bệnh.' : blast >= 40 ? 'Theo dõi đồng ruộng 2 ngày/lần.' : 'Chưa đáng lo, tiếp tục thăm đồng.'
    },
    {
      name: 'Nguy cơ đổ ngã',
      value: lodge + '/100',
      score: lodge,
      note: lodge >= 70 ? 'Gió mạnh + mưa to, chủ động chằng chống và thoát nước.' : 'Gió nhẹ, ít khả năng đổ ngã.'
    }
  ];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function renderIndexes(days) {
  const box = $('indexList');
  box.innerHTML = '';

  buildIndexes(days).forEach(function (item) {
    const level = levelOf(item.score);
    const li = document.createElement('li');
    li.className = 'index-item';

    const top = document.createElement('div');
    top.className = 'index-top';

    const name = document.createElement('p');
    name.className = 'index-name';
    name.textContent = item.name;

    const badge = document.createElement('span');
    badge.className = 'badge ' + level.cls;
    badge.textContent = level.label;

    top.append(name, badge);

    const value = document.createElement('p');
    value.className = 'index-value';
    value.textContent = item.value;

    const meter = document.createElement('div');
    meter.className = 'index-meter';
    const fill = document.createElement('span');
    fill.style.width = item.score + '%';
    fill.style.backgroundColor = level.color;
    meter.appendChild(fill);

    const note = document.createElement('p');
    note.className = 'index-note';
    note.textContent = item.note;

    li.append(top, value, meter, note);
    box.appendChild(li);
  });
}

/* ---------- 3. Dải 24 giờ ---------- */
function renderHourly(days) {
  const box = $('hourlyBox');
  box.innerHTML = '';

  const mid = (days[0].min + days[0].max) / 2;
  const startHour = new Date().getHours();

  for (let i = 0; i < 24; i += 1) {
    const hour = (startHour + i) % 24;
    const temp = Math.round(mid + TEMP_OFFSET[hour]);
    const rainProb = clamp(Math.round(days[0].rainProb + (hour >= 13 && hour <= 19 ? 15 : -12)), 0, 100);

    const li = document.createElement('li');
    li.className = 'hour' + (hour < 6 || hour >= 19 ? ' is-night' : '');

    const time = document.createElement('p');
    time.className = 'hour-time';
    time.textContent = (i === 0 ? 'Bây giờ' : pad(hour) + ':00');

    const icon = document.createElement('span');
    icon.className = 'hour-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = hour < 6 || hour >= 19 ? (rainProb > 50 ? '🌧️' : '🌙') : iconFor(rainProb, NOW.hum);

    const tempEl = document.createElement('p');
    tempEl.className = 'hour-temp';
    tempEl.textContent = temp + '°';

    const rain = document.createElement('p');
    rain.className = 'hour-rain';
    rain.textContent = '💧 ' + rainProb + '%';

    li.append(time, icon, tempEl, rain);
    box.appendChild(li);
  }
}

/* ---------- 4. Biểu đồ cột 7 ngày (CSS thuần) ---------- */
function renderChart(days) {
  const box = $('chartBox');
  box.innerHTML = '';

  const hi = Math.max.apply(null, days.map(function (day) { return day.max; })) + 1;
  const lo = Math.min.apply(null, days.map(function (day) { return day.min; })) - 1;
  const span = hi - lo;

  days.forEach(function (day) {
    const col = document.createElement('div');
    col.className = 'chart-col';

    const track = document.createElement('div');
    track.className = 'chart-track';
    track.title = day.label + ': ' + day.min + '–' + day.max + '°C';

    const bar = document.createElement('span');
    bar.className = 'chart-bar';
    bar.style.bottom = ((day.min - lo) / span) * 100 + '%';
    bar.style.height = ((day.max - day.min) / span) * 100 + '%';

    const maxLabel = document.createElement('span');
    maxLabel.className = 'chart-max';
    maxLabel.style.bottom = 'calc(' + ((day.max - lo) / span) * 100 + '% + 2px)';
    maxLabel.textContent = day.max + '°';

    const minLabel = document.createElement('span');
    minLabel.className = 'chart-min';
    minLabel.style.top = 'calc(' + ((day.min - lo) / span) * 100 + '% + 2px)';
    minLabel.textContent = day.min + '°';

    track.append(bar, maxLabel, minLabel);

    const name = document.createElement('span');
    name.className = 'chart-day';
    name.textContent = day.key;

    col.append(track, name);
    box.appendChild(col);
  });
}

/* ---------- 5. Bảng 7 ngày ---------- */
function sprayAdvice(day) {
  if (day.wind > 16 || day.rainProb >= 60) return { label: 'Không nên', cls: 'badge-red' };
  if (day.wind > 12 || day.rainProb >= 40) return { label: 'Cẩn trọng', cls: 'badge-amber' };
  return { label: 'Thuận lợi', cls: 'badge-green' };
}

function renderDaily(days) {
  const body = $('dailyBody');
  body.innerHTML = '';

  days.forEach(function (day) {
    const spray = sprayAdvice(day);
    const tr = document.createElement('tr');

    const tdDay = document.createElement('td');
    tdDay.innerHTML = '<strong></strong><br><small></small>';
    tdDay.querySelector('strong').textContent = day.key;
    tdDay.querySelector('small').textContent = day.label;

    const tdSky = document.createElement('td');
    tdSky.textContent = day.icon + ' ' + day.desc;

    const tdTemp = document.createElement('td');
    tdTemp.textContent = day.min + '° – ' + day.max + '°';

    const tdRain = document.createElement('td');
    tdRain.textContent = day.rainProb + '% · ' + day.rainMm + ' mm';

    const tdHum = document.createElement('td');
    tdHum.textContent = day.hum + '%';

    const tdWind = document.createElement('td');
    tdWind.textContent = day.wind + ' km/h';

    const tdSpray = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = 'badge ' + spray.cls;
    badge.textContent = spray.label;
    tdSpray.appendChild(badge);

    tr.append(tdDay, tdSky, tdTemp, tdRain, tdHum, tdWind, tdSpray);
    body.appendChild(tr);
  });
}

/* ---------- 6. Cảnh báo ---------- */
function renderAlerts() {
  const box = $('alertList');
  const alerts = currentRegion().alerts;
  box.innerHTML = '';

  alerts.forEach(function (alert) {
    const li = document.createElement('li');
    li.className = 'alert-item sev-' + alert.sev;

    const icon = document.createElement('span');
    icon.className = 'alert-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = alert.icon;

    const wrap = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = alert.title;

    const text = document.createElement('p');
    text.textContent = alert.text;

    const time = document.createElement('span');
    time.className = 'alert-time';
    time.textContent = '⏱ ' + alert.time;

    wrap.append(title, text, time);
    li.append(icon, wrap);
    box.appendChild(li);
  });

  $('alertEmpty').hidden = alerts.length > 0;
}

/* ---------- 7. Khuyến nghị theo luật ---------- */
function buildAdvice(days) {
  const region = currentRegion();
  const today = days[0];
  const rain3 = days.slice(0, 3).reduce(function (sum, day) {
    return sum + day.rainMm;
  }, 0);
  const list = [];

  if (NOW.wind > 15) {
    list.push({ text: 'Hoãn phun thuốc trừ sâu/cỏ trong hôm nay.', why: 'Gió ' + NOW.wind + ' km/h dễ làm thuốc bay trôi, giảm hiệu quả và gây ô nhiễm ruộng bên cạnh.' });
  } else if (today.rainProb < 55) {
    list.push({ text: 'Phun thuốc vào khung 9–11 giờ hoặc 16–17 giờ.', why: 'Trời khô, không mưa trong ' + (100 - today.rainProb) + '% dự báo → thuốc bám lá tốt hơn.' });
  }

  if (today.rainProb >= 60 || rain3 > 25) {
    list.push({ text: 'Không bón phân thúc đợt này, chờ ruộng thoát hết nước.', why: 'Mưa ' + rain3 + ' mm/3 ngày sẽ rửa trôi phân, lãng phí và gây ô nhiễm nguồn nước.' });
  }

  if (NOW.soil < 45) {
    list.push({ text: 'Tưới bổ sung 25–30 mm, tốt nhất trước 8 giờ sáng.', why: 'Độ ẩm đất ' + NOW.soil + '% dưới mức tối ưu cho giai đoạn đẻ nhánh.' });
  }

  if (NOW.soil > 85) {
    list.push({ text: 'Rút nước phơi ruộng 3–5 ngày.', why: 'Ruộng bão hoà nước dễ gây nghẹt rễ, vàng lá và bốc phèn.' });
  }

  const indexes = buildIndexes(days);
  const blast = indexes[2].score;
  if (blast >= 70) {
    list.push({ text: 'Chuẩn bị thuốc đặc trị đạo ôn và thăm đồng hằng ngày.', why: 'Chỉ số nguy cơ đạo ôn ' + blast + '/100 do ẩm cao và mát.' });
  } else if (blast >= 40) {
    list.push({ text: 'Thăm đồng 2 ngày/lần, chú ý đốm lá già dưới gốc.', why: 'Chỉ số nguy cơ đạo ôn ' + blast + '/100 — chưa tới ngưỡng phun nhưng cần theo sát.' });
  }

  if (today.max >= 35) {
    list.push({ text: 'Che vườn ươm và tưới mát buổi chiều cho cây con.', why: 'Nhiệt độ cao nhất ' + today.max + '°C, cây con dễ héo và chậm lớn.' });
  }

  if (NOW.uv >= 8) {
    list.push({ text: 'Hạn chế ra đồng buổi trưa, đội mũ và mặc áo dài tay.', why: 'Chỉ số UV ' + NOW.uv + ' — mức gây bỏng da nhanh.' });
  }

  const hasHigh = region.alerts.some(function (alert) {
    return alert.sev === 'high';
  });
  if (hasHigh) {
    list.push({ text: 'Kiểm tra cống, bờ bao và máy bơm dự phòng ngay hôm nay.', why: 'Đang có cảnh báo cấp cao cho khu vực ' + region.short + '.' });
  }

  if (list.length < 2) {
    list.push({ text: 'Thời tiết thuận lợi — tranh thủ làm cỏ và bón phân thúc.', why: 'Không có yếu tố rủi ro nào vượt ngưỡng trong 3 ngày tới.' });
  }

  return list.slice(0, 6);
}

function renderAdvice(days) {
  const box = $('adviceList');
  box.innerHTML = '';

  buildAdvice(days).forEach(function (item) {
    const li = document.createElement('li');
    li.textContent = item.text;

    const why = document.createElement('span');
    why.className = 'advice-why';
    why.textContent = 'Vì sao: ' + item.why;
    li.appendChild(why);

    box.appendChild(li);
  });
}

/* ---------- Nút bấm ---------- */
function $(id) {
  return document.getElementById(id);
}

$('regionSelect').addEventListener('change', function () {
  regionId = this.value;
  localStorage.setItem(REGION_KEY, regionId);
  renderAll();
  showToast('Đã chuyển sang khu vực ' + currentRegion().label + '.');
});

$('refreshBtn').addEventListener('click', function () {
  refreshCount += 1;
  renderAll();
  showToast('Đã cập nhật số liệu thời tiết mới nhất.');
});

/* ---------- Thông báo + sidebar ---------- */
const bellBtn = $('bellBtn');
const bellDropdown = $('bellDropdown');
const bellBadge = $('bellBadge');

bellBtn.addEventListener('click', function (event) {
  event.stopPropagation();
  const willOpen = bellDropdown.hidden;
  bellDropdown.hidden = !willOpen;
  bellBtn.setAttribute('aria-expanded', String(willOpen));
  if (willOpen) bellBadge.hidden = true;
});

document.addEventListener('click', function (event) {
  if (!event.target.closest('.bell-wrap')) bellDropdown.hidden = true;
});

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') bellDropdown.hidden = true;
});

$('menuToggle').addEventListener('click', function () {
  $('sidebar').classList.toggle('is-open');
});

function showToast(message, isError) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.toggle('is-error', Boolean(isError));
  toast.hidden = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.hidden = true;
  }, 2800);
}

/* ---------- Khởi động ---------- */
function renderAll() {
  computeNow();
  const days = buildDays();
  $('regionSelect').value = regionId;
  renderNow();
  renderIndexes(days);
  renderHourly(days);
  renderChart(days);
  renderDaily(days);
  renderAlerts();
  renderAdvice(days);
}

renderAll();
