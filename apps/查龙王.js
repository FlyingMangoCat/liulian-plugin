import { segment } from "oicq";
import fetch from "node-fetch";
let domain = "qun.qq.com"; 
const cookie = Bot.cookies[domain];
const _path = process.cwd();

//简单应用示例

//1.定义命令规则
export const rule = {
  dragonKing: {
    reg: "^#*(谁|哪个吊毛|哪个屌毛|哪个叼毛)是(龙王|群龙王)(\\?|？)*$",  //匹配消息正则，命令正则
    priority: 5000, //优先级，越小优先度越高
    describe: "查询本群龙王", //【命令】功能说明
  },
};

// 谁是龙王============================================================================================
export async function dragonKing(e) {
  if (!e.isGroup){
    e.reply(`欸，你是指，在我们两个之间，谁是龙王嘛？\n在可心心里你就是龙王呀(^ ^)`)
    return true
  }
  // console.log("【cookie】：", cookie)

  let ck = cookie.replace(/=/g, `":"`).replace(/;/g, `","`).replace(/ /g, "").trim()
  ck = ck.substring(0, ck.length - 2)
  ck = `{"`.concat(ck).concat("}")
  //  console.log("【ck】：", ck)
  ck = JSON.parse(ck)
  // console.log(ck)

  // //查询龙王
  let url = `https://ovooa.com/API/Dragon/api?QQ=${(BotConfig.account.qq)}&Skey=${(ck.skey)}&pskey=${(ck.p_skey)}&Group=${(e.group_id)}`;
  // console.log(url);

  let response = await fetch(url); //调用接口获取数据
  let res = await response.json(); //结果json字符串转对象
  console.log(res);
  if (res.code == -7) {
    e.reply("龙王的宝座虚位以待~")
    return true
  }
  if (res.code != 1) {
    e.reply("出错了，请稍后重试")
    return true
  }
  let msg = [
    "本群龙王：",
    segment.text(res.data.Nick),
    segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${res.data.Uin}`),
    "蝉联天数：",
    segment.text(res.data.Day), "天",
  ];
  e.reply(msg);
  return true; //返回true 阻挡消息不再往下
}
