/**
 * AI API服务器
 * 
 * 启动独立的API服务器，提供RESTful API接口
 * 
 * 功能包括：
 * 1. 启动Express服务器
 * 2. 配置中间件
 * 3. 挂载API路由
 * 4. 错误处理
 */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import apiRouter from './api.js';
import { AIManager } from './index.js';
import DatabaseManager from './core/database.js';

const app = express();
const PORT = process.env.AI_API_PORT || 3000;

// 中间件配置
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// 日志中间件
app.use((req, res, next) => {
    console.log(`[API服务器] ${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// 健康检查端点
app.get('/health', async (req, res) => {
    try {
        // 检查数据库连接状态
        const dbStatus = await DatabaseManager.healthCheck();
        
        // 检查AI服务状态
        const aiStatus = AIManager.getServiceStatus();
        
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: dbStatus,
            ai: aiStatus
        };
        
        res.json(health);
    } catch (error) {
        console.error('[API服务器] 健康检查失败:', error);
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

// 挂载API路由
app.use('/api', apiRouter);

// 404处理
app.use((req, res) => {
    res.status(404).json({
        error: '接口不存在',
        code: 'NOT_FOUND'
    });
});

// 全局错误处理
app.use((error, req, res, next) => {
    console.error('[API服务器] 未处理的错误:', error);
    res.status(500).json({
        error: '服务器内部错误',
        code: 'INTERNAL_ERROR'
    });
});

// 启动服务器
async function startServer() {
    try {
        console.log('[API服务器] 正在初始化...');
        
        // 初始化数据库连接
        console.log('[API服务器] 初始化数据库连接...');
        await DatabaseManager.connect();
        
        if (!DatabaseManager.isConnected) {
            console.error('[API服务器] 数据库连接失败');
            process.exit(1);
        }
        
        console.log('[API服务器] 数据库连接成功');
        
        // 初始化AI服务
        console.log('[API服务器] 初始化AI服务...');
        const aiAvailable = await AIManager.initializeServices();
        
        if (!aiAvailable) {
            console.warn('[API服务器] AI服务不可用，API将受限');
        }
        
        // 启动服务器
        app.listen(PORT, () => {
            console.log(`[API服务器] 启动成功，监听端口 ${PORT}`);
            console.log(`[API服务器] API文档: http://localhost:${PORT}/api-docs`);
        });
    } catch (error) {
        console.error('[API服务器] 启动失败:', error);
        process.exit(1);
    }
}

// 如果直接运行此文件，则启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
    startServer();
}

export default app;
export { startServer };