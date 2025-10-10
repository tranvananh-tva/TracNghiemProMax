// Supabase Configuration for Community Quiz Sharing
// Cấu hình Supabase cho hệ thống chia sẻ quiz cộng đồng

// Import Supabase Client
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Supabase configuration
// Cấu hình Supabase cho ứng dụng Trắc Nghiệm Pro
// Hướng dẫn lấy thông tin này:
// 1. Truy cập: https://supabase.com/
// 2. Tạo project mới (miễn phí)
// 3. Vào Settings > API
// 4. Copy URL và anon/public key vào đây

const SUPABASE_URL = 'https://uprsyadxavxaqrenuxzh.supabase.co'; // Ví dụ: https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwcnN5YWR4YXZ4YXFyZW51eHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NjE5NTMsImV4cCI6MjA3MTQzNzk1M30.dijOO02YXfwRcl_GcCdbxmAisTm0jfbwJoKIXmD6hiI'; // Key từ Settings > API

// Initialize Supabase
let supabase;
let isSupabaseInitialized = false;

try {
    if (SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        isSupabaseInitialized = true;
        console.log('✅ Supabase initialized successfully');
    } else {
        console.warn('⚠️ Supabase chưa được cấu hình. Vui lòng cập nhật SUPABASE_URL và SUPABASE_ANON_KEY');
    }
} catch (error) {
    console.error('❌ Supabase initialization failed:', error);
    isSupabaseInitialized = false;
}

// Supabase Quiz Manager - Quản lý quiz trên Supabase
class SupabaseQuizManager {
    constructor() {
        this.supabase = supabase;
        this.isOnline = isSupabaseInitialized;
        this.tableName = 'shared_quizzes';
        this.realtimeChannel = null;
        this.updateCallbacks = [];
    }

    // Kiểm tra Supabase có sẵn sàng không
    isAvailable() {
        return this.isOnline && isSupabaseInitialized;
    }

    // Đăng ký callback để nhận cập nhật realtime
    onQuizUpdate(callback) {
        this.updateCallbacks.push(callback);
    }

    // Hủy đăng ký callback
    offQuizUpdate(callback) {
        this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== callback);
    }

    // Thông báo cho tất cả callbacks
    notifyUpdate(quiz) {
        this.updateCallbacks.forEach(callback => {
            try {
                callback(quiz);
            } catch (error) {
                console.error('Error in update callback:', error);
            }
        });
    }

    // Bật Realtime cho bảng shared_quizzes
    enableRealtime() {
        if (!this.isAvailable()) {
            console.warn('Supabase not available, cannot enable realtime');
            return;
        }

        // Hủy channel cũ nếu có
        if (this.realtimeChannel) {
            this.supabase.removeChannel(this.realtimeChannel);
        }

        // Tạo channel mới
        this.realtimeChannel = this.supabase
            .channel('shared_quizzes_changes')
            .on(
                'postgres_changes',
                {
                    event: '*', // Lắng nghe tất cả events: INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: this.tableName
                },
                (payload) => {
                    console.log('📡 Realtime update:', payload);
                    
                    // Xử lý các loại event
                    if (payload.eventType === 'INSERT') {
                        // Quiz mới được thêm
                        this.handleNewQuiz(payload.new);
                    } else if (payload.eventType === 'UPDATE') {
                        // Quiz được cập nhật (views, attempts, likes)
                        this.handleQuizUpdate(payload.new);
                    } else if (payload.eventType === 'DELETE') {
                        // Quiz bị xóa
                        this.handleQuizDelete(payload.old);
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Realtime subscribed successfully');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ Realtime subscription error');
                } else if (status === 'TIMED_OUT') {
                    console.warn('⚠️ Realtime subscription timed out');
                }
            });
    }

    // Tắt Realtime
    disableRealtime() {
        if (this.realtimeChannel) {
            this.supabase.removeChannel(this.realtimeChannel);
            this.realtimeChannel = null;
            console.log('🔌 Realtime disabled');
        }
    }

    // Xử lý quiz mới
    handleNewQuiz(quiz) {
        console.log('🆕 New quiz added:', quiz.title);
        
        // Thông báo cho UI
        if (window.quizManager && window.quizManager.showToast) {
            window.quizManager.showToast(`🆕 Quiz mới: "${quiz.title}"`, 'info');
        }
        
        // Thông báo cho callbacks
        this.notifyUpdate({
            type: 'INSERT',
            quiz: this.formatQuiz(quiz)
        });
    }

    // Xử lý cập nhật quiz
    handleQuizUpdate(quiz) {
        console.log('🔄 Quiz updated:', quiz.title, {
            views: quiz.views,
            attempts: quiz.attempts,
            likes: quiz.likes
        });
        
        // Thông báo cho callbacks
        this.notifyUpdate({
            type: 'UPDATE',
            quiz: this.formatQuiz(quiz)
        });
    }

    // Xử lý xóa quiz
    handleQuizDelete(quiz) {
        console.log('🗑️ Quiz deleted:', quiz.id);
        
        // Thông báo cho callbacks
        this.notifyUpdate({
            type: 'DELETE',
            quiz: { id: quiz.id }
        });
    }

    // Format quiz data
    formatQuiz(item) {
        return {
            id: item.id,
            title: item.title,
            description: item.description,
            questions: item.questions,
            totalQuestions: item.total_questions,
            userName: item.user_name,
            sharedAt: item.shared_at,
            views: item.views || 0,
            attempts: item.attempts || 0,
            likes: item.likes || 0,
            tags: item.tags || [],
            difficulty: item.difficulty,
            category: item.category
        };
    }

    // Tạo bảng (chỉ cần chạy 1 lần)
    // SQL để tạo bảng trong Supabase SQL Editor:
    /*
    CREATE TABLE shared_quizzes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        questions JSONB NOT NULL,
        total_questions INTEGER NOT NULL,
        user_name TEXT NOT NULL,
        shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        views INTEGER DEFAULT 0,
        attempts INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        original_id TEXT,
        tags TEXT[],
        difficulty TEXT DEFAULT 'medium',
        category TEXT DEFAULT 'general',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Tạo index để tăng tốc độ truy vấn
    CREATE INDEX idx_shared_quizzes_shared_at ON shared_quizzes(shared_at DESC);
    CREATE INDEX idx_shared_quizzes_views ON shared_quizzes(views DESC);
    CREATE INDEX idx_shared_quizzes_category ON shared_quizzes(category);
    CREATE INDEX idx_shared_quizzes_difficulty ON shared_quizzes(difficulty);

    -- Enable Row Level Security (RLS)
    ALTER TABLE shared_quizzes ENABLE ROW LEVEL SECURITY;

    -- Tạo policy cho phép mọi người đọc
    CREATE POLICY "Allow public read access" ON shared_quizzes
        FOR SELECT USING (true);

    -- Tạo policy cho phép mọi người tạo mới
    CREATE POLICY "Allow public insert access" ON shared_quizzes
        FOR INSERT WITH CHECK (true);

    -- Tạo policy cho phép cập nhật views, attempts, likes
    CREATE POLICY "Allow public update stats" ON shared_quizzes
        FOR UPDATE USING (true)
        WITH CHECK (true);
    */

    // Chia sẻ quiz lên Supabase
    async shareQuiz(quiz, userName) {
        if (!this.isAvailable()) {
            throw new Error('Supabase không khả dụng. Vui lòng cấu hình SUPABASE_URL và SUPABASE_ANON_KEY');
        }

        try {
            const quizData = {
                title: quiz.title,
                description: quiz.description || 'Không có mô tả',
                questions: quiz.questions,
                total_questions: quiz.questions.length,
                user_name: userName,
                views: 0,
                attempts: 0,
                likes: 0,
                original_id: quiz.id,
                tags: quiz.tags || [],
                difficulty: quiz.difficulty || 'medium',
                category: quiz.category || 'general'
            };

            const { data, error } = await this.supabase
                .from(this.tableName)
                .insert([quizData])
                .select()
                .single();

            if (error) {
                throw error;
            }

            return {
                success: true,
                id: data.id,
                quiz: {
                    id: data.id,
                    ...data,
                    sharedAt: data.shared_at
                }
            };
        } catch (error) {
            console.error('Error sharing quiz to Supabase:', error);
            throw error;
        }
    }

    // Lấy tất cả quiz từ Supabase
    async getAllQuizzes(limitCount = 50) {
        if (!this.isAvailable()) {
            throw new Error('Supabase không khả dụng');
        }

        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .order('shared_at', { ascending: false })
                .limit(limitCount);

            if (error) {
                throw error;
            }

            const quizzes = data.map(item => ({
                id: item.id,
                title: item.title,
                description: item.description,
                questions: item.questions,
                totalQuestions: item.total_questions,
                userName: item.user_name,
                sharedAt: item.shared_at,
                views: item.views || 0,
                attempts: item.attempts || 0,
                likes: item.likes || 0,
                tags: item.tags || [],
                difficulty: item.difficulty,
                category: item.category
            }));

            return {
                success: true,
                quizzes: quizzes
            };
        } catch (error) {
            console.error('Error getting quizzes from Supabase:', error);
            throw error;
        }
    }

    // Lấy chi tiết một quiz
    async getQuizById(quizId) {
        if (!this.isAvailable()) {
            throw new Error('Supabase không khả dụng');
        }

        try {
            // Lấy quiz
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .eq('id', quizId)
                .single();

            if (error) {
                throw error;
            }

            if (!data) {
                throw new Error('Quiz không tồn tại');
            }

            // Tăng số lượt xem
            await this.incrementViews(quizId);

            return {
                success: true,
                quiz: {
                    id: data.id,
                    title: data.title,
                    description: data.description,
                    questions: data.questions,
                    totalQuestions: data.total_questions,
                    userName: data.user_name,
                    sharedAt: data.shared_at,
                    views: (data.views || 0) + 1,
                    attempts: data.attempts || 0,
                    likes: data.likes || 0,
                    tags: data.tags || [],
                    difficulty: data.difficulty,
                    category: data.category
                }
            };
        } catch (error) {
            console.error('Error getting quiz from Supabase:', error);
            throw error;
        }
    }

    // Tăng số lượt xem
    async incrementViews(quizId) {
        if (!this.isAvailable()) {
            return { success: false };
        }

        try {
            // Lấy số lượt xem hiện tại
            const { data: currentData, error: selectError } = await this.supabase
                .from(this.tableName)
                .select('views')
                .eq('id', quizId)
                .single();

            if (selectError) {
                throw selectError;
            }

            if (!currentData) {
                throw new Error('Quiz không tồn tại');
            }

            // Tăng lượt xem
            const newViews = (currentData.views || 0) + 1;
            
            const { error: updateError } = await this.supabase
                .from(this.tableName)
                .update({ 
                    views: newViews,
                    updated_at: new Date().toISOString()
                })
                .eq('id', quizId);

            if (updateError) {
                throw updateError;
            }

            console.log(`✅ Increased views for quiz ${quizId}: ${newViews}`);

            return { 
                success: true, 
                views: newViews 
            };
        } catch (error) {
            console.error('Error incrementing views:', error);
            return { success: false };
        }
    }

    // Tăng số lượt làm bài
    async incrementAttempts(quizId) {
        if (!this.isAvailable()) {
            return { success: false };
        }

        try {
            const { data: currentData } = await this.supabase
                .from(this.tableName)
                .select('attempts')
                .eq('id', quizId)
                .single();

            if (currentData) {
                const { error } = await this.supabase
                    .from(this.tableName)
                    .update({ attempts: (currentData.attempts || 0) + 1 })
                    .eq('id', quizId);

                if (error) {
                    throw error;
                }
            }

            return { success: true };
        } catch (error) {
            console.error('Error incrementing attempts:', error);
            return { success: false };
        }
    }

    // Tìm kiếm quiz
    async searchQuizzes(keyword) {
        if (!this.isAvailable()) {
            throw new Error('Supabase không khả dụng');
        }

        try {
            // Tìm kiếm trong title, description, user_name
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%,user_name.ilike.%${keyword}%`)
                .order('shared_at', { ascending: false })
                .limit(50);

            if (error) {
                throw error;
            }

            const quizzes = data.map(item => ({
                id: item.id,
                title: item.title,
                description: item.description,
                questions: item.questions,
                totalQuestions: item.total_questions,
                userName: item.user_name,
                sharedAt: item.shared_at,
                views: item.views || 0,
                attempts: item.attempts || 0,
                likes: item.likes || 0,
                tags: item.tags || [],
                difficulty: item.difficulty,
                category: item.category
            }));

            return {
                success: true,
                quizzes: quizzes
            };
        } catch (error) {
            console.error('Error searching quizzes:', error);
            throw error;
        }
    }

    // Lấy quiz theo category
    async getQuizzesByCategory(category, limitCount = 20) {
        if (!this.isAvailable()) {
            throw new Error('Supabase không khả dụng');
        }

        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .eq('category', category)
                .order('shared_at', { ascending: false })
                .limit(limitCount);

            if (error) {
                throw error;
            }

            const quizzes = data.map(item => ({
                id: item.id,
                title: item.title,
                description: item.description,
                questions: item.questions,
                totalQuestions: item.total_questions,
                userName: item.user_name,
                sharedAt: item.shared_at,
                views: item.views || 0,
                attempts: item.attempts || 0,
                likes: item.likes || 0,
                tags: item.tags || [],
                difficulty: item.difficulty,
                category: item.category
            }));

            return {
                success: true,
                quizzes: quizzes
            };
        } catch (error) {
            console.error('Error getting quizzes by category:', error);
            throw error;
        }
    }

    // Lấy quiz theo độ khó
    async getQuizzesByDifficulty(difficulty, limitCount = 20) {
        if (!this.isAvailable()) {
            throw new Error('Supabase không khả dụng');
        }

        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .eq('difficulty', difficulty)
                .order('shared_at', { ascending: false })
                .limit(limitCount);

            if (error) {
                throw error;
            }

            const quizzes = data.map(item => ({
                id: item.id,
                title: item.title,
                description: item.description,
                questions: item.questions,
                totalQuestions: item.total_questions,
                userName: item.user_name,
                sharedAt: item.shared_at,
                views: item.views || 0,
                attempts: item.attempts || 0,
                likes: item.likes || 0,
                tags: item.tags || [],
                difficulty: item.difficulty,
                category: item.category
            }));

            return {
                success: true,
                quizzes: quizzes
            };
        } catch (error) {
            console.error('Error getting quizzes by difficulty:', error);
            throw error;
        }
    }

    // Like quiz
    async likeQuiz(quizId) {
        if (!this.isAvailable()) {
            return { success: false };
        }

        try {
            const { data: currentData } = await this.supabase
                .from(this.tableName)
                .select('likes')
                .eq('id', quizId)
                .single();

            if (currentData) {
                const { error } = await this.supabase
                    .from(this.tableName)
                    .update({ likes: (currentData.likes || 0) + 1 })
                    .eq('id', quizId);

                if (error) {
                    throw error;
                }
            }

            return { success: true };
        } catch (error) {
            console.error('Error liking quiz:', error);
            return { success: false };
        }
    }

    // Lấy quiz phổ biến nhất
    async getPopularQuizzes(limitCount = 10) {
        if (!this.isAvailable()) {
            throw new Error('Supabase không khả dụng');
        }

        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .order('views', { ascending: false })
                .limit(limitCount);

            if (error) {
                throw error;
            }

            const quizzes = data.map(item => ({
                id: item.id,
                title: item.title,
                description: item.description,
                questions: item.questions,
                totalQuestions: item.total_questions,
                userName: item.user_name,
                sharedAt: item.shared_at,
                views: item.views || 0,
                attempts: item.attempts || 0,
                likes: item.likes || 0,
                tags: item.tags || [],
                difficulty: item.difficulty,
                category: item.category
            }));

            return {
                success: true,
                quizzes: quizzes
            };
        } catch (error) {
            console.error('Error getting popular quizzes:', error);
            throw error;
        }
    }

    // Lấy quiz mới nhất
    async getLatestQuizzes(limitCount = 10) {
        if (!this.isAvailable()) {
            throw new Error('Supabase không khả dụng');
        }

        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .order('shared_at', { ascending: false })
                .limit(limitCount);

            if (error) {
                throw error;
            }

            const quizzes = data.map(item => ({
                id: item.id,
                title: item.title,
                description: item.description,
                questions: item.questions,
                totalQuestions: item.total_questions,
                userName: item.user_name,
                sharedAt: item.shared_at,
                views: item.views || 0,
                attempts: item.attempts || 0,
                likes: item.likes || 0,
                tags: item.tags || [],
                difficulty: item.difficulty,
                category: item.category
            }));

            return {
                success: true,
                quizzes: quizzes
            };
        } catch (error) {
            console.error('Error getting latest quizzes:', error);
            throw error;
        }
    }

    // Lấy thống kê
    async getStats() {
        if (!this.isAvailable()) {
            throw new Error('Supabase không khả dụng');
        }

        try {
            const { count, error } = await this.supabase
                .from(this.tableName)
                .select('*', { count: 'exact', head: true });

            if (error) {
                throw error;
            }

            return {
                success: true,
                totalQuizzes: count || 0
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            throw error;
        }
    }

    // ⭐ XÓA QUIZ - HÀM MỚI THÊM VÀO
    async deleteQuiz(quizId) {
        if (!this.isAvailable()) {
            throw new Error('Supabase không khả dụng');
        }

        try {
            console.log('🗑️ Deleting quiz from Supabase:', quizId);

            // Xóa quiz khỏi Supabase
            const { error } = await this.supabase
                .from(this.tableName)
                .delete()
                .eq('id', quizId);

            if (error) {
                console.error('❌ Supabase delete error:', error);
                throw error;
            }

            console.log('✅ Quiz deleted from Supabase successfully');

            return {
                success: true,
                message: 'Quiz đã được xóa khỏi Supabase'
            };
        } catch (error) {
            console.error('❌ Error deleting quiz from Supabase:', error);
            
            // Nếu lỗi là do permission, trả về thông báo rõ ràng
            if (error.message && error.message.includes('permission')) {
                throw new Error('Bạn không có quyền xóa bài này. Vui lòng kiểm tra RLS policy trong Supabase.');
            }
            
            throw error;
        }
    }

    // Cập nhật quiz (title, description)
    async updateQuiz(quizId, updates) {
        if (!this.isAvailable()) {
            throw new Error('Supabase không khả dụng');
        }

        try {
            console.log('📝 Updating quiz in Supabase:', quizId, updates);

            const { error } = await this.supabase
                .from(this.tableName)
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', quizId);

            if (error) {
                console.error('❌ Supabase update error:', error);
                throw error;
            }

            console.log('✅ Quiz updated in Supabase successfully');

            return {
                success: true,
                message: 'Quiz đã được cập nhật'
            };
        } catch (error) {
            console.error('❌ Error updating quiz in Supabase:', error);
            
            if (error.message && error.message.includes('permission')) {
                throw new Error('Bạn không có quyền chỉnh sửa bài này. Vui lòng kiểm tra RLS policy trong Supabase.');
            }
            
            throw error;
        }
    }
}

// Export Supabase Quiz Manager
const supabaseQuizManager = new SupabaseQuizManager();
window.supabaseQuizManager = supabaseQuizManager;

export { supabaseQuizManager, isSupabaseInitialized };
