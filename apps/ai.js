import fetch from "node-fetch";
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import moment from 'moment';
import lodash from "lodash";
import { App } from '#liulian'
const _path = process.cwd();

let app = App.init({
  id: 'ai',
  name: 'ai',
  desc: 'ai'
})

app.reg({
  ai: {
    reg: "#?可心(.*)$", //匹配消息正则，命令正则
    priority: 10, //优先级，越小优先度越高
    describe: "ai", //【命令】功能说明
  },
})
export default app
export async function ai(e) {
let keyword = e.msg.replace("#","");
  keyword = keyword.replace("可心","");
  console.log(keyword);
 let url = `https://v2.alapi.cn/api/chatgpt/pro?token=zO5Dd2HkhbM9Wbyt&content=${keyword}`;
  let response = await fetch(url);
  let res = await response.json(); //结果json字符串转对象
       let msg = [segment.at(e.user_id),
      res.data.content, 
  ];

  e.reply(msg,true);
  }
