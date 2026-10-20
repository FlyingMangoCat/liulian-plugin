import axios from 'axios'
import config from '#liulian.config'

// 云大脑客户端 —— 对话本体交给自建后端（POST /chat），插件只带结构化消息
// 分工：门禁/决策/组装在插件（见 ai.js），记忆/人设/prompt/模型在后端
// 失败语义：任何失败静默（返回 { silent:true }），不对群/私信发提示（沉浸感），排障靠控制台日志

export function getBrainCfg () {
  const b = config.ai?.brain || {}
  return {
    mode: b.mode || 'local',
    baseUrl: String(b.base_url || '').replace(/\/+$/, ''),
    apiKey: b.api_key || '',
    timeout: Number(b.timeout) || 60000
  }
}

// cloud 模式且配置齐全才算可用；缺配置的 cloud 走未配置分支（ai.js 里主人提示一次）
export function isCloudConfigured () {
  const c = getBrainCfg()
  return c.mode === 'cloud' && Boolean(c.baseUrl && c.apiKey)
}

// POST {base_url}/chat → { reply } | { silent:true }（dryRun/空回复也按未接话处理）
export async function chat (payload) {
  const c = getBrainCfg()
  try {
    const resp = await axios.post(`${c.baseUrl}/chat`, payload, {
      headers: { Authorization: `Bearer ${c.apiKey}`, 'Content-Type': 'application/json' },
      timeout: c.timeout
    })
    const d = resp.data || {}
    if (d.silent) return { silent: true }
    if (typeof d.reply === 'string' && d.reply.trim()) return { reply: d.reply.trim() }
    console.error('[榴莲AI] 云大脑未给出回复:', JSON.stringify(d).slice(0, 200))
    return { silent: true }
  } catch (err) {
    console.error('[榴莲AI] 云大脑调用失败(静默):', err.message)
    return { silent: true }
  }
}
