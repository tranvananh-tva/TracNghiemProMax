// Explore Quiz Manager - Quản lý tính năng khám phá đề thi
class ExploreQuizManager {
    constructor() {
        // Tự động phát hiện server URL
        this.API_BASE_URL = this.detectServerURL();
        this.sharedQuizzes = [];
        this.currentUserName = localStorage.getItem('userName') || '';
        this.currentSharingQuizId = null;
        this.isServerOnline = false;
        this.offlineMode = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.serverInfo = null;
    }

    // Phát hiện URL server tự động
    detectServerURL() {
        // Lấy từ localStorage nếu đã lưu
        const savedServerURL = localStorage.getItem('serverURL');
        if (savedServerURL) {
            console.log('📌 Using saved server URL:', savedServerURL);
            return savedServerURL;
        }

        // Nếu đang chạy từ server (không phải file://)
        if (window.location.protocol !== 'file:') {
            const baseURL = `${window.location.protocol}//${window.location.hostname}:3000/api`;
            console.log('🌐 Detected server URL from location:', baseURL);
            return baseURL;
        }

        // Mặc định localhost
        console.log('🏠 Using default localhost URL');
        return 'http://localhost:3000/api';
    }

    // Lưu server URL
    saveServerURL(url) {
        this.API_BASE_URL = url;
        localStorage.setItem('serverURL', url);
        console.log('✅ Đã lưu Server URL:', url);
    }

    // Cho phép người dùng thay đổi server URL
    showServerURLDialog() {
        const currentURL = this.API_BASE_URL.replace('/api', '');
        
        const dialog = document.createElement('div');
        dialog.className = 'server-url-dialog';
        dialog.innerHTML = `
            <div class="server-url-content">
                <div class="server-url-header">
                    <h3><i class="fas fa-server"></i> Cấu Hình Server</h3>
                    <button class="btn-close" onclick="this.closest('.server-url-dialog').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="server-url-body">
                    <p><strong>Địa chỉ Server hiện tại:</strong></p>
                    <input type="text" id="server-url-input" value="${currentURL}" 
                           placeholder="http://192.168.1.100:3000" class="server-url-input">
                    
                    <div class="server-url-help">
                        <h4><i class="fas fa-info-circle"></i> Hướng dẫn:</h4>
                        <ul>
                            <li><strong>Trên máy chủ:</strong> http://localhost:3000</li>
                            <li><strong>Từ máy khác (LAN):</strong> http://[IP-máy-chủ]:3000</li>
                            <li><strong>Ví dụ:</strong> http://192.168.1.100:3000</li>
                        </ul>
                        
                        <div class="server-url-note">
                            <i class="fas fa-lightbulb"></i>
                            <p>Để xem IP của máy chủ, chạy server và xem console</p>
                        </div>
                    </div>

                    <div id="server-test-result"></div>
                </div>
                <div class="server-url-footer">
                    <button class="btn btn-primary" onclick="exploreQuizManager.testAndSaveServerURL()">
                        <i class="fas fa-check"></i> Kiểm Tra & Lưu
                    </button>
                    <button class="btn btn-secondary" onclick="exploreQuizManager.autoDetectServer()">
                        <i class="fas fa-search"></i> Tự Động Tìm
                    </button>
                    <button class="btn btn-danger" onclick="this.closest('.server-url-dialog').remove()">
                        <i class="fas fa-times"></i> Hủy
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    // Test và lưu server URL
    async testAndSaveServerURL() {
        const input = document.getElementById('server-url-input');
        const resultDiv = document.getElementById('server-test-result');
        
        if (!input || !resultDiv) return;

        let serverURL = input.value.trim();
        
        // Validate URL
        if (!serverURL) {
            resultDiv.innerHTML = '<div class="test-error"><i class="fas fa-exclamation-triangle"></i> Vui lòng nhập địa chỉ server</div>';
            return;
        }

        // Thêm http:// nếu chưa có
        if (!serverURL.startsWith('http://') && !serverURL.startsWith('https://')) {
            serverURL = 'http://' + serverURL;
        }

        // Loại bỏ /api nếu có
        serverURL = serverURL.replace(/\/api\/?$/, '');

        resultDiv.innerHTML = '<div class="test-loading"><i class="fas fa-spinner fa-spin"></i> Đang kiểm tra kết nối...</div>';

        try {
            const testURL = `${serverURL}/api/server-info`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(testURL, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                
                resultDiv.innerHTML = `
                    <div class="test-success">
                        <i class="fas fa-check-circle"></i> 
                        <strong>Kết nối thành công!</strong>
                        <div class="server-info-details">
                            <p>Port: ${data.port}</p>
                            ${data.ipAddresses && data.ipAddresses.length > 0 ? 
                                `<p>IP: ${data.ipAddresses.join(', ')}</p>` : ''}
                        </div>
                    </div>
                `;

                // Lưu URL
                this.saveServerURL(`${serverURL}/api`);
                this.serverInfo = data;
                this.isServerOnline = true;
                this.updateServerStatus(true);

                // Đóng dialog sau 2 giây
                setTimeout(() => {
                    document.querySelector('.server-url-dialog')?.remove();
                    quizManager.showToast('✅ Đã kết nối server thành công!', 'success');
                    this.loadSharedQuizzes();
                }, 2000);
            } else {
                throw new Error('Server không phản hồi đúng');
            }
        } catch (error) {
            resultDiv.innerHTML = `
                <div class="test-error">
                    <i class="fas fa-times-circle"></i> 
                    <strong>Không thể kết nối!</strong>
                    <p>${error.message}</p>
                    <p>Vui lòng kiểm tra:</p>
                    <ul>
                        <li>Server đã chạy chưa?</li>
                        <li>Địa chỉ IP có đúng không?</li>
                        <li>Tường lửa có chặn không?</li>
                    </ul>
                </div>
            `;
        }
    }

    // Tự động tìm server trong mạng LAN
    async autoDetectServer() {
        const resultDiv = document.getElementById('server-test-result');
        if (!resultDiv) return;

        resultDiv.innerHTML = '<div class="test-loading"><i class="fas fa-spinner fa-spin"></i> Đang tìm kiếm server trong mạng...</div>';

        // Lấy IP hiện tại của máy
        const currentIP = await this.getCurrentIP();
        if (!currentIP) {
            resultDiv.innerHTML = '<div class="test-error"><i class="fas fa-times-circle"></i> Không thể xác định IP của máy</div>';
            return;
        }

        // Tạo danh sách IP để test (cùng subnet)
        const ipParts = currentIP.split('.');
        const subnet = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}`;
        
        const testIPs = [
            'localhost',
            '127.0.0.1',
            currentIP
        ];

        // Thêm một số IP phổ biến trong subnet
        for (let i = 1; i <= 10; i++) {
            testIPs.push(`${subnet}.${i}`);
        }

        resultDiv.innerHTML = `<div class="test-loading"><i class="fas fa-spinner fa-spin"></i> Đang kiểm tra ${testIPs.length} địa chỉ...</div>`;

        // Test từng IP
        for (const ip of testIPs) {
            try {
                const testURL = `http://${ip}:3000/api/server-info`;
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);

                const response = await fetch(testURL, { signal: controller.signal });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    
                    resultDiv.innerHTML = `
                        <div class="test-success">
                            <i class="fas fa-check-circle"></i> 
                            <strong>Tìm thấy server tại: ${ip}</strong>
                        </div>
                    `;

                    // Cập nhật input
                    const input = document.getElementById('server-url-input');
                    if (input) {
                        input.value = `http://${ip}:3000`;
                    }

                    // Lưu và kết nối
                    this.saveServerURL(`http://${ip}:3000/api`);
                    this.serverInfo = data;
                    this.isServerOnline = true;
                    this.updateServerStatus(true);

                    setTimeout(() => {
                        document.querySelector('.server-url-dialog')?.remove();
                        quizManager.showToast('✅ Đã tìm thấy và kết nối server!', 'success');
                        this.loadSharedQuizzes();
                    }, 2000);

                    return;
                }
            } catch (error) {
                // Tiếp tục test IP tiếp theo
                continue;
            }
        }

        resultDiv.innerHTML = `
            <div class="test-error">
                <i class="fas fa-times-circle"></i> 
                <strong>Không tìm thấy server nào</strong>
                <p>Vui lòng nhập địa chỉ thủ công</p>
            </div>
        `;
    }

    // Lấy IP hiện tại của máy (ước lượng)
    async getCurrentIP() {
        try {
            // Sử dụng WebRTC để lấy local IP
            return new Promise((resolve) => {
                const pc = new RTCPeerConnection({ iceServers: [] });
                pc.createDataChannel('');
                pc.createOffer().then(offer => pc.setLocalDescription(offer));
                
                pc.onicecandidate = (ice) => {
                    if (!ice || !ice.candidate || !ice.candidate.candidate) return;
                    
                    const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
                    const match = ipRegex.exec(ice.candidate.candidate);
                    
                    if (match) {
                        resolve(match[1]);
                        pc.close();
                    }
                };

                setTimeout(() => resolve(null), 3000);
            });
        } catch (error) {
            return null;
        }
    }

    // Khởi tạo
    async initialize() {
        this.setupUserName();
        
        // Kiểm tra xem có phải lần đầu truy cập không
        const isFirstTime = !localStorage.getItem('hasConfiguredServer');
        
        await this.checkServerStatus();
        
        // Nếu server offline và là lần đầu, hiển thị hướng dẫn
        if (!this.isServerOnline && isFirstTime) {
            this.showFirstTimeSetupGuide();
        }
        
        this.loadSharedQuizzes();
        this.setupEventListeners();
    }

    // Kiểm tra trạng thái server
    async checkServerStatus() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 giây timeout

            const response = await fetch(`${this.API_BASE_URL}/shared-quizzes`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                this.isServerOnline = true;
                this.offlineMode = false;
                this.updateServerStatus(true);
                return true;
            }
        } catch (error) {
            console.warn('Server offline:', error.message);
            this.isServerOnline = false;
            this.offlineMode = true;
            this.updateServerStatus(false);
        }
        return false;
    }

    // Cập nhật hiển thị trạng thái server
    updateServerStatus(isOnline) {
        const statusIndicator = document.getElementById('server-status-indicator');
        if (statusIndicator) {
            if (isOnline) {
                statusIndicator.innerHTML = `
                    <i class="fas fa-circle" style="color: #48bb78;"></i>
                    <span>Server đang hoạt động</span>
                `;
                statusIndicator.className = 'server-status online';
            } else {
                statusIndicator.innerHTML = `
                    <i class="fas fa-circle" style="color: #f56565;"></i>
                    <span>Chế độ Offline</span>
                    <button class="btn-retry-server" onclick="exploreQuizManager.retryServerConnection()">
                        <i class="fas fa-sync"></i> Thử lại
                    </button>
                `;
                statusIndicator.className = 'server-status offline';
            }
        }
    }

    // Thử kết nối lại server
    async retryServerConnection() {
        quizManager.showToast('🔄 Đang kiểm tra kết nối server...', 'info');
        const isOnline = await this.checkServerStatus();
        
        if (isOnline) {
            quizManager.showToast('✅ Đã kết nối server thành công!', 'success');
            this.loadSharedQuizzes();
        } else {
            quizManager.showToast('❌ Không thể kết nối server. Vui lòng khởi động server.', 'error');
            this.showServerInstructions();
        }
    }

    // Hiển thị hướng dẫn thiết lập lần đầu
    showFirstTimeSetupGuide() {
        const modal = document.createElement('div');
        modal.className = 'server-instructions-modal first-time-setup';
        modal.innerHTML = `
            <div class="server-instructions-content">
                <div class="server-instructions-header">
                    <h3><i class="fas fa-rocket"></i> Chào Mừng Đến Với Tính Năng Chia Sẻ!</h3>
                    <button class="btn-close" onclick="exploreQuizManager.closeFirstTimeSetup()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="server-instructions-body">
                    <p><strong>Để chia sẻ và xem bài làm từ cộng đồng trong mạng LAN:</strong></p>
                    
                    <div class="setup-option recommended">
                        <div class="option-badge">✨ Dễ Dàng</div>
                        <h4><i class="fas fa-network-wired"></i> Local Server (Trong Mạng LAN)</h4>
                        <p>Chia sẻ trong mạng nội bộ, tốc độ cao</p>
                        <ul>
                            <li>✅ Tốc độ nhanh</li>
                            <li>✅ Không cần Internet</li>
                            <li>✅ Miễn phí hoàn toàn</li>
                            <li>✅ Dữ liệu lưu trên máy bạn</li>
                        </ul>
                        <button class="btn btn-primary" onclick="exploreQuizManager.showLocalServerSetupGuide()">
                            <i class="fas fa-book"></i> Hướng Dẫn Cài Đặt
                        </button>
                    </div>

                    <div class="instruction-note">
                        <i class="fas fa-info-circle"></i>
                        <p><strong>Lưu ý:</strong> Cả máy chủ và máy khách phải cùng mạng WiFi/LAN để chia sẻ được.</p>
                    </div>
                </div>
                <div class="server-instructions-footer">
                    <button class="btn btn-success" onclick="exploreQuizManager.closeFirstTimeSetup()">
                        <i class="fas fa-check"></i> Đã Hiểu, Bắt Đầu Sử Dụng
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Đóng hướng dẫn lần đ��u
    closeFirstTimeSetup() {
        localStorage.setItem('hasConfiguredServer', 'true');
        document.querySelector('.first-time-setup')?.remove();
    }

    // Hiển thị hướng dẫn Local Server
    showLocalServerSetupGuide() {
        const modal = document.createElement('div');
        modal.className = 'server-instructions-modal local-server-guide';
        modal.innerHTML = `
            <div class="server-instructions-content">
                <div class="server-instructions-header">
                    <h3><i class="fas fa-server"></i> Hướng Dẫn Cài Đặt Local Server</h3>
                    <button class="btn-close" onclick="this.closest('.local-server-guide').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="server-instructions-body">
                    <div class="server-role-selection">
                        <h4>Bạn đang ở máy nào?</h4>
                        <div class="role-buttons">
                            <button class="btn btn-primary" onclick="exploreQuizManager.showServerHostGuide()">
                                <i class="fas fa-server"></i> Máy Chủ (Host)
                                <small>Máy chạy server, chia sẻ bài</small>
                            </button>
                            <button class="btn btn-secondary" onclick="exploreQuizManager.showServerClientGuide()">
                                <i class="fas fa-laptop"></i> Máy Khách (Client)
                                <small>Máy xem bài từ máy khác</small>
                            </button>
                        </div>
                    </div>

                    <div class="instruction-note">
                        <i class="fas fa-info-circle"></i>
                        <p><strong>Lưu ý:</strong> Cả 2 máy phải cùng mạng WiFi/LAN</p>
                    </div>
                </div>
                <div class="server-instructions-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.local-server-guide').remove()">
                        <i class="fas fa-times"></i> Đóng
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Hướng dẫn cho máy chủ (Host)
    showServerHostGuide() {
        document.querySelector('.local-server-guide')?.remove();
        
        const modal = document.createElement('div');
        modal.className = 'server-instructions-modal server-host-guide';
        modal.innerHTML = `
            <div class="server-instructions-content">
                <div class="server-instructions-header">
                    <h3><i class="fas fa-server"></i> Hướng Dẫn Cho Máy Chủ</h3>
                    <button class="btn-close" onclick="this.closest('.server-host-guide').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="server-instructions-body">
                    <div class="instruction-step">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <h4>Khởi Động Server</h4>
                            <p><strong>Cách 1:</strong> Double-click file <code>start-server.bat</code></p>
                            <p><strong>Cách 2:</strong> Mở Terminal và chạy:</p>
                            <code>npm run server</code>
                        </div>
                    </div>

                    <div class="instruction-step">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <h4>Lấy Địa Chỉ IP</h4>
                            <p>Server sẽ hiển thị IP trong console:</p>
                            <code>Network: http://192.168.1.100:3000</code>
                            <p>Hoặc chạy lệnh:</p>
                            <code>ipconfig</code> (Windows) hoặc <code>ifconfig</code> (Mac/Linux)
                        </div>
                    </div>

                    <div class="instruction-step">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <h4>Cấu Hình Firewall</h4>
                            <p><strong>Windows:</strong> Chạy lệnh (Run as Administrator):</p>
                            <code>netsh advfirewall firewall add rule name="TracNghiemPro" dir=in action=allow protocol=TCP localport=3000</code>
                        </div>
                    </div>

                    <div class="instruction-step">
                        <div class="step-number">4</div>
                        <div class="step-content">
                            <h4>Chia Sẻ IP Cho Máy Khác</h4>
                            <p>Gửi địa chỉ IP cho người dùng khác:</p>
                            <code>http://192.168.1.100:3000</code>
                        </div>
                    </div>

                    <div class="instruction-note">
                        <i class="fas fa-book"></i>
                        <p>Xem hướng dẫn chi tiết trong file: <code>HUONG_DAN_CHIA_SE_TU_MAY_KHAC.md</code></p>
                    </div>
                </div>
                <div class="server-instructions-footer">
                    <button class="btn btn-primary" onclick="exploreQuizManager.retryServerConnection(); this.closest('.server-host-guide').remove();">
                        <i class="fas fa-sync"></i> Kiểm Tra Kết Nối
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.server-host-guide').remove()">
                        <i class="fas fa-times"></i> Đóng
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Hướng dẫn cho máy khách (Client)
    showServerClientGuide() {
        document.querySelector('.local-server-guide')?.remove();
        
        const modal = document.createElement('div');
        modal.className = 'server-instructions-modal server-client-guide';
        modal.innerHTML = `
            <div class="server-instructions-content">
                <div class="server-instructions-header">
                    <h3><i class="fas fa-laptop"></i> Hướng Dẫn Cho Máy Khách</h3>
                    <button class="btn-close" onclick="this.closest('.server-client-guide').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="server-instructions-body">
                    <div class="instruction-step">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <h4>Lấy Địa Chỉ IP Từ Máy Chủ</h4>
                            <p>Hỏi người quản lý máy chủ để lấy địa chỉ IP</p>
                            <p>Ví dụ: <code>http://192.168.1.100:3000</code></p>
                        </div>
                    </div>

                    <div class="instruction-step">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <h4>Cấu Hình Server URL</h4>
                            <p>Click nút bên dưới để mở cấu hình</p>
                        </div>
                    </div>

                    <div class="instruction-note">
                        <i class="fas fa-info-circle"></i>
                        <p><strong>Lưu ý:</strong> Đảm bảo máy của bạn cùng mạng WiFi/LAN với máy chủ</p>
                    </div>
                </div>
                <div class="server-instructions-footer">
                    <button class="btn btn-primary" onclick="exploreQuizManager.showServerURLDialog(); this.closest('.server-client-guide').remove();">
                        <i class="fas fa-cog"></i> Mở Cấu Hình Server
                    </button>
                    <button class="btn btn-secondary" onclick="exploreQuizManager.autoDetectServer(); this.closest('.server-client-guide').remove();">
                        <i class="fas fa-search"></i> Tự Động Tìm Server
                    </button>
                    <button class="btn btn-danger" onclick="this.closest('.server-client-guide').remove()">
                        <i class="fas fa-times"></i> Đóng
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Hiển thị hướng dẫn khởi động server (giữ lại cho tương thích)
    showServerInstructions() {
        this.showLocalServerSetupGuide();
    }

    // Thiết lập tên người dùng
    setupUserName() {
        const userNameInput = document.getElementById('user-name-input');
        if (userNameInput) {
            userNameInput.value = this.currentUserName;
            userNameInput.addEventListener('change', (e) => {
                this.currentUserName = e.target.value.trim();
                localStorage.setItem('userName', this.currentUserName);
            });
        }
    }

    // Thiết lập event listeners
    setupEventListeners() {
        // Nút tìm kiếm
        const searchBtn = document.getElementById('search-shared-quiz-btn');
        const searchInput = document.getElementById('search-shared-quiz');
        
        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', () => {
                this.searchSharedQuizzes(searchInput.value);
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchSharedQuizzes(searchInput.value);
                }
            });
        }

        // Nút làm mới
        const refreshBtn = document.getElementById('refresh-shared-quizzes');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadSharedQuizzes();
            });
        }
    }

    // Tải danh sách quiz được chia sẻ
    async loadSharedQuizzes() {
        try {
            this.showLoading(true);
            
            // Sử dụng Local server
            if (!this.isServerOnline) {
                await this.checkServerStatus();
            }

            if (!this.isServerOnline) {
                this.loadOfflineQuizzes();
                return;
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`${this.API_BASE_URL}/shared-quizzes`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            const data = await response.json();
            
            if (data.success) {
                this.sharedQuizzes = data.quizzes;
                this.renderSharedQuizzes(this.sharedQuizzes);
                this.isServerOnline = true;
                this.updateServerStatus(true);
            } else {
                this.showError('Không thể tải danh sách đề thi');
            }
        } catch (error) {
            console.error('Error loading shared quizzes:', error);
            this.isServerOnline = false;
            this.updateServerStatus(false);
            this.loadOfflineQuizzes();
        } finally {
            this.showLoading(false);
        }
    }

    // Load quiz từ localStorage (chế độ offline)
    loadOfflineQuizzes() {
        const offlineQuizzes = JSON.parse(localStorage.getItem('offlineSharedQuizzes')) || [];
        this.sharedQuizzes = offlineQuizzes;
        
        if (offlineQuizzes.length > 0) {
            this.renderSharedQuizzes(offlineQuizzes);
            quizManager.showToast('📱 Đang xem quiz đã lưu offline', 'info');
        } else {
            this.showOfflineEmptyState();
        }
    }

    // Hiển thị trạng thái rỗng khi offline
    showOfflineEmptyState() {
        const container = document.getElementById('shared-quizzes-grid');
        if (container) {
            container.innerHTML = `
                <div class="offline-empty-state">
                    <i class="fas fa-wifi-slash"></i>
                    <h3>Chế độ Offline</h3>
                    <p>Không có quiz nào được lưu offline.</p>
                    <p>Vui lòng khởi động server để xem quiz từ cộng đồng.</p>
                    <button class="btn btn-primary" onclick="exploreQuizManager.showServerInstructions()">
                        <i class="fas fa-question-circle"></i>
                        Hướng Dẫn Khởi Động Server
                    </button>
                    <button class="btn btn-secondary" onclick="exploreQuizManager.retryServerConnection()">
                        <i class="fas fa-sync"></i>
                        Thử Kết Nối Lại
                    </button>
                </div>
            `;
        }
    }

    // Tìm kiếm quiz
    async searchSharedQuizzes(keyword) {
        if (!keyword || keyword.trim() === '') {
            this.loadSharedQuizzes();
            return;
        }

        try {
            this.showLoading(true);
            
            const response = await fetch(`${this.API_BASE_URL}/shared-quizzes/search/${encodeURIComponent(keyword)}`);
            const data = await response.json();
            
            if (data.success) {
                this.renderSharedQuizzes(data.quizzes);
                if (data.quizzes.length === 0) {
                    quizManager.showToast(`Không tìm thấy kết quả cho "${keyword}"`, 'info');
                }
            }
        } catch (error) {
            console.error('Error searching quizzes:', error);
            this.showError('Lỗi khi tìm kiếm');
        } finally {
            this.showLoading(false);
        }
    }

    // Hiển thị danh sách quiz
    renderSharedQuizzes(quizzes) {
        const container = document.getElementById('shared-quizzes-grid');
        
        if (!container) return;

        if (quizzes.length === 0) {
            container.innerHTML = `
                <div class="empty-state-card">
                    <i class="fas fa-search"></i>
                    <h3>Chưa có đề thi nào được chia sẻ</h3>
                    <p>Hãy là người đầu tiên chia sẻ đề thi của bạn!</p>
                </div>
            `;
            return;
        }

        const quizzesHTML = quizzes.map(quiz => {
            const timeAgo = this.getTimeAgo(quiz.sharedAt);
            const date = new Date(quiz.sharedAt).toLocaleDateString('vi-VN');
            
            return `
                <div class="shared-quiz-card" data-quiz-id="${quiz.id}">
                    <div class="shared-quiz-header">
                        <div class="shared-quiz-icon">
                            <i class="fas fa-file-alt"></i>
                        </div>
                        <div class="shared-quiz-badge">
                            <i class="fas fa-share-alt"></i>
                            Chia sẻ
                        </div>
                    </div>
                    
                    <div class="shared-quiz-content">
                        <h3 class="shared-quiz-title">${this.escapeHtml(quiz.title)}</h3>
                        <p class="shared-quiz-description">${this.escapeHtml(quiz.description)}</p>
                        
                        <div class="shared-quiz-meta">
                            <div class="meta-item">
                                <i class="fas fa-user"></i>
                                <span>${this.escapeHtml(quiz.userName)}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-calendar"></i>
                                <span>${date}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-clock"></i>
                                <span>${timeAgo}</span>
                            </div>
                        </div>
                        
                        <div class="shared-quiz-stats">
                            <div class="stat-item">
                                <i class="fas fa-question-circle"></i>
                                <span>${quiz.totalQuestions} câu</span>
                            </div>
                            <div class="stat-item">
                                <i class="fas fa-eye"></i>
                                <span>${quiz.views || 0} lượt xem</span>
                            </div>
                            <div class="stat-item">
                                <i class="fas fa-pen"></i>
                                <span>${quiz.attempts || 0} lượt làm</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="shared-quiz-actions">
                        <button class="btn-start-shared-quiz" onclick="exploreQuizManager.startSharedQuiz('${quiz.id}')">
                            <i class="fas fa-play"></i>
                            Vào Ôn Thi
                        </button>
                        <button class="btn-view-details" onclick="exploreQuizManager.viewQuizDetails('${quiz.id}')">
                            <i class="fas fa-info-circle"></i>
                            Chi tiết
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = quizzesHTML;
    }

    // Chia sẻ quiz - Mở modal
    shareQuiz(quizId) {
        const quiz = quizManager.quizzes.find(q => q.id === quizId);
        
        if (!quiz) {
            quizManager.showToast('Không tìm thấy quiz!', 'error');
            return;
        }

        // Lưu quiz ID để sử dụng sau
        this.currentSharingQuizId = quizId;

        // Điền thông tin vào modal
        const userNameInput = document.getElementById('share-user-name');
        const titleInput = document.getElementById('share-quiz-title');
        const descriptionInput = document.getElementById('share-quiz-description');
        const countSpan = document.getElementById('share-quiz-count');
        const dateSpan = document.getElementById('share-quiz-date');
        const timeSpan = document.getElementById('share-quiz-time');

        // Điền tên người dùng từ localStorage hoặc từ tab khám phá
        if (userNameInput) {
            userNameInput.value = this.currentUserName || '';
        }

        // Điền tên quiz gốc (người dùng có thể sửa)
        if (titleInput) {
            titleInput.value = quiz.title;
        }

        // Điền mô tả gốc (người dùng có thể sửa)
        if (descriptionInput) {
            descriptionInput.value = quiz.description || '';
        }

        // Hiển thị số câu hỏi
        if (countSpan) {
            countSpan.textContent = quiz.totalQuestions;
        }

        // Hiển thị ngày hiện tại
        const now = new Date();
        if (dateSpan) {
            dateSpan.textContent = now.toLocaleDateString('vi-VN');
        }

        // Hiển thị thời gian hiện tại
        if (timeSpan) {
            timeSpan.textContent = now.toLocaleTimeString('vi-VN', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }

        // Mở modal
        const modal = document.getElementById('share-quiz-modal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    // Đóng modal chia sẻ
    closeShareModal() {
        const modal = document.getElementById('share-quiz-modal');
        if (modal) {
            modal.classList.remove('active');
        }
        this.currentSharingQuizId = null;
    }

    // Xác nhận chia sẻ quiz
    async confirmShareQuiz() {
        if (!this.currentSharingQuizId) {
            quizManager.showToast('Lỗi: Không tìm thấy quiz!', 'error');
            return;
        }

        const quiz = quizManager.quizzes.find(q => q.id === this.currentSharingQuizId);
        if (!quiz) {
            quizManager.showToast('Không tìm thấy quiz!', 'error');
            return;
        }

        // Lấy thông tin từ form
        const userName = document.getElementById('share-user-name').value.trim();
        const title = document.getElementById('share-quiz-title').value.trim();
        const description = document.getElementById('share-quiz-description').value.trim();

        // Validate
        if (!userName) {
            quizManager.showToast('Vui lòng nhập tên của bạn!', 'warning');
            document.getElementById('share-user-name').focus();
            return;
        }

        if (!title) {
            quizManager.showToast('Vui lòng nhập tên đề thi!', 'warning');
            document.getElementById('share-quiz-title').focus();
            return;
        }

        // Lưu tên người dùng
        this.currentUserName = userName;
        localStorage.setItem('userName', userName);

        // Cập nhật tên người dùng trong tab khám phá nếu có
        const userNameInputExplore = document.getElementById('user-name-input');
        if (userNameInputExplore) {
            userNameInputExplore.value = userName;
        }

        // Tạo quiz mới với tên và mô tả tùy chỉnh (không thay đổi quiz gốc)
        const sharedQuiz = {
            ...quiz,
            title: title,
            description: description || 'Không có mô tả'
        };

        // Kiểm tra server trước khi chia sẻ
        quizManager.showToast('🔄 Đang kiểm tra kết nối...', 'info');
        const serverOnline = await this.checkServerStatus();

        if (!serverOnline) {
            // Chế độ offline - lưu local
            this.shareQuizOffline(sharedQuiz, userName);
            return;
        }

        // Thử chia sẻ lên server với retry
        await this.shareQuizOnline(sharedQuiz, userName);
    }

    // Chia sẻ quiz lên server (online mode)
    async shareQuizOnline(sharedQuiz, userName, retryAttempt = 0) {
        try {
            // Sử dụng Local server
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(`${this.API_BASE_URL}/shared-quizzes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    quiz: sharedQuiz,
                    userName: userName
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const data = await response.json();

            if (data.success) {
                quizManager.showToast('✨ Chia sẻ đề thi thành công!', 'success');
                this.saveToOfflineStorage(data.quiz);
                this.closeShareModal();
                this.switchToExploreTab();
                this.loadSharedQuizzes();
            } else {
                throw new Error(data.error || 'Lỗi không xác định');
            }
        } catch (error) {
            console.error('Error sharing quiz:', error);
            
            if (retryAttempt < this.maxRetries) {
                quizManager.showToast(`⚠️ Lỗi kết nối. Đang thử lại (${retryAttempt + 1}/${this.maxRetries})...`, 'warning');
                await new Promise(resolve => setTimeout(resolve, 2000));
                return this.shareQuizOnline(sharedQuiz, userName, retryAttempt + 1);
            }
            
            this.showShareErrorDialog(sharedQuiz, userName);
        }
    }

    // Hiển thị dialog lỗi với tùy ch���n
    showShareErrorDialog(sharedQuiz, userName) {
        const dialog = document.createElement('div');
        dialog.className = 'share-error-dialog';
        dialog.innerHTML = `
            <div class="share-error-content">
                <div class="share-error-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Không Thể Kết Nối Server</h3>
                </div>
                <div class="share-error-body">
                    <p>Không thể chia sẻ quiz lên server sau ${this.maxRetries} lần thử.</p>
                    <p><strong>Bạn muốn làm gì?</strong></p>
                    
                    <div class="error-options">
                        <button class="btn btn-primary" onclick="exploreQuizManager.shareQuizOfflineFromDialog('${JSON.stringify(sharedQuiz).replace(/'/g, "\\'")}', '${userName}')">
                            <i class="fas fa-save"></i>
                            Lưu Offline (Chỉ trên máy này)
                        </button>
                        
                        <button class="btn btn-secondary" onclick="exploreQuizManager.showServerInstructions(); this.closest('.share-error-dialog').remove();">
                            <i class="fas fa-server"></i>
                            Hướng Dẫn Khởi Động Server
                        </button>
                        
                        <button class="btn btn-danger" onclick="this.closest('.share-error-dialog').remove();">
                            <i class="fas fa-times"></i>
                            Hủy Bỏ
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    // Chia sẻ quiz offline
    shareQuizOffline(sharedQuiz, userName) {
        const offlineQuiz = {
            id: Date.now().toString(),
            originalId: sharedQuiz.id,
            title: sharedQuiz.title,
            description: sharedQuiz.description || 'Không có mô tả',
            questions: sharedQuiz.questions,
            totalQuestions: sharedQuiz.questions.length,
            userName: userName,
            sharedAt: new Date().toISOString(),
            views: 0,
            attempts: 0,
            isOffline: true
        };

        this.saveToOfflineStorage(offlineQuiz);
        
        quizManager.showToast('💾 Đã lưu quiz offline trên máy này!', 'success');
        
        // Đóng modal
        this.closeShareModal();
        
        // Chuyển sang tab khám phá
        this.switchToExploreTab();
        
        // Load offline quizzes
        this.loadOfflineQuizzes();
    }

    // Lưu quiz vào offline storage
    saveToOfflineStorage(quiz) {
        const offlineQuizzes = JSON.parse(localStorage.getItem('offlineSharedQuizzes')) || [];
        
        // Kiểm tra trùng lặp
        const existingIndex = offlineQuizzes.findIndex(q => q.originalId === quiz.originalId);
        if (existingIndex >= 0) {
            offlineQuizzes[existingIndex] = quiz;
        } else {
            offlineQuizzes.push(quiz);
        }
        
        localStorage.setItem('offlineSharedQuizzes', JSON.stringify(offlineQuizzes));
    }

    // Chia sẻ offline từ dialog (helper function)
    shareQuizOfflineFromDialog(sharedQuizStr, userName) {
        try {
            const sharedQuiz = JSON.parse(sharedQuizStr);
            this.shareQuizOffline(sharedQuiz, userName);
            document.querySelector('.share-error-dialog')?.remove();
        } catch (error) {
            console.error('Error parsing quiz:', error);
            quizManager.showToast('Lỗi xử lý dữ liệu', 'error');
        }
    }

    // Xem chi tiết quiz
    async viewQuizDetails(quizId) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/shared-quizzes/${quizId}`);
            const data = await response.json();

            if (data.success) {
                this.showQuizDetailsModal(data.quiz);
            } else {
                quizManager.showToast('Không thể tải chi tiết quiz', 'error');
            }
        } catch (error) {
            console.error('Error loading quiz details:', error);
            quizManager.showToast('Lỗi khi tải chi tiết', 'error');
        }
    }

    // Hiển thị modal chi tiết
    showQuizDetailsModal(quiz) {
        const modal = document.getElementById('quiz-details-modal');
        if (!modal) return;

        const modalContent = modal.querySelector('.quiz-details-content');
        const date = new Date(quiz.sharedAt).toLocaleString('vi-VN');

        modalContent.innerHTML = `
            <div class="quiz-details-header">
                <h2>${this.escapeHtml(quiz.title)}</h2>
                <p class="quiz-details-description">${this.escapeHtml(quiz.description)}</p>
            </div>

            <div class="quiz-details-info">
                <div class="info-row">
                    <span class="info-label"><i class="fas fa-user"></i> Người chia sẻ:</span>
                    <span class="info-value">${this.escapeHtml(quiz.userName)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label"><i class="fas fa-calendar"></i> Ngày chia sẻ:</span>
                    <span class="info-value">${date}</span>
                </div>
                <div class="info-row">
                    <span class="info-label"><i class="fas fa-question-circle"></i> Số câu hỏi:</span>
                    <span class="info-value">${quiz.totalQuestions} câu</span>
                </div>
                <div class="info-row">
                    <span class="info-label"><i class="fas fa-eye"></i> Lượt xem:</span>
                    <span class="info-value">${quiz.views || 0}</span>
                </div>
                <div class="info-row">
                    <span class="info-label"><i class="fas fa-pen"></i> Lượt làm bài:</span>
                    <span class="info-value">${quiz.attempts || 0}</span>
                </div>
            </div>

            <div class="quiz-preview-questions">
                <h3><i class="fas fa-list"></i> Xem trước câu hỏi (3 câu đầu)</h3>
                ${quiz.questions.slice(0, 3).map((q, index) => `
                    <div class="preview-question-item">
                        <div class="preview-question-number">${index + 1}</div>
                        <div class="preview-question-text">${this.escapeHtml(q.question)}</div>
                        <div class="preview-options-count">
                            <i class="fas fa-list-ul"></i>
                            ${q.options.length} lựa chọn
                        </div>
                    </div>
                `).join('')}
                ${quiz.totalQuestions > 3 ? `<p class="more-questions">... và ${quiz.totalQuestions - 3} câu hỏi khác</p>` : ''}
            </div>

            <div class="quiz-details-actions">
                <button class="btn-primary" onclick="exploreQuizManager.startSharedQuiz('${quiz.id}'); exploreQuizManager.closeDetailsModal();">
                    <i class="fas fa-play"></i>
                    Bắt Đầu Làm Bài
                </button>
                <button class="btn-secondary" onclick="exploreQuizManager.closeDetailsModal()">
                    <i class="fas fa-times"></i>
                    Đóng
                </button>
            </div>
        `;

        modal.classList.add('active');
    }

    // Đóng modal chi tiết
    closeDetailsModal() {
        const modal = document.getElementById('quiz-details-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // Bắt đầu làm bài từ quiz được chia sẻ
    async startSharedQuiz(quizId) {
        try {
            // Sử dụng Local server
            if (!this.isServerOnline) {
                const isOnline = await this.checkServerStatus();
                if (!isOnline) {
                    const offlineQuiz = this.getOfflineQuiz(quizId);
                    if (offlineQuiz) {
                        this.startOfflineQuiz(offlineQuiz);
                        return;
                    }
                    quizManager.showToast('❌ Không thể kết nối. Vui lòng cấu hình server URL.', 'error');
                    this.showServerURLDialog();
                    return;
                }
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(`${this.API_BASE_URL}/shared-quizzes/${quizId}`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            const data = await response.json();

            if (data.success) {
                const quiz = data.quiz;
                try {
                    await fetch(`${this.API_BASE_URL}/shared-quizzes/${quizId}/attempt`, {
                        method: 'POST'
                    });
                } catch (err) {
                    console.warn('Could not update attempt count:', err);
                }
                this.saveToOfflineStorage(quiz);
                quizManager.currentQuiz = {
                    id: quiz.id,
                    title: quiz.title,
                    description: quiz.description,
                    questions: quiz.questions,
                    totalQuestions: quiz.totalQuestions,
                    isShared: true,
                    sharedBy: quiz.userName
                };
                quizManager.currentAnswers = {};
                quizManager.switchTab('quiz');
                quizManager.renderQuiz();
                quizManager.showToast('🚀 Bắt đầu làm bài!', 'success');
            } else {
                throw new Error(data.error || 'Không thể tải quiz');
            }
        } catch (error) {
            console.error('Error starting shared quiz:', error);
            const offlineQuiz = this.getOfflineQuiz(quizId);
            if (offlineQuiz) {
                quizManager.showToast('⚠️ Đang dùng bản offline', 'warning');
                this.startOfflineQuiz(offlineQuiz);
                return;
            }
            this.showStartQuizErrorDialog(quizId, error);
        }
    }

    // Lấy quiz từ offline storage
    getOfflineQuiz(quizId) {
        const offlineQuizzes = JSON.parse(localStorage.getItem('offlineSharedQuizzes')) || [];
        return offlineQuizzes.find(q => q.id === quizId);
    }

    // Bắt đầu quiz offline
    startOfflineQuiz(quiz) {
        quizManager.currentQuiz = {
            id: quiz.id,
            title: quiz.title,
            description: quiz.description,
            questions: quiz.questions,
            totalQuestions: quiz.totalQuestions,
            isShared: true,
            isOffline: true,
            sharedBy: quiz.userName
        };
        
        quizManager.currentAnswers = {};
        
        // Chuyển sang tab làm bài và render quiz
        quizManager.switchTab('quiz');
        quizManager.renderQuiz();
        
        quizManager.showToast('📱 Đang làm bài offline', 'info');
    }

    // Hiển thị dialog lỗi khi không thể bắt đầu quiz
    showStartQuizErrorDialog(quizId, error) {
        const dialog = document.createElement('div');
        dialog.className = 'share-error-dialog';
        dialog.innerHTML = `
            <div class="share-error-content">
                <div class="share-error-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Không Thể Tải Quiz</h3>
                </div>
                <div class="share-error-body">
                    <p><strong>Lỗi:</strong> ${error.message || 'Không thể kết nối server'}</p>
                    <p>Vui lòng thử một trong các cách sau:</p>
                    
                    <div class="error-options">
                        <button class="btn btn-primary" onclick="exploreQuizManager.showServerURLDialog(); this.closest('.share-error-dialog').remove();">
                            <i class="fas fa-cog"></i>
                            Cấu Hình Server
                        </button>
                        
                        <button class="btn btn-secondary" onclick="exploreQuizManager.retryStartQuiz('${quizId}'); this.closest('.share-error-dialog').remove();">
                            <i class="fas fa-sync"></i>
                            Thử Lại
                        </button>
                        
                        <button class="btn btn-danger" onclick="this.closest('.share-error-dialog').remove();">
                            <i class="fas fa-times"></i>
                            Đóng
                        </button>
                    </div>

                    <div class="instruction-note" style="margin-top: 20px;">
                        <i class="fas fa-info-circle"></i>
                        <p><strong>Gợi ý:</strong> Nếu bạn đang truy cập từ máy khác, hãy cấu hình địa chỉ IP của server. Ví dụ: http://192.168.1.100:3000</p>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    // Thử lại bắt đầu quiz
    async retryStartQuiz(quizId) {
        await this.checkServerStatus();
        await this.startSharedQuiz(quizId);
    }

    // Chuyển sang tab khám phá
    switchToExploreTab() {
        quizManager.switchTab('explore');
    }

    // Hiển thị loading
    showLoading(show) {
        const loader = document.getElementById('explore-loading');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    }

    // Hiển thị lỗi
    showError(message) {
        const container = document.getElementById('shared-quizzes-grid');
        if (container) {
            container.innerHTML = `
                <div class="error-state-card">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Có lỗi xảy ra</h3>
                    <p>${message}</p>
                    <button class="btn-primary" onclick="exploreQuizManager.loadSharedQuizzes()">
                        <i class="fas fa-sync"></i>
                        Thử lại
                    </button>
                </div>
            `;
        }
    }

    // Tính thời gian đã trôi qua
    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Vừa xong';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày trước`;
        if (seconds < 2592000) return `${Math.floor(seconds / 604800)} tuần trước`;
        return `${Math.floor(seconds / 2592000)} tháng trước`;
    }

    // Escape HTML để tránh XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Khởi tạo explore quiz manager
let exploreQuizManager;
document.addEventListener('DOMContentLoaded', () => {
    try {
        exploreQuizManager = new ExploreQuizManager();
        
        // Đợi một chút để đảm bảo DOM đã sẵn sàng
        setTimeout(() => {
            if (exploreQuizManager) {
                exploreQuizManager.initialize();
                console.log('✅ Explore Quiz Manager initialized successfully');
            }
        }, 500);
    } catch (error) {
        console.error('❌ Error initializing Explore Quiz Manager:', error);
    }
});

// Expose để debug
window.exploreQuizManager = exploreQuizManager;
