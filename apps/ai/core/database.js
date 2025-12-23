import pg from 'pg';
import Redis from 'ioredis';
const { Pool } = pg;
import config from '../../config/ai.js';

class DatabaseManager {
    constructor() {
        this.pgPool = null;
        this.redis = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            // 连接PostgreSQL
            this.pgPool = new Pool(config.database.postgres);
            await this.pgPool.query('SELECT 1');
            console.log('[Database] PostgreSQL连接成功');
            
            // 连接Redis（远程连接）
            this.redis = new Redis({
                host: config.database.redis.host,
                port: config.database.redis.port,
                password: config.database.redis.password,
                keyPrefix: 'liulian:cache:',
                ttl: config.database.redis.ttl || 3600,
                enableOfflineQueue: false,
                ssl: config.database.redis.ssl || false,
                connectTimeout: config.database.redis.connectTimeout || 10000,
                lazyConnect: true, // 延迟连接，避免阻塞启动
                retryDelayOnFailover: 100,
                maxRetriesPerRequest: 3
            });
            
            await this.redis.ping();
            console.log('[Database] Redis缓存连接成功');
            
            this.isConnected = true;
            await this.initTables();
        } catch (error) {
            console.error('[Database] 连接失败:', error);
            if (this.pgPool) {
                this.isConnected = true;
                console.log('[Database] 主数据库连接成功，但缓存不可用');
            }
        }
    }

    async initTables() {
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

        // 用户好感度表
        const resonanceTableQuery = `
            CREATE TABLE IF NOT EXISTS user_resonance (
                user_id VARCHAR(50) PRIMARY KEY,
                resonance_value INTEGER DEFAULT 0,
                resonance_level VARCHAR(20) DEFAULT 'NEUTRAL',
                last_interaction TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_user_resonance ON user_resonance(user_id);
        `;
        await this.pgPool.query(resonanceTableQuery);

        console.log('[Database] 表初始化完成');
    }

    // 保存记忆
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

    // 获取用户记忆
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
            
            // 存入Redis缓存
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
            const query = `DELETE FROM user_memories WHERE user_id = $1`;
            await this.pgPool.query(query, [userId]);
            
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

    // 获取用户好感度
    async getUserResonance(userId) {
        if (!this.pgPool) return null;
        
        try {
            const result = await this.pgPool.query(
                'SELECT * FROM user_resonance WHERE user_id = $1',
                [userId]
            );
            
            if (result.rows.length === 0) {
                // 创建新用户
                await this.pgPool.query(`
                    INSERT INTO user_resonance (user_id, resonance_value, resonance_level)
                    VALUES ($1, $2, $3)
                `, [userId, 0, 'NEUTRAL']);
                
                return {
                    value: 0,
                    level: 'NEUTRAL'
                };
            }
            
            return result.rows[0];
        } catch (error) {
            console.error('[Database] 获取用户好感度失败:', error);
            return null;
        }
    }

    // 更新用户好感度
    async updateUserResonance(userId, change) {
        if (!this.pgPool) return false;
        
        try {
            const currentResonance = await this.getUserResonance(userId);
            if (!currentResonance) return false;
            
            const newValue = Math.max(-100, Math.min(100, currentResonance.resonance_value + change));
            let newLevel = 'NEUTRAL';
            
            if (newValue >= 80) {
                newLevel = 'INTIMATE';
            } else if (newValue >= 40) {
                newLevel = 'FRIENDLY';
            } else if (newValue >= 0) {
                newLevel = 'NEUTRAL';
            } else if (newValue >= -40) {
                newLevel = 'COLD';
            } else {
                newLevel = 'HATED';
            }
            
            await this.pgPool.query(`
                UPDATE user_resonance 
                SET resonance_value = $1, 
                    resonance_level = $2,
                    last_interaction = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $3
            `, [newValue, newLevel, userId]);
            
            return true;
        } catch (error) {
            console.error('[Database] 更新用户好感度失败:', error);
            return false;
        }
    }

    // 关闭连接
    async disconnect() {
        if (this.pgPool) {
            await this.pgPool.end();
        }
        if (this.redis) {
            await this.redis.quit();
        }
        this.isConnected = false;
    }
}

export default new DatabaseManager();