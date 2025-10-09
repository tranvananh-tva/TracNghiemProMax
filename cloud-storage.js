// Cloud Storage - Chia sẻ quiz giữa các người dùng
class CloudQuizManager {
    constructor() {
        this.STORAGE_KEY = 'community_quizzes_global';
        this.SYNC_URL = 'https://api.npoint.io/8f3e2d1c9b7a6e5f4d3c';
        this.isOnline = true;
        this.syncInterval = null;
    }

    isAvailable() {
        return this.isOnline;
    }

    // Khởi động auto-sync
    startAutoSync() {
        // Sync mỗi 30 giây
        this.syncInterval = setInterval(() => {
            this.syncWithCloud();
        }, 30000);
        
        // Sync ngay lập tức
        this.syncWithCloud();
    }

    // Dừng auto-sync
    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    // Sync với cloud
    async syncWithCloud() {
        try {
            const response = await fetch(this.SYNC_URL);
            if (response.ok) {
                const cloudData = await response.json();
                const localData = this.getLocalQuizzes();
                
                // Merge: Ưu tiên quiz mới hơn
                const merged = this.mergeQuizzes(localData, cloudData.quizzes || []);
                
                // Lưu vào localStorage
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(merged));
                
                console.log('✅ Synced with cloud:', merged.length, 'quizzes');
                return merged;
            }
        } catch (error) {
            console.warn('Sync failed, using local data');
        }
        return this.getLocalQuizzes();
    }

    // Merge 2 danh sách quiz
    mergeQuizzes(local, cloud) {
        const map = new Map();
        
        // Thêm cloud quizzes trước
        cloud.forEach(q => map.set(q.id, q));
        
        // Thêm local quizzes (ghi đè nếu mới hơn)
        local.forEach(q => {
            const existing = map.get(q.id);
            if (!existing || new Date(q.sharedAt) > new Date(existing.sharedAt)) {
                map.set(q.id, q);
            }
        });
        
        // Convert về array và sort
        return Array.from(map.values()).sort((a, b) => 
            new Date(b.sharedAt) - new Date(a.sharedAt)
        );
    }

    // Lấy quiz từ localStorage
    getLocalQuizzes() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    // Lưu quiz vào localStorage
    saveLocalQuizzes(quizzes) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(quizzes));
    }

    // Chia sẻ quiz
    async shareQuiz(quiz, userName) {
        try {
            const allQuizzes = await this.getAllQuizzes();
            const quizData = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                title: quiz.title,
                description: quiz.description || 'Không có mô tả',
                questions: quiz.questions,
                totalQuestions: quiz.questions.length,
                userName: userName,
                sharedAt: new Date().toISOString(),
                views: 0,
                attempts: 0,
                originalId: quiz.id
            };
            
            allQuizzes.quizzes.unshift(quizData);
            
            // Giới hạn 100 quiz
            if (allQuizzes.quizzes.length > 100) {
                allQuizzes.quizzes = allQuizzes.quizzes.slice(0, 100);
            }
            
            // Lưu local
            this.saveLocalQuizzes(allQuizzes.quizzes);
            
            // Upload lên cloud (không chặn)
            this.uploadToCloud(allQuizzes.quizzes).catch(err => {
                console.warn('Upload to cloud failed:', err);
            });
            
            return { success: true, id: quizData.id, quiz: quizData };
        } catch (error) {
            console.error('Share error:', error);
            throw error;
        }
    }

    // Upload lên cloud
    async uploadToCloud(quizzes) {
        try {
            await fetch(this.SYNC_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quizzes: quizzes,
                    updated: new Date().toISOString()
                })
            });
        } catch (error) {
            throw error;
        }
    }

    // Lấy tất cả quiz
    async getAllQuizzes() {
        try {
            const quizzes = await this.syncWithCloud();
            return { success: true, quizzes: quizzes };
        } catch (error) {
            const local = this.getLocalQuizzes();
            return { success: true, quizzes: local };
        }
    }

    // Lấy quiz theo ID
    async getQuizById(quizId) {
        try {
            const allQuizzes = await this.getAllQuizzes();
            const quiz = allQuizzes.quizzes.find(q => q.id === quizId);
            if (!quiz) throw new Error('Quiz không tồn tại');
            
            quiz.views = (quiz.views || 0) + 1;
            
            const updatedQuizzes = allQuizzes.quizzes.map(q => 
                q.id === quizId ? quiz : q
            );
            
            this.saveLocalQuizzes(updatedQuizzes);
            this.uploadToCloud(updatedQuizzes).catch(() => {});
            
            return { success: true, quiz: quiz };
        } catch (error) {
            throw error;
        }
    }

    // Tăng số lượt làm bài
    async incrementAttempts(quizId) {
        try {
            const allQuizzes = await this.getAllQuizzes();
            const updatedQuizzes = allQuizzes.quizzes.map(q => {
                if (q.id === quizId) q.attempts = (q.attempts || 0) + 1;
                return q;
            });
            
            this.saveLocalQuizzes(updatedQuizzes);
            this.uploadToCloud(updatedQuizzes).catch(() => {});
            
            return { success: true };
        } catch (error) {
            return { success: false };
        }
    }

    // Tìm kiếm quiz
    async searchQuizzes(keyword) {
        const result = await this.getAllQuizzes();
        const keywordLower = keyword.toLowerCase();
        const filtered = result.quizzes.filter(quiz => 
            quiz.title.toLowerCase().includes(keywordLower) ||
            quiz.description.toLowerCase().includes(keywordLower) ||
            quiz.userName.toLowerCase().includes(keywordLower)
        );
        return { success: true, quizzes: filtered };
    }
}

// Export
window.CloudQuizManager = CloudQuizManager;
