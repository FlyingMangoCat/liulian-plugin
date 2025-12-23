import ollama from '../ollama.js';
import config from '../../config/ai.js';

class ServiceDetector {
    constructor() {
        this.isAvailable = false;
        this.lastCheckTime = null;
        this.checkInterval = config.ai?.performance?.check_interval || 60000; // 1分钟检查一次
        this.checkTimer = null;
    }

    async checkOllama() {
        try {
            // 尝试获取模型列表来检查服务是否可用
            await ollama.listModels();
            this.isAvailable = true;
            this.lastCheckTime = new Date();
            console.log('[ServiceDetector] Ollama服务可用');
            return true;
        } catch (error) {
            this.isAvailable = false;
            this.lastCheckTime = new Date();
            console.log('[ServiceDetector] Ollama服务不可用:', error.message);
            return false;
        }
    }

    async checkModels() {
        try {
            const models = await ollama.listModels();
            const availableModels = models.map(m => m.name);
            
            const configModels = config.ai?.ollama?.models || {};
            const modelStatus = {};

            for (const [key, modelName] of Object.entries(configModels)) {
                modelStatus[key] = {
                    name: modelName,
                    available: availableModels.includes(modelName)
                };
            }

            return modelStatus;
        } catch (error) {
            console.error('[ServiceDetector] 检查模型状态失败:', error);
            return {};
        }
    }

    startPeriodicCheck() {
        if (this.checkTimer) {
            clearInterval(this.checkTimer);
        }

        this.checkTimer = setInterval(async () => {
            await this.checkOllama();
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
        return this.isAvailable;
    }

    getLastCheckTime() {
        return this.lastCheckTime;
    }

    async getStatusReport() {
        const modelStatus = await this.checkModels();
        
        return {
            available: this.isAvailable,
            lastCheck: this.lastCheckTime,
            ollama: {
                url: config.ai?.ollama?.api_url || 'http://localhost:11434',
                available: this.isAvailable
            },
            models: modelStatus
        };
    }

    async waitForService(timeout = 30000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            const available = await this.checkOllama();
            if (available) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        return false;
    }
}

export default new ServiceDetector();