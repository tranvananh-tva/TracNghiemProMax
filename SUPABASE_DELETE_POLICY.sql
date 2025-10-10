-- ============================================
-- SUPABASE RLS POLICY CHO CHỨC NĂNG XÓA BÀI
-- ============================================
-- File này chứa các SQL commands để cấu hình
-- Row Level Security (RLS) cho phép xóa bài
-- ============================================

-- CÁCH SỬ DỤNG:
-- 1. Đăng nhập vào Supabase Dashboard
-- 2. Vào project của bạn
-- 3. Chọn SQL Editor (biểu tượng </> bên trái)
-- 4. Copy và paste các lệnh dưới đây
-- 5. Nhấn RUN để thực thi

-- ============================================
-- OPTION 1: CHO PHÉP MỌI NGƯỜI XÓA (ĐƠN GIẢN)
-- ============================================
-- Phù hợp cho: Ứng dụng nội bộ, testing
-- Lưu ý: Bất kỳ ai cũng có thể xóa bất kỳ bài nào

-- Xóa policy cũ nếu có
DROP POLICY IF EXISTS "Allow public delete access" ON shared_quizzes;

-- Tạo policy mới cho phép mọi người xóa
CREATE POLICY "Allow public delete access" ON shared_quizzes
    FOR DELETE USING (true);

-- ============================================
-- OPTION 2: CHỈ ADMIN M���I XÓA ĐƯỢC (AN TOÀN HƠN)
-- ============================================
-- Phù hợp cho: Ứng dụng production
-- Lưu ý: Cần có authentication và role admin

-- Xóa policy cũ nếu có
DROP POLICY IF EXISTS "Allow admin delete access" ON shared_quizzes;

-- Tạo policy cho phép admin xóa
-- (Yêu cầu: Bạn cần setup authentication và role trong Supabase)
CREATE POLICY "Allow admin delete access" ON shared_quizzes
    FOR DELETE USING (
        auth.jwt() ->> 'role' = 'admin'
    );

-- ============================================
-- OPTION 3: CHỈ CHỦ SỞ HỮU MỚI XÓA ĐƯỢC (TỐT NHẤT)
-- ============================================
-- Phù hợp cho: Ứng dụng có nhiều user
-- Lưu ý: Cần có authentication và lưu user_id

-- Bước 1: Thêm cột user_id vào bảng (nếu chưa có)
ALTER TABLE shared_quizzes 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Bước 2: Tạo index cho user_id
CREATE INDEX IF NOT EXISTS idx_shared_quizzes_user_id 
ON shared_quizzes(user_id);

-- Bước 3: Xóa policy cũ nếu có
DROP POLICY IF EXISTS "Allow owner delete access" ON shared_quizzes;

-- Bước 4: Tạo policy cho phép chủ sở hữu xóa
CREATE POLICY "Allow owner delete access" ON shared_quizzes
    FOR DELETE USING (
        auth.uid() = user_id
    );

-- ============================================
-- OPTION 4: KẾT HỢP ADMIN VÀ CHỦ SỞ HỮU (LINH HOẠT)
-- ============================================
-- Phù hợp cho: Ứng dụng có admin và user
-- Lưu ý: Admin có thể xóa mọi bài, user chỉ xóa bài của mình

-- Xóa policy cũ nếu có
DROP POLICY IF EXISTS "Allow admin and owner delete" ON shared_quizzes;

-- Tạo policy kết hợp
CREATE POLICY "Allow admin and owner delete" ON shared_quizzes
    FOR DELETE USING (
        -- Admin có thể xóa mọi bài
        auth.jwt() ->> 'role' = 'admin'
        OR
        -- Hoặc là chủ sở hữu của bài
        auth.uid() = user_id
    );

-- ============================================
-- KIỂM TRA CÁC POLICY HIỆN TẠI
-- ============================================
-- Chạy lệnh này để xem tất cả policies của bảng shared_quizzes

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'shared_quizzes';

-- ============================================
-- XÓA TẤT CẢ POLICIES (NẾU CẦN RESET)
-- ============================================
-- CẢNH BÁO: Chỉ chạy lệnh này nếu bạn muốn xóa hết policies

-- DROP POLICY IF EXISTS "Allow public read access" ON shared_quizzes;
-- DROP POLICY IF EXISTS "Allow public insert access" ON shared_quizzes;
-- DROP POLICY IF EXISTS "Allow public update stats" ON shared_quizzes;
-- DROP POLICY IF EXISTS "Allow public delete access" ON shared_quizzes;
-- DROP POLICY IF EXISTS "Allow admin delete access" ON shared_quizzes;
-- DROP POLICY IF EXISTS "Allow owner delete access" ON shared_quizzes;
-- DROP POLICY IF EXISTS "Allow admin and owner delete" ON shared_quizzes;

-- ============================================
-- TẠO LẠI TẤT CẢ POLICIES (RECOMMENDED SETUP)
-- ============================================
-- Đây là cấu hình được khuyến nghị cho ứng dụng

-- 1. Cho phép mọi người đọc
CREATE POLICY "Allow public read access" ON shared_quizzes
    FOR SELECT USING (true);

-- 2. Cho phép mọi người tạo mới
CREATE POLICY "Allow public insert access" ON shared_quizzes
    FOR INSERT WITH CHECK (true);

-- 3. Cho phép mọi người cập nhật stats (views, attempts, likes)
CREATE POLICY "Allow public update stats" ON shared_quizzes
    FOR UPDATE USING (true)
    WITH CHECK (true);

-- 4. Cho phép mọi người xóa (đơn giản nhất)
CREATE POLICY "Allow public delete access" ON shared_quizzes
    FOR DELETE USING (true);

-- ============================================
-- GHI CHÚ QUAN TRỌNG
-- ============================================
/*
1. RLS (Row Level Security) phải được bật:
   ALTER TABLE shared_quizzes ENABLE ROW LEVEL SECURITY;

2. Nếu bạn chọn OPTION 1 (cho phép mọi người xóa):
   - Đơn giản, dễ setup
   - Phù hợp cho testing hoặc ứng dụng nội bộ
   - Không an toàn cho production

3. Nếu bạn chọn OPTION 2 hoặc 3:
   - Cần setup Supabase Authentication
   - Cần có user_id trong bảng
   - An toàn hơn cho production

4. Sau khi chạy SQL:
   - Test lại chức năng xóa bài
   - Kiểm tra Console (F12) để xem có lỗi không
   - Nếu lỗi "permission denied", kiểm tra lại policy

5. Để debug:
   - Vào Supabase Dashboard > Authentication > Policies
   - Xem các policies đã được tạo chưa
   - Test với Supabase SQL Editor
*/

-- ============================================
-- TEST XÓA BÀI (OPTIONAL)
-- ============================================
-- Chạy lệnh này để test xóa một bài (thay YOUR_QUIZ_ID)

-- DELETE FROM shared_quizzes WHERE id = 'YOUR_QUIZ_ID';

-- Nếu lệnh trên chạy thành công, policy đã hoạt động!
