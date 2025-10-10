// ============================================
// PATCH: Sửa lỗi xóa bài trong Khám Phá Đề Thi
// ============================================
// Thay thế hàm deleteQuiz trong explore-quiz.js

// Xóa quiz - PHIÊN BẢN ĐÃ SỬA
async deleteQuiz(quizId) {
    try {
        // Đóng modal
        document.querySelector('.confirm-delete-modal')?.remove();
        
        // Lấy thông tin quiz
        const quiz = this.sharedQuizzes.find(q => q.id === quizId);
        
        if (!quiz) {
            quizManager.showToast('Không tìm thấy quiz!', 'error');
            return;
        }
        
        // Kiểm tra quyền sở hữu
        if (!this.isQuizOwner(quiz)) {
            quizManager.showToast('Bạn không có quyền xóa bài này!', 'error');
            return;
        }
        
        quizManager.showToast('🔄 Đang xóa bài...', 'info');
        
        let deleteSuccess = false;
        
        // Thử xóa từ Supabase trước
        if (this.isSupabaseAvailable && window.supabaseQuizManager) {
            try {
                const result = await window.supabaseQuizManager.deleteQuiz(quizId);
                if (result.success) {
                    deleteSuccess = true;
                    console.log('✅ Deleted from Supabase');
                }
            } catch (error) {
                console.warn('Supabase delete failed, trying local server:', error);
            }
        }
        
        // Fallback sang Local Server
        if (!deleteSuccess && this.isServerOnline) {
            try {
                const response = await fetch(`${this.API_BASE_URL}/shared-quizzes/${quizId}`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    deleteSuccess = true;
                    console.log('✅ Deleted from Local Server');
                }
            } catch (error) {
                console.warn('Local server delete failed:', error);
            }
        }
        
        // ⭐⭐⭐ QUAN TRỌNG: LUÔN xóa khỏi localStorage ⭐⭐⭐
        // Đây là fix chính để bài không xuất hiện lại khi refresh
        let offlineQuizzes = JSON.parse(localStorage.getItem('offlineSharedQuizzes')) || [];
        const beforeCount = offlineQuizzes.length;
        
        // Xóa theo cả id và originalId (để đảm bảo xóa hết)
        offlineQuizzes = offlineQuizzes.filter(q => {
            return q.id !== quizId && q.originalId !== quizId;
        });
        
        const afterCount = offlineQuizzes.length;
        
        // Lưu lại localStorage
        localStorage.setItem('offlineSharedQuizzes', JSON.stringify(offlineQuizzes));
        
        if (beforeCount > afterCount) {
            console.log(`✅ Deleted from localStorage (${beforeCount} -> ${afterCount} quizzes)`);
        } else {
            console.log('ℹ️ Quiz not found in localStorage');
        }
        
        // Xóa khỏi danh sách hiện tại trong memory
        const beforeMemoryCount = this.sharedQuizzes.length;
        this.sharedQuizzes = this.sharedQuizzes.filter(q => q.id !== quizId);
        const afterMemoryCount = this.sharedQuizzes.length;
        
        console.log(`✅ Deleted from memory (${beforeMemoryCount} -> ${afterMemoryCount} quizzes)`);
        
        // Render lại danh sách
        this.renderSharedQuizzes(this.sharedQuizzes);
        
        // Hiển thị thông báo thành công
        if (deleteSuccess) {
            quizManager.showToast('✅ Đã xóa bài thành công!', 'success');
        } else {
            quizManager.showToast('✅ Đã xóa bài khỏi máy này!', 'success');
        }
        
        // Log để debug
        console.log('📊 Delete Summary:', {
            quizId: quizId,
            deletedFromServer: deleteSuccess,
            deletedFromLocalStorage: beforeCount > afterCount,
            deletedFromMemory: beforeMemoryCount > afterMemoryCount,
            remainingQuizzes: this.sharedQuizzes.length
        });
        
    } catch (error) {
        console.error('❌ Error deleting quiz:', error);
        quizManager.showToast('❌ Lỗi khi xóa bài!', 'error');
    }
}
