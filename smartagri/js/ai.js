/* =========================================================
   SmartAgri — Trợ lý AI
   1) Chọn/ kéo thả ảnh -> xem trước
   2) "Chẩn đoán sơ bộ": khớp từ khoá trong tên ảnh, nếu không có
      thì dùng mã băm của tên+ dung lượng để chọn bệnh (kết quả ổn định)
   3) Hiển thị dấu hiệu / điều kiện / hướng xử lý + độ tin cậy
   4) Lịch sử chẩn đoán lưu localStorage (ảnh chỉ giữ trong phiên)
   5) Chat hỏi đáp: chuẩn hoá bỏ dấu, đếm từ khoá để chọn câu trả lời mẫu
   ========================================================= */

const HIST_KEY = 'smartagri.ai.history.v1';
const CHAT_KEY = 'smartagri.ai.chat.v1';

const DISEASES = [
  {
    name: 'Đạo ôn lá (cháy lá)',
    pathogen: 'Nấm Magnaporthe oryzae',
    level: 'Nặng',
    cls: 'badge-red',
    signs: [
      'Đốm bệnh hình thoi, hai đầu nhọn, tâm màu xám trắng.',
      'Viền đốm màu nâu, liên kết với nhau làm lá cháy khô.',
      'Vết bệnh thường xuất hiện trên lá già và lá giữa trước.'
    ],
    condition: 'Phát sinh mạnh khi độ ẩm trên 85%, nhiệt độ 20–28°C, bón nhiều phân đạm và ruộng ít nắng.',
    steps: [
      'Ngừng bón phân đạm, giữ nước ruộng 3–5 cm.',
      'Thăm đồng, cắt bỏ tỉa lá bệnh nặng và vệ sinh dụng cụ.',
      'Phun thuốc đặc trị (hoạt chất Tricyclazole hoặc Isoprothiolane) theo liều ghi trên bao bì.',
      'Sau 5–7 ngày kiểm tra lại, phun nhắc nếu vết bệnh còn lan.',
      'Ghi lại nhật ký và chụp ảnh theo dõi diễn biến.'
    ]
  },
  {
    name: 'Khô vằn (lem lép hạt)',
    pathogen: 'Nấm Rhizoctonia solani',
    level: 'Trung bình',
    cls: 'badge-amber',
    signs: [
      'Vệt bệnh màu xanh xám như bị nước sôi rưới lên.',
      'Sau đó chuyển nâu nhạt, có ranh giới rõ với phần lá xanh.',
      'Thường thấy ở bẹ và phiến lá sát mặt nước.'
    ],
    condition: 'Ruộng mật độ cao, che rợp, ẩm ướt kéo dài, bón thừa đạm và không rút nước.',
    steps: [
      'Rút nước phơi ruộng 3–5 ngày để giảm ẩm tầng thấp.',
      'Hạ mật độ sạ, tỉa bỏ cỏ bờ để ruộng thoáng.',
      'Phun thuốc chứa Hexaconazole hoặc Validacin ở phần thân lá.',
      'Bón tăng kali, giảm đạm cho đợt tiếp theo.'
    ]
  },
  {
    name: 'Bạc lá (cháy vi khuẩn)',
    pathogen: 'Vi khuẩn Xanthomonas oryzae',
    level: 'Nặng',
    cls: 'badge-red',
    signs: [
      'Vệt sọc màu trắng ngà chạy dọc theo gân lá.',
      'Chóp lá khô vàng, lan dần vào phiến.',
      'Khi vò lá trong lòng bàn tay thấy vết bệnh rách thành sợi.'
    ],
    condition: 'Lây nhanh qua nước tưới chung, sau bão/lụt, giống nhiễm và bón nhiều phân.',
    steps: [
      'Ngừng dùng chung nguồn nước tưới với ruộng bệnh.',
      'Thu gom lá bệnh, không trả lại ra kênh.',
      'Phun chế phẩm gốc đồng hoặc kháng sinh đặc hiệu theo khuyến cáo.',
      'Vụ sau chuyển sang giống chống chịu và xử lý hạt giống trước khi gieo.'
    ]
  },
  {
    name: 'Sâu cuốn lá nhỏ',
    pathogen: 'Ngài Cnaphalocrocis medinalis — sâu non gây hại',
    level: 'Trung bình',
    cls: 'badge-amber',
    signs: [
      'Lá bị cuốn lại thành ống, mép lá dai hơn bình thường.',
      'Bên trong có sâu non màu xanh nhạt đang ăn phần thịt lá.',
      'Chỉ còn lại lớp biểu bì màu trắng trên phiến lá.'
    ],
    condition: 'Ruộng xanh tốt, bón đạm nhiều, trưởng thành nở rộ sau mưa rào.',
    steps: [
      'Đếm mật độ: dưới 20 lá cuốn/m² chưa cần phun.',
      'Ngừng bón đạm thúc, giữ nước hợp lý.',
      'Phun vào chiều mát khi sâu tuổi 1–2, ưu tiên thuốc tính nội hấp.',
      'Kiểm tra lại sau 3 ngày và ghi số lá bị cuốn.'
    ]
  },
  {
    name: 'Thiếu dinh dưỡng (vàng lá sinh lý)',
    pathogen: 'Không do nấm/vi khuẩn — do thiếu đạm hoặc nghẹt rễ',
    level: 'Nhẹ',
    cls: 'badge-green',
    signs: [
      'Lá vàng dần từ chóp và lan xuống, thường ở lá già trước.',
      'Cây còi cọc, đẻ nhánh kém, bộ rễ ít rễ mới.',
      'Không thấy đốm, vòng nấm hay sợi mốc trên lá.'
    ],
    condition: 'Đất thiếu đạm, đất phèn ngập lâu ngày làm rễ không hô hấp được.',
    steps: [
      'Rút nước phơi ruộng 3–5 ngày để bộ rễ thông thoáng.',
      'Bón vôi khử phèn nếu đất có mùi tanh, nước đổi màu.',
      'Bón thúc phân đạm lượng nhỏ, chia 2 lần.',
      'Sau 7 ngày kiểm tra màu lá và số nhánh mới.'
    ]
  }
];

const CHAT_KB = [
  {
    keys: ['phân', 'đạm', 'bón', 'kali', 'npk', 'liều'],
    answer: 'Với 1 sào (500 m²) lúa giai đoạn đẻ nhánh, lượng tham khảo:\n• Đạm urê: 8–10 kg\n• Kali: 4–6 kg\n• NPK 20-20-15: 12–15 kg\nBón lúc chiều mát, đất đủ ẩm, không bón trước cơn mưa to. Vụ của bạn có bao nhiêu sào để em tính tổng lượng?'
  },
  {
    keys: ['đạo ôn', 'cháy lá', 'nấm', 'phun thuốc'],
    answer: 'Nên phun khi tỉ lệ lá bệnh vượt ~5% ở giai đoạn đẻ nhánh hoặc trước trổ 15 ngày.\n• Chọn thuốc có hoạt chất Tricyclazole hoặc Isoprothiolane.\n• Phun đủ nước, chiều mát, không gió to.\n• Sau 5–7 ngày kiểm tra, phun nhắc nếu còn lan.\nBạn chụp lá bệnh gửi lên mục "Chẩn đoán qua ảnh" để em xem có đúng đạo ôn không.'
  },
  {
    keys: ['nghẹt rễ', 'vàng lá', 'phèn', 'rễ'],
    answer: 'Dấu hiệu nghẹt rễ: lá vàng từ chóp, cây đứng, rễ ít và có màu nâu đen, nước có mùi tanh.\nCách xử lý:\n1. Rút nước phơi ruộng 3–5 ngày.\n2. Bón vôi 15–20 kg/sào.\n3. Bón thúc lượng đạm nhỏ chia 2 lần.\n4. Theo dõi rễ mới sau 7 ngày.'
  },
  {
    keys: ['nước', 'tưới', 'mực nước', 'rút nước'],
    answer: 'Mực nước khuyến cáo theo giai đoạn:\n• Sau gieo đến 3 lá: giữ ẩm mặt ruộng.\n• Đẻ nhánh: 3–5 cm.\n• Làm đòng – trổ: 5–7 cm.\n• Trước thu hoạch 7–10 ngày: rút cạn.\nÁp dụng "tưới ngập khô xen kẽ" giúp tiết kiệm 20–30% nước.'
  },
  {
    keys: ['sâu', 'rầy', 'cuốn lá', 'côn trùng', 'bọ trĩ'],
    answer: 'Ngưỡng xử lý tham khảo:\n• Sâu cuốn lá: >20 lá cuốn/m².\n• Rầy nâu: >3 con/khóm ở tuổi 2–3.\n• Ưu tiên phun chiều mát, giữ nước 3–5 cm để hạn chế rầy.\nBạn cho biết mật độ vừa đếm được để em tư vấn có nên phun không.'
  },
  {
    keys: ['giống', 'hạt giống', 'sạ', 'mật độ', 'gieo'],
    answer: 'Mật độ sạ hợp lý: 80–100 kg/ha cho lúa đông xuân, 100–120 kg/ha vụ hè thu. Ngâm hạt 24–36 giờ đến khi nứt nanh rồi ủ 24–48 giờ. Với ruộng hay ngập, nên sạ hàng để giảm mật độ và dễ chăm sóc.'
  },
  {
    keys: ['thu hoạch', 'máy gặt', 'bán', 'giá'],
    answer: 'Thu hoạch khi 80–85% số hạt trên bông chín (vàng đều từ gốc bông đến chóp). Gặt sau 25–30 ngày trổ đều, phơi hoặc sấy xuống ẩm 13–14% để giảm hao hụt. Nên liên hệ đại lý trước 7–10 ngày để giữ giá.'
  },
  {
    keys: ['thời tiết', 'mưa', 'nắng', 'bão'],
    answer: 'Bạn mở mục Thời tiết để xem dự báo 7 ngày và chỉ số đồng ruộng. Nguyên tắc chung: không phun thuốc khi gió >15 km/h hoặc mưa trong 4 giờ tới; không bón phân khi dự báo mưa to.'
  }
];

/* ---------- State ---------- */
let history = loadHistory();
let chat = loadChat();
let currentFile = null;
let currentResult = null;
let toastTimer = null;

/* Ảnh xem trước chỉ giữ trong phiên (dataURL quá lớn để lưu localStorage) */
const thumbs = new Map();

function $(id) {
  return document.getElementById(id);
}

const dropzone = $('dropzone');
const fileInput = $('fileInput');
const preview = $('preview');
const analyzeBtn = $('analyzeBtn');

/* ---------- localStorage ---------- */
function loadHistory() {
  try {
    const raw = localStorage.getItem(HIST_KEY);
    const data = raw ? JSON.parse(raw) : null;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}

function loadChat() {
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    const data = raw ? JSON.parse(raw) : null;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}

function saveHistory() {
  localStorage.setItem(HIST_KEY, JSON.stringify(history.slice(0, 20)));
}

function saveChat() {
  localStorage.setItem(CHAT_KEY, JSON.stringify(chat.slice(-40)));
}

/* ---------- Băm ổn định: cùng 1 ảnh cho cùng 1 kết quả ---------- */
function hashOf(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) % 100000;
  }
  return hash;
}

function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

function classify(file) {
  const name = normalize(file.name);
  const hints = [
    { index: 0, words: ['dao-on', 'daoon', 'blast', 'dodung', 'dot-nau', 'nam'] },
    { index: 1, words: ['khovan', 'sheath', 'van'] },
    { index: 2, words: ['bac-la', 'bacterial', 'xanthomonas'] },
    { index: 3, words: ['sau', 'cuon-la', 'caterpillar', 'deepausia'] },
    { index: 4, words: ['vang-la', 'thieu', 'nutrient', 're'] }
  ];

  let picked = -1;
  hints.forEach(function (hint) {
    hint.words.forEach(function (word) {
      if (picked === -1 && word && name.indexOf(word) !== -1) picked = hint.index;
    });
  });

  const hash = hashOf(name + ':' + file.size);
  if (picked === -1) picked = hash % DISEASES.length;

  const confidence = 72 + (hash % 26);
  const disease = DISEASES[picked];

  return {
    disease: disease,
    confidence: confidence,
    fileName: file.name,
    time: new Date()
  };
}

/* ---------- 1. Chọn ảnh ---------- */
function acceptFile(file) {
  const error = $('fileError');

  if (!file) return;
  if (file.type.indexOf('image/') !== 0) {
    error.textContent = 'Tệp phải là ảnh (JPG, PNG...).';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    error.textContent = 'Ảnh vượt quá 5 MB. Hãy giảm kích thước rồi thử lại.';
    return;
  }

  error.textContent = '';
  currentFile = file;
  currentResult = null;

  const url = URL.createObjectURL(file);
  preview.src = url;
  preview.hidden = false;
  $('fileName').hidden = false;
  $('fileName').textContent = '📄 ' + file.name + ' · ' + Math.max(1, Math.round(file.size / 1024)) + ' KB';
  $('result').hidden = true;
  analyzeBtn.disabled = false;
  $('clearBtn').disabled = false;
  setStep(1);
}

function clearFile() {
  currentFile = null;
  currentResult = null;
  fileInput.value = '';
  preview.hidden = true;
  preview.removeAttribute('src');
  $('fileName').hidden = true;
  $('fileError').textContent = '';
  $('result').hidden = true;
  analyzeBtn.disabled = true;
  $('clearBtn').disabled = true;
  setStep(0);
}

dropzone.addEventListener('click', function () {
  fileInput.click();
});

dropzone.addEventListener('keydown', function (event) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    fileInput.click();
  }
});

fileInput.addEventListener('change', function () {
  acceptFile(this.files[0]);
});

['dragenter', 'dragover'].forEach(function (type) {
  dropzone.addEventListener(type, function (event) {
    event.preventDefault();
    dropzone.classList.add('is-over');
  });
});

['dragleave', 'drop'].forEach(function (type) {
  dropzone.addEventListener(type, function (event) {
    event.preventDefault();
    dropzone.classList.remove('is-over');
  });
});

dropzone.addEventListener('drop', function (event) {
  const file = event.dataTransfer.files[0];
  acceptFile(file);
});

$('clearBtn').addEventListener('click', function (event) {
  event.stopPropagation();
  clearFile();
});

/* ---------- 2. Chẩn đoán ---------- */
analyzeBtn.addEventListener('click', function () {
  if (!currentFile) return;

  analyzeBtn.disabled = true;
  analyzeBtn.textContent = '⏳ Đang phân tích ảnh...';
  setStep(2);

  setTimeout(function () {
    currentResult = classify(currentFile);
    thumbs.set(currentResult.fileName, preview.src);
    renderResult(currentResult);
    analyzeBtn.textContent = '🔎 Chẩn đoán sơ bộ';
    analyzeBtn.disabled = false;

    history.unshift({
      id: 'h' + Date.now(),
      fileName: currentResult.fileName,
      disease: currentResult.disease.name,
      confidence: currentResult.confidence,
      level: currentResult.disease.level,
      cls: currentResult.disease.cls,
      crop: $('cropSelect').value,
      time: formatTime(currentResult.time)
    });
    saveHistory();
    renderHistory();
    showToast('AI gợi ý: ' + currentResult.disease.name);
  }, 900);
});

$('againBtn').addEventListener('click', function () {
  clearFile();
  dropzone.focus();
});

function renderResult(result) {
  $('resultName').textContent = result.disease.name;
  $('resultPathogen').textContent = result.disease.pathogen;

  const level = $('resultLevel');
  level.textContent = 'Mức ' + result.disease.level.toLowerCase();
  level.className = 'badge ' + result.disease.cls;

  const fill = $('confFill');
  fill.style.width = '0%';
  requestAnimationFrame(function () {
    fill.style.width = result.confidence + '%';
  });
  $('confValue').textContent = result.confidence + '%';

  fillList($('resultSigns'), result.disease.signs);
  fillList($('resultSteps'), result.disease.steps, true);
  $('resultCondition').textContent = result.disease.condition;

  $('result').hidden = false;
  setStep(3);
}

function fillList(box, items, numbered) {
  box.innerHTML = '';
  box.className = 'result-list' + (numbered ? ' numbered' : '');
  items.forEach(function (text) {
    const li = document.createElement('li');
    li.textContent = text;
    box.appendChild(li);
  });
}

function setStep(index) {
  const steps = $('steps').children;
  for (let i = 0; i < steps.length; i += 1) {
    steps[i].className = 'step' + (i + 1 === index ? ' is-active' : '') + (i + 1 < index ? ' is-done' : '');
  }
}

/* ---------- 3. Lịch sử ---------- */
function formatTime(date) {
  return pad(date.getDate()) + '/' + pad(date.getMonth() + 1) + '/' + date.getFullYear() + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
}

function pad(n) {
  return n < 10 ? '0' + n : String(n);
}

function renderHistory() {
  const body = $('histBody');
  body.innerHTML = '';

  history.forEach(function (item) {
    const tr = document.createElement('tr');

    const tdTime = document.createElement('td');
    tdTime.textContent = item.time;

    const tdImg = document.createElement('td');
    const thumb = thumbs.get(item.fileName);
    if (thumb) {
      const img = document.createElement('img');
      img.className = 'hist-thumb';
      img.src = thumb;
      img.alt = 'Ảnh ' + item.fileName;
      tdImg.appendChild(img);
    } else {
      const span = document.createElement('span');
      span.className = 'hist-empty';
      span.textContent = 'Ảnh phiên trước';
      tdImg.appendChild(span);
    }

    const tdName = document.createElement('td');
    tdName.innerHTML = '<strong></strong><br><small></small>';
    tdName.querySelector('strong').textContent = item.disease;
    tdName.querySelector('small').textContent = item.fileName;

    const tdConf = document.createElement('td');
    tdConf.textContent = item.confidence + '%';

    const tdLevel = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = 'badge ' + item.cls;
    badge.textContent = item.level;
    tdLevel.appendChild(badge);

    const tdAction = document.createElement('td');
    const view = document.createElement('button');
    view.type = 'button';
    view.className = 'link-btn';
    view.textContent = 'Xem lại';
    view.addEventListener('click', function () {
      const disease = DISEASES.find(function (item2) {
        return item2.name === item.disease;
      });
      if (!disease) {
        showToast('Không tìm thấy dữ liệu mẫu cho kết quả này.', true);
        return;
      }
      renderResult({ disease: disease, confidence: item.confidence });
      showToast('Đang xem lại kết quả lúc ' + item.time + '.');
    });

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'link-btn link-danger';
    del.textContent = 'Xoá';
    del.addEventListener('click', function () {
      history = history.filter(function (row) {
        return row.id !== item.id;
      });
      saveHistory();
      renderHistory();
      showToast('Đã xoá một bản ghi lịch sử.');
    });

    tdAction.append(view, del);
    tr.append(tdTime, tdImg, tdName, tdConf, tdLevel, tdAction);
    body.appendChild(tr);
  });

  $('histCount').textContent = history.length;
  $('histEmpty').hidden = history.length > 0;
}

$('clearHistBtn').addEventListener('click', function () {
  if (history.length === 0) {
    showToast('Lịch sử đang trống.');
    return;
  }
  history = [];
  saveHistory();
  renderHistory();
  showToast('Đã dọn toàn bộ lịch sử chẩn đoán.');
});

/* ---------- 4. Chat ---------- */
function addMessage(role, text) {
  chat.push({ role: role, text: text, time: formatTime(new Date()) });
  saveChat();
  renderChat();
}

function renderChat() {
  const box = $('chatBox');
  box.innerHTML = '';

  if (chat.length === 0) {
    chat.push({
      role: 'bot',
      text: 'Xin chào 👋 Em là trợ lý kỹ thuật của SmartAgri.\nBạn cứ hỏi về phân bón, sâu bệnh, nước tưới hoặc giống — em sẽ gợi ý theo tài liệu khuyến nông.',
      time: formatTime(new Date())
    });
    saveChat();
  }

  chat.forEach(function (item) {
    box.appendChild(buildBubble(item));
  });

  box.scrollTop = box.scrollHeight;
}

function buildBubble(item) {
  const wrap = document.createElement('div');
  wrap.className = 'msg ' + item.role;

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = item.text;

  const time = document.createElement('span');
  time.className = 'msg-time';
  time.textContent = (item.role === 'user' ? 'Bạn · ' : 'Trợ lý · ') + item.time;
  bubble.appendChild(time);

  wrap.appendChild(bubble);
  return wrap;
}

function answerFor(question) {
  const text = normalize(question);
  let best = null;
  let bestScore = 0;

  CHAT_KB.forEach(function (entry) {
    let score = 0;
    entry.keys.forEach(function (key) {
      if (text.indexOf(normalize(key)) !== -1) score += 1;
    });
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  });

  if (best) return best.answer;

  return 'Em chưa có câu trả lời chắc chắn cho vấn đề này 🙏.\nBạn thử mô tả thêm triệu chứng trên cây, hoặc gửi câu hỏi cho chuyên gia ở mục "Hỗ trợ kỹ thuật" — trong vòng 24 giờ sẽ có người trả lời.';
}

function sendQuestion(text) {
  const question = text.trim();
  if (question.length < 3) {
    showToast('Câu hỏi cần tối thiểu 3 ký tự.', true);
    return;
  }

  addMessage('user', question);

  const box = $('chatBox');
  const typing = document.createElement('div');
  typing.className = 'msg bot';
  typing.innerHTML = '<div class="bubble"><span class="typing"><i></i><i></i><i></i></span></div>';
  box.appendChild(typing);
  box.scrollTop = box.scrollHeight;

  setTimeout(function () {
    typing.remove();
    addMessage('bot', answerFor(question));
  }, 700);
}

$('chatForm').addEventListener('submit', function (event) {
  event.preventDefault();
  sendQuestion($('chatInput').value);
  $('chatInput').value = '';
});

$('chipList').addEventListener('click', function (event) {
  const chip = event.target.closest('.chip');
  if (chip) sendQuestion(chip.textContent);
});

$('clearChatBtn').addEventListener('click', function () {
  chat = [];
  localStorage.removeItem(CHAT_KEY);
  renderChat();
  showToast('Đã xoá hội thoại.');
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
renderChat();
renderHistory();
setStep(1);
