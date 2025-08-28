import fetch from 'node-fetch';
import config from '../../../config/ai.js';

class ServiceDetector {
  constructor() {
    this.ollamaAvailable = false;
    this.modelsAvailable = {
      general: false,
      code: false,
      vision: false
    };
    this.checkInterval = null;
  }

  // 检测Ollama服务是否可用
  async checkOllama() {
    try {
      const response = await fetch(`${config.ai.ollama.api_url}/api/tags`, {
        timeout: 5000 // 5秒超时
      });
      
      if (response.ok) {
        const data = await response.json();
        this.ollamaAvailable = true;
        console.log('[ServiceDetector] Ollama服务检测成功');
        
        // 检查可用模型
        await this.checkAvailableModels(data.models || []);
        return true;
      } else {
        console.log('[ServiceDetector] Ollama服务响应异常:', response.status);
        this.ollamaAvailable = false;
        return false;
      }
    } catch (error) {
      console.log('[ServiceDetector] Ollama服务检测失败:', error.message);
      this.ollamaAvailable = false;
      return false;
    }
  }

  // 检查可用模型
  async checkAvailableModels(models) {
    const availableModels = models.map(m => m.name);
    
    this.modelsAvailable.general = availableModels.includes(config.ai.ollama.model);
    this.modelsAvailable.code = availableModels.includes(config.ai.ollama.models.code);
    this.modelsAvailable.vision = availableModels.includes(config.ai.ollama.models.vision);
    
    console.log('[ServiceDetector] 可用模型检测:', this.modelsAvailable);
  }

  // 启动定期检测
  startPeriodicCheck(interval = 300000) { // 默认5分钟检测一次
    this.checkInterval = setInterval(() => {
      this.checkOllama();
    }, interval);
    
    console.log('[ServiceDetector] 启动定期服务检测');
  }

  // 停止检测
  stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('[ServiceDetector] 停止定期服务检测');
    }
  }

  // 检查服务是否可用
  isServiceAvailable() {
    return this.ollamaAvailable;
  }

  // 检查特定模型是否可用
  isModelAvailable(modelType) {
    return this.modelsAvailable[modelType] || false;
  }

  // 获取服务状态报告
  getStatusReport() {
    return {
      ollama: this.ollamaAvailable,
      models: this.modelsAvailable,
      timestamp: new Date().toISOString()
    };
  }
}

export default new ServiceDetector();