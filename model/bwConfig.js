import configStore from './config/config.js'

// 黑白名单中间件：apps 不直接读名单配置文件，统一经此查询
// 配置来源：default_config/liulian/bwlist.yaml 模板 → config/config/liulian/bwlist.yaml 用户副本
// 复制策略与本体 initCfg 同款：仅用户副本缺失时整体复制，复制后不再改写（无补键）
// 热生效：chokidar 监听用户文件，改动后下一次查询即读新值
const APP = 'liulian'
const NAME = 'bwlist'

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
