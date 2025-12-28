/**
 * 统一的日志工具
 * 提供统一的日志接口和备用机制
 */

// 初始化logger，提供备用机制
// 确保logger对象始终存在，避免undefined错误
let logger = global.logger || global.Bot?.logger || console

// 首先确保logger对象存在
if (!logger) {
  logger = console
}

// 无论logger是什么，都确保所有方法存在
if (!logger.mark) logger.mark = console.log
if (!logger.error) logger.error = console.error  
if (!logger.debug) logger.debug = console.debug
if (!logger.info) logger.info = console.info
if (!logger.warn) logger.warn = console.warn
if (!logger.trace) logger.trace = console.trace

// 添加一些有用的工具方法
if (!logger.green) {
  // 如果logger对象是只读的，创建一个新的方法引用
  try {
    logger.green = (t) => t
  } catch (e) {
    // 如果无法赋值，使用全局变量存储
    global.loggerGreen = (t) => t
    logger.green = global.loggerGreen
  }
}

export { logger }