import { AIManager } from './ai/index.js';

console.log('[榴莲AI] 插件开始加载');
console.log('[榴莲AI] AI模块导入完成');

// 云崽规则定义
export const rule = {
  ai: {
    reg: "^.*$",      // 匹配所有消息
    priority: 1000,
    describe: "AI自动回复"
  }
};

console.log('[榴莲AI] 规则定义完成');

// 主处理函数
export async function ai(e) {
  console.log('[榴莲AI] 函数被调用，消息:', e.msg);
  
  // 1. 基础检查
  if (e.user_id === e.self_id) {
    console.log('[榴莲AI] 忽略自身消息');
    return;
  }
  
  // 2. 概率检查
  if (!AIManager.shouldReply(e)) {
    console.log('[榴莲AI] 不满足回复条件，不处理');
    return;
  }
  
  console.log('[榴莲AI] 满足回复条件，继续处理');
  
  // 3. 处理消息并回复
  try {
    const reply = await AIManager.generalChat(e.msg);
    if (reply) {
      console.log('[榴莲AI] 准备回复:', reply.substring(0, 50) + '...');
      // 使用分段回复
      await AIManager.splitReply(e, reply);
      console.log('[榴莲AI] 回复发送成功');
    } else {
      console.log('[榴莲AI] 未获得有效回复');
    }
  } catch (error) {
    console.error('[榴莲AI] 处理失败:', error);
  }
}