// ============================================================================
// ROOM MANAGER - REAL-TIME LEADERBOARD UPDATE
// ============================================================================
// Nâng cấp: Bảng xếp hạng cập nhật tự động khi có người hoàn thành
// ============================================================================

class RoomManagerRealtime extends RoomManager {
    constructor() {
        super();
        
        // Real-time tracking
        this.isModalOpen = false;
        this.currentViewingRoomId = null;
        this.leaderboardRefreshInterval = null;
        this.lastLeaderboardData = null;
        this.notificationSound = null;
        
        console.log('🔄 Room Manager Real-time Mode Activated');
    }

    // ============================================================================
    // OVERRIDE: Show Room Details với Auto-Refresh
    // ============================================================================
    async viewRoomDetails(roomId) {
        try {
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

            // Lưu room hiện tại và bật tracking
            this.currentViewingRoomId = roomId;
            this.lastLeaderboardData = JSON.stringify(room.leaderboard);
            
            this.showRoomDetailsModal(room);
            
            // Bật auto-refresh
            this.startLeaderboardRefresh(roomId);

        } catch (error) {
            console.error('Error viewing room details:', error);
            this.showToast('❌ Lỗi khi xem chi tiết phòng', 'error');
        }
    }

    // ============================================================================
    // OVERRIDE: Show Modal với Real-time Support
    // ============================================================================
    showRoomDetailsModal(room) {
        const modal = document.getElementById('room-details-modal');
        if (!modal) return;

        this.isModalOpen = true;
        const modalContent = modal.querySelector('.room-details-modal-content');
        
        const sortedLeaderboard = (room.leaderboard || []).sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return a.time - b.time;
        });

        const isMyRoom = room.creatorId === this.creatorId;
        const ownerBadge = isMyRoom ? '<span style="background: #10b981; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin-left: 10px;"><i class="fas fa-crown"></i> Phòng của bạn</span>' : '';

        // Tính số người unique
        const uniqueUsers = new Set(sortedLeaderboard.map(e => e.userName));
        const actualParticipants = uniqueUsers.size;

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
                        <div class="room-info-value" id="room-participants-count">${actualParticipants}</div>
                    </div>
                    <div class="room-info-item">
                        <div class="room-info-label">
                            <i class="fas fa-pen"></i>
                            Lượt làm bài
                        </div>
                        <div class="room-info-value" id="room-attempts-count">${room.attempts || 0}</div>
                    </div>
                </div>

                <div class="room-leaderboard-section">
                    <div class="leaderboard-header">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-trophy"></i>
                            <h3>Bảng Xếp Hạng</h3>
                        </div>
                        <div class="leaderboard-refresh-indicator" id="leaderboard-refresh-indicator">
                            <i class="fas fa-sync-alt"></i>
                            <span>Tự động cập nhật</span>
                        </div>
                    </div>
                    
                    <div id="leaderboard-container">
                        ${this.renderLeaderboardTable(sortedLeaderboard)}
                    </div>
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
                    ${isMyRoom ? `
                        <button class="btn-refresh-room" onclick="roomManager.manualRefreshLeaderboard()">
                            <i class="fas fa-sync"></i>
                            Làm Mới
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        modal.classList.add('active');
        
        // Add CSS for refresh indicator
        this.addRefreshIndicatorStyles();
    }

    // ============================================================================
    // Render Leaderboard Table
    // ============================================================================
    renderLeaderboardTable(sortedLeaderboard) {
        if (sortedLeaderboard.length === 0) {
            return `
                <div class="leaderboard-empty">
                    <i class="fas fa-trophy"></i>
                    <p>Chưa có ai hoàn thành bài thi</p>
                    <p>Hãy là người đầu tiên!</p>
                </div>
            `;
        }

        return `
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
                <tbody id="leaderboard-tbody">
                    ${sortedLeaderboard.map((entry, index) => this.renderLeaderboardRow(entry, index)).join('')}
                </tbody>
            </table>
        `;
    }

    // ============================================================================
    // Render Leaderboard Row với Animation
    // ============================================================================
    renderLeaderboardRow(entry, index) {
        const rankIcons = ['🥇', '🥈', '🥉'];
        const rankIcon = index < 3 ? rankIcons[index] : index + 1;
        const rankClass = index < 3 ? `rank-${index + 1}` : '';
        
        return `
            <tr class="leaderboard-row ${rankClass}" data-username="${this.escapeHtml(entry.userName)}">
                <td class="leaderboard-rank ${rankClass}">
                    ${rankIcon}
                </td>
                <td>
                    <div class="leaderboard-player">
                        <div class="leaderboard-avatar">
                            ${entry.userName.charAt(0).toUpperCase()}
                        </div>
                        <span class="leaderboard-name">${this.escapeHtml(entry.userName)}</span>
                        ${index === 0 ? '<span class="top-badge">👑 Top 1</span>' : ''}
                    </div>
                </td>
                <td class="leaderboard-score">${entry.score.toFixed(1)}/10</td>
                <td class="leaderboard-time">${this.formatTime(entry.time)}</td>
                <td class="leaderboard-date">${new Date(entry.completedAt).toLocaleDateString('vi-VN')}</td>
            </tr>
        `;
    }

    // ============================================================================
    // Auto-Refresh Leaderboard
    // ============================================================================
    startLeaderboardRefresh(roomId) {
        // Clear existing interval
        this.stopLeaderboardRefresh();
        
        console.log('🔄 Starting auto-refresh for room:', roomId);
        
        // Refresh every 5 seconds
        this.leaderboardRefreshInterval = setInterval(async () => {
            if (this.isModalOpen && this.currentViewingRoomId === roomId) {
                await this.refreshLeaderboard(roomId);
            } else {
                this.stopLeaderboardRefresh();
            }
        }, 5000);
    }

    stopLeaderboardRefresh() {
        if (this.leaderboardRefreshInterval) {
            clearInterval(this.leaderboardRefreshInterval);
            this.leaderboardRefreshInterval = null;
            console.log('⏹️ Stopped auto-refresh');
        }
    }

    // ============================================================================
    // Refresh Leaderboard Data
    // ============================================================================
    async refreshLeaderboard(roomId) {
        try {
            if (!this.isSupabaseAvailable) return;

            const { data, error } = await window.supabaseQuizManager.supabase
                .from('exam_rooms')
                .select('leaderboard, participants, attempts')
                .eq('id', roomId)
                .single();

            if (error) {
                console.error('Error refreshing leaderboard:', error);
                return;
            }

            if (data) {
                const newLeaderboardData = JSON.stringify(data.leaderboard);
                
                // Check if data changed
                if (newLeaderboardData !== this.lastLeaderboardData) {
                    console.log('🆕 New leaderboard data detected!');
                    
                    // Update UI
                    this.updateLeaderboardUI(data.leaderboard);
                    this.updateStatsUI(data.leaderboard, data.attempts);
                    
                    // Show notification
                    this.showNewResultNotification();
                    
                    // Update last data
                    this.lastLeaderboardData = newLeaderboardData;
                    
                    // Animate refresh indicator
                    this.animateRefreshIndicator();
                }
            }
        } catch (error) {
            console.error('Error in refreshLeaderboard:', error);
        }
    }

    // ============================================================================
    // Update Leaderboard UI
    // ============================================================================
    updateLeaderboardUI(leaderboard) {
        const container = document.getElementById('leaderboard-container');
        if (!container) return;

        const sortedLeaderboard = (leaderboard || []).sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return a.time - b.time;
        });

        // Fade out
        container.style.opacity = '0.5';
        
        setTimeout(() => {
            container.innerHTML = this.renderLeaderboardTable(sortedLeaderboard);
            
            // Fade in
            container.style.transition = 'opacity 0.3s ease';
            container.style.opacity = '1';
        }, 200);
    }

    // ============================================================================
    // Update Stats UI
    // ============================================================================
    updateStatsUI(leaderboard, attempts) {
        // Update participants count (unique users)
        const uniqueUsers = new Set((leaderboard || []).map(e => e.userName));
        const participantsEl = document.getElementById('room-participants-count');
        if (participantsEl) {
            const oldCount = parseInt(participantsEl.textContent) || 0;
            const newCount = uniqueUsers.size;
            
            if (newCount > oldCount) {
                participantsEl.style.animation = 'pulse 0.5s ease';
                setTimeout(() => {
                    participantsEl.style.animation = '';
                }, 500);
            }
            
            participantsEl.textContent = newCount;
        }

        // Update attempts count
        const attemptsEl = document.getElementById('room-attempts-count');
        if (attemptsEl) {
            attemptsEl.textContent = attempts || 0;
        }
    }

    // ============================================================================
    // Show Notification
    // ============================================================================
    showNewResultNotification() {
        // Visual notification
        this.showToast('🎉 Có kết quả mới trên bảng xếp hạng!', 'success');
        
        // Play sound (optional)
        this.playNotificationSound();
    }

    playNotificationSound() {
        try {
            // Simple beep sound using Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            // Ignore sound errors
        }
    }

    // ============================================================================
    // Animate Refresh Indicator
    // ============================================================================
    animateRefreshIndicator() {
        const indicator = document.getElementById('leaderboard-refresh-indicator');
        if (indicator) {
            const icon = indicator.querySelector('i');
            if (icon) {
                icon.style.animation = 'spin 0.5s ease';
                setTimeout(() => {
                    icon.style.animation = '';
                }, 500);
            }
        }
    }

    // ============================================================================
    // Manual Refresh
    // ============================================================================
    async manualRefreshLeaderboard() {
        if (!this.currentViewingRoomId) return;
        
        this.showToast('🔄 Đang làm mới...', 'info');
        await this.refreshLeaderboard(this.currentViewingRoomId);
        this.showToast('✅ Đã cập nhật!', 'success');
    }

    // ============================================================================
    // OVERRIDE: Close Modal
    // ============================================================================
    closeRoomDetailsModal() {
        const modal = document.getElementById('room-details-modal');
        if (modal) {
            modal.classList.remove('active');
        }
        
        // Stop refresh
        this.isModalOpen = false;
        this.currentViewingRoomId = null;
        this.stopLeaderboardRefresh();
        
        console.log('🔒 Modal closed, auto-refresh stopped');
    }

    // ============================================================================
    // Add Refresh Indicator Styles
    // ============================================================================
    addRefreshIndicatorStyles() {
        if (document.getElementById('realtime-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'realtime-styles';
        style.textContent = `
            .leaderboard-refresh-indicator {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px 12px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 500;
                box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
            }

            .leaderboard-refresh-indicator i {
                font-size: 12px;
            }

            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }

            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .leaderboard-row {
                animation: slideInUp 0.3s ease;
                transition: all 0.3s ease;
            }

            .leaderboard-row:hover {
                transform: translateX(5px);
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            .leaderboard-row.rank-1 {
                background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
                font-weight: 600;
            }

            .leaderboard-row.rank-2 {
                background: linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%);
                font-weight: 600;
            }

            .leaderboard-row.rank-3 {
                background: linear-gradient(135deg, #cd7f32 0%, #e8a87c 100%);
                font-weight: 600;
            }

            .top-badge {
                display: inline-block;
                padding: 2px 8px;
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                color: white;
                border-radius: 10px;
                font-size: 11px;
                margin-left: 8px;
                font-weight: 600;
                animation: pulse 2s infinite;
            }

            .btn-refresh-room {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .btn-refresh-room:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }

            .btn-refresh-room:active {
                transform: translateY(0);
            }

            .leaderboard-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }

            .leaderboard-player {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .leaderboard-avatar {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 16px;
            }

            .leaderboard-name {
                font-weight: 500;
            }
        `;
        
        document.head.appendChild(style);
    }

    // ============================================================================
    // OVERRIDE: Save Result to Leaderboard với Participants Update
    // ============================================================================
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
                    .select('leaderboard, attempts')
                    .eq('id', roomId)
                    .single();

                if (data) {
                    const leaderboard = data.leaderboard || [];
                    
                    // Check if user already exists
                    const existingIndex = leaderboard.findIndex(e => e.userName === entry.userName);
                    
                    if (existingIndex >= 0) {
                        // Update if better score
                        if (entry.score > leaderboard[existingIndex].score) {
                            leaderboard[existingIndex] = entry;
                        }
                    } else {
                        // Add new entry
                        leaderboard.push(entry);
                    }

                    // Calculate unique participants
                    const uniqueUsers = new Set(leaderboard.map(e => e.userName));
                    const participants = uniqueUsers.size;

                    // Update database
                    await window.supabaseQuizManager.supabase
                        .from('exam_rooms')
                        .update({ 
                            leaderboard: leaderboard,
                            participants: participants,
                            attempts: (data.attempts || 0) + 1
                        })
                        .eq('id', roomId);

                    console.log('✅ Leaderboard updated:', {
                        userName: entry.userName,
                        score: entry.score,
                        participants: participants
                    });
                }
            }

            this.showToast('📊 Đã lưu kết quả vào bảng xếp hạng!', 'success');

        } catch (error) {
            console.error('Error saving to leaderboard:', error);
            this.showToast('⚠️ Lỗi khi lưu kết quả', 'warning');
        }
    }
}

// ============================================================================
// Initialize Real-time Room Manager
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Replace old roomManager with new one
    if (window.roomManager) {
        console.log('🔄 Upgrading to Real-time Room Manager...');
        
        // Preserve old data
        const oldRooms = window.roomManager.rooms;
        const oldMyRooms = window.roomManager.myRooms;
        
        // Create new instance
        window.roomManager = new RoomManagerRealtime();
        
        // Restore data
        window.roomManager.rooms = oldRooms;
        window.roomManager.myRooms = oldMyRooms;
        
        // Re-initialize
        setTimeout(() => {
            window.roomManager.initialize();
        }, 2000);
        
        console.log('✅ Real-time Room Manager activated!');
    }
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RoomManagerRealtime;
}
