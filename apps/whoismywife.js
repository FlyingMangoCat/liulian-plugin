import { segment } from "oicq";
import fetch from "node-fetch";
import Cfg from '../components/Cfg.js'
import { logger } from '../components/index.js'
//项目路径
const _path = process.cwd();
let GayCD = { };
let time = Cfg.get('sys.wife')
export const rule = {
    哪个群友是我老婆: {
        reg: "^#*(拐群友|柰子|奈子|奶子|绑架群友|娶群友|娶老婆|拐卖人口|哪个群友是我老婆|抽管理|拐卖群友|绑架人口|拐走群友)$", //匹配消息正则，命令正�?        priority: 100,
        describe: "哪个群友是我老婆",
    },
};
export async function 哪个群友是我老婆(e) {
if (!Cfg.get('sys.qqy', false))  {
  e.reply (`该功能已被关闭，请通过榴莲设置开启！`);
  return false
}
let random = Math.round(Math.random() * 100);
if (random < 5) {
        e.reply("醒醒，你根本没有老婆�?);
        return true;
  }
    console.log("用户命令�?, e.msg);
    if(GayCD[e.user_id]){
        e.reply("该命令有"+time+"分钟cd");
        return true;
    }
    GayCD[e.user_id] = true;
    GayCD[e.user_id] = setTimeout(() => {
        if (GayCD[e.user_id]) {
            delete GayCD[e.user_id];
        }
    }, (time*60000));
    let mmap = await e.group.getMemberMap();
    let arrMember = Array.from(mmap.values());
    let randomWife = arrMember[Math.round(Math.random() * (arrMember.length-1))];
    if (randomWife.last_sent_time>=(new Date().getTime() - 259200000)/1000){
        let msg = [
            segment.at(e.user_id),
            "今天你的群友老婆�?,
            segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${randomWife.user_id}`),
            `�?{randomWife.nickname}�?(${randomWife.user_id}) 哒哒哒！(健康使用要刷屏！)`
        ]
        e.reply(msg);
        logger.mark('第一个老婆最后发言时间�?+getMyDate(randomWife.last_sent_time*1000));
        return true; 
    }
    let randomWife2 = arrMember[Math.round(Math.random() * (arrMember.length-1))];
    if (randomWife2.last_sent_time>=(new Date().getTime() - 259200000)/1000){
        let msg = [
            segment.at(e.user_id),
            "今天你的群友老婆�?,
            segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${randomWife2.user_id}`),
            `�?{randomWife2.nickname}�?(${randomWife2.user_id}) 哒哒哒！快点趁热入洞房吧�?健康使用不要刷屏�?`
        ]
        e.reply(msg);
        logger.mark('第二个老婆最后发言时间�?+getMyDate(randomWife2.last_sent_time*1000));
        return true; 
    }
    let randomWife3 = arrMember[Math.round(Math.random() * (arrMember.length-1))];
    if (randomWife3.last_sent_time>=(new Date().getTime() - 259200000)/1000){
        let msg = [
            segment.at(e.user_id),
            "今天你的群友老婆�?,
            segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${randomWife3.user_id}`),
            `�?{randomWife3.nickname}�?(${randomWife3.user_id}) 哒哒哒！(健康使用不要刷屏�?`
        ]
        e.reply(msg);
        logger.mark('第三个老婆最后发言时间�?+getMyDate(randomWife3.last_sent_time*1000));
        return true;
    }
    let randomWife4 = arrMember[Math.round(Math.random() * (arrMember.length-1))];
    if (randomWife4.last_sent_time>=(new Date().getTime() - 259200000)/1000){
        let msg = [
            segment.at(e.user_id),
            "今天你的群友老婆�?,
            segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${randomWife4.user_id}`),
            `�?{randomWife4.nickname}�?(${randomWife4.user_id}) 啦啦啦！(健康使用不要刷屏�?`
        ]
        e.reply(msg);
        logger.mark('第四个老婆最后发言时间�?+getMyDate(randomWife4.last_sent_time*1000));
        return true;
    }
    let randomWife5 = arrMember[Math.round(Math.random() * (arrMember.length-1))];
    if (randomWife5.last_sent_time>=(new Date().getTime() - 259200000)/1000){
        let msg = [
            segment.at(e.user_id),
            "今天你的群友老婆�?,
            segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${randomWife5.user_id}`),
            `�?{randomWife5.nickname}�?(${randomWife5.user_id}) 啦啦啦！(健康使用不要刷屏�?`
        ]
        e.reply(msg);
        logger.mark('第五个老婆最后发言时间�?+getMyDate(randomWife5.last_sent_time*1000));
        return true;
    }
    let randomWife6 = arrMember[Math.round(Math.random() * (arrMember.length-1))];
    if (randomWife6.last_sent_time>=(new Date().getTime() - 259200000)/1000){
        let msg = [
            segment.at(e.user_id),
            "今天你的群友老婆�?,
            segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${randomWife6.user_id}`),
            `�?{randomWife6.nickname}�?(${randomWife6.user_id}) 啦啦啦！(健康使用不要刷屏�?`
        ]
        e.reply(msg);
        logger.mark('第六个老婆最后发言时间�?+getMyDate(randomWife6.last_sent_time*1000));
        return true;
    }
    let randomWife7 = arrMember[Math.round(Math.random() * (arrMember.length-1))];
    if (randomWife7.last_sent_time>=(new Date().getTime() - 259200000)/1000){
        let msg = [
            segment.at(e.user_id),
            "今天你的群友老婆�?,
            segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${randomWife7.user_id}`),
            `�?{randomWife7.nickname}�?(${randomWife7.user_id}) 啦啦啦！(健康使用不要刷屏�?`
        ]
        e.reply(msg);
        logger.mark('第七个老婆最后发言时间�?+getMyDate(randomWife7.last_sent_time*1000));
        return true;
    }
    let randomWife8 = arrMember[Math.round(Math.random() * (arrMember.length-1))];
    if (randomWife8.last_sent_time>=(new Date().getTime() - 259200000)/1000){
        let msg = [
            segment.at(e.user_id),
            "今天你的群友老婆�?,
            segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${randomWife8.user_id}`),
            `�?{randomWife8.nickname}�?(${randomWife8.user_id}) 啦啦啦！(健康使用不要刷屏�?`
        ]
        e.reply(msg);
        logger.mark('第八个老婆最后发言时间�?+getMyDate(randomWife8.last_sent_time*1000));
        return true;
    }
}
function getMyDate(str) {
    var oDate = new Date(str),
        oYear = oDate.getFullYear(),
        oMonth = oDate.getMonth()+1,
        oDay = oDate.getDate(),
        oHour = oDate.getHours(),
        oMin = oDate.getMinutes(),
        oSen = oDate.getSeconds(),
        oTime = oYear +'-'+ addZero(oMonth) +'-'+ addZero(oDay) +' '+ addZero(oHour) +':'+
            addZero(oMin) +':'+addZero(oSen);
    return oTime;
}
function addZero(num){
    if(parseInt(num) < 10){
        num = '0'+num;
    }
    return num;
}
