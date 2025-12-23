#!/usr/bin/env node

/**
 * 榴莲AI中间件 - 独立启动入口
 * 使用: node liulian.js [--port=3000]
 */

import { createServer } from 'http';
import { parse } from 'url';
import { readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// 设置中间件模式标志
process.env.LIULIAN_MODE = 'middleware';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

// 加载配置
const config = await import('./config/ai.js').then(m => m.config);
console.log('🥭 榴莲AI中间件初始化...');

class LiulianMiddleware {
    constructor() {
        this.port = PORT;
        this.modules = [];
        this.initialize();
    }

    async initialize() {
        // 加载模块
        this.modules = await this.loadApps();
        console.log(`✅ 共加载 ${this.modules.length} 个模块`);
        
        // 初始化数据库
        const DatabaseManager = await import('./ai/core/database.js').then(m => m.default);
        await DatabaseManager.connect();
        console.log('✅ 数据库连接完成');
        
        // 初始化AI服务
        const { AIManager } = await import('./ai/index.js');
        await AIManager.initializeServices();
        console.log('✅ AI服务初始化完成');
        
        // 启动服务器
        this.startServer();
    }

    async loadApps() {
        const appsDir = join(__dirname, 'apps');
        const appFiles = readdirSync(appsDir).filter(file => file.endsWith('.js'));
        
        const loadedModules = [];
        
        for (const file of appFiles) {
            try {
                const filePath = join(appsDir, file);
                const content = readFileSync(filePath, 'utf8');
                
                // 检查是否有中间件标签
                if (content.includes('// @liulian-middleware')) {
                    console.log(`📦 加载模块: ${file}`);
                    const module = await import(filePath);
                    loadedModules.push({ name: file, module });
                }
            } catch (error) {
                console.error(`❌ 加载模块 ${file} 失败:`, error.message);
            }
        }
        
        return loadedModules;
    }

    startServer() {
        const server = createServer(async (req, res) => {
            const { pathname, query } = parse(req.url, true);
            
            // 设置CORS头
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            // 路由处理
            try {
                if (req.method === 'POST' && pathname === '/api/chat') {
                    await this.handleChat(req, res);
                } else if (req.method === 'GET' && pathname === '/api/status') {
                    await this.handleStatus(req, res);
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: '接口不存在' }));
                }
            } catch (error) {
                console.error('请求处理错误:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: '服务器内部错误' }));
            }
        });
        
        server.listen(this.port, () => {
            console.log(`🚀 榴莲AI中间件运行在: http://localhost:${this.port}`);
            console.log(`📋 API接口:`);
            console.log(`   POST /api/chat - 处理聊天请求`);
            console.log(`   GET  /api/status - 获取服务状态`);
        });
    }

    async handleChat(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const { message, user_id, message_type = 'text' } = data;
                
                if (!message || !user_id) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: '缺少必要参数' }));
                    return;
                }
                
                // 导入AI管理器
                const { AIManager } = await import('./ai/index.js');
                
                // 调用AI处理
                const reply = await AIManager.generalChat(
                    message, 
                    message_type, 
                    user_id.toString()
                );
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    data: { reply },
                    timestamp: new Date().toISOString()
                }));
            } catch (error) {
                console.error('处理请求错误:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: '处理请求时发生错误' }));
            }
        });
    }

    async handleStatus(req, res) {
        try {
            // 导入状态管理器
            const { AIManager } = await import('./ai/index.js');
            const DatabaseManager = await import('./ai/core/database.js').then(m => m.default);
            
            // 获取AI服务状态
            const aiStatus = AIManager.getServiceStatus();
            const dbStatus = await DatabaseManager.healthCheck();
            
            const status = {
                mode: 'middleware',
                status: 'running',
                timestamp: new Date().toISOString(),
                ai: {
                    available: AIManager.isAIAvailable(),
                    ollama: aiStatus.ollama ? '✅' : '❌',
                    models: aiStatus.models
                },
                database: {
                    postgres: dbStatus.postgres.available ? '✅' : '❌',
                    redis: dbStatus.redis.available ? '✅' : '❌'
                },
                endpoints: {
                    chat: 'POST /api/chat',
                    status: 'GET /api/status'
                }
            };
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(status));
        } catch (error) {
            console.error('获取状态错误:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '获取状态失败' }));
        }
    }
}

// 启动中间件
new LiulianMiddleware();