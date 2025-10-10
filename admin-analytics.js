/**
 * Admin Analytics Dashboard - Báo cáo chi tiết cho Admin
 * Hiển thị: Người dùng, Thiết bị, Vị trí, Hoạt động
 */

class AdminAnalytics {
    constructor() {
        this.isLoading = false;
        this.currentFilter = 'today';
        this.refreshInterval = null;
    }

    // Kiểm tra quyền Admin
    checkAdminAccess() {
        if (!window.adminManager || !window.adminManager.isAdminMode) {
            this.showAccessDenied();
            return false;
        }
        return true;
    }

    // Hiển thị thông báo từ chối truy cập
    showAccessDenied() {
        const container = document.getElementById('analytics-content');
        if (container) {
            container.innerHTML = `
                <div class="access-denied-card">
                    <div class="access-denied-icon">
                        <i class="fas fa-lock"></i>
                    </div>
                    <h2>Truy Cập Bị Từ Chối</h2>
                    <p>Mục này chỉ dành cho Admin</p>
                    <p class="access-denied-hint">
                        Vui lòng đăng nhập với tài khoản Admin để xem báo cáo
                    </p>
                    <button class="btn-primary" onclick="document.getElementById('admin-logo-trigger').click()">
                        <i class="fas fa-sign-in-alt"></i>
                        Đăng Nhập Admin
                    </button>
                </div>
            `;
        }
    }

    // Load dashboard
    async loadDashboard() {
        if (!this.checkAdminAccess()) return;

        const container = document.getElementById('analytics-content');
        if (!container) return;

        this.showLoading(true);

        try {
            // Lấy dữ liệu từ Supabase
            const data = await this.fetchAnalyticsData();

            // Render dashboard
            this.renderDashboard(data);

            // Bật auto-refresh mỗi 30 giây
            this.startAutoRefresh();

        } catch (error) {
            console.error('Error loading analytics:', error);
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }

    // Lấy dữ liệu analytics từ Supabase với tối ưu hóa
    async fetchAnalyticsData() {
        if (!window.supabaseQuizManager || !window.supabaseQuizManager.supabase) {
            throw new Error('Supabase chưa được cấu hình. Vui lòng cấu hình Supabase trước.');
        }

        const supabase = window.supabaseQuizManager.supabase;

        // Tính toán khoảng thời gian
        const timeRange = this.getTimeRange(this.currentFilter);

        // Kiểm tra cache
        const cacheKey = `analytics_cache_${this.currentFilter}`;
        const cached = this.getCache(cacheKey);
        if (cached) {
            console.log('📦 Using cached analytics data');
            return cached;
        }

        try {
            console.time('⚡ Fetch analytics data');
            
            // Lấy tất cả events trong khoảng thời gian với limit hợp lý
            const { data: events, error } = await supabase
                .from('analytics_events')
                .select('*')
                .gte('created_at', timeRange.start)
                .lte('created_at', timeRange.end)
                .order('created_at', { ascending: false })
                .limit(10000); // Giới hạn để tăng tốc độ

            console.timeEnd('⚡ Fetch analytics data');

            if (error) throw error;

            // Xử lý và phân tích dữ liệu
            console.time('⚡ Process analytics data');
            const processedData = this.processAnalyticsData(events || []);
            console.timeEnd('⚡ Process analytics data');

            // Cache kết quả (5 phút)
            this.setCache(cacheKey, processedData, 300000);

            return processedData;

        } catch (error) {
            console.error('Supabase query error:', error);
            throw error;
        }
    }

    // Cache helpers
    getCache(key) {
        try {
            const cached = sessionStorage.getItem(key);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < 300000) { // 5 phút
                    return data;
                }
            }
        } catch (error) {
            console.warn('Cache read failed:', error);
        }
        return null;
    }

    setCache(key, data, ttl = 300000) {
        try {
            sessionStorage.setItem(key, JSON.stringify({
                data: data,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.warn('Cache write failed:', error);
        }
    }

    clearCache() {
        try {
            const keys = Object.keys(sessionStorage);
            keys.forEach(key => {
                if (key.startsWith('analytics_cache_')) {
                    sessionStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.warn('Cache clear failed:', error);
        }
    }

    // Tính toán khoảng thời gian
    getTimeRange(filter) {
        const now = new Date();
        let start = new Date();

        switch (filter) {
            case 'today':
                start.setHours(0, 0, 0, 0);
                break;
            case 'yesterday':
                start.setDate(start.getDate() - 1);
                start.setHours(0, 0, 0, 0);
                now.setDate(now.getDate() - 1);
                now.setHours(23, 59, 59, 999);
                break;
            case 'week':
                start.setDate(start.getDate() - 7);
                break;
            case 'month':
                start.setMonth(start.getMonth() - 1);
                break;
            case 'all':
                start = new Date('2024-01-01');
                break;
        }

        return {
            start: start.toISOString(),
            end: now.toISOString()
        };
    }

    // Xử lý dữ liệu analytics
    processAnalyticsData(events) {
        const data = {
            totalVisits: 0,
            uniqueUsers: new Set(),
            uniqueSessions: new Set(),
            pageViews: [],
            userEvents: [],
            devices: {},
            browsers: {},
            os: {},
            countries: {},
            cities: {},
            referrers: {},
            hourlyActivity: Array(24).fill(0),
            recentVisitors: [],
            topPages: {},
            eventCounts: {}
        };

        events.forEach(event => {
            // Đếm unique users và sessions
            data.uniqueUsers.add(event.user_id);
            data.uniqueSessions.add(event.session_id);

            // Phân loại theo event type
            if (event.event_type === 'page_view') {
                data.totalVisits++;
                data.pageViews.push(event);

                const eventData = event.event_data;

                // Thống kê thiết bị
                const deviceInfo = eventData.deviceType || {};
                const deviceType = typeof deviceInfo === 'string' ? deviceInfo : (deviceInfo.type || 'Unknown');
                const deviceModel = typeof deviceInfo === 'object' ? deviceInfo.fullInfo : deviceType;
                data.devices[deviceType] = (data.devices[deviceType] || 0) + 1;

                // Thống kê trình duyệt
                const browser = eventData.browser?.name || 'Unknown';
                data.browsers[browser] = (data.browsers[browser] || 0) + 1;

                // Thống kê OS
                const osName = eventData.os?.name || 'Unknown';
                data.os[osName] = (data.os[osName] || 0) + 1;

                // Thống kê quốc gia
                const country = eventData.ip?.country || 'Unknown';
                data.countries[country] = (data.countries[country] || 0) + 1;

                // Thống kê thành phố
                const city = eventData.ip?.city || 'Unknown';
                data.cities[city] = (data.cities[city] || 0) + 1;

                // Thống kê referrer
                const referrer = eventData.referrer || 'Direct';
                data.referrers[referrer] = (data.referrers[referrer] || 0) + 1;

                // Thống kê theo giờ
                const hour = new Date(event.created_at).getHours();
                data.hourlyActivity[hour]++;

                // Thống kê trang
                const page = eventData.currentUrl || 'Unknown';
                data.topPages[page] = (data.topPages[page] || 0) + 1;

                // Thêm vào recent visitors
                data.recentVisitors.push({
                    timestamp: event.created_at,
                    userId: event.user_id,
                    sessionId: event.session_id,
                    device: deviceType,
                    deviceModel: deviceModel,
                    browser: browser,
                    os: osName,
                    country: country,
                    city: city,
                    region: eventData.ip?.region || 'Unknown',
                    ip: eventData.ip?.ip || 'Unknown',
                    isp: eventData.ip?.isp || 'Unknown',
                    referrer: referrer,
                    page: eventData.pageTitle || 'Unknown'
                });
            } else {
                data.userEvents.push(event);

                // Đếm events
                const eventName = event.event_name || event.event_type;
                data.eventCounts[eventName] = (data.eventCounts[eventName] || 0) + 1;
            }
        });

        // Convert Sets to counts
        data.uniqueUsersCount = data.uniqueUsers.size;
        data.uniqueSessionsCount = data.uniqueSessions.size;

        // Sort recent visitors
        data.recentVisitors.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        data.recentVisitors = data.recentVisitors.slice(0, 50); // Giới hạn 50 visitors gần nhất

        return data;
    }

    // Render dashboard
    renderDashboard(data) {
        const container = document.getElementById('analytics-content');
        if (!container) return;

        container.innerHTML = `
            <!-- Filter Bar -->
            <div class="analytics-filter-bar">
                <div class="filter-buttons">
                    <button class="filter-btn ${this.currentFilter === 'today' ? 'active' : ''}" onclick="adminAnalytics.setFilter('today')">
                        Hôm Nay
                    </button>
                    <button class="filter-btn ${this.currentFilter === 'yesterday' ? 'active' : ''}" onclick="adminAnalytics.setFilter('yesterday')">
                        Hôm Qua
                    </button>
                    <button class="filter-btn ${this.currentFilter === 'week' ? 'active' : ''}" onclick="adminAnalytics.setFilter('week')">
                        7 Ngày
                    </button>
                    <button class="filter-btn ${this.currentFilter === 'month' ? 'active' : ''}" onclick="adminAnalytics.setFilter('month')">
                        30 Ngày
                    </button>
                    <button class="filter-btn ${this.currentFilter === 'all' ? 'active' : ''}" onclick="adminAnalytics.setFilter('all')">
                        Tất Cả
                    </button>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn-refresh" onclick="adminAnalytics.refreshData()">
                        <i class="fas fa-sync-alt"></i>
                        Làm Mới
                    </button>
                    <button class="btn-refresh" onclick="adminAnalytics.clearCacheAndReload()" title="Xóa cache và tải lại">
                        <i class="fas fa-trash-alt"></i>
                        Xóa Cache
                    </button>
                </div>
            </div>

            <!-- Stats Overview -->
            <div class="analytics-stats-grid">
                <div class="analytics-stat-card">
                    <div class="stat-icon blue">
                        <i class="fas fa-eye"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Tổng Lượt Truy Cập</div>
                        <div class="stat-value">${data.totalVisits.toLocaleString()}</div>
                    </div>
                </div>

                <div class="analytics-stat-card">
                    <div class="stat-icon green">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Người Dùng Duy Nhất</div>
                        <div class="stat-value">${data.uniqueUsersCount.toLocaleString()}</div>
                    </div>
                </div>

                <div class="analytics-stat-card">
                    <div class="stat-icon purple">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Phiên Làm Việc</div>
                        <div class="stat-value">${data.uniqueSessionsCount.toLocaleString()}</div>
                    </div>
                </div>

                <div class="analytics-stat-card">
                    <div class="stat-icon orange">
                        <i class="fas fa-mouse-pointer"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Tổng Sự Kiện</div>
                        <div class="stat-value">${data.userEvents.length.toLocaleString()}</div>
                    </div>
                </div>
            </div>

            <!-- Charts Row -->
            <div class="analytics-charts-row">
                <!-- Devices Chart -->
                <div class="analytics-chart-card">
                    <h3><i class="fas fa-mobile-alt"></i> Thiết Bị</h3>
                    <div class="chart-content">
                        ${this.renderPieChart(data.devices)}
                    </div>
                </div>

                <!-- Browsers Chart -->
                <div class="analytics-chart-card">
                    <h3><i class="fas fa-globe"></i> Trình Duyệt</h3>
                    <div class="chart-content">
                        ${this.renderPieChart(data.browsers)}
                    </div>
                </div>

                <!-- OS Chart -->
                <div class="analytics-chart-card">
                    <h3><i class="fas fa-desktop"></i> Hệ Điều Hành</h3>
                    <div class="chart-content">
                        ${this.renderPieChart(data.os)}
                    </div>
                </div>
            </div>

            <!-- Hourly Activity Chart -->
            <div class="analytics-chart-card full-width">
                <h3><i class="fas fa-chart-line"></i> Hoạt Động Theo Giờ</h3>
                <div class="chart-content">
                    ${this.renderBarChart(data.hourlyActivity)}
                </div>
            </div>

            <!-- Location Stats -->
            <div class="analytics-charts-row">
                <div class="analytics-chart-card">
                    <h3><i class="fas fa-globe-americas"></i> Quốc Gia</h3>
                    <div class="chart-content">
                        ${this.renderListChart(data.countries)}
                    </div>
                </div>

                <div class="analytics-chart-card">
                    <h3><i class="fas fa-city"></i> Thành Phố</h3>
                    <div class="chart-content">
                        ${this.renderListChart(data.cities)}
                    </div>
                </div>
            </div>

            <!-- Recent Visitors Table -->
            <div class="analytics-table-card">
                <h3><i class="fas fa-users"></i> Người Dùng Gần Đây (${data.recentVisitors.length})</h3>
                <div class="analytics-table-wrapper">
                    ${this.renderVisitorsTable(data.recentVisitors)}
                </div>
            </div>

            <!-- Events Table -->
            <div class="analytics-table-card">
                <h3><i class="fas fa-bolt"></i> Sự Kiện Người Dùng</h3>
                <div class="chart-content">
                    ${this.renderListChart(data.eventCounts)}
                </div>
            </div>
        `;
    }

    // Render Pie Chart
    renderPieChart(data) {
        const total = Object.values(data).reduce((sum, val) => sum + val, 0);
        if (total === 0) {
            return '<div class="no-data">Chưa có dữ liệu</div>';
        }

        const colors = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
        let html = '<div class="pie-chart-list">';

        Object.entries(data)
            .sort((a, b) => b[1] - a[1])
            .forEach(([key, value], index) => {
                const percentage = ((value / total) * 100).toFixed(1);
                const color = colors[index % colors.length];

                html += `
                    <div class="pie-chart-item">
                        <div class="pie-chart-label">
                            <span class="pie-chart-color" style="background: ${color};"></span>
                            <span class="pie-chart-name">${key}</span>
                        </div>
                        <div class="pie-chart-value">
                            <span class="pie-chart-count">${value}</span>
                            <span class="pie-chart-percent">(${percentage}%)</span>
                        </div>
                        <div class="pie-chart-bar">
                            <div class="pie-chart-bar-fill" style="width: ${percentage}%; background: ${color};"></div>
                        </div>
                    </div>
                `;
            });

        html += '</div>';
        return html;
    }

    // Render Bar Chart
    renderBarChart(data) {
        const max = Math.max(...data, 1);

        let html = '<div class="bar-chart">';

        data.forEach((value, hour) => {
            const height = (value / max) * 100;
            const label = `${hour}:00`;

            html += `
                <div class="bar-chart-item">
                    <div class="bar-chart-bar-wrapper">
                        <div class="bar-chart-bar" style="height: ${height}%;" title="${value} lượt truy cập">
                            ${value > 0 ? `<span class="bar-chart-value">${value}</span>` : ''}
                        </div>
                    </div>
                    <div class="bar-chart-label">${label}</div>
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    // Render List Chart
    renderListChart(data) {
        const total = Object.values(data).reduce((sum, val) => sum + val, 0);
        if (total === 0) {
            return '<div class="no-data">Chưa có dữ liệu</div>';
        }

        let html = '<div class="list-chart">';

        Object.entries(data)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .forEach(([key, value]) => {
                const percentage = ((value / total) * 100).toFixed(1);

                html += `
                    <div class="list-chart-item">
                        <div class="list-chart-label">${key}</div>
                        <div class="list-chart-bar">
                            <div class="list-chart-bar-fill" style="width: ${percentage}%;"></div>
                        </div>
                        <div class="list-chart-value">${value} (${percentage}%)</div>
                    </div>
                `;
            });

        html += '</div>';
        return html;
    }

    // Render Visitors Table
    renderVisitorsTable(visitors) {
        if (visitors.length === 0) {
            return '<div class="no-data">Chưa có người dùng nào</div>';
        }

        let html = `
            <table class="analytics-table">
                <thead>
                    <tr>
                        <th>Thời Gian</th>
                        <th>IP / ISP</th>
                        <th>Vị Trí</th>
                        <th>Thiết Bị</th>
                        <th>Model</th>
                        <th>Trình Duyệt</th>
                        <th>OS</th>
                        <th>Nguồn</th>
                        <th>Trang</th>
                    </tr>
                </thead>
                <tbody>
        `;

        visitors.forEach(visitor => {
            const time = new Date(visitor.timestamp).toLocaleString('vi-VN');
            const location = visitor.city !== 'Unknown' && visitor.region !== 'Unknown'
                ? `${visitor.city}, ${visitor.region}, ${visitor.country}`
                : (visitor.city !== 'Unknown' ? `${visitor.city}, ${visitor.country}` : visitor.country);
            const ipInfo = visitor.isp !== 'Unknown' ? `${visitor.ip}<br><small style="color: #6b7280;">${visitor.isp}</small>` : visitor.ip;
            const deviceModel = visitor.deviceModel !== 'Unknown' ? visitor.deviceModel : visitor.device;

            html += `
                <tr>
                    <td style="white-space: nowrap;">${time}</td>
                    <td><code style="font-size: 11px;">${ipInfo}</code></td>
                    <td style="max-width: 150px;">${location}</td>
                    <td><span class="badge badge-${visitor.device.toLowerCase()}">${visitor.device}</span></td>
                    <td style="font-size: 12px; max-width: 120px; overflow: hidden; text-overflow: ellipsis;" title="${deviceModel}">${deviceModel}</td>
                    <td>${visitor.browser}</td>
                    <td>${visitor.os}</td>
                    <td style="max-width: 100px;">${visitor.referrer === 'Direct' ? '<span class="badge badge-direct">Direct</span>' : `<span style="font-size: 11px;" title="${visitor.referrer}">${visitor.referrer.substring(0, 20)}...</span>`}</td>
                    <td class="text-truncate" title="${visitor.page}">${visitor.page}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        return html;
    }

    // Set filter
    async setFilter(filter) {
        this.currentFilter = filter;
        await this.loadDashboard();
    }

    // Start auto-refresh
    startAutoRefresh() {
        this.stopAutoRefresh();
        this.refreshInterval = setInterval(() => {
            this.loadDashboard();
        }, 30000); // Refresh mỗi 30 giây
    }

    // Stop auto-refresh
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    // Refresh data (sử dụng cache nếu có)
    async refreshData() {
        await this.loadDashboard();
    }

    // Clear cache và reload
    async clearCacheAndReload() {
        console.log('🗑️ Clearing cache...');
        this.clearCache();
        
        // Xóa cache IP info
        try {
            localStorage.removeItem('cached_ip_info');
        } catch (error) {
            console.warn('Failed to clear IP cache:', error);
        }
        
        console.log('✅ Cache cleared, reloading...');
        await this.loadDashboard();
    }

    // Show loading
    showLoading(show) {
        const container = document.getElementById('analytics-content');
        if (!container) return;

        if (show) {
            container.innerHTML = `
                <div class="analytics-loading">
                    <div class="analytics-loading-spinner"></div>
                    <div class="analytics-loading-text">Đang tải báo cáo...</div>
                </div>
            `;
        }
    }

    // Show error
    showError(message) {
        const container = document.getElementById('analytics-content');
        if (!container) return;

        container.innerHTML = `
            <div class="analytics-error-card">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Lỗi Khi Tải Báo Cáo</h3>
                <p>${message}</p>
                <button class="btn-primary" onclick="adminAnalytics.loadDashboard()">
                    <i class="fas fa-sync-alt"></i>
                    Thử Lại
                </button>
            </div>
        `;
    }
}

// Khởi tạo Admin Analytics
const adminAnalytics = new AdminAnalytics();
window.adminAnalytics = adminAnalytics;

console.log('📊 Admin Analytics loaded');
