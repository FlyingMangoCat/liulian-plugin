// 适配V3 Yunzai，将index.js移至app/index.js
// 本次升级参考miao-plugin，兼容V2以及V3云崽，感谢喵喵插件贡献 

import { isV3 } from './components/Changelog.js'
import Data from './components/Data.js'
import config from './model/config/config.js'
import chalk from 'chalk'

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

logger.info(`~~~~~~~~~~~~~~~~~=^･ｪ･^=~~~~~~~~~~~~~~~~~`)
logger.info(`~\t${chalk.yellow('欢迎使用' + currentplugininfo.pluginname + '插件')}`)
logger.info(`~\t${chalk.green('版本')}\t${chalk.blue(currentplugininfo.version)}`)
logger.info(`~\t${chalk.green('作者')}\t${chalk.greenBright(currentplugininfo.author)}`)
logger.info(`~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`)

console.log(`~\t${chalk.green('欢迎使用榴莲插件~')}`);
console.log(`榴莲插件0.0.6初始化~`);

