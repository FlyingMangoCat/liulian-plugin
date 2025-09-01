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
      console.log('[ServiceDetector] 检查Ollama服务...');
      const response = await fetch(`${config.ai.ollama.api_url}/api/tags`, {
        timeout: 5000
      });
      
      if (response.ok) {
        const data = await response.json();
        this.ollamaAvailable = true;
        console.log('[ServiceDetector] Ollama服务正常');
        
        await this.checkAvailableModels(data.models || []);
        return true;
      } else {
        console.log('[ServiceDetector] Ollama服务异常:', response.status);
        this.ollamaAvailable = false;
        return false;
      }
    } catch (error) {
      console.log('[ServiceDetector] Ollama服务连接失败:', error.message);
      this.ollamaAvailable = false;
      return false;
    }
  }

  // 检查可用模型
  async checkAvailableModels(models) {
    const availableModels = models.map(m => m.name);
    console.log('[ServiceDetector] 可用模型列表:', availableModels);
    
    // 检查模型是否存在（支持多种名称格式）
    this.modelsAvailable.general = this.checkModelExists(availableModels, config.ai.ollama.model);
    this.modelsAvailable.code = this.checkModelExists(availableModels, config.ai.ollama.models.code);
    this.modelsAvailable.vision = this.checkModelExists(availableModels, config.ai.ollama.models.vision);
    
    console.log('[ServiceDetector] 模型可用性:', this.modelsAvailable);
  }

  // 检查模型是否存在（支持多种名称格式）
  checkModelExists(availableModels, modelName) {
    if (!modelName) return false;
    
    // 检查精确匹配
    if (availableModels.includes(modelName)) {
      return true;
    }
    
    // 检查不带标签的匹配（如：moondream 匹配 moondream:latest）
    const baseName = modelName.split(':')[0];
    const found = availableModels.some(model => model.split(':')[0] === baseName);
    
    if (found) {
      console.log(`[ServiceDetector] 模型 ${modelName} 匹配到可用模型: ${baseName}`);
    }
    
    return found;
  }

  // 启动定期检测
  startPeriodicCheck(interval = 300000) {
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