import config from "../model/config/config.js"
import Cfg from '../components/Cfg.js'
const cfg = config.getdefault_config('liulian', 'botname', 'config');
  const botname = cfg.botname

export const rule = {
  toShutUp: {
    reg: "#*(闭嘴|自爆)$", //匹配消息正则，命令正则
    priority: 0, //优先级，越小优先度越高
    describe: "群聊闭嘴", //【命令】功能说明
  },
  determineIfYouShutUp: {
    reg: "(.*)", //匹配消息正则，命令正则
    priority: 0, //优先级，越小优先度越高
    describe: "闭嘴判断", //【命令】功能说明
  },
  openYourMouth: {
    reg: "#*(张嘴|色色|复活)$", //匹配消息正则，命令正则
    priority: 0, //优先级，越小优先度越高
    describe: "群聊张嘴", //【命令】功能说明
  },
};

export async function toShutUp(e) {
if (!/榴莲/.test(e.msg) && !Cfg.get('sys.shutup', false)) {
    e.reply (`该功能已被关闭，请通过榴莲设置开启`);
    return false
  }
let limit=Cfg.get('sys.limit');
  if (!e.isGroup) {
    e.reply("只有群聊才能用哦！");
    return true;
  }
  if (limit === 1) {
    if (!e.isMaster) {
      e.reply("你算什么东西，还想命令老子！");
      return true;
    }
  }
  if (limit === 2) {
    if (!e.isMaster) {
      if (!e.member.is_admin) {
        e.reply(`只有主人和群管理才能可以命令${botname}哦！`);
        return true;
      }
    }
  }
  // console.log(e.group_id);

  if (!(await redis.get(`Yunzai:ShutUp${e.group_id}`))) {
    await redis.set(`Yunzai:ShutUp${e.group_id}`, "1");
  }
  e.reply(`是${botname}哪里让你不满意了吗？哼，不理你了!!!`);
  return true;
}
export async function determineIfYouShutUp(e) {
  if (!/#闭嘴/.test(e.msg) && !/#张嘴/.test(e.msg) && e.isGroup && (await redis.get(`Yunzai:ShutUp${e.group_id}`))) {
    return true;
  }
}
export async function openYourMouth(e) {
let limit=Cfg.get('sys.limit');
  if (!e.isGroup) {
    e.reply("只有群聊才能用哦！");
    return true;
  }
  if (limit === 1) {
    if (!e.isMaster) {
      e.reply("你算什么东西！");
      return true;
    }
  }
  if (limit === 2) {
    if (!e.isMaster) {
      if (!e.member.is_admin) {
        e.reply(`只有主人和智障才能可以命令${botname}哦！`);
        return true;
      }
    }
  }
  if (await redis.get(`Yunzai:ShutUp${e.group_id}`)) {
    await redis.del(`Yunzai:ShutUp${e.group_id}`);
    e.reply("终于让我说话了，憋死我了!!!");
    return true;
  } else {
    e.reply(`怎么了？怎么了？${botname}还在的哦，找${botname}有事嘛？`);
    return true;
  }
}
