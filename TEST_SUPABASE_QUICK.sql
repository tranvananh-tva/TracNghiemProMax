-- ⚡ TEST NHANH SUPABASE - Chạy từng dòng một
-- Copy từng phần và paste vào Supabase SQL Editor

-- ============================================
-- BƯỚC 1: Tạo bảng đơn giản
-- ============================================
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_name TEXT,
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- BƯỚC 2: Tạo indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_analytics_session ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON public.analytics_events(created_at DESC);

-- ============================================
-- BƯỚC 3: Bật RLS
-- ============================================
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- BƯỚC 4: Xóa policies cũ (nếu có)
-- ============================================
DROP POLICY IF EXISTS "Allow public insert access" ON public.analytics_events;
DROP POLICY IF EXISTS "Allow public select access" ON public.analytics_events;

-- ============================================
-- BƯỚC 5: Tạo policies mới
-- ============================================
CREATE POLICY "Allow public insert access"
ON public.analytics_events
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow public select access"
ON public.analytics_events
FOR SELECT
TO public
USING (true);

-- ============================================
-- BƯỚC 6: Grant permissions
-- ============================================
GRANT ALL ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.analytics_events_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.analytics_events_id_seq TO anon;

-- ============================================
-- BƯỚC 7: Test insert
-- ============================================
INSERT INTO public.analytics_events (session_id, user_id, event_type, event_name, event_data)
VALUES ('test_session', 'test_user', 'page_view', null, '{"test": true}'::jsonb);

-- ============================================
-- BƯỚC 8: Test select
-- ============================================
SELECT * FROM public.analytics_events;

-- ✅ Nếu thấy dữ liệu → THÀNH CÔNG!
-- ✅ Nếu không có lỗi → Bảng đã sẵn sàng!
