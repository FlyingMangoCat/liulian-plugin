import { isV3 } from './components/Changelog.js'
import { Data } from '#liulian'
import config from './model/config/config.js'
import chalk from 'chalk'
import crypto from 'crypto'

// 先导出所有apps模块，确保插件功能可用
export * from './apps/index.js'

let index = { liulian: {} }
if (isV3) {
  index = await Data.importModule('/plugins/liulian-plugin/adapter', 'index.js')
}

export const liulian = index.liulian || {}

const plugininfo_default = config.getdefault_config('liulian', 'plugininfo')

await redis.set('Yz:liulian:config:pluginname', plugininfo_default.pluginname)
await redis.set('Yz:liulian:config:version', plugininfo_default.version)
await redis.set('Yz:liulian:config:author', plugininfo_default.author)
let currentplugininfo = await config.getcurrentplugininfo()

logger.info(`~~~~~~~~~~~ ^_^ ~~~~~~~~~~~`)
logger.info(`~\t${chalk.yellow('欢迎使用' + currentplugininfo.pluginname + '插件')}`)
logger.info(`~\t${chalk.green('版本：')}\t${chalk.blue(currentplugininfo.version)}`)
logger.info(`~\t${chalk.green('作者：')}${chalk.greenBright(currentplugininfo.author)}`)
logger.info(`~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`)

console.log(`\t${chalk.greenBright('榴莲插件' + currentplugininfo.version + '初始化~')}`)