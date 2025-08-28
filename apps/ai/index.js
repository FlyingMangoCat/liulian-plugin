import { OllamaHandler } from './ollama.js';
import config from '../../config/ai.js';

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

  // 概率检查
  static shouldReply(e) {
    // 私聊总是回复
    if (e.isPrivate && config.ai.triggers.always_respond_in_private) {
      console.log('[AI模块] 私聊消息，总是回复');
      return true;
    }
    
    // 被@时总是回复
    if (e.at && config.ai.triggers.always_respond_to_mentions) {
      console.log('[AI模块] 被@提及，总是回复');
      return true;
    }
    
    // 呼叫名字时总是回复
    const calledByName = config.ai.triggers.names.some(name => 
      e.msg.includes(name)
    );
    if (calledByName) {
      console.log('[AI模块] 被叫到名字，总是回复');
      return true;
    }
    
    // 其他情况按概率回复
    const probability = e.isPrivate 
      ? config.ai.probability.private 
      : config.ai.probability.group;
    const shouldReply = Math.random() * 100 <= probability;
    console.log('[AI模块] 概率检查:', {isPrivate: e.isPrivate, probability, shouldReply});
    return shouldReply;
  }

  // 分段回复方法
  static async splitReply(e, reply) {
    const maxLength = config.ai.reply.max_length;
    const delay = config.ai.reply.delay_between_messages;
    
    if (reply.length <= maxLength) {
      await e.reply(reply, true);
      return;
    }
    
    // 按句子分割，避免在句子中间切断
    const sentences = reply.split(/(?<=[.!?。！？])/g);
    let currentMessage = '';
    
    for (const sentence of sentences) {
      if ((currentMessage + sentence).length > maxLength && currentMessage) {
        // 发送当前积累的消息
        await e.reply(currentMessage, true);
        currentMessage = sentence;
        // 添加延迟，避免消息过快被限制
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        currentMessage += sentence;
      }
    }
    
    // 发送最后一条消息
    if (currentMessage) {
      await e.reply(currentMessage, true);
    }
  }
}

export { AIManager };