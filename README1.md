# Danh Sách Các Chức Năng Còn Thiếu (Cần Bổ Sung)

Dưới đây là danh sách các chức năng còn thiếu của hệ thống quản lý sự kiện (PBL5-YouthBK) cần được hoàn thiện và phát triển thêm để đáp ứng đầy đủ yêu cầu của một hệ thống thực tế:

## 1. 🌟 Tính năng Dành cho Sinh viên (Người dùng cuối)

### 1.1. Đánh giá và Phản hồi Sự kiện (Event Feedback & Rating)
- **Mô tả:** Sau khi sự kiện kết thúc (và đã điểm danh), sinh viên có thể đánh giá (1-5 sao) và để lại nhận xét.
- **Lợi ích:** Giúp Ban tổ chức (BTC) rút kinh nghiệm cho các sự kiện sau.

### 1.2. Tích hợp Lịch Cá nhân (Google Calendar Integration)
- **Mô tả:** Thêm nút "Thêm vào Google Calendar" hoặc sinh file `.ics` khi sinh viên đăng ký thành công.
- **Lợi ích:** Nhắc nhở sinh viên tham gia, tránh tình trạng quên sự kiện.

### 1.3. Gợi ý Sự kiện Thông minh (Event Recommendations)
- **Mô tả:** Gợi ý sự kiện sắp diễn ra dựa trên khoa/chuyên ngành của sinh viên hoặc lịch sử các loại sự kiện mà sinh viên đã tham gia.

### 1.4. Bảng Xếp Hạng & Huy Hiệu (Leaderboard & Gamification)
- **Mô tả:** Vinh danh các sinh viên hoặc Chi đoàn tham gia tích cực nhất trong tháng/học kỳ. Cấp huy hiệu ảo (Top Volunteer, Active Member).

---

## 2. 📊 Tính năng Dành cho Đoàn trường / Ban Tổ Chức (Admin)

### 2.1. Quản lý Điểm rèn luyện (Training Points Management)
- **Mô tả:** Mỗi sự kiện có một mức "Điểm rèn luyện" quy định. Hệ thống tự động tổng hợp điểm rèn luyện của sinh viên sau mỗi học kỳ.
- **Lợi ích:** Giải quyết triệt để bài toán tính điểm rèn luyện thủ công vào cuối kỳ.

### 2.2. Điểm danh qua quét mã QR (QR Code Attendance)
- **Mô tả:** 
  - Mỗi sự kiện sẽ sinh ra một mã QR động (hoặc mỗi sinh viên có mã QR cá nhân).
  - BTC dùng điện thoại quét mã tại cửa sự kiện để điểm danh trong vòng 1 giây.
- **Lợi ích:** Nhanh chóng, chống gian lận, không ùn tắc khi đông người.

### 2.3. Báo cáo & Xuất dữ liệu nâng cao (Advanced Export)
- **Mô tả:** Bổ sung tính năng xuất danh sách điểm danh, thống kê sinh viên, tổng điểm rèn luyện ra định dạng Excel (`.xlsx`) hoặc CSV để dễ dàng thao tác tính toán ở ngoài hệ thống.

### 2.4. Quản lý Ngân sách / Tài trợ sự kiện
- **Mô tả:** Thêm module nhỏ để BTC kê khai dự trù kinh phí sự kiện, ghi chú các khoản tài trợ.

---

## 3. ⚙️ Tính năng Hệ thống & Core Backend

### 3.1. Tích hợp Gửi Email (Nodemailer)
- **Mô tả:** Tự động gửi Email:
  - Khi sinh viên đăng ký thành công.
  - Nhắc nhở trước sự kiện 24h.
  - Đính kèm file PDF Chứng nhận tự động gửi thẳng vào Email sau khi sự kiện kết thúc.

### 3.2. Đăng nhập bằng Google / Microsoft (OAuth 2.0)
- **Mô tả:** Cho phép sinh viên đăng nhập nhanh bằng email trường (VD: `@sv.dut.udn.vn` hoặc `@dut.udn.vn`).
- **Lợi ích:** Tránh việc phải quản lý password, tăng tính bảo mật và nhanh chóng.

### 3.3. Job Scheduler (Cron Jobs)
- **Mô tả:** Cài đặt các tác vụ tự động chạy ngầm (ví dụ sử dụng thư viện `node-cron`):
  - Tự động chuyển trạng thái sự kiện từ "Upcoming" sang "Ongoing" và "Completed".
  - Tự động phát thông báo hàng ngày.

---
**Tóm lại:** Nếu bạn muốn dự án trở nên ấn tượng và có thể mang đi demo đạt điểm cao, tính năng **Điểm danh qua quét QR**, **Quản lý điểm rèn luyện** và **Đăng nhập bằng Email Trường** sẽ là 3 tính năng có sức nặng nhất nên ưu tiên phát triển tiếp theo!
