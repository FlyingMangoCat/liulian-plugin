import { isV3 } from './components/Changelog.js'
import Data from './components/Data.js'
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
    version: '0.11.1',
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
  console.error('[榴莲插件] Redis不可用，将使用本地配置:', error)
  redisAvailable = false
}

// 获取当前插件信息
let currentplugininfo
try {
  if (redisAvailable) {
    currentplugininfo = await config.getcurrentplugininfo()
  } else {
    // 如果Redis不可用，使用默认配置
    currentplugininfo = plugininfo_default
  }
} catch (error) {
  console.error('[榴莲插件] 获取插件信息失败，使用默认值:', error)
  currentplugininfo = plugininfo_default
}

// 确保所有必要的字段都存在
currentplugininfo = {
  pluginname: currentplugininfo.pluginname || plugininfo_default.pluginname,
  version: currentplugininfo.version || plugininfo_default.version,
  author: currentplugininfo.author || plugininfo_default.author,
  qq: currentplugininfo.qq || plugininfo_default.qq
}

// 安全的日志输出
try {
  if (typeof logger !== 'undefined' && logger) {
    logger.info(`~~~~~~~~~~~ ^_^ ~~~~~~~~~~~`)
    logger.info(`~\t${chalk.yellow('欢迎使用' + currentplugininfo.pluginname + '插件')}`)
    logger.info(`~\t${chalk.green('版本：')}\t${chalk.blue(currentplugininfo.version)}`)
    logger.info(`~\t${chalk.green('作者：')}${chalk.greenBright(currentplugininfo.author)}`)
    logger.info(`~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`)
  }
} catch (error) {
  console.error('[榴莲插件] 日志输出失败:', error)
}

console.log(`\t${chalk.greenBright('榴莲插件' + currentplugininfo.version + '初始化完成')}`)
console.log(`\t${chalk.yellow('Redis状态：')}${redisAvailable ? chalk.green('可用') : chalk.red('不可用（使用本地配置）')}`)
