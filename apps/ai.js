import { App } from '#liulian'
import { AIManager } from './ai/index.js'

let app = App.init({
  id: 'ai',
  name: 'AI对话',
  desc: 'AI智能对话功能'
})

app.reg({
  ai: {
    reg: "^#?[可心小莲榴莲莲莲](.*)$", //匹配消息正则，命令正则
    priority: 10, //优先级，越小优先度越高
    describe: "AI智能对话", //【命令】功能说明
  },
})

/**
 * AI对话功能
 * 
 * 处理用户的AI对话请求，支持文本和图片消息
 * 根据配置决定是否回复以及如何回复
 * 
 * @param {object} e - 消息对象
 * @returns {boolean} 是否处理成功
 */
export default app
export async function ai(e) {
  try {
    // 检查是否应该回复
    if (!AIManager.shouldReply(e)) {
      return false;
    }
    
    // 提取消息内容
    let message = e.msg || '';
    if (message.startsWith('#')) {
      message = message.substring(1);
    }
    
    // 移除触发关键词
    const config = AIManager.getConfig();
    for (const name of config.triggers.names) {
      if (message.startsWith(name)) {
        message = message.substring(name.length);
        break;
      }
    }
    
    // 如果消息为空，不处理
    if (!message.trim()) {
      return false;
    }
    
    // 获取用户ID
    const userId = e.user_id ? e.user_id.toString() : null;
    
    // 处理消息
    const result = await AIManager.processMessage(message, 'text', userId);
    
    if (result.success) {
      // 使用分段回复发送消息
      await AIManager.splitReply(e, result.reply);
      return true;
    } else {
      // 发送降级回复
      await e.reply(result.fallback || "抱歉，我现在无法回答你的问题");
      return false;
    }
  } catch (error) {
    console.error('[AI对话] 处理失败:', error);
    await e.reply("处理请求时发生错误");
    return false;
  }
}
