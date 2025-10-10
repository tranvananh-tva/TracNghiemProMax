-- ============================================
-- TẠO BẢNG SHARED_QUIZZES TỪ ĐẦU
-- ============================================
-- CHỈ CHẠY FILE NÀY NẾU BẢNG CHƯA TỒN TẠI
-- Nếu bảng đã có rồi, bỏ qua file này và chạy SUPABASE_SETUP_COMPLETE.sql
-- ============================================

-- ============================================
-- BƯỚC 1: XÓA BẢNG CŨ (NẾU CẦN BẮT ĐẦU LẠI)
-- ============================================
-- ⚠️ CẢNH BÁO: Lệnh này sẽ XÓA TẤT CẢ DỮ LIỆU!
-- Chỉ uncomment nếu bạn chắc chắn muốn xóa bảng cũ

-- DROP TABLE IF EXISTS shared_quizzes CASCADE;

-- ============================================
-- BƯỚC 2: TẠO BẢNG SHARED_QUIZZES
-- ============================================

CREATE TABLE IF NOT EXISTS shared_quizzes (
    -- ID tự động tạo
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Thông tin bài thi
    title TEXT NOT NULL,
    description TEXT,
    questions JSONB NOT NULL,
    total_questions INTEGER NOT NULL,
    
    -- Thông tin người chia sẻ
    user_name TEXT NOT NULL,
    
    -- Thời gian
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Thống kê
    views INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    
    -- Metadata
    original_id TEXT,
    tags TEXT[],
    difficulty TEXT DEFAULT 'medium',
    category TEXT DEFAULT 'general',
    
    -- Constraints
    CONSTRAINT valid_total_questions CHECK (total_questions > 0),
    CONSTRAINT valid_views CHECK (views >= 0),
    CONSTRAINT valid_attempts CHECK (attempts >= 0),
    CONSTRAINT valid_likes CHECK (likes >= 0)
);

-- ============================================
-- BƯỚC 3: TẠO INDEX ĐỂ TĂNG TỐC ĐỘ
-- ============================================

CREATE INDEX IF NOT EXISTS idx_shared_quizzes_shared_at 
ON shared_quizzes(shared_at DESC);

CREATE INDEX IF NOT EXISTS idx_shared_quizzes_views 
ON shared_quizzes(views DESC);

CREATE INDEX IF NOT EXISTS idx_shared_quizzes_category 
ON shared_quizzes(category);

CREATE INDEX IF NOT EXISTS idx_shared_quizzes_difficulty 
ON shared_quizzes(difficulty);

CREATE INDEX IF NOT EXISTS idx_shared_quizzes_user_name 
ON shared_quizzes(user_name);

-- ============================================
-- BƯỚC 4: BẬT ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE shared_quizzes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- BƯỚC 5: TẠO POLICIES
-- ============================================

-- Cho phép đọc
CREATE POLICY "Allow public read access" 
ON shared_quizzes
FOR SELECT 
USING (true);

-- Cho phép tạo mới
CREATE POLICY "Allow public insert access" 
ON shared_quizzes
FOR INSERT 
WITH CHECK (true);

-- Cho phép cập nhật
CREATE POLICY "Allow public update stats" 
ON shared_quizzes
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Cho phép xóa
CREATE POLICY "Allow public delete access" 
ON shared_quizzes
FOR DELETE 
USING (true);

-- ============================================
-- BƯỚC 6: TẠO FUNCTION TỰ ĐỘNG CẬP NHẬT UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- BƯỚC 7: TẠO TRIGGER TỰ ĐỘNG CẬP NHẬT UPDATED_AT
-- ============================================

DROP TRIGGER IF EXISTS update_shared_quizzes_updated_at ON shared_quizzes;

CREATE TRIGGER update_shared_quizzes_updated_at
    BEFORE UPDATE ON shared_quizzes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- BƯỚC 8: KIỂM TRA KẾT QUẢ
-- ============================================

-- Xem cấu trúc bảng
SELECT 
    column_name AS "Tên cột",
    data_type AS "Kiểu dữ liệu",
    is_nullable AS "Cho phép NULL",
    column_default AS "Giá trị mặc định"
FROM information_schema.columns
WHERE table_name = 'shared_quizzes'
ORDER BY ordinal_position;

-- Xem các policies
SELECT 
    policyname AS "Policy Name",
    cmd AS "Command"
FROM pg_policies
WHERE tablename = 'shared_quizzes'
ORDER BY cmd;

-- Xem RLS status
SELECT 
    tablename AS "Table",
    rowsecurity AS "RLS Enabled"
FROM pg_tables
WHERE tablename = 'shared_quizzes';

-- ============================================
-- HOÀN THÀNH! 🎉
-- ============================================
-- Bảng shared_quizzes đã được tạo với:
-- ✅ Tất cả các cột cần thiết
-- ✅ Index để tăng tốc độ
-- ✅ RLS được bật
-- ✅ 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- ✅ Trigger tự động cập nhật updated_at
-- 
-- Bây giờ bạn có thể sử dụng ứng dụng!
-- ============================================
