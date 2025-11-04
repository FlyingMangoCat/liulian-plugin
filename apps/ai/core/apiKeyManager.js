/**
 * API密钥管理器
 * 
 * 负责管理API密钥的创建、验证、使用量统计和计费功能
 * 
 * 功能包括：
 * 1. API密钥的生成和验证
 * 2. 用户使用量统计
 * 3. 按token计费
 * 4. 密钥状态管理
 */

import mongoose from 'mongoose';
import { randomBytes } from 'node:crypto';
import { AIManager } from '../index.js';

class ApiKeyManager {
    constructor() {
        // 初始化API密钥模型
        this.apiKeySchema = new mongoose.Schema({
            key: { type: String, required: true, unique: true, index: true },
            name: { type: String, required: true },
            userId: { type: String, required: true, index: true }, // 关联用户ID
            isActive: { type: Boolean, default: true },
            usageLimit: { type: Number, default: 1000000 }, // 默认100万tokens
            usedTokens: { type: Number, default: 0 }, // 已使用tokens
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now },
            expiresAt: { type: Date } // 可选的过期时间
        });

        this.usageRecordSchema = new mongoose.Schema({
            userId: { type: String, required: true, index: true },
            apiKey: { type: String, required: true, index: true },
            model: { type: String, required: true },
            inputTokens: { type: Number, default: 0 },
            outputTokens: { type: Number, default: 0 },
            totalTokens: { type: Number, required: true },
            cost: { type: Number, default: 0 }, // 费用（元）
            timestamp: { type: Date, default: Date.now }
        });

        // API密钥模型
        try {
            this.ApiKey = mongoose.model('ApiKey');
        } catch (error) {
            this.ApiKey = mongoose.model('ApiKey', this.apiKeySchema);
        }

        // 使用记录模型
        try {
            this.UsageRecord = mongoose.model('UsageRecord');
        } catch (error) {
            this.UsageRecord = mongoose.model('UsageRecord', this.usageRecordSchema);
        }
    }

    /**
     * 检查是否应该跳过API密钥验证和计费
     * 当连接到局域网AI服务时，跳过验证和计费
     * 
     * @returns {boolean} 是否应该跳过验证和计费
     */
    shouldSkipValidationAndBilling() {
        // 检查是否连接到局域网AI服务
        return AIManager.isLocalNetworkConnection();
    }

    /**
     * 生成新的API密钥
     * 
     * @param {string} userId - 用户ID
     * @param {string} name - 密钥名称
     * @param {number} usageLimit - 使用限制（tokens）
     * @param {Date} [expiresAt] - 过期时间
     * @returns {Promise<Object>} API密钥对象
     */
    async createApiKey(userId, name, usageLimit = 1000000, expiresAt = null) {
        try {
            // 生成安全的API密钥
            const apiKey = this.generateSecureKey();
            
            const newKey = new this.ApiKey({
                key: apiKey,
                name: name,
                userId: userId,
                usageLimit: usageLimit,
                expiresAt: expiresAt
            });
            
            await newKey.save();
            
            return {
                key: newKey.key,
                name: newKey.name,
                userId: newKey.userId,
                usageLimit: newKey.usageLimit,
                usedTokens: newKey.usedTokens,
                isActive: newKey.isActive,
                createdAt: newKey.createdAt
            };
        } catch (error) {
            console.error('[API密钥管理] 创建密钥失败:', error);
            throw error;
        }
    }

    /**
     * 生成安全的API密钥
     * 
     * @returns {string} 生成的API密钥
     */
    generateSecureKey() {
        // 生成一个安全的API密钥
        return 'sk-' + randomBytes(32).toString('hex');
    }

    /**
     * 验证API密钥
     * 
     * @param {string} apiKey - API密钥
     * @returns {Promise<Object|null>} 验证结果或null
     */
    async validateApiKey(apiKey) {
        // 检查是否应该跳过验证
        if (this.shouldSkipValidationAndBilling()) {
            // 在局域网连接时，直接返回一个模拟的验证成功结果
            console.log('[API密钥管理] 局域网连接，跳过API密钥验证');
            return {
                userId: 'local_network_user', // 模拟用户ID
                keyId: 'local_network_key',
                name: 'Local Network Access', // 本地网络访问
                usageLimit: Number.MAX_SAFE_INTEGER, // 无限制
                usedTokens: 0,
                remainingTokens: Number.MAX_SAFE_INTEGER
            };
        }

        try {
            // 移除可能的Bearer前缀
            if (apiKey.startsWith('Bearer ')) {
                apiKey = apiKey.substring(7).trim();
            }
            
            // 移除可能的X-API-Key格式
            if (apiKey.startsWith('sk-') === false && apiKey.length !== 67) { // "sk-" + 64位hex
                apiKey = apiKey.replace(/^sk-/, '');
            }
            
            if (!apiKey.startsWith('sk-')) {
                apiKey = 'sk-' + apiKey;
            }

            const keyDoc = await this.ApiKey.findOne({ 
                key: apiKey, 
                isActive: true 
            });
            
            if (!keyDoc) {
                return null;
            }

            // 检查是否过期
            if (keyDoc.expiresAt && new Date() > keyDoc.expiresAt) {
                // 标记为非活跃状态
                await this.ApiKey.updateOne({ _id: keyDoc._id }, { isActive: false });
                return null;
            }

            // 检查是否超出使用限制
            if (keyDoc.usedTokens >= keyDoc.usageLimit) {
                // 超出限制
                return null;
            }

            return {
                userId: keyDoc.userId,
                keyId: keyDoc._id,
                name: keyDoc.name,
                usageLimit: keyDoc.usageLimit,
                usedTokens: keyDoc.usedTokens,
                remainingTokens: keyDoc.usageLimit - keyDoc.usedTokens
            };
        } catch (error) {
            console.error('[API密钥管理] 验证密钥失败:', error);
            return null;
        }
    }

    /**
     * 记录API使用情况
     * 
     * @param {string} apiKey - API密钥
     * @param {string} model - 使用的模型
     * @param {number} inputTokens - 输入tokens数
     * @param {number} outputTokens - 输出tokens数
     * @returns {Promise<boolean>} 记录是否成功
     */
    async recordUsage(apiKey, model, inputTokens, outputTokens) {
        // 检查是否应该跳过计费
        if (this.shouldSkipValidationAndBilling()) {
            // 在局域网连接时，跳过计费记录
            console.log('[API密钥管理] 局域网连接，跳过API使用量记录和计费');
            return true; // 直接返回成功
        }

        try {
            const keyDoc = await this.ApiKey.findOne({ key: apiKey });
            if (!keyDoc) {
                return false;
            }

            const totalTokens = inputTokens + outputTokens;
            const cost = this.calculateCost(model, totalTokens);

            // 更新API密钥的使用量
            await this.ApiKey.updateOne(
                { _id: keyDoc._id },
                { 
                    usedTokens: keyDoc.usedTokens + totalTokens,
                    updatedAt: new Date()
                }
            );

            // 记录使用详情
            const usageRecord = new this.UsageRecord({
                userId: keyDoc.userId,
                apiKey: apiKey,
                model: model,
                inputTokens: inputTokens,
                outputTokens: outputTokens,
                totalTokens: totalTokens,
                cost: cost
            });

            await usageRecord.save();

            return true;
        } catch (error) {
            console.error('[API密钥管理] 记录使用情况失败:', error);
            return false;
        }
    }

    /**
     * 根据模型计算费用
     * 
     * @param {string} model - 模型名称
     * @param {number} tokens - tokens数量
     * @returns {number} 费用（元）
     */
    calculateCost(model, tokens) {
        // 计费标准参考AI_API_SERVICE.md
        let ratePerThousand = 0.0025; // 默认费率

        if (model.toLowerCase().includes('llama2')) {
            ratePerThousand = 0.002;
        } else if (model.toLowerCase().includes('llama3')) {
            ratePerThousand = 0.003;
        } else if (model.toLowerCase().includes('mistral')) {
            ratePerThousand = 0.0025;
        } else if (model.toLowerCase().includes('mixtral')) {
            ratePerThousand = 0.004;
        } else if (model.toLowerCase().includes('gemma')) {
            ratePerThousand = 0.002;
        }

        // 计算费用：ratePerThousand * (tokens / 1000)
        return (ratePerThousand * tokens) / 1000;
    }

    /**
     * 获取用户使用统计
     * 
     * @param {string} userId - 用户ID
     * @returns {Promise<Object>} 使用统计信息
     */
    async getUserUsage(userId) {
        try {
            // 获取用户的所有API密钥
            const keys = await this.ApiKey.find({ userId: userId });
            
            // 统计总使用量
            const totalUsed = keys.reduce((sum, key) => sum + key.usedTokens, 0);
            const totalLimit = keys.reduce((sum, key) => sum + key.usageLimit, 0);
            
            // 获取最近的使用记录
            const recentUsage = await this.UsageRecord
                .find({ userId: userId })
                .sort({ timestamp: -1 })
                .limit(10);
            
            return {
                userId: userId,
                totalUsedTokens: totalUsed,
                totalUsageLimit: totalLimit,
                remainingTokens: totalLimit - totalUsed,
                apiKeyCount: keys.length,
                recentUsage: recentUsage,
                activeKeys: keys.filter(key => key.isActive).length
            };
        } catch (error) {
            console.error('[API密钥管理] 获取用户使用统计失败:', error);
            return {
                userId: userId,
                totalUsedTokens: 0,
                totalUsageLimit: 0,
                remainingTokens: 0,
                apiKeyCount: 0,
                recentUsage: [],
                activeKeys: 0
            };
        }
    }

    /**
     * 获取API密钥列表
     * 
     * @param {string} userId - 用户ID
     * @returns {Promise<Array>} API密钥列表
     */
    async getUserApiKeys(userId) {
        try {
            const keys = await this.ApiKey.find({ userId: userId });
            
            return keys.map(key => ({
                id: key._id,
                name: key.name,
                key: key.key,
                isActive: key.isActive,
                usageLimit: key.usageLimit,
                usedTokens: key.usedTokens,
                remainingTokens: key.usageLimit - key.usedTokens,
                createdAt: key.createdAt,
                expiresAt: key.expiresAt
            }));
        } catch (error) {
            console.error('[API密钥管理] 获取用户API密钥列表失败:', error);
            return [];
        }
    }

    /**
     * 删除API密钥
     * 
     * @param {string} userId - 用户ID
     * @param {string} keyId - 密钥ID
     * @returns {Promise<boolean>} 删除是否成功
     */
    async deleteApiKey(userId, keyId) {
        try {
            const result = await this.ApiKey.deleteOne({ 
                _id: keyId, 
                userId: userId 
            });
            
            return result.deletedCount > 0;
        } catch (error) {
            console.error('[API密钥管理] 删除API密钥失败:', error);
            return false;
        }
    }

    /**
     * 更新API密钥状态
     * 
     * @param {string} keyId - 密钥ID
     * @param {boolean} isActive - 新的状态
     * @returns {Promise<boolean>} 更新是否成功
     */
    async updateApiKeyStatus(keyId, isActive) {
        try {
            const result = await this.ApiKey.updateOne(
                { _id: keyId },
                { isActive: isActive }
            );
            
            return result.matchedCount > 0;
        } catch (error) {
            console.error('[API密钥管理] 更新API密钥状态失败:', error);
            return false;
        }
    }

    /**
     * 获取系统使用统计（管理员功能）
     * 
     * @returns {Promise<Object>} 系统使用统计
     */
    async getSystemStats() {
        try {
            const totalKeys = await this.ApiKey.countDocuments();
            const activeKeys = await this.ApiKey.countDocuments({ isActive: true });
            const totalUsers = await this.ApiKey.distinct('userId');
            
            const recentUsage = await this.UsageRecord
                .find()
                .sort({ timestamp: -1 })
                .limit(100);
            
            const totalTokensUsed = recentUsage.reduce((sum, record) => sum + record.totalTokens, 0);
            const totalCost = recentUsage.reduce((sum, record) => sum + record.cost, 0);
            
            return {
                totalKeys: totalKeys,
                activeKeys: activeKeys,
                totalUsers: totalUsers.length,
                totalTokensUsed: totalTokensUsed,
                totalCost: totalCost,
                recentUsage: recentUsage
            };
        } catch (error) {
            console.error('[API密钥管理] 获取系统统计失败:', error);
            return {
                totalKeys: 0,
                activeKeys: 0,
                totalUsers: 0,
                totalTokensUsed: 0,
                totalCost: 0,
                recentUsage: []
            };
        }
    }
}

// 导出单例
export default new ApiKeyManager();