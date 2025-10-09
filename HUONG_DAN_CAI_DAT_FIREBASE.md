# 🔥 Hướng Dẫn Cài Đặt Firebase - Hệ Thống Chia Sẻ Cộng Đồng

## 🎯 Mục Đích

Tạo hệ thống chia sẻ quiz **TẬP TRUNG** trên cloud để:
- ✅ Mọi người từ mọi nơi đều xem được
- ✅ Không cần chạy server local
- ✅ Dữ liệu lưu trên cloud (Firebase)
- ✅ Miễn phí (Firebase Free Tier)

---

## 📋 Bước 1: Tạo Tài Khoản Firebase

### 1.1. Truy cập Firebase Console
```
https://console.firebase.google.com/
```

### 1.2. Đăng nhập bằng Google Account

### 1.3. Click "Add Project" (Thêm Dự Án)
- Tên dự án: `trac-nghiem-pro` (hoặc tên bạn thích)
- Click "Continue"

### 1.4. Google Analytics (Tùy chọn)
- Có thể tắt nếu không cần
- Click "Create Project"

### 1.5. Đợi Firebase tạo project (~30 giây)

---

## 📋 Bước 2: Cấu Hình Firestore Database

### 2.1. Vào "Firestore Database"
- Sidebar trái → Click "Firestore Database"
- Click "Create database"

### 2.2. Chọn Mode
- Chọn **"Start in test mode"** (cho development)
- Click "Next"

### 2.3. Chọn Location
- Chọn `asia-southeast1` (Singapore) - gần Việt Nam nhất
- Click "Enable"

### 2.4. Đợi Firestore khởi tạo (~1 phút)

---

## 📋 Bước 3: Cấu Hình Security Rules

### 3.1. Vào Tab "Rules"
- Click tab "Rules" trong Firestore Database

### 3.2. Thay thế rules bằng code sau:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Cho phép đọc tất cả quiz
    match /shared-quizzes/{quizId} {
      allow read: if true;
      allow create: if request.auth == null || request.auth != null;
      allow update: if request.auth == null || request.auth != null;
      allow delete: if false; // Không cho xóa
    }
  }
}
```

### 3.3. Click "Publish"

**Lưu ý:** Rules này cho phép mọi người đọc/ghi (phù hợp cho demo). Trong production nên thêm authentication.

---

## 📋 Bước 4: Lấy Firebase Config

### 4.1. Vào Project Settings
- Click icon ⚙️ (Settings) → "Project settings"

### 4.2. Scroll xuống "Your apps"
- Click icon `</>` (Web)

### 4.3. Đăng ký app
- App nickname: `Trac Nghiem Pro Web`
- **KHÔNG** check "Firebase Hosting"
- Click "Register app"

### 4.4. Copy Firebase Config
Bạn sẽ thấy code như thế này:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "trac-nghiem-pro.firebaseapp.com",
  projectId: "trac-nghiem-pro",
  storageBucket: "trac-nghiem-pro.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

**COPY TOÀN BỘ CONFIG NÀY!**

### 4.5. Click "Continue to console"

---

## 📋 Bước 5: Cập Nhật Code

### 5.1. Mở file `firebase-config.js`

### 5.2. Thay thế Firebase Config
Tìm dòng:
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    // ...
};
```

Thay bằng config bạn vừa copy ở Bước 4.4

### 5.3. Lưu file

---

## 📋 Bước 6: Thêm Firebase vào HTML

### 6.1. Mở file `index.html`

### 6.2. Thêm Firebase script TRƯỚC thẻ `</body>`:

```html
<!-- Firebase SDK -->
<script type="module" src="firebase-config.js"></script>
<script src="explore-quiz.js"></script>
<script src="script.js"></script>
</body>
</html>
```

### 6.3. Lưu file

---

## 📋 Bước 7: Test Hệ Thống

### 7.1. Mở `index.html` trong trình duyệt

### 7.2. Mở Console (F12)
Kiểm tra xem có thông báo:
```
✅ Firebase initialized successfully
✅ Firebase is available - Using cloud storage
```

### 7.3. Test Chia Sẻ Quiz
1. Tạo 1 quiz mới
2. Click "Chia sẻ"
3. Điền thông tin
4. Click "Chia Sẻ Ngay"
5. Kiểm tra tab "Khám Phá Đề Thi"

### 7.4. Test Từ Máy Khác
1. Mở `index.html` trên máy khác (hoặc điện thoại)
2. Vào tab "Khám Phá Đề Thi"
3. **Phải thấy quiz vừa chia sẻ!** ✅

---

## 🎉 Hoàn Tất!

Giờ đây hệ thống của bạn đã:
- ✅ Lưu trữ quiz trên Firebase Cloud
- ✅ Mọi người từ mọi nơi đều xem được
- ✅ Không cần chạy server local
- ✅ Hoàn toàn miễn phí (Firebase Free Tier)

---

## 📊 Firebase Free Tier Limits

| Tính Năng | Giới Hạn Miễn Phí |
|-----------|-------------------|
| Firestore Reads | 50,000 / ngày |
| Firestore Writes | 20,000 / ngày |
| Storage | 1 GB |
| Bandwidth | 10 GB / tháng |

**Đủ cho hàng nghìn người dùng!**

---

## 🔧 Troubleshooting

### Lỗi: "Firebase not initialized"

**Nguyên nhân:** File `firebase-config.js` chưa được load

**Giải pháp:**
1. Kiểm tra file `firebase-config.js` có trong thư mục không
2. Kiểm tra `index.html` đã thêm `<script type="module" src="firebase-config.js"></script>`
3. Reload trang (Ctrl + F5)

### Lỗi: "Permission denied"

**Nguyên nhân:** Firestore Rules chưa đúng

**Giải pháp:**
1. Vào Firebase Console ��� Firestore Database → Rules
2. Copy rules ở Bước 3.2
3. Click "Publish"

### Lỗi: "Failed to get document"

**Nguyên nhân:** Firestore chưa được enable

**Giải pháp:**
1. Vào Firebase Console → Firestore Database
2. Nếu chưa có, click "Create database"
3. Follow Bước 2

### Quiz không hiển thị

**Kiểm tra:**
1. Mở Console (F12)
2. Xem có lỗi màu đỏ không
3. Kiểm tra Firebase Config đã đúng chưa
4. Thử chia sẻ quiz mới

---

## 🚀 Nâng Cao (Tùy Chọn)

### 1. Thêm Authentication

Để chỉ cho phép người dùng đã đăng nhập chia sẻ:

```javascript
// Trong firebase-config.js
import { getAuth, signInAnonymously } from 'firebase/auth';

const auth = getAuth(app);
signInAnonymously(auth);
```

### 2. Thêm Indexes

Để tìm kiếm nhanh hơn:
1. Vào Firebase Console → Firestore Database → Indexes
2. Click "Create Index"
3. Collection: `shared-quizzes`
4. Fields: `sharedAt` (Descending), `views` (Descending)

### 3. Backup Dữ Liệu

```bash
# Cài đặt Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Export data
firebase firestore:export gs://your-bucket/backups
```

---

## 📱 Deploy Lên Hosting (Bonus)

### Bước 1: Cài Firebase CLI
```bash
npm install -g firebase-tools
```

### Bước 2: Login
```bash
firebase login
```

### Bước 3: Init Hosting
```bash
firebase init hosting
```

### Bước 4: Deploy
```bash
firebase deploy --only hosting
```

### Bước 5: Truy Cập
```
https://trac-nghiem-pro.web.app
```

Giờ mọi người có thể truy cập qua link này!

---

## 💡 Tips & Best Practices

### 1. Giới Hạn Số Lượng Quiz
```javascript
// Trong firebase-config.js
const MAX_QUIZZES_PER_USER = 10;
```

### 2. Thêm Moderation
- Admin có thể xóa quiz không phù hợp
- Thêm report button

### 3. Cache Dữ Liệu
```javascript
// Enable offline persistence
enableIndexedDbPersistence(db);
```

### 4. Monitor Usage
- Vào Firebase Console → Usage
- Xem số lượng reads/writes
- Set up alerts khi gần limit

---

## 📞 Hỗ Trợ

### Firebase Documentation
- https://firebase.google.com/docs/firestore

### Firebase Community
- https://firebase.google.com/community

### Stack Overflow
- Tag: `firebase` + `firestore`

---

## 🎊 Kết Luận

Bạn đã tạo thành công hệ thống chia sẻ quiz cộng đồng với Firebase!

**Ưu điểm:**
- ✅ Miễn phí
- ✅ Dễ cài đặt
- ✅ Scalable (mở rộng dễ dàng)
- ✅ Real-time sync
- ✅ Offline support

**Tiếp theo:**
- Thêm authentication
- Thêm categories
- Thêm comments
- Thêm ratings

**Chúc bạn thành công! 🚀**

---

© Trần Văn Anh - 2025
