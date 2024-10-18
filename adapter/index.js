import plugin from '../../../lib/plugins/plugin.js'
import * as LiuLian from '../apps/index.js'
import { render } from './render.js'

export class liulian extends plugin {
  constructor () {
    let rule = {
      reg: '.+',
      fnc: 'dispatch'
    }
    super({
      name: 'liulian-plugin',
      desc: '榴莲插件',
      event: 'message',
      priority: 50,
      rule: [rule]
    })
    Object.defineProperty(rule, 'log', {
      get: () => !!this.isDispatch
    })
  }

  async dispatch (e) {
    let msg = e.original_msg || 'not original_msg'
    if (!msg) {
      return false
    }
    msg = msg.replace('#', '').trim()
    msg = '#' + msg
    for (let fn in LiuLian.rule) {
      let cfg = LiuLian.rule[fn]
      if (LiuLian[fn] && new RegExp(cfg.reg).test(msg)) {
        let ret = await LiuLian[fn](e, {
          render
        })
        if (ret === true) {
          this.isDispatch = true
          return true
        }
      }
    }
    return false
  }
}
