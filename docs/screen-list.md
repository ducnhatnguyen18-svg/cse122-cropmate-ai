# Bảng kiểm kê màn hình (Screen Inventory)

> Bảng này phải được giảng viên duyệt TRƯỚC khi code chính thức.
> Tiêu chí: **ĐỘ ĐẦY ĐỦ NGHIỆP VỤ > SỐ LƯỢNG GIAO DIỆN.**

## Bảng theo dõi tiến độ

| Vai trò | Mục tiêu người dùng | Nhiệm vụ | Màn hình | Tệp | CRUD/Trạng thái | AI | Người phụ trách | Nhánh | PR | OBS |
|---|---|---|---|---|---|---|---|---|---|---|
| Nông dân | Theo dõi mùa vụ | Xem tổng quan | Season Dashboard | `pages/farmer-season-dashboard.html` | R | AI-2 | SV1 | | | |
| Nông dân | Ghi chép đồng ruộng | Tạo/sửa log | Field Log | `pages/farmer-field-log.html` | C/R/U | AI-1 | SV1 | | | |
| Nông dân | Nhờ hỗ trợ | Gửi/QUẢN LÝ yêu cầu | Help Request | `pages/farmer-help-request.html` | C/R/U/D | AI-1 | SV1 | | | |
| Chuyên gia | Xử lý yêu cầu | Xem hàng đợi | Request Queue | `pages/expert-request-queue.html` | R | AI-3 | SV2 | | | |
| Chuyên gia | Tư vấn | Review + phản hồi | Request Detail | `pages/expert-request-detail.html` | C/R/U | AI-3 | SV2 | | | |
| Chuyên gia | Chia sẻ tài liệu | Quản lý tài nguyên | Resource Library | `pages/expert-resource-library.html` | C/R/U/D | — | SV2 | | | |
| Điều phối | Giám sát nông hộ | Xem tổng quan | Farm Overview | `pages/coordinator-farm-overview.html` | R | — | SV3 | | | |
| Điều phối | Lên lịch | Quản lý sự kiện | Calendar | `pages/coordinator-calendar.html` | C/R/U | — | SV3 | | | |
| Điều phối | Tổng kết mùa vụ | Tạo/sửa báo cáo | Season Summary | `pages/coordinator-season-summary.html` | C/R/U/D | — | SV3 | | | |
| Admin | Giám sát hệ thống | Xem số liệu | Dashboard | `pages/admin-dashboard.html` | R | — | SV3 | | | |
| Admin | Quản lý danh mục | CRUD cây trồng | Crop Management | `pages/admin-crop-management.html` | C/R/U | — | SV3 | | | |
| Admin | Quản lý tài khoản | CRUD người dùng | User Management | `pages/admin-user-management.html` | C/R/U/D | — | SV3 | | | |

## Màn hình dùng chung (cân nhắc, không bắt buộc máy móc)
| Tệp | Mục đích | Trạng thái |
|---|---|---|
| `pages/index.html` | Trang khám phá / chọn vai trò | Chưa làm |
| `pages/login.html` | Đăng nhập (mock) | Chưa làm |
| `pages/404.html` | Không tìm thấy trang | Chưa làm |
| `pages/403.html` | Không có quyền | Chưa làm |

## Bao phủ trạng thái (checklist cho mỗi chức năng)
- [ ] Bình thường
- [ ] Đang tải (loading/skeleton)
- [ ] Rỗng (empty)
- [ ] Thành công (success toast)
- [ ] Lỗi (error)
- [ ] Vô hiệu hóa (disabled)
- [ ] Đang chờ / Bị từ chối / Hoàn thành / Đã hủy–lưu trữ (theo nghiệp vụ)

## Định nghĩa hoàn thành (DONE) cho mỗi màn hình
- [ ] Mockup Figma/Canva
- [ ] HTML ngữ nghĩa
- [ ] CSS hoàn chỉnh
- [ ] Responsive (desktop + tablet/mobile)
- [ ] Tương tác JavaScript
- [ ] Kiểm tra hợp lệ biểu mẫu
- [ ] Dữ liệu giả lập/API
- [ ] Trạng thái rỗng
- [ ] Trạng thái loading/lỗi
- [ ] Khả năng tiếp cận cơ bản
- [ ] PR được duyệt
- [ ] Merge vào `dev`
- [ ] Video OBS
- [ ] README/bảng kiểm kê cập nhật
