import pg from 'pg';
import Redis from 'ioredis';
const { Pool } = pg;
import config from '../../../config/ai.js';

class DatabaseManager {
    constructor() {
        this.pgPool = null;
        this.redis = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            // 连接PostgreSQL (主数据库)
            this.pgPool = new Pool(config.database.postgres);
            await this.pgPool.query('SELECT 1');
            console.log('[Database] PostgreSQL连接成功');
            
            // 连接Redis (专用缓存)
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
            
            this.isConnected = true;
            await this.initTables();
        } catch (error) {
            console.error('[Database] 连接失败:', error);
            // 即使缓存失败，也不应影响主数据库功能
            if (this.pgPool) {
                this.isConnected = true;
                console.log('[Database] 主数据库连接成功，但缓存不可用');
            }
        }
    }

    async initTables() {
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
    }

    // 保存记忆 (只写入PostgreSQL，使缓存失效)
    async saveMemory(userId, memoryText, memoryType = 'interaction') {
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
            console.error('[Database] 保存记忆失败:', error);
            return false;
        }
    }

    // 获取用户记忆 (Redis缓存 + PostgreSQL)
    async getMemories(userId, limit = 5) {
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
            console.error('[Database] 获取记忆失败:', error);
            return [];
        }
    }

    // 重置用户记忆
    async resetUserMemories(userId) {
        if (!this.pgPool) return false;
        
        try {
            // 删除PostgreSQL中的记忆
            const query = `DELETE FROM user_memories WHERE user_id = $1`;
            await this.pgPool.query(query, [userId]);
            
            // 删除Redis中的缓存
            if (this.redis) {
                await this.redis.del(`user:${userId}:memories`);
            }
            
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
            postgres: { available: false, message: '未连接' },
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