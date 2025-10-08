// AI Quiz Generator Module - Nâng cấp với khả năng phân tích nội dung thông minh
class AIQuizGenerator {
    constructor(quizManager) {
        this.quizManager = quizManager;
        this.initializeAIListeners();
        
        // Từ điển ngữ cảnh để tạo đáp án sai hợp lý
        this.contextDictionary = {
            opposites: {
                'tăng': 'giảm', 'lớn': 'nhỏ', 'cao': 'thấp', 'nhanh': 'chậm',
                'mạnh': 'yếu', 'dài': 'ngắn', 'rộng': 'hẹp', 'sâu': 'nông',
                'nóng': 'lạnh', 'sáng': 'tối', 'trước': 'sau', 'trên': 'dưới',
                'đúng': 'sai', 'tốt': 'xấu', 'nhiều': 'ít', 'xa': 'gần'
            },
            quantifiers: ['một', 'hai', 'ba', 'bốn', 'năm', 'nhiều', 'ít', 'vài', 'hầu hết', 'tất cả'],
            negations: ['không', 'không phải', 'chưa', 'chẳng', 'không bao giờ'],
            modifiers: ['rất', 'khá', 'hơi', 'cực kỳ', 'hoàn toàn', 'một phần']
        };
    }

    initializeAIListeners() {
        // Paste AI content
        const pasteAIBtn = document.getElementById('paste-ai-content');
        if (pasteAIBtn) {
            pasteAIBtn.addEventListener('click', () => {
                this.quizManager.pasteFromClipboard('ai-content-input');
            });
        }

        // Lắng nghe sự kiện khi người dùng nhập/dán nội dung
        const contentInput = document.getElementById('ai-content-input');
        if (contentInput) {
            let typingTimer;
            const doneTypingInterval = 1500; // 1.5 giây sau khi ngừng gõ
            
            const analyzeContent = () => {
                const content = contentInput.value.trim();
                if (content.length > 100) {
                    // Tạo instance tạm thời của AIFileHandler nếu chưa có
                    if (!this.fileHandler) {
                        this.fileHandler = new AIFileHandler(this);
                    }
                    this.fileHandler.suggestOptimalQuestionCount(content);
                } else if (content.length === 0) {
                    // Xóa phân tích nếu không có nội dung
                    const analysisDiv = document.getElementById('content-analysis-info');
                    if (analysisDiv) {
                        analysisDiv.remove();
                    }
                }
            };
            
            contentInput.addEventListener('input', () => {
                clearTimeout(typingTimer);
                typingTimer = setTimeout(analyzeContent, doneTypingInterval);
            });
            
            // Xử lý khi paste
            contentInput.addEventListener('paste', () => {
                setTimeout(analyzeContent, 100);
            });
        }

        // Generate AI quiz
        const generateBtn = document.getElementById('generate-ai-quiz');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.generateAIQuiz();
            });
        }

        // Clear AI input
        const clearAIBtn = document.getElementById('clear-ai-input');
        if (clearAIBtn) {
            clearAIBtn.addEventListener('click', () => {
                this.clearAIInputs();
            });
        }

        // Save AI quiz
        const saveAIBtn = document.getElementById('save-ai-quiz');
        if (saveAIBtn) {
            saveAIBtn.addEventListener('click', () => {
                this.saveAIQuiz();
            });
        }

        // Edit AI quiz
        const editAIBtn = document.getElementById('edit-ai-quiz');
        if (editAIBtn) {
            editAIBtn.addEventListener('click', () => {
                this.enableEditMode();
            });
        }

        // Cancel AI quiz
        const cancelAIBtn = document.getElementById('cancel-ai-quiz');
        if (cancelAIBtn) {
            cancelAIBtn.addEventListener('click', () => {
                this.cancelAIQuiz();
            });
        }
    }

    clearAIInputs() {
        document.getElementById('ai-content-input').value = '';
        document.getElementById('ai-question-count').value = '10';
        this.quizManager.showToast('🗑️ Đã xóa nội dung', 'info');
    }

    async generateAIQuiz() {
        const content = document.getElementById('ai-content-input').value.trim();
        const questionCount = parseInt(document.getElementById('ai-question-count').value) || 10;

        // Validation
        if (!content) {
            this.quizManager.showToast('⚠️ Vui lòng nhập nội dung bài học!', 'error');
            return;
        }

        if (content.length < 100) {
            this.quizManager.showToast('⚠️ Nội dung quá ngắn! Vui lòng nhập ít nhất 100 ký tự.', 'error');
            return;
        }

        // Show loading
        document.getElementById('ai-loading').style.display = 'block';
        document.getElementById('ai-preview').style.display = 'none';

        try {
            // Simulate processing time for better UX
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Phân tích nội dung trước khi tạo câu hỏi
            const contentAnalysis = this.deepAnalyzeContent(content);
            
            if (!contentAnalysis.facts || contentAnalysis.facts.length === 0) {
                throw new Error('Không tìm thấy đủ thông tin rõ ràng trong nội dung. Vui lòng cung cấp nội dung có cấu trúc rõ ràng hơn.');
            }

            const questions = this.generateIntelligentQuestions(contentAnalysis, questionCount);
            
            if (!questions || questions.length === 0) {
                throw new Error('Không thể tạo câu hỏi từ nội dung này. Vui lòng thử với nội dung khác.');
            }

            this.quizManager.aiGeneratedQuiz = {
                questions: questions,
                totalQuestions: questions.length,
                contentAnalysis: contentAnalysis
            };

            this.displayAIPreview(questions);
            this.quizManager.showToast(`✨ AI đã phân tích và tạo ${questions.length} câu hỏi chất lượng!`, 'success');

        } catch (error) {
            console.error('AI Error:', error);
            this.quizManager.showToast(`❌ Lỗi: ${error.message}`, 'error');
        } finally {
            document.getElementById('ai-loading').style.display = 'none';
        }
    }

    /**
     * Phân tích sâu nội dung để hiểu ngữ cảnh và trích xuất thông tin
     */
    deepAnalyzeContent(content) {
        const analysis = {
            facts: [],           // Các sự kiện/thông tin rõ ràng
            definitions: [],     // Các định nghĩa
            relationships: [],   // Quan hệ giữa các khái niệm
            lists: [],          // Các danh sách liệt kê
            numbers: [],        // Thông tin số liệu
            concepts: [],       // Các khái niệm chính
            sentences: [],      // Tất cả câu đã phân tích
            mainTopic: null,    // Chủ đề chính
            keywords: []        // Từ khóa quan trọng
        };

        // Tách thành các câu và lọc câu có ý nghĩa
        const sentences = content
            .split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 15 && s.length < 500) // Lọc câu quá ngắn hoặc quá dài
            .filter(s => this.isValidSentence(s)); // Kiểm tra câu hợp lệ

        // Xác định chủ đề chính từ nội dung
        analysis.mainTopic = this.identifyMainTopic(content, sentences);
        analysis.keywords = this.extractKeywords(content);

        console.log('🎯 Chủ đề chính:', analysis.mainTopic);
        console.log('🔑 Từ khóa:', analysis.keywords.slice(0, 10));

        sentences.forEach(sentence => {
            const sentenceAnalysis = this.analyzeSentence(sentence, content);
            
            // Chỉ thêm câu có liên quan đến chủ đề chính
            if (this.isRelevantToTopic(sentenceAnalysis, analysis.mainTopic, analysis.keywords)) {
                analysis.sentences.push(sentenceAnalysis);

                // Phân loại thông tin
                if (sentenceAnalysis.type === 'definition') {
                    analysis.definitions.push(sentenceAnalysis);
                } else if (sentenceAnalysis.type === 'fact') {
                    analysis.facts.push(sentenceAnalysis);
                } else if (sentenceAnalysis.type === 'list') {
                    analysis.lists.push(sentenceAnalysis);
                } else if (sentenceAnalysis.type === 'number') {
                    analysis.numbers.push(sentenceAnalysis);
                }

                // Trích xuất khái niệm
                if (sentenceAnalysis.subject) {
                    analysis.concepts.push(sentenceAnalysis.subject);
                }
            }
        });

        // Loại bỏ trùng lặp và sắp xếp theo độ quan trọng
        analysis.concepts = [...new Set(analysis.concepts)];
        analysis.facts = this.rankByImportance(analysis.facts);
        analysis.definitions = this.rankByImportance(analysis.definitions);
        analysis.lists = this.rankByImportance(analysis.lists);
        analysis.numbers = this.rankByImportance(analysis.numbers);

        console.log('📊 Phân tích nội dung:', {
            'Định nghĩa': analysis.definitions.length,
            'Sự kiện': analysis.facts.length,
            'Danh sách': analysis.lists.length,
            'Số liệu': analysis.numbers.length,
            'Khái niệm': analysis.concepts.length,
            'Câu hợp lệ': analysis.sentences.length
        });

        return analysis;
    }

    /**
     * Kiểm tra câu có hợp lệ không
     */
    isValidSentence(sentence) {
        // Loại bỏ câu chỉ chứa số hoặc ký tự đặc biệt
        if (!/[a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]/i.test(sentence)) {
            return false;
        }

        // Loại bỏ câu có quá nhiều số
        const numberCount = (sentence.match(/\d/g) || []).length;
        if (numberCount > sentence.length * 0.3) {
            return false;
        }

        // Loại bỏ câu có quá nhiều ký tự đặc biệt
        const specialCharCount = (sentence.match(/[^a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ0-9\s.,!?;:()\-–—""'']/gi) || []).length;
        if (specialCharCount > sentence.length * 0.2) {
            return false;
        }

        // Câu phải có ít nhất 3 từ
        const words = sentence.split(/\s+/).filter(w => w.length > 0);
        if (words.length < 3) {
            return false;
        }

        return true;
    }

    /**
     * Xác định chủ đề chính của nội dung
     */
    identifyMainTopic(content, sentences) {
        // Đếm tần suất xuất hiện của các cụm từ
        const phraseFrequency = {};
        const contentLower = content.toLowerCase();

        // Trích xuất các cụm danh từ (2-4 từ)
        sentences.forEach(sentence => {
            const words = sentence.toLowerCase().split(/\s+/);
            
            // Cụm 2 từ
            for (let i = 0; i < words.length - 1; i++) {
                const phrase = words.slice(i, i + 2).join(' ');
                if (phrase.length > 5) {
                    phraseFrequency[phrase] = (phraseFrequency[phrase] || 0) + 1;
                }
            }

            // Cụm 3 từ
            for (let i = 0; i < words.length - 2; i++) {
                const phrase = words.slice(i, i + 3).join(' ');
                if (phrase.length > 8) {
                    phraseFrequency[phrase] = (phraseFrequency[phrase] || 0) + 1;
                }
            }
        });

        // Tìm cụm từ xuất hiện nhiều nhất
        const sortedPhrases = Object.entries(phraseFrequency)
            .filter(([phrase, count]) => count >= 2) // Xuất hiện ít nhất 2 lần
            .sort((a, b) => b[1] - a[1]);

        if (sortedPhrases.length > 0) {
            return sortedPhrases[0][0];
        }

        // Nếu không tìm thấy, lấy từ đầu tiên của câu đầu tiên
        if (sentences.length > 0) {
            const firstWords = sentences[0].split(/\s+/).slice(0, 3).join(' ');
            return firstWords.toLowerCase();
        }

        return 'nội dung học tập';
    }

    /**
     * Trích xuất từ khóa quan trọng
     */
    extractKeywords(content) {
        const words = content.toLowerCase()
            .split(/\s+/)
            .filter(w => w.length > 3) // Từ có ít nhất 4 ký tự
            .filter(w => !/^\d+$/.test(w)); // Không phải số

        // Đếm tần suất
        const frequency = {};
        words.forEach(word => {
            frequency[word] = (frequency[word] || 0) + 1;
        });

        // Loại bỏ stop words tiếng Việt
        const stopWords = ['của', 'và', 'các', 'được', 'trong', 'với', 'cho', 'từ', 'này', 'đó', 'những', 'một', 'có', 'là', 'để', 'như', 'khi', 'đã', 'sẽ', 'bởi', 'về', 'theo', 'hay', 'hoặc', 'nhưng', 'mà', 'nếu', 'thì'];
        
        const keywords = Object.entries(frequency)
            .filter(([word]) => !stopWords.includes(word))
            .filter(([word, count]) => count >= 2) // Xuất hiện ít nhất 2 lần
            .sort((a, b) => b[1] - a[1])
            .map(([word]) => word)
            .slice(0, 20);

        return keywords;
    }

    /**
     * Kiểm tra câu có liên quan đến chủ đề không
     */
    isRelevantToTopic(sentenceAnalysis, mainTopic, keywords) {
        const sentenceLower = sentenceAnalysis.original.toLowerCase();

        // Kiểm tra có chứa chủ đề chính
        if (mainTopic && sentenceLower.includes(mainTopic)) {
            return true;
        }

        // Kiểm tra có chứa ít nhất 1 từ khóa quan trọng
        const matchedKeywords = keywords.filter(kw => sentenceLower.includes(kw));
        if (matchedKeywords.length >= 1) {
            return true;
        }

        // Nếu là định nghĩa hoặc danh sách, ưu tiên giữ lại
        if (sentenceAnalysis.type === 'definition' || sentenceAnalysis.type === 'list') {
            return true;
        }

        return false;
    }

    /**
     * Phân tích một câu để xác định loại và trích xuất thông tin
     */
    analyzeSentence(sentence, fullContent) {
        const analysis = {
            original: sentence,
            type: 'general',
            subject: null,
            predicate: null,
            objects: [],
            keywords: [],
            importance: 0
        };

        // Phát hiện định nghĩa
        const definitionPatterns = [
            /(.+?)\s+(là|được định nghĩa là|nghĩa là|tức là|chính là|có nghĩa là)\s+(.+)/i,
            /(.+?)\s+được gọi là\s+(.+)/i,
            /(.+?)\s+là một\s+(.+)/i
        ];

        for (const pattern of definitionPatterns) {
            const match = sentence.match(pattern);
            if (match) {
                analysis.type = 'definition';
                analysis.subject = match[1].trim();
                analysis.predicate = match[2].trim();
                analysis.objects = [match[3] ? match[3].trim() : match[2].trim()];
                analysis.importance = 10;
                return analysis;
            }
        }

        // Phát hiện danh sách
        const listPatterns = [
            /(.+?)\s+(bao gồm|gồm có|có|như|ví dụ|là)\s*:?\s*(.+)/i
        ];

        for (const pattern of listPatterns) {
            const match = sentence.match(pattern);
            if (match && (match[3].includes(',') || match[3].includes('và'))) {
                analysis.type = 'list';
                analysis.subject = match[1].trim();
                analysis.objects = this.extractListItems(match[3]);
                analysis.importance = 8;
                return analysis;
            }
        }

        // Phát hiện số liệu
        const numberMatch = sentence.match(/(\d+)\s*([a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]+)/i);
        if (numberMatch) {
            analysis.type = 'number';
            analysis.subject = numberMatch[2];
            analysis.objects = [numberMatch[1]];
            analysis.importance = 7;
            return analysis;
        }

        // Phát hiện sự kiện/thông tin quan trọng
        const importantKeywords = ['quan trọng', 'chính', 'cần', 'phải', 'đặc biệt', 'nổi bật', 'chủ yếu'];
        const hasImportantKeyword = importantKeywords.some(kw => sentence.toLowerCase().includes(kw));
        
        if (hasImportantKeyword || sentence.length > 40) {
            analysis.type = 'fact';
            analysis.importance = 6;
            
            // Trích xuất chủ ngữ (thường là danh từ đầu câu)
            const words = sentence.split(/\s+/);
            if (words.length > 0) {
                analysis.subject = words.slice(0, Math.min(3, words.length)).join(' ');
            }
        }

        return analysis;
    }

    /**
     * Trích xuất các phần tử trong danh sách
     */
    extractListItems(text) {
        // Tách theo dấu phẩy và "và"
        const items = text
            .split(/[,;]|\s+và\s+/)
            .map(item => item.trim())
            .filter(item => item.length > 0 && item.length < 100);
        
        return items;
    }

    /**
     * Xếp hạng theo độ quan trọng
     */
    rankByImportance(items) {
        return items.sort((a, b) => b.importance - a.importance);
    }

    /**
     * Tạo câu hỏi thông minh dựa trên phân tích nội dung
     */
    generateIntelligentQuestions(analysis, maxQuestions) {
        const questions = [];
        const usedContent = new Set(); // Tránh tạo câu hỏi trùng lặp
        const usedSubjects = new Set(); // Tránh hỏi về cùng một chủ đề quá nhiều

        console.log('🔨 Bắt đầu tạo câu hỏi...');

        // 1. Tạo câu hỏi từ định nghĩa (ưu tiên cao nhất)
        for (const def of analysis.definitions) {
            if (questions.length >= maxQuestions) break;
            
            const question = this.createDefinitionQuestion(def, analysis);
            if (this.isValidQuestion(question, usedContent, usedSubjects)) {
                questions.push(question);
                usedContent.add(def.original);
                if (def.subject) usedSubjects.add(def.subject.toLowerCase());
                console.log(`✅ Câu ${questions.length}: Định nghĩa - ${question.question}`);
            }
        }

        // 2. Tạo câu hỏi từ danh sách
        for (const list of analysis.lists) {
            if (questions.length >= maxQuestions) break;
            
            const question = this.createListQuestion(list, analysis);
            if (this.isValidQuestion(question, usedContent, usedSubjects)) {
                questions.push(question);
                usedContent.add(list.original);
                if (list.subject) usedSubjects.add(list.subject.toLowerCase());
                console.log(`✅ Câu ${questions.length}: Danh sách - ${question.question}`);
            }
        }

        // 3. Tạo câu hỏi từ số liệu
        for (const num of analysis.numbers) {
            if (questions.length >= maxQuestions) break;
            
            const question = this.createNumberQuestion(num, analysis);
            if (this.isValidQuestion(question, usedContent, usedSubjects)) {
                questions.push(question);
                usedContent.add(num.original);
                if (num.subject) usedSubjects.add(num.subject.toLowerCase());
                console.log(`✅ Câu ${questions.length}: Số liệu - ${question.question}`);
            }
        }

        // 4. Tạo câu hỏi từ sự kiện
        for (const fact of analysis.facts) {
            if (questions.length >= maxQuestions) break;
            
            const question = this.createFactQuestion(fact, analysis);
            if (this.isValidQuestion(question, usedContent, usedSubjects)) {
                questions.push(question);
                usedContent.add(fact.original);
                if (fact.subject) usedSubjects.add(fact.subject.toLowerCase());
                console.log(`✅ Câu ${questions.length}: Sự kiện - ${question.question}`);
            }
        }

        // Kiểm tra số lượng câu hỏi tối thiểu
        if (questions.length < Math.min(5, maxQuestions)) {
            console.warn('⚠️ Không đủ câu hỏi chất lượng cao');
            throw new Error(`Chỉ tạo được ${questions.length} câu hỏi chất lượng. Vui lòng cung cấp nội dung chi tiết hơn với ít nhất 5-10 thông tin rõ ràng.`);
        }

        // Kiểm tra tính đa dạng của câu hỏi
        if (!this.hasQuestionDiversity(questions)) {
            console.warn('⚠️ Câu hỏi thiếu đa dạng');
        }

        // Xáo trộn vị trí đáp án đúng
        const finalQuestions = this.randomizeCorrectAnswers(questions);
        
        console.log(`🎉 Hoàn thành: ${finalQuestions.length} câu hỏi chất lượng cao`);
        
        return finalQuestions;
    }

    /**
     * Kiểm tra câu hỏi có hợp lệ không
     */
    isValidQuestion(question, usedContent, usedSubjects) {
        if (!question) {
            return false;
        }

        // Kiểm tra câu hỏi có đủ thông tin
        if (!question.question || !question.correctAnswer || !question.wrongAnswers) {
            return false;
        }

        // Kiểm tra có đủ 3 đáp án sai
        if (question.wrongAnswers.length < 3) {
            console.log(`❌ Không đủ đáp án sai cho: ${question.question}`);
            return false;
        }

        // Kiểm tra đáp án sai không trùng với đáp án đúng
        const allAnswers = [question.correctAnswer, ...question.wrongAnswers];
        const uniqueAnswers = new Set(allAnswers.map(a => a.toLowerCase().trim()));
        if (uniqueAnswers.size < 4) {
            console.log(`❌ Đáp án bị trùng lặp: ${question.question}`);
            return false;
        }

        // Kiểm tra độ dài đáp án hợp lý
        for (const answer of allAnswers) {
            if (answer.length < 2 || answer.length > 300) {
                console.log(`❌ Đáp án không hợp lệ (quá ngắn/dài): ${answer}`);
                return false;
            }
        }

        // Kiểm tra không hỏi quá nhiều về cùng một chủ đề
        if (question.source) {
            const subjectWords = question.question.toLowerCase().split(/\s+/).slice(0, 3).join(' ');
            if (usedSubjects.has(subjectWords)) {
                const count = Array.from(usedSubjects).filter(s => s.includes(subjectWords) || subjectWords.includes(s)).length;
                if (count >= 3) {
                    console.log(`⚠️ Đã hỏi quá nhiều về chủ đề: ${subjectWords}`);
                    return false;
                }
            }
        }

        // Kiểm tra đáp án sai có hợp lý không (không quá khác biệt)
        const correctLength = question.correctAnswer.length;
        for (const wrong of question.wrongAnswers) {
            const lengthRatio = wrong.length / correctLength;
            if (lengthRatio < 0.3 || lengthRatio > 3) {
                console.log(`⚠️ Đáp án sai quá khác biệt về độ dài: ${wrong}`);
                // Không reject hoàn toàn, chỉ cảnh báo
            }
        }

        return true;
    }

    /**
     * Kiểm tra tính đa dạng của câu hỏi
     */
    hasQuestionDiversity(questions) {
        if (questions.length < 3) {
            return true; // Quá ít câu để đánh giá
        }

        const types = questions.map(q => q.type);
        const uniqueTypes = new Set(types);

        // Nên có ít nhất 2 loại câu hỏi khác nhau
        if (uniqueTypes.size < 2) {
            console.warn('⚠️ Tất cả câu hỏi cùng một loại');
            return false;
        }

        return true;
    }

    /**
     * Tạo câu hỏi từ định nghĩa
     */
    createDefinitionQuestion(def, analysis) {
        if (!def.subject || !def.objects || def.objects.length === 0) {
            return null;
        }

        const correctAnswer = def.objects[0];
        const subject = def.subject;

        // Kiểm tra độ dài hợp lý
        if (correctAnswer.length < 10 || correctAnswer.length > 300) {
            return null;
        }

        // Tạo các đáp án sai dựa trên nội dung thực tế
        const wrongAnswers = this.generateContextualWrongAnswers(
            correctAnswer,
            analysis,
            'definition',
            subject
        );

        if (wrongAnswers.length < 3) {
            console.log(`⚠️ Không đủ đáp án sai cho định nghĩa: ${subject}`);
            return null;
        }

        // Tạo nhiều dạng câu hỏi khác nhau
        const questionTemplates = [
            `${subject} là gì?`,
            `Định nghĩa nào sau đây đúng về ${subject}?`,
            `${subject} được hiểu như thế nào?`,
            `Khái niệm ${subject} có nghĩa là gì?`
        ];

        const selectedQuestion = questionTemplates[Math.floor(Math.random() * questionTemplates.length)];

        return {
            question: selectedQuestion,
            correctAnswer: correctAnswer,
            wrongAnswers: wrongAnswers,
            type: 'definition',
            source: def.original
        };
    }

    /**
     * Tạo câu hỏi từ danh sách
     */
    createListQuestion(list, analysis) {
        if (!list.subject || !list.objects || list.objects.length < 2) {
            return null;
        }

        const questionTypes = [
            // Hỏi về một phần tử trong danh sách
            () => {
                const correctItem = list.objects[Math.floor(Math.random() * list.objects.length)];
                const wrongAnswers = this.generateWrongListItems(correctItem, list.objects, analysis);
                
                return {
                    question: `Điều nào sau đây thuộc về ${list.subject}?`,
                    correctAnswer: correctItem,
                    wrongAnswers: wrongAnswers,
                    type: 'list',
                    source: list.original
                };
            },
            // Hỏi về số lượng
            () => {
                const count = list.objects.length;
                const wrongCounts = [
                    count - 1,
                    count + 1,
                    count + 2
                ].filter(n => n > 0).map(n => `${n} ${this.getCountUnit(list.subject)}`);

                return {
                    question: `${list.subject} có bao nhiêu phần tử/thành phần?`,
                    correctAnswer: `${count} ${this.getCountUnit(list.subject)}`,
                    wrongAnswers: wrongCounts,
                    type: 'list-count',
                    source: list.original
                };
            }
        ];

        const selectedType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
        return selectedType();
    }

    /**
     * Tạo câu hỏi từ số liệu
     */
    createNumberQuestion(num, analysis) {
        if (!num.subject || !num.objects || num.objects.length === 0) {
            return null;
        }

        const correctNumber = num.objects[0];
        const subject = num.subject;

        // Tạo các số gần đúng
        const wrongNumbers = this.generateWrongNumbers(parseInt(correctNumber));

        return {
            question: `Có bao nhiêu ${subject} được đề cập trong nội dung?`,
            correctAnswer: correctNumber,
            wrongAnswers: wrongNumbers.map(n => n.toString()),
            type: 'number',
            source: num.original
        };
    }

    /**
     * Tạo câu hỏi từ sự kiện
     */
    createFactQuestion(fact, analysis) {
        if (!fact.subject || fact.original.length < 20) {
            return null;
        }

        const correctAnswer = fact.original;
        const wrongAnswers = this.generateContextualWrongAnswers(
            correctAnswer,
            analysis,
            'fact'
        );

        if (wrongAnswers.length < 2) {
            return null;
        }

        return {
            question: `Điều nào sau đây đúng về ${fact.subject}?`,
            correctAnswer: correctAnswer,
            wrongAnswers: wrongAnswers,
            type: 'fact',
            source: fact.original
        };
    }

    /**
     * Tạo đáp án sai dựa trên ngữ cảnh thực tế
     */
    generateContextualWrongAnswers(correctAnswer, analysis, type, subject = null) {
        const wrongAnswers = [];
        const correctLower = correctAnswer.toLowerCase();
        const correctLength = correctAnswer.length;

        console.log(`🔍 Tạo đáp án sai cho: "${correctAnswer.substring(0, 50)}..."`);

        // Chiến lược 1: Sử dụng thông tin từ các câu khác trong nội dung (ưu tiên cao nhất)
        if (type === 'definition' || type === 'fact') {
            // Lấy các câu có độ dài tương tự
            const similarLengthSentences = analysis.sentences
                .filter(s => {
                    const lengthRatio = s.original.length / correctLength;
                    return s.original !== correctAnswer && 
                           lengthRatio >= 0.5 && lengthRatio <= 2 &&
                           s.original.length >= 20 && s.original.length <= 300;
                })
                .slice(0, 10);

            for (const sent of similarLengthSentences) {
                if (wrongAnswers.length >= 3) break;
                
                // Đảm bảo đáp án sai không quá giống đáp án đúng
                const similarity = this.calculateSimilarity(correctAnswer, sent.original);
                if (similarity < 0.5 && similarity > 0.1) { // Không quá giống, không quá khác
                    // Kiểm tra không trùng với đáp án đã có
                    const isDuplicate = wrongAnswers.some(wa => 
                        this.calculateSimilarity(wa, sent.original) > 0.7
                    );
                    
                    if (!isDuplicate) {
                        wrongAnswers.push(sent.original);
                        console.log(`  ✓ Đáp án sai từ nội dung: "${sent.original.substring(0, 40)}..."`);
                    }
                }
            }
        }

        // Chiến lược 2: Tạo biến thể hợp lý bằng cách thay đổi từ khóa
        if (wrongAnswers.length < 3) {
            const variants = this.createReasonableVariants(correctAnswer, analysis);
            for (const variant of variants) {
                if (wrongAnswers.length >= 3) break;
                
                // Kiểm tra không trùng
                const isDuplicate = wrongAnswers.some(wa => 
                    this.calculateSimilarity(wa, variant) > 0.7
                );
                
                if (!isDuplicate && variant !== correctAnswer) {
                    wrongAnswers.push(variant);
                    console.log(`  ✓ Đáp án sai biến thể: "${variant.substring(0, 40)}..."`);
                }
            }
        }

        // Chiến lược 3: Sử dụng phủ định có ngữ cảnh
        if (wrongAnswers.length < 3) {
            const negation = this.createContextualNegation(correctAnswer);
            if (negation && negation !== correctAnswer) {
                const isDuplicate = wrongAnswers.some(wa => 
                    this.calculateSimilarity(wa, negation) > 0.7
                );
                
                if (!isDuplicate) {
                    wrongAnswers.push(negation);
                    console.log(`  ✓ Đáp án sai phủ định: "${negation.substring(0, 40)}..."`);
                }
            }
        }

        // Chiến lược 4: Tạo đáp án từ các khái niệm khác trong analysis
        if (wrongAnswers.length < 3 && analysis.definitions.length > 1) {
            for (const def of analysis.definitions) {
                if (wrongAnswers.length >= 3) break;
                
                if (def.objects && def.objects[0] !== correctAnswer) {
                    const otherDef = def.objects[0];
                    const similarity = this.calculateSimilarity(correctAnswer, otherDef);
                    
                    if (similarity < 0.5 && similarity > 0.1) {
                        const isDuplicate = wrongAnswers.some(wa => 
                            this.calculateSimilarity(wa, otherDef) > 0.7
                        );
                        
                        if (!isDuplicate) {
                            wrongAnswers.push(otherDef);
                            console.log(`  �� Đáp án sai từ định nghĩa khác: "${otherDef.substring(0, 40)}..."`);
                        }
                    }
                }
            }
        }

        // Đảm bảo có đủ 3 đáp án sai
        if (wrongAnswers.length < 3) {
            console.warn(`  ⚠️ Chỉ tạo được ${wrongAnswers.length} đáp án sai`);
        }

        return wrongAnswers.slice(0, 3);
    }

    /**
     * Tạo biến thể hợp lý của câu trả lời
     */
    createReasonableVariants(text, analysis) {
        const variants = [];
        const words = text.split(/\s+/);

        // Thay thế từ bằng từ trái nghĩa (chỉ thay 1-2 từ để giữ ngữ cảnh)
        let oppositeCount = 0;
        for (const [word, opposite] of Object.entries(this.contextDictionary.opposites)) {
            if (oppositeCount >= 2) break;
            
            if (text.toLowerCase().includes(word)) {
                const variant = text.replace(new RegExp(`\\b${word}\\b`, 'gi'), opposite);
                if (variant !== text && variant.length >= 10) {
                    variants.push(variant);
                    oppositeCount++;
                }
            }
        }

        // Thay đổi số lượng (chỉ nếu có từ chỉ số lượng)
        for (const quantifier of this.contextDictionary.quantifiers) {
            if (variants.length >= 5) break;
            
            if (text.toLowerCase().includes(quantifier)) {
                const otherQuantifiers = this.contextDictionary.quantifiers.filter(q => q !== quantifier);
                const randomQuantifier = otherQuantifiers[Math.floor(Math.random() * otherQuantifiers.length)];
                const variant = text.replace(new RegExp(`\\b${quantifier}\\b`, 'gi'), randomQuantifier);
                if (variant !== text && variant.length >= 10) {
                    variants.push(variant);
                }
            }
        }

        // Thay đổi một phần của câu bằng thông tin từ analysis
        if (variants.length < 3 && analysis.keywords.length > 0) {
            const textWords = text.toLowerCase().split(/\s+/);
            const matchedKeywords = analysis.keywords.filter(kw => textWords.includes(kw));
            
            if (matchedKeywords.length > 0) {
                const keywordToReplace = matchedKeywords[0];
                const otherKeywords = analysis.keywords.filter(kw => kw !== keywordToReplace);
                
                if (otherKeywords.length > 0) {
                    const newKeyword = otherKeywords[Math.floor(Math.random() * otherKeywords.length)];
                    const variant = text.replace(new RegExp(`\\b${keywordToReplace}\\b`, 'gi'), newKeyword);
                    if (variant !== text && variant.length >= 10) {
                        variants.push(variant);
                    }
                }
            }
        }

        // Chỉ thêm modifier nếu câu ngắn
        if (variants.length < 3 && text.length < 100) {
            const modifier = this.contextDictionary.modifiers[Math.floor(Math.random() * this.contextDictionary.modifiers.length)];
            const variant = `${modifier} ${text}`;
            if (variant.length <= 300) {
                variants.push(variant);
            }
        }

        return variants.filter(v => v.length >= 10 && v.length <= 300);
    }

    /**
     * Tạo phủ định có ngữ cảnh
     */
    createContextualNegation(text) {
        // Không chỉ thêm "không" đơn giản, mà tạo câu phủ định có nghĩa
        const negation = this.contextDictionary.negations[Math.floor(Math.random() * this.contextDictionary.negations.length)];
        
        // Nếu câu đã có động từ "là", thêm phủ định trước động từ
        if (text.includes(' là ')) {
            return text.replace(' là ', ` ${negation} là `);
        }
        
        // Ngược lại, thêm phủ định ở đầu câu
        return `${negation.charAt(0).toUpperCase() + negation.slice(1)} ${text.toLowerCase()}`;
    }

    /**
     * Tạo đáp án sai cho câu hỏi danh sách
     */
    generateWrongListItems(correctItem, allItems, analysis) {
        const wrongItems = [];

        // Lấy các items khác trong cùng danh sách
        const otherItems = allItems.filter(item => item !== correctItem);
        if (otherItems.length > 0) {
            wrongItems.push(...otherItems.slice(0, 2));
        }

        // Nếu không đủ, tạo items từ các danh sách khác
        if (wrongItems.length < 3) {
            for (const list of analysis.lists) {
                if (wrongItems.length >= 3) break;
                
                for (const item of list.objects) {
                    if (!allItems.includes(item) && !wrongItems.includes(item)) {
                        wrongItems.push(item);
                        if (wrongItems.length >= 3) break;
                    }
                }
            }
        }

        // Nếu vẫn không đủ, tạo biến thể
        if (wrongItems.length < 3) {
            const variants = this.createReasonableVariants(correctItem);
            wrongItems.push(...variants.slice(0, 3 - wrongItems.length));
        }

        return wrongItems.slice(0, 3);
    }

    /**
     * Tạo số sai hợp lý
     */
    generateWrongNumbers(correctNum) {
        const wrongNumbers = [];
        
        // Số gần đúng
        wrongNumbers.push(correctNum - 1);
        wrongNumbers.push(correctNum + 1);
        
        // Số khác biệt hơn
        if (correctNum > 10) {
            wrongNumbers.push(Math.floor(correctNum / 2));
            wrongNumbers.push(correctNum * 2);
        } else {
            wrongNumbers.push(correctNum + 2);
            wrongNumbers.push(correctNum + 3);
        }

        return wrongNumbers.filter(n => n > 0 && n !== correctNum).slice(0, 3);
    }

    /**
     * Tính độ tương đồng giữa hai chuỗi
     */
    calculateSimilarity(str1, str2) {
        const words1 = new Set(str1.toLowerCase().split(/\s+/));
        const words2 = new Set(str2.toLowerCase().split(/\s+/));
        
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        
        return intersection.size / union.size;
    }

    /**
     * Lấy đơn vị đếm phù hợp
     */
    getCountUnit(subject) {
        const lowerSubject = subject.toLowerCase();
        
        if (lowerSubject.includes('người') || lowerSubject.includes('cá nhân')) {
            return 'người';
        } else if (lowerSubject.includes('loại') || lowerSubject.includes('kiểu')) {
            return 'loại';
        } else if (lowerSubject.includes('phần') || lowerSubject.includes('thành phần')) {
            return 'phần';
        } else {
            return 'cái';
        }
    }

    /**
     * Xáo trộn vị trí đáp án đúng
     */
    randomizeCorrectAnswers(questions) {
        const letters = ['A', 'B', 'C', 'D'];
        const answerDistribution = { 'A': 0, 'B': 0, 'C': 0, 'D': 0 };
        
        const finalQuestions = questions.map((q, index) => {
            // Chọn vị trí ngẫu nhiên cho đáp án đúng
            let correctPosition;
            
            // Đảm bảo phân bố đều các đáp án
            if (index < 4) {
                correctPosition = index;
            } else {
                const minCount = Math.min(...Object.values(answerDistribution));
                const leastUsedAnswers = Object.keys(answerDistribution)
                    .filter(key => answerDistribution[key] === minCount);
                
                const randomLetter = leastUsedAnswers[Math.floor(Math.random() * leastUsedAnswers.length)];
                correctPosition = letters.indexOf(randomLetter);
            }
            
            // Tạo mảng tất cả đáp án
            const allAnswers = [q.correctAnswer, ...q.wrongAnswers].slice(0, 4);
            
            // Xáo trộn để đáp án đúng ở vị trí mới
            const shuffledAnswers = [];
            const tempAnswers = [...allAnswers];
            
            // Đặt đáp án đúng vào vị trí đã chọn
            shuffledAnswers[correctPosition] = q.correctAnswer;
            tempAnswers.splice(tempAnswers.indexOf(q.correctAnswer), 1);
            
            // Điền các đáp án sai vào các vị trí còn lại
            let wrongIndex = 0;
            for (let i = 0; i < 4; i++) {
                if (i !== correctPosition && wrongIndex < tempAnswers.length) {
                    shuffledAnswers[i] = tempAnswers[wrongIndex];
                    wrongIndex++;
                }
            }
            
            // Tạo options
            const options = shuffledAnswers.map((answer, i) => ({
                letter: letters[i],
                text: answer
            }));
            
            answerDistribution[letters[correctPosition]]++;
            
            return {
                question: q.question,
                options: options,
                correctAnswer: letters[correctPosition],
                type: q.type,
                source: q.source
            };
        });
        
        console.log('📊 Phân bố đáp án đúng:', answerDistribution);
        
        return finalQuestions;
    }

    displayAIPreview(questions) {
        const previewContent = document.getElementById('ai-quiz-preview-content');
        const questionTotal = document.getElementById('ai-question-total');
        
        questionTotal.textContent = questions.length;

        const questionsHTML = questions.map((q, index) => `
            <div class="preview-question" data-index="${index}">
                <div class="preview-question-header">
                    <div class="preview-question-number">${index + 1}</div>
                    <div class="preview-question-text" contenteditable="false">${q.question}</div>
                </div>
                <div class="preview-options">
                    ${q.options.map(opt => `
                        <div class="preview-option ${opt.letter === q.correctAnswer ? 'correct' : ''}" data-letter="${opt.letter}">
                            <span class="preview-option-letter">${opt.letter}.</span>
                            <span class="preview-option-text" contenteditable="false">${opt.text}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="preview-correct-answer">
                    <i class="fas fa-check-circle"></i>
                    Đáp án đúng: ${q.correctAnswer}
                </div>
                ${q.source ? `<div class="preview-source" style="font-size: 0.85em; color: #666; margin-top: 8px; font-style: italic;">Nguồn: "${q.source.substring(0, 80)}${q.source.length > 80 ? '...' : ''}"</div>` : ''}
            </div>
        `).join('');

        previewContent.innerHTML = questionsHTML;
        
        document.getElementById('ai-preview').style.display = 'block';
        document.getElementById('ai-preview').scrollIntoView({ behavior: 'smooth' });
    }

    enableEditMode() {
        const questions = document.querySelectorAll('.preview-question');
        questions.forEach(q => {
            q.classList.add('editable');
            const questionText = q.querySelector('.preview-question-text');
            const optionTexts = q.querySelectorAll('.preview-option-text');
            
            questionText.contentEditable = 'true';
            optionTexts.forEach(opt => {
                opt.contentEditable = 'true';
            });

            // Add click handler for correct answer selection
            const options = q.querySelectorAll('.preview-option');
            options.forEach(opt => {
                opt.style.cursor = 'pointer';
                opt.addEventListener('click', () => {
                    options.forEach(o => o.classList.remove('correct'));
                    opt.classList.add('correct');
                    
                    const letter = opt.dataset.letter;
                    const correctAnswerDiv = q.querySelector('.preview-correct-answer');
                    correctAnswerDiv.innerHTML = `
                        <i class="fas fa-check-circle"></i>
                        Đáp án đúng: ${letter}
                    `;
                });
            });
        });

        this.quizManager.showToast('✏️ Chế độ chỉnh sửa đã bật. Click vào đáp án để chọn đáp án đúng.', 'info');
    }

    saveAIQuiz() {
        const quizName = document.getElementById('ai-quiz-name').value.trim();
        
        if (!quizName) {
            this.quizManager.showToast('⚠️ Vui lòng nhập tên cho quiz!', 'error');
            return;
        }

        // Collect edited questions
        const questions = [];
        const questionElements = document.querySelectorAll('.preview-question');
        
        questionElements.forEach((qEl, index) => {
            const questionText = qEl.querySelector('.preview-question-text').textContent.trim();
            const options = [];
            let correctAnswer = '';

            qEl.querySelectorAll('.preview-option').forEach(optEl => {
                const letter = optEl.dataset.letter;
                const text = optEl.querySelector('.preview-option-text').textContent.trim();
                
                options.push({ letter, text });
                
                if (optEl.classList.contains('correct')) {
                    correctAnswer = letter;
                }
            });

            questions.push({
                question: questionText,
                options: options,
                correctAnswer: correctAnswer
            });
        });

        // Create quiz object
        const quiz = {
            id: Date.now().toString(),
            title: quizName,
            description: 'Quiz được tạo bởi AI thông minh - Phân tích và hiểu nội dung',
            questions: questions,
            createdAt: new Date().toISOString(),
            totalQuestions: questions.length
        };

        // Save to quizzes
        this.quizManager.quizzes.push(quiz);
        this.quizManager.saveQuizzes();
        this.quizManager.loadQuizList();
        this.quizManager.updateQuizSelector();

        // Clear and switch tab
        this.cancelAIQuiz();
        this.quizManager.switchTab('manage');
        
        this.quizManager.showToast(`🎉 Đã lưu quiz "${quizName}" với ${questions.length} câu hỏi chất lượng cao!`, 'success');
    }

    cancelAIQuiz() {
        document.getElementById('ai-preview').style.display = 'none';
        document.getElementById('ai-quiz-name').value = '';
        this.quizManager.aiGeneratedQuiz = null;
    }
}

// Initialize AI Generator when QuizManager is ready
if (typeof QuizManager !== 'undefined') {
    QuizManager.prototype.loadAISettings = function() {
        if (!this.aiGenerator) {
            this.aiGenerator = new AIQuizGenerator(this);
            console.log('✅ AI Quiz Generator đã được khởi tạo');
        }
    };
}
