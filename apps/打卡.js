import fetch from "node-fetch";
import Cfg from '../components/Cfg.js'
import config from "../model/config/config.js"

const _path = process.cwd();

const cfg = config.getdefault_config('liulian', 'botname', 'config');
  const botname = cfg.botname

let app = App.init({
  id: 'dk',
  name: 'dk',
  desc: 'dk'
})

app.reg({
    
    chumeng: {
        reg: "打卡$", //匹配消息正则，命令正则
        priority: 100, //优先级，越小优先度越高
        describe: "打卡or点赞", //【命令】功能说明
    },
})

export async function chumeng(e) {
if (!Cfg.get('sys.dk', false)) {
  e.reply (`该功能已被关闭，请通过榴莲设置开启`);
  return false
  } 
    console.log("用户命令：", e.msg);


    let url = `https://api.iw233.cn/api.php?sort=random`;
    let msg = [
       `打卡成功!${botname}成功帮你点赞!`,
        segment.image(url),
    ];
   let qun = [
       segment.at(e.user_id),
       "打卡成功!这是给你的奖励!",
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