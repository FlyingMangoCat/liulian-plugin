import fetch from "node-fetch";
import fs from 'fs';
import path from 'path';
import moment from 'moment';
import lodash from "lodash";
const _path = process.cwd();
export const rule = {
  sjclassic: {
    reg: "#?(来点|整点|搞点|随机|看看|来一张)(经典|小怪话|怪话|逆天|逆天语录|经典语录|乐子|杂图)$", //匹配消息正则，命令正则
    priority: 1000, //优先级，越小优先度越高
    describe: "经典发言", //【命令】功能说明
  },
  zdclassic: {
    reg: "#?随机(.*)$", //匹配消息正则，命令正则
    priority: 1000, //优先级，越小优先度越高
    describe: "经典发言", //【命令】功能说明
  },
};

export async function sjclassic(e) {
 let url = `https://api.yxyos.com/liulian/classic`;
       let msg = [
           segment.image(url)
  ];

  e.reply(msg,true);
  }
  export async function zdclassic(e) {
if (e.msg.replace("乐子")){
  return false
  }
let keyword = e.msg.replace("#","");
  keyword = keyword.replace("随机","");
  console.log(keyword);
  let url = `https://api.yxyos.com/liulian/classic/?list=${keyword}`;
       let msg = [
           segment.image(url)
  ];

  e.reply(msg,true);
  }