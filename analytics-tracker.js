/**
 * Analytics Tracker - Theo dõi hoạt động người dùng
 * Tự động ghi lại: Truy cập, Thiết bị, Vị trí, Hành động
 */

class AnalyticsTracker {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.userId = this.getUserId();
        this.isTracking = false;
        this.activityQueue = [];
        this.flushInterval = null;
    }

    // Tạo Session ID duy nhất
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Lấy hoặc tạo User ID
    getUserId() {
        let userId = localStorage.getItem('analytics_user_id');
        if (!userId) {
            userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('analytics_user_id', userId);
        }
        return userId;
    }

    // Khởi động tracking
    async startTracking() {
        if (this.isTracking) return;
        
        this.isTracking = true;
        console.log('📊 Analytics tracking started');

        // Thu thập thông tin thiết bị và môi trường
        const deviceInfo = await this.getDeviceInfo();
        
        // Ghi lại lượt truy cập
        await this.trackPageView(deviceInfo);

        // Theo dõi các sự kiện
        this.setupEventListeners();

        // Flush queue mỗi 30 giây
        this.flushInterval = setInterval(() => {
            this.flushQueue();
        }, 30000);

        // Flush khi đóng trang
        window.addEventListener('beforeunload', () => {
            this.flushQueue();
        });
    }

    // Dừng tracking
    stopTracking() {
        this.isTracking = false;
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = null;
        }
        this.flushQueue();
        console.log('📊 Analytics tracking stopped');
    }

    // Thu thập thông tin thiết bị
    async getDeviceInfo() {
        const info = {
            // Thông tin trình duyệt
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            
            // Thông tin màn hình
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            
            // Thông tin viewport
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            
            // Thông tin thiết bị
            deviceType: this.getDeviceType(),
            browser: this.getBrowserInfo(),
            os: this.getOSInfo(),
            
            // Thông tin kết nối
            connectionType: this.getConnectionType(),
            
            // Thông tin trang
            referrer: document.referrer || 'Direct',
            currentUrl: window.location.href,
            pageTitle: document.title,
            
            // Thông tin thời gian
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timestamp: new Date().toISOString(),
            
            // Session
            sessionId: this.sessionId,
            userId: this.userId
        };

        // Thử lấy vị trí địa lý (nếu được phép)
        try {
            const location = await this.getGeolocation();
            info.location = location;
        } catch (error) {
            info.location = null;
        }

        // Thử lấy IP (qua API)
        try {
            const ipInfo = await this.getIPInfo();
            info.ip = ipInfo;
        } catch (error) {
            info.ip = null;
        }

        return info;
    }

    // Xác định loại thiết bị với thông tin chi tiết
    getDeviceType() {
        const ua = navigator.userAgent;
        let deviceType = 'Desktop';
        let deviceModel = 'Unknown';
        let deviceVendor = 'Unknown';

        // Phát hiện Tablet
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            deviceType = 'Tablet';
            
            // iPad models
            if (/iPad/.test(ua)) {
                deviceVendor = 'Apple';
                if (/iPad Pro/.test(ua)) deviceModel = 'iPad Pro';
                else if (/iPad Air/.test(ua)) deviceModel = 'iPad Air';
                else if (/iPad Mini/.test(ua)) deviceModel = 'iPad Mini';
                else deviceModel = 'iPad';
            }
            // Samsung Tablets
            else if (/SM-T/.test(ua)) {
                deviceVendor = 'Samsung';
                const match = ua.match(/SM-T(\d+)/);
                deviceModel = match ? `Galaxy Tab ${match[1]}` : 'Galaxy Tab';
            }
            // Huawei Tablets
            else if (/MediaPad/.test(ua)) {
                deviceVendor = 'Huawei';
                deviceModel = 'MediaPad';
            }
        }
        // Phát hiện Mobile
        else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            deviceType = 'Mobile';
            
            // iPhone models
            if (/iPhone/.test(ua)) {
                deviceVendor = 'Apple';
                if (/iPhone 15/.test(ua)) deviceModel = 'iPhone 15';
                else if (/iPhone 14/.test(ua)) deviceModel = 'iPhone 14';
                else if (/iPhone 13/.test(ua)) deviceModel = 'iPhone 13';
                else if (/iPhone 12/.test(ua)) deviceModel = 'iPhone 12';
                else if (/iPhone 11/.test(ua)) deviceModel = 'iPhone 11';
                else if (/iPhone X/.test(ua)) deviceModel = 'iPhone X';
                else if (/iPhone SE/.test(ua)) deviceModel = 'iPhone SE';
                else deviceModel = 'iPhone';
            }
            // Samsung phones
            else if (/SM-[AGNF]/.test(ua)) {
                deviceVendor = 'Samsung';
                const match = ua.match(/SM-([AGNF]\d+)/);
                if (match) {
                    const model = match[1];
                    if (model.startsWith('G')) deviceModel = `Galaxy S${model.substring(1)}`;
                    else if (model.startsWith('N')) deviceModel = `Galaxy Note${model.substring(1)}`;
                    else if (model.startsWith('A')) deviceModel = `Galaxy A${model.substring(1)}`;
                    else if (model.startsWith('F')) deviceModel = `Galaxy F${model.substring(1)}`;
                    else deviceModel = 'Galaxy';
                } else {
                    deviceModel = 'Galaxy';
                }
            }
            // Xiaomi phones
            else if (/Redmi|Mi \d+/.test(ua)) {
                deviceVendor = 'Xiaomi';
                if (/Redmi Note (\d+)/.test(ua)) {
                    const match = ua.match(/Redmi Note (\d+)/);
                    deviceModel = `Redmi Note ${match[1]}`;
                } else if (/Redmi (\d+)/.test(ua)) {
                    const match = ua.match(/Redmi (\d+)/);
                    deviceModel = `Redmi ${match[1]}`;
                } else if (/Mi (\d+)/.test(ua)) {
                    const match = ua.match(/Mi (\d+)/);
                    deviceModel = `Mi ${match[1]}`;
                } else {
                    deviceModel = 'Xiaomi';
                }
            }
            // Oppo phones
            else if (/OPPO/.test(ua)) {
                deviceVendor = 'Oppo';
                const match = ua.match(/OPPO ([A-Z0-9]+)/);
                deviceModel = match ? match[1] : 'Oppo';
            }
            // Vivo phones
            else if (/vivo/.test(ua)) {
                deviceVendor = 'Vivo';
                const match = ua.match(/vivo ([A-Z0-9]+)/);
                deviceModel = match ? match[1] : 'Vivo';
            }
            // Huawei phones
            else if (/Huawei|HUAWEI|Honor|HONOR/.test(ua)) {
                deviceVendor = 'Huawei';
                if (/Honor/.test(ua)) {
                    const match = ua.match(/Honor ([A-Z0-9]+)/i);
                    deviceModel = match ? `Honor ${match[1]}` : 'Honor';
                } else {
                    const match = ua.match(/Huawei ([A-Z0-9]+)/i);
                    deviceModel = match ? match[1] : 'Huawei';
                }
            }
            // Generic Android
            else if (/Android/.test(ua)) {
                deviceVendor = 'Android';
                deviceModel = 'Android Device';
            }
        }
        // Desktop
        else {
            deviceType = 'Desktop';
            if (/Mac/.test(ua)) {
                deviceVendor = 'Apple';
                deviceModel = 'Mac';
            } else if (/Win/.test(ua)) {
                deviceVendor = 'Microsoft';
                deviceModel = 'Windows PC';
            } else if (/Linux/.test(ua)) {
                deviceVendor = 'Linux';
                deviceModel = 'Linux PC';
            }
        }

        return {
            type: deviceType,
            model: deviceModel,
            vendor: deviceVendor,
            fullInfo: `${deviceVendor} ${deviceModel}`
        };
    }

    // Lấy thông tin trình duyệt
    getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        let version = 'Unknown';

        if (ua.indexOf('Firefox') > -1) {
            browser = 'Firefox';
            version = ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || 'Unknown';
        } else if (ua.indexOf('Edg') > -1) {
            browser = 'Edge';
            version = ua.match(/Edg\/(\d+\.\d+)/)?.[1] || 'Unknown';
        } else if (ua.indexOf('Chrome') > -1) {
            browser = 'Chrome';
            version = ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || 'Unknown';
        } else if (ua.indexOf('Safari') > -1) {
            browser = 'Safari';
            version = ua.match(/Version\/(\d+\.\d+)/)?.[1] || 'Unknown';
        } else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident') > -1) {
            browser = 'Internet Explorer';
            version = ua.match(/(?:MSIE |rv:)(\d+\.\d+)/)?.[1] || 'Unknown';
        }

        return { name: browser, version: version };
    }

    // Lấy thông tin hệ điều hành
    getOSInfo() {
        const ua = navigator.userAgent;
        let os = 'Unknown';
        let version = 'Unknown';

        if (ua.indexOf('Win') > -1) {
            os = 'Windows';
            if (ua.indexOf('Windows NT 10.0') > -1) version = '10';
            else if (ua.indexOf('Windows NT 6.3') > -1) version = '8.1';
            else if (ua.indexOf('Windows NT 6.2') > -1) version = '8';
            else if (ua.indexOf('Windows NT 6.1') > -1) version = '7';
        } else if (ua.indexOf('Mac') > -1) {
            os = 'macOS';
            version = ua.match(/Mac OS X (\d+[._]\d+)/)?.[1]?.replace('_', '.') || 'Unknown';
        } else if (ua.indexOf('Linux') > -1) {
            os = 'Linux';
        } else if (ua.indexOf('Android') > -1) {
            os = 'Android';
            version = ua.match(/Android (\d+\.\d+)/)?.[1] || 'Unknown';
        } else if (ua.indexOf('iOS') > -1 || ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) {
            os = 'iOS';
            version = ua.match(/OS (\d+_\d+)/)?.[1]?.replace('_', '.') || 'Unknown';
        }

        return { name: os, version: version };
    }

    // Lấy loại kết nối
    getConnectionType() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
            return {
                effectiveType: connection.effectiveType || 'Unknown',
                downlink: connection.downlink || 'Unknown',
                rtt: connection.rtt || 'Unknown',
                saveData: connection.saveData || false
            };
        }
        return null;
    }

    // Lấy vị trí địa lý
    async getGeolocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                (error) => {
                    reject(error);
                },
                { timeout: 5000, enableHighAccuracy: false }
            );
        });
    }

    // Lấy thông tin IP với nhiều API dự phòng
    async getIPInfo() {
        // Thử nhiều API để đảm bảo lấy được thông tin
        const apis = [
            {
                name: 'ipapi',
                getIP: async () => {
                    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
                    const data = await res.json();
                    return {
                        ip: data.ip,
                        city: data.city || 'Unknown',
                        region: data.region || 'Unknown',
                        country: data.country_name || 'Unknown',
                        countryCode: data.country_code || 'Unknown',
                        timezone: data.timezone || 'Unknown',
                        isp: data.org || 'Unknown',
                        latitude: data.latitude || null,
                        longitude: data.longitude || null,
                        postal: data.postal || 'Unknown'
                    };
                }
            },
            {
                name: 'ip-api',
                getIP: async () => {
                    const res = await fetch('http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query', { signal: AbortSignal.timeout(5000) });
                    const data = await res.json();
                    if (data.status === 'success') {
                        return {
                            ip: data.query,
                            city: data.city || 'Unknown',
                            region: data.regionName || 'Unknown',
                            country: data.country || 'Unknown',
                            countryCode: data.countryCode || 'Unknown',
                            timezone: data.timezone || 'Unknown',
                            isp: data.isp || data.org || 'Unknown',
                            latitude: data.lat || null,
                            longitude: data.lon || null,
                            postal: data.zip || 'Unknown'
                        };
                    }
                    throw new Error('IP-API failed');
                }
            },
            {
                name: 'ipify-ipapi',
                getIP: async () => {
                    const ipRes = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
                    const ipData = await ipRes.json();
                    
                    const detailRes = await fetch(`https://ipapi.co/${ipData.ip}/json/`, { signal: AbortSignal.timeout(5000) });
                    const detailData = await detailRes.json();
                    
                    return {
                        ip: ipData.ip,
                        city: detailData.city || 'Unknown',
                        region: detailData.region || 'Unknown',
                        country: detailData.country_name || 'Unknown',
                        countryCode: detailData.country_code || 'Unknown',
                        timezone: detailData.timezone || 'Unknown',
                        isp: detailData.org || 'Unknown',
                        latitude: detailData.latitude || null,
                        longitude: detailData.longitude || null,
                        postal: detailData.postal || 'Unknown'
                    };
                }
            }
        ];

        // Thử từng API cho đến khi thành công
        for (const api of apis) {
            try {
                console.log(`🌍 Trying ${api.name} for IP info...`);
                const result = await api.getIP();
                console.log(`✅ ${api.name} success:`, result);
                
                // Cache kết quả để sử dụng lại
                localStorage.setItem('cached_ip_info', JSON.stringify({
                    data: result,
                    timestamp: Date.now()
                }));
                
                return result;
            } catch (error) {
                console.warn(`⚠️ ${api.name} failed:`, error.message);
                continue;
            }
        }

        // Nếu tất cả API đều thất bại, thử dùng cache
        try {
            const cached = localStorage.getItem('cached_ip_info');
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                // Sử dụng cache nếu còn mới (dưới 1 giờ)
                if (Date.now() - timestamp < 3600000) {
                    console.log('📦 Using cached IP info');
                    return data;
                }
            }
        } catch (error) {
            console.warn('Cache read failed:', error);
        }

        // Fallback: Trả về thông tin cơ bản
        console.warn('⚠️ All IP APIs failed, using fallback');
        return {
            ip: 'Unknown',
            city: 'Unknown',
            region: 'Unknown',
            country: 'Unknown',
            countryCode: 'Unknown',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
            isp: 'Unknown',
            latitude: null,
            longitude: null,
            postal: 'Unknown'
        };
    }

    // Ghi lại lượt truy cập trang
    async trackPageView(deviceInfo) {
        const event = {
            type: 'page_view',
            data: deviceInfo,
            timestamp: new Date().toISOString()
        };

        this.activityQueue.push(event);
        await this.sendToSupabase(event);
    }

    // Ghi lại sự kiện
    trackEvent(eventName, eventData = {}) {
        const event = {
            type: 'event',
            name: eventName,
            data: {
                ...eventData,
                sessionId: this.sessionId,
                userId: this.userId,
                url: window.location.href,
                timestamp: new Date().toISOString()
            }
        };

        this.activityQueue.push(event);
    }

    // Thiết lập event listeners
    setupEventListeners() {
        // Theo dõi click
        document.addEventListener('click', (e) => {
            const target = e.target.closest('button, a, [data-track]');
            if (target) {
                this.trackEvent('click', {
                    element: target.tagName,
                    text: target.textContent?.trim().substring(0, 50),
                    id: target.id,
                    class: target.className
                });
            }
        });

        // Theo dõi chuyển tab
        document.querySelectorAll('[data-tab]').forEach(tab => {
            tab.addEventListener('click', () => {
                this.trackEvent('tab_change', {
                    tab: tab.dataset.tab
                });
            });
        });

        // Theo dõi tạo quiz
        const processQuizBtn = document.getElementById('process-quiz');
        if (processQuizBtn) {
            processQuizBtn.addEventListener('click', () => {
                this.trackEvent('quiz_created', {
                    source: 'manual'
                });
            });
        }

        // Theo dõi AI tạo quiz
        const generateAIBtn = document.getElementById('generate-ai-quiz');
        if (generateAIBtn) {
            generateAIBtn.addEventListener('click', () => {
                this.trackEvent('quiz_created', {
                    source: 'ai'
                });
            });
        }

        // Theo dõi làm bài
        const startQuizBtn = document.getElementById('start-quiz');
        if (startQuizBtn) {
            startQuizBtn.addEventListener('click', () => {
                this.trackEvent('quiz_started');
            });
        }

        // Theo dõi chia sẻ quiz
        document.addEventListener('quiz_shared', (e) => {
            this.trackEvent('quiz_shared', e.detail);
        });

        // Theo dõi thời gian ở lại trang
        let startTime = Date.now();
        window.addEventListener('beforeunload', () => {
            const duration = Math.floor((Date.now() - startTime) / 1000);
            this.trackEvent('session_end', {
                duration: duration,
                durationFormatted: this.formatDuration(duration)
            });
        });
    }

    // Format thời gian
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    // Gửi dữ liệu lên Supabase
    async sendToSupabase(event) {
        if (!window.supabaseQuizManager || !window.supabaseQuizManager.supabase) {
            console.warn('⚠️ Supabase not available for analytics');
            return;
        }

        try {
            const { data, error } = await window.supabaseQuizManager.supabase
                .from('analytics_events')
                .insert([{
                    session_id: this.sessionId,
                    user_id: this.userId,
                    event_type: event.type,
                    event_name: event.name || null,
                    event_data: event.data,
                    created_at: new Date().toISOString()
                }]);

            if (error) {
                console.warn('⚠️ Failed to send analytics to Supabase:', error);
            } else {
                console.log('✅ Analytics sent to Supabase');
            }
        } catch (error) {
            console.warn('⚠️ Error sending analytics:', error);
        }
    }

    // Flush queue
    async flushQueue() {
        if (this.activityQueue.length === 0) return;

        const events = [...this.activityQueue];
        this.activityQueue = [];

        for (const event of events) {
            await this.sendToSupabase(event);
        }
    }
}

// Khởi tạo Analytics Tracker
const analyticsTracker = new AnalyticsTracker();
window.analyticsTracker = analyticsTracker;

// Tự đ���ng bắt đầu tracking khi trang load
document.addEventListener('DOMContentLoaded', () => {
    analyticsTracker.startTracking();
});

console.log('📊 Analytics Tracker loaded');
