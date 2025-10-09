// Community Share Manager - Chia sẻ quiz trong cộng đồng
// Không cần server, không cần Firebase, không cần cùng mạng LAN
// Tất cả quiz được lưu trong file JSON tĩnh

class CommunityShareManager {
    constructor() {
        this.COMMUNITY_FILE = 'community-quizzes.json';
        this.communityQuizzes = [];
        this.isLoading = false;
        this.lastSync = null;
        
        // Cache trong localStorage
        this.CACHE_KEY = 'communityQuizzesCache';
        this.CACHE_TIME_KEY = 'communityQuizzesCacheTime';
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 phút
    }

    // Khởi tạo
    async initialize() {
        console.log('🌐 Initializing Community Share Manager...');
        await this.loadCommunityQuizzes();
    }

    // Load quiz từ file JSON
    async loadCommunityQuizzes() {
        try {
            this.isLoading = true;
            
            // Kiểm tra cache trước
            const cachedData = this.getCachedData();
            if (cachedData) {
                this.communityQuizzes = cachedData;
                console.log('✅ Loaded from cache:', this.communityQuizzes.length, 'quizzes');
                
                // Load từ server trong background để cập nhật
                this.loadFromServerInBackground();
                return this.communityQuizzes;
            }

            // Load từ server
            const response = await fetch(this.COMMUNITY_FILE + '?t=' + Date.now());
            
            if (!response.ok) {
                throw new Error('Cannot load community quizzes');
            }

            const data = await response.json();
            this.communityQuizzes = data.quizzes || [];
            this.lastSync = new Date();

            // Lưu vào cache
            this.setCachedData(this.communityQuizzes);

            console.log('✅ Loaded community quizzes:', this.communityQuizzes.length);
            return this.communityQuizzes;

        } catch (error) {
            console.error('❌ Error loading community quizzes:', error);
            
            // Fallback: dùng cache cũ nếu có
            const oldCache = localStorage.getItem(this.CACHE_KEY);
            if (oldCache) {
                try {
                    this.communityQuizzes = JSON.parse(oldCache);
                    console.log('⚠️ Using old cache:', this.communityQuizzes.length, 'quizzes');
                } catch (e) {
                    this.communityQuizzes = [];
                }
            }
            
            return this.communityQuizzes;
        } finally {
            this.isLoading = false;
        }
    }

    // Load từ server trong background
    async loadFromServerInBackground() {
        try {
            const response = await fetch(this.COMMUNITY_FILE + '?t=' + Date.now());
            if (response.ok) {
                const data = await response.json();
                this.communityQuizzes = data.quizzes || [];
                this.setCachedData(this.communityQuizzes);
                console.log('🔄 Background sync completed');
            }
        } catch (error) {
            console.log('⚠️ Background sync failed, using cache');
        }
    }

    // Lấy dữ liệu từ cache
    getCachedData() {
        try {
            const cacheTime = localStorage.getItem(this.CACHE_TIME_KEY);
            if (!cacheTime) return null;

            const timeDiff = Date.now() - parseInt(cacheTime);
            if (timeDiff > this.CACHE_DURATION) {
                // Cache hết hạn
                return null;
            }

            const cachedData = localStorage.getItem(this.CACHE_KEY);
            if (!cachedData) return null;

            return JSON.parse(cachedData);
        } catch (error) {
            return null;
        }
    }

    // Lưu dữ liệu vào cache
    setCachedData(data) {
        try {
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
            localStorage.setItem(this.CACHE_TIME_KEY, Date.now().toString());
        } catch (error) {
            console.error('Cannot save to cache:', error);
        }
    }

    // Chia sẻ quiz lên cộng đồng
    async shareQuiz(quiz, userName) {
        try {
            // Tạo quiz mới
            const newQuiz = {
                id: 'quiz_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                title: quiz.title,
                description: quiz.description || 'Không có mô tả',
                questions: quiz.questions,
                totalQuestions: quiz.questions.length,
                userName: userName,
                sharedAt: new Date().toISOString(),
                views: 0,
                attempts: 0,
                likes: 0
            };

            // Thêm vào danh sách
            this.communityQuizzes.unshift(newQuiz);

            // Lưu vào localStorage để người dùng này thấy ngay
            this.setCachedData(this.communityQuizzes);

            // Tạo nội dung file mới
            const fileContent = {
                quizzes: this.communityQuizzes,
                lastUpdated: new Date().toISOString(),
                version: '1.0.0'
            };

            // Hiển thị hướng dẫn cho người dùng
            this.showShareInstructions(newQuiz, fileContent);

            return {
                success: true,
                quiz: newQuiz,
                needsManualUpdate: true
            };

        } catch (error) {
            console.error('Error sharing quiz:', error);
            throw error;
        }
    }

    // Hiển thị hướng dẫn chia sẻ
    showShareInstructions(quiz, fileContent) {
        const modal = document.createElement('div');
        modal.className = 'share-instructions-modal';
        modal.innerHTML = `
            <div class="share-instructions-content">
                <div class="share-instructions-header">
                    <h3><i class="fas fa-check-circle"></i> Quiz Đã Sẵn Sàng Chia Sẻ!</h3>
                    <button class="btn-close" onclick="this.closest('.share-instructions-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="share-instructions-body">
                    <div class="success-message">
                        <i class="fas fa-party-horn"></i>
                        <p><strong>Tuyệt vời!</strong> Quiz của bạn đã được chuẩn bị để chia sẻ.</p>
                    </div>

                    <div class="quiz-info-box">
                        <h4><i class="fas fa-file-alt"></i> Thông tin quiz:</h4>
                        <p><strong>Tên:</strong> ${this.escapeHtml(quiz.title)}</p>
                        <p><strong>Số câu:</strong> ${quiz.totalQuestions} câu</p>
                        <p><strong>Người chia sẻ:</strong> ${this.escapeHtml(quiz.userName)}</p>
                    </div>

                    <div class="instruction-section">
                        <h4><i class="fas fa-info-circle"></i> Để mọi người thấy quiz của bạn:</h4>
                        
                        <div class="instruction-step">
                            <div class="step-number">1</div>
                            <div class="step-content">
                                <h5>Copy dữ liệu quiz</h5>
                                <p>Click nút bên dưới để copy dữ liệu:</p>
                                <button class="btn btn-primary" onclick="communityShareManager.copyQuizData('${quiz.id}')">
                                    <i class="fas fa-copy"></i> Copy Dữ Liệu Quiz
                                </button>
                            </div>
                        </div>

                        <div class="instruction-step">
                            <div class="step-number">2</div>
                            <div class="step-content">
                                <h5>Cập nhật file community-quizzes.json</h5>
                                <p>Mở file <code>community-quizzes.json</code> trong thư mục dự án</p>
                                <p>Paste dữ liệu vừa copy vào file</p>
                                <p>Lưu file (Ctrl + S)</p>
                            </div>
                        </div>

                        <div class="instruction-step">
                            <div class="step-number">3</div>
                            <div class="step-content">
                                <h5>Hoàn tất!</h5>
                                <p>Tất cả người dùng mở ứng dụng sẽ thấy quiz của bạn</p>
                                <p>Không cần server, không cần cùng mạng!</p>
                            </div>
                        </div>
                    </div>

                    <div class="alternative-section">
                        <h4><i class="fas fa-lightbulb"></i> Cách khác (Tự động):</h4>
                        <p>Nếu bạn có quyền ghi file, click nút bên dưới:</p>
                        <button class="btn btn-success" onclick="communityShareManager.downloadUpdatedFile('${quiz.id}')">
                            <i class="fas fa-download"></i> Tải File Đã Cập Nhật
                        </button>
                        <p class="note">Sau khi tải, thay thế file <code>community-quizzes.json</code> cũ</p>
                    </div>
                </div>
                <div class="share-instructions-footer">
                    <button class="btn btn-primary" onclick="this.closest('.share-instructions-modal').remove()">
                        <i class="fas fa-check"></i> Đã Hiểu
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Lưu data để copy
        this._pendingShareData = JSON.stringify(fileContent, null, 2);
        this._pendingQuizId = quiz.id;
    }

    // Copy dữ liệu quiz
    copyQuizData(quizId) {
        if (!this._pendingShareData) {
            alert('Không tìm thấy dữ liệu quiz!');
            return;
        }

        // Copy vào clipboard
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(this._pendingShareData)
                .then(() => {
                    this.showToast('✅ Đã copy dữ liệu! Paste vào file community-quizzes.json', 'success');
                })
                .catch(() => {
                    this.fallbackCopy(this._pendingShareData);
                });
        } else {
            this.fallbackCopy(this._pendingShareData);
        }
    }

    // Fallback copy method
    fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            document.execCommand('copy');
            this.showToast('✅ Đã copy dữ liệu! Paste vào file community-quizzes.json', 'success');
        } catch (err) {
            this.showToast('❌ Không thể copy. Vui lòng copy thủ công.', 'error');
            // Hiển thị modal với text để copy thủ công
            this.showManualCopyModal(text);
        }
        
        document.body.removeChild(textarea);
    }

    // Hiển thị modal copy thủ công
    showManualCopyModal(text) {
        const modal = document.createElement('div');
        modal.className = 'manual-copy-modal';
        modal.innerHTML = `
            <div class="manual-copy-content">
                <div class="manual-copy-header">
                    <h3><i class="fas fa-copy"></i> Copy Dữ Liệu Thủ Công</h3>
                    <button class="btn-close" onclick="this.closest('.manual-copy-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="manual-copy-body">
                    <p>Vui lòng copy toàn bộ nội dung bên dưới:</p>
                    <textarea readonly class="manual-copy-textarea">${text}</textarea>
                    <button class="btn btn-primary" onclick="this.previousElementSibling.select(); document.execCommand('copy'); alert('Đã copy!');">
                        <i class="fas fa-copy"></i> Select All & Copy
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Download file đã cập nhật
    downloadUpdatedFile(quizId) {
        if (!this._pendingShareData) {
            alert('Không tìm thấy dữ liệu quiz!');
            return;
        }

        // Tạo blob và download
        const blob = new Blob([this._pendingShareData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'community-quizzes.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('✅ Đã tải file! Thay thế file cũ trong thư mục dự án.', 'success');
    }

    // Lấy tất cả quiz
    getAllQuizzes() {
        return this.communityQuizzes;
    }

    // Lấy quiz theo ID
    getQuizById(quizId) {
        return this.communityQuizzes.find(q => q.id === quizId);
    }

    // Tìm kiếm quiz
    searchQuizzes(keyword) {
        const keywordLower = keyword.toLowerCase();
        return this.communityQuizzes.filter(quiz => 
            quiz.title.toLowerCase().includes(keywordLower) ||
            quiz.description.toLowerCase().includes(keywordLower) ||
            quiz.userName.toLowerCase().includes(keywordLower)
        );
    }

    // Tăng lượt xem
    incrementViews(quizId) {
        const quiz = this.getQuizById(quizId);
        if (quiz) {
            quiz.views = (quiz.views || 0) + 1;
            this.setCachedData(this.communityQuizzes);
        }
    }

    // Tăng lượt làm bài
    incrementAttempts(quizId) {
        const quiz = this.getQuizById(quizId);
        if (quiz) {
            quiz.attempts = (quiz.attempts || 0) + 1;
            this.setCachedData(this.communityQuizzes);
        }
    }

    // Like quiz
    likeQuiz(quizId) {
        const quiz = this.getQuizById(quizId);
        if (quiz) {
            quiz.likes = (quiz.likes || 0) + 1;
            this.setCachedData(this.communityQuizzes);
        }
    }

    // Refresh danh sách
    async refresh() {
        // Xóa cache
        localStorage.removeItem(this.CACHE_KEY);
        localStorage.removeItem(this.CACHE_TIME_KEY);
        
        // Load lại
        return await this.loadCommunityQuizzes();
    }

    // Show toast
    showToast(message, type = 'info') {
        if (window.quizManager && window.quizManager.showToast) {
            window.quizManager.showToast(message, type);
        } else {
            alert(message);
        }
    }

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Khởi tạo
const communityShareManager = new CommunityShareManager();
window.communityShareManager = communityShareManager;

// Auto initialize khi DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        communityShareManager.initialize();
    });
} else {
    communityShareManager.initialize();
}

console.log('✅ Community Share Manager loaded');
