import { OllamaHandler } from './ollama.js';
// 确保这里的路径正确指向您的配置文件
import config from '../../config/ai.js';

// 初始化Ollama处理器
const ollama = new OllamaHandler(config.ai.ollama.api_url);

class AIManager {
  // 通用聊天方法
  static async generalChat(message) {
    try {
      // 正确引用配置中的系统提示词
      const fullPrompt = `${config.ai.system_prompt}\n\n用户消息: ${message}`;
      const reply = await ollama.generate(
        config.ai.ollama.model, 
        fullPrompt,
        config.ai.system_prompt // 也作为system参数传递，如果Ollama支持
      );
      return reply?.trim();
    } catch (error) {
      console.error('[AI处理错误]', error);
      return null;
    }
  }

  // 概率检查（供主入口调用）
  static shouldReply(isPrivate) {
    const probability = isPrivate 
      ? config.ai.probability.private 
      : config.ai.probability.group;
    return Math.random() * 100 <= probability;
  }
}

export { AIManager };