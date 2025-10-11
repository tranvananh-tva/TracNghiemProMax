// ============================================================================
// MODERN QUIZ LAYOUT - FIXED VERSION
// ============================================================================
// Khắc phục lỗi currentQuiz bị null khi làm bài từ thiết bị khác
// ============================================================================

// ⭐ THÊM VÀO QUIZMANAGER CLASS
QuizManager.prototype.renderQuizModern = function() {
    console.log('🎨 renderQuizModern called');
    
    // ⭐ KIỂM TRA VÀ KHÔI PHỤC CURRENTQUIZ
    if (!this.currentQuiz || !this.currentQuiz.questions) {
        console.error('❌ Cannot render quiz: currentQuiz is null');
        
        // Thử khôi phục từ backup
        if (this._quizBackup && this._quizBackup.questions) {
            console.log('🔄 Restoring from _quizBackup...');
            this.currentQuiz = JSON.parse(JSON.stringify(this._quizBackup));
        }
        // Thử khôi phục từ localStorage
        else if (typeof restoreQuizFromBackup === 'function' && restoreQuizFromBackup()) {
            console.log('🔄 Restored from localStorage backup');
        }
        // Thử khôi phục từ roomManager
        else if (window.roomManager && window.roomManager.currentRoom && window.roomManager.currentRoom.quiz) {
            console.log('🔄 Restoring from roomManager...');
            const room = window.roomManager.currentRoom;
            this.currentQuiz = {
                id: room.quiz.id,
                title: room.quiz.title,
                description: room.quiz.description || '',
                questions: JSON.parse(JSON.stringify(room.quiz.questions)),
                totalQuestions: room.quiz.totalQuestions || room.quiz.questions.length,
                isRoomQuiz: true,
                roomId: room.id,
                roomCode: room.code,
                roomName: room.name,
                userName: room.userName
            };
            this._quizBackup = JSON.parse(JSON.stringify(this.currentQuiz));
        }
        
        // Nếu vẫn không khôi phục được
        if (!this.currentQuiz || !this.currentQuiz.questions) {
            const container = document.getElementById('quiz-container');
            if (container) {
                container.innerHTML = `
                    <div class="quiz-placeholder">
                        <i class="fas fa-exclamation-triangle" style="font-size: 64px; color: #f59e0b;"></i>
                        <h3>Lỗi tải bài thi</h3>
                        <p>Không thể tải bài thi. Vui lòng thử lại.</p>
                        <button class="btn-primary" onclick="location.reload()">
                            <i class="fas fa-sync"></i>
                            Tải lại trang
                        </button>
                    </div>
                `;
            }
            return;
        }
    }

    console.log('✅ Quiz data validated:', {
        title: this.currentQuiz.title,
        questionCount: this.currentQuiz.questions.length
    });

    const container = document.getElementById('quiz-container');
    this.currentQuestionIndex = 0;
    
    const quizHTML = `
        <div class="modern-quiz-layout">
            <!-- Left Sidebar -->
            <div class="quiz-sidebar-left">
                <div class="quiz-info-card">
                    <h3 class="quiz-title-sidebar">${this.escapeHtml(this.currentQuiz.title)}</h3>
                    <p class="quiz-mode">Chế độ: ${this.currentQuiz.isRoomQuiz ? 'Phòng thi' : 'Ôn thi'}</p>
                    ${this.currentQuiz.isRoomQuiz ? `<p class="quiz-room-info"><i class="fas fa-door-open"></i> ${this.escapeHtml(this.currentQuiz.roomName)}</p>` : ''}
                </div>
                
                <div class="quiz-timer-card">
                    <div class="timer-label">Thời gian làm bài</div>
                    <div class="timer-display" id="quiz-timer">00:00:00</div>
                </div>
                
                <div class="quiz-settings-card">
                    <label class="setting-item">
                        <input type="checkbox" id="auto-next" checked>
                        <span>Tự động chuyển câu</span>
                    </label>
                    <label class="setting-item">
                        <input type="checkbox" id="sound-enabled">
                        <span>Bật âm thanh</span>
                    </label>
                </div>
                
                <div class="quiz-progress-card">
                    <h4>Danh sách phần thi (1)</h4>
                    <div class="progress-section">
                        <div class="progress-icon">📚</div>
                        <div class="progress-info">
                            <div class="progress-title">Phần 1</div>
                            <div class="progress-stats">
                                <span>Tiến độ hoàn thành: <strong id="progress-percentage">0</strong>/${this.currentQuiz.totalQuestions}</span>
                            </div>
                            <div class="progress-bar-wrapper">
                                <div class="progress-bar-fill" id="progress-bar-fill" style="width: 0%"></div>
                            </div>
                            <div class="progress-details">
                                <span class="correct-count">Đã trả lời: <strong id="answered-count">0</strong></span>
                                <span class="wrong-count">Còn lại: <strong id="remaining-count">${this.currentQuiz.totalQuestions}</strong></span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="quiz-actions-card">
                    <button class="btn-back-quiz" onclick="quizManager.confirmExitQuiz()">
                        <i class="fas fa-arrow-left"></i>
                        Trở về
                    </button>
                    <button class="btn-submit-quiz" onclick="quizManager.submitQuiz()">
                        <i class="fas fa-check-circle"></i>
                        Nộp bài
                    </button>
                </div>
            </div>
            
            <!-- Main Content -->
            <div class="quiz-main-content">
                <div class="question-display" id="question-display">
                    ${this.renderQuestion(0)}
                </div>
                
                <div class="quiz-navigation">
                    <button class="btn-nav btn-prev" id="btn-prev" onclick="quizManager.previousQuestion()" disabled>
                        <i class="fas fa-chevron-left"></i>
                        Trước
                    </button>
                    <button class="btn-nav btn-next" id="btn-next" onclick="quizManager.nextQuestion()">
                        Sau
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
            
            <!-- Right Sidebar - Question Grid -->
            <div class="quiz-sidebar-right">
                <h4 class="grid-title">Mục lục câu hỏi</h4>
                <div class="question-grid" id="question-grid">
                    ${this.currentQuiz.questions.map((_, index) => `
                        <button class="question-grid-item ${index === 0 ? 'active' : ''}" 
                                data-question="${index}"
                                onclick="quizManager.goToQuestion(${index})">
                            ${index + 1}
                        </button>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    container.innerHTML = quizHTML;
    
    // Start timer
    if (typeof this.startTimerModern === 'function') {
        this.startTimerModern();
    } else if (typeof this.startTimer === 'function') {
        this.startTimer();
    }
    
    // Update progress
    if (typeof this.updateProgressBarModern === 'function') {
        this.updateProgressBarModern();
    } else if (typeof this.updateProgressBar === 'function') {
        this.updateProgressBar();
    }
    
    this.updateNavigationButtons();
    
    console.log('✅ Quiz rendered successfully');
};

QuizManager.prototype.renderQuestion = function(index) {
    console.log(`🎨 renderQuestion called for index ${index}`);
    
    // ⭐ KIỂM TRA VÀ KHÔI PHỤC
    if (!this.currentQuiz || !this.currentQuiz.questions) {
        console.error('❌ currentQuiz is null in renderQuestion');
        
        // Thử khôi phục
        if (this._quizBackup && this._quizBackup.questions) {
            this.currentQuiz = JSON.parse(JSON.stringify(this._quizBackup));
            console.log('✅ Restored from backup in renderQuestion');
        } else if (typeof restoreQuizFromBackup === 'function') {
            restoreQuizFromBackup();
        }
        
        // Nếu vẫn không có
        if (!this.currentQuiz || !this.currentQuiz.questions) {
            return `
                <div class="question-card-modern">
                    <div class="question-text-modern" style="text-align: center; padding: 40px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #f59e0b; margin-bottom: 20px;"></i>
                        <h3>Lỗi tải câu hỏi</h3>
                        <p>Không thể tải câu hỏi. Vui lòng thử lại.</p>
                        <button class="btn-primary" onclick="location.reload()">
                            <i class="fas fa-sync"></i>
                            Tải lại trang
                        </button>
                    </div>
                </div>
            `;
        }
    }

    const question = this.currentQuiz.questions[index];
    if (!question) {
        console.error(`❌ Question at index ${index} not found`);
        return '<div class="question-card-modern"><p>Lỗi: Không tìm thấy câu hỏi</p></div>';
    }
    
    const userAnswer = this.currentAnswers[index];
    
    return `
        <div class="question-card-modern">
            <div class="question-header-modern">
                <span class="question-label">Câu ${index + 1}</span>
            </div>
            <div class="question-text-modern">${this.escapeHtml(question.question)}</div>
            <div class="options-modern">
                ${question.options.map(option => `
                    <label class="option-modern ${userAnswer === option.letter ? 'selected' : ''}" 
                           for="q${index}_${option.letter}">
                        <input type="radio" 
                               id="q${index}_${option.letter}" 
                               name="question_${index}" 
                               value="${option.letter}"
                               ${userAnswer === option.letter ? 'checked' : ''}
                               onchange="quizManager.updateAnswerModern(${index}, '${option.letter}')">
                        <span class="option-letter">${option.letter}.</span>
                        <span class="option-text">${this.escapeHtml(option.text)}</span>
                    </label>
                `).join('')}
            </div>
        </div>
    `;
};

QuizManager.prototype.goToQuestion = function(index) {
    console.log(`📍 goToQuestion called for index ${index}`);
    
    // ⭐ KIỂM TRA VÀ KHÔI PHỤC
    if (!this.currentQuiz || !this.currentQuiz.questions) {
        console.error('❌ Cannot go to question: currentQuiz is null');
        if (this._quizBackup && this._quizBackup.questions) {
            this.currentQuiz = JSON.parse(JSON.stringify(this._quizBackup));
            console.log('✅ Restored from backup in goToQuestion');
        } else if (typeof restoreQuizFromBackup === 'function') {
            restoreQuizFromBackup();
        }
        
        if (!this.currentQuiz || !this.currentQuiz.questions) {
            return;
        }
    }

    this.currentQuestionIndex = index;
    const questionDisplay = document.getElementById('question-display');
    if (questionDisplay) {
        questionDisplay.innerHTML = this.renderQuestion(index);
    }
    
    // Update active state in grid
    document.querySelectorAll('.question-grid-item').forEach((btn, i) => {
        btn.classList.toggle('active', i === index);
    });
    
    this.updateNavigationButtons();
};

QuizManager.prototype.nextQuestion = function() {
    if (!this.currentQuiz || !this.currentQuiz.questions) {
        console.error('❌ Cannot go to next question: currentQuiz is null');
        if (typeof restoreQuizFromBackup === 'function') {
            restoreQuizFromBackup();
        }
        return;
    }
    
    if (this.currentQuestionIndex < this.currentQuiz.totalQuestions - 1) {
        this.currentQuestionIndex++;
        this.goToQuestion(this.currentQuestionIndex);
    }
};

QuizManager.prototype.previousQuestion = function() {
    if (!this.currentQuiz || !this.currentQuiz.questions) {
        console.error('❌ Cannot go to previous question: currentQuiz is null');
        if (typeof restoreQuizFromBackup === 'function') {
            restoreQuizFromBackup();
        }
        return;
    }
    
    if (this.currentQuestionIndex > 0) {
        this.currentQuestionIndex--;
        this.goToQuestion(this.currentQuestionIndex);
    }
};

QuizManager.prototype.updateNavigationButtons = function() {
    if (!this.currentQuiz || !this.currentQuiz.questions) {
        return;
    }
    
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    
    if (btnPrev) {
        btnPrev.disabled = this.currentQuestionIndex === 0;
    }
    
    if (btnNext) {
        btnNext.disabled = this.currentQuestionIndex === this.currentQuiz.totalQuestions - 1;
    }
};

QuizManager.prototype.updateAnswerModern = function(questionIndex, selectedAnswer) {
    console.log(`✏️ updateAnswerModern called: question ${questionIndex}, answer ${selectedAnswer}`);
    
    // ⭐ KIỂM TRA VÀ KHÔI PHỤC CURRENTQUIZ
    if (!this.currentQuiz || !this.currentQuiz.questions) {
        console.error('❌ Cannot update answer: currentQuiz is null');
        console.log('🔄 Attempting to restore quiz data...');
        
        // Thử khôi phục từ backup
        if (this._quizBackup && this._quizBackup.questions) {
            this.currentQuiz = JSON.parse(JSON.stringify(this._quizBackup));
            console.log('✅ Quiz data restored from _quizBackup');
        }
        // Thử khôi phục từ localStorage
        else if (typeof restoreQuizFromBackup === 'function' && restoreQuizFromBackup()) {
            console.log('✅ Quiz data restored from localStorage');
        }
        // Thử khôi phục từ roomManager
        else if (window.roomManager && window.roomManager.currentRoom && window.roomManager.currentRoom.quiz) {
            const room = window.roomManager.currentRoom;
            this.currentQuiz = {
                id: room.quiz.id,
                title: room.quiz.title,
                description: room.quiz.description || '',
                questions: JSON.parse(JSON.stringify(room.quiz.questions)),
                totalQuestions: room.quiz.totalQuestions || room.quiz.questions.length,
                isRoomQuiz: true,
                roomId: room.id,
                roomCode: room.code,
                roomName: room.name,
                userName: room.userName
            };
            // Backup lại
            this._quizBackup = JSON.parse(JSON.stringify(this.currentQuiz));
            console.log('✅ Quiz data restored from roomManager and backed up');
        } else {
            console.error('❌ Cannot restore quiz data - no backup available');
            this.showToast('❌ Lỗi: Mất dữ liệu bài thi. Vui lòng tải lại trang!', 'error');
            return;
        }
    }

    // Lưu câu trả lời
    this.currentAnswers[questionIndex] = selectedAnswer;
    console.log(`✅ Answer saved: question ${questionIndex} = ${selectedAnswer}`);
    
    // Update option styling
    try {
        const selectedInput = document.querySelector(`#q${questionIndex}_${selectedAnswer}`);
        if (selectedInput) {
            const optionModern = selectedInput.closest('.option-modern');
            if (optionModern) {
                document.querySelectorAll(`input[name="question_${questionIndex}"]`).forEach(input => {
                    input.closest('.option-modern').classList.remove('selected');
                });
                optionModern.classList.add('selected');
            }
        }
    } catch (error) {
        console.warn('Error updating option styling:', error);
    }
    
    // Update question grid item
    try {
        const gridItem = document.querySelector(`.question-grid-item[data-question="${questionIndex}"]`);
        if (gridItem) {
            gridItem.classList.add('answered');
        }
    } catch (error) {
        console.warn('Error updating grid item:', error);
    }
    
    // Update progress bar
    if (typeof this.updateProgressBarModern === 'function') {
        this.updateProgressBarModern();
    } else if (typeof this.updateProgressBar === 'function') {
        this.updateProgressBar();
    }
    
    // Auto next if enabled
    const autoNext = document.getElementById('auto-next');
    if (autoNext && autoNext.checked && this.currentQuiz && questionIndex < this.currentQuiz.totalQuestions - 1) {
        setTimeout(() => {
            // Kiểm tra lại currentQuiz trước khi gọi nextQuestion
            if (this.currentQuiz && this.currentQuiz.questions) {
                this.nextQuestion();
            } else {
                console.error('❌ currentQuiz lost before auto-next');
                if (typeof restoreQuizFromBackup === 'function') {
                    restoreQuizFromBackup();
                }
            }
        }, 500);
    }
};

QuizManager.prototype.confirmExitQuiz = function() {
    if (confirm('Bạn có chắc chắn muốn thoát? Tiến độ làm bài sẽ không được lưu.')) {
        clearInterval(this.timerInterval);
        this.currentQuiz = null;
        this.currentAnswers = {};
        this._quizBackup = null;
        
        // Xóa backup từ localStorage
        try {
            localStorage.removeItem('currentRoomQuiz');
            localStorage.removeItem('currentRoomData');
        } catch (error) {
            console.warn('Failed to clear backup:', error);
        }
        
        document.getElementById('quiz-container').innerHTML = `
            <div class="quiz-placeholder">
                <i class="fas fa-clipboard-list"></i>
                <h3>Sẵn sàng làm bài?</h3>
                <p>Chọn một bài quiz và bấm "Bắt Đầu" để bắt đầu làm bài</p>
            </div>
        `;
    }
};

// Update timer to show hours
QuizManager.prototype.startTimerModern = function() {
    this.quizStartTime = Date.now();
    this.timerInterval = setInterval(() => {
        const elapsed = Date.now() - this.quizStartTime;
        const hours = Math.floor(elapsed / 3600000);
        const minutes = Math.floor((elapsed % 3600000) / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        const timerEl = document.getElementById('quiz-timer');
        if (timerEl) {
            timerEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
};

// Update progress bar for modern layout
QuizManager.prototype.updateProgressBarModern = function() {
    if (!this.currentQuiz || !this.currentQuiz.questions) {
        return;
    }
    
    const answeredCount = Object.keys(this.currentAnswers).length;
    const totalQuestions = this.currentQuiz.totalQuestions;
    const percentage = (answeredCount / totalQuestions) * 100;
    
    const progressBarFill = document.getElementById('progress-bar-fill');
    const progressPercentage = document.getElementById('progress-percentage');
    const answeredCountEl = document.getElementById('answered-count');
    const remainingCountEl = document.getElementById('remaining-count');
    
    if (progressBarFill) {
        progressBarFill.style.width = percentage + '%';
    }
    
    if (progressPercentage) {
        progressPercentage.textContent = answeredCount;
    }
    
    if (answeredCountEl) {
        answeredCountEl.textContent = answeredCount;
    }
    
    if (remainingCountEl) {
        remainingCountEl.textContent = totalQuestions - answeredCount;
    }
};

// ⭐ THÊM ESCAPE HTML FUNCTION NẾU CHƯA CÓ
if (!QuizManager.prototype.escapeHtml) {
    QuizManager.prototype.escapeHtml = function(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };
}

// ⭐ PERIODIC CHECK ĐỂ ĐẢM BẢO CURRENTQUIZ KHÔNG BỊ MẤT
setInterval(() => {
    if (window.quizManager && window.quizManager.currentQuiz) {
        // Nếu có currentQuiz nhưng không có backup, tạo backup
        if (!window.quizManager._quizBackup) {
            window.quizManager._quizBackup = JSON.parse(JSON.stringify(window.quizManager.currentQuiz));
            console.log('🔄 Created backup of currentQuiz');
        }
    }
}, 5000); // Check mỗi 5 giây

console.log('✅ Modern Quiz Layout - Fixed Version loaded');
