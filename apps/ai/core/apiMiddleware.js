/**
 * API中间件
 * 
 * 处理API请求的认证、计费和使用量统计
 * 
 * 功能包括：
 * 1. API密钥验证
 * 2. 使用量检查
 * 3. 请求计费
 * 4. 错误处理
 */

import ApiKeyManager from './apiKeyManager.js';

class ApiMiddleware {
    constructor() {
        // 错误代码映射
        this.errorCodes = {
            MISSING_API_KEY: '缺少API密钥',
            INVALID_API_KEY: '无效的API密钥',
            RATE_LIMIT_EXCEEDED: 'API密钥使用次数已达上限',
            AUTHENTICATION_ERROR: 'API密钥验证失败',
            ADMIN_REQUIRED: '需要管理员权限',
            MISSING_MESSAGES: '缺少必要参数: messages',
            MISSING_PROMPT: '缺少必要参数: prompt',
            AI_SERVICE_ERROR: 'AI服务错误',
            OLLAMA_CONNECTION_ERROR: '无法连接Ollama服务'
        };
    }

    /**
     * 认证中间件
     * 
     * 验证API密钥并检查使用限制
     * 
     * @param {Object} req - 请求对象
     * @param {Object} res - 响应对象
     * @param {Function} next - 下一步函数
     * @returns {void}
     */
    async authenticate(req, res, next) {
        try {
            // 从请求头获取API密钥
            let apiKey = req.headers.authorization || req.headers['x-api-key'];
            
            if (!apiKey) {
                return this.sendError(res, 'MISSING_API_KEY', 401);
            }
            
            // 验证API密钥
            const keyInfo = await ApiKeyManager.validateApiKey(apiKey);
            
            if (!keyInfo) {
                return this.sendError(res, 'INVALID_API_KEY', 401);
            }
            
            // 将密钥信息添加到请求对象中
            req.apiKeyInfo = keyInfo;
            
            // 继续处理请求
            next();
        } catch (error) {
            console.error('[API中间件] 认证失败:', error);
            return this.sendError(res, 'AUTHENTICATION_ERROR', 500);
        }
    }

    /**
     * 计费中间件
     * 
     * 记录API使用情况并进行计费
     * 
     * @param {string} apiKey - API密钥
     * @param {string} model - 使用的模型
     * @param {number} inputTokens - 输入tokens数
     * @param {number} outputTokens - 输出tokens数
     * @returns {Promise<boolean>} 计费是否成功
     */
    async chargeUsage(apiKey, model, inputTokens, outputTokens) {
        try {
            // 记录使用情况
            const success = await ApiKeyManager.recordUsage(
                apiKey, 
                model, 
                inputTokens, 
                outputTokens
            );
            
            if (!success) {
                console.error('[API中间件] 计费失败:', { apiKey, model, inputTokens, outputTokens });
            }
            
            return success;
        } catch (error) {
            console.error('[API中间件] 计费过程中发生错误:', error);
            return false;
        }
    }

    /**
     * 发送错误响应
     * 
     * @param {Object} res - 响应对象
     * @param {string} errorCode - 错误代码
     * @param {number} statusCode - HTTP状态码
     * @returns {void}
     */
    sendError(res, errorCode, statusCode = 400) {
        const errorMessage = this.errorCodes[errorCode] || '未知错误';
        
        res.status(statusCode).json({
            error: errorMessage,
            code: errorCode
        });
    }

    /**
     * 获取用户使用统计
     * 
     * @param {string} userId - 用户ID
     * @returns {Promise<Object>} 使用统计信息
     */
    async getUserUsage(userId) {
        return await ApiKeyManager.getUserUsage(userId);
    }

    /**
     * 创建API密钥
     * 
     * @param {string} userId - 用户ID
     * @param {string} name - 密钥名称
     * @param {number} usageLimit - 使用限制
     * @returns {Promise<Object>} API密钥信息
     */
    async createApiKey(userId, name, usageLimit) {
        return await ApiKeyManager.createApiKey(userId, name, usageLimit);
    }

    /**
     * 获取用户API密钥列表
     * 
     * @param {string} userId - 用户ID
     * @returns {Promise<Array>} API密钥列表
     */
    async getUserApiKeys(userId) {
        return await ApiKeyManager.getUserApiKeys(userId);
    }

    /**
     * 删除API密钥
     * 
     * @param {string} userId - 用户ID
     * @param {string} keyId - 密钥ID
     * @returns {Promise<boolean>} 删除是否成功
     */
    async deleteApiKey(userId, keyId) {
        return await ApiKeyManager.deleteApiKey(userId, keyId);
    }

    /**
     * 更新API密钥状态
     * 
     * @param {string} keyId - 密钥ID
     * @param {boolean} isActive - 新的状态
     * @returns {Promise<boolean>} 更新是否成功
     */
    async updateApiKeyStatus(keyId, isActive) {
        return await ApiKeyManager.updateApiKeyStatus(keyId, isActive);
    }

    /**
     * 获取系统使用统计（管理员功能）
     * 
     * @returns {Promise<Object>} 系统使用统计
     */
    async getSystemStats() {
        return await ApiKeyManager.getSystemStats();
    }
}

// 导出单例
export default new ApiMiddleware();