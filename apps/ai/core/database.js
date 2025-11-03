/**
 * 数据库管理器 - 支持PostgreSQL和MongoDB
 * 实现统一的数据库接口，适配不同数据库后端
 * 
 * 该模块提供以下功能：
 * 1. 多数据库连接管理（PostgreSQL、MongoDB、Redis）
 * 2. 用户记忆存储和检索
 * 3. 数据库健康检查
 * 4. 用户数据管理
 */

import pg from 'pg';
import Redis from 'ioredis';
import mongoose from 'mongoose';
import { commonUserSchema, aiUserSchema, memorySchema } from './models.js';
const { Pool } = pg;

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
        // 缓存的模型引用
        this.models = {};
    }

    /**
     * 连接数据库
     * 
     * 根据配置自动选择合适的数据库后端
     * 支持PostgreSQL、MongoDB和Redis缓存
     * 连接成功后更新连接状态
     * 
     * @returns {boolean} 连接是否成功
     */
    async connect() {
        try {
            // 尝试连接PostgreSQL
            if (process.env.POSTGRES_URL) {
                this.pgPool = new Pool({
                    connectionString: process.env.POSTGRES_URL,
                });
                await this.pgPool.query('SELECT 1');
                this.currentDbType = 'postgres';
                console.log('[数据库] PostgreSQL连接成功');
            }
            
            // 尝试连接MongoDB
            if (process.env.MONGODB_URL) {
                await mongoose.connect(process.env.MONGODB_URL);
                this.mongoConnected = true;
                if (!this.currentDbType) this.currentDbType = 'mongodb';
                console.log('[数据库] MongoDB连接成功');
            }
            
            // 尝试连接Redis
            if (process.env.REDIS_URL) {
                this.redis = new Redis(process.env.REDIS_URL);
                await this.redis.ping();
                console.log('[数据库] Redis连接成功');
            }
            
            this.isConnected = true;
            return true;
        } catch (error) {
            console.error('[数据库] 连接失败:', error.message);
            this.isConnected = false;
            return false;
        }
    }

    /**
     * 健康检查
     * 
     * 检查所有已连接数据库的健康状态
     * 返回各数据库的连接状态和基本信息
     * 
     * @returns {object} 数据库健康状态报告
     */
    async healthCheck() {
        const status = {
            postgres: {
                available: false,
                error: null
            },
            mongodb: {
                available: false,
                error: null
            },
            redis: {
                available: false,
                error: null
            }
        };
        
        // 检查PostgreSQL
        if (this.pgPool) {
            try {
                await this.pgPool.query('SELECT 1');
                status.postgres.available = true;
            } catch (error) {
                status.postgres.error = error.message;
            }
        }
        
        // 检查MongoDB
        if (this.mongoConnected) {
            try {
                await mongoose.connection.db.admin().ping();
                status.mongodb.available = true;
            } catch (error) {
                status.mongodb.error = error.message;
            }
        }
        
        // 检查Redis
        if (this.redis) {
            try {
                await this.redis.ping();
                status.redis.available = true;
            } catch (error) {
                status.redis.error = error.message;
            }
        }
        
        return status;
    }

    /**
     * 获取MongoDB模型
     * 
     * 从缓存中获取或创建MongoDB模型
     * 避免重复创建模型
     * 
     * @param {string} modelName - 模型名称
     * @param {object} schema - 模型Schema
     * @returns {object} Mongoose模型
     */
    getMongoModel(modelName, schema) {
        if (!this.models[modelName]) {
            try {
                this.models[modelName] = mongoose.model(modelName);
            } catch (error) {
                this.models[modelName] = mongoose.model(modelName, schema);
            }
        }
        return this.models[modelName];
    }

    /**
     * 保存用户记忆
     * 
     * 将用户交互内容保存到数据库中
     * 支持PostgreSQL和MongoDB两种后端
     * 使用Redis作为缓存层提高读取性能
     * 
     * @param {string} userId - 用户ID
     * @param {string} memory - 记忆内容
     * @param {string} category - 记忆分类（可选）
     * @returns {boolean} 保存是否成功
     */
    async saveMemory(userId, memory, category = 'default') {
        if (!this.isConnected) {
            console.log('[数据库] 未连接，无法保存记忆');
            return false;
        }
        
        try {
            const timestamp = new Date();
            
            // 保存到PostgreSQL
            if (this.pgPool) {
                await this.pgPool.query(
                    'INSERT INTO user_memories (user_id, memory, category, created_at) VALUES ($1, $2, $3, $4)',
                    [userId, memory, category, timestamp]
                );
            }
            
            // 保存到MongoDB
            if (this.mongoConnected) {
                const MemoryModel = this.getMongoModel('Memory', memorySchema);
                
                const memoryDoc = new MemoryModel({
                    user_id: userId,
                    memory: memory,
                    category: category,
                    created_at: timestamp
                });
                await memoryDoc.save();
            }
            
            // 更新Redis缓存
            if (this.redis) {
                const cacheKey = `user_memories:${userId}`;
                await this.redis.lpush(cacheKey, JSON.stringify({
                    memory: memory,
                    category: category,
                    created_at: timestamp
                }));
                // 限制缓存列表长度为100
                await this.redis.ltrim(cacheKey, 0, 99);
            }
            
            return true;
        } catch (error) {
            console.error('[数据库] 保存记忆失败:', error.message);
            return false;
        }
    }

    /**
     * 获取用户记忆
     * 
     * 从数据库中检索用户的历史记忆
     * 优先使用Redis缓存提高性能
     * 支持限制返回记忆数量
     * 
     * @param {string} userId - 用户ID
     * @param {number} limit - 返回记忆数量限制
     * @returns {array} 用户记忆列表
     */
    async getMemories(userId, limit = 10) {
        if (!this.isConnected) {
            console.log('[数据库] 未连接，无法获取记忆');
            return [];
        }
        
        try {
            // 首先尝试从Redis缓存获取
            if (this.redis) {
                const cacheKey = `user_memories:${userId}`;
                const cachedMemories = await this.redis.lrange(cacheKey, 0, limit - 1);
                if (cachedMemories.length > 0) {
                    return cachedMemories.map(item => JSON.parse(item).memory);
                }
            }
            
            let memories = [];
            
            // 从PostgreSQL获取
            if (this.pgPool) {
                const result = await this.pgPool.query(
                    'SELECT memory FROM user_memories WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
                    [userId, limit]
                );
                memories = result.rows.map(row => row.memory);
            }
            // 从MongoDB获取
            else if (this.mongoConnected) {
                const MemoryModel = this.getMongoModel('Memory', memorySchema);
                
                const memoryDocs = await MemoryModel.find({ user_id: userId })
                    .sort({ created_at: -1 })
                    .limit(limit)
                    .select('memory');
                memories = memoryDocs.map(doc => doc.memory);
            }
            
            // 更新Redis缓存
            if (this.redis && memories.length > 0) {
                const cacheKey = `user_memories:${userId}`;
                await this.redis.del(cacheKey);
                for (const memory of memories) {
                    await this.redis.lpush(cacheKey, JSON.stringify({
                        memory: memory,
                        created_at: new Date()
                    }));
                }
                await this.redis.ltrim(cacheKey, 0, 99);
            }
            
            return memories;
        } catch (error) {
            console.error('[数据库] 获取记忆失败:', error.message);
            return [];
        }
    }

    /**
     * 重置用户记忆
     * 
     * 删除指定用户的所有记忆记录
     * 清理所有数据库后端和缓存中的数据
     * 
     * @param {string} userId - 用户ID
     * @returns {boolean} 重置是否成功
     */
    async resetUserMemories(userId) {
        if (!this.isConnected) {
            console.log('[数据库] 未连接，无法重置记忆');
            return false;
        }
        
        try {
            let success = true;
            
            // 从PostgreSQL删除
            if (this.pgPool) {
                await this.pgPool.query(
                    'DELETE FROM user_memories WHERE user_id = $1',
                    [userId]
                );
            }
            
            // 从MongoDB删除
            if (this.mongoConnected) {
                const MemoryModel = this.getMongoModel('Memory', memorySchema);
                await MemoryModel.deleteMany({ user_id: userId });
            }
            
            // 从Redis缓存删除
            if (this.redis) {
                const cacheKey = `user_memories:${userId}`;
                await this.redis.del(cacheKey);
            }
            
            return true;
        } catch (error) {
            console.error('[数据库] 重置记忆失败:', error.message);
            return false;
        }
    }
}

// 创建并导出数据库管理器实例
export default new DatabaseManager();