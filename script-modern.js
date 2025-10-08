// Modern Quiz Layout - Additional Functions
// Add these functions to your existing QuizManager class

// Replace the renderQuiz method with this modern version
QuizManager.prototype.renderQuizModern = function() {
    const container = document.getElementById('quiz-container');
    this.currentQuestionIndex = 0;
    
    const quizHTML = `
        <div class="modern-quiz-layout">
            <!-- Left Sidebar -->
            <div class="quiz-sidebar-left">
                <div class="quiz-info-card">
                    <h3 class="quiz-title-sidebar">${this.currentQuiz.title}</h3>
                    <p class="quiz-mode">Chế độ: Ôn thi</p>
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
                                <span class="correct-count">Đúng: <strong id="correct-count">0</strong></span>
                                <span class="wrong-count">Sai: <strong id="wrong-count">0</strong></span>
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
    this.startTimer();
    this.updateProgressBar();
    this.updateNavigationButtons();
};

QuizManager.prototype.renderQuestion = function(index) {
    const question = this.currentQuiz.questions[index];
    const userAnswer = this.currentAnswers[index];
    
    return `
        <div class="question-card-modern">
            <div class="question-header-modern">
                <span class="question-label">Câu ${index + 1}</span>
            </div>
            <div class="question-text-modern">${question.question}</div>
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
                        <span class="option-text">${option.text}</span>
                    </label>
                `).join('')}
            </div>
        </div>
    `;
};

QuizManager.prototype.goToQuestion = function(index) {
    this.currentQuestionIndex = index;
    document.getElementById('question-display').innerHTML = this.renderQuestion(index);
    
    // Update active state in grid
    document.querySelectorAll('.question-grid-item').forEach((btn, i) => {
        btn.classList.toggle('active', i === index);
    });
    
    this.updateNavigationButtons();
};

QuizManager.prototype.nextQuestion = function() {
    if (this.currentQuestionIndex < this.currentQuiz.totalQuestions - 1) {
        this.currentQuestionIndex++;
        this.goToQuestion(this.currentQuestionIndex);
    }
};

QuizManager.prototype.previousQuestion = function() {
    if (this.currentQuestionIndex > 0) {
        this.currentQuestionIndex--;
        this.goToQuestion(this.currentQuestionIndex);
    }
};

QuizManager.prototype.updateNavigationButtons = function() {
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
    this.currentAnswers[questionIndex] = selectedAnswer;
    
    // Update option styling
    const optionModern = document.querySelector(`#q${questionIndex}_${selectedAnswer}`).closest('.option-modern');
    document.querySelectorAll(`input[name="question_${questionIndex}"]`).forEach(input => {
        input.closest('.option-modern').classList.remove('selected');
    });
    optionModern.classList.add('selected');
    
    // Update question grid item
    const gridItem = document.querySelector(`.question-grid-item[data-question="${questionIndex}"]`);
    if (gridItem) {
        gridItem.classList.add('answered');
    }
    
    this.updateProgressBar();
    
    // Auto next if enabled
    const autoNext = document.getElementById('auto-next');
    if (autoNext && autoNext.checked && questionIndex < this.currentQuiz.totalQuestions - 1) {
        setTimeout(() => {
            this.nextQuestion();
        }, 500);
    }
};

QuizManager.prototype.confirmExitQuiz = function() {
    if (confirm('Bạn có chắc chắn muốn thoát? Tiến độ làm bài sẽ không được lưu.')) {
        clearInterval(this.timerInterval);
        this.currentQuiz = null;
        this.currentAnswers = {};
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
    const answeredCount = Object.keys(this.currentAnswers).length;
    const totalQuestions = this.currentQuiz.totalQuestions;
    const percentage = (answeredCount / totalQuestions) * 100;
    
    const progressBarFill = document.getElementById('progress-bar-fill');
    const progressPercentage = document.getElementById('progress-percentage');
    
    if (progressBarFill) {
        progressBarFill.style.width = percentage + '%';
    }
    
    if (progressPercentage) {
        progressPercentage.textContent = answeredCount;
    }
};
