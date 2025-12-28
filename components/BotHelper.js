/**
 * Bot对象安全访问工具
 * 提供统一的Bot对象访问接口和安全机制
 */

// 安全获取Bot对象
const Bot = global.Bot || {}

// 安全获取logger对象，优先使用Bot.logger
let BotLogger = Bot.logger || global.logger || console

// 确保logger对象存在
if (!BotLogger) {
  BotLogger = console
}

// 无论logger是什么，都确保所有方法存在
if (!BotLogger.mark) BotLogger.mark = console.log
if (!BotLogger.error) BotLogger.error = console.error
if (!BotLogger.debug) BotLogger.debug = console.debug
if (!BotLogger.info) BotLogger.info = console.info
if (!BotLogger.warn) BotLogger.warn = console.warn
if (!BotLogger.trace) BotLogger.trace = console.trace

// 安全访问Bot的常用属性和方法
const safeBot = {
  // Bot对象本身
  Bot,
  
  // Logger对象 - 使用getter确保始终获取最新的安全logger
  get logger() {
    return BotLogger
  },
  
  // 安全访问Bot.fl
  get fl() {
    return Bot.fl || new Map()
  },
  
  // 安全访问Bot.uin
  get uin() {
    return Bot.uin || 0
  },
  
  // 安全访问Bot.nickname
  get nickname() {
    return Bot.nickname || 'Bot'
  },
  
  // 安全访问Bot.gl
  get gl() {
    return Bot.gl || new Map()
  },
  
  // 安全访问Bot.pickUser
  pickUser(userId) {
    return Bot.pickUser?.(userId) || { sendMsg: async () => false }
  },
  
  // 安全访问Bot.pickGroup
  pickGroup(groupId) {
    return Bot.pickGroup?.(groupId) || { setCard: async () => false }
  },
  
  // 安全访问Bot.pickMember
  pickMember(groupId, userId) {
    return Bot.pickMember?.(groupId, userId) || { sendMsg: async () => false }
  },
  
  // 安全访问Bot.getGroupMemberInfo
  async getGroupMemberInfo(groupId, userId) {
    try {
      return Bot.getGroupMemberInfo?.(groupId, userId) || {}
    } catch (e) {
      return {}
    }
  },
  
  // 安全访问Bot.makeForwardMsg
  async makeForwardMsg(msgList, isGroup = false) {
    try {
      return Bot.makeForwardMsg?.(msgList, isGroup) || false
    } catch (e) {
      return false
    }
  }
}

export { safeBot }