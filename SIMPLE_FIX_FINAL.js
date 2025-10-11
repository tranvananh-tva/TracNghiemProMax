// ============================================================================
// SIMPLE FIX - LOẠI BỎ TẤT CẢ CODE PHỨC TẠP
// ============================================================================
// Chỉ giữ lại những gì cần thiết nhất
// ============================================================================

(function() {
    console.log('🔧 SIMPLE FIX LOADING...');
    
    // Đợi tất cả load xong
    const waitForReady = setInterval(() => {
        if (window.quizManager && window.roomManager && window.supabaseQuizManager) {
            clearInterval(waitForReady);
            applySimpleFix();
        }
    }, 500);
    
    function applySimpleFix() {
        console.log('✅ Managers ready, applying simple fix...');
        
        // ============================================================================
        // FIX 1: ĐẢM BẢO LƯU KẾT QUẢ VÀO LEADERBOARD
        // ============================================================================
        
        // Override submitQuiz để FORCE lưu kết quả
        if (window.QuizManager && window.QuizManager.prototype.submitQuiz) {
            const originalSubmit = window.QuizManager.prototype.submitQuiz;
            
            window.QuizManager.prototype.submitQuiz = function() {
                console.log('📝 submitQuiz called');
                
                // Lưu quiz data trước khi submit
                const quizBackup = this.currentQuiz ? JSON.parse(JSON.stringify(this.currentQuiz)) : null;
                
                // Gọi hàm gốc
                originalSubmit.call(this);
                
                // Đợi 2 giây rồi FORCE lưu kết quả
                setTimeout(() => {
                    console.log('🔍 Checking room quiz...');
                    
                    const quiz = quizBackup || this.currentQuiz;
                    const results = this.currentResults;
                    
                    console.log('Quiz:', quiz);
                    console.log('Results:', results);
                    
                    if (quiz && quiz.isRoomQuiz && quiz.roomId && quiz.userName && results) {
                        console.log('✅ This is a room quiz, saving to leaderboard...');
                        
                        forceSaveToLeaderboard(quiz.roomId, {
                            userName: quiz.userName,
                            score: results.score,
                            correctCount: results.correctCount,
                            totalQuestions: results.totalQuestions,
                            totalTime: results.totalTime
                        });
                    } else {
                        console.warn('⚠️ Not a room quiz or missing data');
                        console.warn('- isRoomQuiz:', quiz?.isRoomQuiz);
                        console.warn('- roomId:', quiz?.roomId);
                        console.warn('- userName:', quiz?.userName);
                        console.warn('- results:', results);
                    }
                }, 2000);
            };
            
            console.log('✅ submitQuiz override applied');
        }
        
        // ============================================================================
        // FIX 2: HÀM LƯU KẾT QUẢ ĐƠN GIẢN
        // ============================================================================
        
        async function forceSaveToLeaderboard(roomId, result) {
            console.log('💾 forceSaveToLeaderboard called');
            console.log('Room ID:', roomId);
            console.log('Result:', result);
            
            try {
                // Validate
                if (!roomId || !result || !result.userName) {
                    console.error('❌ Invalid data');
                    return;
                }
                
                // Check Supabase
                if (!window.supabaseQuizManager || !window.supabaseQuizManager.supabase) {
                    console.error('❌ Supabase not available');
                    alert('Lỗi: Không thể kết nối Supabase');
                    return;
                }
                
                const supabase = window.supabaseQuizManager.supabase;
                
                // Tạo entry
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
                console.log('Fetching current data...');
                const { data: currentData, error: fetchError } = await supabase
                    .from('exam_rooms')
                    .select('leaderboard, attempts')
                    .eq('id', roomId)
                    .single();
                
                if (fetchError) {
                    console.error('❌ Fetch error:', fetchError);
                    alert('Lỗi khi lấy dữ liệu: ' + fetchError.message);
                    return;
                }
                
                console.log('Current data:', currentData);
                
                if (!currentData) {
                    console.error('❌ No data found');
                    alert('Không tìm thấy phòng thi');
                    return;
                }
                
                // Cập nhật leaderboard
                let leaderboard = currentData.leaderboard || [];
                console.log('Current leaderboard:', leaderboard);
                
                // Tìm user
                const existingIndex = leaderboard.findIndex(e => e.userName === entry.userName);
                
                if (existingIndex >= 0) {
                    console.log('User exists, updating...');
                    if (entry.score > leaderboard[existingIndex].score) {
                        leaderboard[existingIndex] = entry;
                        console.log('Score improved');
                    } else {
                        console.log('Score not improved, keeping old');
                    }
                } else {
                    console.log('New user, adding...');
                    leaderboard.push(entry);
                }
                
                // Tính participants
                const uniqueUsers = new Set(leaderboard.map(e => e.userName));
                const participants = uniqueUsers.size;
                const attempts = (currentData.attempts || 0) + 1;
                
                console.log('New leaderboard:', leaderboard);
                console.log('Participants:', participants);
                console.log('Attempts:', attempts);
                
                // Lưu vào database
                console.log('Saving to database...');
                const { error: updateError } = await supabase
                    .from('exam_rooms')
                    .update({
                        leaderboard: leaderboard,
                        participants: participants,
                        attempts: attempts
                    })
                    .eq('id', roomId);
                
                if (updateError) {
                    console.error('❌ Update error:', updateError);
                    alert('Lỗi khi lưu: ' + updateError.message);
                    return;
                }
                
                console.log('✅ SAVED SUCCESSFULLY!');
                alert('✅ Đã lưu kết quả vào bảng xếp hạng!\n\nNgười tạo phòng cần:\n1. Đóng modal "Xem chi tiết"\n2. Mở lại để thấy kết quả mới');
                
            } catch (error) {
                console.error('❌ Exception:', error);
                alert('Lỗi: ' + error.message);
            }
        }
        
        // ============================================================================
        // FIX 3: ĐẢM BẢO QUIZ DATA KHÔNG BỊ MẤT
        // ============================================================================
        
        if (window.roomManager && window.roomManager.startQuizWithUserName) {
            const originalStart = window.roomManager.startQuizWithUserName;
            
            window.roomManager.startQuizWithUserName = function(room, userName) {
                console.log('🎯 startQuizWithUserName called');
                console.log('Room:', room);
                console.log('User:', userName);
                
                // Gọi hàm gốc
                const result = originalStart.call(this, room, userName);
                
                // Verify sau 1 giây
                setTimeout(() => {
                    console.log('🔍 Verifying quiz data...');
                    
                    if (!window.quizManager.currentQuiz) {
                        console.error('❌ currentQuiz is null!');
                        alert('Lỗi: Không thể load bài thi. Vui lòng thử lại!');
                        return;
                    }
                    
                    // Đảm bảo có đủ thông tin
                    if (!window.quizManager.currentQuiz.isRoomQuiz) {
                        window.quizManager.currentQuiz.isRoomQuiz = true;
                    }
                    if (!window.quizManager.currentQuiz.roomId) {
                        window.quizManager.currentQuiz.roomId = room.id;
                    }
                    if (!window.quizManager.currentQuiz.userName) {
                        window.quizManager.currentQuiz.userName = userName;
                    }
                    
                    console.log('✅ Quiz data verified:', {
                        isRoomQuiz: window.quizManager.currentQuiz.isRoomQuiz,
                        roomId: window.quizManager.currentQuiz.roomId,
                        userName: window.quizManager.currentQuiz.userName
                    });
                    
                    // Backup
                    localStorage.setItem('currentRoomQuiz', JSON.stringify(window.quizManager.currentQuiz));
                    console.log('✅ Quiz backed up to localStorage');
                    
                }, 1000);
                
                return result;
            };
            
            console.log('✅ startQuizWithUserName override applied');
        }
        
        // ============================================================================
        // FIX 4: FIX updateAnswerModern
        // ============================================================================
        
        if (window.QuizManager && window.QuizManager.prototype.updateAnswerModern) {
            const originalUpdate = window.QuizManager.prototype.updateAnswerModern;
            
            window.QuizManager.prototype.updateAnswerModern = function(questionIndex, selectedAnswer) {
                // Kiểm tra currentQuiz
                if (!this.currentQuiz) {
                    console.error('❌ currentQuiz is null, trying to restore...');
                    
                    // Thử restore
                    try {
                        const backup = localStorage.getItem('currentRoomQuiz');
                        if (backup) {
                            this.currentQuiz = JSON.parse(backup);
                            console.log('✅ Restored from localStorage');
                        } else {
                            console.error('❌ No backup found');
                            return;
                        }
                    } catch (e) {
                        console.error('❌ Restore failed:', e);
                        return;
                    }
                }
                
                // Gọi hàm gốc
                return originalUpdate.call(this, questionIndex, selectedAnswer);
            };
            
            console.log('✅ updateAnswerModern fixed');
        }
        
        console.log('🎉 SIMPLE FIX APPLIED!');
        console.log('📝 Khi nộp bài, kết quả sẽ được lưu tự động');
        console.log('📝 Người tạo phòng cần đóng/mở lại modal để thấy kết quả');
    }
})();
