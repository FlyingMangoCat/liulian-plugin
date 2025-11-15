import fs from "fs";
import lodash from 'lodash';
import { Cfg, Common } from '../components/index.js';
import {
	currentVersion,
	changelogs
} from "../components/Changelog.js";

const _path = process.cwd();
const helpPath = `${_path}/plugins/liulian-plugin/resources/help`;

/**
 * 显示帮助信息
 * @param {Object} e - 事件对象
 * @param {Object} render - 渲染对象
 * @returns {Promise<boolean|*|void>}
 */
export async function help(e, { render }) {
  try {
    // 检查是否包含"榴莲"关键词或帮助功能是否开启
    if (!/榴莲/.test(e.msg) && !Cfg.get('sys.help', false)) {
      return false;
    }

    let custom = {};
    let help = {};

    // 尝试导入自定义帮助配置
    if (fs.existsSync(`${helpPath}/help-cfg.js`)) {
      help = await import(`file://${helpPath}/help-cfg.js?version=${new Date().getTime()}`);
    } else if (fs.existsSync(`${helpPath}/help-list.js`)) {
      help = await import(`file://${helpPath}/help-list.js?version=${new Date().getTime()}`);
    }

    // 兼容旧字段
    if (lodash.isArray(help.helpCfg)) {
      custom = {
        helpList: help.helpCfg,
        helpCfg: {}
      };
    } else {
      custom = help;
    }

    // 导入默认配置
    const def = await import(`file://${helpPath}/help-cfg_default.js?version=${new Date().getTime()}`);

    // 合并配置
    const helpCfg = lodash.defaults(custom.helpCfg, def.helpCfg);
    const helpList = custom.helpList || def.helpList;
    const helpGroup = [];

    // 处理帮助列表，过滤权限和设置图标样式
    lodash.forEach(helpList, (group) => {
      // 检查权限
      if (group.auth && group.auth === 'master' && !e.isMaster) {
        return;
      }

      // 设置图标样式
      lodash.forEach(group.list, (helpItem) => {
        const icon = helpItem.icon * 1;
        if (!icon) {
          helpItem.css = 'display:none';
        } else {
          const x = (icon - 1) % 10;
          const y = (icon - x - 1) / 10;
          helpItem.css = `background-position:-${x * 50}px -${y * 50}px`;
        }
      });

      helpGroup.push(group);
    });

    return await Common.render('help/index', {
      helpCfg,
      helpGroup,
      element: 'default'
    }, { e, render, scale: 1.2 });
  } catch (error) {
    console.error('帮助信息渲染失败:', error);
    return false;
  }
}

/**
 * 显示版本信息
 * @param {Object} e - 事件对象
 * @param {Object} render - 渲染对象
 * @returns {Promise<*>}
 */
export async function versionInfo(e, { render }) {
  try {
    return await Common.render('help/version-info', {
      currentVersion,
      changelogs,
      elem: 'cryo'
    }, { e, render, scale: 1.2 });
  } catch (error) {
    console.error('版本信息渲染失败:', error);
    return false;
  }
}