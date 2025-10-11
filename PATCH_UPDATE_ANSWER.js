// ============================================================================
// PATCH updateAnswerModern - LOAD NGAY SAU script-modern.js
// ============================================================================
// Thay thế HOÀN TOÀN hàm updateAnswerModern để fix lỗi currentQuiz null
// ============================================================================

(function() {
    console.log('🔧 PATCHING updateAnswerModern...');
    
    // Đợi QuizManager load
    let attempts = 0;
    const maxAttempts = 50;
    
    const patchInterval = setInterval(() => {
        attempts++;
        
        if (window.QuizManager && window.QuizManager.prototype) {
            clearInterval(patchInterval);
            
            console.log('✅ QuizManager found, applying patch...');
            
            // THAY THẾ HOÀN TOÀN
            QuizManager.prototype.updateAnswerModern = function(questionIndex, selectedAnswer) {
                console.log(`✏️ [PATCHED] updateAnswerModern: Q${questionIndex} = ${selectedAnswer}`);
                
                // ============================================================
                // KIỂM TRA VÀ RESTORE - TUYỆT ĐỐI KHÔNG NULL
                // ============================================================
                
                if (!this.currentQuiz || !this.currentQuiz.questions) {
                    console.error('❌ currentQuiz is null, attempting restore...');
                    
                    let restored = false;
                    
                    // 1. Từ _quizBackup
                    if (!restored && this._quizBackup && this._quizBackup.questions) {
                        this.currentQuiz = JSON.parse(JSON.stringify(this._quizBackup));
                        console.log('✅ Restored from _quizBackup');
                        restored = true;
                    }
                    
                    // 2. Từ localStorage.quizBackup
                    if (!restored) {
                        try {
                            const backup = localStorage.getItem('quizBackup');
                            if (backup) {
                                const data = JSON.parse(backup);
                                if (data && data.questions) {
                                    this.currentQuiz = data;
                                    this._quizBackup = JSON.parse(JSON.stringify(data));
                                    console.log('✅ Restored from localStorage.quizBackup');
                                    restored = true;
                                }
                            }
                        } catch (e) {
                            console.error('Error restoring from quizBackup:', e);
                        }
                    }
                    
                    // 3. Từ localStorage.currentRoomQuiz
                    if (!restored) {
                        try {
                            const backup = localStorage.getItem('currentRoomQuiz');
                            if (backup) {
                                const data = JSON.parse(backup);
                                if (data && data.questions) {
                                    this.currentQuiz = data;
                                    this._quizBackup = JSON.parse(JSON.stringify(data));
                                    console.log('✅ Restored from localStorage.currentRoomQuiz');
                                    restored = true;
                                }
                            }
                        } catch (e) {
                            console.error('Error restoring from currentRoomQuiz:', e);
                        }
                    }
                    
                    // 4. Từ roomManager.currentRoom
                    if (!restored && window.roomManager && window.roomManager.currentRoom && window.roomManager.currentRoom.quiz) {
                        try {
                            const room = window.roomManager.currentRoom;
                            const quiz = room.quiz;
                            
                            this.currentQuiz = {
                                id: quiz.id,
                                title: quiz.title,
                                description: quiz.description || '',
                                questions: JSON.parse(JSON.stringify(quiz.questions)),
                                totalQuestions: quiz.totalQuestions || quiz.questions.length,
                                isRoomQuiz: true,
                                roomId: room.id,
                                roomCode: room.code,
                                roomName: room.name,
                                userName: room.userName
                            };
                            
                            this._quizBackup = JSON.parse(JSON.stringify(this.currentQuiz));
                            localStorage.setItem('quizBackup', JSON.stringify(this.currentQuiz));
                            localStorage.setItem('currentRoomQuiz', JSON.stringify(this.currentQuiz));
                            
                            console.log('✅ Restored from roomManager.currentRoom');
                            restored = true;
                        } catch (e) {
                            console.error('Error restoring from roomManager:', e);
                        }
                    }
                    
                    // 5. Nếu vẫn không restore được
                    if (!restored || !this.currentQuiz || !this.currentQuiz.questions) {
                        console.error('❌ CANNOT RESTORE - ALL SOURCES FAILED');
                        console.error('Available sources:');
                        console.error('1. _quizBackup:', this._quizBackup);
                        console.error('2. localStorage.quizBackup:', localStorage.getItem('quizBackup'));
                        console.error('3. localStorage.currentRoomQuiz:', localStorage.getItem('currentRoomQuiz'));
                        console.error('4. roomManager.currentRoom:', window.roomManager?.currentRoom);
                        
                        alert('❌ LỖI: Dữ liệu bài thi bị mất!\n\nVui lòng:\n1. Chụp màn hình Console (F12)\n2. Báo lỗi ngay\n3. KHÔNG tải lại trang');
                        return;
                    }
                }
                
                // ============================================================
                // LƯU CÂU TRẢ LỜI
                // ============================================================
                
                this.currentAnswers[questionIndex] = selectedAnswer;
                console.log(`✅ Answer saved: Q${questionIndex} = ${selectedAnswer}`);
                
                // ============================================================
                // CẬP NHẬT GIAO DIỆN
                // ============================================================
                
                try {
                    // Update option styling
                    const selectedInput = document.querySelector(`#q${questionIndex}_${selectedAnswer}`);
                    if (selectedInput) {
                        const optionModern = selectedInput.closest('.option-modern');
                        if (optionModern) {
                            document.querySelectorAll(`input[name="question_${questionIndex}"]`).forEach(input => {
                                const parent = input.closest('.option-modern');
                                if (parent) parent.classList.remove('selected');
                            });
                            optionModern.classList.add('selected');
                        }
                    }
                    
                    // Update question grid
                    const gridItem = document.querySelector(`.question-grid-item[data-question="${questionIndex}"]`);
                    if (gridItem) {
                        gridItem.classList.add('answered');
                    }
                    
                    // Update progress bar
                    if (typeof this.updateProgressBarModern === 'function') {
                        this.updateProgressBarModern();
                    } else if (typeof this.updateProgressBar === 'function') {
                        this.updateProgressBar();
                    }
                    
                    // Auto next
                    const autoNext = document.getElementById('auto-next');
                    if (autoNext && autoNext.checked && this.currentQuiz && questionIndex < this.currentQuiz.totalQuestions - 1) {
                        setTimeout(() => {
                            if (this.currentQuiz && this.currentQuiz.questions && typeof this.nextQuestion === 'function') {
                                this.nextQuestion();
                            }
                        }, 500);
                    }
                    
                } catch (error) {
                    console.error('Error updating UI:', error);
                }
            };
            
            console.log('✅ PATCH APPLIED SUCCESSFULLY!');
            console.log('📝 updateAnswerModern has been replaced');
            
        } else if (attempts >= maxAttempts) {
            clearInterval(patchInterval);
            console.error('❌ Failed to patch: QuizManager not found after', maxAttempts, 'attempts');
        }
    }, 100);
    
})();
