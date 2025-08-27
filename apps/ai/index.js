import { OllamaHandler } from './ollama.js';
import config from '../../config/ai.js';

// 确保配置中的 URL 正确
console.log('[AI模块] 配置中的Ollama URL:', config.ai.ollama.api_url);

// 初始化Ollama处理器 - 使用配置中的URL
const ollama = new OllamaHandler(config.ai.ollama.api_url);

class AIManager {
  // 通用聊天方法
  static async generalChat(message) {
    try {
      console.log('[AI模块] 处理消息:', message.substring(0, 50) + '...');
      
      const fullPrompt = `${config.ai.system_prompt}\n\n用户消息: ${message}`;
      console.log('[AI模块] 完整提示词长度:', fullPrompt.length);
      
      const reply = await ollama.generate(
        config.ai.ollama.model, 
        fullPrompt
      );
      
      console.log('[AI模块] 收到回复:', reply?.substring(0, 50) + '...');
      return reply?.trim();
    } catch (error) {
      console.error('[AI处理错误]', error.message);
      return null;
    }
  }

  // 概率检查（供主入口调用）
  static shouldReply(isPrivate) {
    const probability = isPrivate 
      ? config.ai.probability.private 
      : config.ai.probability.group;
    const shouldReply = Math.random() * 100 <= probability;
    console.log('[AI模块] 概率检查:', {isPrivate, probability, shouldReply});
    return shouldReply;
  }
}

export { AIManager };