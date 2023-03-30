import fetch from "node-fetch";
import lodash from "lodash";
import Cfg from '../components/Cfg.js'

let list = [1280951594,3598537042]; //禁止伪造的qq放到这里 例如 [123456,114514]

export const rule = {
  forge: {
    reg: "^#(伪造信息|伪造消息).*$", //匹配消息正则，命令正则
    priority: 50, //优先级，越小优先度越高
    describe: "#伪造信息@群成员 信息", 
  },
};

export async function forge(e) {
if (!/榴莲/.test(e.msg) && !Cfg.get('sys.forge', false)) {
    e.reply (`该功能已被关闭，请通过榴莲设置开启`);
    return false
  }
  let msgInfo = new Map(); 
  let msg = []; 
  let idx = 1;

  let qqList = new Set();

  let tempAtInfo = {};
  for (let index = 0; index < e.message.length; index++) {
    let element = e.message[index];
    if (element.text) {
      element.text = element.text.replace(/#伪造信息/g, "").trim();
    }

    if (element.type == "at") {
      const key = idx;
      msgInfo.set(key, {
        qq: element.qq,
        name: element.text.replace(/@/g, ""),
        msg: "",
      });
      tempAtInfo = {
        key,
        qq: element.qq,
        name: element.text.replace(/@/g, ""),
        msg: "",
      };
      idx++;
      qqList.add(element.qq);
    }
    if (element.type == "text" && element.text && tempAtInfo.key) {
      msgInfo.set(tempAtInfo.key, {
        qq: tempAtInfo.qq,
        name: tempAtInfo.name,
        msg: element.text,
        type: element.type,
      });
    }

    if (element.type == "image" && element.url && tempAtInfo.key) {
      msgInfo.set(tempAtInfo.key, {
        qq: tempAtInfo.qq,
        name: tempAtInfo.name,
        msg: element.text,
        type: element.type,
        url: element.url,
      });
    }
  }

  if (lodash.intersection(list, Array.from(qqList)).length > 0) {
    e.reply("这位大人也是你配造谣的？");
    return true;
  }

  for (let item of msgInfo.keys()) {
    const tempMsg = msgInfo.get(item);
    let tempMsgList = [];
    if (tempMsg.type === "image") {
      tempMsgList = [segment.image(tempMsg.url)];
    } else {
      tempMsgList = tempMsg.msg.split(/[|｜]/); 
    }
    tempMsgList.map((msgItem) => {
      msg.push({
        message: msgItem,
        nickname: tempMsg.name,
        user_id: tempMsg.qq,
      });
    });
  }

  e.reply(await e.group.makeForwardMsg(msg));

  return true; //返回true 阻挡消息不再往下
}
