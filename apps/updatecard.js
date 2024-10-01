import os from 'os';
import schedule from "node-schedule";
import Cfg from '../components/Cfg.js'

let botname = ''//这里改成bot的名字


schedule.scheduleJob("0 0/10 * * * ?", async () =>{
    if (!Cfg.get('sys.qmp', false)) {
        return false
    }
    const totalMem = os.totalmem();
    const freeMen =os.freemem();
    let persent = (totalMem-freeMen)/totalMem*100;
    console.log(persent.toFixed(2));
    for(let group of Bot.gl){
        await Bot.pickGroup(group[0]).setCard(Bot.uin, `${botname || Bot.nickname}｜系统占用${persent.toFixed(2)}%`);
    }
    return true;
})

let app = App.init({
  id: 'qmp',
  name: 'qmp',
  desc: 'qmp'
})

app.reg({
    qmp : {
        reg : "^更新群名片",
        priority: 10,
        describe : "",
    }
})
export default app

export async function qmp (e){
if (!/榴莲/.test(e.msg) && !Cfg.get('sys.qmp', false))  {
  e.reply (`该功能已被关闭，请通过榴莲设置开启`);
  return false
}
    const totalMem = os.totalmem();
    const freeMen =os.freemem();

    let persent = (totalMem-freeMen)/totalMem*100;

    console.log(persent.toFixed(2));

    for(let group of Bot.gl){
        await Bot.pickGroup(group[0]).setCard(Bot.uin, `${botname}|系统占用${persent.toFixed(2)}%`);
    }
    return true;
}
