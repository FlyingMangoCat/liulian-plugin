import os from 'os';
import schedule from "node-schedule";
import { Cfg, liulianSafe } from '#liulian'

let botname = ''//这里改成bot的名字


schedule.scheduleJob("0 0/10 * * * ?", async () =>{
    try {
        if (!Cfg.get('sys.qmp', false)) {
            return false
        }
        const totalMem = os.totalmem();
        const freeMen =os.freemem();
        let persent = (totalMem-freeMen)/totalMem*100;
        console.log(`[更新群名片] 系统占用: ${persent.toFixed(2)}%`);

        const cardName = `${botname || liulianSafe.nickname}｜系统占用${persent.toFixed(2)}%`;
        console.log(`[更新群名片] 准备更新名片: ${cardName}`);
        console.log(`[更新群名片] 群列表:`, Array.from(liulianSafe.gl.keys()));

        let successCount = 0;
        let failCount = 0;

        for(let group of liulianSafe.gl){
            const groupId = group[0];
            try {
                console.log(`[更新群名片] 正在更新群 ${groupId} 的名片...`);
                const groupObj = liulianSafe.pickGroup(groupId);
                console.log(`[更新群名片] pickGroup 返回:`, typeof groupObj, groupObj?.constructor?.name);

                // 尝试多种方式调用 setCard
                let result = false;
                if (typeof groupObj.setCard === 'function') {
                    console.log(`[更新群名片] 使用 group.setCard(${liulianSafe.uin}, ${cardName})`);
                    result = await groupObj.setCard(liulianSafe.uin, cardName);
                } else if (global.Bot?.setGroupCard && typeof global.Bot.setGroupCard === 'function') {
                    console.log(`[更新群名片] 使用 Bot.setGroupCard(${groupId}, ${liulianSafe.uin}, ${cardName})`);
                    result = await global.Bot.setGroupCard(groupId, liulianSafe.uin, cardName);
                } else {
                    console.error(`[更新群名片] 群 ${groupId} 没有 setCard 方法，Bot 也没有 setGroupCard 方法`);
                }

                if (result) {
                    console.log(`[更新群名片] 群 ${groupId} 名片更新成功`);
                    successCount++;
                } else {
                    console.warn(`[更新群名片] 群 ${groupId} 名片更新失败`);
                    failCount++;
                }
            } catch (e) {
                console.error(`[更新群名片] 群 ${groupId} 更新失败:`, e);
                failCount++;
            }
        }

        console.log(`[更新群名片] 完成，成功: ${successCount}, 失败: ${failCount}`);
        return true;
    } catch (e) {
        console.error(`[更新群名片] 定时任务执行失败:`, e);
        return false;
    }
})


export const rule = {
    qmp : {
        reg : "^更新群名片",
        priority: 10,
        describe : "",
    }
};

export async function qmp (e){
    try {
        if (!/榴莲/.test(e.msg) && !Cfg.get('sys.qmp', false))  {
            e.reply (`该功能已被关闭，请通过榴莲设置开启！`);
            return false
        }

        const totalMem = os.totalmem();
        const freeMen =os.freemem();
        let persent = (totalMem-freeMen)/totalMem*100;

        console.log(`[更新群名片] 手动触发，系统占用: ${persent.toFixed(2)}%`);

        const cardName = `${botname}|系统占用${persent.toFixed(2)}%`;
        console.log(`[更新群名片] 准备更新名片: ${cardName}`);

        let successCount = 0;
        let failCount = 0;

        for(let group of liulianSafe.gl){
            const groupId = group[0];
            try {
                console.log(`[更新群名片] 正在更新群 ${groupId} 的名片...`);
                const groupObj = liulianSafe.pickGroup(groupId);

                // 尝试多种方式调用 setCard
                let result = false;
                if (typeof groupObj.setCard === 'function') {
                    result = await groupObj.setCard(liulianSafe.uin, cardName);
                } else if (global.Bot?.setGroupCard && typeof global.Bot.setGroupCard === 'function') {
                    result = await global.Bot.setGroupCard(groupId, liulianSafe.uin, cardName);
                } else {
                    console.error(`[更新群名片] 群 ${groupId} 没有 setCard 方法`);
                }

                if (result) {
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (e) {
                console.error(`[更新群名片] 群 ${groupId} 更新失败:`, e);
                failCount++;
            }
        }

        console.log(`[更新群名片] 完成，成功: ${successCount}, 失败: ${failCount}`);
        e.reply(`更新完成，成功: ${successCount}, 失败: ${failCount}`);
        return true;
    } catch (e) {
        console.error(`[更新群名片] 执行失败:`, e);
        e.reply(`更新失败: ${e.message}`);
        return false;
    }
}
