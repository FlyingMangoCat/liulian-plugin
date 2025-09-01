import { OllamaHandler } from './ollama.js';
import { ModelRouter } from './core/modelRouter.js';
import serviceDetector from './core/serviceDetector.js';
import fallbackProcessor from './core/fallbackProcessor.js';
import config from '../../config/ai.js';

// 初始化Ollama处理器 - 使用配置中的URL
const ollama = new OllamaHandler(config.ai.ollama.api_url);
const modelRouter = new ModelRouter();

// 启动服务检测
serviceDetector.checkOllama().then(available => {
  if (available) {
    serviceDetector.startPeriodicCheck();
  } else {
    console.log('[AI模块] AI服务不可用，将禁用AI功能');
  }
});

class AIManager {
  // 添加服务状态检查
  static isAIAvailable() {
    return serviceDetector.isServiceAvailable();
  }

  // 获取服务状态报告
  static getServiceStatus() {
    return serviceDetector.getStatusReport();
  }

  // 添加配置安全检查方法
  static getConfig() {
    // 确保配置结构完整，提供默认值
    return {
      triggers: config.ai?.triggers || {
        names: ["榴莲", "小莲", "莲莲"],
        always_respond_to_mentions: true,
        always_respond_in_private: true
      },
      probability: config.ai?.probability || {
        private: 100,
        group: 40
      },
      reply: config.ai?.reply || {
        max_length: 200,
        delay_between_messages: 500
      },
      blacklist: config.ai?.blacklist || {
        groups: [],
        enable: false
      },
      reply_length: config.ai?.reply_length || {
        max_chars: 120,
        max_sentences: 2,
        trim_ellipsis: true
      }
    };
  }

  // 修改概率检查方法，添加黑名单检查
  static shouldReply(e) {
    const safeConfig = this.getConfig();
    
    // 如果AI服务不可用，不处理任何消息
    if (!this.isAIAvailable()) {
      console.log('[AI模块] AI服务不可用，跳过处理');
      return false;
    }
    
    // 确保消息对象存在
    if (!e) {
      console.log('[AI模块] 消息对象为空，不处理');
      return false;
    }
    
    // 检查黑名单（群消息且黑名单功能启用）
    if (safeConfig.blacklist && safeConfig.blacklist.enable && 
        !e.isPrivate && e.group_id && 
        safeConfig.blacklist.groups.includes(e.group_id.toString())) {
      console.log('[AI模块] 群组在黑名单中，跳过处理');
      return false;
    }
    
    // 私聊总是回复
    if (e.isPrivate && safeConfig.triggers.always_respond_in_private) {
      console.log('[AI模块] 私聊消息，总是回复');
      return true;
    }
    
    // 被@时总是回复
    if (e.at && safeConfig.triggers.always_respond_to_mentions) {
      console.log('[AI模块] 被@提及，总是回复');
      return true;
    }
    
    // 检查消息内容
    let messageContent = '';
    if (e.msg) {
      messageContent = typeof e.msg === 'string' ? e.msg : String(e.msg);
    } else if (e.message && Array.isArray(e.message)) {
      // 尝试从消息数组中提取文本内容
      const textMessages = e.message.filter(m => m.type === 'text');
      if (textMessages.length > 0) {
        messageContent = textMessages.map(m => m.text).join(' ');
      }
    }
    
    // 呼叫名字时总是回复
    if (messageContent) {
      const calledByName = safeConfig.triggers.names.some(name => 
        messageContent.includes(name)
      );
      if (calledByName) {
        console.log('[AI模块] 被叫到名字，总是回复');
        return true;
      }
    }
    
    // 其他情况按概率回复
    const probability = e.isPrivate 
      ? safeConfig.probability.private 
      : safeConfig.probability.group;
    const shouldReply = Math.random() * 100 <= probability;
    console.log('[AI模块] 概率检查:', {isPrivate: e.isPrivate, probability, shouldReply});
    return shouldReply;
  }

  // 修改通用聊天方法，添加服务可用性检查和降级处理
  static async generalChat(message, messageType = 'text') {
    // 检查服务可用性
    if (!this.isAIAvailable()) {
      console.log('[AI模块] AI服务不可用，使用降级处理');
      return fallbackProcessor.process(message);
    }
    
    try {
      // 确保消息是字符串
      const processedMessage = typeof message === 'string' ? message : String(message);
      
      console.log('[AI模块] 处理消息:', processedMessage.substring(0, 50) + '...');
      
      const fullPrompt = `${config.ai.system_prompt}\n\n用户消息: ${processedMessage}`;
      console.log('[AI模块] 完整提示词长度:', fullPrompt.length);
      
      const reply = await ollama.generate(
        config.ai.ollama.model, 
        fullPrompt
      );
      
      console.log('[AI模块] 收到回复:', reply?.substring(0, 50) + '...');
      return reply?.trim();
    } catch (error) {
      console.error('[AI处理错误]', error.message);
      console.log('[AI模块] AI处理失败，使用降级处理');
      return fallbackProcessor.process(message);
    }
  }

  // 修改分段回复方法，添加长度控制
  static async splitReply(e, reply) {
    const safeConfig = this.getConfig();
    const maxLength = safeConfig.reply.max_length;
    const delay = safeConfig.reply.delay_between_messages;
    
    // 首先修剪回复长度
    const trimmedReply = this.trimReply(reply, safeConfig.reply_length.max_chars);
    
    if (trimmedReply.length <= maxLength) {
      await e.reply(trimmedReply, true);
      return;
    }
    
    // 按句子分割，避免在句子中间切断
    const sentences = trimmedReply.split(/(?<=[.!?。！？])/g);
    let currentMessage = '';
    let sentMessages = 0;
    
    for (const sentence of sentences) {
      if ((currentMessage + sentence).length > maxLength && currentMessage) {
        // 发送当前积累的消息
        await e.reply(currentMessage, true);
        sentMessages++;
        currentMessage = sentence;
        
        // 检查是否达到最大消息数
        if (sentMessages >= safeConfig.reply_length.max_sentences) {
          if (safeConfig.reply_length.trim_ellipsis && currentMessage.length > 0) {
            await e.reply(currentMessage.substring(0, Math.min(currentMessage.length, 20)) + '...', true);
          }
          return;
        }
        
        // 添加延迟，避免消息过快被限制
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        currentMessage += sentence;
      }
    }
    
    // 发送最后一条消息
    if (currentMessage && sentMessages < safeConfig.reply_length.max_sentences) {
      await e.reply(currentMessage, true);
    }
  }
  
  // 修剪回复长度
  static trimReply(reply, maxLength = 120) {
    if (!reply || reply.length <= maxLength) return reply;
    
    // 查找合适的截断点（在句子结束处）
    const lastPeriod = reply.lastIndexOf('.', maxLength);
    const lastExclamation = reply.lastIndexOf('!', maxLength);
    const lastQuestion = reply.lastIndexOf('?', maxLength);
    
    const cutPoint = Math.max(lastPeriod, lastExclamation, lastQuestion);
    
    if (cutPoint > 0 && cutPoint > maxLength * 0.7) {
      return reply.substring(0, cutPoint + 1);
    }
    
    // 如果没有合适的句子结束点，直接截断并添加省略号
    return reply.substring(0, maxLength - 3) + '...';
  }
}

export { AIManager };