# 🎓 QuizTva Studio - Hệ Thống Trắc Nghiệm Thông Minh

## 📋 Giới Thiệu

QuizTva Studio là hệ thống tạo và quản lý bài trắc nghiệm hiện đại, được xây dựng với HTML5, CSS3 và JavaScript thuần. Giao diện đẹp mắt, responsive và dễ sử dụng.

## ✨ Tính Năng

### 🎯 Chức Năng Chính
- ✅ **Tạo Quiz**: Nhập câu hỏi và đáp án theo format đơn giản
- ✅ **Quản Lý Quiz**: Sửa, xóa, sao chép quiz dễ dàng
- ✅ **Làm Bài**: Giao diện 3 cột hiện đại với navigation grid
- ✅ **Xem Kết Quả**: Thống kê chi tiết, review đáp án
- ✅ **Dark Mode**: Chế độ tối bảo vệ mắt
- ✅ **Responsive**: Hoạt động mượt mà trên mọi thiết bị

### 🎨 Giao Diện
- **Sidebar**: Menu điều hướng đầy đủ
- **Header**: Search bar, nút tạo quiz, dark mode toggle
- **Dashboard**: Thống kê với 4 stat cards
- **Quiz Cards**: Hiển thị đẹp mắt với gradient
- **Modern Layout**: Theo phong cách EduQuiz Studio

## 🚀 Cách Sử Dụng

### Bước 1: Mở File
```
Mở file: index.html trong tr��nh duyệt
```

### Bước 2: Tạo Quiz
1. Click "Tạo đề thi" ở header hoặc sidebar
2. Nhập tên quiz và mô tả
3. Nhập câu hỏi theo format:
```
Câu 1: Thủ đô của Việt Nam là gì?
A. Hồ Chí Minh
B. Hà Nội
C. Đà Nẵng
D. Huế

Câu 2: 2 + 2 = ?
A. 3
B. 4
C. 5
D. 6
```
4. Nhập đáp án:
```
Câu 1: B
Câu 2: B
```
5. Click "Xử lý & Tạo quiz"

### Bước 3: Làm Bài
1. Vào tab "Làm Bài" hoặc click vào quiz card ở trang chủ
2. Chọn quiz từ dropdown
3. Tùy chọn xáo trộn câu hỏi
4. Click "Bắt Đầu Làm Bài"
5. Trả lời câu hỏi và nộp bài

### Bước 4: Xem Kết Quả
- Điểm số và thống kê
- Review từng câu hỏi
- Xem đáp án đúng/sai

## 📁 Cấu Trúc Files

```
Trắc Nghiệm Pro/
├── index.html              # File HTML chính (GIAO DIỆN MỚI)
├── style.css               # CSS cơ bản
├── style-modern-quiz.css   # CSS cho giao diện làm bài 3 cột
├── style-updated.css       # CSS cho layout mới
├── script.js               # JavaScript chính
├── script-modern.js        # JavaScript cho giao diện làm bài
├── script-updated.js       # JavaScript tích hợp layout mới
└── README.md              # File này
```

## 🎯 Files Cần Thiết Để Chạy

### ✅ Files BẮT BUỘC:
1. **index.html** - File HTML chính
2. **style.css** - CSS cơ bản
3. **style-modern-quiz.css** - CSS giao diện làm bài
4. **style-updated.css** - CSS layout mới
5. **script.js** - JavaScript chính (QuizManager)
6. **script-modern.js** - JavaScript giao diện làm bài
7. **script-updated.js** - JavaScript tích hợp

### 📦 Thư Viện Bên Ngoài (CDN):
- Font Awesome 6.5.1 (icons)
- Google Fonts - Inter (font chữ)

## 💾 Lưu Trữ Dữ Liệu

- **LocalStorage**: Tất cả dữ liệu được lưu trên trình duyệt
- **Không cần server**: Hoạt động offline
- **Không mất dữ liệu**: Dữ liệu được lưu vĩnh viễn (trừ khi xóa cache)

## 🎨 Tùy Chỉnh

### Thay Đổi Màu Sắc
Mở file `style-updated.css` và chỉnh sửa biến CSS:
```css
:root {
    --primary-color: #6366f1;    /* Màu chính */
    --secondary-color: #8b5cf6;  /* Màu phụ */
    --success-color: #10b981;    /* Màu thành công */
    --danger-color: #ef4444;     /* Màu nguy hiểm */
}
```

### Thay Đổi Logo
Mở file `index.html` và tìm:
```html
<i class="fas fa-graduation-cap logo-icon"></i>
<span class="logo-text">QuizTva Studio</span>
```

## 📱 Responsive Breakpoints

- **Desktop**: > 1024px - Layout đầy đủ
- **Tablet**: 768px - 1024px - Sidebar overlay
- **Mobile**: < 768px - Tối ưu hoàn toàn

## 🔧 Troubleshooting

### Giao diện không hiển thị đúng?
1. Xóa cache: `Ctrl + F5`
2. Kiểm tra console: `F12` → Console
3. Đảm bảo tất cả files CSS và JS đã load

### Sidebar không hiện?
- Click icon ☰ ở góc trái trên
- Trên mobile, sidebar tự động ẩn

### Dark mode không hoạt động?
- Click icon 🌙 ở header
- Preference được lưu trong localStorage

### Dữ liệu bị mất?
- Kiểm tra localStorage: `F12` → Application → Local Storage
- Không xóa cache trình duyệt

## 🌟 Tính Năng Nổi Bật

### 1. Giao Diện Làm Bài 3 Cột
- **Sidebar trái**: Thông tin quiz, timer, settings, progress
- **Khu vực giữa**: Hiển thị câu hỏi (từng câu một)
- **Sidebar phải**: Navigation grid với màu sắc trạng thái

### 2. Dashboard Thống Kê
- Tổng số quiz
- Số quiz đã hoàn thành
- Điểm trung bình
- Chuỗi ngày học

### 3. Quiz Cards
- Gradient background đẹp mắt
- Hover effects
- Click để làm bài ngay

### 4. Dark Mode
- Smooth transition
- Tự động lưu preference
- Màu sắc tối ưu cho cả 2 chế độ

## 🎓 Hướng Dẫn Chi Tiết

### Format Câu Hỏi
```
Câu [số]: [Nội dung câu hỏi]
A. [Đáp án A]
B. [Đáp án B]
C. [Đáp án C]
D. [Đáp án D]
```

### Format Đáp Án
Hỗ trợ nhiều format:
```
# Format 1
Câu 1: B
Câu 2: A

# Format 2
1. B
2. A

# Format 3 (đơn giản nhất)
B
A
```

## 📊 Thống Kê

- **Lines of Code**: ~3000+ dòng
- **Files**: 7 files chính
- **Technologies**: HTML5, CSS3, JavaScript ES6+
- **No Dependencies**: Không cần npm, webpack, etc.

## 🤝 Đóng Góp

Dự án được phát triển bởi **Trần Văn Anh**

## 📄 License

© 2025 QuizTva Studio. All rights reserved.

## 🎉 Cảm Ơn

Cảm ơn bạn đã sử dụng QuizTva Studio!

---

**Version**: 3.1
**Last Updated**: 2025
**Author**: Trần Văn Anh
