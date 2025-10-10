-- ⭐ SUPABASE ANALYTICS SETUP - FIXED VERSION
-- Tạo bảng và policy cho Analytics Dashboard
-- Chạy từng phần một trong Supabase SQL Editor

-- ============================================
-- PHẦN 1: TẠO BẢNG
-- ============================================

-- 1. Tạo bảng analytics_events
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_name TEXT,
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tạo indexes để tăng tốc query
CREATE INDEX IF NOT EXISTS idx_analytics_session ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON public.analytics_events(created_at DESC);

-- ============================================
-- PHẦN 2: BẢO MẬT (RLS)
-- ============================================

-- 3. Enable Row Level Security
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- 4. Xóa policies cũ nếu có (để tránh lỗi duplicate)
DROP POLICY IF EXISTS "Allow public insert access" ON public.analytics_events;
DROP POLICY IF EXISTS "Allow public select access" ON public.analytics_events;

-- 5. Policy: Cho phép INSERT từ mọi người (để tracking)
CREATE POLICY "Allow public insert access"
ON public.analytics_events
FOR INSERT
TO public
WITH CHECK (true);

-- 6. Policy: Cho phép SELECT từ mọi người (để admin xem)
CREATE POLICY "Allow public select access"
ON public.analytics_events
FOR SELECT
TO public
USING (true);

-- ============================================
-- PHẦN 3: FUNCTIONS & VIEWS
-- ============================================

-- 7. Tạo function để tự động xóa dữ liệu cũ (giữ 90 ngày)
CREATE OR REPLACE FUNCTION public.cleanup_old_analytics()
RETURNS void AS $$
BEGIN
    DELETE FROM public.analytics_events
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Tạo view để thống kê nhanh
CREATE OR REPLACE VIEW public.analytics_summary AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_events,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) as page_views,
    COUNT(CASE WHEN event_type = 'event' THEN 1 END) as user_events
FROM public.analytics_events
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 9. Tạo function để lấy thống kê theo khoảng thời gian
CREATE OR REPLACE FUNCTION public.get_analytics_stats(
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    total_visits BIGINT,
    unique_users BIGINT,
    unique_sessions BIGINT,
    total_events BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) as total_visits,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT session_id) as unique_sessions,
        COUNT(*) as total_events
    FROM public.analytics_events
    WHERE created_at >= start_date AND created_at <= end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PHẦN 4: PERMISSIONS
-- ============================================

-- 10. Grant permissions
GRANT ALL ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO anon;
GRANT SELECT ON public.analytics_summary TO authenticated;
GRANT SELECT ON public.analytics_summary TO anon;

-- 11. Grant permissions cho sequence
GRANT USAGE, SELECT ON SEQUENCE public.analytics_events_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.analytics_events_id_seq TO anon;

-- ============================================
-- PHẦN 5: TEST
-- ============================================

-- 12. Test insert (optional - để kiểm tra)
-- INSERT INTO public.analytics_events (session_id, user_id, event_type, event_name, event_data)
-- VALUES ('test_session', 'test_user', 'page_view', null, '{"test": true}'::jsonb);

-- 13. Test select
-- SELECT * FROM public.analytics_events LIMIT 5;

-- 14. Test view
-- SELECT * FROM public.analytics_summary;

-- ✅ HOÀN TẤT!
-- Nếu không có lỗi, bảng đã được tạo thành công!
