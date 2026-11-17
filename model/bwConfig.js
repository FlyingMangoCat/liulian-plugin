import fs from 'fs'
import YAML from 'yaml'
import configStore from './config/config.js'

// 黑白名单中间件：apps 不直接读名单配置文件，统一经此查询
// 配置来源：default_config/liulian/bwlist.yaml 模板 → config/config/liulian/bwlist.yaml 用户副本（缺失自动复制）
// 热生效：chokidar 监听用户文件，改动后下一次查询即读新值
const APP = 'liulian'
const NAME = 'bwlist'

// 启动补键（与 aiConfig.js 同款 fillMissing）：模板新增的名单键自动补进用户副本，
// 只补缺失项不动用户已设值；重写文件会丢注释，键值不受影响
function fillMissing (tpl, user) {
  let changed = false
  for (const k of Object.keys(tpl || {})) {
    const u = user[k]
    if (u === undefined) {
      user[k] = tpl[k]
      changed = true
    } else if (
      tpl[k] && typeof tpl[k] === 'object' && !Array.isArray(tpl[k]) &&
      u && typeof u === 'object' && !Array.isArray(u)
    ) {
      if (fillMissing(tpl[k], u)) changed = true
    }
  }
  return changed
}

// 启动时跑一次（幂等：没缺键就不写文件）
try {
  const tpl = configStore.getdefault_config(APP, NAME)
  const userFile = configStore.getFilePath(APP, NAME, 'config')
  if (tpl && fs.existsSync(userFile)) {
    const user = YAML.parse(fs.readFileSync(userFile, 'utf8')) || {}
    if (fillMissing(tpl, user)) {
      fs.writeFileSync(userFile, YAML.stringify(user))
      console.log('[bwConfig] 模板新增键已自动补进用户 bwlist.yaml')
    }
  }
} catch (e) {
  console.error('[bwConfig] 模板补齐失败(不影响运行):', e.message)
}

function cfg () {
  return configStore.getconfig(APP, NAME) || {}
}

const toStr = v => String(v)

// 群黑名单：命中则该功能在此群不触发
export function isGroupBlack (feature, groupId) {
  const list = cfg()?.black?.groups?.[feature] || []
  return list.map(toStr).includes(toStr(groupId))
}

// 用户黑名单：命中则该功能对此用户不触发
export function isUserBlack (feature, userId) {
  const list = cfg()?.black?.users?.[feature] || []
  return list.map(toStr).includes(toStr(userId))
}

// 群白名单：仅名单内的群会启用该功能；名单填 0 = 白名单作废，全部群响应
export function isGroupWhite (feature, groupId) {
  const list = cfg()?.white?.groups?.[feature] || []
  if (list.length > 0 && list.map(toStr).includes('0')) return true
  return list.length > 0 && list.map(toStr).includes(toStr(groupId))
}

// 注册用户文件热监听（内部初始化，无需外部调用）
try {
  const userFile = configStore.getFilePath(APP, NAME, 'config')
  configStore.watch(userFile, APP, NAME, 'config')
} catch (err) {
  console.error('[bwConfig] 热监听注册失败(不影响查询):', err.message)
}
