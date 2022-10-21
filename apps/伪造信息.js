import { segment } from "oicq";
import fetch from "node-fetch";
import lodash from "lodash";

let list = [1484288448]; //禁止伪造的qq放到这里 例如 [1281258121,1280951594]

//命令规则
export const rule = {
  forge: {
    reg: "^#(伪造信息|伪造消息).*$", //匹配消息正则，命令正则
    priority: 50, //优先级，越小优先度越高
    describe: "【#伪造信息@群成员 信息】开发简单示例演示", //【命令】功能说明
  },
};

export async function forge(e) {
  let msgInfo = new Map(); // 将消息通过Map存储起来
  let msg = []; // 将要伪造的所有消息
  let idx = 1;

  //存放@的所有人并通过Set去重
  let qqList = new Set();

  let tempAtInfo = {};
  // 通过@某个人后e.message将会被拆分，将详细放入到Map中
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

  // 处理如果出现禁止伪造的qq
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
      tempMsgList = tempMsg.msg.split(/[|｜]/); // 这里处理消息中如果存在|｜时拆分同一个人发送的多条消息
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
