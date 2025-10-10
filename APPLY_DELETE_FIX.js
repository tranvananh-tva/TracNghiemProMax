// ⭐ SCRIPT TỰ ĐỘNG SỬA LỖI XÓA BÀI CHO ADMIN
// Chạy script này trong Console (F12) để tự động patch explore-quiz.js

(function() {
    console.log('🔧 Bắt đầu patch explore-quiz.js...');
    
    // Kiểm tra xem ExploreQuizManager có tồn tại không
    if (!window.ExploreQuizManager) {
        console.error('❌ ExploreQuizManager không tồn tại!');
        return;
    }
    
    // ⭐ PATCH HÀM deleteSharedQuiz
    window.ExploreQuizManager.prototype.deleteSharedQuiz = async function(quizId) {
        if (!quizId) {
            return {
                success: false,
                message: 'Quiz ID không hợp lệ'
            };
        }

        try {
            console.log('🗑️ Starting delete process for quiz:', quizId);
            
            let deleteSuccess = false;
            let deleteMethod = '';
            
            // ⭐ BƯỚC 1: Thử xóa từ Supabase trước (nếu có)
            if (this.isSupabaseAvailable && window.supabaseQuizManager) {
                try {
                    console.log('☁️ Attempting to delete from Supabase...');
                    const result = await window.supabaseQuizManager.deleteQuiz(quizId);
                    
                    if (result && result.success) {
                        deleteSuccess = true;
                        deleteMethod = 'Supabase';
                        console.log('✅ Deleted from Supabase successfully');
                    } else {
                        console.warn('⚠️ Supabase delete failed:', result?.error);
                    }
                } catch (error) {
                    console.warn('⚠️ Supabase delete error:', error.message);
                }
            }
            
            // ⭐ BƯỚC 2: Thử xóa từ Local Server (nếu Supabase thất bại hoặc không có)
            if (!deleteSuccess && this.isServerOnline) {
                try {
                    console.log('🖥️ Attempting to delete from Local Server...');
                    
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000);
                    
                    const response = await fetch(`${this.API_BASE_URL}/shared-quizzes/${quizId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (response.ok) {
                        const data = await response.json();
                        
                        if (data.success) {
                            deleteSuccess = true;
                            deleteMethod = 'Local Server';
                            console.log('✅ Deleted from Local Server successfully');
                        } else {
                            console.warn('⚠️ Local Server delete failed:', data.error);
                        }
                    } else {
                        console.warn('⚠️ Local Server response not OK:', response.status);
                    }
                } catch (error) {
                    console.warn('⚠️ Local Server delete error:', error.message);
                }
            }
            
            // ⭐ BƯỚC 3: Xóa từ Offline Storage (luôn thực hiện)
            try {
                console.log('📱 Deleting from offline storage...');
                const offlineQuizzes = JSON.parse(localStorage.getItem('offlineSharedQuizzes') || '[]');
                const filteredQuizzes = offlineQuizzes.filter(q => q.id !== quizId);
                
                if (filteredQuizzes.length < offlineQuizzes.length) {
                    localStorage.setItem('offlineSharedQuizzes', JSON.stringify(filteredQuizzes));
                    console.log('✅ Deleted from offline storage');
                }
            } catch (error) {
                console.warn('⚠️ Offline storage delete error:', error.message);
            }
            
            // ⭐ BƯỚC 4: Xóa khỏi danh sách hiện tại
            const originalLength = this.sharedQuizzes.length;
            this.sharedQuizzes = this.sharedQuizzes.filter(q => q.id !== quizId);
            
            if (this.sharedQuizzes.length < originalLength) {
                console.log('✅ Removed from current list');
            }
            
            // ⭐ BƯỚC 5: Cập nhật UI
            this.renderSharedQuizzes(this.sharedQuizzes);
            
            // ⭐ BƯỚC 6: Xóa card khỏi DOM (nếu còn tồn tại)
            const quizCard = document.querySelector(`[data-quiz-id="${quizId}"]`);
            if (quizCard) {
                quizCard.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => {
                    quizCard.remove();
                }, 300);
            }
            
            // ⭐ KẾT QUẢ
            if (deleteSuccess) {
                return {
                    success: true,
                    message: `Đã xóa bài thành công từ ${deleteMethod}!`
                };
            } else {
                // Nếu không xóa được từ server nhưng đã xóa local
                return {
                    success: true,
                    message: 'Đã xóa bài khỏi thiết bị này. Lưu ý: Bài có thể vẫn còn trên server.'
                };
            }
            
        } catch (error) {
            console.error('❌ Error in deleteSharedQuiz:', error);
            return {
                success: false,
                message: `Lỗi khi xóa bài: ${error.message}`
            };
        }
    };
    
    // ⭐ PATCH HÀM confirmDeleteQuiz (nếu chưa có)
    if (!window.ExploreQuizManager.prototype.confirmDeleteQuiz) {
        window.ExploreQuizManager.prototype.confirmDeleteQuiz = async function(quizId) {
            document.querySelector('.quiz-action-menu')?.remove();
            
            try {
                let quiz = this.sharedQuizzes.find(q => q.id === quizId);
                
                if (!quiz) {
                    if (this.isSupabaseAvailable && window.supabaseQuizManager) {
                        const result = await window.supabaseQuizManager.getQuizById(quizId);
                        if (result.success) {
                            quiz = result.quiz;
                        }
                    } else if (this.isServerOnline) {
                        const response = await fetch(`${this.API_BASE_URL}/shared-quizzes/${quizId}`);
                        const data = await response.json();
                        if (data.success) {
                            quiz = data.quiz;
                        }
                    }
                }
                
                if (!quiz) {
                    if (window.quizManager && window.quizManager.showToast) {
                        window.quizManager.showToast('Không tìm thấy quiz!', 'error');
                    }
                    return;
                }
                
                if (!this.isQuizOwner(quiz)) {
                    if (window.quizManager && window.quizManager.showToast) {
                        window.quizManager.showToast('Bạn không có quyền xóa bài này!', 'error');
                    }
                    return;
                }
                
                this.showDeleteConfirmDialog(quiz);
                
            } catch (error) {
                console.error('Error confirming delete quiz:', error);
                if (window.quizManager && window.quizManager.showToast) {
                    window.quizManager.showToast('Lỗi khi tải thông tin quiz', 'error');
                }
            }
        };
    }
    
    // ⭐ PATCH HÀM showDeleteConfirmDialog (nếu chưa có)
    if (!window.ExploreQuizManager.prototype.showDeleteConfirmDialog) {
        window.ExploreQuizManager.prototype.showDeleteConfirmDialog = function(quiz) {
            const dialog = document.createElement('div');
            dialog.className = 'delete-confirm-dialog';
            dialog.innerHTML = `
                <div class="delete-confirm-content">
                    <div class="delete-confirm-header">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Xác Nhận Xóa Bài</h3>
                    </div>
                    <div class="delete-confirm-body">
                        <p><strong>Bạn có chắc chắn muốn xóa bài này?</strong></p>
                        <div class="quiz-info-preview">
                            <p><strong>Tên bài:</strong> ${this.escapeHtml(quiz.title)}</p>
                            <p><strong>Số câu hỏi:</strong> ${quiz.totalQuestions} câu</p>
                            <p><strong>Người chia sẻ:</strong> ${this.escapeHtml(quiz.userName)}</p>
                        </div>
                        <div class="delete-warning">
                            <i class="fas fa-info-circle"></i>
                            <p>Hành động này không thể hoàn tác!</p>
                        </div>
                    </div>
                    <div class="delete-confirm-footer">
                        <button class="btn btn-danger" onclick="exploreQuizManager.executeDeleteQuiz('${quiz.id}'); this.closest('.delete-confirm-dialog').remove();">
                            <i class="fas fa-trash"></i>
                            Xóa Bài
                        </button>
                        <button class="btn btn-secondary" onclick="this.closest('.delete-confirm-dialog').remove();">
                            <i class="fas fa-times"></i>
                            Hủy
                        </button>
                    </div>
                </div>
            `;
            
            const style = document.createElement('style');
            style.textContent = `
                .delete-confirm-dialog {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    animation: fadeIn 0.3s ease-out;
                }
                .delete-confirm-content {
                    background: white;
                    border-radius: 16px;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    animation: slideUp 0.3s ease-out;
                }
                .delete-confirm-header {
                    padding: 24px;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .delete-confirm-header i {
                    font-size: 32px;
                    color: #f56565;
                }
                .delete-confirm-header h3 {
                    margin: 0;
                    font-size: 20px;
                    color: #2d3748;
                }
                .delete-confirm-body {
                    padding: 24px;
                }
                .delete-confirm-body > p {
                    margin: 0 0 16px 0;
                    font-size: 16px;
                    color: #2d3748;
                }
                .quiz-info-preview {
                    background: #f7fafc;
                    padding: 16px;
                    border-radius: 8px;
                    margin-bottom: 16px;
                }
                .quiz-info-preview p {
                    margin: 8px 0;
                    font-size: 14px;
                    color: #4a5568;
                }
                .delete-warning {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: #fff5f5;
                    border-left: 4px solid #f56565;
                    border-radius: 4px;
                }
                .delete-warning i {
                    color: #f56565;
                    font-size: 20px;
                }
                .delete-warning p {
                    margin: 0;
                    font-size: 14px;
                    color: #c53030;
                    font-weight: 600;
                }
                .delete-confirm-footer {
                    padding: 16px 24px;
                    border-top: 1px solid #e2e8f0;
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from {
                        transform: translateY(20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                @keyframes fadeOut {
                    from { opacity: 1; transform: scale(1); }
                    to { opacity: 0; transform: scale(0.9); }
                }
            `;
            
            if (!document.querySelector('style[data-delete-dialog]')) {
                style.setAttribute('data-delete-dialog', 'true');
                document.head.appendChild(style);
            }
            
            document.body.appendChild(dialog);
        };
    }
    
    // ⭐ PATCH HÀM executeDeleteQuiz (nếu chưa có)
    if (!window.ExploreQuizManager.prototype.executeDeleteQuiz) {
        window.ExploreQuizManager.prototype.executeDeleteQuiz = async function(quizId) {
            try {
                if (window.quizManager && window.quizManager.showToast) {
                    window.quizManager.showToast('🗑️ Đang xóa bài...', 'info');
                }
                
                const result = await this.deleteSharedQuiz(quizId);
                
                if (result.success) {
                    if (window.quizManager && window.quizManager.showToast) {
                        window.quizManager.showToast(`✅ ${result.message}`, 'success');
                    }
                } else {
                    throw new Error(result.message || 'Không thể xóa bài');
                }
                
            } catch (error) {
                console.error('Error executing delete quiz:', error);
                if (window.quizManager && window.quizManager.showToast) {
                    window.quizManager.showToast(`❌ Lỗi: ${error.message}`, 'error');
                }
            }
        };
    }
    
    // ⭐ CẬP NHẬT INSTANCE HIỆN TẠI
    if (window.exploreQuizManager) {
        // Bind lại các hàm mới vào instance hiện tại
        window.exploreQuizManager.deleteSharedQuiz = window.ExploreQuizManager.prototype.deleteSharedQuiz.bind(window.exploreQuizManager);
        window.exploreQuizManager.confirmDeleteQuiz = window.ExploreQuizManager.prototype.confirmDeleteQuiz.bind(window.exploreQuizManager);
        window.exploreQuizManager.showDeleteConfirmDialog = window.ExploreQuizManager.prototype.showDeleteConfirmDialog.bind(window.exploreQuizManager);
        window.exploreQuizManager.executeDeleteQuiz = window.ExploreQuizManager.prototype.executeDeleteQuiz.bind(window.exploreQuizManager);
        
        console.log('✅ Đã patch ExploreQuizManager instance thành công!');
    }
    
    console.log('✅ Patch hoàn tất! Bây giờ Admin có thể xóa bài.');
    console.log('💡 Thử xóa một bài để kiểm tra.');
    
})();
