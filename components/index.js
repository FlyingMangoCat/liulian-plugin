/*
* 榴莲插件 - 公共组件模块
* 统一导出所有公共组件，提供插件的基础功能支持
* 包括数据管理、通用工具、配置管理、版本控制、日志记录等
* */

// 数据处理组件
import Data from './Data.js'
// 通用工具组件
import Common from './Common.js'
// 配置管理组件
import Cfg from './Cfg.js'
// 数据处理组件2
import Data2 from './Data2.js'
// 版本管理组件
import Version from './Version.js'
// Cookie制作工具
import { getBLsid, getUuid } from './ckMaker.js'
// 日志记录工具
import { logger } from './logger.js'

// 统一导出所有公共组件
export { 
  Cfg,        // 配置管理
  Common,     // 通用工具
  Data,       // 数据处理
  Data2,      // 数据处理2
  Version,    // 版本管理
  getBLsid,   // 获取B站Session ID
  getUuid,    // 获取UUID
  logger      // 日志记录
}
