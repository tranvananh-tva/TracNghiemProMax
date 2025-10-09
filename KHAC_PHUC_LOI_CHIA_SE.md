# 🔧 Hướng Dẫn Khắc Phục Lỗi Chia Sẻ Quiz

## 📋 Checklist Kiểm Tra

### 1. Kiểm Tra Server
```bash
# Mở terminal và chạy:
cd "e:\Trắc Nghiệm Pro"
npm run server
```

**Kết quả mong đợi:**
```
🚀 Server đang chạy tại http://localhost:3000
📚 API endpoint: http://localhost:3000/api/shared-quizzes
```

**Nếu lỗi:**
- ❌ `npm: command not found` → Cài đặt Node.js
- ❌ `Cannot find module 'express'` → Chạy `npm install`
- ❌ `Port 3000 already in use` → Đổi port hoặc tắt ứng dụng đang dùng port 3000

### 2. Kiểm Tra File Cần Thiết

Đảm bảo các file sau tồn tại:
- ✅ `server.js` - Backend server
- ✅ `explore-quiz.js` - Frontend logic
- ✅ `style-explore.css` - CSS cho tính năng
- ✅ `shared-quizzes.json` - File lưu dữ liệu (tự động tạo)
- ✅ `package.json` - Dependencies

### 3. Test Chức Năng

**Bước 1: Mở file test**
```
Mở file: test-share.html trong trình duyệt
```

**Bước 2: Chạy các test theo thứ tự**
1. Click "Test Server Connection" → Phải thấy ✅
2. Click "Tạo Quiz Mẫu" → Phải thấy ✅
3. Click "Chia Sẻ Quiz" → Phải thấy ✅
4. Click "Lấy Danh Sách" → Phải thấy quiz vừa chia sẻ

### 4. Test Trên Ứng Dụng Chính

**Bước 1: Tạo Quiz**
1. Mở `index.html`
2. Vào tab "Tạo Bài Quiz"
3. Nhập thông tin và tạo quiz

**Bước 2: Chia Sẻ Quiz**
1. Vào tab "Quản Lý Quiz"
2. Click nút "Chia sẻ" (màu xanh lá)
3. Modal sẽ hiện ra
4. Điền thông tin:
   - Tên của bạn
   - Tên đề thi (có thể sửa)
   - Mô tả (tùy chọn)
5. Click "Chia Sẻ Ngay"

**Bước 3: Xem Quiz Đã Chia Sẻ**
1. Vào tab "Khám Phá Đề Thi"
2. Phải thấy quiz vừa chia sẻ

## 🐛 Các Lỗi Thường Gặp

### Lỗi 1: Modal không hiện
**Nguyên nhân:** JavaScript chưa load
**Giải pháp:**
1. Mở Console (F12)
2. Kiểm tra lỗi JavaScript
3. Đảm bảo file `explore-quiz.js` đã được load

### Lỗi 2: "Không thể kết nối server"
**Nguyên nhân:** Server chưa chạy
**Giải pháp:**
```bash
npm run server
```

### Lỗi 3: Nút "Chia sẻ" không hoạt động
**Nguyên nhân:** Function chưa được ��ịnh nghĩa
**Giải pháp:**
1. Mở Console (F12)
2. Gõ: `typeof exploreQuizManager`
3. Phải trả về "object"
4. Nếu "undefined" → Reload trang

### Lỗi 4: Quiz không hiện trong "Khám Phá"
**Nguyên nhân:** 
- Server chưa chạy
- Lỗi khi lưu dữ liệu

**Giải pháp:**
1. Kiểm tra file `shared-quizzes.json`
2. Phải có dữ liệu quiz
3. Nếu rỗng `[]` → Chia sẻ lại

### Lỗi 5: CORS Error
**Nguyên nhân:** Trình duyệt chặn request
**Giải pháp:**
- Server đã có CORS enabled
- Nếu vẫn lỗi, dùng extension "CORS Unblock"

## 🔍 Debug Chi Tiết

### Kiểm Tra Console
Mở Console (F12) và kiểm tra:

```javascript
// 1. Kiểm tra exploreQuizManager
console.log(exploreQuizManager);

// 2. Kiểm tra quizManager
console.log(quizManager);

// 3. Kiểm tra quizzes trong localStorage
console.log(JSON.parse(localStorage.getItem('quizzes')));

// 4. Test API trực tiếp
fetch('http://localhost:3000/api/shared-quizzes')
  .then(r => r.json())
  .then(d => console.log(d));
```

### Kiểm Tra Network
1. Mở tab Network (F12)
2. Click "Chia sẻ"
3. Xem request đến `/api/shared-quizzes`
4. Kiểm tra:
   - Status: Phải là 200
   - Response: Phải có `success: true`

## 📝 Log Lỗi

Nếu vẫn gặp lỗi, thu thập thông tin sau:

1. **Console Errors:**
   - Mở Console (F12)
   - Copy tất cả lỗi màu đỏ

2. **Network Errors:**
   - Mở tab Network (F12)
   - Click request bị lỗi
   - Copy Response

3. **Server Logs:**
   - Xem terminal đang chạy server
   - Copy log lỗi

## ✅ Kiểm Tra Hoàn Chỉnh

Sau khi sửa lỗi, test lại toàn bộ flow:

1. ✅ Server chạy thành công
2. ✅ Tạo quiz thành công
3. ✅ Modal chia sẻ hiện ra
4. ✅ Điền form và submit thành công
5. ✅ Chuyển sang tab "Khám Phá"
6. ✅ Thấy quiz vừa chia sẻ
7. ✅ Click "Vào Ôn Thi" hoạt động
8. ✅ Làm bài thành công

## 🆘 Cần Hỗ Trợ?

Nếu vẫn gặp vấn đề:

1. Chạy file `test-share.html`
2. Chụp màn hình kết quả
3. Copy log từ Console
4. Copy log từ Server terminal

---

**Lưu ý:** Đảm bảo server luôn chạy khi sử dụng tính năng chia sẻ!
