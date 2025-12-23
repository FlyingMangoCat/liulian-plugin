// 简化的API服务 - 基于现有逻辑扩展
import express from 'express';
import axios from 'axios';
import { Pool } from 'pg';
import Redis from 'ioredis';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(express.json());

// 配置
const config = {
    port: process.env.API_PORT || 8080,
    ollama: {
        url: process.env.OLLAMA_URL || 'http://localhost:11434',
        models: {
            general: process.env.GENERAL_MODEL || 'deepseek-llm:7b',
            vision: process.env.VISION_MODEL || 'moondream:latest',
            fast: process.env.FAST_MODEL || 'qwen:7b-chat'
        }
    },
    database: {
        postgres: {
            host: process.env.POSTGRES_HOST || 'localhost',
            port: process.env.POSTGRES_PORT || 5432,
            user: process.env.POSTGRES_USER || 'liulian_user',
            password: process.env.POSTGRES_PASSWORD || 'password',
            database: process.env.POSTGRES_DB || 'liulian_db'
        },
        redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || ''
        }
    }
};

// 数据库连接
let pgPool, redis;

async function initDatabase() {
    try {
        // PostgreSQL
        pgPool = new Pool(config.database.postgres);
        await pgPool.query('SELECT 1');
        console.log('PostgreSQL连接成功');

        // Redis
        redis = new Redis(config.database.redis);
        await redis.ping();
        console.log('Redis连接成功');

        // 创建表
        await createTables();
    } catch (error) {
        console.error('数据库连接失败:', error);
        process.exit(1);
    }
}

// 创建数据表
async function createTables() {
    const tables = `
        CREATE TABLE IF NOT EXISTS user_data (
            user_id VARCHAR(50) PRIMARY KEY,
            resonance_value INTEGER DEFAULT 0,
            resonance_level VARCHAR(20) DEFAULT 'NEUTRAL',
            memories JSONB DEFAULT '[]',
            character_version VARCHAR(10) DEFAULT 'v1.0',
            character_level INTEGER DEFAULT 1,
            character_experience INTEGER DEFAULT 0,
            last_interaction TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS interaction_logs (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(50) NOT NULL,
            message TEXT NOT NULL,
            reply TEXT,
            model_used VARCHAR(50),
            response_time INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_user_data_id ON user_data(user_id);
        CREATE INDEX IF NOT EXISTS idx_interaction_logs_user_id ON interaction_logs(user_id);
    `;
    
    await pgPool.query(tables);
    console.log('数据表创建完成');
}

// 获取用户数据
async function getUserData(userId) {
    const cacheKey = `user:${userId}`;
    
    // 先查缓存
    const cached = await redis.get(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }
    
    // 查数据库
    const result = await pgPool.query(
        'SELECT * FROM user_data WHERE user_id = $1',
        [userId]
    );
    
    let userData;
    if (result.rows.length === 0) {
        // 创建新用户
        userData = {
            user_id: userId,
            resonance_value: 0,
            resonance_level: 'NEUTRAL',
            memories: [],
            character_version: 'v1.0',
            character_level: 1,
            character_experience: 0,
            last_interaction: null
        };
        
        await pgPool.query(`
            INSERT INTO user_data (user_id, resonance_value, resonance_level, memories, character_version, character_level, character_experience)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [userId, 0, 'NEUTRAL', '[]', 'v1.0', 1, 0]);
    } else {
        userData = result.rows[0];
    }
    
    // 缓存1小时
    await redis.setex(cacheKey, 3600, JSON.stringify(userData));
    return userData;
}

// 更新用户数据
async function updateUserData(userId, updates) {
    const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = Object.values(updates);
    
    await pgPool.query(`
        UPDATE user_data 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
    `, [userId, ...values]);
    
    // 清除缓存
    await redis.del(`user:${userId}`);
}

// 记录交互日志
async function logInteraction(userId, message, reply, modelUsed, responseTime) {
    await pgPool.query(`
        INSERT INTO interaction_logs (user_id, message, reply, model_used, response_time)
        VALUES ($1, $2, $3, $4, $5)
    `, [userId, message, reply, modelUsed, responseTime]);
}



// 调用Ollama
async function callOllama(model, prompt) {
    try {
        const response = await axios.post(`${config.ollama.url}/api/generate`, {
            model: model,
            prompt: prompt,
            stream: false,
            options: {
                temperature: 0.7,
                num_predict: 1000
            }
        }, {
            timeout: 30000
        });
        
        return response.data.response;
    } catch (error) {
        console.error('Ollama调用失败:', error.message);
        throw error;
    }
}



// 模型调用接口 - 只提供基础模型服务
app.post('/api/model/:modelName', async (req, res) => {
    try {
        const { modelName } = req.params;
        const { prompt, options = {} } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: '缺少prompt参数' });
        }
        
        const startTime = Date.now();
        
        // 调用指定模型
        const reply = await callOllama(modelName, prompt, options);
        
        const responseTime = Date.now() - startTime;
        
        res.json({
            success: true,
            reply: reply,
            metadata: {
                model_used: modelName,
                response_time: responseTime
            }
        });
        
    } catch (error) {
        console.error('模型调用失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 获取可用模型列表
app.get('/api/models', (req, res) => {
    res.json({
        success: true,
        models: config.ollama.models
    });
});

// 健康检查
app.get('/api/health', async (req, res) => {
    try {
        await pgPool.query('SELECT 1');
        await redis.ping();
        
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

// 数据库操作接口 - 用户数据
app.get('/api/user/:userId', async (req, res) => {
    try {
        const userData = await getUserData(req.params.userId);
        res.json({
            success: true,
            data: userData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const updates = req.body;
        
        await updateUserData(userId, updates);
        
        res.json({
            success: true,
            message: '用户数据更新成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 记录交互日志
app.post('/api/log', async (req, res) => {
    try {
        const { userId, message, reply, modelUsed, responseTime } = req.body;
        
        await logInteraction(userId, message, reply, modelUsed, responseTime);
        
        res.json({
            success: true,
            message: '日志记录成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 启动服务
async function start() {
    await initDatabase();
    
    app.listen(config.port, () => {
        console.log(`榴莲API服务启动成功，端口: ${config.port}`);
        console.log(`Ollama地址: ${config.ollama.url}`);
    });
}

start().catch(console.error);