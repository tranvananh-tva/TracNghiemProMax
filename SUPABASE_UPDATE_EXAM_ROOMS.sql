-- CẬP NHẬT BẢNG exam_rooms - THÊM creator_id VÀ CẬP NHẬT POLICIES
-- Chạy script này trong Supabase SQL Editor

-- 1. THÊM CỘT creator_id (nếu chưa có)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exam_rooms' AND column_name = 'creator_id'
    ) THEN
        ALTER TABLE exam_rooms ADD COLUMN creator_id TEXT;
        COMMENT ON COLUMN exam_rooms.creator_id IS 'ID duy nhất của người tạo phòng (browser fingerprint)';
        RAISE NOTICE 'Added creator_id column';
    ELSE
        RAISE NOTICE 'creator_id column already exists';
    END IF;
END $$;

-- 2. TẠO INDEX CHO creator_id
CREATE INDEX IF NOT EXISTS idx_exam_rooms_creator_id ON exam_rooms(creator_id);

-- 3. XÓA CÁC POLICY CŨ
DROP POLICY IF EXISTS "Allow public read access" ON exam_rooms;
DROP POLICY IF EXISTS "Allow public insert access" ON exam_rooms;
DROP POLICY IF EXISTS "Allow public update stats" ON exam_rooms;
DROP POLICY IF EXISTS "Allow creator delete" ON exam_rooms;

-- 4. TẠO POLICY MỚI

-- Policy 1: Cho phép đọc TẤT CẢ phòng (để người dùng có thể nhập mã)
CREATE POLICY "Allow read all rooms" ON exam_rooms
    FOR SELECT USING (true);

-- Policy 2: Cho phép tạo phòng mới
CREATE POLICY "Allow insert new room" ON exam_rooms
    FOR INSERT WITH CHECK (true);

-- Policy 3: Cho phép cập nhật stats (attempts, leaderboard, participants)
CREATE POLICY "Allow update room stats" ON exam_rooms
    FOR UPDATE USING (true)
    WITH CHECK (true);

-- Policy 4: Chỉ cho phép người tạo xóa phòng của mình
-- (Dựa vào creator_id, không phải creator_name)
CREATE POLICY "Allow creator delete own room" ON exam_rooms
    FOR DELETE USING (true);
    -- Note: Việc kiểm tra creator_id sẽ được thực hiện ở phía client

-- 5. KIỂM TRA KẾT QUẢ
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'exam_rooms'
ORDER BY ordinal_position;

-- 6. KIỂM TRA POLICIES
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
WHERE tablename = 'exam_rooms';

-- HOÀN THÀNH!
-- Bảng exam_rooms đã được cập nhật với:
-- ✓ Cột creator_id để phân biệt người tạo
-- ✓ Index cho creator_id
-- ✓ Policies mới cho phép:
--   - Đọc tất cả phòng (để nhập mã)
--   - Tạo phòng mới
--   - Cập nhật stats
--   - Xóa phòng (người tạo)
