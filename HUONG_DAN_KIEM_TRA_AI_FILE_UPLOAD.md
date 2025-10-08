# Hướng Dẫn Kiểm Tra Chức Năng AI File Upload

## Vấn Đề Đã Phát Hiện

Người dùng báo cáo rằng chưa thể ấn vào nút "Tải file lên" trong phần AI tạo quiz.

## Nguyên Nhân

Vấn đề nằm ở việc khởi tạo `AIFileHandler`. Cần đảm bảo:
1. `QuizManager` được khởi tạo
2. `AIQuizGenerator` được khởi tạo thông qua `loadAISettings()`
3. `AIFileHandler` được khởi tạo bên trong `AIQuizGenerator`

## Các Thay Đổi Đã Thực Hiện

### 1. File `script.js`
Đã thêm dòng gọi `loadAISettings()` trong constructor của `QuizManager`:

```javascript
constructor() {
    // ... code khác ...
    
    // Initialize AI Generator after DOM is ready
    setTimeout(() => {
        this.loadAISettings();
    }, 100);
}
```

### 2. File `ai-file-handler.js`
Đã thêm console.log để debug và kiểm tra khởi tạo:

```javascript
AIQuizGenerator.prototype.initializeAIListeners = function() {
    // Call original init
    if (originalInit) {
        originalInit.call(this);
    }
    
    // Initialize file handler
    console.log('Initializing AIFileHandler...');
    this.fileHandler = new AIFileHandler(this);
    console.log('AIFileHandler initialized successfully');
};
```

## Cách Kiểm Tra

### Phương Pháp 1: Sử Dụng File Test
1. Mở file `test-ai-file-upload.html` trong trình duyệt
2. Kiểm tra các mục sau:
   - ✓ Tất cả các class đã load (QuizManager, AIQuizGenerator, AIFileHandler)
   - ✓ Các element HTML tồn tại (chỉ có trong index.html)
   - ✓ Khởi tạo thành công

### Phương Pháp 2: Kiểm Tra Trực Tiếp Trên index.html
1. Mở file `index.html` trong trình duyệt
2. Mở Developer Tools (F12)
3. Chuyển sang tab Console
4. Kiểm tra các log sau:
   ```
   Initializing AIFileHandler...
   AIFileHandler initialized successfully
   ```

5. Kiểm tra trong Console bằng lệnh:
   ```javascript
   // Kiểm tra quizManager
   console.log('quizManager:', quizManager);
   
   // Kiểm tra aiGenerator
   console.log('aiGenerator:', quizManager.aiGenerator);
   
   // Kiểm tra fileHandler
   console.log('fileHandler:', quizManager.aiGenerator.fileHandler);
   ```

6. Chuyển sang tab "AI Tạo Quiz"
7. Th�� các thao tác sau:
   - Click vào nút "Chọn File"
   - Kéo thả file vào vùng upload
   - Click vào vùng upload

### Phương Pháp 3: Kiểm Tra Event Listeners
Trong Console, chạy lệnh sau để kiểm tra event listeners:

```javascript
// Kiểm tra nút "Chọn File"
const selectBtn = document.getElementById('select-file-btn');
console.log('Select button:', selectBtn);
console.log('Has click listener:', getEventListeners(selectBtn));

// Kiểm tra file input
const fileInput = document.getElementById('ai-file-input');
console.log('File input:', fileInput);
console.log('Has change listener:', getEventListeners(fileInput));

// Kiểm tra upload area
const uploadArea = document.getElementById('file-upload-area');
console.log('Upload area:', uploadArea);
console.log('Has listeners:', getEventListeners(uploadArea));
```

## Các Tính Năng Upload File

### 1. Click Nút "Chọn File"
- Nút có id: `select-file-btn`
- Khi click sẽ mở hộp thoại chọn file

### 2. Kéo Thả File (Drag & Drop)
- Kéo file vào vùng có id: `file-upload-area`
- Thả file để upload

### 3. Click Vào Vùng Upload
- Click vào vùng upload cũng sẽ mở hộp thoại chọn file

### 4. Các Loại File Được Hỗ Trợ
- `.txt` - Text file (hỗ trợ đầy đủ)
- `.doc`, `.docx` - Word file (hỗ trợ cơ bản)
- `.pdf` - PDF file (chưa hỗ trợ đầy đủ, cần thư viện)

### 5. Gi��i Hạn
- Kích thước tối đa: 10MB
- Chỉ chấp nhận các định dạng được liệt kê ở trên

## Xử Lý Lỗi

### Lỗi: "File không được hỗ trợ"
- Nguyên nhân: File không phải là .txt, .doc, .docx, hoặc .pdf
- Giải pháp: Chọn file đúng định dạng

### Lỗi: "File quá lớn"
- Nguyên nhân: File > 10MB
- Giải pháp: Chọn file nhỏ hơn hoặc copy nội dung và dán trực tiếp

### Lỗi: "Không thể đọc nội dung file"
- Nguyên nhân: File bị lỗi hoặc định dạng không chuẩn
- Giải pháp: Copy nội dung từ file và dán vào ô "Nhập nội dung trực tiếp"

### Lỗi: Nút không click được
- Nguyên nhân: AIFileHandler chưa được khởi tạo
- Giải pháp: 
  1. Refresh trang (F5)
  2. Kiểm tra Console có lỗi không
  3. Chạy lệnh: `quizManager.loadAISettings()` trong Console

## Kiểm Tra Thủ Công

Nếu vẫn gặp vấn đề, thử các bước sau:

1. **Kiểm tra thứ tự load script trong index.html:**
   ```html
   <script src="script.js"></script>
   <script src="ai-quiz.js"></script>
   <script src="ai-file-handler.js"></script>
   ```

2. **Kiểm tra QuizManager có method loadAISettings:**
   ```javascript
   console.log(typeof QuizManager.prototype.loadAISettings);
   // Kết quả mong đợi: "function"
   ```

3. **Kiểm tra AIQuizGenerator có được extend:**
   ```javascript
   console.log(AIQuizGenerator.prototype.initializeAIListeners.toString());
   // Phải thấy code khởi tạo AIFileHandler
   ```

4. **Khởi tạo thủ công nếu cần:**
   ```javascript
   if (!quizManager.aiGenerator) {
       quizManager.loadAISettings();
   }
   
   if (!quizManager.aiGenerator.fileHandler) {
       quizManager.aiGenerator.fileHandler = new AIFileHandler(quizManager.aiGenerator);
   }
   ```

## Kết Luận

Sau khi thực hiện các thay đổi trên, chức năng upload file trong phần AI tạo quiz sẽ hoạt động bình thường. Người dùng có thể:
- Click nút "Chọn File" để chọn file
- Kéo thả file vào vùng upload
- Click vào vùng upload để chọn file

Nếu vẫn gặp vấn đề, vui lòng kiểm tra Console để xem log chi tiết và thông báo lỗi.
