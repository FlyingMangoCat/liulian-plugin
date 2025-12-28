/**
 * Bot对象安全访问工具
 * 提供统一的Bot对象访问接口和安全机制
 */

// 安全获取logger的函数
const getSafeLogger = () => {
  let logger = global.Bot?.logger || global.logger || console
  
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

// 安全访问Bot的常用属性和方法
const safeBot = {
  // Bot对象本身
  get Bot() {
    return global.Bot || {}
  },
  
  // Logger对象 - 每次都获取新的安全logger
  get logger() {
    return getSafeLogger()
  },
  
  // 安全访问Bot.fl
  get fl() {
    return this.Bot.fl || new Map()
  },
  
  // 安全访问Bot.uin
  get uin() {
    return this.Bot.uin || 0
  },
  
  // 安全访问Bot.nickname
  get nickname() {
    return this.Bot.nickname || 'Bot'
  },
  
  // 安全访问Bot.gl
  get gl() {
    return this.Bot.gl || new Map()
  },
  
  // 安全访问Bot.pickUser
  pickUser(userId) {
    return this.Bot.pickUser?.(userId) || { sendMsg: async () => false }
  },
  
  // 安全访问Bot.pickGroup
  pickGroup(groupId) {
    return this.Bot.pickGroup?.(groupId) || { setCard: async () => false }
  },
  
  // 安全访问Bot.pickMember
  pickMember(groupId, userId) {
    return this.Bot.pickMember?.(groupId, userId) || { sendMsg: async () => false }
  },
  
  // 安全访问Bot.getGroupMemberInfo
  async getGroupMemberInfo(groupId, userId) {
    try {
      return this.Bot.getGroupMemberInfo?.(groupId, userId) || {}
    } catch (e) {
      return {}
    }
  },
  
  // 安全访问Bot.makeForwardMsg
  async makeForwardMsg(msgList, isGroup = false) {
    try {
      return this.Bot.makeForwardMsg?.(msgList, isGroup) || false
    } catch (e) {
      return false
    }
  }
}

export { safeBot }