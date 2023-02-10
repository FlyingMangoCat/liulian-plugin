import { segment } from "oicq";
import Cfg from '../components/Cfg.js'

const _path = process.cwd();
export const rule = {
    examples: {
        reg: "^#我要休息[\s\S]*", //匹配消息正则，命令正则
        priority: 750, //优先级，越小优先度越高
        describe: "#我要休息XX分钟 || 天 || 小时", //【命令】功能说明
    },
};

export async function examples(e) {
if (!/榴莲/.test(e.msg) && !Cfg.get('sys.xx', false)) {
    e.reply (`该功能已被关闭，请通过榴莲设置开启`);
    return false
  }
    // console.log(e.msg);
    console.log(e.user_id);
    let who = e.user_id
    let val = e.msg.slice(5);
    let day = val.replace(/[0-9]*/g, '').replace(/\./, '');
    let num = parseInt(val);
    let timer = num * 60
    try {
        switch (day) {
            case '天':
                timer = timer * 60 * 24
                break;
            case '小时':
                timer = timer * 60
                break;
            default:
                break;
        }
        console.log(timer);
        e.group.muteMember(who, timer);
        let msg = [
            segment.at(who), "\n",
            `没有后悔药的喔!!!请等待${num}${day}后再聊天`
        ]
        e.reply(msg);
    } catch (error) {
        e.reply(`请检查是否机器人有禁言权限!该功能仅限群聊使用!`);
    }
}