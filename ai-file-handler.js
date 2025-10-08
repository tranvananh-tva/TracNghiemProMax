// AI File Handler - Xử lý upload và đọc file Word, PDF, TXT
class AIFileHandler {
    constructor(aiGenerator) {
        this.aiGenerator = aiGenerator;
        this.currentFile = null;
        this.initializeFileHandlers();
    }

    initializeFileHandlers() {
        const fileInput = document.getElementById('ai-file-input');
        const selectFileBtn = document.getElementById('select-file-btn');
        const removeFileBtn = document.getElementById('remove-file-btn');
        const fileUploadArea = document.getElementById('file-upload-area');

        // Click to select file
        if (selectFileBtn) {
            selectFileBtn.addEventListener('click', () => {
                fileInput.click();
            });
        }

        // File input change
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleFile(file);
                }
            });
        }

        // Remove file
        if (removeFileBtn) {
            removeFileBtn.addEventListener('click', () => {
                this.removeFile();
            });
        }

        // Drag and drop
        if (fileUploadArea) {
            fileUploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                fileUploadArea.classList.add('dragover');
            });

            fileUploadArea.addEventListener('dragleave', () => {
                fileUploadArea.classList.remove('dragover');
            });

            fileUploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                fileUploadArea.classList.remove('dragover');
                
                const file = e.dataTransfer.files[0];
                if (file) {
                    this.handleFile(file);
                }
            });

            // Click on upload area
            fileUploadArea.addEventListener('click', (e) => {
                if (e.target === fileUploadArea || e.target.closest('.file-upload-content')) {
                    fileInput.click();
                }
            });
        }
    }

    async handleFile(file) {
        // Validate file type
        const validTypes = ['.txt', '.doc', '.docx', '.pdf'];
        const fileExt = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!validTypes.includes(fileExt)) {
            this.aiGenerator.quizManager.showToast('⚠️ File không được hỗ trợ! Chỉ chấp nhận: TXT, DOC, DOCX, PDF', 'error');
            return;
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            this.aiGenerator.quizManager.showToast('⚠️ File quá lớn! Kích thước tối đa: 10MB', 'error');
            return;
        }

        this.currentFile = file;
        this.displayFileInfo(file);

        // Read file content
        try {
            const content = await this.readFileContent(file);
            
            if (content && content.length > 0) {
                // Set content to textarea
                document.getElementById('ai-content-input').value = content;
                
                // Phân tích và đề xuất số lượng câu hỏi tối ưu
                this.suggestOptimalQuestionCount(content);
                
                this.aiGenerator.quizManager.showToast(`✅ Đã đọc file: ${file.name}`, 'success');
            } else {
                throw new Error('Không thể đọc nội dung file');
            }
        } catch (error) {
            console.error('Error reading file:', error);
            this.aiGenerator.quizManager.showToast(`❌ Lỗi đọc file: ${error.message}`, 'error');
            this.removeFile();
        }
    }

    displayFileInfo(file) {
        const fileInfo = document.getElementById('file-info');
        const fileName = document.getElementById('file-name');
        const fileSize = document.getElementById('file-size');
        const uploadContent = document.querySelector('.file-upload-content');

        fileName.textContent = file.name;
        fileSize.textContent = this.formatFileSize(file.size);

        uploadContent.style.display = 'none';
        fileInfo.style.display = 'flex';
    }

    removeFile() {
        this.currentFile = null;
        document.getElementById('ai-file-input').value = '';
        
        const fileInfo = document.getElementById('file-info');
        const uploadContent = document.querySelector('.file-upload-content');

        fileInfo.style.display = 'none';
        uploadContent.style.display = 'flex';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    async readFileContent(file) {
        const fileExt = '.' + file.name.split('.').pop().toLowerCase();

        switch (fileExt) {
            case '.txt':
                return await this.readTextFile(file);
            case '.doc':
            case '.docx':
                return await this.readWordFile(file);
            case '.pdf':
                return await this.readPDFFile(file);
            default:
                throw new Error('Định dạng file không được hỗ trợ');
        }
    }

    async readTextFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                let text = e.target.result;
                // Xử lý và làm sạch text nhưng giữ nguyên tiếng Việt
                text = this.cleanText(text);
                resolve(text);
            };
            
            reader.onerror = () => {
                reject(new Error('Không thể đọc file TXT'));
            };
            
            // Đọc với UTF-8 encoding
            reader.readAsText(file, 'UTF-8');
        });
    }

    async readWordFile(file) {
        // Đọc file Word (.docx) - sử dụng JSZip để extract XML
        try {
            this.aiGenerator.quizManager.showToast('ℹ️ Đang đọc file Word...', 'info');
            
            // Kiểm tra xem có JSZip không
            if (typeof JSZip !== 'undefined') {
                // Phương ph��p tốt nhất: dùng JSZip để đọc XML
                const arrayBuffer = await file.arrayBuffer();
                const zip = await JSZip.loadAsync(arrayBuffer);
                
                // Đọc file document.xml từ Word
                const documentXml = await zip.file('word/document.xml').async('string');
                
                // Extract text từ XML với encoding đúng
                const text = this.extractTextFromWordXML(documentXml);
                
                if (text && text.length > 50) {
                    return this.cleanText(text);
                } else {
                    throw new Error('Không thể trích xuất text từ file Word.');
                }
            } else {
                // Fallback: thử phương pháp đơn giản hơn
                const arrayBuffer = await file.arrayBuffer();
                const text = await this.extractTextFromDocxFallback(arrayBuffer);
                
                if (text && text.length > 50) {
                    return this.cleanText(text);
                } else {
                    throw new Error('Không thể trích xuất text từ file Word.');
                }
            }
        } catch (error) {
            console.error('Error reading Word file:', error);
            throw new Error('Không thể đọc file Word. Vui lòng:\n1. Mở file Word\n2. Copy toàn bộ nội dung (Ctrl+A, Ctrl+C)\n3. Dán vào ô bên dưới (Ctrl+V)');
        }
    }

    extractTextFromWordXML(xmlString) {
        // Extract text từ Word XML với hỗ trợ đầy đủ Unicode/tiếng Việt
        try {
            // Parse XML
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
            
            // Lấy tất cả text nodes từ <w:t> tags
            const textNodes = xmlDoc.getElementsByTagName('w:t');
            let text = '';
            
            for (let i = 0; i < textNodes.length; i++) {
                const nodeText = textNodes[i].textContent;
                if (nodeText) {
                    text += nodeText + ' ';
                }
            }
            
            return text.trim();
        } catch (error) {
            console.error('Error parsing Word XML:', error);
            return '';
        }
    }

    async extractTextFromDocxFallback(arrayBuffer) {
        // Phương pháp fallback: đọc binary với UTF-8 decoding đúng
        try {
            // Sử dụng TextDecoder để decode UTF-8 đúng cách
            const uint8Array = new Uint8Array(arrayBuffer);
            
            // Thử decode với UTF-8
            const decoder = new TextDecoder('utf-8', { fatal: false });
            let rawText = decoder.decode(uint8Array);
            
            // Tìm các đoạn text có ý nghĩa
            // Hỗ trợ tiếng Việt đầy đủ: À-ỹ, à-ỹ
            const vietnamesePattern = /[a-zA-ZÀ-ỹ0-9\s.,!?;:()\-–—""'']+/gu;
            const matches = rawText.match(vietnamesePattern);
            
            if (matches && matches.length > 0) {
                // Lọc các đoạn text có độ dài hợp lý
                const meaningfulText = matches
                    .filter(text => text.trim().length >= 10)
                    .join(' ');
                
                return meaningfulText.substring(0, 50000); // Limit 50k chars
            }
            
            return '';
        } catch (error) {
            console.error('Error in fallback extraction:', error);
            return '';
        }
    }

    cleanText(text) {
        // Làm sạch text nhưng giữ nguyên tiếng Việt
        if (!text) return '';
        
        return text
            // Loại bỏ các ký tự điều khiển nhưng giữ tiếng Việt
            .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
            // Chuẩn hóa khoảng trắng
            .replace(/[ \t]+/g, ' ')
            // Chuẩn hóa dấu xuống dòng
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            // Loại bỏ khoảng trắng đầu/cuối dòng
            .split('\n')
            .map(line => line.trim())
            .join('\n')
            .trim();
    }

    async readPDFFile(file) {
        // Đọc file PDF - cần thư viện pdf.js
        // Kiểm tra xem có thư viện PDF.js không
        
        if (typeof pdfjsLib !== 'undefined') {
            try {
                this.aiGenerator.quizManager.showToast('ℹ️ Đang đọc file PDF...', 'info');
                
                const arrayBuffer = await file.arrayBuffer();
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;
                
                let fullText = '';
                
                // Đọc từng trang
                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                    const page = await pdf.getPage(pageNum);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + '\n';
                }
                
                if (fullText && fullText.length > 50) {
                    return this.cleanText(fullText);
                } else {
                    throw new Error('Không thể trích xuất text từ PDF.');
                }
            } catch (error) {
                console.error('Error reading PDF:', error);
                throw new Error('Lỗi đọc file PDF. Vui lòng copy nội dung và dán trực tiếp.');
            }
        } else {
            // Không có thư viện PDF.js
            this.aiGenerator.quizManager.showToast('⚠️ Đọc file PDF yêu cầu thư viện bổ sung. Vui lòng copy nội dung và dán trực tiếp.', 'warning');
            throw new Error('Đọc file PDF chưa được hỗ trợ đầy đủ. Vui lòng copy nội dung từ PDF và dán vào ô bên dưới.');
        }
    }

    /**
     * Phân tích nội dung và đề xuất số lượng câu hỏi tối ưu
     */
    suggestOptimalQuestionCount(content) {
        console.log('🔍 Bắt đầu phân tích nội dung để đề xuất số câu hỏi...');
        
        // Phân tích cơ bản
        const contentLength = content.length;
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 15);
        const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 50);
        const words = content.split(/\s+/).filter(w => w.length > 0);
        
        // Đếm các loại thông tin có thể tạo câu hỏi
        let potentialQuestions = 0;
        
        // 1. Đếm định nghĩa (là, được định nghĩa là, nghĩa là, tức là)
        const definitionPatterns = [
            /(.+?)\s+(là|được định nghĩa là|nghĩa là|tức là|chính là|có nghĩa là)\s+(.+)/gi,
            /(.+?)\s+được gọi là\s+(.+)/gi
        ];
        
        let definitions = 0;
        definitionPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) definitions += matches.length;
        });
        
        // 2. Đếm danh sách (bao gồm, gồm có, như, ví dụ)
        const listPatterns = [
            /(.+?)\s+(bao gồm|gồm có|có|như|ví dụ|là)\s*:?\s*(.+)/gi
        ];
        
        let lists = 0;
        listPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                // Chỉ đếm những câu có dấu phẩy hoặc "và" (thực sự là danh sách)
                matches.forEach(match => {
                    if (match.includes(',') || match.includes(' và ')) {
                        lists++;
                    }
                });
            }
        });
        
        // 3. Đếm số liệu (số + đơn vị)
        const numberMatches = content.match(/\d+\s*[a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ%]+/gi);
        const numbers = numberMatches ? numberMatches.length : 0;
        
        // 4. Đếm câu có từ khóa quan trọng
        const importantKeywords = ['quan trọng', 'chính', 'cần', 'phải', 'đặc biệt', 'nổi bật', 'chủ yếu', 'cơ bản', 'thiết yếu'];
        let importantSentences = 0;
        sentences.forEach(sentence => {
            const lowerSentence = sentence.toLowerCase();
            if (importantKeywords.some(kw => lowerSentence.includes(kw))) {
                importantSentences++;
            }
        });
        
        // 5. Đếm câu có độ dài vừa phải (có thể tạo câu hỏi)
        const validSentences = sentences.filter(s => {
            const length = s.trim().length;
            return length >= 30 && length <= 500 && this.isValidSentenceForQuestion(s);
        }).length;
        
        // Tính tổng số câu hỏi tiềm năng
        potentialQuestions = definitions + lists + numbers + importantSentences + Math.floor(validSentences * 0.3);
        
        // Tính toán số câu hỏi đề xuất dựa trên nhiều yếu tố
        let suggestedMin, suggestedMax, optimal;
        
        if (contentLength < 500) {
            // Nội dung rất ngắn
            suggestedMin = 3;
            suggestedMax = 5;
            optimal = Math.min(potentialQuestions, 5);
        } else if (contentLength < 1500) {
            // Nội dung ngắn
            suggestedMin = 5;
            suggestedMax = 10;
            optimal = Math.min(potentialQuestions, 8);
        } else if (contentLength < 3000) {
            // Nội dung trung bình
            suggestedMin = 8;
            suggestedMax = 15;
            optimal = Math.min(potentialQuestions, 12);
        } else if (contentLength < 5000) {
            // Nội dung dài
            suggestedMin = 12;
            suggestedMax = 20;
            optimal = Math.min(potentialQuestions, 18);
        } else {
            // Nội dung rất dài
            suggestedMin = 15;
            suggestedMax = 30;
            optimal = Math.min(potentialQuestions, 25);
        }
        
        // Đảm bảo optimal không vượt quá số câu hỏi có thể tạo
        optimal = Math.max(suggestedMin, Math.min(optimal, potentialQuestions));
        
        // Cập nhật giá trị vào input
        const questionCountInput = document.getElementById('ai-question-count');
        if (questionCountInput) {
            questionCountInput.value = optimal;
            
            // Cập nhật min và max cho input
            questionCountInput.min = suggestedMin;
            questionCountInput.max = Math.min(suggestedMax, potentialQuestions);
        }
        
        // Hiển thị thông tin phân tích
        this.displayContentAnalysis({
            contentLength,
            sentences: sentences.length,
            paragraphs: paragraphs.length,
            words: words.length,
            definitions,
            lists,
            numbers,
            importantSentences,
            validSentences,
            potentialQuestions,
            suggestedMin,
            suggestedMax,
            optimal
        });
        
        console.log('📊 Kết quả phân tích:', {
            'Độ dài': contentLength,
            'Câu': sentences.length,
            'Đoạn văn': paragraphs.length,
            'Từ': words.length,
            'Định nghĩa': definitions,
            'Danh sách': lists,
            'Số liệu': numbers,
            'Câu quan trọng': importantSentences,
            'Câu hợp lệ': validSentences,
            'Câu hỏi tiềm năng': potentialQuestions,
            'Đề xuất': `${suggestedMin}-${suggestedMax} câu`,
            'Tối ưu': optimal
        });
    }
    
    /**
     * Kiểm tra câu có hợp lệ để tạo câu hỏi không
     */
    isValidSentenceForQuestion(sentence) {
        // Loại bỏ câu chỉ chứa số hoặc ký tự đặc biệt
        if (!/[a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệí��ỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]/i.test(sentence)) {
            return false;
        }
        
        // Loại bỏ câu có quá nhiều số
        const numberCount = (sentence.match(/\d/g) || []).length;
        if (numberCount > sentence.length * 0.3) {
            return false;
        }
        
        // Câu phải có ít nhất 5 từ
        const words = sentence.split(/\s+/).filter(w => w.length > 0);
        if (words.length < 5) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Hiển thị thông tin phân tích nội dung
     */
    displayContentAnalysis(analysis) {
        // Tạo hoặc cập nhật phần hiển thị phân tích
        let analysisDiv = document.getElementById('content-analysis-info');
        
        if (!analysisDiv) {
            // Tạo mới nếu chưa có
            analysisDiv = document.createElement('div');
            analysisDiv.id = 'content-analysis-info';
            analysisDiv.style.cssText = `
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                border-radius: 12px;
                margin: 15px 0;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                animation: slideIn 0.5s ease-out;
            `;
            
            // Thêm vào sau textarea
            const contentInput = document.getElementById('ai-content-input');
            if (contentInput && contentInput.parentNode) {
                contentInput.parentNode.insertBefore(analysisDiv, contentInput.nextSibling);
            }
        }
        
        // Tính chất lượng nội dung
        const qualityScore = Math.min(100, Math.round(
            (analysis.definitions * 10 + 
             analysis.lists * 8 + 
             analysis.numbers * 6 + 
             analysis.importantSentences * 5 + 
             analysis.validSentences * 2) / analysis.potentialQuestions * 100
        ));
        
        let qualityLabel, qualityColor, qualityIcon;
        if (qualityScore >= 80) {
            qualityLabel = 'Xuất sắc';
            qualityColor = '#4ade80';
            qualityIcon = '🌟';
        } else if (qualityScore >= 60) {
            qualityLabel = 'T���t';
            qualityColor = '#60a5fa';
            qualityIcon = '✨';
        } else if (qualityScore >= 40) {
            qualityLabel = 'Khá';
            qualityColor = '#fbbf24';
            qualityIcon = '⭐';
        } else {
            qualityLabel = 'Cần cải thiện';
            qualityColor = '#f87171';
            qualityIcon = '💡';
        }
        
        analysisDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                <div style="font-size: 2.5em;">${qualityIcon}</div>
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 5px 0; font-size: 1.3em; font-weight: 600;">
                        Phân Tích Nội Dung Thông Minh
                    </h3>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 0.95em; opacity: 0.9;">Chất lượng:</span>
                        <span style="background: ${qualityColor}; padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 0.9em;">
                            ${qualityLabel} (${qualityScore}%)
                        </span>
                    </div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 15px;">
                <div style="background: rgba(255,255,255,0.15); padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.8em; font-weight: 700; margin-bottom: 4px;">${analysis.words.toLocaleString()}</div>
                    <div style="font-size: 0.85em; opacity: 0.9;">Từ</div>
                </div>
                <div style="background: rgba(255,255,255,0.15); padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.8em; font-weight: 700; margin-bottom: 4px;">${analysis.sentences}</div>
                    <div style="font-size: 0.85em; opacity: 0.9;">Câu</div>
                </div>
                <div style="background: rgba(255,255,255,0.15); padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.8em; font-weight: 700; margin-bottom: 4px;">${analysis.paragraphs}</div>
                    <div style="font-size: 0.85em; opacity: 0.9;">Đoạn văn</div>
                </div>
            </div>
            
            <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                <div style="font-weight: 600; margin-bottom: 10px; font-size: 1.05em;">📝 Thông tin có thể tạo câu hỏi:</div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 0.9em;">
                    <div>✓ Định nghĩa: <strong>${analysis.definitions}</strong></div>
                    <div>✓ Danh sách: <strong>${analysis.lists}</strong></div>
                    <div>✓ Số liệu: <strong>${analysis.numbers}</strong></div>
                    <div>✓ Thông tin quan trọng: <strong>${analysis.importantSentences}</strong></div>
                </div>
            </div>
            
            <div style="background: rgba(255,255,255,0.25); padding: 18px; border-radius: 10px; border: 2px solid rgba(255,255,255,0.3);">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <span style="font-size: 1.5em;">🎯</span>
                    <div style="font-weight: 700; font-size: 1.15em;">Đề Xuất Số Câu Hỏi Tối Ưu</div>
                </div>
                <div style="font-size: 0.95em; margin-bottom: 12px; opacity: 0.95;">
                    Dựa trên phân tích nội dung, AI phát hiện <strong>${analysis.potentialQuestions} câu hỏi tiềm năng</strong>
                </div>
                <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                    <div style="background: rgba(255,255,255,0.3); padding: 10px 20px; border-radius: 8px; flex: 1; min-width: 150px;">
                        <div style="font-size: 0.85em; opacity: 0.9; margin-bottom: 4px;">Khoảng đề xuất</div>
                        <div style="font-size: 1.4em; font-weight: 700;">${analysis.suggestedMin} - ${analysis.suggestedMax} câu</div>
                    </div>
                    <div style="background: #4ade80; padding: 10px 20px; border-radius: 8px; flex: 1; min-width: 150px; box-shadow: 0 4px 10px rgba(74, 222, 128, 0.3);">
                        <div style="font-size: 0.85em; margin-bottom: 4px;">✨ Số câu tối ưu nhất</div>
                        <div style="font-size: 1.8em; font-weight: 700;">${analysis.optimal} câu</div>
                    </div>
                </div>
                <div style="margin-top: 12px; font-size: 0.88em; opacity: 0.9; font-style: italic;">
                    💡 Mẹo: Số câu hỏi đã được tự động điền vào ô bên dưới. Bạn có thể điều chỉnh theo nhu cầu!
                </div>
            </div>
        `;
        
        // Thêm animation
        if (!document.querySelector('#content-analysis-animation-style')) {
            const style = document.createElement('style');
            style.id = 'content-analysis-animation-style';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Extend AIQuizGenerator to include file handler
if (typeof AIQuizGenerator !== 'undefined') {
    const originalInit = AIQuizGenerator.prototype.initializeAIListeners;
    
    AIQuizGenerator.prototype.initializeAIListeners = function() {
        // Call original init
        if (originalInit) {
            originalInit.call(this);
        }
        
        // Initialize file handler
        console.log('Initializing AIFileHandler...');
        this.fileHandler = new AIFileHandler(this);
        console.log('AIFileHandler initialized successfully');
    };
}
