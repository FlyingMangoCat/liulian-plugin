/**
 * 统一的日志工具
 * 提供统一的日志接口和备用机制
 */

// 动态获取logger的函数
const getLogger = () => {
  let logger = global.logger || global.Bot?.logger || console
  
  // 确保logger对象存在
  if (!logger) {
    logger = console
  }
  
  // 确保所有方法存在
  if (!logger.mark) logger.mark = console.log
  if (!logger.error) logger.error = console.error  
  if (!logger.debug) logger.debug = console.debug
  if (!logger.info) logger.info = console.info
  if (!logger.warn) logger.warn = console.warn
  if (!logger.trace) logger.trace = console.trace
  
  // 添加green方法
  if (!logger.green) logger.green = (t) => t
  
  return logger
}

// 创建动态logger对象
const logger = new Proxy({}, {
  get(target, prop) {
    const currentLogger = getLogger()
    return currentLogger[prop] || console[prop] || (() => {})
  }
})

export { logger }