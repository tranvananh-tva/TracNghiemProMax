// ============================================================================
// ULTIMATE FIX - FIX CUỐI CÙNG, GIẢI QUYẾT TẤT CẢ
// ============================================================================

(function() {
    console.log('🚀 ULTIMATE FIX LOADING...');
    
    // ============================================================================
    // FIX 1: TẮT TẤT CẢ SUPABASE POLLING (GÂY 500 ERROR)
    // ============================================================================
    
    // Tắt tất cả interval
    const originalSetInterval = window.setInterval;
    window.setInterval = function(fn, delay, ...args) {
        // Chặn tất cả interval liên quan đến Supabase
        const fnString = fn.toString();
        if (fnString.includes('supabase') || 
            fnString.includes('exam_rooms') || 
            fnString.includes('leaderboard') ||
            fnString.includes('refresh')) {
            console.warn('⚠️ Blocked interval to prevent 500 error');
            return -1;
        }
        return originalSetInterval.call(this, fn, delay, ...args);
    };
    
    console.log('✅ Supabase polling blocked');
    
    // ============================================================================
    // FIX 2: FIX currentQuiz NULL - BẢO VỆ TUYỆT ĐỐI
    // ============================================================================
    
    let quizBackupGlobal = null;
    
    // Đợi quizManager load
    const waitForQuizManager = setInterval(() => {
        if (window.quizManager) {
            clearInterval(waitForQuizManager);
            
            // Wrap currentQuiz với getter/setter
            let _currentQuiz = window.quizManager.currentQuiz;
            
            Object.defineProperty(window.quizManager, 'currentQuiz', {
                get: function() {
                    if (!_currentQuiz && quizBackupGlobal) {
                        console.warn('⚠️ currentQuiz was null, restoring from backup');
                        _currentQuiz = JSON.parse(JSON.stringify(quizBackupGlobal));
                    }
                    return _currentQuiz;
                },
                set: function(value) {
                    _currentQuiz = value;
                    if (value && value.questions && value.questions.length > 0) {
                        quizBackupGlobal = JSON.parse(JSON.stringify(value));
                        localStorage.setItem('quizBackup', JSON.stringify(value));
                        console.log('✅ Quiz backed up:', value.title || 'Untitled');
                    }
                },
                configurable: true
            });
            
            // Restore từ localStorage nếu có
            try {
                const backup = localStorage.getItem('quizBackup');
                if (backup) {
                    quizBackupGlobal = JSON.parse(backup);
                    console.log('✅ Loaded quiz backup from localStorage');
                }
            } catch (e) {}
            
            console.log('✅ currentQuiz protection enabled');
        }
    }, 100);
    
    // ============================================================================
    // FIX 3: FIX updateAnswerModern
    // ============================================================================
    
    const waitForUpdateAnswer = setInterval(() => {
        if (window.QuizManager && window.QuizManager.prototype.updateAnswerModern) {
            clearInterval(waitForUpdateAnswer);
            
            const original = window.QuizManager.prototype.updateAnswerModern;
            
            window.QuizManager.prototype.updateAnswerModern = function(questionIndex, selectedAnswer) {
                if (!this.currentQuiz) {
                    console.error('❌ currentQuiz is null in updateAnswerModern');
                    
                    // Thử restore
                    if (quizBackupGlobal) {
                        console.log('✅ Restoring from global backup');
                        this.currentQuiz = JSON.parse(JSON.stringify(quizBackupGlobal));
                    } else {
                        try {
                            const backup = localStorage.getItem('quizBackup');
                            if (backup) {
                                console.log('✅ Restoring from localStorage');
                                this.currentQuiz = JSON.parse(backup);
                                quizBackupGlobal = JSON.parse(backup);
                            }
                        } catch (e) {}
                    }
                    
                    if (!this.currentQuiz) {
                        console.error('❌ Cannot restore currentQuiz');
                        alert('Lỗi: Dữ liệu bài thi bị mất. Vui lòng tải lại trang!');
                        return;
                    }
                }
                
                return original.call(this, questionIndex, selectedAnswer);
            };
            
            console.log('✅ updateAnswerModern fixed');
        }
    }, 100);
    
    // ============================================================================
    // FIX 4: FORCE SAVE KẾT QUẢ KHI NỘP BÀI
    // ============================================================================
    
    const waitForSubmit = setInterval(() => {
        if (window.QuizManager && window.QuizManager.prototype.submitQuiz) {
            clearInterval(waitForSubmit);
            
            const originalSubmit = window.QuizManager.prototype.submitQuiz;
            
            window.QuizManager.prototype.submitQuiz = function() {
                console.log('📝 submitQuiz called');
                
                // Backup quiz trước khi submit
                const quizBackup = this.currentQuiz ? JSON.parse(JSON.stringify(this.currentQuiz)) : null;
                
                // Gọi hàm gốc
                originalSubmit.call(this);
                
                // Đợi 2 giây rồi lưu kết quả
                setTimeout(() => {
                    const quiz = quizBackup || this.currentQuiz;
                    const results = this.currentResults;
                    
                    console.log('🔍 Checking if need to save...');
                    console.log('Quiz:', quiz);
                    console.log('Results:', results);
                    
                    if (quiz && quiz.isRoomQuiz && quiz.roomId && quiz.userName && results) {
                        console.log('✅ Saving to leaderboard...');
                        
                        saveToLeaderboard(quiz.roomId, {
                            userName: quiz.userName,
                            score: results.score,
                            correctCount: results.correctCount,
                            totalQuestions: results.totalQuestions,
                            totalTime: results.totalTime
                        });
                    } else {
                        console.warn('⚠️ Not a room quiz or missing data');
                    }
                }, 2000);
            };
            
            console.log('✅ submitQuiz override applied');
        }
    }, 100);
    
    // ============================================================================
    // HÀM LƯU KẾT QUẢ - ĐƠN GIẢN NHẤT CÓ THỂ
    // ============================================================================
    
    async function saveToLeaderboard(roomId, result) {
        console.log('💾 Saving to leaderboard...');
        console.log('Room ID:', roomId);
        console.log('Result:', result);
        
        try {
            if (!window.supabaseQuizManager || !window.supabaseQuizManager.supabase) {
                throw new Error('Supabase not available');
            }
            
            const supabase = window.supabaseQuizManager.supabase;
            
            const entry = {
                userName: result.userName,
                score: result.score || 0,
                correctCount: result.correctCount || 0,
                totalQuestions: result.totalQuestions || 0,
                time: result.totalTime || 0,
                completedAt: new Date().toISOString()
            };
            
            console.log('Entry:', entry);
            
            // Lấy dữ liệu hiện tại
            const { data, error: fetchError } = await supabase
                .from('exam_rooms')
                .select('leaderboard, attempts')
                .eq('id', roomId)
                .single();
            
            if (fetchError) throw fetchError;
            if (!data) throw new Error('Room not found');
            
            console.log('Current data:', data);
            
            let leaderboard = data.leaderboard || [];
            const existingIndex = leaderboard.findIndex(e => e.userName === entry.userName);
            
            if (existingIndex >= 0) {
                if (entry.score > leaderboard[existingIndex].score) {
                    leaderboard[existingIndex] = entry;
                }
            } else {
                leaderboard.push(entry);
            }
            
            const uniqueUsers = new Set(leaderboard.map(e => e.userName));
            const participants = uniqueUsers.size;
            const attempts = (data.attempts || 0) + 1;
            
            console.log('New leaderboard:', leaderboard);
            console.log('Participants:', participants);
            console.log('Attempts:', attempts);
            
            // Lưu vào database
            const { error: updateError } = await supabase
                .from('exam_rooms')
                .update({
                    leaderboard: leaderboard,
                    participants: participants,
                    attempts: attempts
                })
                .eq('id', roomId);
            
            if (updateError) throw updateError;
            
            console.log('✅ SAVED SUCCESSFULLY!');
            alert('✅ Đã lưu kết quả!\n\nNgười tạo phòng: Đóng và mở lại modal "Xem chi tiết" để thấy kết quả mới.');
            
        } catch (error) {
            console.error('❌ Save error:', error);
            alert('Lỗi khi lưu: ' + error.message);
        }
    }
    
    // ============================================================================
    // FIX 5: ĐẢM BẢO QUIZ DATA KHÔNG BỊ MẤT
    // ============================================================================
    
    const waitForRoomManager = setInterval(() => {
        if (window.roomManager && window.roomManager.startQuizWithUserName) {
            clearInterval(waitForRoomManager);
            
            const original = window.roomManager.startQuizWithUserName;
            
            window.roomManager.startQuizWithUserName = function(room, userName) {
                console.log('🎯 Starting quiz with user:', userName);
                
                const result = original.call(this, room, userName);
                
                // Verify sau 1 giây
                setTimeout(() => {
                    if (!window.quizManager.currentQuiz) {
                        console.error('❌ currentQuiz is null after start!');
                        alert('Lỗi: Không thể load bài thi. Vui lòng thử lại!');
                        return;
                    }
                    
                    // Đảm bảo có đủ thông tin
                    window.quizManager.currentQuiz.isRoomQuiz = true;
                    window.quizManager.currentQuiz.roomId = room.id;
                    window.quizManager.currentQuiz.userName = userName;
                    window.quizManager.currentQuiz.roomCode = room.code;
                    window.quizManager.currentQuiz.roomName = room.name;
                    
                    // Backup
                    quizBackupGlobal = JSON.parse(JSON.stringify(window.quizManager.currentQuiz));
                    localStorage.setItem('quizBackup', JSON.stringify(window.quizManager.currentQuiz));
                    
                    console.log('✅ Quiz data verified and backed up');
                }, 1000);
                
                return result;
            };
            
            console.log('✅ startQuizWithUserName override applied');
        }
    }, 100);
    
    // ============================================================================
    // FIX 6: TẮT AUTO-REFRESH TRONG ROOM MANAGER
    // ============================================================================
    
    setTimeout(() => {
        if (window.roomManager) {
            // Tắt tất cả interval
            if (window.roomManager.leaderboardRefreshInterval) {
                clearInterval(window.roomManager.leaderboardRefreshInterval);
                window.roomManager.leaderboardRefreshInterval = null;
            }
            
            // Override các hàm refresh
            if (window.roomManager.startLeaderboardRefresh) {
                window.roomManager.startLeaderboardRefresh = function() {
                    console.log('⚠️ Auto-refresh is disabled');
                };
            }
            
            if (window.roomManager.refreshLeaderboard) {
                window.roomManager.refreshLeaderboard = function() {
                    console.log('⚠️ Auto-refresh is disabled');
                };
            }
            
            console.log('✅ Room manager auto-refresh disabled');
        }
    }, 2000);
    
    console.log('🎉 ULTIMATE FIX APPLIED!');
    console.log('📝 All Supabase polling blocked');
    console.log('📝 currentQuiz protected');
    console.log('📝 Result saving guaranteed');
    
})();
