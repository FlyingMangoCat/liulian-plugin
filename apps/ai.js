// @liulian-middleware
// 榴莲AI模块 - 支持中间件模式

import { AIManager } from './ai/index.js';
import config from '../config/ai.js';
import Cfg from '../components/Cfg.js'

// 导出中间件模式下的处理函数
export async function handleMiddlewareRequest(data) {
    const { message, user_id, message_type = 'text' } = data;
    
    try {
        const reply = await AIManager.generalChat(
            message, 
            message_type, 
            user_id.toString()
        );
        
        return {
            success: true,
            data: { reply },
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('AI处理错误:', error);
        return {
            success: false,
            error: '处理请求时发生错误'
        };
    }
}

// 云崽规则定义
export const rule = {
  ai: {
    reg: "^.*$",      // 匹配所有消息
    priority: 1000,
    describe: "AI自动回复"
  }
};

// 检查是否为命令消息（可能被其他插件处理）
function isCommandMessage(e) {
  if (!e.msg) return false;
  
  const message = typeof e.msg === 'string' ? e.msg : String(e.msg);
  const trimmedMsg = message.trim();
  
  // 常见命令前缀
  const commandPrefixes = config.ai?.compatibility?.command_prefixes || ['/', '#', '!', '！', '.', '。', '、'];
  
  // 检查消息是否以命令前缀开头
  if (commandPrefixes.some(prefix => trimmedMsg.startsWith(prefix))) {
    return true;
  }
  
  // 检查是否为常见命令模式
  const commandPatterns = [
    /^[\u4e00-\u9fa5]{1,4}[\s\b]/ // 中文命令（1-4个汉字后跟空格或边界）
  ];
  
  return commandPatterns.some(pattern => pattern.test(trimmedMsg));
}

// 主处理函数
export async function ai(e) {
  // 添加小延迟，避免抢占其他插件资源
  const minDelay = config.ai?.compatibility?.min_processing_delay || 100;
  await new Promise(resolve => setTimeout(resolve, minDelay));
  
  console.log('[榴莲AI] 函数被调用，消息类型:', e.message ? e.message[0]?.type : 'text');
  
  // 1. 基础检查
  if (e.user_id === e.self_id) {
    console.log('[榴莲AI] 忽略自身消息');
    return;
  }
  
  // 2. 检查是否为命令消息（可能被其他插件处理）
  const skipCommands = config.ai?.compatibility?.skip_command_messages !== false;
  if (skipCommands && isCommandMessage(e)) {
    console.log('[榴莲AI] 可能是命令消息，让其他插件处理');
    return;
  }
  
  // 3. 服务购买提示检查
  const userConfig = config.api?.users?.[e.user_id?.toString()];
  
  if (!Cfg.get('sys.aits', false))  {
  // 检查是否在私聊或者被@，避免频繁提示
    if (e.isPrivate || e.at) {
      await e.reply("⚠️ 您尚未购买榴莲AI服务，部分功能可能受限。\n" +
                    "请联系管理员购买服务获取API密钥。\n" +
                    "提示：如需关闭此提示，可使用【#榴莲设置 购买提示关闭】");
    }
     return false// 不返回，继续处理，但用户可能无法获得正常回复
  }
  
  // 4. 确定消息类型和内容
  let messageType = 'text';
  let messageContent = '';
  
  if (e.message && Array.isArray(e.message)) {
    // 检查消息类型
    const hasImage = e.message.some(m => m.type === 'image');
    const textMessages = e.message.filter(m => m.type === 'text');
    
    if (hasImage) {
      messageType = 'image';
      console.log('[榴莲AI] 检测到图片消息');
      
      // 提取图片URL或描述
      const imageMsg = e.message.find(m => m.type === 'image');
      messageContent = imageMsg.url || imageMsg.file || '[图片消息]';
    }
    
    // 提取文本内容
    if (textMessages.length > 0) {
      messageContent = textMessages.map(m => m.text).join(' ');
    }
  } else if (e.msg) {
    // 普通文本消息
    messageContent = typeof e.msg === 'string' ? e.msg : String(e.msg);
  }
  
  // 如果没有消息内容，不处理
  if (!messageContent && messageType !== 'image') {
    console.log('[榴莲AI] 消息内容为空，不处理');
    return;
  }
  
  // 5. 概率检查
  if (!AIManager.shouldReply(e)) {
    console.log('[榴莲AI] 不满足回复条件，不处理');
    return;
  }
  
  console.log('[榴莲AI] 满足回复条件，继续处理');
  
  // 6. 处理消息并回复
  try {
    const reply = await AIManager.generalChat(messageContent, messageType, e.user_id?.toString());
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

// 重置记忆处理函数
export async function ai_reset_memory(e) {
  // 检查管理员权限
  const adminUsers = ["123456789"]; // 替换为实际管理员ID
  if (!adminUsers.includes(e.user_id.toString())) {
    await e.reply("抱歉，您没有权限执行此操作", true);
    return;
  }
  
  // 提取要重置的用户ID
  const match = e.msg.match(/^#榴莲重置记忆\\s*@?(\\d+)/);
  if (!match) {
    await e.reply("使用方法: #榴莲重置记忆@用户ID 或 #榴莲重置记忆 用户ID", true);
    return;
  }
  
  const targetUserId = match[1];
  const result = await AIManager.resetUserMemory(targetUserId);
  await e.reply(result, true);
}