import { OllamaHandler } from './ollama.js';
import config from '../../config/ai.js';

// 初始化Ollama处理器
const ollama = new OllamaHandler(config.ai.ollama.api_url);

export class AIManager {
  // 通用聊天方法
  static async generalChat(message) {
    try {
      const fullPrompt = `${config.ai.system_prompt}\n\n用户消息: ${message}`;
      const reply = await ollama.generate(
        config.ai.ollama.model, 
        fullPrompt
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
}import { OllamaHandler } from './ollama.js';
import config from '../../config/ai.js';

// 初始化Ollama处理器
const ollama = new OllamaHandler(config.ai.ollama.api_url);

export class AIManager {
  // 通用聊天方法
  static async generalChat(message) {
    try {
      const fullPrompt = `${config.ai.system_prompt}\n\n用户消息: ${message}`;
      const reply = await ollama.generate(
        config.ai.ollama.model, 
        fullPrompt
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