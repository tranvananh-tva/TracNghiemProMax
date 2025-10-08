# 📚 Hướng Dẫn Sử Dụng AI Tạo Quiz Từ File

## 🎯 Tính Năng

Hệ thống AI có thể tự động tạo câu hỏi trắc nghiệm từ:
- 📄 File Word (.docx)
- 📄 File Text (.txt)
- 📄 File PDF (.pdf) - đang phát triển
- ⌨️ Nội dung dán trực tiếp

## 🚀 Cách Sử Dụng

### Bước 1: Vào Tab AI Tạo Quiz
1. Mở ứng dụng QuizTva Studio
2. Click vào menu **"AI Tạo Quiz"** bên trái
3. Hoặc click nút **"AI Tạo Quiz"** trên thanh menu

### Bước 2: Tải File Hoặc Nhập Nội Dung

#### Cách 1: Tải File
1. Click vào nút **"Chọn File"**
2. Hoặc kéo thả file vào vùng upload
3. Chọn file Word (.docx) hoặc Text (.txt)
4. Hệ thống sẽ tự động đọc và hiển thị nội dung

#### Cách 2: Dán Nội Dung Trực Tiếp
1. Copy nội dung bài học từ Word/PDF/Web
2. Click nút **"Dán"** hoặc nhấn Ctrl+V
3. Nội dung sẽ được dán vào ô textarea

### Bước 3: Chọn Số Lượng Câu Hỏi
- Mặc định: 10 câu
- Tối thiểu: 5 câu
- Tối đa: 50 câu
- AI sẽ cố gắng tạo đủ số câu (tùy độ dài nội dung)

### Bước 4: Tạo Quiz
1. Click nút **"Tạo Quiz Bằng AI"**
2. Đợi AI phân tích (khoảng 2-3 giây)
3. Xem trước các câu hỏi đã tạo

### Bước 5: Chỉnh Sửa (Tùy Chọn)
1. Click nút **"Chỉnh Sửa"**
2. Click vào câu hỏi hoặc đáp án để sửa
3. Click vào đáp án để chọn đáp án đúng

### Bước 6: Lưu Quiz
1. Nhập tên cho quiz
2. Click nút **"Lưu Quiz"**
3. Quiz sẽ được lưu vào danh sách

## 📝 Ví Dụ Nội Dung

### Nội dung tốt để tạo quiz:

```
Việt Nam là một quốc gia nằm ở Đông Nam Á. Thủ đô của Việt Nam là Hà Nội. 
Việt Nam có diện tích khoảng 331.212 km² và dân số khoảng 98 triệu người. 
Việt Nam có 63 tỉnh thành.

Lịch sử Việt Nam có nhiều giai đoạn quan trọng. Năm 1945, Chủ tịch Hồ Chí Minh 
đọc Tuyên ngôn Độc lập, khai sinh nước Việt Nam Dân chủ Cộng hòa. 
Năm 1975, đất nước thống nhất.

Kinh tế Việt Nam phát triển nhanh. Việt Nam là nước xuất khẩu gạo lớn thứ 3 
thế giới. Việt Nam cũng xuất khẩu cà phê, hạt điều, và nhiều nông sản khác.
```

### AI sẽ tạo các câu hỏi như:

**Câu 1:** Thủ đô của Việt Nam là gì?
- A. Hà Nội ✅
- B. Hồ Chí Minh
- C. Đà Nẵng
- D. Huế

**Câu 2:** Việt Nam có bao nhiêu tỉnh thành?
- A. 63 ✅
- B. 62
- C. 64
- D. 126

**Câu 3:** Năm nào Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập?
- A. 1945 ✅
- B. 1944
- C. 1946
- D. 1890

## ✅ Lưu Ý Quan Trọng

### Nội dung nên có:
- ✅ Thông tin rõ ràng, cụ thể
- ✅ Có số liệu, tên riêng
- ✅ Có định nghĩa, khái niệm
- ✅ Độ dài ít nhất 100 ký tự
- ✅ Nhiều câu văn khác nhau

### Nội dung không nên:
- ❌ Quá ngắn (dưới 100 ký tự)
- ❌ Chỉ có tiêu đề, không có nội dung
- ❌ Toàn ký tự đặc biệt
- ❌ Không có thông tin cụ thể

## 🔧 Xử Lý Lỗi

### Lỗi: "Không thể đọc file Word"
**Giải pháp:**
1. Đảm bảo file là định dạng .docx (không phải .doc)
2. Thử mở file Word và Save As → chọn .docx
3. Hoặc copy nội dung và dán trực tiếp

### Lỗi: "Font chữ bị lỗi"
**Giải pháp:**
1. Đảm bảo có kết nối Internet (để load thư viện JSZip)
2. Refresh lại trang
3. Thử copy-paste thay vì upload file

### Lỗi: "Nội dung quá ngắn"
**Giải pháp:**
1. Thêm nhiều nội dung hơn (ít nhất 100 ký tự)
2. Thêm chi tiết, ví dụ cụ thể
3. Giảm số lượng câu hỏi muốn tạo

### Lỗi: "Không tạo được câu hỏi"
**Giải pháp:**
1. Kiểm tra nội dung có thông tin cụ thể không
2. Thêm số liệu, định nghĩa rõ ràng
3. Viết lại nội dung dễ hiểu hơn

## 💡 Mẹo Sử Dụng

### 1. Chuẩn bị nội dung tốt:
- Viết rõ ràng, có cấu trúc
- Mỗi đoạn nên có 1 ý chính
- Có số liệu, ví dụ cụ thể

### 2. Chọn số câu hỏi phù hợp:
- Nội dung ngắn (< 500 từ): 5-10 câu
- Nội dung trung bình (500-1000 từ): 10-20 câu
- Nội dung dài (> 1000 từ): 20-50 câu

### 3. Kiểm tra và chỉnh sửa:
- Luôn xem trước câu hỏi trước khi lưu
- Sửa lại câu hỏi không rõ ràng
- Kiểm tra đáp án đúng

### 4. Đặt tên quiz dễ nhớ:
- Ví dụ: "Lịch sử Việt Nam - Chương 1"
- Ví dụ: "Địa lý Việt Nam - Bài 5"
- Ví dụ: "Toán học - Phương trình bậc 2"

## 🎓 Ví Dụ Thực Tế

### Ví dụ 1: Môn Lịch Sử
**Nội dung:**
```
Cách mạng tháng Tám năm 1945 là cuộc cách mạng giải phóng dân tộc của nhân dân 
Việt Nam. Ngày 2/9/1945, Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập tại Quảng 
trường Ba Đình, Hà Nội, khai sinh nước Việt Nam Dân chủ Cộng hòa.
```

**Câu hỏi AI tạo:**
- Cách mạng tháng Tám diễn ra năm nào?
- Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập ở đâu?
- Tên nước sau Cách mạng tháng Tám là gì?

### Ví dụ 2: Môn Địa Lý
**Nội dung:**
```
Việt Nam có hình chữ S, nằm ở Đông Nam Á. Việt Nam giáp Trung Quốc ở phía Bắc, 
Lào và Campuchia ở phía Tây, Biển Đông ở phía Đông và Nam. Diện tích Việt Nam 
là 331.212 km².
```

**Câu hỏi AI tạo:**
- Việt Nam có hình dạng như thế nào?
- Việt Nam giáp nước nào ở phía Bắc?
- Diện tích Việt Nam là bao nhiêu?

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Đọc phần "Xử Lý Lỗi" ở trên
2. Kiểm tra file TEST_FONT_CHU.html để test
3. Xem file FIX_FONT_CHU_AI_FILE.md để biết chi tiết kỹ thuật

---

**Chúc bạn tạo quiz thành công! 🎉**
