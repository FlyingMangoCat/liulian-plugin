/**
 * 统一数据库管理器
 * 支持PostgreSQL、MongoDB和Redis缓存
 * 根据配置自动选择合适的数据库连接
 */

import pg from 'pg';
import Redis from 'ioredis';
import mongoose from 'mongoose';
const { Pool } = pg;
import config from '../../../config/ai.js';

class DatabaseManager {
    constructor() {
        // PostgreSQL连接池
        this.pgPool = null;
        // Redis缓存连接
        this.redis = null;
        // MongoDB连接状态
        this.mongoConnected = false;
        // 数据库连接状态
        this.isConnected = false;
        // 当前使用的数据库类型
        this.currentDbType = null;
    }

    /**
     * 连接数据库
     * 根据配置自动选择PostgreSQL或MongoDB
     * @returns {Promise<boolean>} 连接是否成功
     */
    async connect() {
        try {
            // 优先尝试MongoDB连接（如果配置了MongoDB）
            if (config.database && config.database.mongodb) {
                const mongoResult = await this._connectMongoDB();
                if (mongoResult) {
                    this.isConnected = true;
                    this.currentDbType = 'mongodb';
                    return true;
                }
            }

            // 如果MongoDB连接失败或未配置，尝试PostgreSQL
            if (config.database && config.database.postgres) {
                const pgResult = await this._connectPostgreSQL();
                if (pgResult) {
                    this.isConnected = true;
                    this.currentDbType = 'postgres';
                    return true;
                }
            }

            console.log('[Database] 未配置有效的数据库连接信息');
            this.isConnected = false;
            return false;
        } catch (error) {
            console.error('[Database] 数据库连接失败:', error);
            this.isConnected = false;
            return false;
        }
    }

    /**
     * 连接MongoDB数据库
     * @private
     * @returns {Promise<boolean>} 连接是否成功
     */
    async _connectMongoDB() {
        try {
            // 检查是否已经有MongoDB连接（中间件模式下使用主系统的连接）
            if (mongoose.connection.readyState === 1) {
                console.log('[Database] 使用现有MongoDB连接');
                this.mongoConnected = true;
                return true;
            }

            // 建立新的MongoDB连接
            await mongoose.connect(config.database.mongodb.uri, config.database.mongodb.options || {});
            console.log('[Database] MongoDB连接成功');
            this.mongoConnected = true;
            return true;
        } catch (error) {
            console.error('[Database] MongoDB连接失败:', error);
            this.mongoConnected = false;
            return false;
        }
    }

    /**
     * 连接PostgreSQL数据库
     * @private
     * @returns {Promise<boolean>} 连接是否成功
     */
    async _connectPostgreSQL() {
        try {
            // 连接PostgreSQL (主数据库)
            this.pgPool = new Pool(config.database.postgres);
            await this.pgPool.query('SELECT 1');
            console.log('[Database] PostgreSQL连接成功');
            
            // 连接Redis (专用缓存)
            if (config.database && config.database.redis) {
                this.redis = new Redis({
                    host: config.database.redis.host,
                    port: config.database.redis.port,
                    password: config.database.redis.password,
                    // Redis专用缓存配置
                    keyPrefix: 'liulian:cache:',
                    ttl: config.database.redis.ttl || 3600,
                    enableOfflineQueue: false // 禁用离线队列，缓存失败不应阻塞主流程
                });
                
                await this.redis.ping();
                console.log('[Database] Redis缓存连接成功');
            }
            
            await this._initTables();
            return true;
        } catch (error) {
            console.error('[Database] PostgreSQL连接失败:', error);
            return false;
        }
    }

    /**
     * 初始化数据库表结构
     * @private
     * @returns {Promise<void>}
     */
    async _initTables() {
        if (!this.pgPool) return;
        
        try {
            // 只初始化PostgreSQL表结构
            const memoryTableQuery = `
                CREATE TABLE IF NOT EXISTS user_memories (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(50) NOT NULL,
                    memory_text TEXT NOT NULL,
                    memory_type VARCHAR(20) DEFAULT 'interaction',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_user_memories ON user_memories(user_id);
            `;
            await this.pgPool.query(memoryTableQuery);
            console.log('[Database] 表初始化完成');
        } catch (error) {
            console.error('[Database] 表初始化失败:', error);
        }
    }

    /**
     * 保存记忆到数据库
     * @param {string} userId - 用户ID
     * @param {string} memoryText - 记忆文本
     * @param {string} memoryType - 记忆类型
     * @returns {Promise<boolean>} 保存是否成功
     */
    async saveMemory(userId, memoryText, memoryType = 'interaction') {
        if (!this.isConnected) return false;
        
        try {
            // 根据当前数据库类型选择保存方式
            if (this.currentDbType === 'mongodb') {
                return await this._saveMemoryToMongoDB(userId, memoryText, memoryType);
            } else if (this.currentDbType === 'postgres') {
                return await this._saveMemoryToPostgreSQL(userId, memoryText, memoryType);
            }
            
            return false;
        } catch (error) {
            console.error('[Database] 保存记忆失败:', error);
            return false;
        }
    }

    /**
     * 保存记忆到MongoDB
     * @private
     * @param {string} userId - 用户ID
     * @param {string} memoryText - 记忆文本
     * @param {string} memoryType - 记忆类型
     * @returns {Promise<boolean>} 保存是否成功
     */
    async _saveMemoryToMongoDB(userId, memoryText, memoryType = 'interaction') {
        if (!this.mongoConnected) return false;
        
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
            console.error('[Database] 保存记忆到MongoDB失败:', error);
            return false;
        }
    }

    /**
     * 保存记忆到PostgreSQL
     * @private
     * @param {string} userId - 用户ID
     * @param {string} memoryText - 记忆文本
     * @param {string} memoryType - 记忆类型
     * @returns {Promise<boolean>} 保存是否成功
     */
    async _saveMemoryToPostgreSQL(userId, memoryText, memoryType = 'interaction') {
        if (!this.pgPool) return false;
        
        try {
            const query = `
                INSERT INTO user_memories (user_id, memory_text, memory_type)
                VALUES ($1, $2, $3)
            `;
            await this.pgPool.query(query, [userId, memoryText, memoryType]);
            
            // 使Redis中的相关缓存失效
            if (this.redis) {
                await this.redis.del(`user:${userId}:memories`);
            }
            
            return true;
        } catch (error) {
            console.error('[Database] 保存记忆到PostgreSQL失败:', error);
            return false;
        }
    }

    /**
     * 获取用户记忆
     * @param {string} userId - 用户ID
     * @param {number} limit - 限制返回的记忆数量
     * @returns {Promise<Array<string>>} 用户记忆列表
     */
    async getMemories(userId, limit = 5) {
        if (!this.isConnected) return [];
        
        try {
            // 根据当前数据库类型选择获取方式
            if (this.currentDbType === 'mongodb') {
                return await this._getMemoriesFromMongoDB(userId, limit);
            } else if (this.currentDbType === 'postgres') {
                return await this._getMemoriesFromPostgreSQL(userId, limit);
            }
            
            return [];
        } catch (error) {
            console.error('[Database] 获取记忆失败:', error);
            return [];
        }
    }

    /**
     * 从MongoDB获取用户记忆
     * @private
     * @param {string} userId - 用户ID
     * @param {number} limit - 限制返回的记忆数量
     * @returns {Promise<Array<string>>} 用户记忆列表
     */
    async _getMemoriesFromMongoDB(userId, limit = 5) {
        if (!this.mongoConnected) return [];
        
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
            console.error('[Database] 从MongoDB获取记忆失败:', error);
            return [];
        }
    }

    /**
     * 从PostgreSQL获取用户记忆
     * @private
     * @param {string} userId - 用户ID
     * @param {number} limit - 限制返回的记忆数量
     * @returns {Promise<Array<string>>} 用户记忆列表
     */
    async _getMemoriesFromPostgreSQL(userId, limit = 5) {
        if (!this.pgPool) return [];
        
        try {
            // 先尝试从Redis缓存获取
            if (this.redis) {
                try {
                    const cached = await this.redis.get(`user:${userId}:memories`);
                    if (cached) {
                        console.log('[Database] 从Redis缓存获取记忆');
                        return JSON.parse(cached);
                    }
                } catch (cacheError) {
                    console.warn('[Database] 缓存获取失败，回退到数据库:', cacheError.message);
                    // 缓存失败不应影响主流程
                }
            }
            
            // 从PostgreSQL主数据库获取
            const query = `
                SELECT memory_text 
                FROM user_memories 
                WHERE user_id = $1 
                ORDER BY created_at DESC 
                LIMIT $2
            `;
            const result = await this.pgPool.query(query, [userId, limit]);
            const memories = result.rows.map(row => row.memory_text);
            
            // 存入Redis缓存 (异步，不阻塞主流程)
            if (this.redis && memories.length > 0) {
                this.redis.setex(
                    `user:${userId}:memories`,
                    config.database.redis.ttl,
                    JSON.stringify(memories)
                ).catch(err => {
                    console.warn('[Database] 缓存设置失败:', err.message);
                });
            }
            
            return memories;
        } catch (error) {
            console.error('[Database] 从PostgreSQL获取记忆失败:', error);
            return [];
        }
    }

    /**
     * 重置用户记忆
     * @param {string} userId - 用户ID
     * @returns {Promise<boolean>} 重置是否成功
     */
    async resetUserMemories(userId) {
        if (!this.isConnected) return false;
        
        try {
            // 根据当前数据库类型选择重置方式
            if (this.currentDbType === 'mongodb') {
                return await this._resetUserMemoriesInMongoDB(userId);
            } else if (this.currentDbType === 'postgres') {
                return await this._resetUserMemoriesInPostgreSQL(userId);
            }
            
            return false;
        } catch (error) {
            console.error('[Database] 重置记忆失败:', error);
            return false;
        }
    }

    /**
     * 在MongoDB中重置用户记忆
     * @private
     * @param {string} userId - 用户ID
     * @returns {Promise<boolean>} 重置是否成功
     */
    async _resetUserMemoriesInMongoDB(userId) {
        if (!this.mongoConnected) return false;
        
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
            console.log(`[Database] 已重置用户 ${userId} 的MongoDB记忆`);
            return true;
        } catch (error) {
            console.error('[Database] 在MongoDB中重置记忆失败:', error);
            return false;
        }
    }

    /**
     * 在PostgreSQL中重置用户记忆
     * @private
     * @param {string} userId - 用户ID
     * @returns {Promise<boolean>} 重置是否成功
     */
    async _resetUserMemoriesInPostgreSQL(userId) {
        if (!this.pgPool) return false;
        
        try {
            // 删除PostgreSQL中的记忆
            const query = `DELETE FROM user_memories WHERE user_id = $1`;
            await this.pgPool.query(query, [userId]);
            
            // 删除Redis中的缓存
            if (this.redis) {
                await this.redis.del(`user:${userId}:memories`);
            }
            
            console.log(`[Database] 已重置用户 ${userId} 的PostgreSQL记忆`);
            return true;
        } catch (error) {
            console.error('[Database] 在PostgreSQL中重置记忆失败:', error);
            return false;
        }
    }

    /**
     * 健康检查
     * @returns {Promise<Object>} 数据库连接状态
     */
    async healthCheck() {
        const status = {
            postgres: { available: false, message: '未连接' },
            mongodb: { available: false, message: '未连接' },
            redis: { available: false, message: '未连接' }
        };
        
        // 检查PostgreSQL
        if (this.pgPool) {
            try {
                await this.pgPool.query('SELECT 1');
                status.postgres = { available: true, message: '连接正常' };
            } catch (error) {
                status.postgres = { available: false, message: `连接异常: ${error.message}` };
            }
        }
        
        // 检查MongoDB
        if (this.mongoConnected) {
            try {
                // 执行简单查询来检查连接
                await mongoose.connection.db.admin().ping();
                status.mongodb = { available: true, message: '连接正常' };
            } catch (error) {
                status.mongodb = { available: false, message: `连接异常: ${error.message}` };
            }
        }
        
        // 检查Redis
        if (this.redis) {
            try {
                await this.redis.ping();
                status.redis = { available: true, message: '连接正常' };
            } catch (error) {
                status.redis = { available: false, message: `连接异常: ${error.message}` };
            }
        }
        
        return status;
    }
}

// 导出单例
export default new DatabaseManager();