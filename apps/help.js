import fs from "fs";
import lodash from 'lodash';
import { Cfg, Common } from '../components/index.js';
import {
	currentVersion,
	changelogs
} from "../components/Changelog.js";

const _path = process.cwd();
const path_ = `/plugins/liulian-plugin/resources/common/layout/`;
const helpPath = `${_path}/plugins/liulian-plugin/resources/help`;

export async function help (e, { render }) {
  if (!/榴莲/.test(e.msg) && !Cfg.get('sys.help', false)) {
    return false
  }

  let custom = {}; let help = {}
  if (fs.existsSync(`${helpPath}/help-cfg.js`)) {
    help = await import(`file://${helpPath}/help-cfg.js?version=${new Date().getTime()}`)
  } else if (fs.existsSync(`${helpPath}/help-list.js`)) {
    help = await import(`file://${helpPath}/help-list.js?version=${new Date().getTime()}`)
  }

  // 兼容一下旧字段
  if (lodash.isArray(help.helpCfg)) {
    custom = {
      helpList: help.helpCfg,
      helpCfg: {}
    }
  } else {
    custom = help
  }

  let def = await import(`file://${helpPath}/help-cfg_default.js?version=${new Date().getTime()}`)

  let helpCfg = lodash.defaults(custom.helpCfg, def.helpCfg)
  let helpList = custom.helpList || def.helpList

  let helpGroup = []

  lodash.forEach(helpList, (group) => {
    if (group.auth && group.auth === 'master' && !e.isMaster) {
      return
    }

    lodash.forEach(group.list, (help) => {
      let icon = help.icon * 1
      if (!icon) {
        help.css = 'display:none'
      } else {
        let x = (icon - 1) % 10; let y = (icon - x - 1) / 10
        help.css = `background-position:-${x * 50}px -${y * 50}px`
      }
    })

    helpGroup.push(group)
  })

  return await Common.render('help/index', {
    helpCfg,
    helpGroup,
    element: 'default'
  }, { e, render, scale: 1.2 })
}

export async function versionInfo (e, { render }) {
  return await Common.render('help/version-info', {
    currentVersion,
    changelogs,
    elem: 'cryo'
  }, { e, render, scale: 1.2 })
}