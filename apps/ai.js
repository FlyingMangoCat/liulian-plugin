// @liulian-middleware
// 榴莲AI模块 - 支持中间件模式

import { AIManager } from '#liulian.ai';
import config from '#liulian.config';
import { Cfg } from '#liulian'
import * as chatState from '#liulian.chatState';

// 延迟初始化函数
async function ensureInitialized() {
  try {
    const { initializeServices } = await import('#liulian.ai');
    await initializeServices();
  } catch (error) {
    console.error('[AI模块] 初始化失败:', error);
  }
}

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
  // 确保初始化（延迟到第一次使用）
  await ensureInitialized();

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
  // 仅拦截以符号/标点开头的消息（\w 不含中文，必须显式排除中文字符）
  if ((trimmedMsg.length <= 3 || /^[^\w\u4e00-\u9fa5]/.test(trimmedMsg)) && !/^#?(榴莲|留恋)/.test(trimmedMsg)) {
    console.log('[榴莲AI] 消息过短或包含特殊字符，跳过处理');
    return;
  }
  
  // 4. 确定消息类型和内容
  let messageType = 'text';
  let messageContent = '';
  let imageUrl = null;

  if (e.message && Array.isArray(e.message)) {
    // 检查消息类型
    const hasImage = e.message.some(m => m.type === 'image');
    const textMessages = e.message.filter(m => m.type === 'text');

    if (hasImage) {
      messageType = 'image';
      console.log('[榴莲AI] 检测到图片消息');

      // 提取图片URL或描述（与文字分开保存，避免互相覆盖）
      const imageMsg = e.message.find(m => m.type === 'image');
      imageUrl = imageMsg.url || imageMsg.file || null;
    }

    // 表情包（mface 有图）也走视觉模型前置转文字
    const mfaceMsg = e.message.find(m => m.type === 'mface' && (m.url || m.file));
    if (mfaceMsg && !imageUrl) {
      messageType = 'image';
      imageUrl = mfaceMsg.url || mfaceMsg.file;
      console.log('[榴莲AI] 检测到表情包消息');
    }

    // 提取文本内容
    if (textMessages.length > 0) {
      messageContent = textMessages.map(m => m.text).join(' ');
    }
  } else if (e.msg) {
    // 普通文本消息
    messageContent = typeof e.msg === 'string' ? e.msg : String(e.msg);
  }

  // 图片消息必须有图片地址或文字说明之一，否则不处理
  if (messageType === 'image' && !imageUrl && !messageContent) {
    console.log('[榴莲AI] 图片消息缺少内容，不处理');
    return;
  }

  // 如果没有消息内容，不处理
  if (!messageContent && messageType !== 'image') {
    console.log('[榴莲AI] 消息内容为空，不处理');
    return;
  }
  
  // 5. 决策检查（服务可用/黑名单/触发名由 shouldReply 处理，
  //    群聊主动回复由评分+额度门控+空闲退避决定，替代固定概率掷骰子）
  if (!AIManager.shouldReply(e)) {
    console.log('[榴莲AI] 不满足回复条件，不处理');
    return;
  }
  
  console.log('[榴莲AI] 满足回复条件，继续处理');
  
  // 6. 处理消息并回复（带上双层上下文：远期摘要 + 近期原文目录）
  const contextText = chatState.buildContextBlock(e);
  const chatId = e.group_id ? `g${e.group_id}` : `p${e.user_id}`;
  try {
    let reply = await AIManager.generalChat(messageContent, messageType, e.user_id?.toString(), imageUrl, contextText);

    // 取阅循环：模型要求查看某条原文时，补拉一次再给一次正式回复机会（最多一轮）
    const lookMatch = typeof reply === 'string' ? reply.match(/^\[?查看\s*#(\d+)\]?$/) : null;
    if (lookMatch) {
      console.log('[榴莲AI] 模型要求查看消息 #' + lookMatch[1]);
      const content = await chatState.fetchMsgContent(chatId, lookMatch[1]);
      if (content) {
        const contextText2 = `${contextText}\n\n【你要求查看的原文】\n${content}\n（已查看，现在必须给出正式回复，或回复 [沉默]）`;
        reply = await AIManager.generalChat(messageContent, messageType, e.user_id?.toString(), imageUrl, contextText2);
      }
    }

    if (reply) {
      // 模型主动选择沉默：不发送，计入空闲退避
      if (/^\[?沉默\]?$/.test(String(reply).trim())) {
        console.log('[榴莲AI] 模型判断此刻不接话，保持沉默');
        chatState.markSilent(e);
        return;
      }
      // 清理残留的取阅标记（正常不应出现，双保险）
      const cleanReply = String(reply).replace(/\[查看\s*#\d+\]/g, '').trim();
      if (!cleanReply) {
        console.log('[榴莲AI] 回复清理后为空，不发送');
        return;
      }
      console.log('[榴莲AI] 准备回复:', cleanReply.substring(0, 50) + '...');
      // 使用分段回复
      await AIManager.splitReply(e, cleanReply);
      console.log('[榴莲AI] 回复发送成功');
      // 真实回复：重置退避 + 记入额度反馈 + 触发后台摘要
      chatState.markReplied(e);
      chatState.maybeSummarize(e);
    } else {
      console.log('[榴莲AI] 未获得有效回复');
    }
  } catch (error) {
    console.error('[榴莲AI] 处理失败:', error);
  }
}

// 重置记忆处理函数
export async function ai_reset_memory(e) {
  // 检查主人权限
  if (!e.isMaster) {
    await e.reply("只有主人才能重置记忆哦~", true);
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