class QuizManager {
    constructor() {
        this.quizzes = JSON.parse(localStorage.getItem('quizzes')) || [];
        this.currentQuiz = null;
        this.currentAnswers = {};
        this.currentResults = null;
        this.aiGeneratedQuiz = null;
        
        this.initializeTheme();
        this.initializeEventListeners();
        this.loadQuizList();
        this.updateQuizSelector();
        
        // Initialize AI Generator after DOM is ready
        setTimeout(() => {
            this.loadAISettings();
        }, 100);
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            document.querySelector('#theme-toggle i').classList.replace('fa-moon', 'fa-sun');
        }
    }

    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        const icon = document.querySelector('#theme-toggle i');
        
        if (isDark) {
            icon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('theme', 'dark');
            this.showToast('Đã chuyển sang chế độ tối', 'success');
        } else {
            icon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('theme', 'light');
            this.showToast('Đã chuyển sang chế độ sáng', 'success');
        }
    }

    showToast(message, type = 'success') {
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
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    initializeEventListeners() {
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Tab navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Quiz creation
        document.getElementById('process-quiz').addEventListener('click', () => {
            this.processQuiz();
        });

        document.getElementById('clear-input').addEventListener('click', () => {
            this.clearInputs();
        });

        // Quiz management
        document.getElementById('start-quiz').addEventListener('click', () => {
            this.startQuiz();
        });

        document.getElementById('quiz-selector').addEventListener('change', (e) => {
            document.getElementById('start-quiz').disabled = !e.target.value;
        });

        // Shuffle checkbox - ensure it's always clickable
        const shuffleCheckbox = document.getElementById('shuffle-questions');
        if (shuffleCheckbox) {
            shuffleCheckbox.addEventListener('change', (e) => {
                console.debug('shuffle-questions changed:', e.target.checked);
                if (e.target.checked) {
                    this.showToast('🔀 Xáo trộn câu hỏi: Bật', 'info');
                } else {
                    this.showToast('Xáo trộn câu hỏi: Tắt', 'info');
                }
            });
        }

        // Modal handlers
        document.getElementById('edit-modal').addEventListener('click', (e) => {
            if (e.target.id === 'edit-modal') {
                this.closeEditModal();
            }
        });

        document.querySelector('.modal-close').addEventListener('click', () => {
            this.closeEditModal();
        });

        document.getElementById('save-edit').addEventListener('click', () => {
            this.saveQuizEdit();
        });

        document.getElementById('cancel-edit').addEventListener('click', () => {
            this.closeEditModal();
        });
    }

    async pasteFromClipboard(targetId) {
        try {
            const text = await navigator.clipboard.readText();
            const textarea = document.getElementById(targetId);
            
            if (!text) {
                this.showToast('⚠️ Clipboard trống!', 'warning');
                return;
            }

            // If textarea already has content, append with newline
            if (textarea.value.trim()) {
                textarea.value += '\n' + text;
            } else {
                textarea.value = text;
            }

            // Focus and scroll to bottom
            textarea.focus();
            textarea.scrollTop = textarea.scrollHeight;

            this.showToast('📋 Đã dán nội dung thành công!', 'success');
        } catch (error) {
            this.showToast('❌ Không thể truy cập clipboard. Vui lòng dán thủ công (Ctrl+V)', 'error');
            console.error('Clipboard error:', error);
        }
    }

    switchTab(tabName) {
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Refresh data when switching tabs
        if (tabName === 'manage') {
            this.loadQuizList();
        } else if (tabName === 'quiz') {
            this.updateQuizSelector();
        }
    }

    processQuiz() {
        const title = document.getElementById('quiz-title').value.trim();
        const description = document.getElementById('quiz-description').value.trim();
        const questionsText = document.getElementById('questions-input').value.trim();
        const answersText = document.getElementById('answers-input').value.trim();

        if (!title) {
            this.showToast('Vui lòng nhập t��n bài quiz!', 'error');
            return;
        }

        if (!questionsText || !answersText) {
            this.showToast('Vui lòng nhập đầy đủ câu hỏi và đáp án!', 'error');
            return;
        }

        try {
            const questions = this.parseQuestions(questionsText);
            const answers = this.parseAnswers(answersText, questions.length);

            if (questions.length !== answers.length) {
                this.showToast(`Số lượng câu hỏi (${questions.length}) và đáp án (${answers.length}) không khớp!`, 'error');
                return;
            }

            // Combine questions with answers
            const quiz = {
                id: Date.now().toString(),
                title: title,
                description: description || 'Không có mô tả',
                questions: questions.map((q, index) => ({
                    ...q,
                    correctAnswer: answers[index]
                })),
                createdAt: new Date().toISOString(),
                totalQuestions: questions.length
            };

            // Save quiz
            this.quizzes.push(quiz);
            this.saveQuizzes();

            this.showToast(`✨ Tạo bài quiz "${title}" thành công với ${questions.length} câu hỏi!`, 'success');
            this.clearInputs();
            this.switchTab('manage');

        } catch (error) {
            this.showToast('❌ Lỗi xử lý dữ liệu: ' + error.message, 'error');
        }
    }

    parseQuestions(text) {
        const questions = [];
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        
        let currentQuestion = null;
        let currentOptions = [];

        for (let line of lines) {
            if (line.match(/^Câu\s+\d+[:：]/)) {
                // Save previous question
                if (currentQuestion && currentOptions.length >= 2) {
                    questions.push({
                        question: currentQuestion.replace(/^Câu\s+\d+[:：]\s*/, ''),
                        options: currentOptions
                    });
                }
                
                // Start new question
                currentQuestion = line;
                currentOptions = [];
            } else if (line.match(/^[A-Da-d][:：.]\s*/)) {
                // Extract option
                const option = line.replace(/^[A-Da-d][:：.]\s*/, '');
                const letter = line.charAt(0).toUpperCase();
                currentOptions.push({
                    letter: letter,
                    text: option
                });
            }
        }

        // Save last question
        if (currentQuestion && currentOptions.length >= 2) {
            questions.push({
                question: currentQuestion.replace(/^Câu\s+\d+[:：]\s*/, ''),
                options: currentOptions
            });
        }

        if (questions.length === 0) {
            throw new Error('Không tìm thấy câu hỏi hợp lệ! Vui lòng kiểm tra định dạng.');
        }

        return questions;
    }

    parseAnswers(text, expectedCount) {
        const answers = [];
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        
        for (let line of lines) {
            // Format: "Câu 1: B" or "Câu 1. B" or "Câu 1 : B" (with spaces)
            if (line.match(/^Câu\s+\d+\s*[:：.]\s*[A-Da-d]$/i)) {
                const answer = line.replace(/^Câu\s+\d+\s*[:：.]\s*/i, '').trim().toUpperCase();
                answers.push(answer);
            }
            // Format: "1. B" or "1: B" or "1 : B" (with spaces)
            else if (line.match(/^\d+\s*[:：.]\s*[A-Da-d]$/)) {
                const answer = line.replace(/^\d+\s*[:：.]\s*/, '').trim().toUpperCase();
                answers.push(answer);
            }
            // Format: Just "B" or " B " (with spaces)
            else if (line.match(/^[A-Da-d]$/i)) {
                answers.push(line.toUpperCase());
            }
        }

        if (answers.length === 0) {
            throw new Error('Không tìm thấy đáp án hợp lệ! Vui lòng kiểm tra định dạng.');
        }

        if (answers.length !== expectedCount) {
            throw new Error(`Cần ${expectedCount} đáp án, chỉ tìm thấy ${answers.length}! Vui lòng kiểm tra lại.`);
        }

        return answers;
    }

    saveQuizzes() {
        localStorage.setItem('quizzes', JSON.stringify(this.quizzes));
    }

    clearInputs() {
        document.getElementById('quiz-title').value = '';
        document.getElementById('quiz-description').value = '';
        document.getElementById('questions-input').value = '';
        document.getElementById('answers-input').value = '';
    }

    loadQuizList() {
        const quizList = document.getElementById('quiz-list');
        
        if (this.quizzes.length === 0) {
            quizList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <h3>Chưa có quiz nào</h3>
                    <p>Hãy tạo quiz đầu tiên của bạn!</p>
                </div>
            `;
            return;
        }

        const quizHTML = this.quizzes.map(quiz => `
            <div class="quiz-item">
                <div class="quiz-item-header">
                    <div class="quiz-item-info">
                        <h3>${quiz.title}</h3>
                        <p>${quiz.description}</p>
                        <div class="quiz-item-meta">
                            <span><i class="fas fa-question-circle"></i> ${quiz.totalQuestions} câu</span>
                            <span><i class="fas fa-calendar"></i> ${new Date(quiz.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                    </div>
                    <div class="quiz-item-actions">
                        <button class="btn btn-sm btn-primary" onclick="quizManager.editQuiz('${quiz.id}')">
                            <i class="fas fa-edit"></i>
                            Sửa
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="quizManager.duplicateQuiz('${quiz.id}')">
                            <i class="fas fa-copy"></i>
                            Sao chép
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="quizManager.deleteQuiz('${quiz.id}')">
                            <i class="fas fa-trash"></i>
                            Xóa
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        quizList.innerHTML = quizHTML;
    }

    updateQuizSelector() {
        const selector = document.getElementById('quiz-selector');
        selector.innerHTML = '<option value="">Chọn bài quiz...</option>';
        
        this.quizzes.forEach(quiz => {
            const option = document.createElement('option');
            option.value = quiz.id;
            option.textContent = `${quiz.title} (${quiz.totalQuestions} câu)`;
            selector.appendChild(option);
        });
    }

    editQuiz(quizId) {
        const quiz = this.quizzes.find(q => q.id === quizId);
        if (!quiz) return;

        document.getElementById('edit-title').value = quiz.title;
        document.getElementById('edit-description').value = quiz.description;

        const questionsContainer = document.getElementById('edit-questions');
        questionsContainer.innerHTML = quiz.questions.map((q, index) => `
            <div class="edit-question-item" data-index="${index}">
                <h4>Câu ${index + 1}</h4>
                <textarea placeholder="Nội dung câu hỏi...">${q.question}</textarea>
                <div class="edit-options">
                    ${q.options.map((opt, optIndex) => `
                        <div class="edit-option">
                            <span>${opt.letter}.</span>
                            <input type="text" value="${opt.text}" data-option="${opt.letter}">
                            <select ${q.correctAnswer === opt.letter ? 'selected' : ''}>
                                <option value="">-</option>
                                <option value="${opt.letter}" ${q.correctAnswer === opt.letter ? 'selected' : ''}>Đúng</option>
                            </select>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        document.getElementById('edit-modal').classList.add('active');
        document.getElementById('edit-modal').dataset.quizId = quizId;
    }

    saveQuizEdit() {
        const quizId = document.getElementById('edit-modal').dataset.quizId;
        const quiz = this.quizzes.find(q => q.id === quizId);
        if (!quiz) return;

        const title = document.getElementById('edit-title').value.trim();
        const description = document.getElementById('edit-description').value.trim();

        if (!title) {
            this.showToast('Vui lòng nhập tên quiz!', 'error');
            return;
        }

        // Update basic info
        quiz.title = title;
        quiz.description = description || 'Không có mô tả';

        // Update questions
        const questionItems = document.querySelectorAll('.edit-question-item');
        questionItems.forEach((item, index) => {
            const questionText = item.querySelector('textarea').value.trim();
            const options = Array.from(item.querySelectorAll('.edit-option')).map(optEl => {
                const letter = optEl.querySelector('span').textContent.replace('.', '');
                const text = optEl.querySelector('input').value.trim();
                return { letter, text };
            });

            const correctAnswerSelect = item.querySelector('select[selected], select option[selected]');
            const correctAnswer = Array.from(item.querySelectorAll('select')).find(select => select.value)?.value || quiz.questions[index].correctAnswer;

            quiz.questions[index] = {
                question: questionText,
                options: options.filter(opt => opt.text),
                correctAnswer: correctAnswer
            };
        });

        this.saveQuizzes();
        this.closeEditModal();
        this.loadQuizList();
        this.updateQuizSelector();
        
        this.showToast('✅ Cập nhật quiz thành công!', 'success');
    }

    closeEditModal() {
        document.getElementById('edit-modal').classList.remove('active');
    }

    duplicateQuiz(quizId) {
        const originalQuiz = this.quizzes.find(q => q.id === quizId);
        if (!originalQuiz) return;

        const duplicatedQuiz = {
            ...originalQuiz,
            id: Date.now().toString(),
            title: originalQuiz.title + ' (Sao chép)',
            createdAt: new Date().toISOString()
        };

        this.quizzes.push(duplicatedQuiz);
        this.saveQuizzes();
        this.loadQuizList();
        this.updateQuizSelector();

        this.showToast('📋 Sao chép quiz thành công!', 'success');
    }

    deleteQuiz(quizId) {
        if (!confirm('Bạn có chắc chắn muốn xóa quiz này không?')) return;

        this.quizzes = this.quizzes.filter(q => q.id !== quizId);
        this.saveQuizzes();
        this.loadQuizList();
        this.updateQuizSelector();

        this.showToast('🗑️ Xóa quiz thành công!', 'success');
    }

    startQuiz() {
        const selectedQuizId = document.getElementById('quiz-selector').value;
        const shuffleEl = document.getElementById('shuffle-questions');
        const shouldShuffle = shuffleEl ? !!shuffleEl.checked : false;

        if (!selectedQuizId) {
            this.showToast('Vui lòng chọn một bài quiz!', 'warning');
            return;
        }

        const quiz = this.quizzes.find(q => q.id === selectedQuizId);
        if (!quiz) {
            this.showToast('Không tìm thấy quiz!', 'error');
            return;
        }

        const questionsClone = (quiz.questions || []).map(q => ({
            question: q.question,
            options: (q.options || []).map(o => ({ letter: o.letter, text: o.text })),
            correctAnswer: q.correctAnswer
        }));

        const finalQuestions = (shouldShuffle && questionsClone.length >= 2)
            ? this.shuffleArray([...questionsClone])
            : questionsClone;

        this.currentQuiz = {
            ...quiz,
            questions: finalQuestions,
            totalQuestions: finalQuestions.length
        };
        this.currentAnswers = {};

        if (shouldShuffle && questionsClone.length >= 2) {
            this.showToast('🔀 Đã xáo trộn câu hỏi!', 'info');
        } else if (shouldShuffle && questionsClone.length < 2) {
            this.showToast('Không đủ câu hỏi để xáo trộn.', 'warning');
        }

        this.renderQuiz();
        this.showToast('🚀 Bắt đầu làm bài!', 'success');
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    renderQuiz() {
        const container = document.getElementById('quiz-container');
        
        const quizHTML = `
            <div class="progress-bar-container">
                <div class="progress-bar" id="quiz-progress-bar" style="width: 0%"></div>
            </div>

            <div class="quiz-header">
                <div class="quiz-info-display">
                    <h3>${this.currentQuiz.title}</h3>
                    <p>${this.currentQuiz.description}</p>
                </div>
                <div class="quiz-progress">
                    <div>Đã trả lời: <span id="answered-count">0</span>/${this.currentQuiz.totalQuestions}</div>
                    <div>Thời gian: <span id="quiz-timer">00:00</span></div>
                </div>
            </div>

            <div class="questions-container">
                ${this.currentQuiz.questions.map((question, index) => `
                    <div class="question-card">
                        <div class="question-header">
                            <div class="question-number">${index + 1}</div>
                            <div class="question-text">${question.question}</div>
                        </div>
                        <div class="options">
                            ${question.options.map(option => `
                                <label class="option" for="q${index}_${option.letter}">
                                    <input type="radio" 
                                           id="q${index}_${option.letter}" 
                                           name="question_${index}" 
                                           value="${option.letter}"
                                           onchange="quizManager.updateAnswer(${index}, '${option.letter}')">
                                    <span class="option-label">${option.letter}.</span>
                                    <span class="option-text">${option.text}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="quiz-submit">
                <button id="submit-quiz" class="btn btn-success" onclick="quizManager.submitQuiz()">
                    <i class="fas fa-check-circle"></i>
                    Nộp Bài
                </button>
                <p style="margin-top: 10px; color: var(--text-secondary); font-size: 14px;">
                    Hãy kiểm tra kỹ các câu trả lời trước khi nộp bài
                </p>
            </div>
        `;

        container.innerHTML = quizHTML;
        this.startTimer();
        this.updateProgressBar();
    }

    updateProgressBar() {
        const answeredCount = Object.keys(this.currentAnswers).length;
        const totalQuestions = this.currentQuiz.totalQuestions;
        const percentage = (answeredCount / totalQuestions) * 100;
        
        const progressBar = document.getElementById('quiz-progress-bar');
        const answeredCountEl = document.getElementById('answered-count');
        
        if (progressBar) {
            progressBar.style.width = percentage + '%';
        }
        
        if (answeredCountEl) {
            answeredCountEl.textContent = answeredCount;
        }
    }

    startTimer() {
        this.quizStartTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.quizStartTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            const timerEl = document.getElementById('quiz-timer');
            if (timerEl) {
                timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    updateAnswer(questionIndex, selectedAnswer) {
        this.currentAnswers[questionIndex] = selectedAnswer;
        
        const option = document.querySelector(`#q${questionIndex}_${selectedAnswer}`).closest('.option');
        document.querySelectorAll(`input[name="question_${questionIndex}"]`).forEach(input => {
            input.closest('.option').classList.remove('selected');
        });
        option.classList.add('selected');
        
        this.updateProgressBar();
    }

    submitQuiz() {
        const answeredCount = Object.keys(this.currentAnswers).length;
        const totalQuestions = this.currentQuiz.totalQuestions;
        
        if (answeredCount < totalQuestions) {
            const unanswered = totalQuestions - answeredCount;
            if (!confirm(`Bạn còn ${unanswered} câu chưa trả lời. Bạn có muốn nộp bài không?`)) {
                return;
            }
        }

        clearInterval(this.timerInterval);
        const endTime = Date.now();
        const totalTime = Math.floor((endTime - this.quizStartTime) / 1000);

        let correctCount = 0;
        const results = this.currentQuiz.questions.map((question, index) => {
            const userAnswer = this.currentAnswers[index] || '';
            const isCorrect = userAnswer === question.correctAnswer;
            if (isCorrect) correctCount++;

            return {
                question: question.question,
                options: question.options,
                userAnswer,
                correctAnswer: question.correctAnswer,
                isCorrect
            };
        });

        const score = Math.round((correctCount / this.currentQuiz.totalQuestions) * 10 * 100) / 100;

        this.currentResults = {
            quizTitle: this.currentQuiz.title,
            totalQuestions: this.currentQuiz.totalQuestions,
            correctCount,
            incorrectCount: this.currentQuiz.totalQuestions - correctCount,
            score,
            totalTime,
            results,
            completedAt: new Date().toISOString()
        };

        const savedResults = JSON.parse(localStorage.getItem('quizResults')) || [];
        savedResults.push(this.currentResults);
        localStorage.setItem('quizResults', JSON.stringify(savedResults));

        this.showToast('🎉 Đã nộp bài thành công!', 'success');
        this.switchTab('results');
        this.displayResults();
    }

    displayResults() {
        if (!this.currentResults) {
            document.getElementById('results-container').innerHTML = `
                <div class="results-placeholder">
                    <i class="fas fa-chart-line"></i>
                    <h3>Chưa có kết quả nào</h3>
                    <p>Hoàn thành một bài quiz để xem kết quả</p>
                </div>
            `;
            return;
        }

        const { score, correctCount, incorrectCount, totalQuestions, totalTime, results, quizTitle } = this.currentResults;

        const minutes = Math.floor(totalTime / 60);
        const seconds = totalTime % 60;

        let performanceClass = '';
        let performanceMessage = '';
        let performanceIcon = '';
        
        const percentage = (correctCount / totalQuestions) * 100;
        
        if (percentage >= 90) {
            performanceClass = 'excellent';
            performanceMessage = 'Xuất sắc! 🌟';
            performanceIcon = '🏆';
        } else if (percentage >= 75) {
            performanceClass = 'good';
            performanceMessage = 'Tốt lắm! 👍';
            performanceIcon = '⭐';
        } else if (percentage >= 50) {
            performanceClass = 'average';
            performanceMessage = 'Khá ổn! 💪';
            performanceIcon = '📚';
        } else {
            performanceClass = 'needs-improvement';
            performanceMessage = 'Cần cố gắng thêm! 📖';
            performanceIcon = '💡';
        }

        const resultsHTML = `
            <div class="results-header ${performanceClass}">
                <div class="performance-badge">${performanceIcon}</div>
                <h2><i class="fas fa-trophy"></i> ${performanceMessage}</h2>
                <div class="quiz-title-result">${quizTitle}</div>
                <div class="score-display">${score}/10</div>
                <div class="score-text">${correctCount}/${totalQuestions} câu đúng</div>
            </div>

            <div class="results-stats">
                <div class="stat-card">
                    <div class="stat-number" style="color: #48bb78;">${correctCount}</div>
                    <div class="stat-label">Câu Đúng</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" style="color: #f56565;">${incorrectCount}</div>
                    <div class="stat-label">Câu Sai</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${minutes}:${seconds.toString().padStart(2, '0')}</div>
                    <div class="stat-label">Thời Gian</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${Math.round(percentage)}%</div>
                    <div class="stat-label">Tỷ Lệ Đúng</div>
                </div>
            </div>

            <div class="action-buttons-container">
                <button class="btn btn-review" onclick="quizManager.reviewAnswers(false)">
                    <i class="fas fa-eye"></i>
                    Xem Lại Bài Làm
                </button>
                <button class="btn btn-danger" onclick="quizManager.reviewAnswers(true)">
                    <i class="fas fa-times-circle"></i>
                    Xem Đáp Án Sai
                </button>
                <button class="btn btn-primary" onclick="quizManager.startNewQuiz()">
                    <i class="fas fa-play"></i>
                    Làm Bài Khác
                </button>
                <button class="btn btn-secondary" onclick="quizManager.exportResults()">
                    <i class="fas fa-download"></i>
                    Xuất Kết Quả
                </button>
            </div>

            <div id="review-section" class="review-section" style="display: none;">
                <div class="review-header">
                    <h3><i class="fas fa-list-alt"></i> <span id="review-title">Chi Tiết Từng Câu</span></h3>
                    <button class="btn-close-review" onclick="quizManager.closeReview()">
                        <i class="fas fa-times"></i>
                        Đóng
                    </button>
                </div>
                <div class="results-details" id="results-details-container"></div>
            </div>
        `;

        document.getElementById('results-container').innerHTML = resultsHTML;
    }

    reviewAnswers(filterWrongOnly = false) {
        if (!this.currentResults) return;
        
        const { results } = this.currentResults;
        const reviewSection = document.getElementById('review-section');
        const reviewTitle = document.getElementById('review-title');
        const detailsContainer = document.getElementById('results-details-container');
        
        if (!reviewSection || !detailsContainer) return;
        
        const displayResults = filterWrongOnly 
            ? results.filter(r => !r.isCorrect) 
            : results;
        
        if (reviewTitle) {
            reviewTitle.textContent = filterWrongOnly ? 'Chi Tiết Các Câu Sai' : 'Chi Tiết Từng Câu';
        }
        
        if (displayResults.length === 0) {
            detailsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <h3>Không có câu sai nào!</h3>
                    <p>Chúc mừng! Bạn đã trả lời đúng tất cả các câu hỏi.</p>
                </div>
            `;
        } else {
            const questionsHTML = displayResults.map((result) => {
                const originalIndex = results.findIndex(r => r.question === result.question);
                const optionsHTML = result.options.map(opt => {
                    const isUserAnswer = opt.letter === result.userAnswer;
                    const isCorrectAnswer = opt.letter === result.correctAnswer;
                    let optionClass = 'result-option';
                    
                    if (isCorrectAnswer) {
                        optionClass += ' correct-option';
                    }
                    if (isUserAnswer && !isCorrectAnswer) {
                        optionClass += ' wrong-option';
                    }
                    
                    return `
                        <div class="${optionClass}">
                            <span class="option-letter">${opt.letter}.</span>
                            <span class="option-text">${opt.text}</span>
                            ${isCorrectAnswer ? '<i class="fas fa-check-circle correct-icon"></i>' : ''}
                            ${isUserAnswer && !isCorrectAnswer ? '<i class="fas fa-times-circle wrong-icon"></i>' : ''}
                            ${isUserAnswer ? '<span class="your-choice-badge">Bạn chọn</span>' : ''}
                        </div>
                    `;
                }).join('');
                
                return `
                    <div class="result-question ${result.isCorrect ? 'correct' : 'incorrect'}">
                        <div class="result-question-header">
                            <div class="question-status-badge ${result.isCorrect ? 'correct-badge' : 'incorrect-badge'}">
                                <i class="fas ${result.isCorrect ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                                ${result.isCorrect ? 'Đúng' : 'Sai'}
                            </div>
                        </div>
                        <div class="result-question-text">
                            <strong>Câu ${originalIndex + 1}:</strong> ${result.question}
                        </div>
                        <div class="result-options">
                            ${optionsHTML}
                        </div>
                        ${!result.userAnswer ? '<div class="no-answer-notice"><i class="fas fa-exclamation-triangle"></i> Bạn chưa trả lời câu này</div>' : ''}
                    </div>
                `;
            }).join('');
            
            detailsContainer.innerHTML = questionsHTML;
        }
        
        reviewSection.style.display = 'block';
        reviewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        const message = filterWrongOnly 
            ? '❌ Đang xem các câu sai' 
            : '📖 Đang xem lại bài làm';
        this.showToast(message, 'info');
    }

    closeReview() {
        const reviewSection = document.getElementById('review-section');
        if (reviewSection) {
            reviewSection.style.display = 'none';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    startNewQuiz() {
        this.currentQuiz = null;
        this.currentAnswers = {};
        
        this.switchTab('quiz');
        
        document.getElementById('quiz-selector').value = '';
        document.getElementById('start-quiz').disabled = true;
        
        document.getElementById('quiz-container').innerHTML = `
            <div class="quiz-placeholder">
                <i class="fas fa-clipboard-list"></i>
                <h3>Sẵn sàng làm bài mới?</h3>
                <p>Chọn một bài quiz và bấm "Bắt Đầu" để làm bài mới</p>
            </div>
        `;
        
        this.showToast('🎯 Hãy chọn bài quiz mới để bắt đầu!', 'success');
    }

    exportResults() {
        if (!this.currentResults) return;

        const data = {
            ...this.currentResults,
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ket-qua-${this.currentResults.quizTitle.replace(/\s+/g, '-')}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('💾 Xuất kết quả thành công!', 'success');
    }
}

// Initialize the quiz manager when page loads
let quizManager;
document.addEventListener('DOMContentLoaded', () => {
    quizManager = new QuizManager();
    
    // Initialize scroll to top button
    initScrollToTop();
});

// Scroll to top functionality - Improved version
function initScrollToTop() {
    const scrollBtn = document.createElement('button');
    scrollBtn.id = 'scroll-to-top';
    scrollBtn.className = 'scroll-to-top';
    scrollBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    scrollBtn.title = 'Cuộn lên đầu trang';
    document.body.appendChild(scrollBtn);
    
    // Chỉ hiện nút khi cuộn xuống > 500px (thay vì 300px)
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        // Debounce để tối ưu performance
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (window.pageYOffset > 500) {
                scrollBtn.classList.add('visible');
            } else {
                scrollBtn.classList.remove('visible');
            }
        }, 100);
    }, { passive: true });
    
    scrollBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}
