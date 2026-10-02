# Mục tiêu · Nhiệm vụ · Luồng người dùng — CropMate AI

> Bước 1 của chuỗi phân tích: `Vai trò → Mục tiêu người dùng → Nhiệm vụ người dùng → Luồng người dùng`.
> Người dùng cụ thể (persona) xem tại `docs/user-analysis.md`.

Ký hiệu trạng thái nghiệp vụ dùng chung:
`pending` (chờ) · `in_review` (đang xử lý) · `resolved` (hoàn thành) · `rejected` (bị từ chối) · `archived` (lưu trữ) · `active`/`done` (mùa vụ).

---

## 1. NÔNG DÂN (`farmer`)

### 1.1 Mục tiêu người dùng (user goals)
- **FG1.** Nắm tiến độ mùa vụ và biết việc cần làm ở giai đoạn hiện tại.
- **FG2.** Ghi lại nhanh mọi hoạt động/sự kiện trên đồng ruộng (kèm ảnh).
- **FG3.** Nhận tư vấn kịp thời, dễ hiểu khi gặp vấn đề (sâu bệnh, dinh dưỡng, sinh lý).

### 1.2 Nhiệm vụ người dùng (user tasks)
- **FT1.** Xem tổng quan mùa vụ (dashboard) và các cảnh báo.
- **FT2.** Tạo/sửa nhật ký đồng ruộng (`fieldLogs`).
- **FT3.** Dùng AI sinh checklist công việc theo cây trồng/giai đoạn (**AI-2**).
- **FT4.** Tạo yêu cầu hỗ trợ kèm mô tả/ảnh; AI phân loại vấn đề (**AI-1**).
- **FT5.** Theo dõi trạng thái yêu cầu và đọc phản hồi của chuyên gia.
- **FT6.** Hủy/lưu trữ yêu cầu không còn cần.

### 1.3 Luồng người dùng (user flows)
**FF1 — Ghi nhật ký đồng ruộng**
```text
Season Dashboard → Field Log → [Thêm log]
→ nhập (ngày, loại hoạt động, ghi chú, ảnh) → validate
→ (nếu là sự cố) AI-1 gợi ý phân loại vấn đề
→ Lưu → toast thành công → danh sách log cập nhật
```
Trạng thái: bình thường · đang tải (lưu) · rỗng (chưa có log) · thành công · lỗi · validation.

**FF2 — Gửi yêu cầu hỗ trợ**
```text
Help Request → [Tạo yêu cầu] → nhập tiêu đề/mô tả/ảnh
→ AI-1 Field Issue Classifier: Nhập → Đang xử lý → Kết quả → Giải thích
→ Nông dân Chấp nhận / Sửa / Từ chối / Tạo lại
→ Lưu (status = pending) → hiện trong danh sách
→ Chuyên gia phản hồi → Nông dân xem phản hồi (status = in_review → resolved)
```
Trạng thái AI: đủ dữ liệu → kết quả; **thiếu dữ liệu → "Không đủ dữ liệu để đưa ra đề xuất"** (cho phép nhập thủ công).

**FF3 — Lập kế hoạch mùa vụ**
```text
Season Dashboard → chọn vụ → [AI gợi ý checklist]
→ AI-2 Season Checklist Generator: Nhập (cây trồng, giai đoạn) → Đang xử lý → Kết quả (checklist) → Giải thích
→ Chấp nhận / Sửa từng mục / Tạo lại → Lưu thành danh sách công việc
```

---

## 2. CHUYÊN GIA NÔNG NGHIỆP (`expert`)

### 2.1 Mục tiêu
- **EG1.** Nắm nhanh bối cảnh mùa vụ của nông hộ trước khi tư vấn.
- **EG2.** Xử lý yêu cầu theo mức ưu tiên, phản hồi có căn cứ.
- **EG3.** Xây dựng và tái sử dụng kho tài nguyên.

### 2.2 Nhiệm vụ
- **ET1.** Xem hàng đợi yêu cầu; tìm kiếm/lọc theo trạng thái, loại vấn đề, mức ưu tiên.
- **ET2.** Mở chi tiết yêu cầu; xem nhật ký + AI tóm tắt diễn biến (**AI-3**).
- **ET3.** Soạn phản hồi, đính kèm tài nguyên, đổi trạng thái (`in_review → resolved`/`rejected`).
- **ET4.** CRUD tài nguyên trong thư viện (`resources`).
- **ET5.** Từ chối/chuyển yêu cầu nếu ngoài chuyên môn.

### 2.3 Luồng
**EF1 — Xử lý một yêu cầu**
```text
Request Queue → tìm/lọc → chọn yêu cầu → Request Detail
→ AI-3 Farm Log Summarizer: Nhập (chọn vụ) → Đang xử lý → Tóm tắt → Giải thích → Chấp nhận/Sửa/Tạo lại
→ Đọc bối cảnh → Soạn phản hồi + gắn resource → Đổi trạng thái → Lưu
→ Nông dân nhận phản hồi
```
**EF2 — Quản lý tài nguyên**
```text
Resource Library → tìm/lọc → [Thêm tài nguyên] (form + validate)
→ Sửa / Xóa (lưu trữ) → dùng để đính kèm vào phản hồi
```
Trạng thái: hàng đợi rỗng · đang tải · lỗi · yêu cầu đã xử lý (disabled actions) · validation form.

---

## 3. ĐIỀU PHỐI HTX (`coordinator`)

### 3.1 Mục tiêu
- **CG1.** Giám sát tiến độ nhiều nông hộ thành viên.
- **CG2.** Điều phối lịch canh tác chung, tránh chồng chéo.
- **CG3.** Tổng kết/báo cáo mùa vụ bằng số liệu.

### 3.2 Nhiệm vụ
- **CT1.** Xem Farm Overview: danh sách nông hộ, trạng thái, hộ cần hỗ trợ.
- **CT2.** Quản lý Calendar: tạo/sửa sự kiện & lịch thời vụ.
- **CT3.** Tạo/sửa/lưu trữ Season Summary (báo cáo tổng kết).
- **CT4.** Phát hiện hộ cần hỗ trợ để điều phối chuyên gia.

### 3.3 Luồng
**CF1 — Giám sát nông hộ**
```text
Farm Overview → lọc theo khu vực/trạng thái → chọn hộ → xem chi tiết mùa vụ + log + yêu cầu tồn đọng
```
**CF2 — Lên lịch canh tác**
```text
Calendar → [Thêm sự kiện] (ngày, nông hộ, loại công việc) → validate → Lưu → hiển thị trên lịch
→ Sửa / Hủy sự kiện
```
**CF3 — Tổng kết mùa vụ**
```text
Season Summary → chọn vụ → [Tạo báo cáo] (số log, số yêu cầu, năng suất, vấn đề nổi bật)
→ Sửa → Lưu / Lưu trữ / Xuất
```
Trạng thái: overview rỗng · đang tải dữ liệu tổng hợp · lịch trống · báo cáo đang chờ/hoàn thành · lỗi.

---

## 4. QUẢN TRỊ VIÊN (`admin`)

### 4.1 Mục tiêu
- **AG1.** Duy trì danh mục cây trồng/giai đoạn nhất quán.
- **AG2.** Quản lý tài khoản và phân quyền.
- **AG3.** Giám sát số liệu vận hành hệ thống.

### 4.2 Nhiệm vụ
- **AT1.** Xem Dashboard hệ thống (thống kê người dùng, yêu cầu, danh mục).
- **AT2.** CRUD danh mục cây trồng (`crops`).
- **AT3.** CRUD / kích hoạt–vô hiệu hóa tài khoản (`users`).

### 4.3 Luồng
**AF1 — Quản lý danh mục**
```text
Crop Management → tìm/lọc → [Thêm cây trồng] (form + validate) → Sửa → Vô hiệu hóa/Lưu trữ
```
**AF2 — Quản lý tài khoản**
```text
User Management → lọc theo vai trò/trạng thái → [Thêm tài khoản] → phân quyền → Vô hiệu hóa / Xóa (lưu trữ)
```
Trạng thái: danh sách rỗng · đang tải · trùng dữ liệu (lỗi validation) · thành công · tài khoản bị vô hiệu hóa.

---

## 5. Luồng dùng chung (mọi vai trò)
```text
index.html (khám phá) → login.html (chọn vai trò) → dashboard vai trò
→ điều hướng sidebar (nav.js) → [trang của vai trò khác = 403] → đăng xuất → login
```
