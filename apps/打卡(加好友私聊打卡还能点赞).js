import { segment } from "oicq";
import fetch from "node-fetch";
//项目路径
const _path = process.cwd();
//作者：会飞的芒果猫
export const rule = {
    
    chumeng: {
        reg: "打卡$", //匹配消息正则，命令正则
        priority: 1, //优先级，越小优先度越高
        describe: "打卡or点赞", //【命令】功能说明
    },
};

//2.编写功能方法
export async function chumeng(e) {
    //e.msg 用户的命令消息
    console.log("用户命令：", e.msg);

    //执行的逻辑功能
    let url = `https://api.iyk0.com/ecy/api.php`;
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