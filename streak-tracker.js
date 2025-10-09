// ==================== STREAK TRACKING SYSTEM ====================
// Hệ thống theo dõi chuỗi ngày học

// Khởi tạo streak tracking khi trang load
function initializeStreakTracking() {
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const streakData = JSON.parse(localStorage.getItem('streakData')) || {
        visitHistory: [],
        activityDates: {}, // { "2025-01-17": { visits: 1, quizzesCompleted: 0 } }
        currentStreak: 0,
        longestStreak: 0,
        lastVisitDate: null,
        totalVisits: 0
    };
    
    // Nếu chưa vào hôm nay
    if (streakData.lastVisitDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        // Kiểm tra có liên tục không
        if (streakData.lastVisitDate === yesterdayStr) {
            // Liên tục - tăng streak
            streakData.currentStreak++;
        } else if (streakData.lastVisitDate === null) {
            // Lần đầu tiên
            streakData.currentStreak = 1;
        } else {
            // Không liên tục - reset streak
            streakData.currentStreak = 1;
        }
        
        // Cập nhật longest streak
        if (streakData.currentStreak > streakData.longestStreak) {
            streakData.longestStreak = streakData.currentStreak;
        }
        
        // Thêm ngày hôm nay vào lịch sử
        if (!streakData.visitHistory.includes(today)) {
            streakData.visitHistory.push(today);
        }
        
        // Khởi tạo activity cho ngày hôm nay
        if (!streakData.activityDates[today]) {
            streakData.activityDates[today] = {
                visits: 1,
                quizzesCompleted: 0,
                firstVisitTime: new Date().toISOString()
            };
        }
        
        // Giữ lại 90 ngày gần nhất
        if (streakData.visitHistory.length > 90) {
            const oldDates = streakData.visitHistory.slice(0, -90);
            streakData.visitHistory = streakData.visitHistory.slice(-90);
            
            // Xóa activity cũ
            oldDates.forEach(date => {
                delete streakData.activityDates[date];
            });
        }
        
        // Cập nhật ngày truy cập cuối
        streakData.lastVisitDate = today;
        streakData.totalVisits++;
        
        // Lưu vào localStorage
        localStorage.setItem('streakData', JSON.stringify(streakData));
        
        // Hiển thị thông báo động viên
        showStreakNotification(streakData.currentStreak);
    } else {
        // Đã vào hôm nay rồi, tăng số lần visit
        if (streakData.activityDates[today]) {
            streakData.activityDates[today].visits++;
            localStorage.setItem('streakData', JSON.stringify(streakData));
        }
    }
    
    // Cập nhật hiển thị
    updateStreakDisplay();
}

// Hiển thị thông báo động viên
function showStreakNotification(streak) {
    if (typeof quizManager === 'undefined') return;
    
    if (streak === 1) {
        quizManager.showToast('🎯 Bắt đầu chuỗi ngày học mới!', 'success');
    } else if (streak === 7) {
        quizManager.showToast('🎉 Xuất sắc! Bạn đã học 1 tuần liên tục!', 'success');
    } else if (streak === 30) {
        quizManager.showToast('🏆 Tuyệt vời! Bạn đã học 1 tháng liên tục!', 'success');
    } else if (streak > 1) {
        quizManager.showToast(`🔥 Chuỗi ngày học: ${streak} ngày!`, 'success');
    }
}

// Cập nhật hiển thị streak trên giao diện
function updateStreakDisplay() {
    const today = new Date().toISOString().split('T')[0];
    const streakData = JSON.parse(localStorage.getItem('streakData')) || {
        currentStreak: 0,
        longestStreak: 0,
        activityDates: {}
    };
    
    const streakDaysEl = document.getElementById('streak-days');
    const streakMessageEl = document.getElementById('streak-message');
    
    if (streakDaysEl) {
        streakDaysEl.textContent = streakData.currentStreak;
    }
    
    // Lấy số quiz đã làm hôm nay
    const todayQuizCount = streakData.activityDates[today] ? streakData.activityDates[today].quizzesCompleted : 0;
    
    if (streakMessageEl) {
        if (todayQuizCount === 0) {
            if (streakData.currentStreak === 0) {
                streakMessageEl.textContent = 'Bắt đầu học hôm nay!';
            } else if (streakData.currentStreak === 1) {
                streakMessageEl.textContent = 'Tiếp tục để tạo chuỗi!';
            } else if (streakData.currentStreak >= 7) {
                streakMessageEl.textContent = `Kỷ lục: ${streakData.longestStreak} ngày 🏆`;
            } else {
                streakMessageEl.textContent = `Tiếp tục phát huy! 💪`;
            }
        } else {
            // Hiển thị số quiz đã làm hôm nay với emoji động lực
            let emoji = '📚';
            if (todayQuizCount >= 5) emoji = '🏆';
            else if (todayQuizCount >= 3) emoji = '⭐';
            else if (todayQuizCount >= 2) emoji = '🔥';
            
            streakMessageEl.innerHTML = `${emoji} Hôm nay: <strong>${todayQuizCount} quiz</strong>`;
        }
    }
    
    // Thêm badge số quiz vào streak card
    updateStreakBadge(todayQuizCount);
}

// Cập nhật badge hiển thị số quiz trong ngày
function updateStreakBadge(quizCount) {
    const streakCard = document.querySelector('.streak-card');
    if (!streakCard) return;
    
    // Xóa badge cũ nếu có
    const oldBadge = streakCard.querySelector('.quiz-count-badge');
    if (oldBadge) {
        oldBadge.remove();
    }
    
    // Chỉ hiển thị badge khi đã làm ít nhất 1 quiz
    if (quizCount > 0) {
        const badge = document.createElement('div');
        badge.className = 'quiz-count-badge';
        
        // Thay đổi màu badge dựa trên số quiz
        let badgeClass = '';
        if (quizCount >= 5) badgeClass = 'badge-gold';
        else if (quizCount >= 3) badgeClass = 'badge-purple';
        else if (quizCount >= 2) badgeClass = 'badge-orange';
        else badgeClass = 'badge-blue';
        
        badge.classList.add(badgeClass);
        badge.textContent = `+${quizCount}`;
        badge.title = `Đã hoàn thành ${quizCount} quiz hôm nay`;
        
        streakCard.appendChild(badge);
        
        // Animation khi thêm badge
        setTimeout(() => {
            badge.classList.add('badge-show');
        }, 10);
    }
}

// Ghi nhận hoàn thành quiz
function recordQuizCompletion() {
    const today = new Date().toISOString().split('T')[0];
    const streakData = JSON.parse(localStorage.getItem('streakData')) || {
        visitHistory: [],
        activityDates: {},
        currentStreak: 0,
        longestStreak: 0,
        lastVisitDate: today,
        totalVisits: 0
    };
    
    // Cập nhật số quiz hoàn thành trong ngày
    if (!streakData.activityDates[today]) {
        streakData.activityDates[today] = {
            visits: 1,
            quizzesCompleted: 1,
            firstVisitTime: new Date().toISOString()
        };
    } else {
        streakData.activityDates[today].quizzesCompleted++;
    }
    
    localStorage.setItem('streakData', JSON.stringify(streakData));
    
    // Cập nhật hiển thị streak
    updateStreakDisplay();
    
    // Hiển thị thông báo động viên dựa trên số quiz đã làm
    showQuizCompletionMotivation(streakData.activityDates[today].quizzesCompleted);
}

// Hiển thị thông báo động viên khi hoàn thành quiz
function showQuizCompletionMotivation(quizCount) {
    if (typeof quizManager === 'undefined') return;
    
    let message = '';
    let type = 'success';
    
    if (quizCount === 1) {
        message = '🎯 Bài quiz đầu tiên trong ngày! Hãy tiếp tục!';
    } else if (quizCount === 2) {
        message = '🔥 Tuyệt vời! Bạn đã hoàn thành 2 bài quiz hôm nay!';
    } else if (quizCount === 3) {
        message = '⭐ Xuất sắc! 3 bài quiz rồi! Bạn đang rất chăm chỉ!';
    } else if (quizCount === 5) {
        message = '🏆 Wow! 5 bài quiz trong 1 ngày! Bạn là nhà vô địch!';
    } else if (quizCount >= 10) {
        message = '👑 Không thể tin được! ' + quizCount + ' bài quiz! Bạn là huyền thoại!';
    } else if (quizCount > 5) {
        message = '💪 Tuyệt vời! Đã hoàn thành ' + quizCount + ' bài quiz hôm nay!';
    }
    
    if (message) {
        setTimeout(() => {
            quizManager.showToast(message, type);
            
            // Hiệu ứng animation cho streak card
            animateStreakCard();
        }, 500);
    }
}

// Animation cho streak card
function animateStreakCard() {
    const streakCard = document.querySelector('.streak-card');
    if (streakCard) {
        streakCard.classList.add('streak-pulse');
        setTimeout(() => {
            streakCard.classList.remove('streak-pulse');
        }, 1000);
    }
}

// Hiển thị chi tiết streak
function showStreakDetails() {
    const streakData = JSON.parse(localStorage.getItem('streakData')) || {
        visitHistory: [],
        activityDates: {},
        currentStreak: 0,
        longestStreak: 0,
        totalVisits: 0
    };
    
    // Tạo modal hiển thị chi tiết
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'streak-modal';
    
    // Tạo calendar view cho 30 ngày gần nhất
    const today = new Date();
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last30Days.push({
            date: dateStr,
            dayName: date.toLocaleDateString('vi-VN', { weekday: 'short' }),
            dayNum: date.getDate(),
            hasActivity: streakData.visitHistory.includes(dateStr),
            activity: streakData.activityDates[dateStr] || null
        });
    }
    
    const calendarHTML = last30Days.map(day => {
        const activityClass = day.hasActivity ? 'has-activity' : 'no-activity';
        const quizCount = day.activity ? day.activity.quizzesCompleted : 0;
        const intensityClass = quizCount >= 3 ? 'high' : quizCount >= 1 ? 'medium' : '';
        
        return `
            <div class="calendar-day ${activityClass} ${intensityClass}" 
                 title="${day.date}${day.activity ? `\nĐã vào: ${day.activity.visits} lần\nQuiz hoàn thành: ${quizCount}` : ''}">
                <div class="day-name">${day.dayName}</div>
                <div class="day-num">${day.dayNum}</div>
                ${day.hasActivity ? '<div class="activity-dot"></div>' : ''}
            </div>
        `;
    }).join('');
    
    modal.innerHTML = `
        <div class="modal-overlay" onclick="document.getElementById('streak-modal').remove()"></div>
        <div class="modal-content streak-modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-fire"></i> Chi Tiết Chuỗi Ngày Học</h3>
                <button class="modal-close" onclick="document.getElementById('streak-modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="streak-stats-grid">
                    <div class="streak-stat-item">
                        <div class="streak-stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                            <i class="fas fa-fire"></i>
                        </div>
                        <div class="streak-stat-content">
                            <div class="streak-stat-label">Chuỗi hiện tại</div>
                            <div class="streak-stat-value">${streakData.currentStreak} ngày</div>
                        </div>
                    </div>
                    <div class="streak-stat-item">
                        <div class="streak-stat-icon" style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);">
                            <i class="fas fa-trophy"></i>
                        </div>
                        <div class="streak-stat-content">
                            <div class="streak-stat-label">Kỷ lục</div>
                            <div class="streak-stat-value">${streakData.longestStreak} ngày</div>
                        </div>
                    </div>
                    <div class="streak-stat-item">
                        <div class="streak-stat-icon" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);">
                            <i class="fas fa-calendar-check"></i>
                        </div>
                        <div class="streak-stat-content">
                            <div class="streak-stat-label">Tổng ngày học</div>
                            <div class="streak-stat-value">${streakData.visitHistory.length} ngày</div>
                        </div>
                    </div>
                    <div class="streak-stat-item">
                        <div class="streak-stat-icon" style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="streak-stat-content">
                            <div class="streak-stat-label">Tổng lượt truy cập</div>
                            <div class="streak-stat-value">${streakData.totalVisits}</div>
                        </div>
                    </div>
                </div>
                
                <div class="streak-calendar-section">
                    <h4><i class="fas fa-calendar-alt"></i> Lịch Sử 30 Ngày Gần Nhất</h4>
                    <div class="streak-calendar">
                        ${calendarHTML}
                    </div>
                    <div class="calendar-legend">
                        <div class="legend-item">
                            <div class="legend-box no-activity"></div>
                            <span>Chưa học</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-box has-activity"></div>
                            <span>Đã học</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-box has-activity medium"></div>
                            <span>1-2 quiz</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-box has-activity high"></div>
                            <span>3+ quiz</span>
                        </div>
                    </div>
                </div>
                
                <div class="streak-motivation">
                    ${getStreakMotivation(streakData.currentStreak)}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Lấy thông điệp động viên dựa trên streak
function getStreakMotivation(streak) {
    if (streak === 0) {
        return `
            <div class="motivation-card">
                <i class="fas fa-rocket"></i>
                <h4>Bắt đầu hành trình học tập!</h4>
                <p>Hãy hoàn thành một bài quiz hôm nay để bắt đầu chuỗi ngày học của bạn.</p>
            </div>
        `;
    } else if (streak < 7) {
        return `
            <div class="motivation-card">
                <i class="fas fa-seedling"></i>
                <h4>Đang trên đà tốt!</h4>
                <p>Bạn đã học ${streak} ngày liên tục. Hãy tiếp tục để đạt mốc 1 tuần!</p>
            </div>
        `;
    } else if (streak < 30) {
        return `
            <div class="motivation-card">
                <i class="fas fa-star"></i>
                <h4>Tuyệt vời!</h4>
                <p>Chuỗi ${streak} ngày thật ấn tượng! Mục tiêu tiếp theo: 1 tháng liên tục!</p>
            </div>
        `;
    } else {
        return `
            <div class="motivation-card">
                <i class="fas fa-crown"></i>
                <h4>Bạn là nhà vô địch!</h4>
                <p>Chuỗi ${streak} ngày học liên tục! Bạn đã xây dựng được thói quen học tập tuyệt vời!</p>
            </div>
        `;
    }
}

// Khởi tạo khi DOM ready
document.addEventListener('DOMContentLoaded', function() {
    // Đợi một chút để đảm bảo các element đã load
    setTimeout(() => {
        initializeStreakTracking();
    }, 100);
});
