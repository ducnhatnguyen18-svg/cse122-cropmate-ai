# SmartAgri — Trang "Chi tiết yêu cầu & Tư vấn"

Bài kiểm tra giữa kỳ · Học phần **Phát triển ứng dụng Web cơ bản (CSE122)**

| Thông tin | Nội dung |
| --- | --- |
| **Tên đề tài** | SmartAgri — Nền tảng hỗ trợ nông hộ và Hợp tác xã |
| **Tên trang đã thực hiện** | Chi tiết yêu cầu & Tư vấn (role: Chuyên gia nông nghiệp) |
| **Sinh viên thực hiện** | `<HỌ VÀ TÊN>` — MSSV `<MSSV>` |
| **Link Figma** | `<DÁN LINK FIGMA VÀO ĐÂY>` |
| **Link video** | `<DÁN LINK VIDEO VÀO ĐÂY>` |
| **Link GitHub** | https://github.com/tachisama95-ux/BTCSE122_BTL-ThanhDat |
| **Chạy thử** | Mở `index.html` bằng trình duyệt (không cần server) |

---

## 1. Mục đích của trang

Trong hệ thống SmartAgri, nông hộ gửi yêu cầu hỗ trợ kèm ảnh hiện trường và nhật ký canh tác.
Trang này là **nơi làm việc của chuyên gia nông nghiệp**: đọc bối cảnh của một yêu cầu, xem AI
tóm tắt dữ liệu, rồi soạn và gửi lời khuyên kỹ thuật.

Trang trả lời ba câu hỏi của chuyên gia theo đúng thứ tự nghiệp vụ:

1. **Chuyện gì đang xảy ra?** → ảnh hiện trường, mô tả của nông dân, bản tóm tắt của AI.
2. **Dữ liệu nền ra sao?** → dòng thời gian nhật ký canh tác (bón phân, độ ẩm, mưa, triệu chứng).
3. **Tôi nên làm gì?** → khung soạn lời khuyên, đính kèm ảnh minh họa, gửi / yêu cầu bổ sung /
   chuyển tiếp chuyên gia khác.

## 2. Các chức năng chính

| # | Chức năng | Kích hoạt bằng |
| --- | --- | --- |
| 1 | Render dòng thời gian nhật ký từ mảng JavaScript | Tự chạy khi tải trang |
| 2 | AI-3 Summarizer: hiển thị khung xương (skeleton) rồi trả kết quả | Tự chạy, mô phỏng gọi AI |
| 3 | Trình soạn thảo có định dạng: đậm, đầu đề, danh sách, xóa định dạng | Nút `B`, `T`, `X`, ô "Đoạn" |
| 4 | Đếm ký tự và **form validation** (tối thiểu 20 ký tự) | Nút "Gửi tư vấn" |
| 5 | **Thay đổi trạng thái** yêu cầu: Mới → Đang tư vấn → Đã gửi | Sau khi gửi / chuyển tiếp |
| 6 | Kéo–thả hoặc chọn ảnh, kiểm tra định dạng và dung lượng ≤ 5MB, xem trước, xóa | Vùng "Kéo thả ảnh vào đây" |
| 7 | **Modal** Thư viện tài nguyên: chọn nhiều mục rồi chèn vào nội dung | Nút "Chèn tài nguyên từ Thư viện" |
| 8 | **Modal** Yêu cầu bổ sung — thêm bản ghi mới vào dòng thời gian | Nút "Yêu cầu bổ sung" |
| 9 | **Modal** Chuyển tiếp chuyên gia — validation chọn chuyên gia và lý do | Nút "Chuyển tiếp cho chuyên gia khác" |
| 10 | Trợ lý AI AgrBrain — gợi ý nội dung và chèn vào trình soạn thảo | Nút "Trợ lý AI AgrBrain" ở sidebar |
| 11 | Chuông thông báo: render danh sách từ mảng, badge số lượng, đóng khi click ra ngoài | Icon chuông trên topbar |
| 12 | Ẩn/hiện sidebar cho màn hình nhỏ | Nút hamburger |

## 3. Công nghệ sử dụng

- **HTML5** — semantic: `header`, `nav`, `main`, `section`, `article`, `aside`, `figure`, `footer`,
  form với `label` / `select` / `textarea` / `input[type=file]` / `button`.
- **CSS3** — Custom properties, Flexbox, CSS Grid, `position`, transition/hover,
  media query responsive (1180px / 1024px / 760px / 420px), `prefers-reduced-motion`.
- **JavaScript (thuần, không framework)** — `const`/`let`, function, array/object, `if/else`,
  `for`, DOM API (`querySelector`, `createElement`, `textContent`, `classList`),
  event `click` / `input` / `submit` / `change` / `dragover` / `drop`,
  `FormData`-free file reading qua `URL.createObjectURL`, `setTimeout`.
- **Không dùng**: backend, database, framework, API thật. Dữ liệu là mảng object tĩnh trong `js/main.js`.

## 4. Cấu trúc thư mục

```
BTCSE122_BTL-ThanhDat/
├── index.html          # Cấu trúc trang
├── css/
│   └── style.css       # Giao diện + responsive
├── js/
│   └── main.js         # Dữ liệu mẫu + toàn bộ tương tác
├── assets/
│   ├── logo.svg
│   └── ruong-lua-hien-truong.png
└── README.md
```

## 5. Giải thích nhanh để trình bày trong video

- **HTML**: `index.html` chia 2 vùng — `aside.sidebar` (menu) và `div.content`
  (`header.topbar` → `main.board` → `footer`). `main.board` là CSS Grid 2 cột;
  cột trái có 2 `section` (1. Bối cảnh, 2. Dòng thời gian), cột phải có 1 `section`
  (3. Soạn lời khuyên) chứa `<form>`.
- **CSS**: biến màu khai báo ở `:root` nên đổi theme chỉ sửa một chỗ.
  Layout chính dùng `grid-template-columns` ở `.board` và `.context`;
  sidebar dùng Flexbox cột. Responsive: ≤1024px sidebar thành `position: fixed`
  trượt từ trái vào (`.layout.nav-open .sidebar { transform: translateX(0) }`),
  ≤760px hai cột xếp chồng và timeline đổi sang 3 dòng.
- **JavaScript**: `js/main.js` khai báo dữ liệu dạng mảng object
  (`timelineData`, `notifications`, `libraryItems`, `experts`),
  sau đó các hàm `renderTimeline()` / `renderNotifications()` lặp mảng và
  `createElement` để vẽ giao diện. Muốn thêm bản ghi chỉ cần `addTimelineEntry()`
  rồi gọi lại `renderTimeline()`.
- **Validation**: sự kiện `submit` trên form gọi `preventDefault()`,
  đo `editor.textContent.trim().length`; nhỏ hơn 20 thì hiện `#adviceError`,
  thêm class `is-invalid` để nền đỏ, và bắn toast. Đạt thì đổi badge trạng thái
  và vô hiệu hóa nút gửi.
- **Responsive ở đâu?**: toàn bộ nằm trong mục 15 của `css/style.css`,
  còn cơ chế đóng/mở menu là `setNav()` trong `js/main.js`.
