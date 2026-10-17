import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import YAML from 'yaml'

/**
 * 榴莲AI配置加载器（#liulian.config 唯一实现）
 *
 * 配置源（唯一真源）：
 * - 默认模板：config/default_config/liulian/ai.yaml（随插件分发，进 git）
 * - 用户配置：config/config/liulian/ai.yaml（首次启动从模板复制生成，用户改这份）
 * - 面板显示与运行时读取同一份，显示与实际永远一致
 *
 * 兼容迁移：旧版配置文件 config/ai.js（不在 git 内）若存在且用户配置未生成，
 * 自动把其中的有效值迁移进用户配置后重命名归档为 ai.js.migrated，避免重复迁移
 */

// 插件根目录：按本模块位置解析（model/ 的上一级），云崽插件模式与中间件模式下均正确
const _pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const defFile = path.join(_pluginRoot, 'config/default_config/liulian/ai.yaml')
const userFile = path.join(_pluginRoot, 'config/config/liulian/ai.yaml')
const legacyFile = path.join(_pluginRoot, 'config/ai.js')
const cfgJsonFile = path.join(_pluginRoot, 'components/cfg.json')
const migrateFlagFile = path.join(_pluginRoot, 'config/config/liulian/.ai-migrated')

/** 深合并：默认值打底，用户值覆盖（对象递归、数组与标量整体覆盖） */
function deepMerge (defaults, user) {
  if (!user || typeof user !== 'object') return structuredClone(defaults)
  const out = Array.isArray(defaults) ? [...defaults] : { ...defaults }
  for (const key of Object.keys(user)) {
    const dv = defaults?.[key]
    const uv = user[key]
    if (uv === undefined) continue
    if (dv && typeof dv === 'object' && !Array.isArray(dv) && uv && typeof uv === 'object' && !Array.isArray(uv)) {
      out[key] = deepMerge(dv, uv)
    } else {
      out[key] = uv
    }
  }
  return out
}

/** 读取单份 yaml，失败返回 null */
function readYaml (file) {
  try {
    if (!fs.existsSync(file)) return null
    return YAML.parse(fs.readFileSync(file, 'utf8'))
  } catch (e) {
    console.error(`[aiConfig] 读取 ${file} 失败: ${e.message}`)
    return null
  }
}

/** 旧 config/ai.js 迁移：把旧 js 配置的有效值写入用户 yaml */
function migrateLegacyConfig () {
  try {
    if (!fs.existsSync(legacyFile)) return null
    const raw = fs.readFileSync(legacyFile, 'utf8')
    const m = raw.match(/export const config = (\{[\s\S]*\});?\s*export default config;/)
    if (!m) return null
    // 旧文件是纯数据对象（无函数/引用），用 Function 构造器安全求值
    const legacy = new Function(`return ${m[1]}`)()
    const legacyAi = legacy?.ai
    if (!legacyAi || typeof legacyAi !== 'object') return null

    // 用户配置已存在时仍合并一次（补齐旧文件里比模板多的键），随后归档防重复
    const existing = readYaml(userFile) || {}
    const merged = deepMerge(existing, { ai: legacyAi })
    fs.mkdirSync(path.dirname(userFile), { recursive: true })
    fs.writeFileSync(userFile, YAML.stringify(merged))
    fs.renameSync(legacyFile, `${legacyFile}.migrated`)
    console.log('[aiConfig] 已将旧 config/ai.js 配置迁移至 config/config/liulian/ai.yaml（原文件归档为 ai.js.migrated）')
    return merged
  } catch (e) {
    console.error(`[aiConfig] 旧配置迁移失败: ${e.message}`)
    return null
  }
}

/** 确保用户配置文件存在（首次启动从模板复制） */
function ensureUserFile () {
  if (fs.existsSync(userFile)) return
  fs.mkdirSync(path.dirname(userFile), { recursive: true })
  if (fs.existsSync(defFile)) {
    fs.copyFileSync(defFile, userFile)
    console.log('[aiConfig] 已生成用户AI配置 config/config/liulian/ai.yaml（默认模板副本，按需修改）')
  }
}

/**
 * 老面板遗留键迁移：历史面板把接口配置写进 components/cfg.json 的
 * sys.ai.*（第一代）与 liulian.ai/api/blacklist/memory.*（第二代），
 * 运行时从未读取过这些键——用户"设置过却没生效"的值 stranded 在这里。
 * 本函数把这些历史值并入用户 ai.yaml（只填空位，不覆盖用户已改的值），
 * 完成后写标记文件，保证幂等（后续清空 yaml 不会被再次回填）
 */
function migrateLegacyCfgJson () {
  try {
    if (fs.existsSync(migrateFlagFile)) return
    fs.mkdirSync(path.dirname(migrateFlagFile), { recursive: true })

    let legacy = null
    try {
      legacy = JSON.parse(fs.readFileSync(cfgJsonFile, 'utf8'))
    } catch {
      legacy = null
    }
    const sAi = legacy?.sys?.ai || {}                       // 第一代面板键
    const lAi = legacy?.liulian?.ai || {}                   // 第二代面板键
    const lApi = legacy?.liulian?.api || {}
    const lBl = legacy?.liulian?.blacklist || {}
    const lMem = legacy?.liulian?.memory || {}

    const toArr = (v) => Array.isArray(v) ? v
      : (typeof v === 'string' && v ? v.split(',').map(s => s.trim()).filter(Boolean) : null)

    const cur = readYaml(userFile) || {}
    const ai = { ...(cur.ai || {}) }
    const api = { ...(ai.api || {}) }
    api.base_url = api.base_url || lApi.endpoint || sAi.endpoint || ''
    api.api_key = api.api_key || lApi.key || sAi.key || ''
    ai.api = api

    // 黑名单：yaml 有值用 yaml，否则历史值（数组或逗号分隔字符串都兼容）
    const bl = { ...(ai.blacklist || {}) }
    if (!(Array.isArray(bl.groups) && bl.groups.length)) {
      bl.groups = toArr(lBl.groups) || toArr(sAi.blacklistGroups) || bl.groups || []
    }
    ai.blacklist = bl

    // 老面板的单值概率/回复长度：yaml 仍是模板默认值时才采纳历史设置
    const pr = { ...(ai.probability || {}) }
    const legacyProb = Number(lAi.probability ?? sAi.probability)
    if (Number.isFinite(legacyProb) && legacyProb > 0 && legacyProb !== 40 && pr.group === 40) {
      pr.group = Math.min(100, Math.max(0, legacyProb))
    }
    ai.probability = pr

    const rp = { ...(ai.reply || {}) }
    const legacyLen = Number(lAi.reply_length ?? sAi.replyLength)
    if (Number.isFinite(legacyLen) && legacyLen > 0 && legacyLen !== 200 && rp.max_length === 200) {
      rp.max_length = Math.min(500, Math.max(50, legacyLen))
    }
    ai.reply = rp

    // 记忆服务开关（第二代面板的 cloudMemory 布尔）→ mode
    if (ai.memory?.mode === 'off' && lMem.cloud === true) {
      ai.memory = { ...ai.memory, mode: 'cloud' }
    }

    // 总开关：历史面板若开过 AI，保持开启（避免升级后"明明开过却关了"）
    const legacyEnabled = lAi.enabled ?? sAi.enabled
    if (ai.enabled === false && legacyEnabled === true) {
      ai.enabled = true
    }

    fs.writeFileSync(userFile, YAML.stringify(deepMerge(readYaml(userFile) || {}, { ai })))
    fs.writeFileSync(migrateFlagFile, String(Date.now()))
    console.log('[aiConfig] 已将历史面板配置（cfg.json 的 sys.ai/liulian.ai 遗留键）并入用户 ai.yaml（仅填空位）')
  } catch (e) {
    console.error(`[aiConfig] 历史面板配置迁移失败: ${e.message}`)
    // 迁移失败不写标记，下次启动重试；但不阻塞模块加载
  }
}

// ---- 模块加载期完成初始化（生成用户配置 → 旧 js 迁移 → 老面板键迁移 → 合并默认值） ----
ensureUserFile()
migrateLegacyConfig()
migrateLegacyCfgJson()

let defaults = readYaml(defFile) || {}
let userCfg = readYaml(userFile) || {}
let merged = deepMerge(defaults, userCfg)

// 热生效：监听用户配置文件变化，改完无需重启（开关类配置本就走指令，不受影响）
try {
  fs.watch(path.dirname(userFile), (event, filename) => {
    if (filename !== 'ai.yaml') return
    const next = readYaml(userFile)
    if (!next) return
    userCfg = next
    merged = deepMerge(defaults, userCfg)
    console.log('[aiConfig] AI配置已重新加载（config/config/liulian/ai.yaml 变更）')
  })
} catch (e) {
  console.warn(`[aiConfig] 配置热监听不可用: ${e.message}`)
}

const aiConfig = {
  /** 与旧 config/ai.js 导出形态一致：顶层取值走 config.ai.xxx */
  get ai () {
    return merged.ai || {}
  }
}

/**
 * 写入 AI 总开关（#榴莲AI设置AI服务 指令用）：改用户 yaml 的 ai.enabled
 * 写入后手动重载一次内存值（不等 watch 触发），下一消息立即按新值门禁
 */
export function setAIEnabled (value) {
  const cur = readYaml(userFile) || {}
  const next = deepMerge(cur, { ai: { enabled: !!value } })
  fs.mkdirSync(path.dirname(userFile), { recursive: true })
  fs.writeFileSync(userFile, YAML.stringify(next))
  userCfg = readYaml(userFile) || userCfg
  merged = deepMerge(defaults, userCfg)
  return merged.ai?.enabled
}

export const config = aiConfig
export default aiConfig
