import os from 'os';
import schedule from "node-schedule";
import { Cfg, liulianSafe } from '#liulian'

let botname = ''//这里改成bot的名字

// 带超时的 Promise 包装函数
function withTimeout(promise, timeoutMs = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('操作超时')), timeoutMs)
    )
  ])
}

// 更新单个群的名片
async function updateGroupCard(groupId, cardName) {
  try {
    const groupObj = liulianSafe.pickGroup(groupId);

    // 尝试多种方式调用 setCard
    let result = false;
    if (typeof groupObj.setCard === 'function') {
      result = await withTimeout(groupObj.setCard(liulianSafe.uin, cardName), 3000)
    } else if (global.Bot?.setGroupCard && typeof global.Bot.setGroupCard === 'function') {
      result = await withTimeout(global.Bot.setGroupCard(groupId, liulianSafe.uin, cardName), 3000)
    }

    return { groupId, success: !!result }
  } catch (e) {
    console.error(`[更新群名片] 群 ${groupId} 更新失败:`, e.message)
    return { groupId, success: false, error: e.message }
  }
}

// 定时任务 - 暂时禁用，避免影响其他指令
// schedule.scheduleJob("0 0/10 * * * ?", async () =>{
//   try {
//     if (!Cfg.get('sys.qmp', false)) {
//       return false
//     }
//
//     const totalMem = os.totalmem();
//     const freeMen = os.freemem();
//     let persent = (totalMem - freeMen) / totalMem * 100;
//
//     console.log(`[更新群名片] 定时任务开始，系统占用: ${persent.toFixed(2)}%`)
//
//     const cardName = `${botname || liulianSafe.nickname}｜系统占用${persent.toFixed(2)}%`
//     const groups = Array.from(liulianSafe.gl.keys())
//
//     if (groups.length === 0) {
//       console.log(`[更新群名片] 没有群需要更新`)
//       return true
//     }
//
//     console.log(`[更新群名片] 准备更新 ${groups.length} 个群的名片`)
//
//     // 使用 Promise.allSettled 并发执行，避免阻塞
//     const promises = groups.map(groupId => updateGroupCard(groupId, cardName))
//     const results = await Promise.allSettled(promises)
//
//     const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length
//     const failCount = results.length - successCount
//
//     console.log(`[更新群名片] 定时任务完成，成功: ${successCount}, 失败: ${failCount}`)
//     return true
//   } catch (e) {
//     console.error(`[更新群名片] 定时任务执行失败:`, e)
//     return false
//   }
// })

export const rule = {
  qmp : {
    reg : "^更新群名片",
    priority: 10,
    describe : "",
  }
}

export async function qmp (e){
  try {
    if (!/榴莲/.test(e.msg) && !Cfg.get('sys.qmp', false))  {
      e.reply (`该功能已被关闭，请通过榴莲设置开启！`)
      return false
    }

    const totalMem = os.totalmem();
    const freeMen = os.freemem();
    let persent = (totalMem - freeMen) / totalMem * 100;

    console.log(`[更新群名片] 手动触发，系统占用: ${persent.toFixed(2)}%`)

    const cardName = `${botname}|系统占用${persent.toFixed(2)}%`
    const groups = Array.from(liulianSafe.gl.keys())

    if (groups.length === 0) {
      e.reply('没有群需要更新')
      return true
    }

    e.reply(`准备更新 ${groups.length} 个群的名片...`)

    // 使用 Promise.allSettled 并发执行
    const promises = groups.map(groupId => updateGroupCard(groupId, cardName))
    const results = await Promise.allSettled(promises)

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failCount = results.length - successCount

    console.log(`[更新群名片] 完成，成功: ${successCount}, 失败: ${failCount}`)
    e.reply(`更新完成，成功: ${successCount}, 失败: ${failCount}`)
    return true
  } catch (e) {
    console.error(`[更新群名片] 执行失败:`, e)
    e.reply(`更新失败: ${e.message}`)
    return false
  }
}
