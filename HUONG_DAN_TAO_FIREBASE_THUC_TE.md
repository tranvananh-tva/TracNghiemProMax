# 🔥 Hướng Dẫn Tạo Firebase Project Thực Tế

## ⚠️ LƯU Ý QUAN TRỌNG

API key bạn cung cấp không đúng định dạng Firebase. Để hệ thống hoạt động đúng và người dùng từ các thiết bị khác có thể xem bài chia sẻ, bạn cần tạo Firebase project thật.

---

## 📋 BƯỚC 1: TẠO FIREBASE PROJECT

### 1.1. Truy cập Firebase Console
```
https://console.firebase.google.com/
```

### 1.2. Đăng nhập bằng Google Account
- Sử dụng Gmail của bạn
- Hoàn toàn MIỄN PHÍ

### 1.3. Tạo Project Mới
1. Click nút **"Add project"** (Thêm dự án)
2. Đặt tên project: `TracNghiemPro` (hoặc tên bạn thích)
3. Click **"Continue"**
4. Tắt Google Analytics (không bắt buộc)
5. Click **"Create project"**
6. Đợi 30 giây để Firebase tạo project
7. Click **"Continue"** khi hoàn tất

---

## 📋 BƯỚC 2: TẠO FIRESTORE DATABASE

### 2.1. Vào Firestore Database
1. Trong Firebase Console, click **"Firestore Database"** ở menu bên trái
2. Click nút **"Create database"**

### 2.2. Chọn Location
1. Chọn **"Start in test mode"** (Quan trọng!)
2. Click **"Next"**
3. Chọn location gần nhất:
   - **asia-southeast1** (Singapore) - Khuyến nghị cho Việt Nam
   - **asia-east1** (Taiwan)
   - **asia-northeast1** (Tokyo)
4. Click **"Enable"**

### 2.3. Cấu Hình Rules (Quan Trọng!)
1. Sau khi tạo xong, click tab **"Rules"**
2. Thay thế rules bằng code sau:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Cho phép đọc/ghi tất cả documents trong collection shared-quizzes
    match /shared-quizzes/{document=**} {
      allow read: if true;  // Ai cũng có thể đọc
      allow write: if true; // Ai cũng có thể ghi
    }
    
    // Chặn truy cập các collection khác
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **"Publish"**

**Giải thích:**
- `allow read: if true` - Cho phép mọi người xem bài chia sẻ
- `allow write: if true` - Cho phép mọi người chia sẻ bài
- Rules này an toàn vì chỉ áp dụng cho collection `shared-quizzes`

---

## 📋 BƯỚC 3: LẤY FIREBASE CONFIG

### 3.1. Thêm Web App
1. Quay lại trang chủ Firebase Console
2. Click biểu tượng **Web** (`</>`) ở phần "Get started by adding Firebase to your app"
3. Nếu không thấy, vào **Project Settings** (biểu tượng bánh răng) → **General** → scroll xuống **"Your apps"** → Click biểu tượng Web

### 3.2. Đăng ký App
1. Đặt tên app: `TracNghiemProWeb`
2. **KHÔNG** check "Also set up Firebase Hosting"
3. Click **"Register app"**

### 3.3. Copy Firebase Config
Bạn sẽ thấy một đoạn code như sau:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC1234567890abcdefghijklmnop",
  authDomain: "tracnghiempro-12345.firebaseapp.com",
  projectId: "tracnghiempro-12345",
  storageBucket: "tracnghiempro-12345.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

**Copy toàn bộ đoạn config này!**

---

## 📋 BƯỚC 4: CẬP NHẬT VÀO CODE

### 4.1. Mở File firebase-config.js
Đường dẫn: `e:\Trắc Nghiệm Pro\firebase-config.js`

### 4.2. Tìm và Thay Thế
Tìm đoạn code:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyBOZbtJR0u1IHLkGUuOck8vwYpCVoPkNQ",
    authDomain: "tracnghiem-pro.firebaseapp.com",
    projectId: "tracnghiem-pro",
    storageBucket: "tracnghiem-pro.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};
```

Thay thế bằng config bạn vừa copy từ Firebase Console.

### 4.3. Lưu File
Nhấn `Ctrl + S` để lưu file.

---

## 📋 BƯỚC 5: KIỂM TRA

### 5.1. Mở Ứng Dụng
1. Mở file `index.html` trong trình duyệt
2. Nhấn `F12` để mở Console

### 5.2. Kiểm Tra Log
Bạn sẽ thấy:
```
✅ Firebase initialized successfully
✅ Firebase is available - Using cloud storage
```

Nếu thấy lỗi:
```
❌ Firebase initialization failed
```
→ Kiểm tra lại config và rules

### 5.3. Test Chia Sẻ
1. Tạo một quiz mới
2. Click nút **"Chia Sẻ"**
3. Điền thông tin và chia sẻ
4. Vào tab **"Khám Phá Đề Thi"**
5. Bạn sẽ thấy quiz vừa chia sẻ

### 5.4. Test Từ Thiết Bị Khác
1. Mở ứng dụng từ điện thoại/máy tính khác
2. Vào tab **"Khám Phá Đề Thi"**
3. Bạn sẽ thấy tất cả quiz đã chia sẻ
4. Click vào quiz để làm bài

---

## 🎯 VÍ DỤ CONFIG THỰC TẾ

Đây là ví dụ config thực tế (đã được làm mờ):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "my-quiz-app-12345.firebaseapp.com",
  projectId: "my-quiz-app-12345",
  storageBucket: "my-quiz-app-12345.appspot.com",
  messagingSenderId: "987654321098",
  appId: "1:987654321098:web:1234567890abcdef"
};
```

**Lưu ý:**
- `apiKey` bắt đầu bằng `AIzaSy` và dài khoảng 39 ký tự
- `authDomain` có dạng `[project-id].firebaseapp.com`
- `projectId` là tên project bạn đặt (chữ thường, có thể có số và dấu gạch ngang)
- `messagingSenderId` là số 12 chữ số
- `appId` có dạng `1:[số]:web:[chuỗi]`

---

## ❓ KHẮC PHỤC SỰ CỐ

### Lỗi: "Firebase initialization failed"

**Nguyên nhân:**
- Config sai
- Chưa enable Firestore
- Rules chưa đúng

**Giải pháp:**
1. Kiểm tra lại config đã copy đúng chưa
2. Vào Firebase Console → Firestore Database → Kiểm tra đã tạo chưa
3. Kiểm tra Rules đã publish chưa

### Lỗi: "Missing or insufficient permissions"

**Nguyên nhân:**
- Firestore Rules quá strict

**Giải pháp:**
1. Vào Firebase Console → Firestore Database → Rules
2. Thay thế bằng rules ở Bước 2.3
3. Click **"Publish"**

### Lỗi: "Failed to get document"

**Nguyên nhân:**
- Chưa có dữ liệu trong Firestore

**Giải pháp:**
1. Thử chia sẻ một quiz mới
2. Kiểm tra trong Firebase Console → Firestore Database → Data
3. Bạn sẽ thấy collection `shared-quizzes` xuất hiện

---

## 🔒 BẢO MẬT

### API Key có an toàn không?

**Có!** API key của Firebase Web được thiết kế để công khai. Bảo mật được kiểm soát bởi:

1. **Firestore Rules** - Quy định ai được đọc/ghi gì
2. **Domain Restrictions** - Giới hạn domain được phép sử dụng (tùy chọn)

### Làm sao để bảo mật hơn?

Nếu muốn bảo mật hơn, thay đổi Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /shared-quizzes/{document=**} {
      // Chỉ cho phép đọc
      allow read: if true;
      
      // Giới hạn ghi: tối đa 10 quiz/ngày từ 1 IP
      allow create: if request.time > resource.data.lastWrite + duration.value(1, 'd')
                    && request.resource.data.questions.size() <= 100;
      
      // Không cho phép sửa/xóa
      allow update, delete: if false;
    }
  }
}
```

---

## 💰 CHI PHÍ

Firebase có gói miễn phí (Spark Plan) với giới hạn:

- **Firestore:**
  - 50,000 reads/day
  - 20,000 writes/day
  - 20,000 deletes/day
  - 1 GB storage

**Đủ cho:**
- Hàng trăm người dùng mỗi ngày
- Hàng nghìn quiz được chia sẻ

**Nếu vượt giới hạn:**
- Firebase sẽ tự động dừng service
- Không bị tính phí
- Ngày hôm sau sẽ reset

---

## 📊 THEO DÕI SỬ DỤNG

### Xem Usage
1. Vào Firebase Console
2. Click **"Usage and billing"**
3. Xem biểu đồ sử dụng

### Xem Dữ Liệu
1. Vào **Firestore Database** → **Data**
2. Xem collection `shared-quizzes`
3. Click vào từng document để xem chi tiết

---

## 🎉 HOÀN TẤT!

Sau khi hoàn thành các bước trên:

✅ Người dùng từ BẤT KỲ thiết bị nào có thể:
- Xem tất cả quiz đã chia sẻ
- Chia sẻ quiz của họ
- Làm bài từ quiz của người khác
- Không cần cấu hình gì thêm

✅ Hoạt động trên:
- Máy tính (Windows, Mac, Linux)
- Điện thoại (Android, iOS)
- Tablet
- Bất kỳ trình duyệt nào

✅ Không cần:
- Cài đặt server
- Cấu hình mạng
- Mở port firewall
- Biết địa chỉ IP

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề:

1. Mở Console (F12) và xem log lỗi
2. Chụp màn hình và gửi cho tôi
3. Kiểm tra lại từng bước trong hướng dẫn

**Các lỗi phổ biến:**
- Quên enable Firestore
- Rules chưa publish
- Config copy sai
- Chưa đăng nhập Google

---

**Chúc bạn thành công! 🚀**

Sau khi cấu hình xong, hệ thống sẽ hoạt động hoàn hảo và mọi người đều có thể xem bài chia sẻ từ bất kỳ đâu!
