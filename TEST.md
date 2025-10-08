# HƯỚNG DẪN KIỂM TRA CHỨC NĂNG XÁO TRỘN CÂU HỎI

## Các bước kiểm tra:

### 1. Mở file index.html trong trình duyệt

### 2. Tạo một bài quiz mẫu:
**Tab "Tạo Bài Quiz":**
- Tên: Test Quiz
- Câu hỏi:
```
Câu 1: 1 + 1 = ?
A. 1
B. 2
C. 3
D. 4

Câu 2: 2 + 2 = ?
A. 2
B. 3
C. 4
D. 5

Câu 3: 3 + 3 = ?
A. 5
B. 6
C. 7
D. 8
```

- Đáp án:
```
B
C
B
```

### 3. Kiểm tra chức năng xáo trộn:

**Bước 1:** Vào tab "Làm Bài"

**Bước 2:** Chọn quiz "Test Quiz" từ dropdown

**Bước 3:** ✅ **TICK VÀO Ô "Xáo trộn câu hỏi"** (checkbox phải hoạt động được)

**Bước 4:** Click "Bắt Đầu Làm Bài"

**Kết quả mong đợi:**
- ✅ Checkbox có thể tick được
- ✅ Khi bắt đầu làm bài, thứ tự câu hỏi sẽ được xáo trộn ngẫu nhiên
- ✅ Thông báo toast xuất hiện: "🔀 Đã xáo trộn câu hỏi!"
- ✅ Câu hỏi xuất hiện không theo thứ tự 1-2-3

### 4. Kiểm tra không xáo trộn:

**Bước 1:** Quay lại tab "Làm Bài"

**Bước 2:** Chọn quiz "Test Quiz"

**Bước 3:** ❌ **KHÔNG TICK** vào ô "Xáo trộn câu hỏi"

**Bước 4:** Click "Bắt Đầu Làm Bài"

**Kết quả mong đợi:**
- ✅ Câu hỏi xuất hiện theo thứ tự 1-2-3 như ban đầu

## Nếu checkbox không hoạt động:

1. Mở Console (F12) trong trình duyệt
2. Kiểm tra xem có lỗi JavaScript không
3. Thử refresh lại trang (Ctrl + F5)
4. Kiểm tra xem file script.js đã được load chưa

## Ghi chú:
- Checkbox "Xáo trộn câu hỏi" luôn có thể click được, không cần chọn quiz trước
- Chức năng xáo trộn chỉ áp dụng khi bắt đầu làm bài
- Mỗi lần làm bài với xáo trộn, thứ tự câu hỏi sẽ khác nhau
