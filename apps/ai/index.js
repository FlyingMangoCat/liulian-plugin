import { OllamaHandler } from './ollama.js';

// 初始化Ollama处理器
const ollama = new OllamaHandler("http://192.168.0.112:11435");

class AIManager {
  // 通用聊天方法
  static async generalChat(message) {
    try {
      const systemPrompt = "【您的系统提示词在这里】";
      const fullPrompt = `${systemPrompt}\n\n用户消息: ${message}`;
      const reply = await ollama.generate(
        "deepseek-llm:7b", 
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
    const probability = isPrivate ? 100 : 40;
    return Math.random() * 100 <= probability;
  }
}

export { AIManager };