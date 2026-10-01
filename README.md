# CropMate AI — Nhật ký mùa vụ và trợ lý canh tác

> Học phần: **Phát triển ứng dụng Web cơ bản – CSE122**
> Loại sản phẩm: Web Frontend (nguyên mẫu) — nhiều vai trò, CRUD, responsive, tương tác JavaScript, trải nghiệm AI mô phỏng.

## 1. Giới thiệu
CropMate AI là mini-product Frontend giải quyết bài toán ghi chép mùa vụ phân tán của nông hộ nhỏ. Sản phẩm mô phỏng đầy đủ các luồng nghiệp vụ cho 4 vai trò, có 3 tính năng AI giải thích được, và dữ liệu giả lập (JSON/LocalStorage).

## 2. Vai trò
| Vai trò | Trách nhiệm chính |
|---|---|
| Nông dân | Quản lý mùa vụ và yêu cầu hỗ trợ |
| Chuyên gia nông nghiệp | Review vấn đề và cung cấp tài nguyên |
| Điều phối HTX | Theo dõi nông hộ và hoạt động |
| Quản trị viên | Quản lý danh mục và tài khoản |

## 3. Cấu trúc thư mục
```text
cropmate-ai/
├── README.md
├── docs/                 # đề xuất, vai trò, bảng kiểm kê màn hình, phân công, khai báo AI
├── design/               # link Figma + mockups
├── pages/                # các trang HTML theo vai trò
├── assets/
│   ├── images/
│   ├── icons/
│   └── data/             # JSON giả lập (farms, fields, seasons, fieldLogs, helpRequests, resources)
├── css/
│   ├── style.css         # design token + component
│   └── responsive.css
└── js/
    ├── main.js           # bootstrap, navigation, state
    ├── api.js            # module đọc/ghi dữ liệu mock
    └── modules/          # module theo tính năng (search, filter, validation, ai)
```

## 4. Bảng kiểm kê màn hình (nền tảng)
Xem chi tiết tại [`docs/screen-list.md`](docs/screen-list.md).

| # | Vai trò | Tệp | CRUD | AI |
|---:|---|---|---|---|
| 1 | Nông dân | `pages/farmer-season-dashboard.html` | R | AI-2 |
| 2 | Nông dân | `pages/farmer-field-log.html` | C/R/U | AI-1 |
| 3 | Nông dân | `pages/farmer-help-request.html` | C/R/U/D | AI-1 |
| 4 | Chuyên gia | `pages/expert-request-queue.html` | R | AI-3 |
| 5 | Chuyên gia | `pages/expert-request-detail.html` | C/R/U | AI-3 |
| 6 | Chuyên gia | `pages/expert-resource-library.html` | C/R/U/D | — |
| 7 | Điều phối | `pages/coordinator-farm-overview.html` | R | — |
| 8 | Điều phối | `pages/coordinator-calendar.html` | C/R/U | — |
| 9 | Điều phối | `pages/coordinator-season-summary.html` | C/R/U/D | — |
| 10 | Admin | `pages/admin-dashboard.html` | R | — |
| 11 | Admin | `pages/admin-crop-management.html` | C/R/U | — |
| 12 | Admin | `pages/admin-user-management.html` | C/R/U/D | — |

## 5. Tính năng AI
- **AI-1 Field Issue Classifier** — phân loại mô tả/ảnh vào nhóm vấn đề (mock).
- **AI-2 Season Checklist Generator** — tạo checklist công việc theo cây trồng/giai đoạn (mock).
- **AI-3 Farm Log Summarizer** — tóm tắt diễn biến mùa vụ cho chuyên gia (mock).

Luồng AI bắt buộc: `Nhập → Validate → Đang xử lý → Kết quả → Giải thích → Chấp nhận/Sửa/Từ chối/Tạo lại → Lưu`. Mỗi AI có trạng thái thất bại ("Không đủ dữ liệu để đưa ra đề xuất").

## 6. Quy trình Git
- Nhánh: `main` (ổn định) ← `dev` (tích hợp) ← `feature/*`, `fix/*`, `docs/*`.
- Commit theo chuẩn: `feat:`, `fix:`, `style:`, `refactor:`, `docs:`. Không dùng `update`/`done`/`final`.
- Mỗi màn hình: nhánh riêng → PR → review chéo → merge `dev` → test tích hợp → merge `main`.

## 7. Minh chứng
Mỗi màn hình đã duyệt = 1 video OBS (có mặt sinh viên), đặt tên `SV1-01-screen-name.mp4`. Link video cập nhật trong `docs/screen-list.md`.

## 8. Khai báo AI
Xem [`docs/ai-usage-report.md`](docs/ai-usage-report.md).
