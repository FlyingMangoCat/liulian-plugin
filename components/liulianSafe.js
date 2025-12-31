/**
 * 榴莲插件 - Bot对象安全访问工具
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
const liulianSafe = {
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
    const group = this.Bot.pickGroup?.(groupId)

    if (!group) {
      // 返回带有 setCard 方法的模拟对象
      return {
        setCard: async (userId, cardName) => {
          console.warn(`[liulianSafe] pickGroup(${groupId}) 返回空对象，setCard 调用失败`)
          return false
        }
      }
    }

    // 检查 group 对象是否有 setCard 方法
    if (typeof group.setCard === 'function') {
      return group
    }

    // 如果没有 setCard 方法，直接在对象上添加
    console.warn(`[liulianSafe] pickGroup(${groupId}) 返回的对象没有 setCard 方法，正在添加`)
    group.setCard = async (userId, cardName) => {
      try {
        // 尝试使用 Bot 的其他方法
        if (typeof this.Bot.setGroupCard === 'function') {
          console.log(`[liulianSafe] 使用 Bot.setGroupCard(${groupId}, ${userId}, ${cardName})`)
          return await this.Bot.setGroupCard(groupId, userId, cardName)
        }
        // 尝试使用 Bot.pickMember 获取成员对象
        const member = this.Bot.pickMember?.(groupId, userId)
        if (member && typeof member.setCard === 'function') {
          console.log(`[liulianSafe] 使用 pickMember(${groupId}, ${userId}).setCard(${cardName})`)
          return await member.setCard(cardName)
        }
        console.error(`[liulianSafe] 无法找到可用的 setCard 方法`)
        return false
      } catch (e) {
        console.error(`[liulianSafe] setCard 调用失败:`, e)
        return false
      }
    }

    return group
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

export { liulianSafe }