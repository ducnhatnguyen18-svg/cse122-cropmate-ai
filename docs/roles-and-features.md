# Vai trò & Tính năng

## Nông dân
- Quản lý mùa vụ, ghi nhật ký đồng ruộng, gửi yêu cầu hỗ trợ.
- Màn hình: Season Dashboard (R), Field Log (C/R/U), Help Request (C/R/U/D).
- AI: Field Issue Classifier (AI-1), Season Checklist Generator (AI-2).

## Chuyên gia nông nghiệp
- Review vấn đề, cung cấp tài nguyên, tóm tắt bối cảnh mùa vụ.
- Màn hình: Request Queue (R), Request Detail (C/R/U), Resource Library (C/R/U/D).
- AI: Farm Log Summarizer (AI-3).

## Điều phối HTX
- Theo dõi nông hộ và hoạt động toàn hợp tác xã.
- Màn hình: Farm Overview (R), Calendar (C/R/U), Season Summary (C/R/U/D).

## Quản trị viên
- Quản lý danh mục cây trồng và tài khoản người dùng.
- Màn hình: Dashboard (R), Crop Management (C/R/U), User Management (C/R/U/D).

## Ma trận thực thể & CRUD
| Thực thể | Tạo | Đọc | Sửa | Xóa/Lưu trữ |
|---|---:|---:|---:|---:|
| `farms` | ✓ | ✓ | ✓ | Archive |
| `fields` | ✓ | ✓ | ✓ | Archive |
| `seasons` | ✓ | ✓ | ✓ | Archive |
| `fieldLogs` | ✓ | ✓ | ✓ | Archive |
| `helpRequests` | ✓ | ✓ | ✓ | Archive |
| `resources` | ✓ | ✓ | ✓ | Archive |

> Với dữ liệu nghiệp vụ, "Xóa" có thể thay bằng Hủy / Lưu trữ / Vô hiệu hóa / Đóng khi hợp lý.
