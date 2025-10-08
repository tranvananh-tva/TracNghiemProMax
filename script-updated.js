// Updated Layout Integration Script
document.addEventListener('DOMContentLoaded', function() {
    initUpdatedLayout();
});

function initUpdatedLayout() {
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        });
        
        // Restore sidebar state
        if (localStorage.getItem('sidebarCollapsed') === 'true') {
            sidebar.classList.add('collapsed');
        }
    }
    
    // Navigation items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = item.dataset.tab;
            
            // Update active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Switch tab using existing quizManager
            if (typeof quizManager !== 'undefined') {
                quizManager.switchTab(tab);
            }
        });
    });
    
    // Create quiz button in header
    const createQuizBtn = document.querySelector('.btn-create-quiz');
    if (createQuizBtn) {
        createQuizBtn.addEventListener('click', () => {
            if (typeof quizManager !== 'undefined') {
                quizManager.switchTab('input');
                
                // Update nav active state
                navItems.forEach(nav => nav.classList.remove('active'));
                document.querySelector('.nav-item[data-tab="input"]').classList.add('active');
            }
        });
    }
    
    // View more link
    const viewMoreLink = document.querySelector('.view-more');
    if (viewMoreLink) {
        viewMoreLink.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = viewMoreLink.dataset.tab;
            if (typeof quizManager !== 'undefined') {
                quizManager.switchTab(tab);
                
                // Update nav active state
                navItems.forEach(nav => nav.classList.remove('active'));
                document.querySelector(`.nav-item[data-tab="${tab}"]`).classList.add('active');
            }
        });
    }
    
    // Create quiz buttons in empty states
    const createBtns = document.querySelectorAll('.btn-primary[data-tab]');
    createBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            if (typeof quizManager !== 'undefined') {
                quizManager.switchTab(tab);
                
                // Update nav active state
                navItems.forEach(nav => nav.classList.remove('active'));
                document.querySelector(`.nav-item[data-tab="${tab}"]`).classList.add('active');
            }
        });
    });
    
    // Mobile sidebar handling
    function handleMobileSidebar() {
        if (window.innerWidth <= 1024) {
            sidebar.classList.remove('collapsed');
            
            // Close sidebar by default on mobile
            sidebar.classList.remove('open');
            
            // Toggle sidebar on mobile
            sidebarToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                sidebar.classList.toggle('open');
            });
            
            // Close sidebar when clicking outside
            document.addEventListener('click', (e) => {
                if (sidebar.classList.contains('open') && 
                    !sidebar.contains(e.target) && 
                    !sidebarToggle.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            });
            
            // Close sidebar when clicking nav item on mobile
            navItems.forEach(item => {
                item.addEventListener('click', () => {
                    if (window.innerWidth <= 1024) {
                        sidebar.classList.remove('open');
                    }
                });
            });
        } else {
            // Desktop behavior
            sidebar.classList.remove('open');
        }
    }
    
    handleMobileSidebar();
    
    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            handleMobileSidebar();
        }, 250);
    });
    
    // Load home quiz grid
    loadHomeQuizGrid();
    
    // Update stats
    updateStats();
    
    // Override quizManager's switchTab to update nav
    if (typeof quizManager !== 'undefined') {
        const originalSwitchTab = quizManager.switchTab.bind(quizManager);
        quizManager.switchTab = function(tabName) {
            originalSwitchTab(tabName);
            
            // Update nav active state
            navItems.forEach(nav => nav.classList.remove('active'));
            const activeNav = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
            if (activeNav) {
                activeNav.classList.add('active');
            }
            
            // Reload home grid when switching to home
            if (tabName === 'home') {
                loadHomeQuizGrid();
                updateStats();
            }
        };
        
        // Override processQuiz to reload home
        const originalProcessQuiz = quizManager.processQuiz.bind(quizManager);
        quizManager.processQuiz = function() {
            originalProcessQuiz();
            // Reload home grid after creating quiz
            setTimeout(() => {
                loadHomeQuizGrid();
                updateStats();
            }, 100);
        };
        
        // Override deleteQuiz to reload home
        const originalDeleteQuiz = quizManager.deleteQuiz.bind(quizManager);
        quizManager.deleteQuiz = function(quizId) {
            originalDeleteQuiz(quizId);
            loadHomeQuizGrid();
            updateStats();
        };
    }
}

function loadHomeQuizGrid() {
    const quizGrid = document.getElementById('home-quiz-grid');
    if (!quizGrid) return;
    
    const quizzes = JSON.parse(localStorage.getItem('quizzes')) || [];
    
    if (quizzes.length === 0) {
        quizGrid.innerHTML = `
            <div class="empty-state-card">
                <i class="fas fa-folder-open"></i>
                <h3>Chưa có quiz nào</h3>
                <p>Hãy tạo quiz đầu tiên của bạn!</p>
                <button class="btn-primary" data-tab="input">
                    <i class="fas fa-plus"></i>
                    Tạo quiz mới
                </button>
            </div>
        `;
        
        // Re-attach event listener
        const createBtn = quizGrid.querySelector('.btn-primary[data-tab]');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                if (typeof quizManager !== 'undefined') {
                    quizManager.switchTab('input');
                }
            });
        }
        return;
    }
    
    // Show only recent 6 quizzes
    const recentQuizzes = quizzes.slice(-6).reverse();
    
    const quizCards = recentQuizzes.map(quiz => `
        <div class="quiz-card" onclick="startQuizFromHome('${quiz.id}')">
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
                <button class="btn-quiz-action">
                    <i class="fas fa-play"></i>
                    Vào ôn thi
                </button>
            </div>
        </div>
    `).join('');
    
    quizGrid.innerHTML = quizCards;
}

function startQuizFromHome(quizId) {
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

function updateStats() {
    const quizzes = JSON.parse(localStorage.getItem('quizzes')) || [];
    const results = JSON.parse(localStorage.getItem('quizResults')) || [];
    
    // Total quizzes
    const totalQuizzesEl = document.getElementById('total-quizzes');
    if (totalQuizzesEl) {
        totalQuizzesEl.textContent = quizzes.length;
    }
    
    // Completed quizzes
    const completedQuizzesEl = document.getElementById('completed-quizzes');
    if (completedQuizzesEl) {
        completedQuizzesEl.textContent = results.length;
    }
    
    // Average score
    const averageScoreEl = document.getElementById('average-score');
    if (averageScoreEl && results.length > 0) {
        const totalScore = results.reduce((sum, result) => sum + result.score, 0);
        const avgScore = (totalScore / results.length).toFixed(1);
        averageScoreEl.textContent = avgScore;
    } else if (averageScoreEl) {
        averageScoreEl.textContent = '0';
    }
}

// Add quiz card styles
const quizCardStyles = document.createElement('style');
quizCardStyles.textContent = `
    .quiz-card {
        background: var(--bg-primary);
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid var(--border-color);
        transition: var(--transition);
        cursor: pointer;
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
`;
document.head.appendChild(quizCardStyles);
