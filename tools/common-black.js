
import { pipeline } from 'stream'
import { promisify } from 'util'
import fetch from 'node-fetch'
import fs from 'node:fs'
import path from 'node:path'
import { logger, safeBot } from '../components/index.js'

/**
 * 发送私聊消息，仅给好友发送
 * @param user_id QQ号
 * @param msg 消息内容
 */
async function relpyPrivate (userId, msg) {
  userId = Number(userId)

  let friend = safeBot.fl.get(userId)
  if (friend) {
    logger.mark(`发送好友消息[${friend.nickname}](${userId})`)
    return await safeBot.pickUser(userId).sendMsg(msg).catch((err) => {
      logger.mark(err)
    })
  }
}

/**
 * 休眠函数
 * @param ms 毫秒数
 */
function sleep (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 下载保存文件
 * @param fileUrl 文件下载地址
 * @param savePath 文件保存路径
 */
async function downFile (fileUrl, savePath,param = {}) {
  try {
    mkdirs(path.dirname(savePath))
    logger.debug(`[下载文件] ${fileUrl}`)
    const response = await fetch(fileUrl,param)
    const streamPipeline = promisify(pipeline)
    await streamPipeline(response.body, fs.createWriteStream(savePath))
    return true
  } catch (err) {
    logger.error(`下载文件错误：${err}`)
    return false
  }
}

function mkdirs (dirname) {
  if (fs.existsSync(dirname)) {
    return true
  } else {
    if (mkdirs(path.dirname(dirname))) {
      fs.mkdirSync(dirname)
      return true
    }
  }
}

/**
 * 制作转发消息
 * @param msg 消息数组
 * @param dec 转发描述内容
 */
async function makeForwardMsg (e, msg = [], dec = '') {
  let nickname = safeBot.nickname
  if (e.isGroup) {
    let info = await safeBot.getGroupMemberInfo(e.group_id, safeBot.uin)
    nickname = info.card || info.nickname
  }
  let userInfo = {
    user_id: safeBot.uin,
    nickname
  }

  let forwardMsg = []
  msg.forEach(v => {
    forwardMsg.push({
      ...userInfo,
      message: v
    })
  })

  /** 制作转发消息内容 */
  if (e.isGroup) {
    forwardMsg = await e.group.makeForwardMsg(forwardMsg)
  } else if (e.friend) {
    forwardMsg = await e.friend.makeForwardMsg(forwardMsg)
  } else {
    return false
  }

  if (dec) {
    /** 处理转发消息描述 */
    forwardMsg.data = forwardMsg.data
      .replace(/\n/g, '')
      .replace(/<title color="#777777" size="26">(.+?)<\/title>/g, '___')
      .replace(/___+/, `<title color="#777777" size="26">${dec}</title>`)
  }

  return forwardMsg
}

export default { sleep, relpyPrivate, downFile, makeForwardMsg }
