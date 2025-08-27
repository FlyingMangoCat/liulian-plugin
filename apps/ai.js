import { AIManager } from './ai/index.js';

// 云崽规则定义 - 这是必须的
export const rule = {
  ai: {
    reg: "^.*$",      // 匹配所有消息
    priority: 1000,
    describe: "AI自动回复"
  }
};

// 主处理函数 - 函数名必须与rule中的键名一致
export async function ai(e) {
  // 1. 基础检查
  if (e.user_id === e.self_id) return;
  
  // 2. 概率检查
  if (!AIManager.shouldReply(e.isPrivate)) return;
  
  // 3. 处理消息并回复
  try {
    const reply = await AIManager.generalChat(e.msg);
    if (reply) {
      await e.reply(reply, true);
    }
  } catch (error) {
    console.error('[榴莲AI] 处理失败:', error);
    // 可以选择性地发送错误提示，或者静默失败
  }
}