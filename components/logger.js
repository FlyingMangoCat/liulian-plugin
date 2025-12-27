/**
 * 统一的日志工具
 * 提供统一的日志接口和备用机制
 */

// 初始化logger，提供备用机制
const logger = global.logger || global.Bot?.logger || {}

// 确保所有日志方法都有备用机制
if (!logger.mark) logger.mark = console.log
if (!logger.error) logger.error = console.error  
if (!logger.debug) logger.debug = console.debug
if (!logger.info) logger.info = console.info
if (!logger.warn) logger.warn = console.warn
if (!logger.trace) logger.trace = console.trace

// 添加一些有用的工具方法
logger.green = logger.green || ((t) => t)

export { logger }