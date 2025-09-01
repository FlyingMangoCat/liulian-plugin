import { OllamaHandler } from '../ollama.js';
import serviceDetector from './serviceDetector.js';
import imageProcessor from './imageProcessor.js';
import config from '../../../config/ai.js';

class ModelRouter {
  constructor() {
    this.ollama = new OllamaHandler(config.ai.ollama.api_url);
    this.imageProcessor = imageProcessor;
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
    console.log('[ModelRouter] 处理图片消息');
    
    try {
      // 使用专用处理器分析图片
      const analysis = await this.imageProcessor.process(imageDescription);
      
      // 使用通用模型生成回复
      return await this.generateReplyFromAnalysis(analysis, imageDescription);
    } catch (error) {
      console.error('[ModelRouter] 图片处理失败:', error);
      // 降级处理
      return await this.processGeneral(`用户发送了一张图片: ${imageDescription}`);
    }
  }

  // 根据分析结果生成回复
  async generateReplyFromAnalysis(analysis, originalDescription) {
    // 简化的回复生成提示词
    const prompt = `${config.ai.system_prompt}

用户发送了一张图片，图片分析结果如下：
${analysis}

请根据以上分析生成一个自然、简短的回复。如果图片有趣，可以幽默回应；如果图片包含信息，可以针对内容回应。`;

    return await this.ollama.generate(
      config.ai.ollama.model,
      prompt
    );
  }
}

export { ModelRouter };