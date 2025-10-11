// FINAL FIX FOR ROOM QUIZ - ULTIMATE SOLUTION
// This MUST be loaded LAST to ensure all protections work

(function() {
    console.log('🔧 [FINAL FIX] Loading Ultimate Room Quiz Protection...');

    // Wait for everything to be ready
    function waitForReady(callback) {
        const checkReady = () => {
            if (window.quizManager && 
                window.QuizManager && 
                window.QuizManager.prototype.renderQuizModern &&
                window.QuizManager.prototype.updateAnswerModern) {
                callback();
            } else {
                setTimeout(checkReady, 100);
            }
        };
        checkReady();
    }

    waitForReady(() => {
        console.log('✅ [FINAL FIX] All components ready, applying ultimate protection...');

        // CORE RESTORE FUNCTION - This is the heart of the fix
        function restoreQuizData(context) {
            // Check if quiz data exists
            if (context.currentQuiz && context.currentQuiz.questions && context.currentQuiz.questions.length > 0) {
                return true; // Data is good
            }

            console.warn('⚠️ [FINAL FIX] currentQuiz is missing, attempting restore...');

            // Priority 1: Restore from backup
            if (context._quizBackup && context._quizBackup.questions && context._quizBackup.questions.length > 0) {
                context.currentQuiz = JSON.parse(JSON.stringify(context._quizBackup));
                console.log('✅ [FINAL FIX] Restored from _quizBackup');
                return true;
            }

            // Priority 2: Restore from roomManager
            if (window.roomManager && window.roomManager.currentRoom) {
                const room = window.roomManager.currentRoom;
                if (room.quiz && room.quiz.questions && room.quiz.questions.length > 0) {
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
                    // Create backup immediately
                    context._quizBackup = JSON.parse(JSON.stringify(context.currentQuiz));
                    console.log('✅ [FINAL FIX] Restored from roomManager and created backup');
                    return true;
                }
            }

            console.error('❌ [FINAL FIX] Cannot restore quiz data - no valid source found');
            return false;
        }

        // WRAP ALL CRITICAL METHODS WITH PROTECTION
        const methodsToProtect = [
            'renderQuiz',
            'renderQuizModern',
            'goToQuestion',
            'nextQuestion',
            'previousQuestion',
            'updateAnswer',
            'updateAnswerModern',
            'renderQuestion',
            'updateProgressBar',
            'updateProgressBarModern',
            'updateNavigationButtons'
        ];

        methodsToProtect.forEach(methodName => {
            const original = window.QuizManager.prototype[methodName];
            if (typeof original === 'function') {
                window.QuizManager.prototype[methodName] = function(...args) {
                    // Always try to restore before executing
                    if (!restoreQuizData(this)) {
                        console.error(`❌ [FINAL FIX] Cannot execute ${methodName}: quiz data unavailable`);
                        
                        // For render methods, return error UI
                        if (methodName.includes('render') || methodName.includes('Render')) {
                            if (methodName === 'renderQuestion') {
                                return `
                                    <div class="question-card-modern">
                                        <div class="question-text-modern" style="text-align: center; padding: 40px;">
                                            <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #f59e0b; margin-bottom: 20px;"></i>
                                            <h3>Lỗi tải câu hỏi</h3>
                                            <p>Không thể tải câu hỏi. Vui lòng tải lại trang.</p>
                                            <button class="btn-primary" onclick="location.reload()" style="margin-top: 20px; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
                                                <i class="fas fa-sync"></i>
                                                Tải lại trang
                                            </button>
                                        </div>
                                    </div>
                                `;
                            }
                        }
                        return;
                    }

                    // Execute original method
                    try {
                        const result = original.apply(this, args);
                        
                        // After successful execution, ensure backup exists
                        if (this.currentQuiz && this.currentQuiz.questions) {
                            if (!this._quizBackup || !this._quizBackup.questions) {
                                this._quizBackup = JSON.parse(JSON.stringify(this.currentQuiz));
                                console.log(`✅ [FINAL FIX] Backup created after ${methodName}`);
                            }
                        }
                        
                        return result;
                    } catch (error) {
                        console.error(`❌ [FINAL FIX] Error in ${methodName}:`, error);
                        throw error;
                    }
                };
                console.log(`✅ [FINAL FIX] Protected: ${methodName}`);
            }
        });

        // PERIODIC BACKUP REFRESH - Every 3 seconds
        setInterval(() => {
            if (window.quizManager && 
                window.quizManager.currentQuiz && 
                window.quizManager.currentQuiz.questions &&
                window.quizManager.currentQuiz.questions.length > 0) {
                
                if (!window.quizManager._quizBackup || 
                    !window.quizManager._quizBackup.questions ||
                    window.quizManager._quizBackup.questions.length === 0) {
                    
                    window.quizManager._quizBackup = JSON.parse(JSON.stringify(window.quizManager.currentQuiz));
                    console.log('🔄 [FINAL FIX] Backup refreshed');
                }
            }
        }, 3000);

        // MONITOR currentQuiz changes
        if (window.quizManager) {
            let lastQuizState = null;
            setInterval(() => {
                const currentState = window.quizManager.currentQuiz ? 'exists' : 'null';
                if (currentState !== lastQuizState) {
                    console.log(`📊 [FINAL FIX] Quiz state changed: ${lastQuizState} → ${currentState}`);
                    if (currentState === 'null' && window.quizManager._quizBackup) {
                        console.warn('⚠️ [FINAL FIX] Quiz was cleared but backup exists - auto-restoring...');
                        window.quizManager.currentQuiz = JSON.parse(JSON.stringify(window.quizManager._quizBackup));
                        console.log('✅ [FINAL FIX] Auto-restored from backup');
                    }
                    lastQuizState = currentState;
                }
            }, 1000);
        }

        console.log('✅ [FINAL FIX] Ultimate protection applied successfully!');
        console.log('📋 [FINAL FIX] Protected methods:', methodsToProtect.length);
        console.log('🔄 [FINAL FIX] Auto-backup: Every 3 seconds');
        console.log('📊 [FINAL FIX] State monitor: Every 1 second');
    });
})();
