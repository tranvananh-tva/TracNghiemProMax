// ROOM QUIZ VALIDATION & UPGRADE
// Đảm bảo quiz được tải lên phòng có đầy đủ tất cả câu hỏi
// Đảm bảo người dùng từ thiết bị khác nhận đủ câu hỏi khi nhập mã phòng

(function() {
    console.log('🔒 [ROOM VALIDATION] Loading Room Quiz Validation & Upgrade...');

    // Đợi RoomManager sẵn sàng
    function waitForRoomManager(callback) {
        const checkReady = () => {
            if (window.RoomManager && window.RoomManager.prototype) {
                callback();
            } else {
                setTimeout(checkReady, 100);
            }
        };
        checkReady();
    }

    waitForRoomManager(() => {
        console.log('✅ [ROOM VALIDATION] RoomManager ready, applying upgrades...');

        // ============================================
        // 1. NÂNG CẤP: VALIDATE QUIZ KHI TẠO PHÒNG
        // ============================================
        const originalCreateRoom = window.RoomManager.prototype.createRoom;
        window.RoomManager.prototype.createRoom = async function() {
            try {
                // Lấy thông tin từ form
                const roomName = document.getElementById('room-name-input').value.trim();
                const roomCode = document.getElementById('room-code-input').value.trim();
                const roomDescription = document.getElementById('room-description-input').value.trim();
                const selectedQuizId = document.getElementById('room-quiz-selector').value;

                // Validate cơ bản
                if (!roomName) {
                    this.showToast('Vui lòng nhập tên phòng!', 'warning');
                    document.getElementById('room-name-input').focus();
                    return;
                }

                if (!roomCode || roomCode.length !== 6 || !/^\d{6}$/.test(roomCode)) {
                    this.showToast('Mã phòng phải là 6 chữ số!', 'warning');
                    document.getElementById('room-code-input').focus();
                    return;
                }

                if (!selectedQuizId) {
                    this.showToast('Vui lòng chọn đề thi!', 'warning');
                    document.getElementById('room-quiz-selector').focus();
                    return;
                }

                // Lấy quiz từ localStorage hoặc quizManager
                let quiz = null;
                
                // Cách 1: Từ quizManager
                if (window.quizManager && window.quizManager.quizzes) {
                    quiz = window.quizManager.quizzes.find(q => q.id === selectedQuizId);
                }
                
                // Cách 2: Từ localStorage (fallback)
                if (!quiz) {
                    try {
                        const storedQuizzes = localStorage.getItem('quizzes');
                        if (storedQuizzes) {
                            const quizzes = JSON.parse(storedQuizzes);
                            quiz = quizzes.find(q => q.id === selectedQuizId);
                        }
                    } catch (error) {
                        console.error('Error loading quiz from localStorage:', error);
                    }
                }
                
                if (!quiz) {
                    this.showToast('❌ Không tìm thấy đề thi!', 'error');
                    return;
                }

                // ============================================
                // VALIDATION NÂNG CAO: KIỂM TRA ĐẦY ĐỦ CÂU HỎI
                // ============================================
                console.log('🔍 [VALIDATION] Checking quiz completeness...');
                
                // Kiểm tra quiz có câu hỏi không
                if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
                    this.showToast('❌ Đề thi không có câu hỏi nào! Vui lòng chọn đề khác.', 'error');
                    console.error('❌ [VALIDATION] Quiz has no questions:', quiz);
                    return;
                }

                // Kiểm tra từng câu hỏi
                const invalidQuestions = [];
                for (let i = 0; i < quiz.questions.length; i++) {
                    const q = quiz.questions[i];
                    const questionNumber = i + 1;

                    // Kiểm tra câu hỏi có text không
                    if (!q.question || q.question.trim() === '') {
                        invalidQuestions.push(`Câu ${questionNumber}: Thiếu nội dung câu hỏi`);
                        continue;
                    }

                    // Kiểm tra có options không
                    if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
                        invalidQuestions.push(`Câu ${questionNumber}: Thiếu đáp án (cần ít nhất 2 đáp án)`);
                        continue;
                    }

                    // Kiểm tra các options có nội dung không
                    const emptyOptions = q.options.filter(opt => !opt || opt.trim() === '');
                    if (emptyOptions.length > 0) {
                        invalidQuestions.push(`Câu ${questionNumber}: Có đáp án trống`);
                        continue;
                    }

                    // Kiểm tra có đáp án đúng không
                    if (!q.correctAnswer || q.correctAnswer.trim() === '') {
                        invalidQuestions.push(`Câu ${questionNumber}: Thiếu đáp án đúng`);
                        continue;
                    }

                    // Kiểm tra đáp án đúng có trong danh sách options không
                    if (!q.options.includes(q.correctAnswer)) {
                        invalidQuestions.push(`Câu ${questionNumber}: Đáp án đúng không có trong danh sách đáp án`);
                        continue;
                    }
                }

                // Nếu có câu hỏi không hợp lệ, hiển thị chi tiết
                if (invalidQuestions.length > 0) {
                    const errorMessage = `❌ Đề thi có ${invalidQuestions.length} câu hỏi không hợp lệ:\n\n` + 
                                       invalidQuestions.slice(0, 5).join('\n') +
                                       (invalidQuestions.length > 5 ? `\n... và ${invalidQuestions.length - 5} lỗi khác` : '');
                    
                    this.showToast('❌ Đề thi không đầy đủ! Vui lòng kiểm tra lại.', 'error');
                    
                    // Hiển thị chi tiết trong console
                    console.error('❌ [VALIDATION] Invalid questions found:');
                    invalidQuestions.forEach(err => console.error('  -', err));
                    
                    // Hiển thị alert với chi tiết
                    setTimeout(() => {
                        alert(errorMessage + '\n\nVui lòng sửa đề thi trong mục "Quản Lý Quiz" trước khi tạo phòng.');
                    }, 500);
                    
                    return;
                }

                console.log(`✅ [VALIDATION] Quiz is complete: ${quiz.questions.length} valid questions`);

                // Kiểm tra mã phòng đã tồn tại chưa
                const existingRoom = await this.checkRoomCodeExists(roomCode);
                if (existingRoom) {
                    this.showToast('❌ Mã phòng đã tồn tại! Vui lòng chọn mã khác.', 'error');
                    return;
                }

                // Tạo bản sao sâu của quiz để đ���m bảo dữ liệu không bị thay đổi
                const quizCopy = JSON.parse(JSON.stringify(quiz));

                // Tạo room object với quiz đầy đủ
                const room = {
                    id: Date.now().toString(),
                    name: roomName,
                    code: roomCode,
                    description: roomDescription || 'Không có mô tả',
                    quiz: {
                        id: quizCopy.id,
                        title: quizCopy.title,
                        description: quizCopy.description || '',
                        questions: quizCopy.questions, // Đầy đủ tất cả câu hỏi
                        totalQuestions: quizCopy.questions.length
                    },
                    creatorName: this.currentUserName || 'Người dùng',
                    creatorId: this.getCreatorId(), // ID người tạo
                    createdAt: new Date().toISOString(),
                    participants: 0,
                    attempts: 0,
                    leaderboard: []
                };

                // Log để verify
                console.log('📦 [ROOM CREATE] Room data prepared:');
                console.log('  - Room name:', room.name);
                console.log('  - Room code:', room.code);
                console.log('  - Quiz title:', room.quiz.title);
                console.log('  - Total questions:', room.quiz.questions.length);
                console.log('  - Creator ID:', room.creatorId);

                this.showToast('🔄 Đang tạo phòng với đề thi đầy đủ...', 'info');

                // Lưu lên Supabase nếu có
                if (this.isSupabaseAvailable) {
                    try {
                        const result = await this.saveRoomToSupabase(room);
                        if (result.success) {
                            room.id = result.id;
                            this.showToast('✨ Tạo phòng thành công! Đề thi đã được tải lên đầy đủ.', 'success');
                            
                            // Clear form
                            this.clearRoomForm();
                            
                            // Reload rooms
                            await this.loadRooms();
                            
                            // Hiển thị chi tiết phòng
                            this.viewRoomDetails(room.id);
                            return;
                        }
                    } catch (error) {
                        console.error('Supabase save failed:', error);
                        this.showToast('⚠️ Lỗi Supabase, lưu local...', 'warning');
                    }
                }

                // Fallback: Lưu local
                this.rooms.push(room);
                this.saveRoomsLocal();
                
                this.showToast('✨ Tạo phòng thành công (Local)! Đề thi đã được lưu đầy đủ.', 'success');
                
                // Clear form
                this.clearRoomForm();
                
                // Reload rooms
                this.renderMyRooms();
                
                // Hiển thị chi tiết phòng
                this.viewRoomDetails(room.id);

            } catch (error) {
                console.error('❌ [ROOM CREATE] Error:', error);
                this.showToast('❌ Lỗi khi tạo phòng: ' + error.message, 'error');
            }
        };

        console.log('✅ [ROOM VALIDATION] createRoom upgraded with validation');

        // ============================================
        // 2. NÂNG CẤP: LOAD ROOMS - CHỈ HIỂN THỊ PHÒNG CỦA NGƯỜI TẠO
        // ============================================
        const originalLoadRooms = window.RoomManager.prototype.loadRooms;
        window.RoomManager.prototype.loadRooms = async function() {
            try {
                this.showLoading(true);

                const currentCreatorId = this.getCreatorId();
                console.log('🔍 [LOAD ROOMS] Loading rooms for creator:', currentCreatorId);

                // Ưu tiên Supabase
                if (this.isSupabaseAvailable) {
                    try {
                        // Chỉ lấy phòng của người tạo hiện tại
                        const { data, error } = await window.supabaseQuizManager.supabase
                            .from('exam_rooms')
                            .select('*')
                            .eq('creator_id', currentCreatorId)
                            .order('created_at', { ascending: false });

                        if (!error && data) {
                            this.rooms = data.map(room => ({
                                id: room.id,
                                name: room.name,
                                code: room.code,
                                description: room.description,
                                quiz: room.quiz_data,
                                creatorName: room.creator_name,
                                creatorId: room.creator_id,
                                createdAt: room.created_at,
                                participants: room.participants || 0,
                                attempts: room.attempts || 0,
                                leaderboard: room.leaderboard || []
                            }));

                            console.log(`✅ [LOAD ROOMS] Loaded ${this.rooms.length} rooms from Supabase`);
                            this.renderMyRooms();
                            this.showLoading(false);
                            return;
                        }
                    } catch (error) {
                        console.warn('⚠️ [LOAD ROOMS] Supabase load failed:', error);
                    }
                }

                // Fallback: Load từ local và filter theo creator
                this.loadRoomsLocal();
                
                // Filter chỉ lấy phòng của người tạo hiện tại
                this.rooms = this.rooms.filter(room => {
                    // Nếu room không có creatorId (phòng cũ), gán creatorId hiện tại
                    if (!room.creatorId) {
                        room.creatorId = currentCreatorId;
                        return true;
                    }
                    return room.creatorId === currentCreatorId;
                });

                // Lưu lại sau khi filter
                this.saveRoomsLocal();

                console.log(`✅ [LOAD ROOMS] Loaded ${this.rooms.length} rooms from local storage`);
                this.renderMyRooms();

            } catch (error) {
                console.error('❌ [LOAD ROOMS] Error:', error);
                this.showToast('❌ Lỗi khi tải danh sách phòng', 'error');
            } finally {
                this.showLoading(false);
            }
        };

        console.log('✅ [ROOM VALIDATION] loadRooms upgraded with creator filter');

        // ============================================
        // 3. NÂNG CẤP: JOIN ROOM - VERIFY QUIZ DATA ĐẦY ĐỦ
        // ============================================
        const originalJoinRoom = window.RoomManager.prototype.joinRoom;
        window.RoomManager.prototype.joinRoom = async function() {
            try {
                const code = document.getElementById('join-room-code-input').value.trim();

                if (!code) {
                    this.showToast('Vui lòng nhập mã phòng!', 'warning');
                    return;
                }

                if (code.length !== 6 || !/^\d{6}$/.test(code)) {
                    this.showToast('Mã phòng phải là 6 chữ số!', 'warning');
                    return;
                }

                this.showToast('🔍 Đang tìm phòng...', 'info');

                // Tìm phòng trong Supabase (KHÔNG filter theo creator_id)
                let room = null;
                if (this.isSupabaseAvailable) {
                    try {
                        const { data, error } = await window.supabaseQuizManager.supabase
                            .from('exam_rooms')
                            .select('*')
                            .eq('code', code)
                            .single();

                        if (!error && data) {
                            room = {
                                id: data.id,
                                name: data.name,
                                code: data.code,
                                description: data.description,
                                quiz: data.quiz_data,
                                creatorName: data.creator_name,
                                creatorId: data.creator_id,
                                createdAt: data.created_at,
                                participants: data.participants || 0,
                                attempts: data.attempts || 0,
                                leaderboard: data.leaderboard || []
                            };

                            console.log('✅ [JOIN ROOM] Found room from Supabase');
                        }
                    } catch (error) {
                        console.warn('⚠️ [JOIN ROOM] Supabase search failed:', error);
                    }
                }

                // Fallback: Tìm trong tất cả local rooms (không filter)
                if (!room) {
                    const allLocalRooms = JSON.parse(localStorage.getItem('examRooms') || '[]');
                    room = allLocalRooms.find(r => r.code === code);
                    
                    if (room) {
                        console.log('✅ [JOIN ROOM] Found room from local storage');
                    }
                }

                if (!room) {
                    this.showToast('❌ Không tìm thấy phòng với mã này!', 'error');
                    return;
                }

                // ============================================
                // VALIDATION: KIỂM TRA QUIZ DATA ĐẦY ĐỦ
                // ============================================
                console.log('🔍 [JOIN ROOM] Validating quiz data...');
                
                if (!room.quiz || !room.quiz.questions || room.quiz.questions.length === 0) {
                    this.showToast('❌ Phòng thi không có câu hỏi! Vui lòng liên hệ người tạo phòng.', 'error');
                    console.error('❌ [JOIN ROOM] Room has no quiz data:', room);
                    return;
                }

                // Kiểm tra từng câu hỏi
                let validQuestions = 0;
                for (const q of room.quiz.questions) {
                    if (q.question && q.options && q.options.length >= 2 && q.correctAnswer) {
                        validQuestions++;
                    }
                }

                if (validQuestions === 0) {
                    this.showToast('❌ Phòng thi không có câu hỏi hợp lệ!', 'error');
                    console.error('❌ [JOIN ROOM] No valid questions found');
                    return;
                }

                console.log(`✅ [JOIN ROOM] Quiz validated: ${validQuestions}/${room.quiz.questions.length} valid questions`);

                // Hiển thị thông báo nếu có câu hỏi không hợp lệ
                if (validQuestions < room.quiz.questions.length) {
                    this.showToast(`⚠️ Phòng có ${validQuestions}/${room.quiz.questions.length} câu hỏi hợp lệ`, 'warning');
                }

                // Hiển thị chi tiết phòng
                this.showRoomDetailsModal(room);

                // Clear input
                document.getElementById('join-room-code-input').value = '';

                this.showToast(`✅ Tìm thấy phòng: ${room.name}`, 'success');

            } catch (error) {
                console.error('❌ [JOIN ROOM] Error:', error);
                this.showToast('❌ Lỗi khi tìm phòng', 'error');
            }
        };

        console.log('✅ [ROOM VALIDATION] joinRoom upgraded with validation');

        // ============================================
        // 4. NÂNG CẤP: START QUIZ - VERIFY TRƯỚC KHI BẮT ĐẦU
        // ============================================
        const originalStartQuizWithUserName = window.RoomManager.prototype.startQuizWithUserName;
        window.RoomManager.prototype.startQuizWithUserName = function(room, userName) {
            // Kiểm tra quiz data trước khi bắt đầu
            if (!room || !room.quiz || !room.quiz.questions || room.quiz.questions.length === 0) {
                this.showToast('❌ Không thể bắt đầu: Dữ liệu quiz không hợp lệ!', 'error');
                console.error('❌ [START QUIZ] Invalid quiz data:', room);
                return;
            }

            console.log('🎯 [START QUIZ] Starting quiz with full data:');
            console.log('  - Room:', room.name);
            console.log('  - Quiz:', room.quiz.title);
            console.log('  - Questions:', room.quiz.questions.length);
            console.log('  - User:', userName);

            // Tạo bản sao sâu để bảo vệ dữ liệu
            const protectedRoom = JSON.parse(JSON.stringify(room));
            protectedRoom.userName = userName;

            // Gọi hàm gốc với dữ liệu đã được bảo vệ
            originalStartQuizWithUserName.call(this, protectedRoom, userName);
        };

        console.log('✅ [ROOM VALIDATION] startQuizWithUserName upgraded with verification');

        // ============================================
        // 5. MONITOR & AUTO-FIX
        // ============================================
        
        // Monitor quiz data trong quizManager
        setInterval(() => {
            if (window.quizManager && 
                window.quizManager.currentQuiz && 
                window.quizManager.currentQuiz.isRoomQuiz) {
                
                // Kiểm tra quiz data còn đầy đủ không
                if (!window.quizManager.currentQuiz.questions || 
                    window.quizManager.currentQuiz.questions.length === 0) {
                    
                    console.warn('⚠️ [MONITOR] Room quiz data lost, attempting restore...');
                    
                    // Thử restore từ backup
                    if (window.quizManager._quizBackup && 
                        window.quizManager._quizBackup.questions &&
                        window.quizManager._quizBackup.questions.length > 0) {
                        
                        window.quizManager.currentQuiz = JSON.parse(JSON.stringify(window.quizManager._quizBackup));
                        console.log('✅ [MONITOR] Restored quiz data from backup');
                    }
                }
            }
        }, 2000);

        console.log('✅ [ROOM VALIDATION] Monitor started');

        // ============================================
        // HOÀN TẤT
        // ============================================
        console.log('✅ [ROOM VALIDATION] All upgrades applied successfully!');
        console.log('📋 [ROOM VALIDATION] Features:');
        console.log('  ✓ Quiz validation when creating room');
        console.log('  ✓ Only show rooms created by current user');
        console.log('  ✓ Verify quiz data when joining room');
        console.log('  ✓ Protect quiz data when starting quiz');
        console.log('  ✓ Auto-monitor and restore quiz data');
    });
})();
