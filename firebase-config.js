// Firebase Configuration for Community Quiz Sharing
// Cấu hình Firebase cho hệ thống chia sẻ quiz cộng đồng

// Import Firebase SDK
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    getDoc,
    doc, 
    query, 
    orderBy, 
    limit,
    where,
    updateDoc,
    increment,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase configuration
// Cấu hình Firebase cho ứng dụng Trắc Nghiệm Pro
// Đây là cấu hình demo - bạn nên tạo Firebase project riêng để sử dụng lâu dài
const firebaseConfig = {
    apiKey: "AIzaSyBOZbtJR0u1IHLkGUuOck8vwYpCVoPkNQ",
    authDomain: "tracnghiem-pro.firebaseapp.com",
    projectId: "tracnghiem-pro",
    storageBucket: "tracnghiem-pro.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};

// Lưu ý: Nếu cấu hình trên không hoạt động, vui lòng:
// 1. Truy cập: https://console.firebase.google.com/
// 2. Tạo project mới (miễn phí)
// 3. Thêm Web App và copy config vào đây
// 4. Enable Firestore Database ở chế độ test mode

// Initialize Firebase
let app;
let db;
let isFirebaseInitialized = false;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    isFirebaseInitialized = true;
    console.log('✅ Firebase initialized successfully');
} catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    isFirebaseInitialized = false;
}

// Firebase Quiz Manager - Quản lý quiz trên Firebase
class FirebaseQuizManager {
    constructor() {
        this.db = db;
        this.isOnline = isFirebaseInitialized;
        this.collectionName = 'shared-quizzes';
    }

    // Kiểm tra Firebase có sẵn sàng không
    isAvailable() {
        return this.isOnline && isFirebaseInitialized;
    }

    // Chia sẻ quiz lên Firebase
    async shareQuiz(quiz, userName) {
        if (!this.isAvailable()) {
            throw new Error('Firebase không khả dụng');
        }

        try {
            const quizData = {
                title: quiz.title,
                description: quiz.description || 'Không có mô tả',
                questions: quiz.questions,
                totalQuestions: quiz.questions.length,
                userName: userName,
                sharedAt: serverTimestamp(),
                views: 0,
                attempts: 0,
                likes: 0,
                originalId: quiz.id,
                tags: quiz.tags || [],
                difficulty: quiz.difficulty || 'medium',
                category: quiz.category || 'general'
            };

            const docRef = await addDoc(collection(this.db, this.collectionName), quizData);
            
            return {
                success: true,
                id: docRef.id,
                quiz: {
                    id: docRef.id,
                    ...quizData,
                    sharedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error('Error sharing quiz to Firebase:', error);
            throw error;
        }
    }

    // Lấy tất cả quiz từ Firebase
    async getAllQuizzes(limitCount = 50) {
        if (!this.isAvailable()) {
            throw new Error('Firebase không khả dụng');
        }

        try {
            const q = query(
                collection(this.db, this.collectionName),
                orderBy('sharedAt', 'desc'),
                limit(limitCount)
            );

            const querySnapshot = await getDocs(q);
            const quizzes = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                quizzes.push({
                    id: doc.id,
                    ...data,
                    sharedAt: data.sharedAt?.toDate?.()?.toISOString() || new Date().toISOString()
                });
            });

            return {
                success: true,
                quizzes: quizzes
            };
        } catch (error) {
            console.error('Error getting quizzes from Firebase:', error);
            throw error;
        }
    }

    // Lấy chi tiết một quiz
    async getQuizById(quizId) {
        if (!this.isAvailable()) {
            throw new Error('Firebase không khả dụng');
        }

        try {
            const docRef = doc(this.db, this.collectionName, quizId);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                throw new Error('Quiz không tồn tại');
            }

            const data = docSnap.data();
            
            // Tăng số lượt xem
            await updateDoc(docRef, {
                views: increment(1)
            });

            return {
                success: true,
                quiz: {
                    id: docSnap.id,
                    ...data,
                    sharedAt: data.sharedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                    views: (data.views || 0) + 1
                }
            };
        } catch (error) {
            console.error('Error getting quiz from Firebase:', error);
            throw error;
        }
    }

    // Tăng số lượt làm bài
    async incrementAttempts(quizId) {
        if (!this.isAvailable()) {
            return { success: false };
        }

        try {
            const docRef = doc(this.db, this.collectionName, quizId);
            await updateDoc(docRef, {
                attempts: increment(1)
            });

            return { success: true };
        } catch (error) {
            console.error('Error incrementing attempts:', error);
            return { success: false };
        }
    }

    // Tìm kiếm quiz
    async searchQuizzes(keyword) {
        if (!this.isAvailable()) {
            throw new Error('Firebase không khả dụng');
        }

        try {
            // Firebase không hỗ trợ full-text search natively
            // Lấy tất cả và filter ở client
            const result = await this.getAllQuizzes(100);
            
            if (!result.success) {
                throw new Error('Không thể tìm kiếm');
            }

            const keywordLower = keyword.toLowerCase();
            const filtered = result.quizzes.filter(quiz => 
                quiz.title.toLowerCase().includes(keywordLower) ||
                quiz.description.toLowerCase().includes(keywordLower) ||
                quiz.userName.toLowerCase().includes(keywordLower) ||
                (quiz.tags && quiz.tags.some(tag => tag.toLowerCase().includes(keywordLower)))
            );

            return {
                success: true,
                quizzes: filtered
            };
        } catch (error) {
            console.error('Error searching quizzes:', error);
            throw error;
        }
    }

    // Lấy quiz theo category
    async getQuizzesByCategory(category, limitCount = 20) {
        if (!this.isAvailable()) {
            throw new Error('Firebase không khả dụng');
        }

        try {
            const q = query(
                collection(this.db, this.collectionName),
                where('category', '==', category),
                orderBy('sharedAt', 'desc'),
                limit(limitCount)
            );

            const querySnapshot = await getDocs(q);
            const quizzes = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                quizzes.push({
                    id: doc.id,
                    ...data,
                    sharedAt: data.sharedAt?.toDate?.()?.toISOString() || new Date().toISOString()
                });
            });

            return {
                success: true,
                quizzes: quizzes
            };
        } catch (error) {
            console.error('Error getting quizzes by category:', error);
            throw error;
        }
    }

    // Like quiz
    async likeQuiz(quizId) {
        if (!this.isAvailable()) {
            return { success: false };
        }

        try {
            const docRef = doc(this.db, this.collectionName, quizId);
            await updateDoc(docRef, {
                likes: increment(1)
            });

            return { success: true };
        } catch (error) {
            console.error('Error liking quiz:', error);
            return { success: false };
        }
    }

    // Lấy quiz phổ biến nhất
    async getPopularQuizzes(limitCount = 10) {
        if (!this.isAvailable()) {
            throw new Error('Firebase không khả dụng');
        }

        try {
            const q = query(
                collection(this.db, this.collectionName),
                orderBy('views', 'desc'),
                limit(limitCount)
            );

            const querySnapshot = await getDocs(q);
            const quizzes = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                quizzes.push({
                    id: doc.id,
                    ...data,
                    sharedAt: data.sharedAt?.toDate?.()?.toISOString() || new Date().toISOString()
                });
            });

            return {
                success: true,
                quizzes: quizzes
            };
        } catch (error) {
            console.error('Error getting popular quizzes:', error);
            throw error;
        }
    }
}

// Export Firebase Quiz Manager
const firebaseQuizManager = new FirebaseQuizManager();
window.firebaseQuizManager = firebaseQuizManager;

export { firebaseQuizManager, isFirebaseInitialized };
