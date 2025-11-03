/**
 * AI服务检测器 - 检测和监控AI服务状态
 * 
 * 该模块负责：
 * 1. 检测Ollama服务是否可用
 * 2. 定期监控服务状态
 * 3. 提供服务状态报告
 * 4. 处理服务不可用时的降级策略
 */

import fetch from 'node-fetch';
import OllamaHandler from './ollama.js';

class ServiceDetector {
    constructor() {
        // Ollama服务状态
        this.ollamaAvailable = false;
        // 最后检查时间
        this.lastCheckTime = 0;
        // 检查间隔（毫秒）
        this.checkInterval = 30000; // 30秒
        // 定时检查任务
        this.checkTask = null;
        // Ollama处理器实例
        this.ollama = new OllamaHandler();
        // 健康状态详情
        this.healthDetails = {
            ollama: {
                responseTime: 0,
                version: null,
                models: []
            }
        };
        // 连续失败计数
        this.failureCount = 0;
        // 最大连续失败次数
        this.maxFailureCount = 3;
    }

    /**
     * 检查Ollama服务是否可用
     * 
     * 通过向Ollama API发送测试请求来验证服务状态
     * 同时检查配置的模型是否可用
     * 缓存检查结果以减少重复请求
     * 
     * @returns {Promise<boolean>} Ollama服务是否可用
     */
    async checkOllama() {
        const now = Date.now();
        // 如果距离上次检查不到5秒，直接返回缓存结果
        if (now - this.lastCheckTime < 5000) {
            return this.ollamaAvailable;
        }
        
        this.lastCheckTime = now;
        
        try {
            const startTime = Date.now();
            
            // 尝试获取模型列表
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
            
            const response = await fetch(`${this.ollama.apiUrl}/tags`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            const endTime = Date.now();
            
            this.ollamaAvailable = data.models && data.models.length > 0;
            this.healthDetails.ollama.responseTime = endTime - startTime;
            this.healthDetails.ollama.models = data.models || [];
            
            // 尝试获取版本信息
            try {
                const versionResponse = await fetch(`${this.ollama.apiUrl}/version`);
                if (versionResponse.ok) {
                    const versionData = await versionResponse.json();
                    this.healthDetails.ollama.version = versionData.version;
                }
            } catch (versionError) {
                // 忽略版本获取错误
                console.log('[服务检测] 获取Ollama版本信息失败:', versionError.message);
            }
            
            // 重置失败计数
            this.failureCount = 0;
        } catch (error) {
            console.log('[服务检测] Ollama服务不可用:', error.message);
            this.ollamaAvailable = false;
            this.failureCount++;
            
            // 如果连续失败次数超过阈值，标记为不可用
            if (this.failureCount >= this.maxFailureCount) {
                console.log(`[服务检测] Ollama服务连续失败${this.failureCount}次，标记为不可用`);
            }
        }
        
        return this.ollamaAvailable;
    }

    /**
     * 启动定期检查任务
     * 
     * 创建定时任务，定期检查AI服务状态
     * 确保服务状态的实时性
     * 便于及时发现和处理服务中断
     */
    startPeriodicCheck() {
        if (this.checkTask) {
            clearInterval(this.checkTask);
        }
        
        this.checkTask = setInterval(async () => {
            await this.checkOllama();
        }, this.checkInterval);
        
        console.log('[服务检测] 启动定期检查任务');
    }

    /**
     * 停止定期检查任务
     * 
     * 清理定时任务资源
     * 在模块销毁时调用
     */
    stopPeriodicCheck() {
        if (this.checkTask) {
            clearInterval(this.checkTask);
            this.checkTask = null;
            console.log('[服务检测] 停止定期检查任务');
        }
    }

    /**
     * 获取服务状态报告
     * 
     * 返回详细的AI服务状态信息
     * 包括各服务组件的可用性状态
     * 用于系统监控和故障诊断
     * 
     * @returns {object} 服务状态报告
     * @property {boolean} ollama - Ollama服务是否可用
     * @property {number} lastCheck - 最后检查时间戳
     * @property {string} status - 总体状态（available/unavailable）
     * @property {object} details - 详细健康信息
     */
    getStatusReport() {
        return {
            ollama: this.ollamaAvailable,
            lastCheck: this.lastCheckTime,
            status: this.ollamaAvailable ? 'available' : 'unavailable',
            details: this.healthDetails,
            failureCount: this.failureCount
        };
    }

    /**
     * 检查服务是否可用
     * 
     * 提供快速的服务可用性检查接口
     * 用于决定是否处理用户请求
     * 
     * @returns {boolean} AI服务是否可用
     */
    isServiceAvailable() {
        // 如果连续失败次数超过阈值，即使时间未到也返回不可用
        if (this.failureCount >= this.maxFailureCount) {
            return false;
        }
        
        return this.ollamaAvailable;
    }

    /**
     * 重置失败计数
     * 
     * 当服务恢复正常时调用，重置失败计数
     */
    resetFailureCount() {
        this.failureCount = 0;
        console.log('[服务检测] 重置失败计数');
    }
}

// 创建并导出服务检测器实例
export default new ServiceDetector();