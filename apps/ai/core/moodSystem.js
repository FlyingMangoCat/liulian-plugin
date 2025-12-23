// 情绪系统 - 管理用户情绪和好感度联动
import DatabaseManager from './database.js';

const moodEffects = {
    happy: {
        duration: 300,      // 高兴持续5分钟
        resonance_change: 0.1,  // 每分钟增加0.1好感度
        max_change: 2.0      // 最多增加2点
    },
    angry: {
        duration: 180,      // 生气持续3分钟  
        resonance_change: -0.2, // 每分钟减少0.2好感度
        max_change: -3.0     // 最多减少3点
    },
    bored: {
        duration: 600,      // 无聊持续10分钟
        resonance_change: -0.1, // 每分钟减少0.1好感度
        max_change: -1.5     // 最多减少1.5点
    },
    neutral: {
        duration: 0,        // 中性状态无持续
        resonance_change: 0   // 无影响
    },
    excited: {
        duration: 240,      // 兴奋持续4分钟
        resonance_change: 0.15, // 每分钟增加0.15好感度
        max_change: 2.5      // 最多增加2.5点
    },
    sad: {
        duration: 360,      // 悲伤持续6分钟
        resonance_change: -0.15, // 每分钟减少0.15好感度
        max_change: -2.0     // 最多减少2点
    }
};

class MoodSystem {
    constructor() {
        this.isInitialized = false;
    }

    async initialize() {
        try {
            await this.createMoodTables();
            this.isInitialized = true;
            console.log('[MoodSystem] 情绪系统初始化成功');
        } catch (error) {
            console.error('[MoodSystem] 初始化失败:', error);
        }
    }

    async createMoodTables() {
        const createMoodTable = `
            CREATE TABLE IF NOT EXISTS user_moods (
                user_id VARCHAR(50) PRIMARY KEY,
                current_mood VARCHAR(20) DEFAULT 'neutral',
                mood_intensity DECIMAL(3,2) DEFAULT 0.5,
                mood_start_time TIMESTAMP,
                mood_duration INTEGER DEFAULT 0,
                resonance_change_accumulated DECIMAL(4,2) DEFAULT 0.0,
                last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_user_moods_updated ON user_moods(updated_at);
        `;

        const createMoodHistoryTable = `
            CREATE TABLE IF NOT EXISTS mood_history (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(50),
                mood VARCHAR(20),
                resonance_change DECIMAL(4,2),
                duration INTEGER,
                trigger_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_mood_history_user ON mood_history(user_id);
            CREATE INDEX IF NOT EXISTS idx_mood_history_created ON mood_history(created_at);
        `;

        await DatabaseManager.pgPool.query(createMoodTable);
        await DatabaseManager.pgPool.query(createMoodHistoryTable);
        console.log('[MoodSystem] 数据库表创建完成');
    }

    // 检测消息情绪
    detectMood(message) {
        const positiveWords = ['开心', '高兴', '哈哈', '😊', '👍', '棒', '好', '喜欢', '爱', '太好了', '赞'];
        const negativeWords = ['生气', '讨厌', '烦', '糟糕', '😠', '💔', '恨', '差', '坏', '滚', '去死'];
        const excitedWords = ['太棒了', '太好了', '哇', '天啊', '厉害', '牛逼', '绝了', '🎉', '🔥'];
        const sadWords = ['难过', '伤心', '哭', '😢', '💔', '痛苦', '悲伤', '郁闷', '沮丧'];
        const boredWords = ['无聊', '没意思', '好烦', '困', '累了', '没劲', '无聊死了'];

        const lowerMessage = message.toLowerCase();
        
        if (excitedWords.some(word => lowerMessage.includes(word))) {
            return { mood: 'excited', intensity: 0.8 };
        }
        if (positiveWords.some(word => lowerMessage.includes(word))) {
            return { mood: 'happy', intensity: 0.6 };
        }
        if (negativeWords.some(word => lowerMessage.includes(word))) {
            return { mood: 'angry', intensity: 0.7 };
        }
        if (sadWords.some(word => lowerMessage.includes(word))) {
            return { mood: 'sad', intensity: 0.6 };
        }
        if (boredWords.some(word => lowerMessage.includes(word))) {
            return { mood: 'bored', intensity: 0.5 };
        }
        
        return { mood: 'neutral', intensity: 0.5 };
    }

    // 更新用户情绪
    async updateUserMood(userId, message) {
        if (!DatabaseManager.isConnected) {
            console.log('[MoodSystem] 数据库未连接，跳过情绪更新');
            return;
        }

        try {
            const detectedMood = this.detectMood(message);
            const currentTime = new Date();
            
            // 获取当前用户情绪
            const currentMoodResult = await DatabaseManager.pgPool.query(
                'SELECT * FROM user_moods WHERE user_id = $1',
                [userId]
            );

            let userMood;
            if (currentMoodResult.rows.length === 0) {
                // 新用户，创建初始情绪
                userMood = {
                    user_id: userId,
                    current_mood: detectedMood.mood,
                    mood_intensity: detectedMood.intensity,
                    mood_start_time: currentTime,
                    mood_duration: 0,
                    resonance_change_accumulated: 0.0,
                    last_interaction: currentTime
                };

                await DatabaseManager.pgPool.query(`
                    INSERT INTO user_moods (user_id, current_mood, mood_intensity, mood_start_time, last_interaction)
                    VALUES ($1, $2, $3, $4, $5)
                `, [userId, detectedMood.mood, detectedMood.intensity, currentTime, currentTime]);
            } else {
                userMood = currentMoodResult.rows[0];
                
                // 如果情绪发生变化，记录历史
                if (userMood.current_mood !== detectedMood.mood) {
                    await this.recordMoodHistory(userId, userMood, detectedMood, message);
                }

                // 更新情绪
                await DatabaseManager.pgPool.query(`
                    UPDATE user_moods 
                    SET current_mood = $1, 
                        mood_intensity = $2, 
                        mood_start_time = $3, 
                        mood_duration = 0,
                        resonance_change_accumulated = 0.0,
                        last_interaction = $4,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = $5
                `, [detectedMood.mood, detectedMood.intensity, currentTime, currentTime, userId]);
            }

            console.log(`[MoodSystem] 用户 ${userId} 情绪更新为: ${detectedMood.mood}`);
            return userMood;

        } catch (error) {
            console.error('[MoodSystem] 更新用户情绪失败:', error);
            return null;
        }
    }

    // 记录情绪历史
    async recordMoodHistory(userId, oldMood, newMood, triggerMessage) {
        try {
            const duration = oldMood.mood_start_time ? 
                Math.floor((Date.now() - new Date(oldMood.mood_start_time).getTime()) / 1000) : 0;

            await DatabaseManager.pgPool.query(`
                INSERT INTO mood_history (user_id, mood, resonance_change, duration, trigger_message)
                VALUES ($1, $2, $3, $4, $5)
            `, [userId, oldMood.current_mood, 0, duration, triggerMessage.substring(0, 100)]);

        } catch (error) {
            console.error('[MoodSystem] 记录情绪历史失败:', error);
        }
    }

    // 获取用户当前情绪
    async getUserMood(userId) {
        if (!DatabaseManager.isConnected) {
            return { mood: 'neutral', intensity: 0.5 };
        }

        try {
            const result = await DatabaseManager.pgPool.query(
                'SELECT * FROM user_moods WHERE user_id = $1',
                [userId]
            );

            if (result.rows.length === 0) {
                return { mood: 'neutral', intensity: 0.5 };
            }

            const moodData = result.rows[0];
            return {
                mood: moodData.current_mood,
                intensity: parseFloat(moodData.mood_intensity),
                startTime: moodData.mood_start_time,
                duration: moodData.mood_duration,
                accumulatedChange: parseFloat(moodData.resonance_change_accumulated)
            };

        } catch (error) {
            console.error('[MoodSystem] 获取用户情绪失败:', error);
            return { mood: 'neutral', intensity: 0.5 };
        }
    }

    // 处理情绪对好感度的影响
    async processMoodEffects() {
        if (!DatabaseManager.isConnected) {
            return;
        }

        try {
            const currentTime = new Date();
            
            // 获取所有有情绪的用户
            const result = await DatabaseManager.pgPool.query(`
                SELECT * FROM user_moods 
                WHERE current_mood != 'neutral' 
                AND mood_start_time IS NOT NULL
            `);

            for (const userMood of result.rows) {
                const moodConfig = moodEffects[userMood.current_mood];
                if (!moodConfig || moodConfig.duration === 0) continue;

                const elapsedMinutes = Math.floor(
                    (currentTime.getTime() - new Date(userMood.mood_start_time).getTime()) / 60000
                );

                if (elapsedMinutes > 0) {
                    const potentialChange = moodConfig.resonance_change * elapsedMinutes;
                    const actualChange = Math.min(
                        Math.max(potentialChange, -Math.abs(moodConfig.max_change)),
                        Math.abs(moodConfig.max_change)
                    ) * (potentialChange < 0 ? -1 : 1);

                    const accumulatedChange = parseFloat(userMood.resonance_change_accumulated || 0) + actualChange;
                    
                    // 检查是否达到最大变化
                    if (Math.abs(accumulatedChange) >= Math.abs(moodConfig.max_change)) {
                        // 情绪结束，重置为中性
                        await this.endMood(userMood.user_id, accumulatedChange);
                    } else {
                        // 更新累积变化
                        await DatabaseManager.pgPool.query(`
                            UPDATE user_moods 
                            SET mood_duration = $1,
                                resonance_change_accumulated = $2,
                                updated_at = CURRENT_TIMESTAMP
                            WHERE user_id = $3
                        `, [elapsedMinutes * 60, accumulatedChange, userMood.user_id]);
                    }
                }
            }

        } catch (error) {
            console.error('[MoodSystem] 处理情绪影响失败:', error);
        }
    }

    // 结束情绪状态
    async endMood(userId, totalChange) {
        try {
            const result = await DatabaseManager.pgPool.query(
                'SELECT current_mood FROM user_moods WHERE user_id = $1',
                [userId]
            );

            if (result.rows.length > 0) {
                const oldMood = result.rows[0].current_mood;
                
                // 记录情绪历史
                await DatabaseManager.pgPool.query(`
                    INSERT INTO mood_history (user_id, mood, resonance_change, duration)
                    VALUES ($1, $2, $3, $4)
                `, [userId, oldMood, totalChange, 0]);

                // 重置为中性
                await DatabaseManager.pgPool.query(`
                    UPDATE user_moods 
                    SET current_mood = 'neutral',
                        mood_intensity = 0.5,
                        mood_start_time = NULL,
                        mood_duration = 0,
                        resonance_change_accumulated = 0.0,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = $1
                `, [userId]);

                console.log(`[MoodSystem] 用户 ${userId} 情绪 ${oldMood} 结束，好感度变化: ${totalChange}`);
            }

        } catch (error) {
            console.error('[MoodSystem] 结束情绪状态失败:', error);
        }
    }

    // 获取情绪统计
    async getMoodStats(userId) {
        if (!DatabaseManager.isConnected) {
            return null;
        }

        try {
            const result = await DatabaseManager.pgPool.query(`
                SELECT 
                    COUNT(*) as total_interactions,
                    COUNT(CASE WHEN current_mood != 'neutral' THEN 1 END) as mood_interactions,
                    AVG(CASE WHEN current_mood = 'happy' THEN 1 
                             WHEN current_mood = 'excited' THEN 1 
                             WHEN current_mood = 'neutral' THEN 0 
                             WHEN current_mood = 'angry' THEN -1 
                             WHEN current_mood = 'sad' THEN -1 
                             WHEN current_mood = 'bored' THEN -0.5 
                             ELSE 0 END) as avg_mood_score
                FROM user_moods 
                WHERE user_id = $1
            `, [userId]);

            return result.rows[0];

        } catch (error) {
            console.error('[MoodSystem] 获取情绪统计失败:', error);
            return null;
        }
    }
}

export default new MoodSystem();