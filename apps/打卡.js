import { segment } from "oicq";
import fetch from "node-fetch";
import Cfg from '../components/Cfg.js'
//项目路径
const _path = process.cwd();
export const rule = {
    
    chumeng: {
        reg: "打卡$", //匹配消息正则，命令正则
        priority: 100, //优先级，越小优先度越高
        describe: "打卡or点赞", //【命令】功能说明
    },
};

export async function chumeng(e) {
if (!/榴莲/.test(e.msg) && !Cfg.get('sys.dk', false)) {
    e.reply (`该功能已被关闭，请通过榴莲设置开启`);
    return false
  }
    console.log("用户命令：", e.msg);

    let url = `https://iw233.cn/api/Random.php`;
    let msg = [
       "打卡成功!可心成功帮你点赞!",
        segment.image(url),
    ];
   let qun = [
       segment.at(e.user_id),
       " 打卡成功!这是给你的奖励!",
        segment.image(url),
       "\nps:点赞要加好友私聊:打卡",
    ];
   let type = e.message_type;
    if (type == 'private') {   //私聊
        e.friend.thumbUp(e.user_id,20);
        e.reply(msg);
    } else if (type == 'group') {    //群聊
    e.group.sendMsg(qun)
    }
    return true;//返回true 阻挡消息不再往下
}