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
    priority: 99999,  // 极低优先级，确保所有其他指令优先处理
    describe: "AI自动回复"
  }
};

// 检查是否为命令消息（可能被其他插件处理）
function isCommandMessage(e) {
  if (!e.msg) return false;
  
  const message = typeof e.msg === 'string' ? e.msg : String(e.msg);
  const trimmedMsg = message.trim();
  
  // 榴莲插件指令白名单 - 这些指令绝对不要拦截
  const liulianCommandPatterns = config.ai?.compatibility?.liulian_command_patterns || [
    '^#?(榴莲|留恋)(帮助|help)$',
    '^#?(榴莲|留恋)设置(.*)$',
    '^#?(榴莲|留恋)(更新|强制更新|更新图像|图像更新)$',
    '^#?(榴莲|留恋)版本$',
    '^(地下地图帮助)$',
    '^(插件管理帮助)$',
    '^(修仙使用帮助)$',
    '^#?(B站|b站|小破站)推送帮助$',
    '^#?(原神地下地图编号)$',
    '^#榴莲状态$',
    '^#榴莲重置记忆',
    '^#?(广播|群广播)帮助$',
    '^#(广播|群广播)(.*)内容(.*)$',
    '^带话(.*)$'
  ];
  
  // 将字符串转换为正则表达式对象
  const liulianCommands = liulianCommandPatterns.map(pattern => 
    typeof pattern === 'string' ? new RegExp(pattern) : pattern
  );
  
  // 如果是榴莲插件指令，不拦截
  if (liulianCommands.some(pattern => pattern.test(trimmedMsg))) {
    return false;
  }
  
  // 常见命令前缀 - 扩展更多符号，确保不抢指令
  const commandPrefixes = config.ai?.compatibility?.command_prefixes || [
    '/', '#', '!', '！', '.', '。', '、', 
    '@', '￥', '%', '^', '&', '*', '(', ')', 
    '-', '_', '+', '=', '|', '\\', '~', '`'
  ];
  
  // 检查消息是否以命令前缀开头 - 严格检查，任何符号开头都认为是命令
  if (commandPrefixes.some(prefix => trimmedMsg.startsWith(prefix))) {
    return true;
  }
  
  // 检查是否为常见命令模式 - 扩展模式，更严格过滤
  const commandPatternStrings = [
    '^[\u4e00-\u9fa5]{1,4}[\\s\\b]', // 中文命令（1-4个汉字后跟空格或边界）
    '^\\w{1,6}\\s', // 英文命令（1-6个字符后跟空格）
    '^[a-zA-Z]+\\s*[^\\s]*$', // 纯英文命令
    '^[\u4e00-\u9fa5]{1,6}$', // 纯中文短命令（1-6个汉字）
    '^\\d+$', // 纯数字命令
    '^[#！@￥%……&*（）——+=|\\[\\]{}-]' // 特殊符号开头的消息
  ];
  
  // 将字符串转换为正则表达式对象
  const commandPatterns = commandPatternStrings.map(pattern => 
    typeof pattern === 'string' ? new RegExp(pattern) : pattern
  );
  
  // 如果匹配任何命令模式，都认为是命令
  if (commandPatterns.some(pattern => pattern.test(trimmedMsg))) {
    return true;
  }
  
  // 额外检查：如果消息很短且看起来像命令，也过滤掉
  // 但要排除榴莲插件指令
  if (trimmedMsg.length <= 4 && /^[\u4e00-\u9fa5a-zA-Z0-9]+$/.test(trimmedMsg) && !/^#?(榴莲|留恋)/.test(trimmedMsg)) {
    return true;
  }
  
  return false;
}

// 主处理函数
export async function ai(e) {
  // 0. AI服务总开关检查 - liulian.ai.enabled是AI服务总开关，不是购买提示(sys.aits)
  // 如果AI服务关闭，直接返回，不输出任何日志
  if (!Cfg.get('liulian.ai.enabled', false)) {
    return;
  }
  
  // 0.1 榴莲指令检查 - 如果是榴莲插件指令，直接返回，不处理
  const msg = e.msg || '';
  const trimmedMsgCheck = msg.trim();
  if (/^#?(榴莲|留恋)/.test(trimmedMsgCheck)) {
    console.log('[榴莲AI] 检测到榴莲插件指令，跳过处理');
    return;
  }
  
  // 增加延迟，确保其他插件优先处理
  const minDelay = config.ai?.compatibility?.min_processing_delay || 300;
  await new Promise(resolve => setTimeout(resolve, minDelay));
  
  console.log('[榴莲AI] 函数被调用，消息类型:', e.message ? e.message[0]?.type : 'text');
  
  // 1. 基础检查
  if (e.user_id === e.self_id) {
    console.log('[榴莲AI] 忽略自身消息');
    return;
  }
  
  // 2. 严格的命令消息检查 - 确保不抢任何指令
  const skipCommands = config.ai?.compatibility?.skip_command_messages !== false;
  if (skipCommands && isCommandMessage(e)) {
    console.log('[榴莲AI] 检测到命令消息，跳过处理');
    return;
  }
  
  // 2.1 额外检查：如果消息很短或看起来像指令，也跳过
  // 但要排除榴莲插件指令
  const message = e.msg || '';
  const trimmedMsg = message.trim();
  if ((trimmedMsg.length <= 3 || /^[\W_]/.test(trimmedMsg)) && !/^#?(榴莲|留恋)/.test(trimmedMsg)) {
    console.log('[榴莲AI] 消息过短或包含特殊字符，跳过处理');
    return;
  }
  
  // 3. 服务购买提示检查 - AI服务已确认开启，检查是否需要显示购买提示
  // 由于已在开头确认AI服务开启，这里只需要检查是否需要显示购买提示
  if (e.isPrivate || e.at) {
    await e.reply("⚠️ 您尚未购买榴莲AI服务，部分功能可能受限。\n" +
                  "请联系管理员购买服务获取API密钥。\n" +
                  "欢迎加入官方社群体验/获取最新生态消息/功能：806760403\n"+
                  "提示：如需关闭此提示，可使用【#榴莲设置 购买提示关闭】");
    return false;
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