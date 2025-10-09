# Hướng Dẫn Sử Dụng Tính Năng "Khám Phá Đề Thi"

## Tổng Quan

Tính năng "Khám Phá Đề Thi" cho phép người dùng chia sẻ các bài trắc nghiệm của mình lên hệ thống để mọi người có thể xem và làm bài. Điều này giúp tiết kiệm thời gian và tạo ra một cộng đồng chia sẻ kiến thức.

## Cài Đặt

### Bước 1: Cài đặt Dependencies

Mở terminal và chạy lệnh:

```bash
npm install
```

Lệnh này sẽ cài đặt các package cần thiết:
- express: Web framework cho Node.js
- cors: Cho phép cross-origin requests

### Bước 2: Khởi động Server

Chạy lệnh sau để khởi động server backend:

```bash
npm run server
```

Server sẽ chạy tại: `http://localhost:3000`

### Bước 3: Mở Ứng Dụng

Mở file `index.html` trong trình duyệt hoặc sử dụng Live Server.

## Cách Sử Dụng

### 1. Thiết Lập Tên Người Dùng

- Vào tab "Khám Phá Đề Thi"
- Nhập tên của bạn vào ô "Tên của bạn (để chia sẻ đề thi)"
- Tên này sẽ được lưu và hiển thị khi bạn chia sẻ đề thi

### 2. Chia Sẻ Đề Thi

**Cách 1: Từ Tab Quản Lý Quiz**
1. Vào tab "Quản Lý Quiz"
2. Tìm bài quiz bạn muốn chia sẻ
3. Click nút "Chia sẻ" (màu xanh lá)
4. Hệ thống sẽ tự động chia sẻ bài quiz lên server

**Lưu ý:**
- Đảm bảo server đang chạy
- Đảm bảo bạn đã nhập tên người dùng

### 3. Xem Đề Thi Được Chia Sẻ

1. Vào tab "Khám Phá Đề Thi"
2. Hệ thống sẽ tự động tải danh sách đề thi được chia sẻ
3. Mỗi thẻ đề thi hiển thị:
   - Tên đề thi
   - Mô tả
   - Tên người chia sẻ
   - Ngày chia sẻ
   - Thời gian đã trôi qua
   - Số câu hỏi
   - Số lượt xem
   - Số lượt làm bài

### 4. Tìm Kiếm Đề Thi

1. Nhập từ khóa vào ô tìm kiếm
2. Click nút "Tìm kiếm" hoặc nhấn Enter
3. Hệ thống sẽ tìm kiếm theo:
   - Tên đề thi
   - Mô tả
   - Tên người chia sẻ

### 5. Xem Chi Tiết Đề Thi

1. Click nút "Chi tiết" trên thẻ đề thi
2. Modal sẽ hiển thị:
   - Thông tin chi tiết đề thi
   - 3 câu hỏi đầu tiên (xem trước)
   - Các thống kê

### 6. Làm Bài Từ Đề Thi Được Chia Sẻ

**Cách 1: Từ Thẻ Đề Thi**
- Click nút "Vào Ôn Thi" tr��n thẻ đề thi

**Cách 2: Từ Modal Chi Tiết**
- Click nút "Bắt Đầu Làm Bài" trong modal chi tiết

Hệ thống sẽ:
- Tự động tăng số lượt xem
- Tăng số lượt làm bài
- Chuyển sang tab "Làm Bài" và hiển thị đề thi

### 7. Làm Mới Danh Sách

Click nút "Làm mới" để tải lại danh sách đề thi mới nhất từ server.

## Tính Năng Nổi Bật

### 1. Tự Động Cập Nhật Thời Gian
- "Vừa xong" - dưới 1 phút
- "X phút trước" - dưới 1 giờ
- "X giờ trước" - dưới 1 ngày
- "X ngày trước" - dưới 1 tuần
- "X tuần trước" - dưới 1 tháng
- "X tháng trước" - trên 1 tháng

### 2. Thống Kê Tự Động
- Số lượt xem: Tăng mỗi khi xem chi tiết
- Số lượt làm bài: Tăng mỗi khi bắt đầu làm bài

### 3. Giao Diện Thân Thiện
- Card design hiện đại
- Responsive trên mọi thiết bị
- Animation mượt mà
- Dark mode support

## Cấu Trúc Dữ Liệu

### Quiz Được Chia Sẻ
```json
{
  "id": "1234567890",
  "originalId": "original-quiz-id",
  "title": "Tên đề thi",
  "description": "Mô tả đề thi",
  "questions": [...],
  "totalQuestions": 10,
  "userName": "Tên người chia sẻ",
  "sharedAt": "2025-01-01T00:00:00.000Z",
  "views": 0,
  "attempts": 0
}
```

## API Endpoints

### GET /api/shared-quizzes
Lấy danh sách tất cả quiz được chia sẻ

### POST /api/shared-quizzes
Chia sẻ một quiz mới
```json
{
  "quiz": {...},
  "userName": "Tên người dùng"
}
```

### GET /api/shared-quizzes/:id
Lấy chi tiết một quiz (tự động tăng views)

### POST /api/shared-quizzes/:id/attempt
Tăng số lượt làm bài

### GET /api/shared-quizzes/search/:keyword
Tìm kiếm quiz theo từ khóa

### DELETE /api/shared-quizzes/:id
Xóa một quiz (cần authentication trong tương lai)

## Lưu Trữ Dữ Liệu

Dữ liệu được lưu trong file `shared-quizzes.json` tại thư mục gốc của project.

## Xử Lý Lỗi

### Lỗi: "Không thể tải danh sách đề thi"
**Nguyên nhân:** Server chưa chạy hoặc không kết nối được

**Giải pháp:**
1. Kiểm tra server đang chạy: `npm run server`
2. Kiểm tra port 3000 có bị chiếm không
3. Kiểm tra firewall

### Lỗi: "Không thể chia sẻ"
**Nguyên nhân:** Chưa nhập tên người dùng hoặc server lỗi

**Giải pháp:**
1. Nhập tên người dùng
2. Kiểm tra server logs
3. Kiểm tra dữ liệu quiz hợp lệ

## Bảo Mật

**Lưu ý:** Phiên bản hiện tại chưa có authentication. Trong tương lai cần:
- Thêm user authentication
- Chỉ cho phép người tạo xóa quiz của mình
- Rate limiting để tránh spam
- Validation dữ liệu đầu vào

## Tương Lai

Các tính năng có thể phát triển:
- [ ] User authentication
- [ ] Like/Dislike quiz
- [ ] Comment system
- [ ] Rating system
- [ ] Categories/Tags
- [ ] Advanced search filters
- [ ] Export/Import quiz
- [ ] Quiz analytics
- [ ] Leaderboard
- [ ] Social sharing

## Hỗ Trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra console log trong browser (F12)
2. Kiểm tra server logs trong terminal
3. Đảm bảo tất cả dependencies đã được cài đặt
4. Đảm bảo server đang chạy

## Tác Giả

Trần Văn Anh - 2025

---

**Chúc bạn sử dụng tính năng vui vẻ! 🎉**
