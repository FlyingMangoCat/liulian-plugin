// 适配V3 Yunzai，将index.js移至app/index.js
// 本次升级参考miao-plugin，兼容V2以及V3云崽，谢谢喵喵插件贡献 

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

logger.info(`~~~~~~~~~~~=^･ｪ･^=~~~~~~~~~~~`)
logger.info(`~\t${chalk.yellow('欢迎使用' + currentplugininfo.pluginname + '插件')}`)
logger.info(`~\t${chalk.green('版本')}\t${chalk.blue(currentplugininfo.version)}`)
logger.info(`~\t${chalk.green('作者')}\t${chalk.greenBright(currentplugininfo.author)}`)
logger.info(`~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`)

console.log(`Hello World`);
console.log(`~\t${chalk.green('欢迎使用榴莲插件~')}`);
console.log(`芒果猫提示您`);
console.log(`~\t${chalk.red('时刻绷紧防范之弦，谨防新型网络诈骗。')}`);
console.log(`抵制不良游戏，拒绝盗版游戏。
注意自我保护，谨防受骗上当。
适度游戏益脑，沉迷游戏伤身。
合理安排时间，享受健康生活。`);
console.log(`~\t${chalk.greenBright('榴莲插件' + currentplugininfo.version + '初始化~')}`)

