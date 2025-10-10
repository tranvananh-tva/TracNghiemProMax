# 🚀 HƯỚNG DẪN SỬ DỤNG SUPABASE CHO CHIA SẺ BÀI CỘNG ĐỒNG

## 📋 Mục Lục
1. [Giới thiệu](#giới-thiệu)
2. [Tại sao dùng Supabase?](#tại-sao-dùng-supabase)
3. [Cài đặt Supabase](#cài-đặt-supabase)
4. [Cấu hình Database](#cấu-hình-database)
5. [Tích hợp vào ứng dụng](#tích-hợp-vào-ứng-dụng)
6. [Sử dụng](#sử-dụng)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Giới thiệu

Supabase là một nền tảng Backend-as-a-Service (BaaS) mã nguồn mở, được xem như "Firebase alternative". Bạn hoàn toàn có thể dùng Supabase thay cho Firebase để chia sẻ bài quiz trong cộng đồng.

### ✨ Tính năng
- ✅ Chia sẻ quiz lên cloud (không cần file JSON)
- ✅ Tự động đồng bộ giữa các thiết bị
- ✅ Tìm kiếm, lọc quiz theo category, độ khó
- ✅ Thống kê views, attempts, likes
- ✅ Miễn phí cho dự án nhỏ
- ✅ Dễ dùng hơn Firebase

---

## 🤔 Tại sao dùng Supabase?

### So sánh với các phương pháp khác:

| Tính năng | File JSON | Firebase | **Supabase** |
|-----------|-----------|----------|--------------|
| Miễn phí | ✅ | ⚠️ Giới hạn | ✅ Rộng rãi hơn |
| Tự động đồng bộ | ❌ | ✅ | ✅ |
| Dễ cài đặt | ✅ | ⚠️ Phức tạp | ✅ Đơn giản |
| SQL queries | ❌ | ❌ | ✅ |
| Real-time | ❌ | ✅ | ✅ |
| Open source | ✅ | ❌ | ✅ |
| Dashboard | ❌ | ✅ | ✅ Tốt hơn |

### 🎁 Ưu điểm của Supabase:
1. **Miễn phí rộng rãi**: 500MB database, 1GB file storage, 2GB bandwidth/tháng
2. **Dễ sử dụng**: Interface đơn giản, SQL editor mạnh mẽ
3. **PostgreSQL**: Database mạnh mẽ, hỗ trợ full-text search
4. **Row Level Security**: Bảo mật tốt hơn Firebase
5. **Open source**: Có thể self-host nếu muốn

---

## 🛠️ Cài đặt Supabase

### Bước 1: Tạo tài khoản Supabase

1. Truy cập: https://supabase.com/
2. Click **"Start your project"**
3. Đăng ký bằng GitHub hoặc email (MIỄN PHÍ)

### Bước 2: Tạo Project mới

1. Sau khi đăng nhập, click **"New Project"**
2. Điền thông tin:
   - **Name**: `tracnghiem-pro` (hoặc tên bạn thích)
   - **Database Password**: Tạo mật khẩu mạnh (lưu lại!)
   - **Region**: Chọn `Southeast Asia (Singapore)` (gần Việt Nam nhất)
   - **Pricing Plan**: Chọn **Free** (đủ dùng)
3. Click **"Create new project"**
4. Đợi 1-2 phút để Supabase khởi tạo project

### Bước 3: Lấy API Keys

1. Vào project vừa tạo
2. Click vào **Settings** (biểu tượng bánh răng) ở sidebar
3. Click **API**
4. Copy 2 thông tin sau:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: Key dài dòng (bắt đầu bằng `eyJ...`)

---

## 💾 Cấu hình Database

### Bước 1: Tạo bảng `shared_quizzes`

1. Trong Supabase Dashboard, click **SQL Editor** ở sidebar
2. Click **"New query"**
3. Copy và paste đoạn SQL sau:

```sql
-- Tạo bảng shared_quizzes
CREATE TABLE shared_quizzes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    questions JSONB NOT NULL,
    total_questions INTEGER NOT NULL,
    user_name TEXT NOT NULL,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    views INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    original_id TEXT,
    tags TEXT[],
    difficulty TEXT DEFAULT 'medium',
    category TEXT DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo index để tăng tốc độ truy vấn
CREATE INDEX idx_shared_quizzes_shared_at ON shared_quizzes(shared_at DESC);
CREATE INDEX idx_shared_quizzes_views ON shared_quizzes(views DESC);
CREATE INDEX idx_shared_quizzes_category ON shared_quizzes(category);
CREATE INDEX idx_shared_quizzes_difficulty ON shared_quizzes(difficulty);

-- Enable Row Level Security (RLS)
ALTER TABLE shared_quizzes ENABLE ROW LEVEL SECURITY;

-- Tạo policy cho phép mọi người đọc
CREATE POLICY "Allow public read access" ON shared_quizzes
    FOR SELECT USING (true);

-- Tạo policy cho phép mọi người tạo mới
CREATE POLICY "Allow public insert access" ON shared_quizzes
    FOR INSERT WITH CHECK (true);

-- Tạo policy cho phép cập nhật views, attempts, likes
CREATE POLICY "Allow public update stats" ON shared_quizzes
    FOR UPDATE USING (true)
    WITH CHECK (true);
```

4. Click **"Run"** (hoặc nhấn Ctrl+Enter)
5. Nếu thành công, bạn sẽ thấy thông báo **"Success. No rows returned"**

### Bước 2: Kiểm tra bảng đã tạo

1. Click **Table Editor** ở sidebar
2. Bạn sẽ thấy bảng `shared_quizzes` với các cột:
   - id, title, description, questions, total_questions
   - user_name, shared_at, views, attempts, likes
   - tags, difficulty, category, etc.

---

## 🔗 Tích hợp vào ứng dụng

### Bước 1: Cập nhật file `supabase-config.js`

1. Mở file `supabase-config.js`
2. Tìm dòng:
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

3. Thay thế bằng thông tin từ Bước 3 phần Cài đặt:
```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co'; // URL của bạn
const SUPABASE_ANON_KEY = 'eyJhbGc...'; // Key của bạn
```

4. Lưu file (Ctrl+S)

### Bước 2: Thêm vào file HTML

Mở file `index.html` và thêm dòng sau vào phần `<head>` hoặc trước thẻ `</body>`:

```html
<!-- Supabase Integration -->
<script type="module" src="supabase-config.js"></script>
```

**Ví dụ đầy đủ:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Trắc Nghiệm Pro</title>
    <!-- ... các thẻ khác ... -->
</head>
<body>
    <!-- ... nội dung ... -->
    
    <!-- Scripts -->
    <script src="script.js"></script>
    <script src="community-share.js"></script>
    
    <!-- Supabase Integration -->
    <script type="module" src="supabase-config.js"></script>
</body>
</html>
```

---

## 🎮 Sử dụng

### 1. Chia sẻ quiz lên Supabase

```javascript
// Trong code của bạn
const quiz = {
    title: "Toán học lớp 10",
    description: "Bài tập về hàm số",
    questions: [...], // Mảng câu hỏi
    tags: ["toán", "lớp 10"],
    difficulty: "medium",
    category: "math"
};

const userName = "Nguyễn Văn A";

// Chia sẻ lên Supabase
try {
    const result = await supabaseQuizManager.shareQuiz(quiz, userName);
    if (result.success) {
        console.log("✅ Đã chia sẻ quiz:", result.quiz);
        alert("Quiz đã được chia sẻ thành công!");
    }
} catch (error) {
    console.error("❌ Lỗi:", error);
    alert("Không thể chia sẻ quiz: " + error.message);
}
```

### 2. Lấy danh sách quiz

```javascript
// Lấy tất cả quiz (mới nhất)
const result = await supabaseQuizManager.getAllQuizzes(50);
console.log("Danh sách quiz:", result.quizzes);

// Lấy quiz phổ biến nhất
const popular = await supabaseQuizManager.getPopularQuizzes(10);
console.log("Quiz phổ biến:", popular.quizzes);

// Lấy quiz mới nhất
const latest = await supabaseQuizManager.getLatestQuizzes(10);
console.log("Quiz mới:", latest.quizzes);
```

### 3. Tìm kiếm quiz

```javascript
// Tìm kiếm theo từ khóa
const result = await supabaseQuizManager.searchQuizzes("toán học");
console.log("Kết quả tìm kiếm:", result.quizzes);

// Lọc theo category
const mathQuizzes = await supabaseQuizManager.getQuizzesByCategory("math", 20);
console.log("Quiz toán:", mathQuizzes.quizzes);

// Lọc theo độ khó
const easyQuizzes = await supabaseQuizManager.getQuizzesByDifficulty("easy", 20);
console.log("Quiz dễ:", easyQuizzes.quizzes);
```

### 4. Xem chi tiết quiz

```javascript
// Lấy quiz theo ID (tự động tăng views)
const quizId = "123e4567-e89b-12d3-a456-426614174000";
const result = await supabaseQuizManager.getQuizById(quizId);
console.log("Chi tiết quiz:", result.quiz);
```

### 5. Tương tác với quiz

```javascript
// Like quiz
await supabaseQuizManager.likeQuiz(quizId);

// Tăng số lượt làm bài
await supabaseQuizManager.incrementAttempts(quizId);
```

### 6. Kiểm tra Supabase có sẵn sàng không

```javascript
if (supabaseQuizManager.isAvailable()) {
    console.log("✅ Supabase đã sẵn sàng");
    // Sử dụng Supabase
} else {
    console.log("⚠️ Supabase chưa được cấu hình");
    // Fallback sang file JSON
}
```

---

## 🎨 Tích hợp vào UI

### Ví dụ: Nút chia sẻ quiz

```html
<button onclick="shareToSupabase()">
    <i class="fas fa-cloud-upload"></i>
    Chia sẻ lên Supabase
</button>

<script>
async function shareToSupabase() {
    // Lấy quiz hiện tại
    const currentQuiz = quizManager.getCurrentQuiz();
    
    // Hỏi tên người dùng
    const userName = prompt("Nhập tên của bạn:");
    if (!userName) return;
    
    // Ki���m tra Supabase
    if (!supabaseQuizManager.isAvailable()) {
        alert("Supabase chưa được cấu hình!");
        return;
    }
    
    // Hiển thị loading
    showLoading("Đang chia sẻ...");
    
    try {
        // Chia sẻ
        const result = await supabaseQuizManager.shareQuiz(currentQuiz, userName);
        
        hideLoading();
        
        if (result.success) {
            alert("✅ Đã chia sẻ quiz thành công!\nMọi người có thể xem ngay bây giờ.");
        }
    } catch (error) {
        hideLoading();
        alert("❌ Lỗi: " + error.message);
    }
}
</script>
```

### Ví dụ: Hiển thị danh sách quiz

```html
<div id="community-quizzes">
    <h2>Quiz Cộng Đồng</h2>
    <div id="quiz-list"></div>
</div>

<script>
async function loadCommunityQuizzes() {
    const quizList = document.getElementById('quiz-list');
    
    if (!supabaseQuizManager.isAvailable()) {
        quizList.innerHTML = '<p>Supabase chưa được cấu hình</p>';
        return;
    }
    
    try {
        const result = await supabaseQuizManager.getAllQuizzes(20);
        
        if (result.success && result.quizzes.length > 0) {
            quizList.innerHTML = result.quizzes.map(quiz => `
                <div class="quiz-card" onclick="openQuiz('${quiz.id}')">
                    <h3>${quiz.title}</h3>
                    <p>${quiz.description}</p>
                    <div class="quiz-meta">
                        <span><i class="fas fa-user"></i> ${quiz.userName}</span>
                        <span><i class="fas fa-eye"></i> ${quiz.views}</span>
                        <span><i class="fas fa-heart"></i> ${quiz.likes}</span>
                    </div>
                </div>
            `).join('');
        } else {
            quizList.innerHTML = '<p>Chưa có quiz nào</p>';
        }
    } catch (error) {
        quizList.innerHTML = '<p>Lỗi: ' + error.message + '</p>';
    }
}

// Load khi trang được tải
loadCommunityQuizzes();
</script>
```

---

## 🔧 Troubleshooting

### ❌ Lỗi: "Supabase không khả dụng"

**Nguyên nhân**: Chưa cấu hình SUPABASE_URL và SUPABASE_ANON_KEY

**Giải pháp**:
1. Kiểm tra file `supabase-config.js`
2. Đảm bảo đã thay thế `YOUR_SUPABASE_URL` và `YOUR_SUPABASE_ANON_KEY`
3. Reload trang (Ctrl+R)

### ❌ Lỗi: "relation 'shared_quizzes' does not exist"

**Nguyên nhân**: Chưa tạo bảng trong Supabase

**Giải pháp**:
1. Vào Supabase Dashboard
2. Chạy lại SQL ở phần "Cấu hình Database"
3. Kiểm tra bảng đã tạo trong Table Editor

### ❌ Lỗi: "new row violates row-level security policy"

**Nguyên nhân**: RLS policies chưa được cấu hình đúng

**Giải pháp**:
1. Vào Supabase Dashboard > Authentication > Policies
2. Kiểm tra bảng `shared_quizzes` có 3 policies:
   - Allow public read access
   - Allow public insert access
   - Allow public update stats
3. Nếu chưa có, chạy lại SQL policies

### ❌ Lỗi CORS

**Nguyên nhân**: Supabase chặn request từ domain của bạn

**Giải pháp**:
1. Vào Supabase Dashboard > Settings > API
2. Scroll xuống "API Settings"
3. Thêm domain của bạn vào "Allowed Origins"
4. Hoặc thêm `*` để cho phép tất cả (chỉ dùng khi test)

### ⚠️ Supabase chậm

**Nguyên nhân**: Free tier có giới hạn

**Giải pháp**:
1. Sử dụng cache trong localStorage
2. Giảm số lượng request
3. Nâng cấp lên Pro plan nếu cần ($25/tháng)

---

## 📊 So sánh chi phí

### Supabase Free Tier (Miễn phí)
- ✅ 500MB database
- ✅ 1GB file storage
- ✅ 2GB bandwidth/tháng
- ✅ 50,000 monthly active users
- ✅ Đủ cho dự án nhỏ/vừa

### Firebase Free Tier (Spark Plan)
- ⚠️ 1GB storage
- ⚠️ 10GB bandwidth/tháng
- ⚠️ 50,000 reads/day
- ⚠️ 20,000 writes/day
- ⚠️ Dễ vượt quota

### Kết luận
**Supabase tốt hơn cho dự án này** vì:
- Quota rộng rãi hơn
- Dễ cài đặt hơn
- PostgreSQL mạnh mẽ hơn
- Dashboard trực quan hơn

---

## 🎯 Kết luận

Bạn **hoàn toàn có thể dùng Supabase** thay cho Firebase để chia sẻ bài quiz cộng đồng. Supabase thậm chí còn có nhiều ưu điểm hơn:

✅ **Dễ cài đặt hơn** - Chỉ cần 3 bước  
✅ **Miễn phí rộng rãi hơn** - Quota cao hơn Firebase  
✅ **Mạnh mẽ hơn** - PostgreSQL với full-text search  
✅ **Dashboard tốt hơn** - Dễ quản lý dữ liệu  
✅ **Open source** - Có thể self-host  

### 🚀 Bắt đầu ngay:
1. Tạo tài khoản Supabase (2 phút)
2. Chạy SQL tạo bảng (1 phút)
3. Cập nhật config (30 giây)
4. Bắt đầu chia sẻ quiz! 🎉

---

## 📚 Tài liệu tham khảo

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**Chúc bạn thành công! 🎉**

Nếu có thắc mắc, hãy tham khảo phần Troubleshooting hoặc documentation của Supabase.
