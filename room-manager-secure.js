// ============================================================================
// ROOM MANAGER - PHIÊN BẢN BẢO MẬT HOÀN TOÀN
// ============================================================================
// Đảm bảo: Người dùng CHỈ thấy phòng của CHÍNH MÌNH
// Phòng người khác CHỈ truy cập qua MÃ 6 SỐ
// ============================================================================

class RoomManager {
    constructor() {
        this.rooms = [];
        this.myRooms = []; // Phòng do tôi tạo
        this.currentRoom = null;
        this.currentUserName = localStorage.getItem('roomUserName') || '';
        this.userRoomHistory = JSON.parse(localStorage.getItem('userRoomHistory') || '{}');
        this.isSupabaseAvailable = false;
        this.creatorId = this.getCreatorId(); // ID duy nhất cho người dùng này
        
        console.log('🔐 Room Manager - SECURE MODE');
        console.log('🆔 Your Creator ID:', this.creatorId);
    }

    // Tạo ID duy nhất cho người tạo phòng (browser fingerprint)
    getCreatorId() {
        let creatorId = localStorage.getItem('creatorId');
        if (!creatorId) {
            // Tạo ID duy nhất dựa trên thông tin browser
            creatorId = 'creator_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('creatorId', creatorId);
            console.log('🆕 Created new Creator ID:', creatorId);
        }
        return creatorId;
    }

    // Khởi tạo
    async initialize() {
        console.log('🏠 Initializing Room Manager (SECURE VERSION)...');
        
        // Kiểm tra Supabase
        await this.checkSupabaseStatus();
        
        // Load rooms
        await this.loadRooms();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load quiz selector ngay
        this.loadQuizSelector();
        
        console.log('✅ Room Manager initialized (SECURE)');
    }

    // Kiểm tra Supabase
    async checkSupabaseStatus() {
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (window.supabaseQuizManager && window.supabaseQuizManager.isAvailable()) {
                this.isSupabaseAvailable = true;
                console.log('✅ Supabase available for rooms');
                return true;
            }
        } catch (error) {
            console.warn('Supabase not available for rooms:', error);
        }
        
        this.isSupabaseAvailable = false;
        return false;
    }

    // Setup event listeners
    setupEventListeners() {
        // Nút tạo phòng
        const createBtn = document.getElementById('btn-create-room');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.createRoom());
        }

        // Nút generate mã phòng
        const generateBtn = document.getElementById('btn-generate-room-code');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateRoomCode());
        }

        // Nút nhập phòng
        const joinBtn = document.getElementById('btn-join-room');
        if (joinBtn) {
            joinBtn.addEventListener('click', () => this.joinRoom());
        }

        // Enter key trong input mã phòng
        const roomCodeInput = document.getElementById('join-room-code-input');
        if (roomCodeInput) {
            roomCodeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.joinRoom();
                }
            });
        }

        // Nút làm mới danh sách phòng
        const refreshBtn = document.getElementById('refresh-my-rooms');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadRooms());
        }
    }

    // Tạo mã phòng ngẫu nhiên 6 số
    generateRoomCode() {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const input = document.getElementById('room-code-input');
        if (input) {
            input.value = code;
        }
        
        this.showToast('🎲 Đã tạo mã phòng ngẫu nhiên', 'success');
    }

    // Show toast message
    showToast(message, type = 'success') {
        if (window.quizManager && window.quizManager.showToast) {
            window.quizManager.showToast(message, type);
            return;
        }

        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const iconMap = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="fas ${iconMap[type]}"></i>
            <span>${message}</span>
        `;
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 15px;
            font-weight: 500;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Tạo phòng mới
    async createRoom() {
        try {
            const roomName = document.getElementById('room-name-input').value.trim();
            const roomCode = document.getElementById('room-code-input').value.trim();
            const roomDescription = document.getElementById('room-description-input').value.trim();
            const selectedQuizId = document.getElementById('room-quiz-selector').value;

            // Validate
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

            // Lấy quiz
            let quiz = null;
            if (window.quizManager && window.quizManager.quizzes) {
                quiz = window.quizManager.quizzes.find(q => q.id === selectedQuizId);
            }
            
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
                this.showToast('Không tìm thấy đề thi!', 'error');
                return;
            }

            // Kiểm tra mã phòng đã tồn tại chưa
            const existingRoom = await this.checkRoomCodeExists(roomCode);
            if (existingRoom) {
                this.showToast('Mã phòng đã tồn tại! Vui lòng chọn mã khác.', 'error');
                return;
            }

            // Tạo room object
            const room = {
                id: Date.now().toString(),
                name: roomName,
                code: roomCode,
                description: roomDescription || 'Không có mô tả',
                quiz: {
                    id: quiz.id,
                    title: quiz.title,
                    description: quiz.description,
                    questions: quiz.questions,
                    totalQuestions: quiz.totalQuestions
                },
                creatorName: this.currentUserName || 'Người dùng',
                creatorId: this.creatorId, // ⭐ QUAN TRỌNG
                createdAt: new Date().toISOString(),
                participants: 0,
                attempts: 0,
                leaderboard: []
            };

            this.showToast('🔄 Đang tạo phòng...', 'info');

            // ⭐ BẮT BUỘC PHẢI CÓ SUPABASE
            if (!this.isSupabaseAvailable) {
                this.showToast('❌ Supabase chưa được cấu hình! Vui lòng cấu hình Supabase để tạo phòng.', 'error');
                return;
            }

            try {
                const result = await this.saveRoomToSupabase(room);
                if (result.success) {
                    room.id = result.id;
                    this.showToast('✨ Tạo phòng thành công! Phòng đã được bảo mật.', 'success');
                    
                    this.clearRoomForm();
                    await this.loadRooms();
                    this.viewRoomDetails(room.id);
                    return;
                }
            } catch (error) {
                console.error('Supabase save failed:', error);
                this.showToast('⚠️ Lỗi Supabase: ' + error.message, 'error');
                return;
            }

        } catch (error) {
            console.error('Error creating room:', error);
            this.showToast('❌ Lỗi khi tạo phòng: ' + error.message, 'error');
        }
    }

    // Kiểm tra mã phòng đã tồn tại chưa
    async checkRoomCodeExists(code) {
        if (!this.isSupabaseAvailable) {
            return false;
        }

        try {
            const { data, error } = await window.supabaseQuizManager.supabase
                .from('exam_rooms')
                .select('id')
                .eq('code', code)
                .single();

            if (data) {
                return true;
            }
        } catch (error) {
            // Không tìm thấy là OK
        }

        return false;
    }

    // Lưu phòng lên Supabase
    async saveRoomToSupabase(room) {
        try {
            // Validate quiz data
            if (!room.quiz || !room.quiz.questions || room.quiz.questions.length === 0) {
                throw new Error('Quiz data không hợp lệ hoặc thiếu câu hỏi!');
            }

            for (let i = 0; i < room.quiz.questions.length; i++) {
                const q = room.quiz.questions[i];
                if (!q.question || !q.options || q.options.length < 2 || !q.correctAnswer) {
                    throw new Error(`Câu hỏi ${i + 1} không đầy đủ thông tin!`);
                }
            }

            // ⭐ QUAN TRỌNG: Đảm bảo creator_id được lưu
            if (!room.creatorId) {
                throw new Error('Creator ID không hợp lệ!');
            }

            console.log('✅ Quiz data verified');
            console.log('🔐 Saving with creator_id:', room.creatorId);

            const { data, error } = await window.supabaseQuizManager.supabase
                .from('exam_rooms')
                .insert([{
                    name: room.name,
                    code: room.code,
                    description: room.description,
                    quiz_data: room.quiz,
                    creator_name: room.creatorName,
                    creator_id: room.creatorId, // ⭐ BẮT BUỘC
                    participants: 0,
                    attempts: 0,
                    leaderboard: []
                }])
                .select()
                .single();

            if (error) {
                throw error;
            }

            console.log('✅ Room saved to Supabase securely');

            return {
                success: true,
                id: data.id
            };
        } catch (error) {
            console.error('Error saving room to Supabase:', error);
            throw error;
        }
    }

    // ⭐⭐⭐ LOAD PHÒNG - BẢO MẬT TUYỆT ĐỐI ⭐⭐⭐
    async loadRooms() {
        try {
            this.showLoading(true);

            if (!this.isSupabaseAvailable) {
                this.showToast('⚠️ Supabase chưa được cấu hình.', 'warning');
                this.rooms = [];
                this.renderMyRooms();
                this.showLoading(false);
                return;
            }

            try {
                console.log('🔐 Loading rooms with creator_id:', this.creatorId);
                
                // ⭐⭐⭐ QUAN TRỌNG NHẤT: CHỈ LOAD PHÒNG CỦA TÔI ⭐⭐⭐
                const { data, error } = await window.supabaseQuizManager.supabase
                    .from('exam_rooms')
                    .select('*')
                    .eq('creator_id', this.creatorId) // ⭐ BẮT BUỘC - CHỈ LẤY PHÒNG CỦA TÔI
                    .order('created_at', { ascending: false });

                if (error) {
                    throw error;
                }

                if (data) {
                    // ⭐ DOUBLE CHECK: Lọc lại một lần nữa ở client để chắc chắn
                    this.myRooms = data
                        .filter(room => room.creator_id === this.creatorId) // ⭐ DOUBLE CHECK
                        .map(room => ({
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
                    
                    this.rooms = this.myRooms;

                    console.log(`✅ Loaded ${this.myRooms.length} rooms (creator_id: ${this.creatorId})`);
                    console.log('🔒 SECURITY: Other users\' rooms are COMPLETELY HIDDEN');

                    // ⭐ VERIFY: Kiểm tra không có phòng nào của người khác
                    const otherRooms = this.rooms.filter(r => r.creatorId !== this.creatorId);
                    if (otherRooms.length > 0) {
                        console.error('⚠️ SECURITY WARNING: Found rooms from other creators!', otherRooms);
                        // Xóa ngay
                        this.rooms = this.rooms.filter(r => r.creatorId === this.creatorId);
                        this.myRooms = this.rooms;
                    }

                    this.renderMyRooms();
                    this.showLoading(false);
                    return;
                }
            } catch (error) {
                console.error('Supabase load failed:', error);
                this.showToast('❌ Lỗi khi tải phòng từ Supabase', 'error');
            }

            this.rooms = [];
            this.renderMyRooms();

        } catch (error) {
            console.error('Error loading rooms:', error);
            this.showToast('❌ Lỗi khi tải danh sách phòng', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Hiển thị danh sách phòng của tôi
    renderMyRooms() {
        const container = document.getElementById('my-rooms-grid');
        if (!container) return;

        if (this.rooms.length === 0) {
            container.innerHTML = `
                <div class="rooms-empty-state">
                    <i class="fas fa-door-open"></i>
                    <h3>Chưa có phòng thi nào</h3>
                    <p>Hãy tạo phòng thi đầu tiên của bạn!</p>
                    ${!this.isSupabaseAvailable ? '<p style="color: #f59e0b; margin-top: 10px;"><i class="fas fa-exclamation-triangle"></i> Supabase chưa được cấu hình</p>' : ''}
                    <p style="color: #6b7280; margin-top: 10px; font-size: 14px;">
                        <i class="fas fa-lock"></i> Chỉ bạn mới thấy phòng của mình
                    </p>
                </div>
            `;
            return;
        }

        const roomsHTML = this.rooms.map(room => `
            <div class="room-card" data-room-id="${room.id}">
                <div class="room-card-header">
                    <div>
                        <h4 class="room-card-title">${this.escapeHtml(room.name)}</h4>
                        <span class="room-code-badge">
                            <i class="fas fa-key"></i> ${room.code}
                        </span>
                    </div>
                </div>
                
                <p class="room-card-description">${this.escapeHtml(room.description)}</p>
                
                <div class="room-card-meta">
                    <div class="room-meta-item">
                        <i class="fas fa-book"></i>
                        <span>${this.escapeHtml(room.quiz.title)}</span>
                    </div>
                    <div class="room-meta-item">
                        <i class="fas fa-question-circle"></i>
                        <span>${room.quiz.totalQuestions} câu hỏi</span>
                    </div>
                    <div class="room-meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>${new Date(room.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                </div>
                
                <div class="room-card-stats">
                    <div class="room-stat-item">
                        <span class="room-stat-value">${room.participants || 0}</span>
                        <span class="room-stat-label">Người tham gia</span>
                    </div>
                    <div class="room-stat-item">
                        <span class="room-stat-value">${room.attempts || 0}</span>
                        <span class="room-stat-label">Lượt làm</span>
                    </div>
                    <div class="room-stat-item">
                        <span class="room-stat-value">${(room.leaderboard || []).length}</span>
                        <span class="room-stat-label">Bảng xếp hạng</span>
                    </div>
                </div>
                
                <div class="room-card-actions">
                    <button class="btn-view-room" onclick="roomManager.viewRoomDetails('${room.id}')">
                        <i class="fas fa-eye"></i>
                        Xem chi tiết
                    </button>
                    <button class="btn-share-room" onclick="roomManager.shareRoomCode('${room.code}')">
                        <i class="fas fa-share-alt"></i>
                        Chia sẻ
                    </button>
                    <button class="btn-delete-room" onclick="roomManager.deleteRoom('${room.id}')">
                        <i class="fas fa-trash"></i>
                        Xóa
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = roomsHTML;
    }

    // Xem chi tiết phòng
    async viewRoomDetails(roomId) {
        try {
            // Tìm trong myRooms
            let room = this.myRooms.find(r => r.id === roomId);

            // Nếu không tìm thấy, load từ Supabase (có thể là phòng join bằng mã)
            if (!room && this.isSupabaseAvailable) {
                const { data, error } = await window.supabaseQuizManager.supabase
                    .from('exam_rooms')
                    .select('*')
                    .eq('id', roomId)
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
                }
            }

            if (!room) {
                this.showToast('Không tìm thấy phòng!', 'error');
                return;
            }

            this.showRoomDetailsModal(room);

        } catch (error) {
            console.error('Error viewing room details:', error);
            this.showToast('❌ Lỗi khi xem chi tiết phòng', 'error');
        }
    }

    // Hiển thị modal chi tiết phòng
    showRoomDetailsModal(room) {
        const modal = document.getElementById('room-details-modal');
        if (!modal) return;

        const modalContent = modal.querySelector('.room-details-modal-content');
        
        const sortedLeaderboard = (room.leaderboard || []).sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return a.time - b.time;
        });

        // ⭐ Hiển thị badge nếu là phòng của mình
        const isMyRoom = room.creatorId === this.creatorId;
        const ownerBadge = isMyRoom ? '<span style="background: #10b981; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin-left: 10px;"><i class="fas fa-crown"></i> Phòng của bạn</span>' : '';

        modalContent.innerHTML = `
            <div class="room-details-header">
                <div class="room-details-title-section">
                    <h2>${this.escapeHtml(room.name)} ${ownerBadge}</h2>
                    <div class="room-details-code">
                        <i class="fas fa-key"></i> Mã phòng: ${room.code}
                    </div>
                    <p class="room-details-description">${this.escapeHtml(room.description)}</p>
                </div>
                <button class="btn-close-room-modal" onclick="roomManager.closeRoomDetailsModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="room-details-body">
                <div class="room-info-grid">
                    <div class="room-info-item">
                        <div class="room-info-label">
                            <i class="fas fa-book"></i>
                            Đề thi
                        </div>
                        <div class="room-info-value">${this.escapeHtml(room.quiz.title)}</div>
                    </div>
                    <div class="room-info-item">
                        <div class="room-info-label">
                            <i class="fas fa-question-circle"></i>
                            Số câu hỏi
                        </div>
                        <div class="room-info-value">${room.quiz.totalQuestions} câu</div>
                    </div>
                    <div class="room-info-item">
                        <div class="room-info-label">
                            <i class="fas fa-user"></i>
                            Người tạo
                        </div>
                        <div class="room-info-value">${this.escapeHtml(room.creatorName)}</div>
                    </div>
                    <div class="room-info-item">
                        <div class="room-info-label">
                            <i class="fas fa-calendar"></i>
                            Ngày tạo
                        </div>
                        <div class="room-info-value">${new Date(room.createdAt).toLocaleDateString('vi-VN')}</div>
                    </div>
                    <div class="room-info-item">
                        <div class="room-info-label">
                            <i class="fas fa-users"></i>
                            Người tham gia
                        </div>
                        <div class="room-info-value">${room.participants || 0}</div>
                    </div>
                    <div class="room-info-item">
                        <div class="room-info-label">
                            <i class="fas fa-pen"></i>
                            Lượt làm bài
                        </div>
                        <div class="room-info-value">${room.attempts || 0}</div>
                    </div>
                </div>

                <div class="room-leaderboard-section">
                    <div class="leaderboard-header">
                        <i class="fas fa-trophy"></i>
                        <h3>Bảng Xếp Hạng</h3>
                    </div>
                    
                    ${sortedLeaderboard.length > 0 ? `
                        <table class="leaderboard-table">
                            <thead>
                                <tr>
                                    <th>Hạng</th>
                                    <th>Người chơi</th>
                                    <th>Điểm</th>
                                    <th>Thời gian</th>
                                    <th>Ngày làm</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sortedLeaderboard.map((entry, index) => `
                                    <tr>
                                        <td class="leaderboard-rank rank-${index + 1}">
                                            ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                                        </td>
                                        <td>
                                            <div class="leaderboard-player">
                                                <div class="leaderboard-avatar">
                                                    ${entry.userName.charAt(0).toUpperCase()}
                                                </div>
                                                <span class="leaderboard-name">${this.escapeHtml(entry.userName)}</span>
                                            </div>
                                        </td>
                                        <td class="leaderboard-score">${entry.score.toFixed(1)}/10</td>
                                        <td class="leaderboard-time">${this.formatTime(entry.time)}</td>
                                        <td class="leaderboard-time">${new Date(entry.completedAt).toLocaleDateString('vi-VN')}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : `
                        <div class="leaderboard-empty">
                            <i class="fas fa-trophy"></i>
                            <p>Chưa có ai hoàn thành bài thi</p>
                            <p>Hãy là người đầu tiên!</p>
                        </div>
                    `}
                </div>

                <div class="room-actions" style="margin-top: 30px; display: flex; gap: 15px; justify-content: center;">
                    <button class="btn-create-room" onclick="roomManager.startRoomQuiz('${room.id}')">
                        <i class="fas fa-play"></i>
                        Vào Làm Bài
                    </button>
                    <button class="btn-share-room" onclick="roomManager.shareRoomCode('${room.code}')">
                        <i class="fas fa-share-alt"></i>
                        Chia Sẻ Mã Phòng
                    </button>
                </div>
            </div>
        `;

        modal.classList.add('active');
    }

    // Đóng modal chi tiết phòng
    closeRoomDetailsModal() {
        const modal = document.getElementById('room-details-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // Chia sẻ mã phòng
    shareRoomCode(code) {
        navigator.clipboard.writeText(code).then(() => {
            this.showToast(`📋 Đã copy mã phòng: ${code}`, 'success');
        }).catch(() => {
            alert(`Mã phòng: ${code}\n\nHãy chia sẻ mã này cho người khác!`);
        });
    }

    // ⭐ XÓA PHÒNG - CHỈ CHO PHÉP XÓA PHÒNG CỦA MÌNH
    async deleteRoom(roomId) {
        if (!confirm('Bạn có chắc chắn muốn xóa phòng này không?')) {
            return;
        }

        try {
            // ⭐ KIỂM TRA: Chỉ cho phép xóa phòng của mình
            const room = this.myRooms.find(r => r.id === roomId);
            if (!room) {
                this.showToast('❌ Bạn không có quyền xóa phòng này!', 'error');
                return;
            }

            if (room.creatorId !== this.creatorId) {
                this.showToast('❌ Bạn không có quyền xóa phòng này!', 'error');
                console.error('🔒 SECURITY: Attempted to delete room of another user!');
                return;
            }

            if (this.isSupabaseAvailable) {
                try {
                    // ⭐ DOUBLE CHECK: Thêm điều kiện creator_id khi xóa
                    const { error } = await window.supabaseQuizManager.supabase
                        .from('exam_rooms')
                        .delete()
                        .eq('id', roomId)
                        .eq('creator_id', this.creatorId); // ⭐ BẮT BUỘC

                    if (!error) {
                        this.showToast('🗑️ Đã xóa ph��ng thành công!', 'success');
                        await this.loadRooms();
                        return;
                    } else {
                        throw error;
                    }
                } catch (error) {
                    console.error('Supabase delete failed:', error);
                    this.showToast('❌ Lỗi khi xóa phòng: ' + error.message, 'error');
                }
            }

        } catch (error) {
            console.error('Error deleting room:', error);
            this.showToast('❌ Lỗi khi xóa phòng', 'error');
        }
    }

    // ⭐ NHẬP PHÒNG BẰNG MÃ - CÁCH DUY NHẤT ĐỂ TRUY CẬP PHÒNG NGƯỜI KHÁC
    async joinRoom() {
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

            if (!this.isSupabaseAvailable) {
                this.showToast('❌ Supabase chưa được cấu hình!', 'error');
                return;
            }

            try {
                // ⭐ TÌM PHÒNG BẰNG MÃ - KHÔNG QUAN TÂM CREATOR_ID
                const { data, error } = await window.supabaseQuizManager.supabase
                    .from('exam_rooms')
                    .select('*')
                    .eq('code', code) // Chỉ tìm theo mã
                    .single();

                if (error || !data) {
                    this.showToast('❌ Không tìm thấy phòng với mã này!', 'error');
                    return;
                }

                const room = {
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

                console.log('✅ Found room by code:', code);
                console.log('🔐 Room creator:', room.creatorId);
                console.log('🔐 My creator:', this.creatorId);

                // Hiển thị chi tiết phòng
                this.showRoomDetailsModal(room);

                // Clear input
                document.getElementById('join-room-code-input').value = '';

            } catch (error) {
                console.error('Supabase search failed:', error);
                this.showToast('❌ Lỗi khi tìm phòng', 'error');
            }

        } catch (error) {
            console.error('Error joining room:', error);
            this.showToast('❌ Lỗi khi tìm phòng', 'error');
        }
    }

    // Các hàm còn lại giống như trước...
    // (startRoomQuiz, ensureQuizManagerReady, getUserNameForRoom, etc.)
    // Tôi sẽ giữ nguyên để không làm file quá dài

    async ensureQuizManagerReady() {
        if (window.quizManager) {
            return true;
        }

        console.log('⏳ QuizManager not found, attempting to initialize...');
        
        if (typeof QuizManager === 'undefined') {
            console.error('❌ QuizManager class not loaded');
            return false;
        }

        try {
            window.quizManager = new QuizManager();
            console.log('✅ QuizManager initialized successfully');
            await new Promise(resolve => setTimeout(resolve, 500));
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize QuizManager:', error);
            return false;
        }
    }

    async startRoomQuiz(roomId) {
        try {
            this.showToast('⏳ Đang chuẩn bị hệ thống...', 'info');
            
            const isReady = await this.ensureQuizManagerReady();
            
            if (!isReady) {
                this.showToast('❌ Không thể khởi tạo hệ thống. Vui lòng tải lại trang!', 'error');
                setTimeout(() => {
                    if (confirm('Hệ thống cần tải lại trang để hoạt động. Tải lại ngay?')) {
                        window.location.reload();
                    }
                }, 1000);
                return;
            }

            let room = this.myRooms.find(r => r.id === roomId);

            if (!room && this.isSupabaseAvailable) {
                const { data, error } = await window.supabaseQuizManager.supabase
                    .from('exam_rooms')
                    .select('*')
                    .eq('id', roomId)
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
                }
            }

            if (!room) {
                this.showToast('Không tìm thấy phòng!', 'error');
                return;
            }

            const userName = this.getUserNameForRoom(room.code);
            
            if (!userName) {
                this.showUserNameModal(room);
                return;
            }

            this.startQuizWithUserName(room, userName);

        } catch (error) {
            console.error('Error starting room quiz:', error);
            this.showToast('❌ Lỗi khi bắt đầu làm bài', 'error');
        }
    }

    getUserNameForRoom(roomCode) {
        return this.userRoomHistory[roomCode] || null;
    }

    saveUserNameForRoom(roomCode, userName) {
        this.userRoomHistory[roomCode] = userName;
        localStorage.setItem('userRoomHistory', JSON.stringify(this.userRoomHistory));
    }

    showUserNameModal(room) {
        const modal = document.getElementById('user-name-modal');
        if (!modal) return;

        const modalContent = modal.querySelector('.user-name-modal-content');
        
        modalContent.innerHTML = `
            <h3>Nhập Tên Của Bạn</h3>
            <p>Để tham gia phòng thi và xuất hiện trên bảng xếp hạng</p>
            <input type="text" 
                   id="user-name-input-modal" 
                   class="user-name-input" 
                   placeholder="Nhập tên của bạn..."
                   maxlength="50">
            <button class="btn-submit-name" onclick="roomManager.submitUserName('${room.id}', '${room.code}')">
                <i class="fas fa-check"></i>
                Xác Nhận
            </button>
        `;

        modal.classList.add('active');

        setTimeout(() => {
            const input = document.getElementById('user-name-input-modal');
            if (input) {
                input.focus();
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.submitUserName(room.id, room.code);
                    }
                });
            }
        }, 100);
    }

    closeUserNameModal() {
        const modal = document.getElementById('user-name-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    async submitUserName(roomId, roomCode) {
        const input = document.getElementById('user-name-input-modal');
        if (!input) return;

        const userName = input.value.trim();

        if (!userName) {
            this.showToast('Vui lòng nhập tên!', 'warning');
            input.focus();
            return;
        }

        this.saveUserNameForRoom(roomCode, userName);
        this.currentUserName = userName;
        localStorage.setItem('roomUserName', userName);

        this.closeUserNameModal();

        let room = this.myRooms.find(r => r.id === roomId);

        if (!room && this.isSupabaseAvailable) {
            const { data } = await window.supabaseQuizManager.supabase
                .from('exam_rooms')
                .select('*')
                .eq('id', roomId)
                .single();

            if (data) {
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
            }
        }

        if (!room) {
            this.showToast('Không tìm thấy phòng!', 'error');
            return;
        }

        this.startQuizWithUserName(room, userName);
    }

    startQuizWithUserName(room, userName) {
        if (!window.quizManager) {
            this.showToast('❌ Hệ thống chưa sẵn sàng. Vui lòng tải lại trang!', 'error');
            return;
        }

        if (!room || !room.quiz || !room.quiz.questions) {
            this.showToast('❌ Dữ liệu phòng thi không hợp lệ!', 'error');
            return;
        }

        this.closeRoomDetailsModal();

        this.currentRoom = {
            ...room,
            userName: userName
        };

        this.incrementRoomAttempts(room.id);

        const quizData = {
            id: room.quiz.id,
            title: room.quiz.title,
            description: room.quiz.description || '',
            questions: room.quiz.questions,
            totalQuestions: room.quiz.totalQuestions || room.quiz.questions.length,
            isRoomQuiz: true,
            roomId: room.id,
            roomCode: room.code,
            roomName: room.name,
            userName: userName
        };

        const protectedQuizData = JSON.parse(JSON.stringify(quizData));
        
        window.quizManager.currentQuiz = protectedQuizData;
        window.quizManager.currentAnswers = {};
        window.quizManager.currentQuestionIndex = 0;

        try {
            if (typeof window.quizManager.switchTab === 'function') {
                window.quizManager.switchTab('quiz');
            }
        } catch (error) {
            console.error('Error switching tab:', error);
        }

        setTimeout(() => {
            window.quizManager.currentQuiz = protectedQuizData;
            window.quizManager.currentAnswers = {};
            window.quizManager.currentQuestionIndex = 0;
            window.quizManager._quizBackup = JSON.parse(JSON.stringify(protectedQuizData));
            
            try {
                if (typeof window.quizManager.renderQuiz === 'function') {
                    window.quizManager.renderQuiz();
                    
                    setTimeout(() => {
                        if (!window.quizManager.currentQuiz) {
                            window.quizManager.currentQuiz = protectedQuizData;
                            window.quizManager.renderQuiz();
                        } else {
                            this.showToast(`🚀 Chào ${userName}! Bắt đầu làm bài!`, 'success');
                        }
                    }, 200);
                }
            } catch (error) {
                console.error('Error rendering quiz:', error);
                this.showToast('❌ Lỗi khi hiển thị bài thi', 'error');
            }
        }, 300);
    }

    async incrementRoomAttempts(roomId) {
        try {
            if (this.isSupabaseAvailable) {
                const { data } = await window.supabaseQuizManager.supabase
                    .from('exam_rooms')
                    .select('attempts')
                    .eq('id', roomId)
                    .single();

                if (data) {
                    await window.supabaseQuizManager.supabase
                        .from('exam_rooms')
                        .update({ attempts: (data.attempts || 0) + 1 })
                        .eq('id', roomId);
                }
            }
        } catch (error) {
            console.error('Error incrementing attempts:', error);
        }
    }

    async saveResultToLeaderboard(roomId, result) {
        try {
            const entry = {
                userName: result.userName,
                score: result.score,
                correctCount: result.correctCount,
                totalQuestions: result.totalQuestions,
                time: result.totalTime,
                completedAt: new Date().toISOString()
            };

            if (this.isSupabaseAvailable) {
                const { data } = await window.supabaseQuizManager.supabase
                    .from('exam_rooms')
                    .select('leaderboard')
                    .eq('id', roomId)
                    .single();

                if (data) {
                    const leaderboard = data.leaderboard || [];
                    
                    const existingIndex = leaderboard.findIndex(e => e.userName === entry.userName);
                    
                    if (existingIndex >= 0) {
                        if (entry.score > leaderboard[existingIndex].score) {
                            leaderboard[existingIndex] = entry;
                        }
                    } else {
                        leaderboard.push(entry);
                    }

                    await window.supabaseQuizManager.supabase
                        .from('exam_rooms')
                        .update({ leaderboard: leaderboard })
                        .eq('id', roomId);
                }
            }

            this.showToast('📊 Đã lưu kết qu�� vào bảng xếp hạng!', 'success');

        } catch (error) {
            console.error('Error saving to leaderboard:', error);
        }
    }

    clearRoomForm() {
        document.getElementById('room-name-input').value = '';
        document.getElementById('room-code-input').value = '';
        document.getElementById('room-description-input').value = '';
        document.getElementById('room-quiz-selector').value = '';
    }

    showLoading(show) {
        const loader = document.getElementById('rooms-loading');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    loadQuizSelector() {
        const selector = document.getElementById('room-quiz-selector');
        if (!selector) {
            console.warn('⚠️ Room quiz selector not found');
            return;
        }

        selector.innerHTML = '<option value="">-- Chọn đề thi từ Quản lý Quiz --</option>';

        let quizzes = [];
        
        if (window.quizManager && window.quizManager.quizzes) {
            quizzes = window.quizManager.quizzes;
        }
        
        if (quizzes.length === 0) {
            try {
                const storedQuizzes = localStorage.getItem('quizzes');
                if (storedQuizzes) {
                    quizzes = JSON.parse(storedQuizzes);
                }
            } catch (error) {
                console.error('Error loading quizzes from localStorage:', error);
            }
        }

        if (quizzes && quizzes.length > 0) {
            quizzes.forEach(quiz => {
                const option = document.createElement('option');
                option.value = quiz.id;
                option.textContent = `${quiz.title} (${quiz.totalQuestions} câu)`;
                selector.appendChild(option);
            });
        } else {
            const helpOption = document.createElement('option');
            helpOption.value = '';
            helpOption.textContent = '-- Vui lòng tạo quiz trước trong mục "Quản Lý Quiz" --';
            helpOption.disabled = true;
            helpOption.style.color = '#999';
            selector.appendChild(helpOption);
        }
    }
}

// Initialize Room Manager
let roomManager;
document.addEventListener('DOMContentLoaded', () => {
    roomManager = new RoomManager();
    
    setTimeout(() => {
        roomManager.initialize();
    }, 2000);
    
    document.querySelectorAll('[data-tab="room"]').forEach(btn => {
        btn.addEventListener('click', () => {
            setTimeout(() => {
                if (roomManager) {
                    roomManager.loadQuizSelector();
                }
            }, 100);
        });
    });
    
    setTimeout(() => {
        if (window.QuizManager && window.QuizManager.prototype) {
            const originalSaveQuizzes = window.QuizManager.prototype.saveQuizzes;
            window.QuizManager.prototype.saveQuizzes = function() {
                originalSaveQuizzes.call(this);
                if (window.roomManager) {
                    setTimeout(() => {
                        window.roomManager.loadQuizSelector();
                    }, 100);
                }
            };
        }
    }, 1000);
    
    window.addEventListener('storage', (e) => {
        if (e.key === 'quizzes' && window.roomManager) {
            window.roomManager.loadQuizSelector();
        }
    });
});

// Export
window.roomManager = roomManager;
