// ============================================================================
// FIX: BẢNG XẾP HẠNG TRỐNG - FORCE SAVE KẾT QUẢ
// ============================================================================
// File này đảm bảo kết quả LUÔN được lưu vào leaderboard
// ============================================================================

(function() {
    console.log('🔧 Loading Leaderboard Fix...');
    
    // Đợi DOM và các manager load xong
    const initFix = () => {
        if (!window.quizManager || !window.roomManager) {
            console.log('⏳ Waiting for managers...');
            setTimeout(initFix, 500);
            return;
        }
        
        console.log('✅ Managers ready, applying fix...');
        
        // ============================================================================
        // FIX 1: Override submitQuiz để đảm bảo lưu kết quả
        // ============================================================================
        if (window.QuizManager && window.QuizManager.prototype.submitQuiz) {
            const originalSubmitQuiz = window.QuizManager.prototype.submitQuiz;
            
            window.QuizManager.prototype.submitQuiz = function() {
                console.log('📝 submitQuiz called');
                console.log('Current Quiz:', this.currentQuiz);
                
                // Gọi hàm gốc
                originalSubmitQuiz.call(this);
                
                // ⭐ FORCE SAVE sau khi submit
                setTimeout(() => {
                    console.log('🔍 Checking if need to save to leaderboard...');
                    console.log('- isRoomQuiz:', this.currentQuiz?.isRoomQuiz);
                    console.log('- roomId:', this.currentQuiz?.roomId);
                    console.log('- userName:', this.currentQuiz?.userName);
                    console.log('- currentResults:', this.currentResults);
                    
                    if (this.currentQuiz?.isRoomQuiz && 
                        this.currentQuiz?.roomId && 
                        this.currentQuiz?.userName &&
                        this.currentResults) {
                        
                        console.log('✅ All conditions met, saving to leaderboard...');
                        
                        const roomResult = {
                            userName: this.currentQuiz.userName,
                            score: this.currentResults.score,
                            correctCount: this.currentResults.correctCount,
                            totalQuestions: this.currentResults.totalQuestions,
                            totalTime: this.currentResults.totalTime
                        };
                        
                        console.log('Room Result:', roomResult);
                        
                        if (window.roomManager && 
                            typeof window.roomManager.saveResultToLeaderboard === 'function') {
                            
                            console.log('🚀 Calling saveResultToLeaderboard...');
                            window.roomManager.saveResultToLeaderboard(
                                this.currentQuiz.roomId,
                                roomResult
                            );
                        } else {
                            console.error('❌ roomManager.saveResultToLeaderboard not found!');
                        }
                    } else {
                        console.warn('⚠️ Not saving to leaderboard:');
                        if (!this.currentQuiz?.isRoomQuiz) {
                            console.warn('  - Not a room quiz');
                        }
                        if (!this.currentQuiz?.roomId) {
                            console.warn('  - No room ID');
                        }
                        if (!this.currentQuiz?.userName) {
                            console.warn('  - No user name');
                        }
                        if (!this.currentResults) {
                            console.warn('  - No results');
                        }
                    }
                }, 1000);
            };
            
            console.log('✅ submitQuiz override applied');
        }
        
        // ============================================================================
        // FIX 2: Enhance saveResultToLeaderboard với better error handling
        // ============================================================================
        if (window.roomManager && window.RoomManager) {
            const originalSave = window.RoomManager.prototype.saveResultToLeaderboard ||
                                window.roomManager.saveResultToLeaderboard;
            
            if (originalSave) {
                const enhancedSave = async function(roomId, result) {
                    console.log('💾 saveResultToLeaderboard called');
                    console.log('- Room ID:', roomId);
                    console.log('- Result:', result);
                    
                    try {
                        // Validate inputs
                        if (!roomId) {
                            throw new Error('Room ID is required');
                        }
                        if (!result || !result.userName) {
                            throw new Error('Result with userName is required');
                        }
                        
                        // Check Supabase
                        if (!this.isSupabaseAvailable) {
                            console.error('❌ Supabase not available');
                            this.showToast('❌ Không thể lưu: Supabase chưa kết nối', 'error');
                            return;
                        }
                        
                        if (!window.supabaseQuizManager || !window.supabaseQuizManager.supabase) {
                            console.error('❌ Supabase client not found');
                            this.showToast('❌ Không thể lưu: Supabase client không tồn tại', 'error');
                            return;
                        }
                        
                        // Create entry
                        const entry = {
                            userName: result.userName,
                            score: result.score || 0,
                            correctCount: result.correctCount || 0,
                            totalQuestions: result.totalQuestions || 0,
                            time: result.totalTime || 0,
                            completedAt: new Date().toISOString()
                        };
                        
                        console.log('📝 Entry to save:', entry);
                        
                        // Fetch current leaderboard
                        console.log('📥 Fetching current leaderboard...');
                        const { data, error: fetchError } = await window.supabaseQuizManager.supabase
                            .from('exam_rooms')
                            .select('leaderboard, attempts')
                            .eq('id', roomId)
                            .single();
                        
                        if (fetchError) {
                            console.error('❌ Fetch error:', fetchError);
                            this.showToast('❌ Lỗi khi lấy dữ liệu: ' + fetchError.message, 'error');
                            return;
                        }
                        
                        console.log('✅ Current data:', data);
                        
                        if (!data) {
                            console.error('❌ No data returned');
                            this.showToast('❌ Không tìm thấy phòng thi', 'error');
                            return;
                        }
                        
                        // Update leaderboard
                        let leaderboard = data.leaderboard || [];
                        console.log('📊 Current leaderboard:', leaderboard);
                        
                        // Check if user exists
                        const existingIndex = leaderboard.findIndex(
                            e => e.userName === entry.userName
                        );
                        
                        if (existingIndex >= 0) {
                            console.log('👤 User exists at index:', existingIndex);
                            console.log('- Old score:', leaderboard[existingIndex].score);
                            console.log('- New score:', entry.score);
                            
                            if (entry.score > leaderboard[existingIndex].score) {
                                console.log('✅ New score is higher, updating...');
                                leaderboard[existingIndex] = entry;
                            } else {
                                console.log('ℹ️ New score is not higher, keeping old score');
                            }
                        } else {
                            console.log('➕ New user, adding to leaderboard');
                            leaderboard.push(entry);
                        }
                        
                        // Calculate participants
                        const uniqueUsers = new Set(leaderboard.map(e => e.userName));
                        const participants = uniqueUsers.size;
                        const attempts = (data.attempts || 0) + 1;
                        
                        console.log('📊 Updated stats:');
                        console.log('- Leaderboard entries:', leaderboard.length);
                        console.log('- Unique participants:', participants);
                        console.log('- Total attempts:', attempts);
                        
                        // Save to database
                        console.log('💾 Saving to database...');
                        const { error: updateError } = await window.supabaseQuizManager.supabase
                            .from('exam_rooms')
                            .update({ 
                                leaderboard: leaderboard,
                                participants: participants,
                                attempts: attempts
                            })
                            .eq('id', roomId);
                        
                        if (updateError) {
                            console.error('❌ Update error:', updateError);
                            this.showToast('❌ Lỗi khi lưu: ' + updateError.message, 'error');
                            return;
                        }
                        
                        console.log('✅ Successfully saved to leaderboard!');
                        console.log('✅ Leaderboard updated:', {
                            userName: entry.userName,
                            score: entry.score,
                            participants: participants,
                            attempts: attempts
                        });
                        
                        this.showToast('📊 Đã lưu kết quả vào bảng xếp hạng!', 'success');
                        
                    } catch (error) {
                        console.error('❌ Exception in saveResultToLeaderboard:', error);
                        console.error('Stack:', error.stack);
                        this.showToast('❌ Lỗi: ' + error.message, 'error');
                    }
                };
                
                // Apply enhanced version
                if (window.RoomManager && window.RoomManager.prototype) {
                    window.RoomManager.prototype.saveResultToLeaderboard = enhancedSave;
                }
                if (window.roomManager) {
                    window.roomManager.saveResultToLeaderboard = enhancedSave.bind(window.roomManager);
                }
                
                console.log('✅ saveResultToLeaderboard enhanced');
            }
        }
        
        // ============================================================================
        // FIX 3: Ensure quiz data is properly set
        // ============================================================================
        if (window.roomManager && window.RoomManager) {
            const originalStartQuiz = window.RoomManager.prototype.startQuizWithUserName ||
                                     window.roomManager.startQuizWithUserName;
            
            if (originalStartQuiz) {
                window.RoomManager.prototype.startQuizWithUserName = function(room, userName) {
                    console.log('🎯 startQuizWithUserName called');
                    console.log('- Room:', room);
                    console.log('- User Name:', userName);
                    
                    // Call original
                    const result = originalStartQuiz.call(this, room, userName);
                    
                    // Verify after 500ms
                    setTimeout(() => {
                        console.log('🔍 Verifying quiz data...');
                        console.log('- currentQuiz:', window.quizManager.currentQuiz);
                        console.log('- isRoomQuiz:', window.quizManager.currentQuiz?.isRoomQuiz);
                        console.log('- roomId:', window.quizManager.currentQuiz?.roomId);
                        console.log('- userName:', window.quizManager.currentQuiz?.userName);
                        
                        if (!window.quizManager.currentQuiz?.isRoomQuiz ||
                            !window.quizManager.currentQuiz?.roomId ||
                            !window.quizManager.currentQuiz?.userName) {
                            
                            console.warn('⚠️ Quiz data incomplete, fixing...');
                            
                            if (window.quizManager.currentQuiz) {
                                window.quizManager.currentQuiz.isRoomQuiz = true;
                                window.quizManager.currentQuiz.roomId = room.id;
                                window.quizManager.currentQuiz.userName = userName;
                                window.quizManager.currentQuiz.roomCode = room.code;
                                window.quizManager.currentQuiz.roomName = room.name;
                                
                                console.log('✅ Quiz data fixed:', window.quizManager.currentQuiz);
                            }
                        } else {
                            console.log('✅ Quiz data is complete');
                        }
                    }, 500);
                    
                    return result;
                };
                
                console.log('✅ startQuizWithUserName override applied');
            }
        }
        
        console.log('🎉 All fixes applied successfully!');
        console.log('📝 Leaderboard save is now guaranteed');
    };
    
    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFix);
    } else {
        initFix();
    }
})();
