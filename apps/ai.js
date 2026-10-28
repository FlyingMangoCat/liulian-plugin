// @liulian-middleware
// 榴莲AI模块 - 支持中间件模式

import { AIManager } from '#liulian.ai';
import { Cfg } from '#liulian';
import config from '#liulian.config';
import * as chatState from '#liulian.chatState';
import { getBrainCfg, isCloudConfigured } from './ai/core/cloudBrainClient.js';
import { askBrain } from './ai/core/brain.js';

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
  
  // 常见命令前缀 - 真正的指令都以符号开头（#/等）
  const commandPrefixes = config.ai?.compatibility?.command_prefixes || [
    '/', '#', '!', '！', '.', '。', '、', 
    '@', '￥', '%', '^', '&', '*', '(', ')', 
    '-', '_', '+', '=', '|', '\\', '~', '`'
  ];
  
  // 检查消息是否以命令前缀开头
  if (commandPrefixes.some(prefix => trimmedMsg.startsWith(prefix))) {
    return true;
  }
  
  return false;
}

// 主处理函数
// 云大脑未配置提示：只对主人提示一次（静默原则，不打扰群/私聊）
let cloudHintSent = false;

// 单飞锁：记录正在生成回复的会话（chatId），同一群同时只跑一次模型调用
const generatingChats = new Set();

export async function ai(e) {
  const __t0 = Date.now();
  // 确保初始化（延迟到第一次使用）
  await ensureInitialized();

  // 以下所有“不接管本条消息”的出口统一 return false：
  // 框架只在显式返回 false 时把消息放行给后续规则/插件，裸 return 会被当成已处理而吞掉消息
  // 0. AI服务总开关检查（与主设置面板同一开关，关闭时不打日志）
  if (!Cfg.get('sys.aiEnabled', false)) {
    return false;
  }
  
  // 0.1 榴莲指令检查 - 榴莲插件指令放行给对应规则处理
  const msg = e.msg || '';
  const trimmedMsgCheck = msg.trim();
  if (/^#?(榴莲|留恋)/.test(trimmedMsgCheck)) {
    console.log('[榴莲AI] 检测到榴莲插件指令，放行');
    return false;
  }
  
  console.log('[榴莲AI] 函数被调用，消息类型:', e.message ? e.message[0]?.type : 'text');

  // 1. 基础检查
  if (e.user_id === e.self_id) {
    console.log('[榴莲AI] 忽略自身消息');
    return false;
  }

  // 1.1 兜底收录：accept 机制若在当前框架未生效，凡到达本函数的消息补录一次
  //     （record 内部有防重标记，accept 已收录时此处为空操作）
  try { chatState.record(e); } catch {}

  // 2. 严格的命令消息检查 - 确保不抢任何指令
  const skipCommands = config.ai?.compatibility?.skip_command_messages !== false;
  if (skipCommands && isCommandMessage(e)) {
    console.log('[榴莲AI] 检测到命令消息，放行');
    return false;
  }
  
  // 2.1 额外检查：仅放行"无有效内容"的群消息（纯表情/纯标点，如"？？？""😂😂😂"），
  // 含任意中文/字母数字的内容一律进决策；私聊、@bot、榴莲指令不在此列
  const message = e.msg || '';
  const trimmedMsg = message.trim();
  const isAtMe = Array.isArray(e.message) && e.message.some(m => m.type === 'at' && String(m.qq) === String(e.self_id));
  if (e.group_id && !isAtMe && !/[\w\u4e00-\u9fa5]/.test(trimmedMsg) && !/^#?(榴莲|留恋)/.test(trimmedMsg)) {
    console.log('[榴莲AI] 消息无有效内容，放行');
    return false;
  }

  // 2.5 云大脑模式检查：mode=cloud 但未配置 → 主人提示一次，其余静默放行
  if (getBrainCfg().mode === 'cloud' && !isCloudConfigured()) {
    if (e.isMaster && !cloudHintSent) {
      cloudHintSent = true;
      e.reply('榴莲AI：云大脑未配置（编辑 config/config/liulian/ai.yaml 的 brain 段填 base_url/api_key）', true).catch(() => {});
    }
    return false;
  }

  // 决策前等待，控制回复节奏（兼容配置，仅在真正接管前等待）
  const minDelay = config.ai?.compatibility?.min_processing_delay || 300;
  await new Promise(resolve => setTimeout(resolve, minDelay));
  
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

    // 提取文本内容（@ 与引用喂可读形态，不能丢上下文让模型猜）：
    // @段→@名字（@自己→@我）；引用段→[引用 说话人：「原话摘要」]；
    // 昵称取群成员表（getMemberMap 成熟用法），取不到退回 QQ 号
    const hasStructured = e.message.some(m => m.type === 'at' || m.type === 'reply');
    if (hasStructured) {
      const memberMap = e.group ? await e.group.getMemberMap().catch(() => null) : null;
      const nameOf = (qq) => {
        const info = memberMap ? (memberMap.get?.(Number(qq)) || memberMap.get?.(String(qq))) : null;
        return (info && (info.card || info.nickname)) || String(qq);
      };
      let quoted = '';
      if (e.source) {
        const quotedText = String(
          e.source.raw_message ||
          (Array.isArray(e.source.message)
            ? e.source.message.filter(m => m.type === 'text').map(m => m.text).join(' ')
            : e.source.message) || ''
        ).trim().substring(0, 60);
        quoted = `[引用 ${nameOf(e.source.user_id)}说：「${quotedText}」]`;
      }
      const parts = [];
      for (const m of e.message) {
        if (m.type === 'text') parts.push(m.text);
        else if (m.type === 'at') parts.push(String(m.qq) === String(e.self_id) ? '@我' : `@${nameOf(m.qq)}`);
        // reply 段的原文已在 quoted 前缀里，跳过占位
      }
      messageContent = `${quoted}${quoted ? ' ' : ''}${parts.join(' ').trim()}`.trim();
      // 引用/@场景实证日志：模型实际收到什么一目了然（适配器不给 e.source 时 quoted 为空立刻现形）
      console.log('[榴莲AI] 结构化消息内容:', messageContent.substring(0, 80));
    } else if (textMessages.length > 0) {
      messageContent = textMessages.map(m => m.text).join(' ');
    }
  } else if (e.msg) {
    // 普通文本消息
    messageContent = typeof e.msg === 'string' ? e.msg : String(e.msg);
  }

  // 图片消息必须有图片地址或文字说明之一，否则不处理
  if (messageType === 'image' && !imageUrl && !messageContent) {
    console.log('[榴莲AI] 图片消息缺少内容，放行');
    return false;
  }

  // 如果没有消息内容，不处理
  if (!messageContent && messageType !== 'image') {
    console.log('[榴莲AI] 消息内容为空，放行');
    return false;
  }
  
  // 5. 决策检查（服务可用/黑名单/触发名由 shouldReply 处理，
  //    群聊主动回复由评分+额度门控+空闲退避决定，替代固定概率掷骰子）
  if (!AIManager.shouldReply(e)) {
    console.log('[榴莲AI] 不满足回复条件，放行');
    return false;
  }
  
  console.log('[榴莲AI] 满足回复条件，继续处理');
  console.log(`[榴莲AI] 计时: 门禁+决策 ${Date.now() - __t0}ms`);

  // 多账号去重：同一条消息只由一个账号处理（TRSS 多 bot 会双触发）
  if (e.__liulianClaimed) {
    console.log('[榴莲AI] 本条已由其他账号接管，放行');
    return false;
  }
  e.__liulianClaimed = true;

  // 5.5 通用回复链路：单飞锁 → askBrain 取回复（cloud/local 适配器，见 brain.js）→ 统一清理 → 分条发送
  // 上下文剂量：最近 N 条原文，0 = 取消注入（取消/恢复只改这个数字，不动代码）
  const CONTEXT_RECENT_N = 5;
  const contextText = chatState.buildContextBlock(e, CONTEXT_RECENT_N);
  const chatId = e.group_id ? `g${e.group_id}` : `p${e.user_id}`;
  // 单飞锁：本群上一条回复还在生成时，新消息只入窗口不排队等模型
  // （真人在打字也不会同时回三条；排队只会让每条越等越久、话题越回越旧）
  if (generatingChats.has(chatId)) {
    console.log('[榴莲AI] 本群回复生成中，本条只入窗口不排队');
    return false;
  }
  generatingChats.add(chatId);
  try {
    const __t1 = Date.now();
    const r = await askBrain(e, { messageContent, messageType, imageUrl, contextText });
    console.log(`[榴莲AI] 计时: 模型调用 ${Date.now() - __t1}ms，消息发出后累计 ${Date.now() - __t0}ms`);

    // 大脑主动不接话：不发送，计入空闲退避（本地 [沉默] / 云端 silent 同口径）
    // 静默时打原始回复前 60 字：基座模型不出结束符/乱吐标记时，日志能直接看见它说了什么
    if (r.silent || !r.reply) {
      console.log('[榴莲AI] 大脑未接话，静默放行 | 适配器返回:', JSON.stringify(r).substring(0, 120));
      chatState.markSilent(e);
      return false;
    }

    // 协议垃圾兜底：模型把 [沉默] 和正文混着输出、或带（#18）目录编号尾巴——剥掉，
    // 剩下为空按未接话处理（只剥协议形态，不碰正常文本）
    let replyText = String(r.reply)
      .replace(/^\s*\[?沉默\]?\s*/, '')
      .replace(/[（(]#\d+[）)]/g, '')
      .trim();
    if (!replyText) {
      console.log('[榴莲AI] 回复剥掉协议标记后为空，按沉默处理');
      chatState.markSilent(e);
      return false;
    }

    // 清理模型自造的包装标记——只动明确是包装的形态，不一刀切：
    // 前缀必须带完整【】方括号才剥（裸"回复"开头的正文不动）；引号不碰——
    // 回复合法引用别人说话时也以引号开头，交由提示词【输出格式】管源头
    const cleanReply = replyText
      .replace(/\[查看\s*#?\d+\]/g, '')
      .replace(/^【回复】\s*[:：]?\s*/, '')
      // 模型学着目录造假引用标签（[reply]xx[/reply]）：剥壳保内容，按普通文本发
      .replace(/\[reply\]([\s\S]*?)\[\/reply\]/gi, '$1')
      .replace(/\[\/?reply\]/gi, '')
      // 目录行复读（"#6 名字: 原话"）：整行剥掉，保住混在里面的正文
      .replace(/^\s*#\d+\s+\S+[:：].*$/gm, '')
      // 复读收敛：弱模型看了目录会把群里原话连写几遍（"有人斗虫吗？/有人斗虫吗？/…"），
      // 同一短语用斜杠分隔重复≥2次收敛成一遍，尾部斜杠剥掉——只动这种复读形态，不碰正常文本
      .replace(/([^\s/]{2,30}[?？!！。～~]?)(?:\s*\/+\s*\1)+/g, '$1')
      .replace(/[\s/]+$/, '')
      .trim();

    // 截断收尾：命中 num_predict 上限被掐断的回复没有句尾标点——退到最后一个句读再发，
    // 不留半句话（正常短回复自带句尾标点，不会进这个分支；根治要换带对话模板的 instruct 模型）
    let finalReply = cleanReply;
    if (finalReply.length > 120 && !/[。！？!?~\n…"）)】]$/.test(finalReply)) {
      const cut = Math.max(
        finalReply.lastIndexOf('。'), finalReply.lastIndexOf('！'), finalReply.lastIndexOf('？'),
        finalReply.lastIndexOf('~'), finalReply.lastIndexOf('\n'), finalReply.lastIndexOf('”')
      );
      if (cut > 20) {
        console.log('[榴莲AI] 回复被生成上限截断，退回最近句读');
        finalReply = finalReply.substring(0, cut + 1).trim();
      }
    }
    if (!finalReply) {
      console.log('[榴莲AI] 回复清理后为空，不发送');
      chatState.markSilent(e);
      return false;
    }
    console.log('[榴莲AI] 准备回复:', finalReply.substring(0, 50) + '...');
    // 使用分段回复
    await AIManager.splitReply(e, finalReply);
    console.log('[榴莲AI] 回复发送成功');
    // 真实回复：重置退避 + 记入额度反馈 + 触发后台摘要
    chatState.markReplied(e);
    chatState.maybeSummarize(e);
    return true;
  } catch (error) {
    console.error('[榴莲AI] 处理失败:', error);
  } finally {
    generatingChats.delete(chatId);
  }
  return false;
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