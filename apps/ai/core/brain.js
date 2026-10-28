import config from '#liulian.config'
import * as chatState from '#liulian.chatState'
import { chat as cloudChat, getBrainCfg } from './cloudBrainClient.js'

// 大脑适配器层：门禁/决策/单飞锁/清理/分条发送是 ai.js 的通用链路，
// "怎么拿到回复"按 brain.mode 在这里分流，接入方式换成什么都不影响后面
// 统一口径：ask(e, msg) → { reply } | { silent:true }

function chatIdOf (e) {
  return e.group_id ? `g${e.group_id}` : `p${e.user_id}`
}

// force：插件端已知的强制场景（私聊/@bot/叫触发名），后端跳过硬规则直接接话
function buildForce (e, messageContent) {
  return !e.group_id ||
    (Array.isArray(e.message) && e.message.some(m => m.type === 'at' && String(m.qq) === String(e.self_id))) ||
    (config.ai?.triggers?.names || []).some(n => n && messageContent.includes(n))
}

// cloud 适配器：记忆/人设/prompt/模型全在云端，插件只带结构化消息
async function askCloud (e, { messageContent, messageType, imageUrl }) {
  const { context, summary } = chatState.buildContextPayload(e)
  const r = await cloudChat({
    chatId: chatIdOf(e),
    force: buildForce(e, messageContent),
    personaId: getBrainCfg().personaId,
    replyTo: { userId: String(e.user_id), senderName: (e.sender?.card || e.sender?.nickname || '').slice(0, 12) },
    message: { type: messageType, text: messageContent, imageUrl: imageUrl || undefined },
    context, summary
  })
  if (r.silent || !r.reply) return { silent: true }
  return { reply: String(r.reply) }
}

// local 适配器：本地 ollama 模型，含目录复读兜底与取阅重试等本地特有行为
// 静默出口统一走 silentExit：日志带上当时的 reply 状态，未接话死因不再无据可查
function silentExit (where, reply) {
  console.log(`[榴莲AI] local 适配器静默[${where}] reply:`, JSON.stringify(reply ?? null).substring(0, 80))
  return { silent: true }
}

async function askLocal (e, { messageContent, messageType, imageUrl, contextText }) {
  const { AIManager } = await import('#liulian.ai')
  let reply = await AIManager.generalChat(messageContent, messageType, e.user_id?.toString(), imageUrl, contextText || null)
  if (!reply) return silentExit('generalChat空', reply)

  // 目录复读检测：整标题复述或单行复述（"#6 名字: 原话"）都是把记录当正文——
  // 去掉上下文重试一次，仍复读则静默
  const isEcho = (s) => /【近期群聊记录/.test(s) || /^\s*#\d+\s+\S+[:：]/m.test(s)
  if (isEcho(String(reply))) {
    console.log('[榴莲AI] 检测到目录复读，去掉上下文重试')
    reply = await AIManager.generalChat(messageContent, messageType, e.user_id?.toString(), imageUrl, null)
    if (!reply || isEcho(String(reply))) return silentExit('复读重试', reply)
  }

  // 取阅：模型要求查看某条原文时，补拉一次再给一次正式回复机会（最多一轮）
  // [查看 #3] 和 [查看 3]（漏写#）都认——弱模型格式记不全，认内容不认写法
  const lookMatch = String(reply).match(/^\[?查看\s*#?(\d+)\]?$/)
  if (lookMatch) {
    console.log('[榴莲AI] 模型要求查看消息 #' + lookMatch[1])
    const content = await chatState.fetchMsgContent(chatIdOf(e), lookMatch[1])
    if (content) {
      reply = await AIManager.generalChat(messageContent, messageType, e.user_id?.toString(), imageUrl,
        `${contextText ? contextText + '\n\n' : ''}【你要求查看的原文】\n${content}\n（已查看，现在必须给出正式回复）`)
    }
  }
  if (!reply) return silentExit('取阅后空', reply)
  return { reply: String(reply) }
}

export async function askBrain (e, msg) {
  const adapter = getBrainCfg().mode === 'cloud' ? askCloud : askLocal
  return adapter(e, msg)
}
