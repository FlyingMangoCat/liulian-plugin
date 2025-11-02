import mongoose from 'mongoose';
import config from '../../../config/ai.js';

class DatabaseManager {
    constructor() {
        this.isConnected = false;
    }

    async connect() {
        try {
            // 检查是否已经有MongoDB连接（中间件模式下使用主系统的连接）
            if (mongoose.connection.readyState === 1) {
                console.log('[Database] 使用现有MongoDB连接');
                this.isConnected = true;
                return true;
            }

            // 如果没有现有连接，则建立新的连接
            if (config.database && config.database.mongodb) {
                await mongoose.connect(config.database.mongodb.uri, config.database.mongodb.options || {});
                console.log('[Database] MongoDB连接成功');
                this.isConnected = true;
                return true;
            } else {
                console.log('[Database] 未配置MongoDB连接信息');
                this.isConnected = false;
                return false;
            }
        } catch (error) {
            console.error('[Database] MongoDB连接失败:', error);
            this.isConnected = false;
            return false;
        }
    }

    // 保存记忆到user_memories集合
    async saveMemory(userId, memoryText, memoryType = 'interaction') {
        if (!this.isConnected) return false;
        
        try {
            // 创建记忆模型（如果不存在）
            const memorySchema = new mongoose.Schema({
                user_id: { type: String, required: true, index: true },
                memory_text: { type: String, required: true },
                memory_type: { type: String, default: 'interaction' },
                created_at: { type: Date, default: Date.now }
            });
            
            let MemoryModel;
            try {
                MemoryModel = mongoose.model('user_memories');
            } catch (error) {
                MemoryModel = mongoose.model('user_memories', memorySchema);
            }
            
            // 保存记忆
            const memory = new MemoryModel({
                user_id: userId,
                memory_text: memoryText,
                memory_type: memoryType
            });
            
            await memory.save();
            return true;
        } catch (error) {
            console.error('[Database] 保存记忆失败:', error);
            return false;
        }
    }

    // 获取用户记忆
    async getMemories(userId, limit = 5) {
        if (!this.isConnected) return [];
        
        try {
            // 获取记忆模型
            let MemoryModel;
            try {
                MemoryModel = mongoose.model('user_memories');
            } catch (error) {
                // 如果模型不存在，返回空数组
                return [];
            }
            
            // 查询用户记忆
            const memories = await MemoryModel.find({ user_id: userId })
                .sort({ created_at: -1 })
                .limit(limit)
                .select('memory_text');
                
            return memories.map(memory => memory.memory_text);
        } catch (error) {
            console.error('[Database] 获取记忆失败:', error);
            return [];
        }
    }

    // 重置用户记忆
    async resetUserMemories(userId) {
        if (!this.isConnected) return false;
        
        try {
            // 获取记忆模型
            let MemoryModel;
            try {
                MemoryModel = mongoose.model('user_memories');
            } catch (error) {
                // 如果模型不存在，返回成功（没有需要删除的记忆）
                return true;
            }
            
            // 删除用户记忆
            await MemoryModel.deleteMany({ user_id: userId });
            console.log(`[Database] 已重置用户 ${userId} 的记忆`);
            return true;
        } catch (error) {
            console.error('[Database] 重置记忆失败:', error);
            return false;
        }
    }

    // 健康检查
    async healthCheck() {
        const status = {
            mongodb: { available: false, message: '未连接' },
            postgres: { available: false, message: '未连接' }
        };
        
        if (this.isConnected) {
            try {
                // 执行简单查询来检查连接
                await mongoose.connection.db.admin().ping();
                status.mongodb = { available: true, message: '连接正常' };
            } catch (error) {
                status.mongodb = { available: false, message: `连接异常: ${error.message}` };
            }
        }
        
        return status;
    }
}

// 导出单例
export default new DatabaseManager();