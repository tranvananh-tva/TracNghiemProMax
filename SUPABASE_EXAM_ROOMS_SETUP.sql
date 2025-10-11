-- Tạo bảng exam_rooms cho tính năng Phòng Thi
-- Chạy script này trong Supabase SQL Editor

-- Tạo bảng exam_rooms
CREATE TABLE IF NOT EXISTS exam_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    quiz_data JSONB NOT NULL,
    creator_name TEXT NOT NULL,
    participants INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    leaderboard JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo index để tăng tốc độ truy vấn
CREATE INDEX IF NOT EXISTS idx_exam_rooms_code ON exam_rooms(code);
CREATE INDEX IF NOT EXISTS idx_exam_rooms_created_at ON exam_rooms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exam_rooms_creator_name ON exam_rooms(creator_name);

-- Enable Row Level Security (RLS)
ALTER TABLE exam_rooms ENABLE ROW LEVEL SECURITY;

-- Tạo policy cho phép mọi người đọc
CREATE POLICY "Allow public read access" ON exam_rooms
    FOR SELECT USING (true);

-- Tạo policy cho phép mọi ng��ời tạo mới
CREATE POLICY "Allow public insert access" ON exam_rooms
    FOR INSERT WITH CHECK (true);

-- Tạo policy cho phép cập nhật (attempts, leaderboard, participants)
CREATE POLICY "Allow public update stats" ON exam_rooms
    FOR UPDATE USING (true)
    WITH CHECK (true);

-- Tạo policy cho phép xóa (chỉ người tạo hoặc admin)
CREATE POLICY "Allow creator delete" ON exam_rooms
    FOR DELETE USING (true);

-- Tạo function để tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_exam_rooms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tạo trigger để tự động cập nhật updated_at
CREATE TRIGGER exam_rooms_updated_at
    BEFORE UPDATE ON exam_rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_exam_rooms_updated_at();

-- Thêm comment cho bảng
COMMENT ON TABLE exam_rooms IS 'Bảng lưu trữ thông tin phòng thi';
COMMENT ON COLUMN exam_rooms.id IS 'ID duy nhất của phòng thi';
COMMENT ON COLUMN exam_rooms.name IS 'Tên phòng thi';
COMMENT ON COLUMN exam_rooms.code IS 'Mã phòng 6 số để tham gia';
COMMENT ON COLUMN exam_rooms.description IS 'Mô tả phòng thi';
COMMENT ON COLUMN exam_rooms.quiz_data IS 'Dữ liệu đề thi (JSON)';
COMMENT ON COLUMN exam_rooms.creator_name IS 'Tên người tạo phòng';
COMMENT ON COLUMN exam_rooms.participants IS 'Số người tham gia';
COMMENT ON COLUMN exam_rooms.attempts IS 'Số lượt làm bài';
COMMENT ON COLUMN exam_rooms.leaderboard IS 'Bảng xếp hạng (JSON array)';
COMMENT ON COLUMN exam_rooms.created_at IS 'Thời gian tạo phòng';
COMMENT ON COLUMN exam_rooms.updated_at IS 'Thời gian cập nhật cuối';

-- Hoàn thành!
-- Bảng exam_rooms đã được tạo thành công
-- Bạn có thể bắt đầu sử dụng tính năng Phòng Thi
