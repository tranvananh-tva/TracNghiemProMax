# KHẮC PHỤC LỖI LOGO KHÔNG HIỂN THỊ SAU KHI TẢI LÊN GIT

## Nguyên nhân

Logo không hiển thị sau khi tải code lên Git thường do một trong các lý do sau:

### 1. **Thư mục logo/ chưa được commit lên Git**
Đây là nguyên nhân phổ biến nhất. Git không tự động theo dõi các file trong thư mục mới.

### 2. **File logo.png bị gitignore**
File có thể bị loại trừ do cấu hình .gitignore

### 3. **Thư mục rỗng không được Git theo dõi**
Git không theo dõi thư mục rỗng, chỉ theo dõi file

## Cách kiểm tra

### Bước 1: Kiểm tra xem file logo đã được commit chưa
```bash
git ls-files logo/
```

Nếu không có kết quả trả về → File chưa được commit

### Bước 2: Kiểm tra trạng thái Git
```bash
git status
```

Xem file logo có trong danh sách "Untracked files" không

### Bước 3: Kiểm tra .gitignore
```bash
git check-ignore -v logo/logo.png
```

Nếu có kết quả → File đang bị gitignore

## Giải pháp

### Giải pháp 1: Thêm file logo vào Git (KHUYẾN NGHỊ)

```bash
# Thêm toàn bộ thư mục logo
git add logo/

# Hoặc thêm cụ thể file logo.png
git add logo/logo.png

# Commit thay đổi
git commit -m "Thêm logo vào dự án"

# Đẩy lên Git
git push origin main
```

### Giải pháp 2: Nếu file bị gitignore

Mở file `.gitignore` và kiểm tra xem có dòng nào chặn file logo không:
- `*.png` → Chặn tất cả file PNG
- `logo/` → Chặn thư mục logo
- `logo.png` → Chặn file logo.png

**Cách sửa:**
1. Xóa dòng đó trong `.gitignore`
2. Hoặc thêm ngoại lệ:
```
# Trong .gitignore
*.png
!logo/logo.png  # Cho phép logo.png
```

3. Sau đó thêm file:
```bash
git add logo/logo.png -f
git commit -m "Thêm logo"
git push origin main
```

### Giải pháp 3: Nếu đã commit nhưng vẫn không hiển thị

Có thể file đã bị xóa khỏi Git trước đó. Kiểm tra:
```bash
git log --all --full-history -- logo/logo.png
```

Nếu file đã bị xóa, thêm lại:
```bash
git add logo/logo.png
git commit -m "Khôi phục logo"
git push origin main
```

## Kiểm tra sau khi sửa

### Trên máy local:
```bash
git ls-files logo/
```
Phải thấy: `logo/logo.png`

### Trên GitHub/GitLab:
1. Vào repository trên web
2. Kiểm tra xem thư mục `logo/` có tồn tại không
3. Kiểm tra xem file `logo.png` có trong đó không

### Trên website đã deploy:
1. Mở Developer Tools (F12)
2. Vào tab Network
3. Reload trang
4. Tìm request đến `logo/logo.png`
5. Kiểm tra status code:
   - **200**: File tải thành công
   - **404**: File không tìm thấy → Chưa được deploy đúng
   - **403**: Không có quyền truy cập

## Lưu ý quan trọng

### 1. Đường dẫn trong code
Trong file `index.html`, logo được sử dụng như sau:
```html
<link rel="icon" type="image/png" href="logo/logo.png">
<img src="logo/logo.png" alt="User Avatar">
```

Đảm bảo đường dẫn này đúng với cấu trúc thư mục trên server.

### 2. Phân biệt hoa thường
- Trên Windows: `Logo/logo.png` = `logo/logo.png`
- Trên Linux/Server: `Logo/logo.png` ≠ `logo/logo.png`

Đảm bảo tên thư mục và file đúng chính xác.

### 3. Kích thước file
File logo.png hiện tại: ~278 KB
Nếu quá lớn, có thể bị chặn bởi một số hosting. Nên tối ưu xuống < 100 KB.

## Các lệnh hữu ích

```bash
# Xem tất cả file đã được Git theo dõi
git ls-files

# Xem file nào đang bị gitignore
git status --ignored

# Force add file bị gitignore
git add -f logo/logo.png

# Xem lịch sử của file logo
git log -- logo/logo.png

# Kiểm tra file có trong commit cuối cùng không
git ls-tree -r HEAD --name-only | grep logo
```

## Quy trình khuyến nghị

1. **Kiểm tra file tồn tại local:**
   ```bash
   dir logo
   ```

2. **Thêm vào Git:**
   ```bash
   git add logo/logo.png
   ```

3. **Commit:**
   ```bash
   git commit -m "Thêm logo cho ứng dụng"
   ```

4. **Push lên remote:**
   ```bash
   git push origin main
   ```

5. **Xác nhận trên GitHub:**
   - Vào repository
   - Kiểm tra thư mục logo/
   - Click vào logo.png để xem

6. **Test trên website:**
   - Deploy lại nếu cần
   - Kiểm tra logo hiển thị

## Nếu vẫn không được

Hãy chạy các lệnh sau và gửi kết quả:
```bash
git ls-files logo/
git status
git log --oneline -5
```

Hoặc kiểm tra:
- URL của repository Git
- Nền tảng hosting (GitHub Pages, Netlify, Vercel, etc.)
- Console log trong trình duyệt (F12 → Console)
