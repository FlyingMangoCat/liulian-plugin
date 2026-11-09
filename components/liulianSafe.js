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

  /** 全部机器账号：兼容 Bot.uins（数组）/ Bot.uin 为数组（上游形态）/ Bot.uin 为单值（Miao 系） */
  get uins() {
    const bot = this.Bot
    if (Array.isArray(bot.uins)) return bot.uins.map(String)
    if (Array.isArray(bot.uin)) return bot.uin.map(String)
    return bot.uin ? [String(bot.uin)] : []
  },

  /** 各账号客户端对象：按账号逐个取；取不到时按"Bot 自身即客户端"兜底，另兼容 uin→client 键值映射 */
  get clients() {
    const bot = this.Bot
    if (!bot || typeof bot !== 'object') return []
    const list = []
    // 只认带连接缓存的客户端对象，避免把空容器、Map 等结构算成账号
    const push = (b) => {
      if (!b || typeof b !== 'object' || !(b.gl || b.fl || b.gml)) return
      if (!list.includes(b)) list.push(b)
    }
    for (const u of this.uins) push(bot[u])
    if (list.length) return list
    push(bot)
    try {
      for (const v of Object.values(bot)) push(v)
    } catch {}
    return list
  },

  // Logger对象 - 每次都获取新的安全logger
  get logger() {
    return getSafeLogger()
  },

  // 安全访问Bot.fl
  get fl() {
    return this.Bot.fl || new Map()
  },

  /** 单账号标识：setCard、redis 键名、发送参数等需要"一个号"的调用点统一取首个 */
  get uin() {
    return this.uins[0] || 0
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