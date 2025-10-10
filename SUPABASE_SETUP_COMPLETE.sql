-- ============================================
-- SUPABASE SETUP HOÀN CHỈNH - COPY TOÀN BỘ FILE NÀY
-- ============================================
-- Hướng dẫn:
-- 1. Đăng nhập Supabase Dashboard: https://supabase.com/dashboard
-- 2. Chọn project của bạn
-- 3. Vào SQL Editor (biểu tượng </> bên trái)
-- 4. Copy TOÀN BỘ nội dung file này
-- 5. Paste vào SQL Editor
-- 6. Nhấn RUN (hoặc Ctrl+Enter)
-- 7. Chờ 10-20 giây để hoàn thành
-- 8. Xong! Kiểm tra kết quả ở cuối
-- ============================================

-- ============================================
-- BƯỚC 1: XÓA TẤT CẢ POLICIES CŨ (NẾU CÓ)
-- ============================================
-- Xóa sạch để bắt đầu lại từ đầu

DROP POLICY IF EXISTS "Allow public read access" ON shared_quizzes;
DROP POLICY IF EXISTS "Allow public insert access" ON shared_quizzes;
DROP POLICY IF EXISTS "Allow public update stats" ON shared_quizzes;
DROP POLICY IF EXISTS "Allow public delete access" ON shared_quizzes;
DROP POLICY IF EXISTS "Allow admin delete access" ON shared_quizzes;
DROP POLICY IF EXISTS "Allow owner delete access" ON shared_quizzes;
DROP POLICY IF EXISTS "Allow admin and owner delete" ON shared_quizzes;
DROP POLICY IF EXISTS "Enable read access for all users" ON shared_quizzes;
DROP POLICY IF EXISTS "Enable insert for all users" ON shared_quizzes;
DROP POLICY IF EXISTS "Enable update for all users" ON shared_quizzes;
DROP POLICY IF EXISTS "Enable delete for all users" ON shared_quizzes;

-- ============================================
-- BƯỚC 2: ĐẢM BẢO RLS ĐƯỢC BẬT
-- ============================================
-- Row Level Security phải được bật để policies hoạt động

ALTER TABLE shared_quizzes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- BƯỚC 3: TẠO POLICY CHO PHÉP ĐỌC (SELECT)
-- ============================================
-- Cho phép MỌI NGƯỜI xem tất cả bài chia sẻ

CREATE POLICY "Allow public read access" 
ON shared_quizzes
FOR SELECT 
USING (true);

-- ============================================
-- BƯỚC 4: TẠO POLICY CHO PHÉP TẠO MỚI (INSERT)
-- ============================================
-- Cho phép MỌI NGƯỜI chia sẻ bài mới

CREATE POLICY "Allow public insert access" 
ON shared_quizzes
FOR INSERT 
WITH CHECK (true);

-- ============================================
-- BƯỚC 5: TẠO POLICY CHO PHÉP CẬP NHẬT (UPDATE)
-- ============================================
-- Cho phép MỌI NGƯỜI cập nhật stats (views, attempts, likes)

CREATE POLICY "Allow public update stats" 
ON shared_quizzes
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- ============================================
-- BƯỚC 6: TẠO POLICY CHO PHÉP XÓA (DELETE) ⭐ QUAN TRỌNG
-- ============================================
-- Cho phép MỌI NGƯỜI xóa bài (bao gồm Admin)

CREATE POLICY "Allow public delete access" 
ON shared_quizzes
FOR DELETE 
USING (true);

-- ============================================
-- BƯỚC 7: TẠO INDEX ĐỂ TĂNG TỐC ĐỘ (OPTIONAL)
-- ============================================
-- Tạo index cho các cột thường xuyên query

CREATE INDEX IF NOT EXISTS idx_shared_quizzes_shared_at 
ON shared_quizzes(shared_at DESC);

CREATE INDEX IF NOT EXISTS idx_shared_quizzes_views 
ON shared_quizzes(views DESC);

CREATE INDEX IF NOT EXISTS idx_shared_quizzes_user_name 
ON shared_quizzes(user_name);

-- ============================================
-- BƯỚC 8: KIỂM TRA KẾT QUẢ
-- ============================================
-- Xem tất cả policies đã được tạo

SELECT 
    schemaname AS "Schema",
    tablename AS "Table",
    policyname AS "Policy Name",
    permissive AS "Permissive",
    roles AS "Roles",
    cmd AS "Command",
    CASE 
        WHEN cmd = 'SELECT' THEN 'Đọc (SELECT)'
        WHEN cmd = 'INSERT' THEN 'Tạo mới (INSERT)'
        WHEN cmd = 'UPDATE' THEN 'Cập nhật (UPDATE)'
        WHEN cmd = 'DELETE' THEN 'Xóa (DELETE)'
        WHEN cmd = 'ALL' THEN 'Tất cả (ALL)'
        ELSE cmd
    END AS "Mô tả"
FROM pg_policies
WHERE tablename = 'shared_quizzes'
ORDER BY cmd, policyname;

-- ============================================
-- BƯỚC 9: KIỂM TRA RLS ĐÃ BẬT CHƯA
-- ============================================
-- Xem trạng thái RLS của bảng

SELECT 
    schemaname AS "Schema",
    tablename AS "Table",
    rowsecurity AS "RLS Enabled"
FROM pg_tables
WHERE tablename = 'shared_quizzes';

-- ============================================
-- BƯỚC 10: TEST XÓA BÀI (OPTIONAL - KHÔNG CHẠY NẾU KHÔNG CẦN)
-- ============================================
-- Uncomment dòng d��ới để test xóa một bài cụ thể
-- Thay 'YOUR_QUIZ_ID' bằng ID thật của một bài test

-- DELETE FROM shared_quizzes WHERE id = 'YOUR_QUIZ_ID';

-- Nếu lệnh trên chạy thành công mà không báo lỗi "permission denied"
-- thì policy đã hoạt động đúng!

-- ============================================
-- KẾT QUẢ MONG ĐỢI
-- ============================================
/*
Sau khi chạy xong, bạn sẽ thấy:

1. Bảng kết quả BƯỚC 8 hiển thị 4 policies:
   - Allow public read access (SELECT)
   - Allow public insert access (INSERT)
   - Allow public update stats (UPDATE)
   - Allow public delete access (DELETE) ⭐

2. Bảng kết quả BƯỚC 9 hiển thị:
   - RLS Enabled = true ✅

3. Không có lỗi nào được hiển thị

Nếu thấy kết quả như trên = THÀNH CÔNG! 🎉
*/

-- ============================================
-- TROUBLESHOOTING - NẾU GẶP LỖI
-- ============================================
/*
LỖI 1: "relation 'shared_quizzes' does not exist"
→ Bảng shared_quizzes chưa được tạo
→ Giải pháp: Chạy lệnh CREATE TABLE trước (xem file SUPABASE_CREATE_TABLE.sql)

LỖI 2: "policy 'xxx' already exists"
→ Policy đã tồn tại từ trước
→ Giải pháp: Đã được xử lý ở BƯỚC 1 (DROP POLICY IF EXISTS)

LỖI 3: "permission denied for table shared_quizzes"
→ User không có quyền trên bảng
→ Giải pháp: Đảm bảo bạn đang dùng account owner của project

LỖI 4: Sau khi chạy vẫn không xóa được bài
→ Kiểm tra lại policies đã được tạo chưa (chạy BƯỚC 8)
→ Kiểm tra RLS đã bật chưa (chạy BƯỚC 9)
→ Clear cache trình duyệt và thử lại
→ Kiểm tra Console (F12) để xem lỗi chi tiết
*/

-- ============================================
-- HOÀN THÀNH! 🎉
-- ============================================
-- Bây giờ bạn có thể:
-- ✅ Xóa bài với Admin Mode (mật khẩu: 093701)
-- ✅ Xóa bài của mình với User thường
-- ✅ Tất cả CRUD operations đều hoạt động
-- 
-- Quay lại ứng dụng và test ngay!
-- ============================================
