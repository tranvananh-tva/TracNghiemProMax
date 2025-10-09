# 🚀 Hướng Dẫn Sử Dụng Tính Năng Chia Sẻ Quiz

## 📦 Cài Đặt Nhanh

### Bước 1: Cài đặt Dependencies
```bash
npm install
```

### Bước 2: Khởi động Server

**Cách 1: Dùng file .bat (Windows)**
```
Double-click vào file: start-server.bat
```

**Cách 2: Dùng npm**
```bash
npm run server
```

**Cách 3: Dùng node trực tiếp**
```bash
node server.js
```

### Bước 3: Mở Ứng Dụng
```
Mở file: index.html trong trình duyệt
```

## ✅ Kiểm Tra Nhanh

### Test 1: Kiểm tra Server
1. Mở trình duyệt
2. Vào: `http://localhost:3000/api/shared-quizzes`
3. Phải thấy: `{"success":true,"quizzes":[]}`

### Test 2: Test Chức Năng
1. Mở file: `test-share.html`
2. Click các nút test theo thứ tự
3. Tất cả phải hiển thị ✅

## 🎯 Hướng Dẫn Sử Dụng

### 1. Tạo Quiz
1. Mở `index.html`
2. Vào tab **"Tạo Bài Quiz"**
3. Nhập:
   - Tên bài quiz
   - Mô tả (tùy chọn)
   - Câu hỏi và đáp án
4. Click **"Xử lý & Tạo quiz"**

### 2. Chia Sẻ Quiz

#### Bước 1: Mở Modal Chia Sẻ
1. Vào tab **"Quản Lý Quiz"**
2. Tìm quiz muốn chia sẻ
3. Click nút **"Chia sẻ"** (màu xanh lá)

#### Bước 2: Điền Thông Tin
Modal sẽ hiện ra với các trường:

**Bắt buộc:**
- ✅ **Tên của bạn**: Tên hiển thị khi chia sẻ
- ✅ **Tên đề thi**: Tên mới cho đề thi (có thể khác tên gốc)

**Tùy chọn:**
- 📝 **Mô tả đề thi**: Mô tả ngắn gọn

**Tự động:**
- 📅 **Ngày chia sẻ**: Tự động lấy ngày hiện tại
- ⏰ **Thời gian**: Tự động lấy giờ hiện tại
- 🔢 **Số câu hỏi**: Tự động đếm từ quiz gốc

#### Bước 3: Xác Nhận
1. Kiểm tra thông tin
2. Click **"Chia Sẻ Ngay"**
3. Đợi thông báo thành công
4. Tự động chuyển sang tab **"Khám Phá Đề Thi"**

### 3. Xem Quiz Đã Chia Sẻ

1. Vào tab **"Khám Phá Đề Thi"**
2. Xem danh sách quiz được chia sẻ
3. Mỗi quiz hiển thị:
   - 📝 Tên đề thi
   - 👤 Người chia sẻ
   - 📅 Ngày chia sẻ
   - ⏰ Thời gian (tương đối)
   - 🔢 Số câu hỏi
   - 👁️ Lượt xem
   - ✍️ Lượt làm bài

### 4. Làm Bài Quiz Được Chia Sẻ

**Cách 1: Từ Card**
- Click nút **"Vào Ôn Thi"**

**Cách 2: Xem Chi Tiết Trước**
1. Click nút **"Chi tiết"**
2. Xem thông tin đầy đủ
3. Xem trước 3 câu hỏi đầu
4. Click **"Bắt Đầu Làm Bài"**

### 5. Tìm Kiếm Quiz

1. Nhập từ khóa vào ô tìm kiếm
2. Click **"Tìm kiếm"** hoặc nhấn Enter
3. Hệ thống tìm theo:
   - Tên đề thi
   - Mô tả
   - Tên người chia sẻ

## 🔑 Tính Năng Chính

### ✨ Chia Sẻ Linh Hoạt
- Đặt tên mới cho đề thi khi chia sẻ
- Viết mô tả riêng
- Bài gốc không bị thay đổi

### 🔒 Bảo Vệ Dữ Liệu
- Quiz gốc trong "Quản Lý Quiz" giữ nguyên
- Quiz chia sẻ có tên và mô tả riêng
- Không ảnh hưởng đến bài gốc

### ⏰ Tự Động Hóa
- Ngày giờ tự động
- Đếm số câu hỏi tự động
- Cập nhật thống kê tự động

### 📊 Thống Kê
- Số lượt xem
- Số lượt làm bài
- Thời gian chia sẻ

## 🐛 Xử Lý Lỗi

### Lỗi: "Không thể kết nối server"

**Nguyên nhân:** Server chưa chạy

**Giải pháp:**
```bash
# Chạy một trong các lệnh sau:
npm run server
# hoặc
node server.js
# hoặc double-click: start-server.bat
```

### Lỗi: Modal không hiện

**Nguyên nhân:** JavaScript chưa load

**Giải pháp:**
1. Mở Console (F12)
2. Reload trang (Ctrl+R)
3. Kiểm tra lỗi trong Console

### Lỗi: Nút "Chia sẻ" không hoạt động

**Kiểm tra:**
```javascript
// Mở Console (F12) và gõ:
typeof exploreQuizManager
// Phải trả về: "object"
```

**Nếu "undefined":**
1. Kiểm tra file `explore-quiz.js` đã được load
2. Reload trang
3. Xem lỗi trong Console

### Lỗi: Quiz không hiện trong "Khám Phá"

**Kiểm tra:**
1. Server có đang chạy?
2. File `shared-quizzes.json` có tồn tại?
3. Có lỗi trong Console không?

**Debug:**
```javascript
// Mở Console (F12) và gõ:
fetch('http://localhost:3000/api/shared-quizzes')
  .then(r => r.json())
  .then(d => console.log(d));
```

## 📁 Cấu Trúc File

```
Trắc Nghiệm Pro/
├── server.js                    # Backend server
├── explore-quiz.js              # Frontend logic
├── style-explore.css            # CSS cho tính năng
├── shared-quizzes.json          # Dữ liệu quiz (tự động tạo)
├── index.html                   # Ứng dụng chính
├── test-share.html              # File test
├── start-server.bat             # Script khởi động (Windows)
├── package.json                 # Dependencies
├── README_CHIA_SE.md           # File này
├── KHAC_PHUC_LOI_CHIA_SE.md    # Hướng dẫn khắc phục lỗi
└── HUONG_DAN_KHAM_PHA_DE_THI.md # Hướng dẫn chi tiết
```

## 🔧 API Endpoints

### GET /api/shared-quizzes
Lấy danh sách tất cả quiz

**Response:**
```json
{
  "success": true,
  "quizzes": [...]
}
```

### POST /api/shared-quizzes
Chia sẻ quiz mới

**Request:**
```json
{
  "quiz": {...},
  "userName": "Tên người dùng"
}
```

**Response:**
```json
{
  "success": true,
  "quiz": {...}
}
```

### GET /api/shared-quizzes/:id
Lấy chi tiết quiz (tự động tăng views)

### POST /api/shared-quizzes/:id/attempt
Tăng số lượt làm bài

### GET /api/shared-quizzes/search/:keyword
Tìm kiếm quiz

## 💡 Tips & Tricks

### Tip 1: Lưu Tên Người Dùng
- Tên được lưu tự động sau lần đầu
- Không cần nhập lại lần sau

### Tip 2: Đặt Tên Hay
- Tên rõ ràng, dễ tìm
- Mô tả ngắn gọn, súc tích

### Tip 3: Kiểm Tra Trước Khi Chia Sẻ
- Xem lại câu hỏi trong "Quản Lý Quiz"
- Đảm bảo đáp án đúng
- Kiểm tra chính tả

### Tip 4: Sử Dụng Tìm Kiếm
- Tìm theo chủ đề
- Tìm theo tên người tạo
- Tìm theo từ khóa trong mô tả

## 🎓 Ví Dụ Thực Tế

### Ví dụ 1: Chia sẻ đề thi Toán
```
Tên gốc: "Đề thi Toán lớp 10"
Tên chia sẻ: "Đề Toán 10 - Chương 1: Hàm số"
Mô tả: "Bài tập về hàm số bậc nhất và bậc hai"
Người chia sẻ: "Nguyễn Văn A"
```

### Ví dụ 2: Chia sẻ đề thi Tiếng Anh
```
Tên gốc: "English Test"
Tên chia sẻ: "TOEIC Practice - Part 5 & 6"
Mô tả: "100 câu luyện tập TOEIC phần đọc hiểu"
Người chia sẻ: "English Teacher"
```

## 📞 Hỗ Trợ

### Cần Giúp Đỡ?

1. **Đọc tài liệu:**
   - `KHAC_PHUC_LOI_CHIA_SE.md`
   - `HUONG_DAN_KHAM_PHA_DE_THI.md`

2. **Test chức năng:**
   - Mở `test-share.html`
   - Chạy các test

3. **Kiểm tra Console:**
   - Mở Console (F12)
   - Xem lỗi màu đỏ
   - Copy và tìm giải pháp

4. **Kiểm tra Server:**
   - Xem terminal đang chạy server
   - Kiểm tra log lỗi

## 🎉 Kết Luận

Tính năng chia sẻ quiz giúp:
- ✅ Tiết kiệm thời gian tạo đề
- ✅ Chia sẻ kiến thức
- ✅ Học tập cộng đồng
- ✅ Đa dạng nguồn đề thi

**Chúc bạn sử dụng vui vẻ! 🚀**

---

© Trần Văn Anh - 2025
