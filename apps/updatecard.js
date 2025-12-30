import os from 'os';
import schedule from "node-schedule";
import { Cfg, liulianSafe } from '#liulian'

let botname = ''//这里改成bot的名字


schedule.scheduleJob("0 0/10 * * * ?", async () =>{
    if (!Cfg.get('sys.qmp', false)) {
        return false
    }
    const totalMem = os.totalmem();
    const freeMen =os.freemem();
    let persent = (totalMem-freeMen)/totalMem*100;
    console.log(persent.toFixed(2));
    for(let group of liulianSafe.gl){
        await liulianSafe.pickGroup(group[0]).setCard(liulianSafe.uin, `${botname || liulianSafe.nickname}｜系统占用${persent.toFixed(2)}%`);
    }
    return true;
})


export const rule = {
    qmp : {
        reg : "^更新群名片",
        priority: 10,
        describe : "",
    }
};

export async function qmp (e){
if (!/榴莲/.test(e.msg) && !Cfg.get('sys.qmp', false))  {
  e.reply (`该功能已被关闭，请通过榴莲设置开启！`);
  return false
}
    const totalMem = os.totalmem();
    const freeMen =os.freemem();

    let persent = (totalMem-freeMen)/totalMem*100;

    console.log(persent.toFixed(2));

    for(let group of liulianSafe.gl){
        await liulianSafe.pickGroup(group[0]).setCard(liulianSafe.uin, `${botname}|系统占用${persent.toFixed(2)}%`);
    }
    return true;
}
