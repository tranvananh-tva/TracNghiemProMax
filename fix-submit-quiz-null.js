// FIX SUBMIT QUIZ NULL ERROR
// Sửa lỗi: Cannot read properties of null (reading 'totalQuestions')

(function() {
    console.log('🔧 [FIX SUBMIT] Loading Submit Quiz Null Protection...');

    // Đợi QuizManager sẵn sàng
    function waitForQuizManager(callback) {
        const checkReady = () => {
            if (window.QuizManager && window.QuizManager.prototype.submitQuiz) {
                callback();
            } else {
                setTimeout(checkReady, 100);
            }
        };
        checkReady();
    }

    waitForQuizManager(() => {
        console.log('✅ [FIX SUBMIT] QuizManager ready, applying fix...');

        // Backup original submitQuiz
        const originalSubmitQuiz = window.QuizManager.prototype.submitQuiz;

        // Override submitQuiz with null protection
        window.QuizManager.prototype.submitQuiz = function() {
            console.log('🎯 [FIX SUBMIT] submitQuiz called');

            // ============================================
            // KIỂM TRA CURRENTQUIZ CÓ TỒN TẠI KHÔNG
            // ============================================
            if (!this.currentQuiz) {
                console.error('❌ [FIX SUBMIT] currentQuiz is null!');
                
                // Thử khôi phục từ backup
                if (this._quizBackup && this._quizBackup.questions && this._quizBackup.questions.length > 0) {
                    console.log('🔄 [FIX SUBMIT] Restoring from backup...');
                    this.currentQuiz = JSON.parse(JSON.stringify(this._quizBackup));
                    console.log('✅ [FIX SUBMIT] Restored from backup');
                } else if (window.roomManager && window.roomManager.currentRoom && window.roomManager.currentRoom.quiz) {
                    // Thử khôi phục từ roomManager
                    console.log('🔄 [FIX SUBMIT] Restoring from roomManager...');
                    const room = window.roomManager.currentRoom;
                    this.currentQuiz = {
                        id: room.quiz.id,
                        title: room.quiz.title,
                        description: room.quiz.description || '',
                        questions: room.quiz.questions,
                        totalQuestions: room.quiz.totalQuestions || room.quiz.questions.length,
                        isRoomQuiz: true,
                        roomId: room.id,
                        roomCode: room.code,
                        roomName: room.name,
                        userName: room.userName
                    };
                    this._quizBackup = JSON.parse(JSON.stringify(this.currentQuiz));
                    console.log('✅ [FIX SUBMIT] Restored from roomManager');
                } else {
                    // Không thể khôi phục
                    console.error('❌ [FIX SUBMIT] Cannot restore currentQuiz - no backup available');
                    this.showToast('❌ Lỗi: Không thể nộp bài. Vui lòng tải lại trang!', 'error');
                    
                    // Hiển thị thông báo chi tiết
                    setTimeout(() => {
                        if (confirm('Đã xảy ra lỗi khi nộp bài.\n\nBạn có muốn tải lại trang không?\n\n(Lưu ý: Kết quả làm bài sẽ bị mất)')) {
                            window.location.reload();
                        }
                    }, 500);
                    
                    return;
                }
            }

            // ============================================
            // KIỂM TRA CURRENTQUIZ CÓ ĐẦY ĐỦ DỮ LIỆU KHÔNG
            // ============================================
            if (!this.currentQuiz.questions || this.currentQuiz.questions.length === 0) {
                console.error('❌ [FIX SUBMIT] currentQuiz has no questions!');
                this.showToast('❌ Lỗi: Không có câu hỏi để nộp bài!', 'error');
                return;
            }

            if (!this.currentQuiz.totalQuestions) {
                console.warn('⚠️ [FIX SUBMIT] totalQuestions is missing, calculating...');
                this.currentQuiz.totalQuestions = this.currentQuiz.questions.length;
            }

            // ============================================
            // VERIFY DỮ LIỆU TRƯỚC KHI SUBMIT
            // ============================================
            console.log('✅ [FIX SUBMIT] Quiz data verified:');
            console.log('  - Title:', this.currentQuiz.title);
            console.log('  - Total Questions:', this.currentQuiz.totalQuestions);
            console.log('  - Questions Array Length:', this.currentQuiz.questions.length);
            console.log('  - Answered:', Object.keys(this.currentAnswers).length);
            console.log('  - Is Room Quiz:', this.currentQuiz.isRoomQuiz || false);

            // ============================================
            // GỌI HÀM GỐC
            // ============================================
            try {
                return originalSubmitQuiz.call(this);
            } catch (error) {
                console.error('❌ [FIX SUBMIT] Error in original submitQuiz:', error);
                this.showToast('❌ Lỗi khi nộp bài: ' + error.message, 'error');
                
                // Log chi tiết để debug
                console.error('Current Quiz State:', {
                    currentQuiz: this.currentQuiz,
                    currentAnswers: this.currentAnswers,
                    backup: this._quizBackup
                });
            }
        };

        console.log('✅ [FIX SUBMIT] submitQuiz protected successfully!');

        // ============================================
        // BẢO VỆ CÁC HÀM LIÊN QUAN
        // ============================================

        // Protect updateProgressBar
        const originalUpdateProgressBar = window.QuizManager.prototype.updateProgressBar;
        if (originalUpdateProgressBar) {
            window.QuizManager.prototype.updateProgressBar = function() {
                if (!this.currentQuiz || !this.currentQuiz.totalQuestions) {
                    console.warn('⚠️ [FIX SUBMIT] updateProgressBar: currentQuiz invalid, skipping');
                    return;
                }
                return originalUpdateProgressBar.call(this);
            };
            console.log('✅ [FIX SUBMIT] updateProgressBar protected');
        }

        // Protect updateProgressBarModern
        const originalUpdateProgressBarModern = window.QuizManager.prototype.updateProgressBarModern;
        if (originalUpdateProgressBarModern) {
            window.QuizManager.prototype.updateProgressBarModern = function() {
                if (!this.currentQuiz || !this.currentQuiz.totalQuestions) {
                    console.warn('⚠️ [FIX SUBMIT] updateProgressBarModern: currentQuiz invalid, skipping');
                    return;
                }
                return originalUpdateProgressBarModern.call(this);
            };
            console.log('✅ [FIX SUBMIT] updateProgressBarModern protected');
        }

        // ============================================
        // PERIODIC HEALTH CHECK
        // ============================================
        setInterval(() => {
            if (window.quizManager && window.quizManager.currentQuiz) {
                // Kiểm tra currentQuiz có hợp lệ không
                if (!window.quizManager.currentQuiz.totalQuestions && 
                    window.quizManager.currentQuiz.questions && 
                    window.quizManager.currentQuiz.questions.length > 0) {
                    
                    console.warn('⚠️ [FIX SUBMIT] totalQuestions missing, fixing...');
                    window.quizManager.currentQuiz.totalQuestions = window.quizManager.currentQuiz.questions.length;
                    console.log('✅ [FIX SUBMIT] totalQuestions fixed:', window.quizManager.currentQuiz.totalQuestions);
                }

                // Đảm bảo backup tồn tại
                if (!window.quizManager._quizBackup || !window.quizManager._quizBackup.questions) {
                    window.quizManager._quizBackup = JSON.parse(JSON.stringify(window.quizManager.currentQuiz));
                    console.log('🔄 [FIX SUBMIT] Backup created');
                }
            }
        }, 3000);

        console.log('✅ [FIX SUBMIT] Health check started (every 3 seconds)');

        // ============================================
        // HOÀN TẤT
        // ============================================
        console.log('✅ [FIX SUBMIT] All protections applied successfully!');
        console.log('📋 [FIX SUBMIT] Protected functions:');
        console.log('  ✓ submitQuiz');
        console.log('  ✓ updateProgressBar');
        console.log('  ✓ updateProgressBarModern');
        console.log('  ✓ Periodic health check');
    });
})();
