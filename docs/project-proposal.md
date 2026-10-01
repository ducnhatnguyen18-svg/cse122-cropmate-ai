# Đề xuất dự án — CropMate AI

## Ngữ cảnh
Nông hộ nhỏ thường ghi chép rời rạc, khó theo dõi công việc theo giai đoạn mùa vụ và thiếu dữ liệu nền khi cần nhờ chuyên gia hỗ trợ.

## Phát biểu vấn đề
- **P1.** Nhật ký mùa vụ phân tán.
- **P2.** Khó theo dõi task theo giai đoạn.
- **P3.** Ảnh hiện trường không được tổ chức.
- **P4.** Chuyên gia thiếu bối cảnh khi tư vấn.

## Mục tiêu
- **O1.** Biến bài toán thực tế thành sản phẩm Frontend có hành trình người dùng rõ ràng.
- **O2.** Thiết kế đầy đủ giao diện cho từng vai trò (mỗi vai trò ≥ 3 màn hình).
- **O3.** Thể hiện CRUD / trạng thái nghiệp vụ có ý nghĩa.
- **O4.** Dùng JavaScript/DOM cho tìm kiếm, lọc, kiểm tra hợp lệ, modal, tab, trạng thái, kết xuất dữ liệu.
- **O5.** Dùng JSON giả lập / LocalStorage / MockAPI khi phù hợp.
- **O6.** ≥ 3 trải nghiệm AI mô phỏng được ở Frontend.
- **O7.** Tổ chức làm việc nhóm bằng Trello/Notion + Git/GitHub (nhánh + PR).

## Hành trình người dùng tổng quát
```text
Khám phá / đăng nhập
→ Thực hiện nghiệp vụ chính theo vai trò
→ Xem trạng thái / dữ liệu / phản hồi
→ AI hỗ trợ phân tích hoặc gợi ý
→ Người dùng Chấp nhận / Sửa / Từ chối / Lưu
→ Vai trò vận hành duyệt / xử lý
→ Bảng điều khiển / báo cáo / hoàn tất
```

## Phạm vi MVP
- Đủ vai trò + toàn bộ màn hình theo bảng kiểm kê đã duyệt.
- Navigation xuyên suốt, responsive, CRUD mô phỏng có ý nghĩa.
- Search/filter/form validation, dữ liệu giả lập.
- ≥ 3 AI feature, minh chứng Trello/Notion, Git + nhánh + PR, OBS từng trang.
