import {help, versionInfo } from './help/help.js'
import {bilibilihelp, YZversionInfo } from './help/bilibilihelp.js'
import {maphelp, mapnumber } from './help/map.js'
import {pluginhelp } from './help/pluginhelp.js'
import { App } from '#liulian'

let app = App.init({
  id: 'help',
  name: '榴莲帮助',
  desc: '榴莲帮助'
})

app.reg({
  help: {
    rule: /^#?(榴莲)?(命令|帮助|菜单|help|说明|功能|指令|使用说明)$/,
    fn: help,
    desc: '【#/帮助】 #/榴莲帮助'
  },
  version: {
    rule: /^#?榴莲版本$/,
    fn: versionInfo,
    desc: '【#/帮助】 #/榴莲版本介绍'
  },
  bilibilihelp: {
    rule: /^#?(B站|b站|小破站)推送帮助$/,
    fn: bilibilihelp,
    desc: '【#/帮助】 #/推送帮助'
  },
  YZversion: {
    rule: /^#?(猫崽|芒果猫版云崽|芒果崽|芒崽)?版本$/,
    fn: YZversionInfo,
    desc: '【#/帮助】 #/版本介绍'
  },
  maphelp: {
    rule: /^#?(地下地图帮助)$/,
    fn: maphelp,
    desc: '【#/帮助】 #/帮助'
  },
  mapnumber: {
    rule: /^#?原神地下地图编号$/,
    fn: mapnumber,
    desc: '【#/帮助】 #/原神地下地图编号'
  },
  pluginhelp: {
    rule: /^#?(插件管理帮助)$/,
    fn: pluginhelp,
    desc: '【#/帮助】 #/帮助'
  }
})

export default app