// Room Manager - Quản lý Phòng Thi (UPGRADED VERSION)
// Sửa lỗi: Phòng thi giờ sẽ đồng bộ giữa các thiết bị qua Supabase

class RoomManager {
    constructor() {
        this.rooms = [];
        this.myRooms = []; // Phòng do tôi tạo
        this.allRooms = []; // Tất cả phòng từ Supabase
        this.currentRoom = null;
        this.currentUserName = localStorage.getItem('roomUserName') || '';
        this.userRoomHistory = JSON.parse(localStorage.getItem('userRoomHistory') || '{}');
        this.isSupabaseAvailable = false;
        this.creatorId = this.getCreatorId(); // ID duy nhất cho người dùng này
    }

    // Tạo ID duy nhất cho người tạo phòng (browser fingerprint)
    getCreatorId() {
        let creatorId = localStorage.getItem('creatorId');
        if (!creatorId) {
            // Tạo ID duy nhất dựa trên thông tin browser
            creatorId = 'creator_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('creatorId', creatorId);
        }
        return creatorId;
    }

    // Khởi tạo
    async initialize() {
        console.log('🏠 Initializing Room Manager (UPGRADED)...');
        
        // Kiểm tra Supabase
        await this.checkSupabaseStatus();
        
        // Load rooms
        await this.loadRooms();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load quiz selector ngay
        this.loadQuizSelector();
        
        console.log('✅ Room Manager initialized (UPGRADED)');
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

    // Show toast message (fallback nếu quizManager chưa load)
    showToast(message, type = 'success') {
        // Thử dùng quizManager trước
        if (window.quizManager && window.quizManager.showToast) {
            window.quizManager.showToast(message, type);
            return;
        }

        // Fallback: Tạo toast riêng
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
            // Lấy thông tin từ form
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
                creatorId: this.creatorId, // ⭐ Thêm creator_id
                createdAt: new Date().toISOString(),
                participants: 0,
                attempts: 0,
                leaderboard: []
            };

            this.showToast('🔄 Đang tạo phòng...', 'info');

            // ⭐ ƯU TIÊN LƯU LÊN SUPABASE
            if (this.isSupabaseAvailable) {
                try {
                    const result = await this.saveRoomToSupabase(room);
                    if (result.success) {
                        room.id = result.id;
                        this.showToast('✨ Tạo phòng thành công! Phòng đã được đồng bộ.', 'success');
                        
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
                    this.showToast('⚠️ Lỗi Supabase: ' + error.message, 'error');
                    return; // ⭐ KHÔNG fallback về local nữa
                }
            } else {
                this.showToast('❌ Supabase chưa được cấu hình! Vui lòng cấu hình Supabase để tạo phòng.', 'error');
                return;
            }

        } catch (error) {
            console.error('Error creating room:', error);
            this.showToast('❌ Lỗi khi tạo phòng: ' + error.message, 'error');
        }
    }

    // Kiểm tra mã phòng đã tồn tại chưa
    async checkRoomCodeExists(code) {
        // Kiểm tra trong Supabase
        if (this.isSupabaseAvailable) {
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
        }

        return false;
    }

    // Lưu phòng lên Supabase
    async saveRoomToSupabase(room) {
        try {
            // Đảm bảo quiz data đầy đủ
            if (!room.quiz || !room.quiz.questions || room.quiz.questions.length === 0) {
                throw new Error('Quiz data không hợp lệ hoặc thiếu câu hỏi!');
            }

            // Verify tất cả câu hỏi có đầy đủ thông tin
            for (let i = 0; i < room.quiz.questions.length; i++) {
                const q = room.quiz.questions[i];
                if (!q.question || !q.options || q.options.length < 2 || !q.correctAnswer) {
                    throw new Error(`Câu hỏi ${i + 1} không đầy đủ thông tin!`);
                }
            }

            console.log('✅ Quiz data verified - All questions complete');
            console.log(`📊 Total questions: ${room.quiz.questions.length}`);

            const { data, error } = await window.supabaseQuizManager.supabase
                .from('exam_rooms')
                .insert([{
                    name: room.name,
                    code: room.code,
                    description: room.description,
                    quiz_data: room.quiz,
                    creator_name: room.creatorName,
                    creator_id: room.creatorId, // ⭐ Lưu creator_id
                    participants: 0,
                    attempts: 0,
                    leaderboard: []
                }])
                .select()
                .single();

            if (error) {
                throw error;
            }

            console.log('✅ Room saved to Supabase with creator_id:', room.creatorId);

            return {
                success: true,
                id: data.id
            };
        } catch (error) {
            console.error('Error saving room to Supabase:', error);
            throw error;
        }
    }

    // ⭐ LOAD PHÒNG - CHỈ HIỂN THỊ PHÒNG CỦA TÔI
    async loadRooms() {
        try {
            this.showLoading(true);

            // ⭐ CHỈ LOAD TỪ SUPABASE
            if (this.isSupabaseAvailable) {
                try {
                    // ⭐ QUAN TRỌNG: Chỉ load phòng của tôi (filter theo creator_id)
                    const { data, error } = await window.supabaseQuizManager.supabase
                        .from('exam_rooms')
                        .select('*')
                        .eq('creator_id', this.creatorId) // ⭐ CHỈ LẤY PHÒNG CỦA TÔI
                        .order('created_at', { ascending: false });

                    if (!error && data) {
                        // ⭐ Chỉ lưu phòng của tôi
                        this.myRooms = data.map(room => ({
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
                        
                        // ⭐ Hiển thị chỉ phòng của tôi
                        this.rooms = this.myRooms;

                        console.log(`✅ Loaded ${this.myRooms.length} rooms created by me (creator_id: ${this.creatorId})`);
                        console.log(`🔒 Other users' rooms are hidden from "My Rooms" section`);

                        this.renderMyRooms();
                        this.showLoading(false);
                        return;
                    }
                } catch (error) {
                    console.error('Supabase load failed:', error);
                    this.showToast('❌ Lỗi khi tải phòng từ Supabase', 'error');
                }
            } else {
                this.showToast('⚠️ Supabase chưa được cấu hình. Vui lòng cấu hình để sử dụng phòng thi.', 'warning');
                this.rooms = [];
            }

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
            // ⭐ Tìm trong myRooms (phòng của tôi)
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
        
        // S���p xếp leaderboard theo điểm và thời gian
        const sortedLeaderboard = (room.leaderboard || []).sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return a.time - b.time;
        });

        modalContent.innerHTML = `
            <div class="room-details-header">
                <div class="room-details-title-section">
                    <h2>${this.escapeHtml(room.name)}</h2>
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
        // Copy to clipboard
        navigator.clipboard.writeText(code).then(() => {
            this.showToast(`📋 Đã copy mã phòng: ${code}`, 'success');
        }).catch(() => {
            // Fallback: Hiển thị alert
            alert(`Mã phòng: ${code}\n\nHãy chia sẻ mã này cho người khác!`);
        });
    }

    // Xóa phòng
    async deleteRoom(roomId) {
        if (!confirm('Bạn có chắc chắn muốn xóa phòng này không?')) {
            return;
        }

        try {
            // Xóa từ Supabase
            if (this.isSupabaseAvailable) {
                try {
                    const { error } = await window.supabaseQuizManager.supabase
                        .from('exam_rooms')
                        .delete()
                        .eq('id', roomId);

                    if (!error) {
                        this.showToast('🗑️ Đã xóa phòng thành công!', 'success');
                        
                        // Reload
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

    // Nhập phòng bằng mã
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

            // ⭐ Tìm phòng trong Supabase
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
                    }
                } catch (error) {
                    console.warn('Supabase search failed:', error);
                }
            }

            if (!room) {
                this.showToast('❌ Không tìm thấy phòng với mã này!', 'error');
                return;
            }

            // Hiển thị chi tiết phòng
            this.showRoomDetailsModal(room);

            // Clear input
            document.getElementById('join-room-code-input').value = '';

        } catch (error) {
            console.error('Error joining room:', error);
            this.showToast('❌ Lỗi khi tìm phòng', 'error');
        }
    }

    // Đảm bảo QuizManager được khởi tạo
    async ensureQuizManagerReady() {
        if (window.quizManager) {
            return true;
        }

        console.log('⏳ QuizManager not found, attempting to initialize...');
        
        // Kiểm tra xem QuizManager class có tồn tại không
        if (typeof QuizManager === 'undefined') {
            console.error('❌ QuizManager class not loaded');
            return false;
        }

        // Thử khởi tạo QuizManager
        try {
            window.quizManager = new QuizManager();
            console.log('✅ QuizManager initialized successfully');
            
            // Đợi một chút để đảm bảo khởi tạo hoàn tất
            await new Promise(resolve => setTimeout(resolve, 500));
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize QuizManager:', error);
            return false;
        }
    }

    // Bắt đầu làm bài trong phòng
    async startRoomQuiz(roomId) {
        try {
            // Đảm bảo QuizManager sẵn sàng
            this.showToast('⏳ Đang chuẩn bị hệ thống...', 'info');
            
            const isReady = await this.ensureQuizManagerReady();
            
            if (!isReady) {
                this.showToast('❌ Không thể khởi tạo hệ thống. Vui lòng tải lại trang!', 'error');
                console.error('QuizManager initialization failed');
                
                // Đề xuất reload trang
                setTimeout(() => {
                    if (confirm('Hệ thống cần tải lại trang để hoạt động. Tải lại ngay?')) {
                        window.location.reload();
                    }
                }, 1000);
                return;
            }
            
            console.log('✅ QuizManager is ready');

            // ⭐ Tìm room trong myRooms hoặc load từ Supabase
            let room = this.myRooms.find(r => r.id === roomId);

            // Load từ Supabase nếu cần (có thể là phòng join bằng mã)
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

            // Kiểm tra xem người dùng đã có tên chưa
            const userName = this.getUserNameForRoom(room.code);
            
            if (!userName) {
                // Hiển thị modal nhập tên
                this.showUserNameModal(room);
                return;
            }

            // Bắt đầu làm bài
            this.startQuizWithUserName(room, userName);

        } catch (error) {
            console.error('Error starting room quiz:', error);
            this.showToast('❌ Lỗi khi bắt đầu làm bài', 'error');
        }
    }

    // L���y tên người dùng cho phòng (từ history)
    getUserNameForRoom(roomCode) {
        return this.userRoomHistory[roomCode] || null;
    }

    // Lưu tên người dùng cho phòng
    saveUserNameForRoom(roomCode, userName) {
        this.userRoomHistory[roomCode] = userName;
        localStorage.setItem('userRoomHistory', JSON.stringify(this.userRoomHistory));
    }

    // Hiển thị modal nhập tên
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

        // Focus vào input
        setTimeout(() => {
            const input = document.getElementById('user-name-input-modal');
            if (input) {
                input.focus();
                
                // Enter key
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.submitUserName(room.id, room.code);
                    }
                });
            }
        }, 100);
    }

    // Đóng modal nhập tên
    closeUserNameModal() {
        const modal = document.getElementById('user-name-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // Submit tên người dùng
    async submitUserName(roomId, roomCode) {
        const input = document.getElementById('user-name-input-modal');
        if (!input) return;

        const userName = input.value.trim();

        if (!userName) {
            this.showToast('Vui lòng nhập tên!', 'warning');
            input.focus();
            return;
        }

        // Lưu tên
        this.saveUserNameForRoom(roomCode, userName);
        this.currentUserName = userName;
        localStorage.setItem('roomUserName', userName);

        // Đóng modal
        this.closeUserNameModal();

        // Tìm room
        let room = this.allRooms.find(r => r.id === roomId);

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

        // Bắt đầu làm bài
        this.startQuizWithUserName(room, userName);
    }

    // Bắt đầu làm bài với tên người dùng
    startQuizWithUserName(room, userName) {
        // Kiểm tra quizManager có tồn tại không
        if (!window.quizManager) {
            this.showToast('❌ Hệ thống chưa sẵn sàng. Vui lòng tải lại trang!', 'error');
            console.error('QuizManager not initialized');
            return;
        }

        // Kiểm tra room có quiz data không
        if (!room || !room.quiz || !room.quiz.questions) {
            this.showToast('❌ Dữ liệu phòng thi không hợp lệ!', 'error');
            console.error('Invalid room data:', room);
            return;
        }

        console.log('🎯 Starting quiz with room:', room);
        console.log('📚 Quiz data:', room.quiz);

        // Đóng modal chi tiết phòng
        this.closeRoomDetailsModal();

        // Set current room và lưu userName
        this.currentRoom = {
            ...room,
            userName: userName
        };

        // Tăng số lượt làm bài
        this.incrementRoomAttempts(room.id);

        // Load quiz vào quizManager
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

        console.log('✅ Setting currentQuiz:', quizData);
        
        // Lưu quiz data vào biến tạm để bảo vệ
        const protectedQuizData = JSON.parse(JSON.stringify(quizData));
        
        // Set quiz data
        window.quizManager.currentQuiz = protectedQuizData;
        window.quizManager.currentAnswers = {};
        window.quizManager.currentQuestionIndex = 0;

        // Chuyển sang tab làm bài TRƯỚC
        try {
            if (typeof window.quizManager.switchTab === 'function') {
                console.log('🔄 Switching to quiz tab...');
                window.quizManager.switchTab('quiz');
            }
        } catch (error) {
            console.error('Error switching tab:', error);
        }

        // Đợi tab switch xong, sau đó set lại quiz data và render
        setTimeout(() => {
            // Set lại quiz data sau khi switch tab (phòng trường hợp bị clear)
            window.quizManager.currentQuiz = protectedQuizData;
            window.quizManager.currentAnswers = {};
            window.quizManager.currentQuestionIndex = 0;
            
            // Tạo backup để khôi phục khi cần
            window.quizManager._quizBackup = JSON.parse(JSON.stringify(protectedQuizData));
            
            console.log('✅ Quiz data re-set after tab switch:', window.quizManager.currentQuiz);
            console.log('✅ Quiz backup created');
            
            // Render quiz
            try {
                if (typeof window.quizManager.renderQuiz === 'function') {
                    console.log('🎨 Rendering quiz...');
                    window.quizManager.renderQuiz();
                    
                    // Verify lần cuối
                    setTimeout(() => {
                        if (!window.quizManager.currentQuiz) {
                            console.error('❌ currentQuiz was cleared after rendering!');
                            this.showToast('❌ Lỗi: Quiz data bị mất. Đang thử lại...', 'error');
                            
                            // Thử set lại một lần nữa
                            window.quizManager.currentQuiz = protectedQuizData;
                            window.quizManager.renderQuiz();
                        } else {
                            console.log('✅ Quiz rendered successfully!');
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

    // Tăng số lượt làm bài
    async incrementRoomAttempts(roomId) {
        try {
            // Tăng trong Supabase
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

    // Lưu kết quả vào leaderboard
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

            // Lưu vào Supabase
            if (this.isSupabaseAvailable) {
                const { data } = await window.supabaseQuizManager.supabase
                    .from('exam_rooms')
                    .select('leaderboard')
                    .eq('id', roomId)
                    .single();

                if (data) {
                    const leaderboard = data.leaderboard || [];
                    
                    // Kiểm tra xem user đã có trong leaderboard chưa
                    const existingIndex = leaderboard.findIndex(e => e.userName === entry.userName);
                    
                    if (existingIndex >= 0) {
                        // Cập nhật nếu điểm mới cao hơn
                        if (entry.score > leaderboard[existingIndex].score) {
                            leaderboard[existingIndex] = entry;
                        }
                    } else {
                        // Thêm mới
                        leaderboard.push(entry);
                    }

                    await window.supabaseQuizManager.supabase
                        .from('exam_rooms')
                        .update({ leaderboard: leaderboard })
                        .eq('id', roomId);
                }
            }

            this.showToast('📊 Đã lưu kết quả vào bảng xếp hạng!', 'success');

        } catch (error) {
            console.error('Error saving to leaderboard:', error);
        }
    }

    // Clear form tạo phòng
    clearRoomForm() {
        document.getElementById('room-name-input').value = '';
        document.getElementById('room-code-input').value = '';
        document.getElementById('room-description-input').value = '';
        document.getElementById('room-quiz-selector').value = '';
    }

    // Hiển thị loading
    showLoading(show) {
        const loader = document.getElementById('rooms-loading');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    }

    // Format thời gian
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Load quiz selector
    loadQuizSelector() {
        const selector = document.getElementById('room-quiz-selector');
        if (!selector) {
            console.warn('⚠️ Room quiz selector not found');
            return;
        }

        selector.innerHTML = '<option value="">-- Chọn đề thi từ Quản lý Quiz --</option>';

        // Lấy quizzes từ localStorage trực tiếp
        let quizzes = [];
        
        // Cách 1: Từ quizManager
        if (window.quizManager && window.quizManager.quizzes) {
            quizzes = window.quizManager.quizzes;
        }
        
        // Cách 2: Từ localStorage (fallback)
        if (quizzes.length === 0) {
            try {
                const storedQuizzes = localStorage.getItem('quizzes');
                if (storedQuizzes) {
                    quizzes = JSON.parse(storedQuizzes);
                    console.log('📦 Loaded quizzes from localStorage');
                }
            } catch (error) {
                console.error('Error loading quizzes from localStorage:', error);
            }
        }

        if (quizzes && quizzes.length > 0) {
            console.log('📚 Loading', quizzes.length, 'quizzes into selector');
            
            quizzes.forEach(quiz => {
                const option = document.createElement('option');
                option.value = quiz.id;
                option.textContent = `${quiz.title} (${quiz.totalQuestions} câu)`;
                selector.appendChild(option);
            });
            
            console.log('✅ Quiz selector loaded with', quizzes.length, 'quizzes');
        } else {
            console.warn('⚠️ No quizzes found. Please create a quiz first.');
            
            // Thêm option hướng dẫn
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
    
    // Đợi DOM và quizManager load xong
    setTimeout(() => {
        roomManager.initialize();
    }, 2000);
    
    // Load quiz selector khi chuyển sang tab room
    document.querySelectorAll('[data-tab="room"]').forEach(btn => {
        btn.addEventListener('click', () => {
            setTimeout(() => {
                if (roomManager) {
                    console.log('🔄 Reloading quiz selector on tab switch...');
                    roomManager.loadQuizSelector();
                }
            }, 100);
        });
    });
    
    // Hook vào saveQuizzes để tự động reload
    setTimeout(() => {
        if (window.QuizManager && window.QuizManager.prototype) {
            const originalSaveQuizzes = window.QuizManager.prototype.saveQuizzes;
            window.QuizManager.prototype.saveQuizzes = function() {
                originalSaveQuizzes.call(this);
                console.log('💾 Quiz saved, reloading room selector...');
                // Reload quiz selector sau khi save
                if (window.roomManager) {
                    setTimeout(() => {
                        window.roomManager.loadQuizSelector();
                    }, 100);
                }
            };
            console.log('✅ Hooked into QuizManager.saveQuizzes');
        }
    }, 1000);
    
    // Lắng nghe sự kiện storage change (khi quiz được tạo/sửa/xóa)
    window.addEventListener('storage', (e) => {
        if (e.key === 'quizzes' && window.roomManager) {
            console.log('📦 Quiz storage changed, reloading selector...');
            window.roomManager.loadQuizSelector();
        }
    });
});

// Export
window.roomManager = roomManager;
