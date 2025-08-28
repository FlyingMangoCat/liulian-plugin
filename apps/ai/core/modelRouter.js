import { OllamaHandler } from '../ollama.js';
import serviceDetector from './serviceDetector.js';
import config from '../../../config/ai.js';

class ModelRouter {
  constructor() {
    this.ollama = new OllamaHandler(config.ai.ollama.api_url);
    this.codePatterns = [
      /function\s+\w+\s*\(/,
      /def\s+\w+\s*\(/,
      /class\s+\w+/,
      /console\.log/,
      /#include/,
      /<?php/,
      /<script>/,
      /public\s+static\s+void/,
      /import\s+\w+/
    ];
    
    // 提供默认模型配置
    this.models = {
      general: config.ai.ollama.model || "deepseek-llm:7b",
      code: config.ai.ollama.models.code || "deepseek-coder:6.7b",
      vision: config.ai.ollama.models.vision || "moondream"
    };
  }

  // 路由消息到合适的模型
  async routeMessage(message, messageType = 'text') {
    try {
      console.log('[ModelRouter] 路由消息，类型:', messageType);
      
      // 检查服务可用性
      if (!serviceDetector.isServiceAvailable()) {
        return "AI服务当前不可用，无法处理消息。";
      }
      
      // 1. 确定消息类型
      if (messageType === 'image') {
        // 检查视觉模型是否可用
        if (serviceDetector.isModelAvailable('vision')) {
          return await this.processImage(message);
        } else {
          console.log('[ModelRouter] 视觉模型不可用，使用通用模型处理图片');
          return await this.processGeneral(`用户发送了一张图片: ${message}`);
        }
      }
      
      // 2. 检查是否包含代码
      if (this.containsCode(message)) {
        // 检查代码模型是否可用
        if (serviceDetector.isModelAvailable('code')) {
          return await this.processCode(message);
        } else {
          console.log('[ModelRouter] 代码模型不可用，使用通用模型处理代码');
          return await this.processGeneral(message);
        }
      }
      
      // 3. 默认使用通用模型
      return await this.processGeneral(message);
    } catch (error) {
      console.error('[ModelRouter] 路由失败:', error);
      // 降级处理：使用通用模型
      return await this.processGeneral(message);
    }
  }

  // 检查消息是否包含代码
  containsCode(message) {
    return this.codePatterns.some(pattern => pattern.test(message));
  }

  // 处理通用消息
  async processGeneral(message) {
    console.log('[ModelRouter] 使用通用模型处理消息');
    const fullPrompt = `${config.ai?.system_prompt || ''}\n\n用户消息: ${message}`;
    return await this.ollama.generate(
      this.models.general,
      fullPrompt
    );
  }

  // 处理代码消息
  async processCode(message) {
    console.log('[ModelRouter] 使用代码模型处理消息');
    const codePrompt = `你是一个资深的编程助手。请分析或处理以下代码：\n\n${message}`;
    return await this.ollama.generate(
      this.models.code,
      codePrompt
    );
  }

  // 处理图片消息
  async processImage(imageDescription) {
    console.log('[ModelRouter] 使用视觉模型处理图片');
    
    // 构建图片分析提示词
    const imagePrompt = `请分析以下图片内容：${imageDescription}\n\n请详细描述图片中的内容，包括人物、物体、场景、文字等任何可见元素。`;
    
    // 使用视觉模型分析图片
    const analysis = await this.ollama.generate(
      this.models.vision,
      imagePrompt
    );
    
    // 将分析结果传递给通用模型生成回复
    const replyPrompt = `${config.ai?.system_prompt || ''}\n\n用户发送了一张图片，图片分析结果: ${analysis}\n\n请根据图片内容生成合适的回复。`;
    
    return await this.ollama.generate(
      this.models.general,
      replyPrompt
    );
  }
}

export { ModelRouter };