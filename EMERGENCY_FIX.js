// ============================================================================
// EMERGENCY FIX - TẮT AUTO-REFRESH VÀ FIX CURRENTQUIZ NULL
// ============================================================================

(function() {
    console.log('🚨 EMERGENCY FIX LOADING...');
    
    // ============================================================================
    // FIX 1: TẮT AUTO-REFRESH ĐỂ TRÁNH 429 ERROR
    // ============================================================================
    const disableAutoRefresh = () => {
        if (window.roomManager) {
            // Tắt auto-refresh
            if (window.roomManager.leaderboardRefreshInterval) {
                clearInterval(window.roomManager.leaderboardRefreshInterval);
                window.roomManager.leaderboardRefreshInterval = null;
                console.log('✅ Auto-refresh DISABLED to prevent 429 error');
            }
            
            // Override startLeaderboardRefresh để không bật lại
            if (window.roomManager.startLeaderboardRefresh) {
                window.roomManager.startLeaderboardRefresh = function() {
                    console.log('⚠️ Auto-refresh is DISABLED');
                };
            }
            
            // Override refreshLeaderboard để không gọi
            if (window.roomManager.refreshLeaderboard) {
                const originalRefresh = window.roomManager.refreshLeaderboard;
                window.roomManager.refreshLeaderboard = async function(roomId) {
                    console.log('⚠️ Manual refresh only');
                    // Chỉ cho phép manual refresh
                    if (this._manualRefreshAllowed) {
                        return await originalRefresh.call(this, roomId);
                    }
                };
            }
            
            // Thêm manual refresh button
            if (window.roomManager.manualRefreshLeaderboard) {
                const originalManual = window.roomManager.manualRefreshLeaderboard;
                window.roomManager.manualRefreshLeaderboard = async function() {
                    this._manualRefreshAllowed = true;
                    await originalManual.call(this);
                    this._manualRefreshAllowed = false;
                };
            }
        }
    };
    
    // ============================================================================
    // FIX 2: BẢO VỆ CURRENTQUIZ KHỎI BỊ NULL
    // ============================================================================
    const protectCurrentQuiz = () => {
        if (!window.quizManager) return;
        
        // Backup currentQuiz
        let quizBackup = null;
        
        // Override setter để backup
        Object.defineProperty(window.quizManager, 'currentQuiz', {
            get: function() {
                return this._currentQuiz || quizBackup;
            },
            set: function(value) {
                if (value && value.questions && value.questions.length > 0) {
                    this._currentQuiz = value;
                    quizBackup = JSON.parse(JSON.stringify(value));
                    console.log('✅ Quiz backed up:', value.title);
                } else if (value === null && quizBackup) {
                    console.warn('⚠️ Attempted to set currentQuiz to null, restoring backup');
                    this._currentQuiz = quizBackup;
                } else {
                    this._currentQuiz = value;
                }
            },
            configurable: true
        });
        
        console.log('✅ currentQuiz protection enabled');
    };
    
    // ============================================================================
    // FIX 3: FIX updateAnswerModern
    // ============================================================================
    const fixUpdateAnswer = () => {
        if (!window.QuizManager || !window.QuizManager.prototype.updateAnswerModern) return;
        
        const originalUpdate = window.QuizManager.prototype.updateAnswerModern;
        
        window.QuizManager.prototype.updateAnswerModern = function(questionIndex, selectedAnswer) {
            // Kiểm tra currentQuiz
            if (!this.currentQuiz) {
                console.error('❌ currentQuiz is null, attempting to restore...');
                
                // Thử restore từ localStorage
                try {
                    const backup = localStorage.getItem('currentRoomQuiz');
                    if (backup) {
                        this.currentQuiz = JSON.parse(backup);
                        console.log('✅ Restored currentQuiz from localStorage');
                    }
                } catch (e) {
                    console.error('Failed to restore:', e);
                    return;
                }
            }
            
            // Gọi hàm gốc
            return originalUpdate.call(this, questionIndex, selectedAnswer);
        };
        
        console.log('✅ updateAnswerModern fixed');
    };
    
    // ============================================================================
    // FIX 4: GIẢM TẦN SUẤT REQUEST
    // ============================================================================
    const throttleSupabaseRequests = () => {
        if (!window.supabaseQuizManager || !window.supabaseQuizManager.supabase) return;
        
        const requestQueue = [];
        let isProcessing = false;
        let lastRequestTime = 0;
        const MIN_INTERVAL = 2000; // 2 giây giữa các request
        
        const processQueue = async () => {
            if (isProcessing || requestQueue.length === 0) return;
            
            const now = Date.now();
            const timeSinceLastRequest = now - lastRequestTime;
            
            if (timeSinceLastRequest < MIN_INTERVAL) {
                setTimeout(processQueue, MIN_INTERVAL - timeSinceLastRequest);
                return;
            }
            
            isProcessing = true;
            const request = requestQueue.shift();
            
            try {
                await request.execute();
                lastRequestTime = Date.now();
            } catch (error) {
                console.error('Request failed:', error);
            }
            
            isProcessing = false;
            
            if (requestQueue.length > 0) {
                setTimeout(processQueue, MIN_INTERVAL);
            }
        };
        
        // Wrap Supabase methods
        const originalFrom = window.supabaseQuizManager.supabase.from;
        window.supabaseQuizManager.supabase.from = function(table) {
            const query = originalFrom.call(this, table);
            
            // Wrap select, insert, update, delete
            ['select', 'insert', 'update', 'delete'].forEach(method => {
                const original = query[method];
                if (original) {
                    query[method] = function(...args) {
                        const result = original.apply(this, args);
                        
                        // Wrap execute methods
                        const wrapExecute = (obj, methodName) => {
                            const originalMethod = obj[methodName];
                            if (originalMethod) {
                                obj[methodName] = function(...executeArgs) {
                                    return new Promise((resolve, reject) => {
                                        requestQueue.push({
                                            execute: async () => {
                                                try {
                                                    const res = await originalMethod.apply(this, executeArgs);
                                                    resolve(res);
                                                } catch (err) {
                                                    reject(err);
                                                }
                                            }
                                        });
                                        processQueue();
                                    });
                                };
                            }
                        };
                        
                        wrapExecute(result, 'single');
                        wrapExecute(result, 'maybeSingle');
                        
                        return result;
                    };
                }
            });
            
            return query;
        };
        
        console.log('✅ Supabase request throttling enabled');
    };
    
    // ============================================================================
    // FIX 5: ERROR RECOVERY
    // ============================================================================
    const setupErrorRecovery = () => {
        window.addEventListener('error', (event) => {
            if (event.message && event.message.includes('currentQuiz')) {
                console.error('🚨 Quiz error detected, attempting recovery...');
                
                // Thử restore quiz
                if (window.quizManager) {
                    try {
                        const backup = localStorage.getItem('currentRoomQuiz');
                        if (backup) {
                            window.quizManager.currentQuiz = JSON.parse(backup);
                            console.log('✅ Quiz restored from backup');
                        }
                    } catch (e) {
                        console.error('Recovery failed:', e);
                    }
                }
            }
        });
        
        console.log('✅ Error recovery enabled');
    };
    
    // ============================================================================
    // APPLY ALL FIXES
    // ============================================================================
    const applyFixes = () => {
        console.log('🔧 Applying emergency fixes...');
        
        disableAutoRefresh();
        protectCurrentQuiz();
        fixUpdateAnswer();
        throttleSupabaseRequests();
        setupErrorRecovery();
        
        console.log('✅ All emergency fixes applied!');
        console.log('📝 Auto-refresh is DISABLED');
        console.log('📝 Use "Làm Mới" button to manually refresh');
    };
    
    // Wait for everything to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(applyFixes, 3000);
        });
    } else {
        setTimeout(applyFixes, 3000);
    }
    
})();
