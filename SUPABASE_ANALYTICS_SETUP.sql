-- ⭐ SUPABASE ANALYTICS SETUP
-- Tạo bảng và policy cho Analytics Dashboard

-- 1. Tạo bảng analytics_events
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_name TEXT,
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes để tăng tốc query
    INDEX idx_analytics_session (session_id),
    INDEX idx_analytics_user (user_id),
    INDEX idx_analytics_type (event_type),
    INDEX idx_analytics_created (created_at DESC)
);

-- 2. Enable Row Level Security
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Cho phép INSERT từ mọi người (để tracking)
CREATE POLICY "Allow public insert access"
ON public.analytics_events
FOR INSERT
TO public
WITH CHECK (true);

-- 4. Policy: Cho phép SELECT từ mọi người (để admin xem)
CREATE POLICY "Allow public select access"
ON public.analytics_events
FOR SELECT
TO public
USING (true);

-- 5. Tạo function để tự động xóa dữ li���u cũ (giữ 90 ngày)
CREATE OR REPLACE FUNCTION cleanup_old_analytics()
RETURNS void AS $$
BEGIN
    DELETE FROM public.analytics_events
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- 6. Tạo scheduled job để chạy cleanup mỗi ngày (nếu Supabase hỗ trợ)
-- Lưu ý: Cần enable pg_cron extension
-- SELECT cron.schedule('cleanup-analytics', '0 2 * * *', 'SELECT cleanup_old_analytics()');

-- 7. Tạo view để thống kê nhanh
CREATE OR REPLACE VIEW analytics_summary AS
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

-- 8. Tạo function để lấy thống kê theo khoảng thời gian
CREATE OR REPLACE FUNCTION get_analytics_stats(
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
$$ LANGUAGE plpgsql;

-- 9. Grant permissions
GRANT ALL ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO anon;
GRANT SELECT ON analytics_summary TO authenticated;
GRANT SELECT ON analytics_summary TO anon;

-- ✅ HOÀN TẤT!
-- Chạy các lệnh trên trong Supabase SQL Editor
-- Sau đó test bằng cách:
-- SELECT * FROM analytics_events LIMIT 10;
-- SELECT * FROM analytics_summary;
