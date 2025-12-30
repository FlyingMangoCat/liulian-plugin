import { isV3 } from './components/Changelog.js'
import { Data } from '#liulian'
import config from './model/config/config.js'
import chalk from 'chalk'

// 先导出所有apps模块，确保插件功能可用
export * from './apps/index.js'

let index = { liulian: {} }
try {
  if (isV3) {
    index = await Data.importModule('/plugins/liulian-plugin/adapter', 'index.js')
  }
} catch (error) {
  console.error('[榴莲插件] V3适配器加载失败:', error)
}

export const liulian = index.liulian || {}

// 获取默认插件信息
let plugininfo_default
try {
  plugininfo_default = config.getdefault_config('liulian', 'plugininfo')
} catch (error) {
  console.error('[榴莲插件] 配置文件读取失败，使用默认值:', error)
  plugininfo_default = {
    pluginname: '榴莲（Liulian）',
    version: '0.11.4',
    author: '会飞的芒果猫&萧枘'
  }
}

// 增强Redis错误处理，确保插件正常加载
let redisAvailable = false
try {
  if (typeof redis !== 'undefined' && redis) {
    await redis.set('Yz:liulian:config:pluginname', plugininfo_default.pluginname)
    await redis.set('Yz:liulian:config:version', plugininfo_default.version)
    await redis.set('Yz:liulian:config:author', plugininfo_default.author)
    redisAvailable = true
  }
} catch (error) {
  console.error('[榴莲插件] Redis 初始化失败:', error)
}

// 插件加载成功提示
const _pluginInfo = {
  name: plugininfo_default.pluginname,
  version: plugininfo_default.version,
  author: plugininfo_default.author
}

console.log(chalk.cyan(`\n====================`))
console.log(chalk.cyan(`${_pluginInfo.name} v${_pluginInfo.version}`))
console.log(chalk.cyan(`作者: ${_pluginInfo.author}`))
console.log(chalk.cyan(`====================\n`))

if (redisAvailable) {
  console.log(chalk.green('[榴莲插件] Redis 连接成功'))
} else {
  console.log(chalk.yellow('[榴莲插件] Redis 连接失败，部分功能可能受限'))
}

// 导出插件信息
export const pluginInfo = _pluginInfo