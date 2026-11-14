import fs from 'fs'
import path from 'path'
import config from '#liulian.config'
import { Cfg } from '#liulian'

// 匿名遥测客户端 —— 对接规格：.atomcode/客户端对接-榴莲插件遥测.md（v1.1）
// 口径：每日一次、随机错峰、响应恒成功（不可作为送达依据）、整包白名单校验在服务端
// 开关：sys.telemetry（默认开，#榴莲设置遥测 开启/关闭）；关闭时分钟级 tick 空转，不注册不发送

const BASE = 'https://api-forum.liulian-ai.top/api/telemetry'
const statePath = path.resolve(process.cwd(), '.liulian-telemetry.json')
const fwPkgPath = path.resolve(process.cwd(), 'package.json')
const pluginPkgPath = path.resolve(process.cwd(), 'plugins/liulian-plugin/package.json')
const resPlusPath = path.resolve(process.cwd(), 'plugins/liulian-plugin/resources/liulian-res-plus/')

let state = null          // { token, offset, lastSent }
let nextRegisterAt = 0    // register 失败后的重试门槛（429 → 次日，其余 → 1 小时）

function enabled () {
  return !!Cfg.get('sys.telemetry', true)
}

function loadState () {
  if (state) return state
  try {
    state = JSON.parse(fs.readFileSync(statePath, 'utf8')) || null
  } catch { state = null }
  return state
}

function saveState () {
  try { fs.writeFileSync(statePath, JSON.stringify(state)) } catch { /* 本地持久化失败静默，下轮再试 */ }
}

// 插件版本原样字符串（0.18.6），取自插件自身 package.json
function pluginVersion () {
  try {
    const v = String(JSON.parse(fs.readFileSync(pluginPkgPath, 'utf8')).version || '')
    return /^v?\d+\.\d+\.\d+$/.test(v) ? v.replace(/^v/, '') : '0.0.0'
  } catch { return '0.0.0' }
}

// 框架类型：1=喵版 2=FMC(MangoCat) 3=TRSS 4=其他/未知（读框架根 package.json name）
function detectFramework () {
  try {
    const name = String(JSON.parse(fs.readFileSync(fwPkgPath, 'utf8')).name || '')
    if (/miao/i.test(name)) return 1
    if (/mangocat|fmc/i.test(name)) return 2
    if (/trss/i.test(name)) return 3
    return 4
  } catch { return 4 }
}

// fx 开关数组：顺序 = 后端映射表（0~13），1开0关
function buildFx () {
  const keys = ['sys.help', 'sys.bq', 'sys.dk', 'sys.qmp', 'sys.dw', 'sys.forge', 'sys.xx',
    'sys.jtm', 'sys.qqy', 'sys.shutup', 'sys.aits', 'sys.aiEnabled', 'sys.guessRankHint', 'sys.telemetry']
  return keys.map(k => (Cfg.get(k, false) ? 1 : 0))
}

// mn：1=deepseek-flash（云） 2=本地ollama 0=未归类
function detectModel () {
  return (config.ai?.brain?.mode || 'local') === 'cloud' ? 1 : 2
}

async function register () {
  const resp = await fetch(`${BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pv: pluginVersion() })
  })
  if (resp.status === 429) { // 同 IP 日签发上限：次日再试
    nextRegisterAt = Date.now() + 24 * 3600 * 1000
    return false
  }
  const j = await resp.json().catch(() => null)
  const d = j?.d
  if (!d || !d.token) { // 恒成功口径下 d 缺失 = 暂不可用，1 小时后再试
    nextRegisterAt = Date.now() + 3600 * 1000
    return false
  }
  state = { token: d.token, offset: Number(d.offset) || 0, lastSent: state?.lastSent || '' }
  saveState()
  console.log('[榴莲遥测] 已注册，每日上报偏移', state.offset, '秒')
  return true
}

async function heartbeat () {
  const payload = {
    tk: state.token,
    pv: pluginVersion(),
    fw: detectFramework(),
    bm: (config.ai?.brain?.mode || 'local') === 'cloud' ? 2 : 1,
    fx: buildFx(),
    rp: fs.existsSync(resPlusPath) ? 1 : 0,
    mn: detectModel(),
    ts: Date.now()
  }
  await fetch(`${BASE}/hb`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(() => {})
  // 恒成功口径：无论响应如何都视为已上报（服务端静默丢弃非法包），缺一天对趋势无影响
  state.lastSent = new Date().toISOString().slice(0, 10)
  saveState()
}

async function tick () {
  try {
    if (!enabled()) return
    if (typeof fetch !== 'function') return // Node <18 无全局 fetch，静默停用
    const today = new Date().toISOString().slice(0, 10)
    loadState()
    if (state?.lastSent === today) return

    if (!state?.token) {
      if (Date.now() < nextRegisterAt) return
      const ok = await register()
      if (ok) await heartbeat() // 注册成功立即补一次当日心跳
      return
    }

    // 错峰窗口：当日秒数与 offset 对齐 ±60 秒（跨零点取模），命中且今日未报 → 上报
    const now = new Date()
    const secOfDay = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
    const diff = (secOfDay - state.offset + 86400) % 86400
    if (diff <= 60) await heartbeat()
  } catch (err) {
    console.error('[榴莲遥测] 处理失败:', err.message)
  }
}

// 分钟级 tick 自举：开关现读、注册与错峰窗口都在 tick 内判定
setInterval(tick, 60 * 1000).unref?.()
