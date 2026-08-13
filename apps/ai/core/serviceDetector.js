import { default as provider } from '#liulian.provider';
import config from '#liulian.config';

class ServiceDetector {
    constructor() {
        this.isAvailable = false;
        this.lastCheckTime = null;
        this.checkInterval = config.ai?.performance?.check_interval || 60000; // 1分钟检查一次
        this.checkTimer = null;
    }

    async checkService() {
        try {
            // 尝试获取模型列表来检查服务是否可用
            await provider.listModels();
            this.isAvailable = true;
            this.lastCheckTime = new Date();
            console.log('[ServiceDetector] AI服务可用');
            return true;
        } catch (error) {
            this.isAvailable = false;
            this.lastCheckTime = new Date();
            console.log('[ServiceDetector] AI服务不可用:', error.message);
            return false;
        }
    }

    async checkModels() {
        try {
            const models = await provider.listModels();
            const availableModels = models.map(m => m.name);
            
            const configModels = provider.isApiMode
                ? (config.ai?.api?.models || {})
                : (config.ai?.local?.models || {});
            const modelStatus = {};

            for (const [key, modelName] of Object.entries(configModels)) {
                if (!modelName) continue;
                modelStatus[key] = {
                    name: modelName,
                    available: availableModels.includes(modelName)
                };
            }

            return modelStatus;
        } catch (error) {
            console.error('[ServiceDetector] 检查模型状态失败:', error);
            // 即使检查失败，也返回默认的模型状态结构
            const configModels = provider.isApiMode
                ? (config.ai?.api?.models || {})
                : (config.ai?.local?.models || {});
            const modelStatus = {};

            for (const [key, modelName] of Object.entries(configModels)) {
                if (!modelName) continue;
                modelStatus[key] = {
                    name: modelName,
                    available: false
                };
            }

            return modelStatus;
        }
    }

    startPeriodicCheck() {
        if (this.checkTimer) {
            clearInterval(this.checkTimer);
        }

        this.checkTimer = setInterval(async () => {
            await this.checkService();
        }, this.checkInterval);

        console.log('[ServiceDetector] 启动定期检查，间隔:', this.checkInterval + 'ms');
    }

    stopPeriodicCheck() {
        if (this.checkTimer) {
            clearInterval(this.checkTimer);
            this.checkTimer = null;
            console.log('[ServiceDetector] 停止定期检查');
        }
    }

    isServiceAvailable() {
        // 检测已通过，服务可用
        if (this.isAvailable) return true;
        // 检测未通过但存在有效配置时不阻断对话，交由实际请求兜底
        return provider.isApiMode || !!config.ai?.local?.api_url;
    }

    getLastCheckTime() {
        return this.lastCheckTime;
    }

    async getStatusReport() {
        const modelStatus = await this.checkModels();
        
        return {
            available: this.isAvailable,
            lastCheck: this.lastCheckTime,
            service: {
                url: provider.isApiMode
                    ? (config.ai?.api?.base_url || '')
                    : (config.ai?.local?.api_url || ''),
                available: this.isAvailable
            },
            models: modelStatus
        };
    }

    async waitForService(timeout = 30000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            const available = await this.checkService();
            if (available) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        return false;
    }
}

export default new ServiceDetector();