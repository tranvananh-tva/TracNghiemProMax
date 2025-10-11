// COMPLETE PROTECTION FOR ROOM QUIZ - FIX ALL NAVIGATION ISSUES
// Sửa lỗi: Cannot go to next question: currentQuiz is null
// Sửa lỗi: Cannot go to question: currentQuiz is null (script-modern.js)

(function() {
    console.log('🛡️ [COMPLETE PROTECTION] Loading Complete Room Quiz Protection...');

    // Đợi tất cả components sẵn sàng
    function waitForAll(callback) {
        const checkReady = () => {
            if (window.QuizManager && 
                window.QuizManager.prototype &&
                window.roomManager) {
                callback();
            } else {
                setTimeout(checkReady, 100);
            }
        };
        checkReady();
    }

    waitForAll(() => {
        console.log('✅ [COMPLETE PROTECTION] All components ready');

        // ============================================
        // GLOBAL QUIZ DATA STORE - KHÔNG BAO GIỜ MẤT
        // ============================================
        window._globalQuizStore = {
            currentQuiz: null,
            currentAnswers: {},
            currentQuestionIndex: 0,
            startTime: null,
            
            // Lưu quiz data
            save: function(quiz) {
                if (quiz && quiz.questions && quiz.questions.length > 0) {
                    this.currentQuiz = JSON.parse(JSON.stringify(quiz));
                    console.log('💾 [GLOBAL STORE] Quiz saved:', {
                        title: quiz.title,
                        questions: quiz.questions.length,
                        isRoomQuiz: quiz.isRoomQuiz
                    });
                }
            },
            
            // Lấy quiz data
            get: function() {
                return this.currentQuiz;
            },
            
            // Kiểm tra có quiz không
            has: function() {
                return this.currentQuiz && 
                       this.currentQuiz.questions && 
                       this.currentQuiz.questions.length > 0;
            },
            
            // Clear data
            clear: function() {
                this.currentQuiz = null;
                this.currentAnswers = {};
                this.currentQuestionIndex = 0;
                this.startTime = null;
                console.log('��️ [GLOBAL STORE] Cleared');
            }
        };

        // ============================================
        // RESTORE FUNCTION - KHÔI PHỤC QUIZ DATA
        // ============================================
        window.restoreQuizData = function(context) {
            // Nếu đã có currentQuiz hợp lệ, không cần restore
            if (context.currentQuiz && 
                context.currentQuiz.questions && 
                context.currentQuiz.questions.length > 0) {
                return true;
            }

            console.warn('⚠️ [RESTORE] currentQuiz is missing, attempting restore...');

            // Priority 1: Restore từ Global Store
            if (window._globalQuizStore.has()) {
                context.currentQuiz = JSON.parse(JSON.stringify(window._globalQuizStore.get()));
                console.log('✅ [RESTORE] Restored from Global Store');
                return true;
            }

            // Priority 2: Restore từ _quizBackup
            if (context._quizBackup && 
                context._quizBackup.questions && 
                context._quizBackup.questions.length > 0) {
                context.currentQuiz = JSON.parse(JSON.stringify(context._quizBackup));
                window._globalQuizStore.save(context.currentQuiz);
                console.log('✅ [RESTORE] Restored from _quizBackup');
                return true;
            }

            // Priority 3: Restore từ roomManager
            if (window.roomManager && 
                window.roomManager.currentRoom && 
                window.roomManager.currentRoom.quiz &&
                window.roomManager.currentRoom.quiz.questions &&
                window.roomManager.currentRoom.quiz.questions.length > 0) {
                
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
                
                // Lưu vào cả backup và global store
                context._quizBackup = JSON.parse(JSON.stringify(context.currentQuiz));
                window._globalQuizStore.save(context.currentQuiz);
                
                console.log('✅ [RESTORE] Restored from roomManager');
                return true;
            }

            console.error('❌ [RESTORE] Cannot restore - no valid source found');
            return false;
        };

        // ============================================
        // OVERRIDE ensureQuizData (từ script-modern.js)
        // ============================================
        window.ensureQuizData = function(context) {
            console.log('🔍 [ensureQuizData] Checking quiz data...');
            
            // Thử restore nếu cần
            if (!context.currentQuiz || !context.currentQuiz.questions || context.currentQuiz.questions.length === 0) {
                console.warn('⚠️ [ensureQuizData] Quiz data missing, attempting restore...');
                const restored = window.restoreQuizData(context);
                
                if (restored) {
                    console.log('✅ [ensureQuizData] Quiz data restored successfully');
                    return true;
                } else {
                    console.error('❌ [ensureQuizData] Failed to restore quiz data');
                    return false;
                }
            }
            
            console.log('✅ [ensureQuizData] Quiz data is valid');
            return true;
        };

        console.log('✅ [PROTECTION] ensureQuizData created/overridden');

        // ============================================
        // PROTECT ALL NAVIGATION METHODS
        // ============================================
        const navigationMethods = [
            'nextQuestion',
            'previousQuestion',
            'goToQuestion',
            'renderQuiz',
            'renderQuizModern',
            'renderQuestion',
            'updateAnswer',
            'updateAnswerModern',
            'submitQuiz',
            'updateProgressBar',
            'updateProgressBarModern'
        ];

        navigationMethods.forEach(methodName => {
            const original = window.QuizManager.prototype[methodName];
            if (typeof original === 'function') {
                window.QuizManager.prototype[methodName] = function(...args) {
                    // Luôn thử restore trước khi thực thi
                    if (!window.restoreQuizData(this)) {
                        console.error(`❌ [${methodName}] Cannot execute: quiz data unavailable`);
                        
                        // Hiển thị thông báo lỗi
                        if (this.showToast) {
                            this.showToast('❌ Lỗi: Mất dữ liệu bài thi. Đang thử khôi phục...', 'error');
                        }
                        
                        // Thử reload trang sau 2 giây
                        setTimeout(() => {
                            if (!window.restoreQuizData(this)) {
                                if (confirm('Không thể khôi phục dữ liệu bài thi.\n\nBạn có muốn tải lại trang không?\n\n(Lưu ý: Tiến trình làm bài sẽ bị mất)')) {
                                    window.location.reload();
                                }
                            }
                        }, 2000);
                        
                        return;
                    }

                    // Đảm bảo totalQuestions tồn tại
                    if (!this.currentQuiz.totalQuestions && this.currentQuiz.questions) {
                        this.currentQuiz.totalQuestions = this.currentQuiz.questions.length;
                    }

                    // Thực thi method gốc
                    try {
                        const result = original.apply(this, args);
                        
                        // Sau khi thực thi thành công, lưu lại vào global store
                        if (this.currentQuiz && this.currentQuiz.questions) {
                            window._globalQuizStore.save(this.currentQuiz);
                            
                            // Đảm bảo backup tồn tại
                            if (!this._quizBackup || !this._quizBackup.questions) {
                                this._quizBackup = JSON.parse(JSON.stringify(this.currentQuiz));
                            }
                        }
                        
                        return result;
                    } catch (error) {
                        console.error(`❌ [${methodName}] Error:`, error);
                        
                        // Thử restore và thực thi lại
                        if (window.restoreQuizData(this)) {
                            console.log(`🔄 [${methodName}] Retrying after restore...`);
                            try {
                                return original.apply(this, args);
                            } catch (retryError) {
                                console.error(`❌ [${methodName}] Retry failed:`, retryError);
                            }
                        }
                        
                        throw error;
                    }
                };
                
                console.log(`✅ [PROTECTION] Protected: ${methodName}`);
            }
        });

        // ============================================
        // OVERRIDE startQuizWithUserName - QUAN TRỌNG NHẤT
        // ============================================
        const originalStartQuizWithUserName = window.RoomManager.prototype.startQuizWithUserName;
        window.RoomManager.prototype.startQuizWithUserName = function(room, userName) {
            console.log('🎯 [START QUIZ] Starting with complete protection...');
            
            // Validate room data
            if (!room || !room.quiz || !room.quiz.questions || room.quiz.questions.length === 0) {
                console.error('❌ [START QUIZ] Invalid room data:', room);
                this.showToast('❌ Dữ liệu phòng thi không hợp lệ!', 'error');
                return;
            }

            console.log('📊 [START QUIZ] Room data:', {
                name: room.name,
                code: room.code,
                quizTitle: room.quiz.title,
                totalQuestions: room.quiz.questions.length
            });

            // Tạo quiz data đầy đủ
            const quizData = {
                id: room.quiz.id,
                title: room.quiz.title,
                description: room.quiz.description || '',
                questions: JSON.parse(JSON.stringify(room.quiz.questions)), // Deep copy
                totalQuestions: room.quiz.questions.length,
                isRoomQuiz: true,
                roomId: room.id,
                roomCode: room.code,
                roomName: room.name,
                userName: userName
            };

            // Lưu vào Global Store TRƯỚC
            window._globalQuizStore.save(quizData);
            console.log('💾 [START QUIZ] Saved to Global Store');

            // Đóng modal
            this.closeRoomDetailsModal();

            // Set current room
            this.currentRoom = {
                ...room,
                userName: userName
            };

            // Tăng attempts
            this.incrementRoomAttempts(room.id);

            // Đảm bảo quizManager tồn tại
            if (!window.quizManager) {
                console.error('❌ [START QUIZ] quizManager not found!');
                this.showToast('❌ Hệ thống chưa sẵn sàng. Vui lòng tải lại trang!', 'error');
                return;
            }

            // Set quiz data vào quizManager
            window.quizManager.currentQuiz = JSON.parse(JSON.stringify(quizData));
            window.quizManager._quizBackup = JSON.parse(JSON.stringify(quizData));
            window.quizManager.currentAnswers = {};
            window.quizManager.currentQuestionIndex = 0;

            console.log('✅ [START QUIZ] Quiz data set to quizManager');

            // Chuyển tab TRƯỚC
            if (typeof window.quizManager.switchTab === 'function') {
                window.quizManager.switchTab('quiz');
            }

            // Đợi tab switch xong, sau đó render
            setTimeout(() => {
                // Set lại quiz data (phòng trường hợp bị clear khi switch tab)
                window.quizManager.currentQuiz = JSON.parse(JSON.stringify(quizData));
                window.quizManager._quizBackup = JSON.parse(JSON.stringify(quizData));
                window.quizManager.currentAnswers = {};
                window.quizManager.currentQuestionIndex = 0;
                
                // Lưu lại vào Global Store
                window._globalQuizStore.save(quizData);
                
                console.log('✅ [START QUIZ] Quiz data re-set after tab switch');

                // Render quiz
                if (typeof window.quizManager.renderQuiz === 'function') {
                    try {
                        window.quizManager.renderQuiz();
                        console.log('✅ [START QUIZ] Quiz rendered successfully');
                        
                        if (this.showToast) {
                            this.showToast(`🚀 Chào ${userName}! Bắt đầu làm bài!`, 'success');
                        }
                    } catch (error) {
                        console.error('❌ [START QUIZ] Render error:', error);
                        this.showToast('❌ Lỗi khi hiển thị bài thi', 'error');
                    }
                }
            }, 300);
        };

        console.log('✅ [PROTECTION] startQuizWithUserName overridden');

        // ============================================
        // PERIODIC HEALTH CHECK - MỖI 2 GIÂY
        // ============================================
        setInterval(() => {
            if (window.quizManager && window.quizManager.currentQuiz) {
                // Kiểm tra currentQuiz có hợp lệ không
                if (!window.quizManager.currentQuiz.questions || 
                    window.quizManager.currentQuiz.questions.length === 0) {
                    
                    console.warn('⚠️ [HEALTH CHECK] currentQuiz invalid, restoring...');
                    window.restoreQuizData(window.quizManager);
                }
                
                // Đảm bảo totalQuestions tồn tại
                if (!window.quizManager.currentQuiz.totalQuestions && 
                    window.quizManager.currentQuiz.questions) {
                    window.quizManager.currentQuiz.totalQuestions = window.quizManager.currentQuiz.questions.length;
                }
                
                // Đảm bảo backup tồn tại
                if (!window.quizManager._quizBackup || !window.quizManager._quizBackup.questions) {
                    window.quizManager._quizBackup = JSON.parse(JSON.stringify(window.quizManager.currentQuiz));
                }
                
                // Đảm bảo Global Store có data
                if (!window._globalQuizStore.has()) {
                    window._globalQuizStore.save(window.quizManager.currentQuiz);
                }
            }
        }, 2000);

        console.log('✅ [HEALTH CHECK] Started (every 2 seconds)');

        // ============================================
        // MONITOR QUIZ STATE CHANGES
        // ============================================
        let lastQuizState = null;
        setInterval(() => {
            if (window.quizManager) {
                const currentState = window.quizManager.currentQuiz ? 'exists' : 'null';
                
                if (currentState !== lastQuizState) {
                    console.log(`📊 [STATE MONITOR] Quiz state: ${lastQuizState} → ${currentState}`);
                    
                    if (currentState === 'null') {
                        console.warn('⚠️ [STATE MONITOR] Quiz was cleared! Attempting restore...');
                        window.restoreQuizData(window.quizManager);
                    }
                    
                    lastQuizState = currentState;
                }
            }
        }, 1000);

        console.log('✅ [STATE MONITOR] Started (every 1 second)');

        // ============================================
        // WINDOW UNLOAD - LƯU TRƯỚC KHI ĐÓNG
        // ============================================
        window.addEventListener('beforeunload', () => {
            if (window.quizManager && window.quizManager.currentQuiz) {
                window._globalQuizStore.save(window.quizManager.currentQuiz);
                console.log('💾 [UNLOAD] Quiz saved before page close');
            }
        });

        // ============================================
        // HOÀN TẤT
        // ============================================
        console.log('✅ [COMPLETE PROTECTION] All protections applied!');
        console.log('📋 [COMPLETE PROTECTION] Summary:');
        console.log('  ✓ Global Quiz Store created');
        console.log('  ✓ Restore function ready (global)');
        console.log('  ✓ ensureQuizData created/overridden');
        console.log(`  ✓ ${navigationMethods.length} methods protected`);
        console.log('  ✓ startQuizWithUserName overridden');
        console.log('  ✓ Health check running (2s)');
        console.log('  ✓ State monitor running (1s)');
        console.log('  ✓ Unload handler registered');
    });
})();
