import Help from './help/help.js'
import { App } from '#liulian'

let app = App.init({
  id: 'help',
  name: '榴莲帮助',
  desc: '榴莲帮助'
})

app.reg({
  help: {
    rule: /^#?(榴莲)?(命令|帮助|菜单|help|说明|功能|指令|使用说明)$/,
    fn: Help.render,
    desc: '【#/帮助】 #/榴莲帮助'
  },
  version: {
    rule: /^#?榴莲版本$/,
    fn: Help.version,
    desc: '【#/帮助】 #/榴莲版本介绍'
  }
})

export default app