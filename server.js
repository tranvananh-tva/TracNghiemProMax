const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Lắng nghe trên tất cả network interfaces

// Middleware
app.use(cors({
    origin: '*', // Cho phép tất cả origins (có thể giới hạn sau)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());
app.use(express.static(__dirname));

// Hàm lấy tất cả địa chỉ IP của máy
function getLocalIPAddresses() {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Bỏ qua địa chỉ internal và IPv6
            if (iface.family === 'IPv4' && !iface.internal) {
                addresses.push(iface.address);
            }
        }
    }
    
    return addresses;
}

// File để lưu trữ các bài quiz được chia sẻ
const SHARED_QUIZZES_FILE = path.join(__dirname, 'shared-quizzes.json');

// Khởi tạo file nếu chưa tồn tại
async function initializeSharedQuizzes() {
    try {
        await fs.access(SHARED_QUIZZES_FILE);
    } catch {
        await fs.writeFile(SHARED_QUIZZES_FILE, JSON.stringify([]));
    }
}

// Đọc danh sách quiz được chia sẻ
async function getSharedQuizzes() {
    try {
        const data = await fs.readFile(SHARED_QUIZZES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading shared quizzes:', error);
        return [];
    }
}

// Lưu danh sách quiz được chia sẻ
async function saveSharedQuizzes(quizzes) {
    try {
        await fs.writeFile(SHARED_QUIZZES_FILE, JSON.stringify(quizzes, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving shared quizzes:', error);
        return false;
    }
}

// API: Lấy danh sách tất cả quiz được chia sẻ
app.get('/api/shared-quizzes', async (req, res) => {
    try {
        const quizzes = await getSharedQuizzes();
        // Sắp xếp theo thời gian mới nhất
        quizzes.sort((a, b) => new Date(b.sharedAt) - new Date(a.sharedAt));
        res.json({ success: true, quizzes });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// API: Chia sẻ một quiz mới
app.post('/api/shared-quizzes', async (req, res) => {
    try {
        const { quiz, userName } = req.body;
        
        if (!quiz || !quiz.title || !quiz.questions || quiz.questions.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Dữ liệu quiz không hợp lệ' 
            });
        }

        const quizzes = await getSharedQuizzes();
        
        const sharedQuiz = {
            id: Date.now().toString(),
            originalId: quiz.id,
            title: quiz.title,
            description: quiz.description || 'Không có mô tả',
            questions: quiz.questions,
            totalQuestions: quiz.questions.length,
            userName: userName || 'Người dùng ẩn danh',
            sharedAt: new Date().toISOString(),
            views: 0,
            attempts: 0
        };

        quizzes.push(sharedQuiz);
        await saveSharedQuizzes(quizzes);

        res.json({ success: true, quiz: sharedQuiz });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// API: Lấy chi tiết một quiz
app.get('/api/shared-quizzes/:id', async (req, res) => {
    try {
        const quizzes = await getSharedQuizzes();
        const quiz = quizzes.find(q => q.id === req.params.id);
        
        if (!quiz) {
            return res.status(404).json({ 
                success: false, 
                error: 'Không tìm thấy quiz' 
            });
        }

        // Tăng số lượt xem
        quiz.views = (quiz.views || 0) + 1;
        await saveSharedQuizzes(quizzes);

        res.json({ success: true, quiz });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// API: Tăng số lượt làm bài
app.post('/api/shared-quizzes/:id/attempt', async (req, res) => {
    try {
        const quizzes = await getSharedQuizzes();
        const quiz = quizzes.find(q => q.id === req.params.id);
        
        if (!quiz) {
            return res.status(404).json({ 
                success: false, 
                error: 'Không tìm thấy quiz' 
            });
        }

        quiz.attempts = (quiz.attempts || 0) + 1;
        await saveSharedQuizzes(quizzes);

        res.json({ success: true, attempts: quiz.attempts });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// API: Xóa một quiz (chỉ người tạo mới có thể xóa - cần implement authentication)
app.delete('/api/shared-quizzes/:id', async (req, res) => {
    try {
        const quizzes = await getSharedQuizzes();
        const filteredQuizzes = quizzes.filter(q => q.id !== req.params.id);
        
        if (quizzes.length === filteredQuizzes.length) {
            return res.status(404).json({ 
                success: false, 
                error: 'Không tìm thấy quiz' 
            });
        }

        await saveSharedQuizzes(filteredQuizzes);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// API: Tìm kiếm quiz
app.get('/api/shared-quizzes/search/:keyword', async (req, res) => {
    try {
        const keyword = req.params.keyword.toLowerCase();
        const quizzes = await getSharedQuizzes();
        
        const results = quizzes.filter(quiz => 
            quiz.title.toLowerCase().includes(keyword) ||
            quiz.description.toLowerCase().includes(keyword) ||
            quiz.userName.toLowerCase().includes(keyword)
        );

        res.json({ success: true, quizzes: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// API: Lấy thông tin server (IP addresses)
app.get('/api/server-info', (req, res) => {
    const ipAddresses = getLocalIPAddresses();
    res.json({
        success: true,
        host: req.hostname,
        port: PORT,
        ipAddresses: ipAddresses,
        localUrl: `http://localhost:${PORT}`,
        networkUrls: ipAddresses.map(ip => `http://${ip}:${PORT}`)
    });
});

// Khởi động server
initializeSharedQuizzes().then(() => {
    app.listen(PORT, HOST, () => {
        const ipAddresses = getLocalIPAddresses();
        
        console.log('\n🚀
