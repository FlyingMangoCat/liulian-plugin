import { ModelRouter } from './core/modelRouter.js';
import { MemoryManager } from './core/memoryManager.js';

const modelRouter = new ModelRouter();
const memoryManager = new MemoryManager();

class AIManager {
  static async processMessage(e) {
    // 1. 获取上下文
    const context = await memoryManager.getContext(e.user_id, e.group_id);
    // 2. 路由消息
    const messageType = e.message?.some(item => item.type === 'image') ? 'image' : 'text';
    let reply = await modelRouter.routeMessage(e.msg, messageType);
    // 3. 保存交互
    await memoryManager.saveInteraction(e.user_id, e.group_id, e.msg, reply);
    return reply;
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