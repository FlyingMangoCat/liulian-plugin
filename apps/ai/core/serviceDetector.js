import fetch from 'node-fetch';
import config from '../../../config/ai.js';
import os from 'os';

class ServiceDetector {
  constructor() {
    this.ollamaAvailable = false;
    this.ollamaBaseUrl = config.ai.ollama.api_url; // 默认URL
    this.modelsAvailable = {
      general: false,
      code: false,
      vision: false
    };
    this.isLocalNetwork = false; // 是否连接到局域网服务
    this.checkInterval = null;
  }

  // 检测局域网内的Ollama服务
  async checkLocalNetworkOllama() {
    try {
      console.log('[ServiceDetector] 检查局域网Ollama服务...');
      
      // 获取本地网络接口信息
      const networkInterfaces = os.networkInterfaces();
      const localIPs = [];
      
      // 获取所有IPv4地址（排除回环地址）
      for (const name of Object.keys(networkInterfaces)) {
        for (const iface of networkInterfaces[name]) {
          if (!iface.internal && iface.family === 'IPv4') {
            localIPs.push(iface.address);
          }
        }
      }
      
      console.log('[ServiceDetector] 本地IP地址:', localIPs);
      
      // 生成局域网IP地址段进行检测
      const networkSegments = [];
      for (const ip of localIPs) {
        const parts = ip.split('.');
        if (parts.length === 4) {
          // 生成C类网络段 (x.x.x.0/24)
          const networkSegment = `${parts[0]}.${parts[1]}.${parts[2]}`;
          if (!networkSegments.includes(networkSegment)) {
            networkSegments.push(networkSegment);
          }
        }
      }
      
      console.log('[ServiceDetector] 局域网段:', networkSegments);
      
      // 检查常见的局域网Ollama端口
      const commonPorts = [11434, 11435, 11436];
      const commonHosts = ['localhost', '127.0.0.1'];
      
      // 添加局域网IP地址
      for (const segment of networkSegments) {
        for (let i = 1; i <= 254; i++) {
          commonHosts.push(`${segment}.${i}`);
        }
      }
      
      // 限制检查数量以避免耗时过长
      const maxChecks = 50;
      const hostsToCheck = commonHosts.slice(0, maxChecks);
      
      console.log(`[ServiceDetector] 将检查 ${hostsToCheck.length} 个主机`);
      
      // 并行检查所有主机
      const checkPromises = [];
      for (const host of hostsToCheck) {
        for (const port of commonPorts) {
          const url = `http://${host}:${port}`;
          checkPromises.push(this.testOllamaConnection(url));
        }
      }
      
      const results = await Promise.all(checkPromises);
      const availableServices = results.filter(result => result.available);
      
      if (availableServices.length > 0) {
        // 优先选择第一个可用的服务
        const bestService = availableServices[0];
        console.log(`[ServiceDetector] 发现局域网Ollama服务: ${bestService.url}`);
        this.ollamaBaseUrl = bestService.url;
        this.isLocalNetwork = true;
        return bestService.url;
      }
      
      console.log('[ServiceDetector] 未发现局域网Ollama服务');
      return null;
    } catch (error) {
      console.log('[ServiceDetector] 局域网Ollama服务检测失败:', error.message);
      return null;
    }
  }

  // 测试单个Ollama连接
  async testOllamaConnection(baseUrl) {
    try {
      const response = await fetch(`${baseUrl}/api/tags`, {
        timeout: 3000 // 设置较短的超时时间
      });
      
      if (response.ok) {
        const data = await response.json();
        return { available: true, url: baseUrl, models: data.models || [] };
      }
    } catch (error) {
      // 连接失败，忽略错误
    }
    
    return { available: false, url: baseUrl };
  }

  // 检测Ollama服务是否可用
  async checkOllama() {
    try {
      // 首先尝试检测局域网服务
      const localNetworkUrl = await this.checkLocalNetworkOllama();
      if (localNetworkUrl) {
        console.log(`[ServiceDetector] 使用局域网Ollama服务: ${localNetworkUrl}`);
      } else {
        // 如果没有发现局域网服务，使用默认配置
        console.log(`[ServiceDetector] 使用默认Ollama服务: ${this.ollamaBaseUrl}`);
      }
      
      console.log('[ServiceDetector] 检查Ollama服务...');
      const response = await fetch(`${this.ollamaBaseUrl}/api/tags`, {
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