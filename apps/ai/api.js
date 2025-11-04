/**
 * AI API路由
 * 
 * 提供RESTful API接口用于访问AI服务
 * 
 * 功能包括：
 * 1. API密钥管理
 * 2. AI服务接口
 * 3. 使用统计
 * 4. 管理员接口
 */

import express from 'express';
import { AIManager } from './index.js';
import ApiMiddleware from './core/apiMiddleware.js';

const router = express.Router();

/**
 * API密钥管理路由
 */

// 创建API密钥
router.post('/ai-api/keys', async (req, res) => {
    try {
        // 这里应该从JWT token中获取用户ID
        // 暂时使用请求体中的userId作为示例
        const { userId, name, usageLimit } = req.body;
        
        if (!userId || !name) {
            return ApiMiddleware.sendError(res, 'MISSING_REQUIRED_FIELDS', 400);
        }
        
        const result = await AIManager.createApiKey(userId, name, usageLimit);
        
        if (result.success) {
            res.status(201).json(result.data);
        } else {
            ApiMiddleware.sendError(res, 'INTERNAL_ERROR', 500);
        }
    } catch (error) {
        console.error('[API路由] 创建API密钥失败:', error);
        ApiMiddleware.sendError(res, 'INTERNAL_ERROR', 500);
    }
});

// 获取API密钥列表
router.get('/ai-api/keys', async (req, res) => {
    try {
        // 这里应该从JWT token中获取用户ID
        // 暂时使用查询参数中的userId作为示例
        const { userId } = req.query;
        
        if (!userId) {
            return ApiMiddleware.sendError(res, 'MISSING_USER_ID', 400);
        }
        
        const result = await AIManager.getUserApiKeys(userId);
        
        if (result.success) {
            res.json(result.data);
        } else {
            ApiMiddleware.sendError(res, 'INTERNAL_ERROR', 500);
        }
    } catch (error) {
        console.error('[API路由] 获取API密钥列表失败:', error);
        ApiMiddleware.sendError(res, 'INTERNAL_ERROR', 500);
    }
});

// 删除API密钥
router.delete('/ai-api/keys/:keyId', async (req, res) => {
    try {
        // 这里应该从JWT token中获取用户ID
        // 暂时使用查询参数中的userId作为示例
        const { userId } = req.query;
        const { keyId } = req.params;
        
        if (!userId || !keyId) {
            return ApiMiddleware.sendError(res, 'MISSING_REQUIRED_FIELDS', 400);
        }
        
        const result = await AIManager.deleteApiKey(userId, keyId);
        
        if (result.success) {
            res.json({ message: 'API密钥删除成功' });
        } else {
            ApiMiddleware.sendError(res, 'INTERNAL_ERROR', 500);
        }
    } catch (error) {
        console.error('[API路由] 删除API密钥失败:', error);
        ApiMiddleware.sendError(res, 'INTERNAL_ERROR', 500);
    }
});

/**
 * AI服务接口路由
 */

// 获取可用模型列表
router.get('/ai-service/models', ApiMiddleware.authenticate, async (req, res) => {
    try {
        // 这里应该调用Ollama API获取模型列表
        // 暂时返回示例数据
        const models = [
            { name: 'llama2', type: 'text' },
            { name: 'llama3', type: 'text' },
            { name: 'mistral', type: 'text' },
            { name: 'mixtral', type: 'text' },
            { name: 'gemma', type: 'text' },
            { name: 'llava', type: 'vision' }
        ];
        
        res.json({ models });
    } catch (error) {
        console.error('[API路由] 获取模型列表失败:', error);
        ApiMiddleware.sendError(res, 'AI_SERVICE_ERROR', 500);
    }
});

// AI聊天接口
router.post('/ai-service/chat', ApiMiddleware.authenticate, async (req, res) => {
    try {
        const { model, messages } = req.body;
        
        if (!messages || !Array.isArray(messages)) {
            return ApiMiddleware.sendError(res, 'MISSING_MESSAGES', 400);
        }
        
        // 构建聊天历史
        const chatHistory = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
        
        // 处理消息
        const result = await AIManager.processMessage(
            chatHistory, 
            'text', 
            req.apiKeyInfo.userId, 
            req.headers.authorization || req.headers['x-api-key']
        );
        
        if (result.success) {
            res.json({
                role: 'assistant',
                content: result.reply,
                stats: result.stats
            });
        } else {
            ApiMiddleware.sendError(res, 'AI_SERVICE_ERROR', 500);
        }
    } catch (error) {
        console.error('[API路由] AI聊天接口失败:', error);
        ApiMiddleware.sendError(res, 'AI_SERVICE_ERROR', 500);
    }
});

// AI文本生成接口
router.post('/ai-service/generate', ApiMiddleware.authenticate, async (req, res) => {
    try {
        const { model, prompt } = req.body;
        
        if (!prompt) {
            return ApiMiddleware.sendError(res, 'MISSING_PROMPT', 400);
        }
        
        // 处理消息
        const result = await AIManager.processMessage(
            prompt, 
            'text', 
            req.apiKeyInfo.userId, 
            req.headers.authorization || req.headers['x-api-key']
        );
        
        if (result.success) {
            res.json({
                response: result.reply,
                stats: result.stats
            });
        } else {
            ApiMiddleware.sendError(res, 'AI_SERVICE_ERROR', 500);
        }
    } catch (error) {
        console.error('[API路由] AI文本生成接口失败:', error);
        ApiMiddleware.sendError(res, 'AI_SERVICE_ERROR', 500);
    }
});

/**
 * 使用统计路由
 */

// 获取个人使用统计
router.get('/ai-api/usage', async (req, res) => {
    try {
        // 这里应该从JWT token中获取用户ID
        // 暂时使用查询参数中的userId作为示例
        const { userId } = req.query;
        
        if (!userId) {
            return ApiMiddleware.sendError(res, 'MISSING_USER_ID', 400);
        }
        
        const result = await AIManager.getUserUsage(userId);
        
        if (result.success) {
            res.json(result.data);
        } else {
            ApiMiddleware.sendError(res, 'INTERNAL_ERROR', 500);
        }
    } catch (error) {
        console.error('[API路由] 获取使用统计失败:', error);
        ApiMiddleware.sendError(res, 'INTERNAL_ERROR', 500);
    }
});

/**
 * 管理员接口路由
 */

// 获取所有API密钥（用于监控）
router.get('/ai-api/admin/keys', async (req, res) => {
    try {
        // 这里应该验证管理员权限
        // 暂时返回示例数据
        res.json({ message: '管理员功能暂未实现' });
    } catch (error) {
        console.error('[API路由] 获取所有API密钥失败:', error);
        ApiMiddleware.sendError(res, 'INTERNAL_ERROR', 500);
    }
});

// 禁用/启用API密钥
router.patch('/ai-api/admin/keys/:keyId', async (req, res) => {
    try {
        // 这里应该验证管理员权限
        const { keyId } = req.params;
        const { isActive } = req.body;
        
        if (typeof isActive !== 'boolean') {
            return ApiMiddleware.sendError(res, 'INVALID_STATUS', 400);
        }
        
        const success = await ApiMiddleware.updateApiKeyStatus(keyId, isActive);
        
        if (success) {
            res.json({ message: `API密钥已${isActive ? '启用' : '禁用'}` });
        } else {
            ApiMiddleware.sendError(res, 'INTERNAL_ERROR', 500);
        }
    } catch (error) {
        console.error('[API路由] 更新API密钥状态失败:', error);
        ApiMiddleware.sendError(res, 'INTERNAL_ERROR', 500);
    }
});

// 获取系统使用统计
router.get('/ai-api/admin/stats', async (req, res) => {
    try {
        // 这里应该验证管理员权限
        const stats = await ApiMiddleware.getSystemStats();
        res.json(stats);
    } catch (error) {
        console.error('[API路由] 获取系统统计失败:', error);
        ApiMiddleware.sendError(res, 'INTERNAL_ERROR', 500);
    }
});

export default router;