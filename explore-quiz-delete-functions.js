// ⭐ CÁC HÀM XÓA BÀI CHIA SẺ - BỔ SUNG CHO EXPLORE-QUIZ.JS
// Thêm các hàm này vào cuối class ExploreQuizManager trong file explore-quiz.js

// Xác nhận xóa quiz
async confirmDeleteQuiz(quizId) {
    // Đóng menu
    document.querySelector('.quiz-action-menu')?.remove();
    
    try {
        // Lấy thông tin quiz
        let quiz = this.sharedQuizzes.find(q => q.id === quizId);
        
        if (!quiz) {
            // Thử lấy từ server
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
            quizManager.showToast('Không tìm thấy quiz!', 'error');
            return;
        }
        
        // Kiểm tra quyền sở hữu
        if (!this.isQuizOwner(quiz)) {
            quizManager.showToast('Bạn không có quyền xóa bài này!', 'error');
            return;
        }
        
        // Hiển thị dialog xác nhận xóa
        this.showDeleteConfirmDialog(quiz);
        
    } catch (error) {
        console.error('Error confirming delete quiz:', error);
        quizManager.showToast('Lỗi khi tải thông tin quiz', 'error');
    }
}

// Hiển thị dialog xác nhận xóa
showDeleteConfirmDialog(quiz) {
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
    
    // Thêm CSS cho dialog
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
    `;
    
    if (!document.querySelector('style[data-delete-dialog]')) {
        style.setAttribute('data-delete-dialog', 'true');
        document.head.appendChild(style);
    }
    
    document.body.appendChild(dialog);
}

// Thực hiện xóa quiz
async executeDeleteQuiz(quizId) {
    try {
        quizManager.showToast('🗑️ Đang xóa bài...', 'info');
        
        // Gọi hàm deleteSharedQuiz
        const result = await this.deleteSharedQuiz(quizId);
        
        if (result.success) {
            quizManager.showToast('✅ Đã xóa bài thành công!', 'success');
        } else {
            throw new Error(result.message || 'Không thể xóa bài');
        }
        
    } catch (error) {
        console.error('Error executing delete quiz:', error);
        quizManager.showToast(`❌ Lỗi: ${error.message}`, 'error');
    }
}

// ⭐ HƯỚNG DẪN SỬ DỤNG:
// 1. Mở file explore-quiz.js
// 2. Tìm dòng cuối cùng của class ExploreQuizManager (trước dấu đóng ngoặc })
// 3. Thêm 3 hàm trên (confirmDeleteQuiz, showDeleteConfirmDialog, executeDeleteQuiz) vào đó
// 4. Lưu file và test lại chức năng xóa bài
