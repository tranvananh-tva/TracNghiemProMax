// Modern Layout JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initModernLayout();
});

function initModernLayout() {
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        });
    }
    
    // Restore sidebar state
    if (localStorage.getItem('sidebarCollapsed') === 'true') {
        sidebar.classList.add('collapsed');
    }
    
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
        
        // Restore theme
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
        }
    }
    
    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navigateToPage(page);
            
            // Update active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });
    
    // Content tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            
            // Update active state
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show corresponding content
            // This can be expanded based on your needs
        });
    });
    
    // Mobile sidebar
    if (window.innerWidth <= 1024) {
        sidebar.classList.add('collapsed');
        
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
        
        // Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }
    
    // Load quiz list
    loadQuizGrid();
    
    // Form handlers
    const processQuizBtn = document.getElementById('process-quiz');
    if (processQuizBtn) {
        processQuizBtn.addEventListener('click', handleCreateQuiz);
    }
    
    const clearInputBtn = document.getElementById('clear-input');
    if (clearInputBtn) {
        clearInputBtn.addEventListener('click', clearQuizForm);
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    const icon = document.querySelector('#theme-toggle i');
    
    if (isDark) {
        icon.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('theme', 'dark');
    } else {
        icon.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('theme', 'light');
    }
}

function navigateToPage(page) {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(p => {
        p.classList.remove('active');
    });
    
    // Show selected page
    const pageElement = document.getElementById(`page-${page}`);
    if (pageElement) {
        pageElement.classList.add('active');
    }
    
    // Special handling for different pages
    switch(page) {
        case 'home':
            loadQuizGrid();
            break;
        case 'manage-quiz':
            loadManageQuizList();
            break;
        case 'create':
            // Already on create page
            break;
    }
}

function showCreateQuizModal() {
    const modal = document.getElementById('create-quiz-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeCreateQuizModal() {
    const modal = document.getElementById('create-quiz-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function navigateToCreate() {
    closeCreateQuizModal();
    navigateToPage('create');
    
    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
}

function loadQuizGrid() {
    const quizGrid = document.getElementById('quiz-grid');
    if (!quizGrid) return;
    
    // Get quizzes from localStorage (using existing quizManager data)
    const quizzes = JSON.parse(localStorage.getItem('quizzes')) || [];
    
    if (quizzes.length === 0) {
        quizGrid.innerHTML = `
            <div class="empty-state-card">
                <i class="fas fa-folder-open"></i>
                <h3>Chưa có đề thi nào</h3>
                <p>Hãy tạo đề thi đầu tiên của bạn!</p>
                <button class="btn-primary" onclick="showCreateQuizModal()">
                    <i class="fas fa-plus"></i>
                    Tạo đề thi mới
                </button>
            </div>
        `;
        return;
    }
    
    // Render quiz cards
    const quizCards = quizzes.map(quiz => `
        <div class="quiz-card">
            <div class="quiz-card-image">
                <i class="fas fa-book"></i>
            </div>
            <div class="quiz-card-content">
                <h3 class="quiz-card-title">${quiz.title}</h3>
                <p class="quiz-card-description">${quiz.description || 'Không có mô tả'}</p>
                <div class="quiz-card-meta">
                    <span><i class="fas fa-question-circle"></i> ${quiz.totalQuestions} câu</span>
                    <span><i class="fas fa-calendar"></i> ${new Date(quiz.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
            </div>
            <div class="quiz-card-actions">
                <button class="btn-quiz-action" onclick="startQuizFromCard('${quiz.id}')">
                    <i class="fas fa-play"></i>
                    Vào ôn thi
                </button>
            </div>
        </div>
    `).join('');
    
    quizGrid.innerHTML = quizCards;
}

function loadManageQuizList() {
    const quizList = document.getElementById('quiz-list');
    if (!quizList) return;
    
    const quizzes = JSON.parse(localStorage.getItem('quizzes')) || [];
    
    if (quizzes.length === 0) {
        quizList.innerHTML = `
            <div class="empty-state-card">
                <i class="fas fa-folder-open"></i>
                <h3>Chưa có đề thi nào</h3>
                <p>Hãy tạo đề thi đầu tiên của bạn!</p>
            </div>
        `;
        return;
    }
    
    // Render quiz management list
    const quizItems = quizzes.map(quiz => `
        <div class="quiz-manage-item">
            <div class="quiz-manage-info">
                <h3>${quiz.title}</h3>
                <p>${quiz.description}</p>
                <div class="quiz-manage-meta">
                    <span><i class="fas fa-question-circle"></i> ${quiz.totalQuestions} câu</span>
                    <span><i class="fas fa-calendar"></i> ${new Date(quiz.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
            </div>
            <div class="quiz-manage-actions">
                <button class="btn-secondary" onclick="editQuizModern('${quiz.id}')">
                    <i class="fas fa-edit"></i>
                    Sửa
                </button>
                <button class="btn-secondary" onclick="duplicateQuizModern('${quiz.id}')">
                    <i class="fas fa-copy"></i>
                    Sao chép
                </button>
                <button class="btn-secondary" onclick="deleteQuizModern('${quiz.id}')">
                    <i class="fas fa-trash"></i>
                    Xóa
                </button>
            </div>
        </div>
    `).join('');
    
    quizList.innerHTML = quizItems;
}

function handleCreateQuiz() {
    const title = document.getElementById('quiz-title').value.trim();
    const description = document.getElementById('quiz-description').value.trim();
    const questionsText = document.getElementById('questions-input').value.trim();
    const answersText = document.getElementById('answers-input').value.trim();
    
    if (!title) {
        showToast('Vui lòng nhập tên đề thi!', 'error');
        return;
    }
    
    if (!questionsText || !answersText) {
        showToast('Vui lòng nhập đầy đủ câu hỏi và đáp án!', 'error');
        return;
    }
    
    // Use existing quizManager if available
    if (typeof quizManager !== 'undefined') {
        quizManager.processQuiz();
        clearQuizForm();
        navigateToPage('home');
    } else {
        showToast('Đang xử lý...', 'info');
    }
}

function clearQuizForm() {
    document.getElementById('quiz-title').value = '';
    document.getElementById('quiz-description').value = '';
    document.getElementById('questions-input').value = '';
    document.getElementById('answers-input').value = '';
}

function startQuizFromCard(quizId) {
    // Use existing quizManager if available
    if (typeof quizManager !== 'undefined') {
        // Set the quiz selector
        const selector = document.getElementById('quiz-selector');
        if (selector) {
            selector.value = quizId;
            document.getElementById('start-quiz').disabled = false;
        }
        
        // Switch to quiz tab
        quizManager.switchTab('quiz');
        
        // Start quiz
        setTimeout(() => {
            quizManager.startQuiz();
        }, 100);
    }
}

function editQuizModern(quizId) {
    if (typeof quizManager !== 'undefined') {
        quizManager.editQuiz(quizId);
    }
}

function duplicateQuizModern(quizId) {
    if (typeof quizManager !== 'undefined') {
        quizManager.duplicateQuiz(quizId);
        loadManageQuizList();
    }
}

function deleteQuizModern(quizId) {
    if (typeof quizManager !== 'undefined') {
        if (confirm('Bạn có chắc chắn muốn xóa đề thi này?')) {
            quizManager.deleteQuiz(quizId);
            loadManageQuizList();
            loadQuizGrid();
        }
    }
}

function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Add toast styles
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    .toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 10000;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
    }
    
    .toast i {
        font-size: 20px;
    }
    
    .toast-success {
        border-left: 4px solid #10b981;
    }
    
    .toast-success i {
        color: #10b981;
    }
    
    .toast-error {
        border-left: 4px solid #ef4444;
    }
    
    .toast-error i {
        color: #ef4444;
    }
    
    .toast-info {
        border-left: 4px solid #3b82f6;
    }
    
    .toast-info i {
        color: #3b82f6;
    }
    
    .quiz-card {
        background: var(--bg-primary);
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid var(--border-color);
        transition: var(--transition);
    }
    
    .quiz-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
    }
    
    .quiz-card-image {
        height: 150px;
        background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 48px;
    }
    
    .quiz-card-content {
        padding: 20px;
    }
    
    .quiz-card-title {
        font-size: 16px;
        font-weight: 700;
        margin-bottom: 8px;
        color: var(--text-primary);
    }
    
    .quiz-card-description {
        font-size: 14px;
        color: var(--text-secondary);
        margin-bottom: 12px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    
    .quiz-card-meta {
        display: flex;
        gap: 16px;
        font-size: 13px;
        color: var(--text-tertiary);
    }
    
    .quiz-card-meta span {
        display: flex;
        align-items: center;
        gap: 6px;
    }
    
    .quiz-card-actions {
        padding: 16px 20px;
        border-top: 1px solid var(--border-color);
    }
    
    .btn-quiz-action {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 10px 20px;
        background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: var(--transition);
    }
    
    .btn-quiz-action:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
    }
    
    .quiz-manage-item {
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
    }
    
    .quiz-manage-info {
        flex: 1;
    }
    
    .quiz-manage-info h3 {
        font-size: 18px;
        font-weight: 700;
        margin-bottom: 8px;
        color: var(--text-primary);
    }
    
    .quiz-manage-info p {
        font-size: 14px;
        color: var(--text-secondary);
        margin-bottom: 12px;
    }
    
    .quiz-manage-meta {
        display: flex;
        gap: 16px;
        font-size: 13px;
        color: var(--text-tertiary);
    }
    
    .quiz-manage-meta span {
        display: flex;
        align-items: center;
        gap: 6px;
    }
    
    .quiz-manage-actions {
        display: flex;
        gap: 8px;
    }
`;
document.head.appendChild(toastStyles);
