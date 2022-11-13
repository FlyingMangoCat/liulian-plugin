import os from 'os';
import schedule from "node-schedule";

let botname = ''//这里改成bot的名字


schedule.scheduleJob("0 0/10 * * * ?", async () =>{
    const totalMem = os.totalmem();
    const freeMen =os.freemem();
    let persent = (totalMem-freeMen)/totalMem*100;
    console.log(persent.toFixed(2));
    for(let group of Bot.gl){
        await Bot.pickGroup(group[0]).setCard(Bot.uin, `${botname || Bot.nickname}｜系统占用${persent.toFixed(2)}%`);
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
    const totalMem = os.totalmem();
    const freeMen =os.freemem();

    let persent = (totalMem-freeMen)/totalMem*100;

    console.log(persent.toFixed(2));

    for(let group of Bot.gl){
        await Bot.pickGroup(group[0]).setCard(Bot.uin, `${botname}|系统占用${persent.toFixed(2)}%`);
    }
    return true;
}
