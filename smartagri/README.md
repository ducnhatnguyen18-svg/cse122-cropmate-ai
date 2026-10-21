# SmartAgri — Season Dashboard

Trang chính của hệ thống **SmartAgri — Trí tuệ cho mùa vàng**, thực hiện cho bài kiểm tra giữa kỳ học phần **Phát triển ứng dụng Web cơ bản (CSE122)**.

## 1. Thông tin chung

| Nội dung | Chi tiết |
| --- | --- |
| Tên đề tài BTL | SmartAgri — Hệ thống hỗ trợ quản lý mùa vụ thông minh cho nông dân |
| Tên trang đã thực hiện | Season Dashboard — Bảng điều khiển mùa vụ (`index.html`) |
| Trang phụ trợ | `login.html` (Đăng nhập), `register.html` (Đăng ký), `forgot-password.html` (Quên mật khẩu) |
| Trang chức năng | `season.html` (Mùa vụ), `diary.html` (Nhật ký), `weather.html` (Thời tiết), `ai.html` (Trợ lý AI), `support.html` (Hỗ trợ kỹ thuật), `settings.html` (Cài đặt) |
| Luồng sử dụng | Đăng ký → Đăng nhập → Season Dashboard → 6 trang chức năng (liên kết qua lại ở sidebar); Quên mật khẩu đi từ link "Quên mật khẩu?" trên trang đăng nhập |
| Đối tượng sử dụng | Nông dân đang quản lý một mùa vụ cụ thể (ví dụ: Vụ Lúa Mùa 2026, lô A1) |
| Mục đích của trang | Gom toàn bộ thông tin nông dân cần mỗi ngày về một màn hình: tiến độ mùa vụ, lịch thu hoạch dự kiến, thời tiết khu vực canh tác, nhật ký hoạt động gần đây, kênh ghi nhanh công việc, kênh hỏi chuyên gia và công cụ chẩn đoán bệnh cây sơ bộ bằng ảnh. |

## 2. Bố cục trang

```
┌───────────┬──────────────────────────────────────────────┐
│ Sidebar   │ Topbar: tiêu đề + lời chào + bell + avatar   │
│ (điều     ├───────────────────────────┬──────────────────┤
│  hướng    │ Hero: Vụ lúa + progress   │ Weather card     │
│  chính)   ├─────────────┬─────────────┴──────────────────┤
│           │ AI card     │ 2 nút CTA + bảng hoạt động     │
│  Đăng xuất│             │  (search + filter + table)     │
└───────────┴─────────────┴────────────────────────────────┘
```

## 3. Các chức năng JavaScript — Season Dashboard (`index.html`)

| # | Chức năng | Kiến thức sử dụng | Cách kích hoạt |
| --- | --- | --- | --- |
| 1 | Render bảng "Hoạt động gần đây" từ mảng object | `Array.filter`, `forEach`, `createElement`, `innerHTML` | Trang tải (`init()`) |
| 2 | Tìm kiếm nhật ký theo nội dung | event `input`, `String.toLowerCase`, `includes` | Gõ vào ô tìm kiếm |
| 3 | Lọc theo loại hoạt động | event `change`, `select.value` | Chọn trong dropdown loại |
| 4 | "Xem tất cả" / "Thu gọn" (giới hạn 5 dòng) | biến trạng thái `showAll`, `Array.slice` | Bấm link góc phải card |
| 5 | Modal ghi nhật ký + validation + thêm dữ liệu vào đầu danh sách | `hidden`, `unshift`, `Date`, regex chiều dài | Bấm nút "Ghi nhật ký nhanh" |
| 6 | Modal hỏi chuyên gia + validation 2 trường | `preventDefault`, `classList.toggle` | Bấm nút "Nhờ chuyên gia hỗ trợ" |
| 7 | Tải/ kéo–thả ảnh lá cây, xem trước bằng `FileReader`, chẩn đoán mô phỏng | `FileReader.readAsDataURL`, event `dragover`/`drop`, `setTimeout` | Bấm hoặc kéo ảnh vào vùng nét đứt |
| 8 | Dropdown thông báo, reset badge về 0 khi đọc | event `click`, `stopPropagation`, `closest` | Bấm chuông 🔔 |
| 9 | Dropdown tài khoản người dùng | `aria-expanded`, `hidden` | Bấm avatar góc phải |
| 10 | Thanh tiến độ đếm từ 0% → 62% khi tải trang | `setInterval`, `clearInterval`, CSS transition | Trang tải |
| 11 | Toggle sidebar trên mobile | `classList.toggle` | Bấm nút ☰ (màn hình ≤ 760px) |
| 12 | Toast phản hồi sau mỗi thao tác | `hidden`, `setTimeout` | Sau khi lưu/gửi/chẩn đoán |

**Đóng mọi modal:** phím `Escape` hoặc bấm nền tối hoặc nút ✕.

## 4. Các chức năng JavaScript — Đăng nhập (`login.html`)

| # | Chức năng | Kiến thức sử dụng | Cách kích hoạt |
| --- | --- | --- | --- |
| 1 | Hiện / ẩn mật khẩu, đổi icon và cập nhật `aria-label` | `input.type`, `classList.toggle`, `innerHTML`, `setAttribute` | Bấm biểu tượng con mắt trong ô mật khẩu |
| 2 | Validation: bắt buộc nhập, độ dài tối thiểu (user ≥ 4, pass ≥ 6), thông báo lỗi từng trường | `if/else`, `trim`, `length`, `textContent`, `classList` | Bấm "Đăng nhập" khi dữ liệu chưa hợp lệ |
| 3 | Xoá lỗi ngay khi người dùng gõ lại | event `input` | Gõ vào ô đang báo lỗi |
| 4 | Đăng nhập giả lập: nút chuyển trạng thái "Đang đăng nhập..." có spinner, rồi kiểm tra tài khoản trong mảng | `setTimeout`, vòng `for`, `disabled` | Bấm "Đăng nhập" với dữ liệu hợp lệ |
| 5 | Sai tài khoản → báo lỗi + rung nút + toast đỏ | `classList.add/remove`, `@keyframes shake` | Nhập sai `nongdan / 123456` |
| 6 | Đúng tài khoản → toast chào theo vai trò rồi chuyển sang `index.html` | `window.location.href`, `setTimeout` | Nhập `nongdan / 123456` (hoặc `chuyen_gia / agri2026`) |
| 7 | Link "Quên mật khẩu?" dưới ô mật khẩu → mở `forgot-password.html` | liên kết HTML thuần | Bấm link |

Tài khoản demo khai báo bằng hằng số `accounts` ở đầu `js/login.js`.

## 5. Các chức năng JavaScript — Đăng ký (`register.html`)

| # | Chức năng | Kiến thức sử dụng | Cách kích hoạt |
| --- | --- | --- | --- |
| 1 | Validation 4 trường: SĐT theo regex `^(\+?84|0)\d{9,10}$`, họ tên chỉ chữ, năm sinh đủ 16 tuổi, địa chỉ ≥ 5 ký tự | `RegExp.test`, `if/else`, `trim`, `Number.isInteger` | Bấm "Đăng Ký" |
| 2 | Chuẩn hoá số điện thoại (chấp nhận `0987.654.321`, khoảng trắng, gạch ngang) | `String.replace` với regex | Gõ SĐT có dấu phân cách |
| 3 | Tự động hiển thị tuổi ngay khi gõ năm sinh | event `input`, `new Date().getFullYear()` | Gõ ô "Năm sinh" |
| 4 | Chống trùng số điện thoại đã đăng ký | `localStorage.getItem/setItem`, `JSON.parse`, `Array.some` | Đăng ký lại một SĐT đã có |
| 5 | Nút chuyển trạng thái "Đang gửi..." có spinner rồi lưu hồ sơ | `setTimeout`, `disabled`, `Array.push` | Bấm "Đăng Ký" hợp lệ |
| 6 | Thành công → toast xanh rồi quay về `login.html`; thất bại → toast đỏ + rung nút | `window.location.href`, `classList`, `@keyframes shake` | Sau khi gửi |

## 6. Các chức năng JavaScript — Nhật ký (`diary.html`)

| # | Chức năng | Kiến thức sử dụng | Cách kích hoạt |
| --- | --- | --- | --- |
| 1 | Render timeline từ mảng object (màu tag theo loại, dot theo trạng thái) | `Array.forEach`, `createElement`, `classList`, `textContent` | Trang tải (`init()`) |
| 2 | Tìm kiếm theo mô tả hoặc loại hoạt động | event `input`, `toLowerCase`, `indexOf` | Gõ vào ô tìm kiếm |
| 3 | Ba bộ lọc giai đoạn / loại / trạng thái kết hợp | `Array.filter`, `select.value`, `Array.sort`, `localeCompare` | Chọn ở thanh công cụ |
| 4 | Nút "Làm mới" xoá toàn bộ bộ lọc | gán lại giá trị mặc định + `renderEntries()` | Bấm ⟳ Làm mới |
| 5 | Thêm nhật ký mới (validation 3 trường) vào đầu danh sách | `preventDefault`, `Array.unshift`, `new Date()` | Điền form rồi bấm "Lưu nhật ký" |
| 6 | Sửa: bơm dữ liệu vào form, đổi nút thành "Cập nhật nhật ký", highlight bản ghi | `Array.find`, biến trạng thái `editingId`, `scrollIntoView` | Bấm ✏️ Sửa trên bản ghi |
| 7 | Xoá có xác nhận qua modal | event delegation `closest('[data-action]')`, `Array.filter`, `hidden` | Bấm 🗑️ Xóa → xác nhận |
| 8 | Kéo–thả / chọn nhiều ảnh, xem trước, loại từng ảnh | `FileReader.readAsDataURL`, event `drop`/`dragover`, `Array.splice` | Thả ảnh vào vùng nét đứt |
| 9 | Chẩn đoán AI mô phỏng (ngẫu nhiên 1 trong 3 kết quả), Xác nhận gắn vào mô tả, Chỉnh sửa bật `contenteditable` | `setTimeout`, `Math.random`, `getAttribute`/`setAttribute` | Bấm "Chẩn đoán bằng AI" sau khi có ảnh |
| 10 | Dropdown thông báo, toggle sidebar mobile, toast | `stopPropagation`, `classList.toggle`, `setTimeout` | Bấm 🔔 /  / sau mỗi thao tác |

## 7. Các chức năng JavaScript — Yêu cầu hỗ trợ kỹ thuật (`support.html`)

| # | Chức năng | Kiến thức sử dụng | Cách kích hoạt |
| --- | --- | --- | --- |
| 1 | Render danh sách "Yêu cầu đã gửi" từ mảng object, mỗi yêu cầu có mã `#HS-2026-00NN`, pill trạng thái và màu riêng | `Array.forEach`, `createElement`, `textContent`, `classList` | Trang tải (`init()`) |
| 2 | Chọn một yêu cầu → panel "Phản hồi từ chuyên gia" cập nhật tiêu đề, ngày, nội dung tư vấn, các bước xử lý và tài liệu PDF | event `click` + `keydown` (Enter/Space), `Array.find`, event delegation | Bấm vào một dòng trong danh sách |
| 3 | Nút "Xem thêm 7 ⌄" / "Thu gọn ⌃" giới hạn 5 bản ghi | biến trạng thái `showAll`, `Array.slice`, `hidden` | Bấm nút cuối card danh sách |
| 4 | Ba thẻ mức độ khẩn cấp bằng `radio` thật, tô màu theo mức đã chọn | `input[type=radio]`, `classList`, `name` group | Bấm "Bình thường / Khẩn cấp / Báo động" |
| 5 | Đếm ký tự thời gian thực của ô mô tả (`maxlength="300"`) | event `input`, `String.length`, `textContent` | Gõ vào ô mô tả |
| 6 | Validation: tiêu đề ≥ 5 ký tự, mô tả ≥ 20 ký tự, bắt buộc tick đồng ý bảo mật | `if/else`, `trim`, `checked`, `classList.add('is-invalid')` | Bấm "Gửi yêu cầu" khi dữ liệu chưa hợp lệ |
| 7 | Gửi yêu cầu mới → tạo mã `HS-2026-00NN` tăng dần, thêm vào đầu danh sách, mở panel ở trạng thái "đang chờ tiếp nhận" | `Array.unshift`, `String.padStart`, `new Date()`, `form.reset()` | Điền form hợp lệ rồi bấm "Gửi yêu cầu" |
| 8 | Kéo–thả / chọn ảnh đính kèm, xem trước và loại từng ảnh | `FileReader.readAsDataURL`, event `drop`/`dragover`, `Array.splice` | Thả ảnh vào vùng nét đứt |
| 9 | "Đánh dấu đã đọc" đổi pill sang "Đã đọc" và khoá nút | `Array.find`, `disabled`, `textContent` | Bấm nút trong panel chuyên gia |
| 10 | "Đóng" panel → lưới chuyển 3 cột xuống 2 cột; bấm dòng khác mở lại | `classList.add/remove`, CSS Grid | Bấm ✕ hoặc "Đóng" |
| 11 | Dropdown thông báo, toggle sidebar mobile, toast phản hồi | `stopPropagation`, `classList.toggle`, `setTimeout` | Bấm 🔔 / ☰ / sau mỗi thao tác |

## 8. Các trang chức năng mới

Bốn trang đầu (8.1–8.4) tách từ 4 khối trên `index.html` thành 4 trang độc lập (mỗi trang 1 file HTML + 1 file CSS + 1 file JS), dùng chung `css/layout.css` (sidebar) và `css/ui.css` (topbar, card, form, bảng, modal, toast). `index.html` vẫn giữ các khối tóm tắt và có link "Xem chi tiết…" sang trang Mùa vụ, Thời tiết, Trợ lý AI; trang Cài đặt mở từ sidebar hoặc menu avatar ("Hồ sơ của tôi" / "Cài đặt tài khoản"). Riêng 8.5 là trang mới trong luồng đăng nhập, dùng CSS riêng giống `login.css` / `register.css` nên không có sidebar.

### 8.1 Mùa vụ (`season.html`)

| # | Chức năng | Kiến thức sử dụng | Cách kích hoạt |
| --- | --- | --- | --- |
| 1 | Chuyển tab 3 mùa vụ; card chi tiết, 5 giai đoạn và danh sách kế hoạch vẽ lại theo mùa vụ đang chọn | event delegation, `Array.find`, `classList.toggle` | Bấm tab đầu trang |
| 2 | Thanh tiến độ + "ngày thứ N / M" + ngày thu hoạch dự kiến tính từ số ngày đã gieo | `Date`, `addDays()`, gán `style.width` | Trang tải / đổi tab |
| 3 | Stepper 5 giai đoạn (đẻ nhánh → làm đòng → trổ bông → chín) tự đánh dấu *đã xong / đang chạy / sắp tới* theo tỉ lệ mốc 15% – 45% – 70% – 85% – 100% | `PHASES` (mảng hằng số), `Array.map`, `if/else` | Trang tải / đổi tab |
| 4 | Thêm kế hoạch canh tác (validate tiêu đề + ngày), tick "đã hoàn thành", xoá kế hoạch | `preventDefault`, `Array.push` / `Array.filter`, `classList.add('is-invalid')` | Form "Kế hoạch canh tác" |
| 5 | Tìm kiếm + 2 bộ lọc (loại hoạt động, trạng thái) khớp cả khi gõ không dấu | `String.normalize('NFD')` bỏ dấu, `toLowerCase`, `Array.filter` | Gõ/chọn ở thanh công cụ |
| 6 | Bảng 3 lô ruộng (diện tích, giống, giai đoạn, trạng thái) và khối ghi chú kỹ thuật | `Array.forEach`, `createElement`, `textContent` | Trang tải |
| 7 | Modal "Thêm mùa vụ" tạo tab mới, toàn bộ mùa vụ lưu `localStorage` (`smartagri.seasons.v1`) | `JSON.stringify`/`JSON.parse`, `localStorage`, `hidden` | Bấm "Thêm mùa vụ" |

### 8.2 Thời tiết (`weather.html`)

| # | Chức năng | Kiến thức sử dụng | Cách kích hoạt |
| --- | --- | --- | --- |
| 1 | Chọn 1 trong 4 khu vực → số liệu "bây giờ", 4 chỉ số, dải 24 giờ, biểu đồ 7 ngày, cảnh báo và khuyến nghị đều tính lại; khu vực đã chọn được nhớ ở lần sau (`smartagri.weather.region.v1`) | event `change`, `select.value`, `localStorage` | Chọn ở thanh khu vực |
| 2 | Sinh số liệu theo **ngẫu nhiên có seed** (hàm `makeRand`) ⇒ tải lại trang số liệu không đổi; nút "Làm mới số liệu" tăng `refreshCount` để ra bộ số mới, kèm đồng hồ cập nhật | LCG `Math.random` thay thế bằng seed, `Date`, `pad()` | Bấm "Làm mới số liệu" |
| 3 | Bốn chỉ số đồng ruộng: độ ẩm đất, điểm sương (`T − (100 − ẩm)/5`), nguy cơ đạo ôn lá, nguy cơ đổ ngã — mỗi chỉ số có điểm 0–100, meter màu và nhãn Thấp / Trung bình / Cao | `clamp()`, `levelOf()`, biến CSS `width` | Trang tải / đổi khu vực |
| 4 | Dải 24 giờ cuộn ngang, nhiệt mỗi giờ = nhiệt trung bình ngày + độ lệch theo giờ (mảng `TEMP_OFFSET`), ban đêm dùng icon 🌙 / 🌧️ | `for` 24 lần, `% 24`, `new Date().getHours()` | Trang tải |
| 5 | Biểu đồ cột 7 ngày dựng hoàn toàn bằng CSS Grid + bảng 7 ngày, cột "Thích hợp phun thuốc" suy từ xác suất mưa / ẩm / gió | `Array.forEach`, `Math.round`, `badge` | Trang tải |
| 6 | Danh sách cảnh báo theo 3 cấp (đỏ / vàng / xanh lá) riêng cho từng khu vực | `Array.forEach`, `className` | Trang tải / đổi khu vực |
| 7 | Khuyến nghị theo luật if/else, mỗi dòng kèm giải thích "Vì sao": gió > 15 km/h → hoãn phun; xác suất mưa < 55% → khung giờ phun; ẩm đất < 45% → tưới, > 85% → rút nước; UV ≥ 8 →che nắng; có cảnh báo cấp cao → kiểm tra cống/bờ bao | chuỗi `if/else`, `Array.some`, `list.slice(0, 6)` | Trang tải / đổi khu vực / làm mới |

### 8.3 Trợ lý AI (`ai.html`)

| # | Chức năng | Kiến thức sử dụng | Cách kích hoạt |
| --- | --- | --- | --- |
| 1 | Khối hướng dẫn 3 bước (chụp ảnh → chọn ảnh → xem kết quả) | HTML/CSS thuần | Trang tải |
| 2 | Tải hoặc kéo–thả ảnh, xem trước bằng `URL.createObjectURL` (chỉ giữ trong bộ nhớ phiên, **không** nhúng base64 vào `localStorage`), xoá từng ảnh | event `change` / `dragover` / `drop`, `Map`, `revokeObjectURL` | Thả ảnh vào vùng nét đứt |
| 3 | Nút "Phân tích" chỉ bật khi đã có ảnh | `disabled`, biến trạng thái | Chọn ảnh |
| 4 | `classify()` suy bệnh: ưu tiên từ khoá trong tên file (`dao-on`, `chloride`, `khoi-van`…), không khớp thì dùng `hash(name + size) % 5`; điểm tin cậy 72–97% ổn định theo từng ảnh | `hashOf()`, `Array.some`, `%` | Bấm "Phân tích ảnh" |
| 5 | Kết quả chẩn đoán: tên bệnh + tác nhân, thanh tin cậy, dấu hiệu, điều kiện thuận lợi, các bước xử lý, disclaimer và link dẫn sang Nhật ký / Hỗ trợ kỹ thuật | `Array.forEach`, `createElement`, `classList` | Sau khi phân tích |
| 6 | Chat với trợ lý: 9 nhóm từ khoá (so khớp sau khi bỏ dấu) + câu trả lời dự phòng, hiệu ứng "đang gõ", 4 chip hỏi nhanh, lịch sử chat lưu `localStorage` (`smartagri.ai.chat.v1`) | `normalize('NFD')`, `setTimeout`, `Array.push`, `input` + Enter | Gõ câu hỏi / bấm chip |
| 7 | Bảng lịch sử chẩn đoán (giờ, tên ảnh, bệnh, độ tin cậy) lưu `localStorage` (`smartagri.ai.history.v1`), có trạng thái rỗng | `JSON`, `Array.unshift`, `hidden` | Sau mỗi lần phân tích |

### 8.4 Cài đặt (`settings.html`)

| # | Chức năng | Kiến thức sử dụng | Cách kích hoạt |
| --- | --- | --- | --- |
| 1 | 6 tab ARIA (`role="tab"` / `role="tabpanel"`, `aria-selected`), chuyển tab bằng chuột và phím mũi tên | `keydown`, `Array.forEach`, `hidden` | Bấm tab / phím ← → |
| 2 | Hồ sơ: validate họ tên / SĐT / địa chỉ, xem trước avatar + tên đổi ngay, tên này thay cả ở topbar | `trim`, `length`, regex, `textContent` | Điền form rồi bấm "Lưu hồ sơ" |
| 3 | Lô ruộng: thêm dòng (tên, diện tích, giống) và xoá từng dòng, lưu `localStorage` | `Array.push` / `filter`, event delegation | Bấm "Thêm lô" / 🗑 |
| 4 | Thông báo: 5 công tắc + kênh nhận + khung giờ yên lặng + nút "Gửi thông báo thử" | `input:checked`, `.switch`, `setTimeout` (toast) | Gật công tắc |
| 5 | Giao diện: 4 cỡ chữ, tương phản cao, giảm hiệu ứng — áp **ngay lập tức** và **trên cả 7 trang** bằng class đặt trên `<html>` (định nghĩa ở `css/layout.css`) | `document.documentElement.classList`, custom property `--app-root-fs` | Chọn trong tab "Giao diện" |
| 6 | Bảo mật: đổi mật khẩu có thanh đo độ mạnh (≥ 8 ký tự, chữ hoa, số, ký tự đặc biệt) + danh sách phiên đăng nhập, thu hồi từng phiên | `scorePassword()`, `Array.filter`, `RegExp.test` | Nhập mật khẩu / bấm "Thu hồi" |
| 7 | Dữ liệu: liệt kê các khoá `localStorage` của app kèm dung lượng KB, xuất toàn bộ ra file `.json`, nhập file JSON, xoá sạch dữ liệu (modal xác nhận + checkbox mới bấm được nút xoá) | `Object.keys`, `Blob`, `<a download>`, `FileReader` | Bấm "Xuất dữ liệu" / "Nhập" / "Xoá toàn bộ" |

### 8.5 Quên mật khẩu (`forgot-password.html`)

Mở từ link **"Quên mật khẩu?"** ngay dưới ô mật khẩu trên trang `login.html`.

| # | Chức năng | Kiến thức sử dụng | Cách kích hoạt |
| --- | --- | --- | --- |
| 1 | Một ô nhập chấp nhận **tên đăng nhập HOẶC email**, mỗi loại một luật kiểm tra: email khớp `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/`, tên đăng nhập ≥ 4 ký tự, để trống thì báo lỗi | `RegExp.test`, `indexOf`, `trim`, `length`, `classList.toggle('is-invalid')` | Bấm "Gửi liên kết đặt lại mật khẩu" khi dữ liệu chưa hợp lệ (nút rung theo `@keyframes shake`) |
| 2 | Xoá báo lỗi ngay khi người dùng gõ lại | event `input` | Gõ vào ô tài khoản |
| 3 | Gửi giả lập: nút chuyển sang "Đang gửi liên kết..." có spinner rồi `setTimeout` 1,2 giây | `disabled`, `innerHTML`, `setTimeout` | Bấm nút gửi với dữ liệu hợp lệ |
| 4 | Thẻ đổi sang trạng thái **"Đã gửi liên kết"** (panel thứ hai), tiêu đề nhận focus để người dùng bàn phím/bộ đọc màn hình biết nội dung đã đổi | `hidden`, `focus()`, `tabindex="-1"` | Sau khi gửi xong |
| 5 | Địa chỉ email hiển thị dạng **đã che**: `nongdan@example.com` → `no***@example.com` | `indexOf`, `String.slice`, nối chuỗi | Xem dòng "đã gửi tới…" |
| 6 | **Không tiết lộ tài khoản có tồn tại hay không**: nhập `nongdan` (có trong danh sách demo) thì hiện email đã che, nhập tên bất kỳ cũng nhận đúng một thông báo giống nhau | `Array` duyệt bằng `for`, giá trị trả về mặc định | Thử `nongdan` và `khongtonTai123` |
| 7 | Đếm ngược 60 giây trước khi cho gửi lại; hết thời gian nút đổi thành "Gửi lại liên kết" và bấm được | `setInterval`, `clearInterval`, `textContent` | Panel "Đã gửi liên kết" |
| 8 | "Dùng tài khoản khác" quay lại form, huỷ đồng hồ đếm ngược và trả focus về ô nhập | `clearInterval`, `hidden`, `focus()` | Bấm link ở panel "Đã gửi" |
| 9 | Toast phản hồi sau khi gửi / gửi lại | `hidden`, `setTimeout` | Sau mỗi lần gửi |

**Không có email nào được gửi đi**: trang chỉ đổi trạng thái giao diện, tài khoản demo khai báo trong `DEMO_ACCOUNTS` ở đầu `js/forgot.js`.

## 9. Công nghệ sử dụng

- **HTML5** — semantic: `aside`, `nav`, `header`, `main`, `section`, `article`, `figure`, `table`, `form`, `label`, `input`, `fieldset`/`legend`, `details`, `footer` + ARIA cho tab, modal và dropzone (`role="tab"`, `aria-selected`, `aria-current`, `aria-live`)
- **CSS3** — CSS Variables, CSS Grid (kể cả biểu đồ cột dựng bằng grid), Flexbox, `:hover`, `:checked`, `@keyframes`, `border-radius` tạo khối ảnh dạng chiếc lá, SVG inline (icon, sóng, cành lá, bông lúa), media query
- **JavaScript thuần** — không framework, không build, không backend; 10 trang với 10 file JS riêng cộng `js/display.js` dùng chung, dữ liệu là hằng số trong file và `localStorage`

## 10. Cấu trúc thư mục

```
.
├── index.html          # Trang chính: Season Dashboard (tổng hợp, có link sang từng trang)
├── season.html         # Mùa vụ: tab mùa vụ, tiến độ, 5 giai đoạn, kế hoạch, lô ruộng
├── diary.html          # Nhật ký (thêm/sửa/xoá, tìm kiếm, lọc, AI)
├── weather.html        # Thời tiết: khu vực, chỉ số đồng ruộng, 24 giờ, 7 ngày, khuyến nghị
├── ai.html             # Trợ lý AI: phân tích ảnh, chat, lịch sử chẩn đoán
├── support.html        # Yêu cầu hỗ trợ kỹ thuật (form + danh sách + panel chuyên gia)
├── settings.html       # Cài đặt: hồ sơ, lô ruộng, thông báo, giao diện, bảo mật, dữ liệu
├── login.html          # Đăng nhập cho nông dân
├── register.html       # Đăng ký tài khoản nông dân
├── forgot-password.html # Quên mật khẩu (đặt lại qua email — mô phỏng)
├── css/
│   ├── layout.css      # Sidebar + khung trang + các class "Giao diện" dùng chung cho 7 trang
│   ├── ui.css          # Components dùng chung cho 4 trang mới (topbar, card, form, bảng, modal, toast)
│   ├── style.css       # Style Season Dashboard
│   ├── season.css      # Style trang mùa vụ
│   ├── diary.css       # Style trang nhật ký
│   ├── weather.css     # Style trang thời tiết
│   ├── ai.css          # Style trang trợ lý AI
│   ├── support.css     # Style trang hỗ trợ kỹ thuật
│   ├── settings.css    # Style trang cài đặt
│   ├── login.css       # Style trang đăng nhập
│   ├── forgot.css      # Style trang quên mật khẩu
│   └── register.css    # Style trang đăng ký
├── js/
│   ├── display.js      # Đọc tuỳ chọn "Giao diện" đã lưu và gắn class lên <html> (nạp ở <head>, dùng cho cả 7 trang)
│   ├── main.js         # Logic Season Dashboard
│   ├── season.js       # Logic trang mùa vụ
│   ├── diary.js        # Logic trang nhật ký
│   ├── weather.js      # Logic trang thời tiết
│   ├── ai.js           # Logic trang trợ lý AI
│   ├── support.js      # Logic trang hỗ trợ kỹ thuật
│   ├── settings.js     # Logic trang cài đặt
│   ├── login.js        # Logic trang đăng nhập
│   ├── forgot.js       # Logic trang quên mật khẩu
│   └── register.js     # Logic trang đăng ký
├── assets/
│   ├── hero-rice.png
│   ├── login-farmer.png
│   ├── register-field.png
│   ├── avatar-farmer.png
│   ├── logo.svg
│   └── favicon.svg
├── youtobe             # Link video thuyết minh
└── README.md
```

### Sidebar dùng chung (`css/layout.css`)

Bảy trang bên trong app (`index.html`, `season.html`, `diary.html`, `weather.html`, `ai.html`, `support.html`, `settings.html`) dùng **một file sidebar chung** là `css/layout.css`, được `<link>` **trước** file CSS riêng của từng trang:

- Nội dung: khung `.app` (lưới sidebar + nội dung), `.sidebar`, `.brand`, `.side-nav`, `.side-link`, `.btn-logout`, nút ☰ và đoạn `@media (max-width: 760px)` đẩy sidebar ra ngoài màn hình.
- `position: sticky; top: 0; height: 100vh` + `.side-nav { flex: 1 }` ⇒ nút **Đăng xuất** luôn nằm sát đáy sidebar và đứng yên khi cuộn trang.
- Markup sidebar ở 7 trang giống hệt nhau theo 7 link: Tổng quan → `index.html`, Mùa vụ → `season.html`, Nhật ký → `diary.html`, Thời tiết → `weather.html`, Trợ lý AI → `ai.html`, Hỗ trợ kỹ thuật → `support.html`, Cài đặt → `settings.html`. Trang đang mở đánh dấu bằng `is-active` + `aria-current="page"`.
- `css/layout.css` còn định nghĩa các class **"Giao diện"** đặt trên `<html>`: `fs-sm` / `fs-lg` / `fs-xl` (cỡ chữ), `high-contrast` (tương phản cao), `no-motion` (giảm hiệu ứng). Trang Cài đặt lưu lựa chọn vào `smartagri.settings.v1`; cả 7 trang nạp `js/display.js` ở `<head>` để đọc lại lựa chọn đó và gắn class **trước khi vẽ** ⇒ chọn cỡ chữ lớn hay tương phản cao thì toàn bộ app đổi theo, kể cả 3 trang cũ. Selector viết dạng `html body`, `html.high-contrast .card` để ưu tiên cao hơn CSS riêng của từng trang mà không phải sửa các file cũ.
- Trang đăng nhập, đăng ký và quên mật khẩu không có sidebar nên không dùng hai file này.

## 11. Responsive

| Màn hình | Season Dashboard | Trang đăng nhập / đăng ký / quên mật khẩu |
| --- | --- | --- |
| > 1180px (Desktop) | Sidebar cố định 244px; hero 8 cột + thời tiết 4 cột; AI 5fr + cột phải 7fr | 2 cột: ảnh dạng chiếc lá 42% + cột form; nét viền cong ôm cạnh phải ảnh |
| ≤ 1180 / 980px (Tablet) | Hero và thời tiết chiếm toàn hàng; AI và cột phải xếp chồng | 1 cột: ảnh thành banner bo góc 520px, form bên dưới, bỏ nét viền cong |
| ≤ 760 / 560px (Mobile) | Sidebar ẩn, mở bằng nút ☰; mọi card 1 cột; 2 CTA xếp dọc; bảng cuộn ngang | Ảnh 220px, card giảm padding, nút đăng ký chiếm 100% bề rộng, ẩn hình vẽ phụ |

Riêng `forgot-password.html`: thẻ trắng ở cột trái + ảnh ruộng bo vòng tròn ở cột phải (khác `login.html` là ảnh bên trái); 4 ô lục giác biểu tượng đặt chồng lên ảnh; ≤ 980px xếp 1 cột, ảnh thành banner 16/10 bo góc 22px; ≤ 520px thẻ giảm padding và ẩn 2 ô lục giác dưới để chữ không đè ảnh.

Riêng `diary.html`: > 1300px mỗi dòng nhật ký có khối trạng thái + nút Sửa/Xóa ở cạnh phải; ≤ 1300px khối đó xuống dòng dưới để phần mô tả không bị ép hẹp; ≤ 1120px form và danh sách xếp chồng; ≤ 760px sidebar thành drawer, thumbnail chiếm toàn chiều ngang card.

Riêng `support.html`: > 1240px lưới 3 cột (form 1.25fr + danh sách 0.85fr + panel chuyên gia 1fr); ≤ 1240px panel chiếm nguyên hàng dưới form và danh sách (2 cột); ≤ 1024px mọi khối xếp thành 1 cột; ≤ 760px sidebar thành drawer mở bằng ☰, thẻ mức độ khẩn cấp xếp dọc.

Bốn trang mới (`season.html`, `weather.html`, `ai.html`, `settings.html`) theo cùng một công thức:

- Desktop (> 1100–1200px): lưới 2 cột (cột nội dung rộng + cột phụ), sidebar 244px.
- Tablet (≤ 1100 / 1024 / 900px tuỳ trang): mọi lưới xếp thành 1 cột, form và danh sách nằm chồng nhau.
- Mobile (≤ 760px): sidebar thành drawer mở bằng ☰, topbar xuống 2 dòng, card giảm padding.
- Các khối ngang dài **không** đẩy trang cuộn ngang: `.board > *` và con của nó nhận `min-width: 0`, dải 24 giờ và biểu đồ 7 ngày có `overflow-x: auto`, bảng nhận `.table-wrap` cuộn ngang. Đã đo `scrollWidth − innerWidth` ở 1440 / 1024 / 760 / 390px trên **cả 7 trang**, cả ở cỡ chữ mặc định và cỡ chữ lớn nhất (`fs-xl`) — không trang nào tràn. Trang Nhật ký cũng phải thêm `.diary-grid > * { min-width: 0 }` vì ô tìm kiếm/scrollbar của select giữ bề rộng tối thiểu theo nội dung.

## 12. Chạy thử

```bash
python -m http.server 8000
# Đăng ký:     http://localhost:8000/register.html
# Đăng nhập:   http://localhost:8000/login.html     (nongdan / 123456)
# Quên MK:     http://localhost:8000/forgot-password.html  (mở từ link "Quên mật khẩu?")
# Trang chủ:   http://localhost:8000/index.html
# Mùa vụ:      http://localhost:8000/season.html
# Nhật ký:     http://localhost:8000/diary.html
# Thời tiết:   http://localhost:8000/weather.html
# Trợ lý AI:   http://localhost:8000/ai.html
# Hỗ trợ TK:   http://localhost:8000/support.html
# Cài đặt:     http://localhost:8000/settings.html
```

Hoặc mở trực tiếp các file `.html` bằng trình duyệt.

Bản chạy online đã bật **GitHub Pages** (Source: *Deploy from a branch*, Branch: `master`, folder: `/ (root)`):
https://daohuychien07-dotcom.github.io/BTCKcuachien/login.html — mọi đường dẫn trong repo là tương đối nên chạy đúng dưới subfolder `/BTCKcuachien/`, không cần baseurl.

## 13. Link bài nộp

| Nội dung | Link |
| --- | --- |
| Link Figma | _Điền link Figma của bạn_ |
| Link video | https://youtu.be/r-eW5GXDfPM (chi tiết trong file [`youtobe`](youtobe) — tên file yêu cầu: `CSE122-GK-SVxx-TenSinhVien-SeasonDashboard`) |
| Link web (online) | **https://daohuychien07-dotcom.github.io/BTCKcuachien/login.html** — GitHub Pages, build từ nhánh `master` / `(root)`. Gửi link có `/login.html` để người bấm thấy **trang đăng nhập** trước; link gốc `https://daohuychien07-dotcom.github.io/BTCKcuachien/` mở thẳng `index.html` (Season Dashboard), bỏ qua bước đăng nhập. |
| Link web (chạy local) | `python -m http.server 8000` trong thư mục repo rồi mở http://localhost:8000/login.html (danh sách 10 trang ở mục 12). |
| Link GitHub | https://github.com/daohuychien07-dotcom/BTCKcuachien |

## 14. Ghi chú cho phần thuyết minh

- Dữ liệu mùa vụ, thời tiết, thông báo và nhật ký là hằng số khai báo ở đầu `js/main.js` (`season`, `activities`, `notifications`), không có database.
- Chức năng "Chẩn đoán sơ bộ" **mô phỏng** kết quả AI bằng `setTimeout` và sinh điểm tin cậy ngẫu nhiên 82–96%. Ảnh người dùng **không** rời khỏi máy: `FileReader` chỉ đọc ảnh thành data URL để hiển thị trong trình duyệt.
- Trang đăng nhập **không có xác thực thật**: so sánh chuỗi với mảng `accounts` rồi chuyển hướng bằng `window.location.href`. Trang quên mật khẩu cũng **không gửi email thật** — `js/forgot.js` chỉ đổi sang trạng thái "đã gửi" sau `setTimeout`, tài khoản demo nằm trong hằng số `DEMO_ACCOUNTS`; địa chỉ email hiển thị dạng đã che (`no***@example.com`) và thông báo cố tình giống nhau cho mọi lần nhập để không lộ tài khoản nào có tồn tại.
- Trang đăng ký lưu hồ sơ vào `localStorage` (khoá `smartagri_accounts`) chỉ để demo việc chống trùng số điện thoại; dữ liệu nằm trên máy người xem, không gửi đi đâu. Khi thuyết trình cần nói rõ đây là luồng giao diện, chưa phải bảo mật.
- Trang hỗ trợ kỹ thuật (`support.html`) giữ toàn bộ yêu cầu trong mảng `requests` ở đầu `js/support.js`; 7 yêu cầu mẫu và mọi phản hồi của "chuyên gia" đều là dữ liệu dựng sẵn để demo giao diện. Gửi yêu cầu mới chỉ thêm phần tử vào mảng trong phiên hiện tại, **không** lưu và **không** gửi đi đâu — tải lại trang sẽ mất.
- Bốn trang mới dùng hằng số khai báo ở đầu file JS tương ứng, không có database: `seedSeasons` + `PHASES` (`js/season.js`), `REGIONS` + `TEMP_OFFSET` (`js/weather.js`), `DISEASES` + `CHAT_KB` (`js/ai.js`), `DEFAULTS` + `SESSIONS` (`js/settings.js`).
- `localStorage` chỉ có 5 khoá do app tạo ra: `smartagri.seasons.v1`, `smartagri.weather.region.v1`, `smartagri.ai.history.v1`, `smartagri.ai.chat.v1`, `smartagri.settings.v1` (khoá `smartagri_accounts` thuộc trang đăng ký). Trang Cài đặt liệt kê đủ 5 khoá này kèm dung lượng, cho phép xuất/nhập/xoá.
- Số liệu thời tiết là dữ liệu **mẫu sinh bằng ngẫu nhiên có seed** (`makeRand(region.seed + refreshCount)`), không gọi API thời tiết nào. Vì vậy cùng một lần tải trang thì số liệu đứng yên, bấm "Làm mới số liệu" mới đổi — giải thích được vì sao kết quả ổn định khi thuyết trình.
- "Phân tích ảnh" trên `ai.html` **mô phỏng** kết quả: suy bệnh từ từ khoá trong tên file, nếu không khớp thì dùng `hash(tên + kích thước) % 5` bệnh, điểm tin cậy 72–97%. Ảnh chỉ được đọc trong bộ nhớ bằng `URL.createObjectURL` và chỉ lưu *tên* file vào lịch sử — **không** có suy luận bệnh thật, **không** có ảnh nào rời khỏi máy.
- Lựa chọn ở tab "Giao diện" (cỡ chữ, tương phản cao, giảm hiệu ứng) có tác dụng trên **cả 7 trang trong app**: class `fs-sm`/`fs-lg`/`fs-xl`/`high-contrast`/`no-motion` định nghĩa trong `css/layout.css`, còn `js/display.js` (nạp ở `<head>` của 7 trang) đọc `smartagri.settings.v1` và gắn class đó trước khi trang được vẽ. Trang đăng nhập/đăng ký không dùng hai file này nên không đổi theo.
- Tên nông dân, mã số và thông tin liên hệ đang là dữ liệu mẫu.
