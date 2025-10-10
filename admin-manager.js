/**
 * Admin Manager - Quản lý chế độ Admin
 * Mật khẩu: 093701
 */

class AdminManager {
    constructor() {
        this.ADMIN_PASSWORD = '093701';
        this.isAdminMode = false;
        this.init();
    }

    init() {
        // Kiểm tra trạng thái admin từ sessionStorage
        const savedAdminMode = sessionStorage.getItem('adminMode');
        if (savedAdminMode === 'true') {
            this.isAdminMode = true;
            this.enableAdminMode();
        }

        // Thêm event listener cho logo
        const adminTrigger = document.getElementById('admin-logo-trigger');
        if (adminTrigger) {
            adminTrigger.addEventListener('click', () => this.showPasswordModal());
        }

        // Thêm event listener cho Enter key trong password input
        const passwordInput = document.getElementById('admin-password-input');
        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.verifyPassword();
                }
            });
        }

        console.log('✅ Admin Manager initialized');
    }

    showPasswordModal() {
        // Nếu đã ở chế độ admin, hiện menu tùy chọn
        if (this.isAdminMode) {
            this.showAdminMenu();
            return;
        }

        // Hiện modal nhập mật khẩu
        const modal = document.getElementById('admin-password-modal');
        const passwordInput = document.getElementById('admin-password-input');
        const errorMessage = document.getElementById('admin-error-message');

        if (modal) {
            modal.classList.add('active');
            if (passwordInput) {
                passwordInput.value = '';
                passwordInput.focus();
            }
            if (errorMessage) {
                errorMessage.style.display = 'none';
            }
        }
    }

    closePasswordModal() {
        const modal = document.getElementById('admin-password-modal');
        const passwordInput = document.getElementById('admin-password-input');
        const errorMessage = document.getElementById('admin-error-message');

        if (modal) {
            modal.classList.remove('active');
        }
        if (passwordInput) {
            passwordInput.value = '';
        }
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
    }

    verifyPassword() {
        const passwordInput = document.getElementById('admin-password-input');
        const errorMessage = document.getElementById('admin-error-message');

        if (!passwordInput) return;

        const enteredPassword = passwordInput.value.trim();

        if (enteredPassword === this.ADMIN_PASSWORD) {
            // Mật khẩu đúng
            this.isAdminMode = true;
            sessionStorage.setItem('adminMode', 'true');
            this.closePasswordModal();
            this.enableAdminMode();
            this.showSuccessNotification();
            
            // ⭐ TỰ ĐỘNG CHUYỂN VÀO TAB BÁO CÁO
            this.navigateToAnalytics();
        } else {
            // Mật khẩu sai
            if (errorMessage) {
                errorMessage.style.display = 'block';
            }
            passwordInput.value = '';
            passwordInput.focus();

            // Thêm hiệu ứng shake
            passwordInput.style.animation = 'shake 0.5s';
            setTimeout(() => {
                passwordInput.style.animation = '';
            }, 500);
        }
    }

    // Tự động chuyển vào tab Báo Cáo
    navigateToAnalytics() {
        console.log('📊 Navigating to Analytics tab...');
        
        // Đợi một chút để animation hoàn thành
        setTimeout(() => {
            // Tìm và click vào tab Báo Cáo
            const analyticsTab = document.querySelector('[data-tab="analytics"]');
            if (analyticsTab) {
                analyticsTab.click();
                console.log('✅ Switched to Analytics tab');
                
                // Load dashboard nếu adminAnalytics đã sẵn sàng
                setTimeout(() => {
                    if (window.adminAnalytics && typeof window.adminAnalytics.loadDashboard === 'function') {
                        window.adminAnalytics.loadDashboard();
                        console.log('✅ Analytics dashboard loaded');
                    }
                }, 300);
            } else {
                console.warn('⚠️ Analytics tab not found');
            }
        }, 500);
    }

    enableAdminMode() {
        console.log('🔓 Admin mode enabled');

        // Thêm badge Admin vào logo
        this.addAdminBadge();

        // Thêm các nút admin vào tất cả quiz cards
        this.addAdminButtons();

        // Thêm indicator ở header
        this.addAdminIndicator();
    }

    addAdminBadge() {
        const logoTrigger = document.getElementById('admin-logo-trigger');
        if (logoTrigger && !logoTrigger.querySelector('.admin-badge')) {
            const badge = document.createElement('div');
            badge.className = 'admin-badge';
            badge.innerHTML = '<i class="fas fa-crown"></i>';
            badge.style.cssText = `
                position: absolute;
                top: -5px;
                right: -5px;
                background: linear-gradient(135deg, #ffd700, #ffed4e);
                color: #000;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                box-shadow: 0 2px 8px rgba(255, 215, 0, 0.5);
                animation: pulse 2s infinite;
            `;
            logoTrigger.style.position = 'relative';
            logoTrigger.appendChild(badge);
        }
    }

    addAdminIndicator() {
        const header = document.querySelector('.top-header');
        if (header && !header.querySelector('.admin-indicator')) {
            const indicator = document.createElement('div');
            indicator.className = 'admin-indicator';
            indicator.innerHTML = `
                <i class="fas fa-shield-alt"></i>
                <span>Admin Mode</span>
                <button onclick="adminManager.disableAdminMode()" style="margin-left: 10px; padding: 4px 8px; background: rgba(255,255,255,0.2); border: none; border-radius: 4px; color: white; cursor: pointer;">
                    <i class="fas fa-sign-out-alt"></i> Thoát
                </button>
            `;
            indicator.style.cssText = `
                position: fixed;
                top: 10px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                z-index: 10000;
                animation: slideDown 0.3s ease-out;
            `;
            document.body.appendChild(indicator);
        }
    }

    addAdminButtons() {
        // Thêm nút admin cho quiz cards trong home tab
        const homeQuizCards = document.querySelectorAll('#home-quiz-grid .quiz-card');
        homeQuizCards.forEach(card => this.addAdminButtonsToCard(card));

        // Thêm nút admin cho quiz items trong manage tab
        const manageQuizItems = document.querySelectorAll('#quiz-list .quiz-item');
        manageQuizItems.forEach(item => this.addAdminButtonsToQuizItem(item));

        // Thêm nút admin cho shared quiz cards trong explore tab
        const sharedQuizCards = document.querySelectorAll('#shared-quizzes-grid .shared-quiz-card');
        sharedQuizCards.forEach(card => this.addAdminButtonsToSharedCard(card));

        // Override các hàm render để tự động thêm nút admin
        this.overrideRenderFunctions();
    }

    addAdminButtonsToCard(card) {
        if (!card || card.querySelector('.admin-actions')) return;

        const actions = card.querySelector('.quiz-card-actions');
        if (actions) {
            const adminActions = document.createElement('div');
            adminActions.className = 'admin-actions';
            adminActions.style.cssText = `
                display: flex;
                gap: 8px;
                margin-top: 8px;
                padding-top: 8px;
                border-top: 1px solid rgba(102, 126, 234, 0.2);
            `;

            const quizId = card.dataset.quizId;

            adminActions.innerHTML = `
                <button class="btn-admin-edit" onclick="adminManager.adminEditQuiz('${quizId}')" title="Admin Edit">
                    <i class="fas fa-edit"></i> Sửa
                </button>
                <button class="btn-admin-delete" onclick="adminManager.adminDeleteQuiz('${quizId}')" title="Admin Delete">
                    <i class="fas fa-trash"></i> Xóa
                </button>
            `;

            actions.appendChild(adminActions);
        }
    }

    addAdminButtonsToQuizItem(item) {
        if (!item || item.querySelector('.admin-actions')) return;

        const actions = item.querySelector('.quiz-actions');
        if (actions) {
            const adminBtn = document.createElement('button');
            adminBtn.className = 'btn-admin-force-delete';
            adminBtn.innerHTML = '<i class="fas fa-skull-crossbones"></i> Force Delete';
            adminBtn.style.cssText = `
                background: linear-gradient(135deg, #ff0000, #cc0000);
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
                transition: all 0.3s;
            `;
            adminBtn.onmouseover = () => {
                adminBtn.style.transform = 'scale(1.05)';
                adminBtn.style.boxShadow = '0 4px 12px rgba(255, 0, 0, 0.4)';
            };
            adminBtn.onmouseout = () => {
                adminBtn.style.transform = 'scale(1)';
                adminBtn.style.boxShadow = 'none';
            };

            const quizId = item.dataset.quizId;
            adminBtn.onclick = () => this.adminForceDeleteQuiz(quizId);

            actions.appendChild(adminBtn);
        }
    }

    addAdminButtonsToSharedCard(card) {
        if (!card || card.querySelector('.admin-actions')) return;

        const actions = card.querySelector('.shared-quiz-actions');
        if (actions) {
            const adminBtn = document.createElement('button');
            adminBtn.className = 'btn-admin-delete-shared';
            adminBtn.innerHTML = '<i class="fas fa-ban"></i> Admin Delete';
            adminBtn.style.cssText = `
                background: linear-gradient(135deg, #ff4444, #cc0000);
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
                margin-top: 8px;
                width: 100%;
            `;

            const quizId = card.dataset.quizId;
            adminBtn.onclick = () => this.adminDeleteSharedQuiz(quizId);

            actions.appendChild(adminBtn);
        }
    }

    overrideRenderFunctions() {
        // Override renderQuizCard nếu tồn tại
        if (window.quizManager && window.quizManager.renderQuizCard) {
            const originalRenderQuizCard = window.quizManager.renderQuizCard.bind(window.quizManager);
            window.quizManager.renderQuizCard = function(quiz) {
                const card = originalRenderQuizCard(quiz);
                if (adminManager.isAdminMode) {
                    setTimeout(() => {
                        const cardElement = document.querySelector(`[data-quiz-id="${quiz.id}"]`);
                        if (cardElement) {
                            adminManager.addAdminButtonsToCard(cardElement);
                        }
                    }, 100);
                }
                return card;
            };
        }

        // Override renderQuizItem nếu tồn tại
        if (window.quizManager && window.quizManager.renderQuizItem) {
            const originalRenderQuizItem = window.quizManager.renderQuizItem.bind(window.quizManager);
            window.quizManager.renderQuizItem = function(quiz) {
                const item = originalRenderQuizItem(quiz);
                if (adminManager.isAdminMode) {
                    setTimeout(() => {
                        const itemElement = document.querySelector(`#quiz-list [data-quiz-id="${quiz.id}"]`);
                        if (itemElement) {
                            adminManager.addAdminButtonsToQuizItem(itemElement);
                        }
                    }, 100);
                }
                return item;
            };
        }
    }

    adminEditQuiz(quizId) {
        console.log('Admin editing quiz:', quizId);
        if (window.quizManager && window.quizManager.editQuiz) {
            window.quizManager.editQuiz(quizId);
        }
    }

    adminDeleteQuiz(quizId) {
        if (confirm('⚠️ ADMIN MODE: Bạn có chắc chắn muốn xóa quiz này không?')) {
            console.log('Admin deleting quiz:', quizId);
            if (window.quizManager && window.quizManager.deleteQuiz) {
                window.quizManager.deleteQuiz(quizId);
            }
        }
    }

    adminForceDeleteQuiz(quizId) {
        if (confirm('💀 FORCE DELETE: Hành động này không thể hoàn tác! Tiếp tục?')) {
            console.log('Admin force deleting quiz:', quizId);
            
            // Xóa từ localStorage
            const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
            const updatedQuizzes = quizzes.filter(q => q.id !== quizId);
            localStorage.setItem('quizzes', JSON.stringify(updatedQuizzes));

            // Xóa từ Firebase nếu có
            if (window.firebaseQuizManager) {
                window.firebaseQuizManager.deleteQuiz(quizId);
            }

            // Reload trang
            if (window.quizManager && window.quizManager.loadQuizzes) {
                window.quizManager.loadQuizzes();
            }

            this.showSuccessNotification('Quiz đã được xóa hoàn toàn!');
        }
    }

    async adminDeleteSharedQuiz(quizId) {
        if (!quizId) {
            alert('❌ Quiz ID không hợp lệ!');
            return;
        }

        // Hiển thị dialog xác nhận với thông tin chi tiết
        const confirmMessage = `⚠️ ADMIN MODE: XÓA BÀI CHIA SẺ

Bạn có chắc chắn muốn xóa bài này không?

Hành động này sẽ:
✓ Xóa bài khỏi Supabase (nếu có)
✓ Xóa bài khỏi Local Server (nếu có)
✓ Xóa bài khỏi bộ nhớ local
✓ KHÔNG THỂ HOÀN TÁC!

Nhấn OK để xóa, Cancel để hủy.`;

        if (!confirm(confirmMessage)) {
            console.log('Admin cancelled delete operation');
            return;
        }

        console.log('🗑️ Admin deleting shared quiz:', quizId);
        
        try {
            // Hiển thị thông báo đang xóa
            if (window.quizManager && window.quizManager.showToast) {
                window.quizManager.showToast('🗑️ Đang xóa bài...', 'info');
            }

            // ⭐ PHƯƠNG ÁN 1: Thử xóa trực tiếp nếu exploreQuizManager đã sẵn sàng
            if (window.exploreQuizManager && typeof window.exploreQuizManager.deleteSharedQuiz === 'function') {
                console.log('✅ ExploreQuizManager đã sẵn sàng, xóa ngay...');
                const result = await window.exploreQuizManager.deleteSharedQuiz(quizId);
                
                if (result && result.success) {
                    console.log('✅ Quiz deleted successfully');
                    this.showSuccessNotification('✅ Đã xóa bài thành công!');
                    
                    // Reload danh sách quiz sau khi xóa
                    if (window.exploreQuizManager.loadSharedQuizzes) {
                        await window.exploreQuizManager.loadSharedQuizzes();
                    }
                    return;
                } else {
                    throw new Error(result?.message || 'Không thể xóa bài');
                }
            }

            // ⭐ PHƯƠNG ÁN 2: Xóa trực tiếp từ các nguồn (không cần exploreQuizManager)
            console.log('⚡ Xóa trực tiếp từ các nguồn...');
            
            let deleteSuccess = false;
            let deleteMethod = '';
            
            // Xóa từ Supabase
            if (window.supabaseQuizManager && typeof window.supabaseQuizManager.deleteQuiz === 'function') {
                try {
                    console.log('☁️ Attempting to delete from Supabase...');
                    const result = await window.supabaseQuizManager.deleteQuiz(quizId);
                    if (result && result.success) {
                        deleteSuccess = true;
                        deleteMethod = 'Supabase';
                        console.log('✅ Deleted from Supabase successfully');
                    }
                } catch (error) {
                    console.warn('⚠️ Supabase delete error:', error.message);
                }
            }
            
            // Xóa từ Offline Storage
            try {
                console.log('📱 Deleting from offline storage...');
                const offlineQuizzes = JSON.parse(localStorage.getItem('offlineSharedQuizzes') || '[]');
                const filteredQuizzes = offlineQuizzes.filter(q => q.id !== quizId);
                
                if (filteredQuizzes.length < offlineQuizzes.length) {
                    localStorage.setItem('offlineSharedQuizzes', JSON.stringify(filteredQuizzes));
                    console.log('✅ Deleted from offline storage');
                    if (!deleteSuccess) {
                        deleteSuccess = true;
                        deleteMethod = 'Offline Storage';
                    }
                }
            } catch (error) {
                console.warn('⚠️ Offline storage delete error:', error.message);
            }
            
            // Xóa card khỏi DOM
            const quizCard = document.querySelector(`[data-quiz-id="${quizId}"]`);
            if (quizCard) {
                quizCard.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => {
                    quizCard.remove();
                }, 300);
            }
            
            // Cập nhật danh sách nếu exploreQuizManager tồn tại
            if (window.exploreQuizManager && window.exploreQuizManager.sharedQuizzes) {
                window.exploreQuizManager.sharedQuizzes = 
                    window.exploreQuizManager.sharedQuizzes.filter(q => q.id !== quizId);
                
                if (typeof window.exploreQuizManager.renderSharedQuizzes === 'function') {
                    window.exploreQuizManager.renderSharedQuizzes(window.exploreQuizManager.sharedQuizzes);
                }
            }
            
            if (deleteSuccess) {
                this.showSuccessNotification(`✅ Đã xóa bài thành công từ ${deleteMethod}!`);
            } else {
                this.showSuccessNotification('✅ Đã xóa bài khỏi giao diện!');
            }
            
        } catch (error) {
            console.error('❌ Error deleting shared quiz:', error);
            
            // Hiển thị thông báo lỗi đơn giản hơn
            const errorMessage = `❌ LỖI KHI XÓA BÀI:\n\n${error.message}\n\nVui lòng thử lại hoặc reload trang (F5).`;
            alert(errorMessage);
            
            if (window.quizManager && window.quizManager.showToast) {
                window.quizManager.showToast(`❌ Lỗi: ${error.message}`, 'error');
            }
        }
    }

    disableAdminMode() {
        if (confirm('Bạn có muốn thoát khỏi chế độ Admin?')) {
            this.isAdminMode = false;
            sessionStorage.removeItem('adminMode');

            // Xóa admin badge
            const badge = document.querySelector('.admin-badge');
            if (badge) badge.remove();

            // Xóa admin indicator
            const indicator = document.querySelector('.admin-indicator');
            if (indicator) indicator.remove();

            // Xóa tất cả admin buttons
            document.querySelectorAll('.admin-actions, .btn-admin-force-delete, .btn-admin-delete-shared').forEach(el => el.remove());

            this.showSuccessNotification('Đã thoát khỏi chế độ Admin');
            console.log('🔒 Admin mode disabled');
        }
    }

    showAdminMenu() {
        const menu = confirm('Bạn đang ở chế độ Admin.\n\nChọn OK để thoát khỏi chế độ Admin.\nChọn Cancel để tiếp tục.');
        if (menu) {
            this.disableAdminMode();
        }
    }

    showSuccessNotification(message = 'Đã kích hoạt chế độ Admin!') {
        const notification = document.createElement('div');
        notification.className = 'admin-notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
            z-index: 10001;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Thêm CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }

    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    @keyframes pulse {
        0%, 100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.1);
        }
    }

    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }

    .btn-admin-edit,
    .btn-admin-delete {
        padding: 6px 12px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .btn-admin-edit {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
    }

    .btn-admin-delete {
        background: linear-gradient(135deg, #f093fb, #f5576c);
        color: white;
    }

    .btn-admin-edit:hover,
    .btn-admin-delete:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
`;
document.head.appendChild(style);

// Khởi tạo Admin Manager
const adminManager = new AdminManager();
window.adminManager = adminManager;
