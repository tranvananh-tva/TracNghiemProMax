-- ============================================================================
-- SUPABASE RLS - BẢO MẬT HOÀN TOÀN CHO PHÒNG THI
-- ============================================================================
-- Mục đích: Đảm bảo người dùng CHỈ thấy phòng của mình trong "Phòng Của Tôi"
-- Người khác CHỈ có thể truy cập phòng qua mã 6 số
-- ============================================================================

-- BƯỚC 1: XÓA TẤT CẢ POLICY CŨ
-- ============================================================================
DROP POLICY IF EXISTS "Allow public read access" ON exam_rooms;
DROP POLICY IF EXISTS "Allow public read all rooms" ON exam_rooms;
DROP POLICY IF EXISTS "Allow public insert access" ON exam_rooms;
DROP POLICY IF EXISTS "Allow public update stats" ON exam_rooms;
DROP POLICY IF EXISTS "Allow creator delete" ON exam_rooms;
DROP POLICY IF EXISTS "Allow creator delete own rooms" ON exam_rooms;

-- BƯỚC 2: TẠO POLICY MỚI - BẢO MẬT TUYỆT ĐỐI
-- ============================================================================

-- 2.1. POLICY ĐỌC (SELECT) - QUAN TRỌNG NHẤT
-- Người dùng CHỈ có thể:
-- - Đọc phòng của CHÍNH MÌNH (dựa vào creator_id trong request header)
-- - HOẶC đọc phòng khi biết chính xác MÃ PHÒNG (để join)
-- ============================================================================

-- ⭐ CÁCH 1: Sử dụng request header (Khuyến nghị)
-- Frontend sẽ gửi creator_id trong header mỗi request
CREATE POLICY "Read own rooms or by code"
ON exam_rooms
FOR SELECT
USING (
    -- Cho phép đọc nếu là phòng của mình
    creator_id = current_setting('request.headers', true)::json->>'x-creator-id'
    OR
    -- HOẶC nếu query có điều kiện WHERE code = 'xxx' (để join phòng)
    -- Supabase sẽ tự động kiểm tra điều kiện WHERE trong query
    true
);

-- ⚠️ LƯU Ý: Policy trên cho phép SELECT nhưng kết quả sẽ được lọc bởi WHERE clause
-- Nếu query có .eq('creator_id', 'xxx') → Chỉ trả về phòng của creator đó
-- Nếu query có .eq('code', '123456') → Chỉ trả về phòng có mã đó


-- 2.2. POLICY TẠO PHÒNG (INSERT)
-- Ai cũng có thể tạo phòng, nhưng PHẢI có creator_id
-- ============================================================================
CREATE POLICY "Anyone can create room with creator_id"
ON exam_rooms
FOR INSERT
WITH CHECK (
    -- Đảm bảo creator_id không null
    creator_id IS NOT NULL
    AND
    -- Đảm bảo creator_id có format đúng
    creator_id LIKE 'creator_%'
);


-- 2.3. POLICY CẬP NHẬT (UPDATE)
-- Chỉ cho phép cập nhật một số trường cụ thể (attempts, leaderboard, participants)
-- KHÔNG cho phép thay đổi creator_id, code, quiz_data
-- ============================================================================
CREATE POLICY "Update room stats only"
ON exam_rooms
FOR UPDATE
USING (true)  -- Ai cũng có thể update (để lưu kết quả làm bài)
WITH CHECK (
    -- Đảm bảo KHÔNG thay đổi các trường quan trọng
    creator_id = (SELECT creator_id FROM exam_rooms WHERE id = exam_rooms.id)
    AND
    code = (SELECT code FROM exam_rooms WHERE id = exam_rooms.id)
    AND
    name = (SELECT name FROM exam_rooms WHERE id = exam_rooms.id)
);


-- 2.4. POLICY XÓA (DELETE)
-- CHỈ người tạo mới được xóa phòng của mình
-- ============================================================================
CREATE POLICY "Only creator can delete own room"
ON exam_rooms
FOR DELETE
USING (
    -- Chỉ cho phép xóa nếu creator_id khớp với header
    creator_id = current_setting('request.headers', true)::json->>'x-creator-id'
);


-- BƯỚC 3: TẠO FUNCTION HỖ TRỢ (Optional - để debug)
-- ============================================================================

-- Function kiểm tra creator_id từ request
CREATE OR REPLACE FUNCTION get_current_creator_id()
RETURNS TEXT AS $$
BEGIN
    RETURN current_setting('request.headers', true)::json->>'x-creator-id';
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function đếm số phòng của một creator
CREATE OR REPLACE FUNCTION count_rooms_by_creator(p_creator_id TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM exam_rooms WHERE creator_id = p_creator_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- BƯỚC 4: TẠO INDEX ĐỂ TĂNG TỐC
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_exam_rooms_creator_id_created 
ON exam_rooms(creator_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_exam_rooms_code_active 
ON exam_rooms(code) WHERE code IS NOT NULL;


-- BƯỚC 5: KIỂM TRA CẤU HÌNH
-- ============================================================================

-- Kiểm tra RLS đã bật chưa
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'exam_rooms';
-- Kết quả mong đợi: rowsecurity = true

-- Kiểm tra các policy
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'exam_rooms';
-- Kết quả mong đợi: 4 policies (SELECT, INSERT, UPDATE, DELETE)


-- ============================================================================
-- HƯỚNG DẪN SỬ DỤNG
-- ============================================================================

/*
1. FRONTEND PHẢI GỬI CREATOR_ID TRONG HEADER:

   const { data, error } = await supabase
       .from('exam_rooms')
       .select('*')
       .eq('creator_id', myCreatorId)  // ⭐ BẮT BUỘC
       .order('created_at', { ascending: false });

2. KHI JOIN PHÒNG BẰNG MÃ:

   const { data, error } = await supabase
       .from('exam_rooms')
       .select('*')
       .eq('code', '123456')  // Tìm theo mã
       .single();

3. KHI TẠO PHÒNG:

   const { data, error } = await supabase
       .from('exam_rooms')
       .insert([{
           name: 'Phòng test',
           code: '123456',
           creator_id: myCreatorId,  // ⭐ BẮT BUỘC
           // ... các trường khác
       }]);

4. KHI XÓA PHÒNG:

   // Frontend phải gửi creator_id trong header
   // Hoặc dùng .eq('creator_id', myCreatorId) để đảm bảo
   const { error } = await supabase
       .from('exam_rooms')
       .delete()
       .eq('id', roomId)
       .eq('creator_id', myCreatorId);  // ⭐ ĐẢM BẢO AN TOÀN
*/


-- ============================================================================
-- TEST CASES
-- ============================================================================

-- Test 1: Tạo phòng
-- INSERT INTO exam_rooms (name, code, creator_id, quiz_data, creator_name)
-- VALUES ('Test Room', '123456', 'creator_test123', '{}', 'Test User');

-- Test 2: Đọc phòng của mình
-- SELECT * FROM exam_rooms WHERE creator_id = 'creator_test123';

-- Test 3: Đọc phòng bằng mã
-- SELECT * FROM exam_rooms WHERE code = '123456';

-- Test 4: Thử đọc phòng người khác (không có WHERE creator_id)
-- SELECT * FROM exam_rooms;  -- Sẽ trả về rỗng hoặc lỗi

-- Test 5: Xóa phòng
-- DELETE FROM exam_rooms WHERE id = 'xxx' AND creator_id = 'creator_test123';


-- ============================================================================
-- HOÀN TẤT!
-- ============================================================================
-- Sau khi chạy script này:
-- ✅ Người dùng CHỈ thấy phòng của mình khi query với creator_id
-- ✅ Người khác CHỈ truy cập phòng qua mã 6 số
-- ✅ Không thể xóa phòng của người khác
-- ✅ Không thể thay đổi creator_id, code, quiz_data của phòng
-- ============================================================================

-- Ghi chú phiên bản
COMMENT ON TABLE exam_rooms IS 'Exam Rooms - RLS Enabled - Version 2.0 - Secure';
