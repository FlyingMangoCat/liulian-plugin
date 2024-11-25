import fetch from "node-fetch";
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
  allclassic: {
    reg: "#?查看全部乐子人$", //匹配消息正则，命令正则
    priority: 1000, //优先级，越小优先度越高
    describe: "经典发言", //【命令】功能说明
  }, 
  bmclassic: {
    reg: "#?查看(.*)别名$", //匹配消息正则，命令正则
    priority: 1000, //优先级，越小优先度越高
    describe: "经典发言", //【命令】功能说明
  }, 
};

export async function sjclassic(e) {
 let url = `https://api.yxyos.com/liulian/classic`;//请求api
 let response = await fetch(url);
 let res = await response.json();//结果json字符串转对象
       let msg = [
           segment.image(res.url)
  ];

  e.reply(msg,true);
  }
export async function zdclassic(e) {
let keyword = e.msg.replace("#","");
  keyword = keyword.replace("随机","");
  console.log(keyword);//控制台输出关键词
  let url = `https://api.yxyos.com/liulian/classic/?list=${keyword}&type=alias`;//请求api
let response = await fetch(url);
 let res = await response.json();//结果json字符串转对象
       let msg = [
           segment.image(res.url)
  ];

  e.reply(msg,true);
  }
export async function allclassic(e) {
 let url = `https://api.yxyos.com/liulian/classic/?list=all`;//请求api
 let response = await fetch(url);
 let res = await response.json();//结果json字符串转对象
       let msg = [
           segment.image(res.resources)
  ];

  e.reply(msg,true);
  }
export async function bmclassic(e) {
let keyword = e.msg.replace("#","");
  keyword = keyword.replace("查看","");
  console.log(keyword);//控制台输出关键词
  let url = `https://api.yxyos.com/liulian/classic/?list=${keyword}&type=alias`;//请求api
let response = await fetch(url);
 let res = await response.json();//结果json字符串转对象
       let msg = [
           segment.image(res.url)
  ];

  e.reply(msg,true);
  }