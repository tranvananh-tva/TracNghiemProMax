// FIX ROOM QUIZ - COMPLETE SOLUTION
// This file ensures room quizzes work properly for all users

(function() {
    console.log('🔧 Loading Room Quiz Fix...');

    // Wait for QuizManager to be ready
    function waitForQuizManager(callback) {
        if (window.quizManager && window.QuizManager) {
            callback();
        } else {
            setTimeout(() => waitForQuizManager(callback), 100);
        }
    }

    waitForQuizManager(() => {
        console.log('✅ QuizManager found, applying fixes...');

        // 1. Override renderQuiz to use modern layout and create backup
        const originalRenderQuiz = window.QuizManager.prototype.renderQuiz;
        window.QuizManager.prototype.renderQuiz = function() {
            console.log('🎨 renderQuiz called');
            
            // Kiểm tra và tạo backup
            if (this.currentQuiz && this.currentQuiz.questions) {
                this._quizBackup = JSON.parse(JSON.stringify(this.currentQuiz));
                console.log('✅ Quiz backup created in renderQuiz');
            }

            // Sử dụng modern layout nếu có
            if (typeof this.renderQuizModern === 'function') {
                console.log('🎨 Using modern layout');
                this.renderQuizModern();
            } else {
                console.log('🎨 Using original layout');
                originalRenderQuiz.call(this);
            }
        };

        // 2. Add auto-restore function to all navigation methods
        function ensureQuizData(context) {
            if (!context.currentQuiz || !context.currentQuiz.questions) {
                console.warn('⚠️ currentQuiz is null, attempting restore...');
                
                // Try restore from backup
                if (context._quizBackup && context._quizBackup.questions) {
                    context.currentQuiz = JSON.parse(JSON.stringify(context._quizBackup));
                    console.log('✅ Restored from _quizBackup');
                    return true;
                }
                
                // Try restore from roomManager
                if (window.roomManager && window.roomManager.currentRoom && window.roomManager.currentRoom.quiz) {
                    const room = window.roomManager.currentRoom;
                    context.currentQuiz = {
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
                    context._quizBackup = JSON.parse(JSON.stringify(context.currentQuiz));
                    console.log('✅ Restored from roomManager');
                    return true;
                }
                
                console.error('❌ Cannot restore quiz data');
                return false;
            }
            return true;
        }

        // 3. Protect goToQuestion
        if (window.QuizManager.prototype.goToQuestion) {
            const originalGoToQuestion = window.QuizManager.prototype.goToQuestion;
            window.QuizManager.prototype.goToQuestion = function(index) {
                if (!ensureQuizData(this)) {
                    console.error('❌ Cannot go to question: quiz data unavailable');
                    return;
                }
                originalGoToQuestion.call(this, index);
            };
        }

        // 4. Protect nextQuestion
        if (window.QuizManager.prototype.nextQuestion) {
            const originalNextQuestion = window.QuizManager.prototype.nextQuestion;
            window.QuizManager.prototype.nextQuestion = function() {
                if (!ensureQuizData(this)) {
                    console.error('❌ Cannot go to next question: quiz data unavailable');
                    return;
                }
                originalNextQuestion.call(this);
            };
        }

        // 5. Protect previousQuestion
        if (window.QuizManager.prototype.previousQuestion) {
            const originalPreviousQuestion = window.QuizManager.prototype.previousQuestion;
            window.QuizManager.prototype.previousQuestion = function() {
                if (!ensureQuizData(this)) {
                    console.error('❌ Cannot go to previous question: quiz data unavailable');
                    return;
                }
                originalPreviousQuestion.call(this);
            };
        }

        // 6. Protect updateAnswer
        if (window.QuizManager.prototype.updateAnswer) {
            const originalUpdateAnswer = window.QuizManager.prototype.updateAnswer;
            window.QuizManager.prototype.updateAnswer = function(questionIndex, selectedAnswer) {
                if (!ensureQuizData(this)) {
                    console.error('❌ Cannot update answer: quiz data unavailable');
                    return;
                }
                originalUpdateAnswer.call(this, questionIndex, selectedAnswer);
            };
        }

        // 7. Protect updateAnswerModern
        if (window.QuizManager.prototype.updateAnswerModern) {
            const originalUpdateAnswerModern = window.QuizManager.prototype.updateAnswerModern;
            window.QuizManager.prototype.updateAnswerModern = function(questionIndex, selectedAnswer) {
                if (!ensureQuizData(this)) {
                    console.error('❌ Cannot update answer (modern): quiz data unavailable');
                    return;
                }
                originalUpdateAnswerModern.call(this, questionIndex, selectedAnswer);
            };
        }

        // 8. Protect renderQuestion
        if (window.QuizManager.prototype.renderQuestion) {
            const originalRenderQuestion = window.QuizManager.prototype.renderQuestion;
            window.QuizManager.prototype.renderQuestion = function(index) {
                if (!ensureQuizData(this)) {
                    return `
                        <div class="question-card-modern">
                            <div class="question-text-modern" style="text-align: center; padding: 40px;">
                                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #f59e0b; margin-bottom: 20px;"></i>
                                <h3>Lỗi tải câu hỏi</h3>
                                <p>Không thể tải câu hỏi. Vui lòng tải lại trang.</p>
                                <button class="btn-primary" onclick="location.reload()">
                                    <i class="fas fa-sync"></i>
                                    Tải lại trang
                                </button>
                            </div>
                        </div>
                    `;
                }
                return originalRenderQuestion.call(this, index);
            };
        }

        // 9. Add periodic backup refresh (every 5 seconds)
        setInterval(() => {
            if (window.quizManager && window.quizManager.currentQuiz && window.quizManager.currentQuiz.questions) {
                if (!window.quizManager._quizBackup || !window.quizManager._quizBackup.questions) {
                    window.quizManager._quizBackup = JSON.parse(JSON.stringify(window.quizManager.currentQuiz));
                    console.log('🔄 Backup refreshed');
                }
            }
        }, 5000);

        console.log('✅ Room Quiz Fix applied successfully!');
        console.log('📋 Protected methods: renderQuiz, goToQuestion, nextQuestion, previousQuestion, updateAnswer, updateAnswerModern, renderQuestion');
    });
})();
