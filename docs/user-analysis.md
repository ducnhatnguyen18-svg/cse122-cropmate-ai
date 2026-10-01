# Phân tích đối tượng người dùng & Xác định vai trò — CropMate AI

> Tài liệu Giai đoạn 0 (phân tích, chưa code). Chuỗi: Ngữ cảnh → Vấn đề → **Người dùng/Vai trò** → Mục tiêu → Nhiệm vụ → Luồng → Màn hình.

---

## 1. Bối cảnh sử dụng chung

- **Địa bàn:** nông thôn Việt Nam (ĐBSCL trồng lúa, miền Tây cây ăn trái, vùng rau màu/nhà kính).
- **Thiết bị:** chủ yếu **điện thoại Android**, kết nối 4G chập chờn; máy tính để bàn chỉ có ở ban điều hành HTX / văn phòng chuyên gia.
- **Điều kiện dùng:** ngoài đồng, nắng chói, tay ướt/bẩn, thời gian rảnh ngắn → cần UI tương phản cao, nút to, thao tác ít bước, ưu tiên mobile-first.
- **Ngôn ngữ:** 100% tiếng Việt, thuật ngữ nông nghiệp gần gũi.
- **Hệ quả thiết kế:** responsive bắt buộc, form ngắn, validation rõ ràng, trạng thái loading/rỗng/lỗi phải thân thiện; dữ liệu nhẹ (mock/LocalStorage) để chạy cả khi offline.

---

## 2. Phân tích từng đối tượng (Persona)

### 2.1 Nông dân / nông hộ nhỏ — *người dùng chính*
| Khía cạnh | Nội dung |
|---|---|
| Chân dung | Chủ hộ 35–60 tuổi, canh tác 0.5–3 ha lúa/vườn, ghi chép bằng sổ tay hoặc trí nhớ |
| Trình độ công nghệ | Thấp–trung bình; quen Zalo/Facebook, ngại form phức tạp |
| Thiết bị | Điện thoại Android là chính |
| Điểm đau | **P1** nhật ký phân tán; **P2** khó theo dõi việc theo giai đoạn; **P3** ảnh hiện trường lộn xộn; không biết hỏi ai khi cây bệnh |
| Nhu cầu | Ghi nhanh nhật ký đồng ruộng; biết "giờ cần làm gì" theo mùa vụ; gửi câu hỏi kèm ảnh cho chuyên gia và nhận trả lời dễ hiểu |
| Mục tiêu (user goal) | Theo dõi mùa vụ đúng lịch, phát hiện sớm vấn đề, nhận tư vấn kịp thời |
| Nhiệm vụ chính | Xem dashboard mùa vụ · Tạo/sửa nhật ký đồng ruộng · Gửi & quản lý yêu cầu hỗ trợ · Dùng AI gợi ý checklist / phân loại bệnh |

### 2.2 Chuyên gia nông nghiệp (kỹ sư trồng trọt / bảo vệ thực vật)
| Khía cạnh | Nội dung |
|---|---|
| Chân dung | Kỹ sư 28–50 tuổi, phụ trách nhiều nông hộ, có chuyên môn sâu |
| Trình độ công nghệ | Trung bình–cao; làm việc trên laptop + điện thoại |
| Điểm đau | **P4** thiếu bối cảnh khi tư vấn; câu hỏi dồn dập, trùng lặp; khó ưu tiên ca nặng |
| Nhu cầu | Hàng đợi yêu cầu có phân loại/mức ưu tiên; xem bối cảnh mùa vụ + lịch sử log của nông hộ; kho tài nguyên dùng lại; tóm tắt nhanh diễn biến |
| Mục tiêu | Phản hồi chính xác, nhanh, có căn cứ; tái sử dụng tài nguyên |
| Nhiệm vụ chính | Duyệt hàng đợi · Xem chi tiết & phản hồi yêu cầu · Quản lý thư viện tài nguyên · Dùng AI tóm tắt nhật ký (Farm Log Summarizer) |

### 2.3 Điều phối Hợp tác xã (HTX)
| Khía cạnh | Nội dung |
|---|---|
| Chân dung | Cán bộ điều hành 30–55 tuổi, quản lý hàng chục nông hộ thành viên |
| Trình độ công nghệ | Trung bình; dùng laptop ở văn phòng, dashboard tổng hợp |
| Điểm đau | Không nắm được tiến độ từng hộ; lịch thời vụ chồng chéo; thiếu báo cáo tổng kết |
| Nhu cầu | Cái nhìn tổng quan toàn HTX; lịch canh tác chung; báo cáo tổng kết mùa vụ; phát hiện hộ cần hỗ trợ |
| Mục tiêu | Điều phối hoạt động đồng bộ, đúng lịch, có số liệu báo cáo |
| Nhiệm vụ chính | Xem Farm Overview · Quản lý Calendar sự kiện/lịch thời vụ · Tạo/sửa báo cáo Season Summary |

### 2.4 Quản trị viên hệ thống
| Khía cạnh | Nội dung |
|---|---|
| Chân dung | Nhân sự vận hành nền tảng (có thể kiêm bởi điều phối) |
| Trình độ công nghệ | Cao; thao tác quản trị |
| Điểm đau | Danh mục cây trồng thiếu nhất quán; tài khoản trùng/không kiểm soát |
| Nhu cầu | Quản lý danh mục (cây trồng, giai đoạn); quản lý tài khoản & phân quyền; số liệu vận hành |
| Mục tiêu | Hệ thống sạch dữ liệu, đúng phân quyền, ổn định |
| Nhiệm vụ chính | Xem Dashboard hệ thống · CRUD danh mục cây trồng · CRUD/quản lý tài khoản người dùng |

---

## 3. Xác định vai trò (Role) trong hệ thống

Bốn persona ở trên ánh xạ 1-1 thành bốn vai trò chức năng:

| # | Vai trò (role) | Nhóm persona | Trách nhiệm cốt lõi | Phạm vi dữ liệu |
|---:|---|---|---|---|
| R1 | **Nông dân** (`farmer`) | 2.1 | Quản lý mùa vụ của chính mình & yêu cầu hỗ trợ | Chỉ farm/field/season/log/request **của mình** |
| R2 | **Chuyên gia** (`expert`) | 2.2 | Review vấn đề, cung cấp tài nguyên | Mọi helpRequest (chỉ đọc farm context), CRUD resource |
| R3 | **Điều phối HTX** (`coordinator`) | 2.3 | Theo dõi nông hộ & hoạt động toàn HTX | Đọc tổng hợp nhiều farm, calendar, summary |
| R4 | **Quản trị viên** (`admin`) | 2.4 | Quản lý danh mục & tài khoản | Toàn bộ danh mục + user |

### 3.1 Ma trận quyền hạn (gợi ý cho mock auth)
Ký hiệu: ✓ = toàn quyền · R = chỉ đọc · ∅ = không truy cập

| Thực thể | Nông dân | Chuyên gia | Điều phối | Admin |
|---|:--:|:--:|:--:|:--:|
| `farms` | R (của mình) | R (khi review) | R (toàn HTX) | ✓ |
| `fields` | ✓ (của mình) | R | R | ✓ |
| `seasons` | ✓ (của mình) | R | R | ✓ |
| `fieldLogs` | ✓ (của mình) | R | R | ✓ |
| `helpRequests` | ✓ (của mình) | R + U(phản hồi) | R | ✓ |
| `resources` | R | ✓ | R | ✓ |
| `crops` (danh mục) | R | R | R | ✓ |
| `users` | ∅ | ∅ | R | ✓ |

> Màn hình của vai trò khác → chuyển hướng `pages/403.html`. Trang không tồn tại → `pages/404.html`.

### 3.2 Quan hệ tương tác giữa các vai trò (role interaction)
```text
Nông dân ──(gửi helpRequest + ảnh)──▶ Chuyên gia
   ▲                                        │
   │◀──(phản hồi / gắn resource)────────────┘
   │
Điều phối HTX ──(giám sát farm, calendar, season summary)──▶ toàn bộ nông hộ
Admin ──(duy trì danh mục cây trồng + tài khoản)──▶ phục vụ cả 3 vai trò trên
```
AI đứng giữa hỗ trợ: AI-1 giúp Nông dân phân loại vấn đề trước khi gửi; AI-2 sinh checklist mùa vụ; AI-3 tóm tắt log cho Chuyên gia đọc nhanh.

---

## 4. Vai trò → Màn hình (bám bảng kiểm kê)

| Vai trò | Màn hình tối thiểu | Tệp |
|---|---|---|
| Nông dân | Season Dashboard · Field Log · Help Request | `farmer-*.html` |
| Chuyên gia | Request Queue · Request Detail · Resource Library | `expert-*.html` |
| Điều phối | Farm Overview · Calendar · Season Summary | `coordinator-*.html` |
| Admin | Dashboard · Crop Management · User Management | `admin-*.html` |

Chi tiết CRUD/trạng thái/AI/người phụ trách: xem [`docs/screen-list.md`](screen-list.md).
