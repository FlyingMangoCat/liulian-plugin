import { segment } from "oicq";
import fetch from "node-fetch";

//项目路径
const _path = process.cwd();

//简单应用示例
// api 地址 https://www.tianapi.com/ 建议key 换成自己的
//1.定义命令规则
export const rule = {
  dutang: {
    reg: "^[^-]*毒鸡汤$", //匹配消息正则，命令正则
    priority: 10, //优先级，越小优先度越高
    describe: "毒鸡汤", //【命令】功能说明
  },
   caihongpi: {
    reg: "^[^-]*(彩虹屁|夸夸我)$", //匹配消息正则，命令正则
    priority: 10, //优先级，越小优先度越高
    describe: "彩虹屁", //【命令】功能说明
  },
  saylove: {
    reg: "^[^-]*(土味情话|土味|情话)$", //匹配消息正则，命令正则
    priority: 10, //优先级，越小优先度越高
    describe: "土味情话", //【命令】功能说明
  },
  joke: {
    reg: "^[^-]*(讲个笑话|讲笑话|来个笑话)$", // 只匹配以括号里面结尾的 例如 讲个笑话或 派蒙讲个笑话，同上
    priority: 10, //优先级，越小优先度越高
    describe: "笑话", //【命令】功能说明
  },
};

export async function dutang(e) {
  let url = "https://api.oick.cn/dutang/api.php";
  let response = await fetch(url);
  let res = await response.json(); //结果json字符串转对象
  let msg = [
    segment.at(e.user_id),"\n",res,
  ];
  //发送消息
  e.reply(msg);
  return true; //返回true 阻挡消息不再往下
}
export async function caihongpi(e) {
  let url = "http://api.tianapi.com/caihongpi/index?key=947a91d78155a584a19c69b1ce50dd99";
  let response = await fetch(url);
  let res = await response.json(); //结果json字符串转项
  let msg = [
    segment.at(e.user_id),"\n",res.newslist[0].content,
  ];
  //发送消息
  e.reply(msg);
  return true; //返回true 阻挡消息不再往下
}
export async function saylove(e) {
  let url = "http://api.tianapi.com/saylove/index?key=947a91d78155a584a19c69b1ce50dd99";
  let response = await fetch(url);
  let res = await response.json(); //结果json字符串转对象
  let msg = [
    segment.at(e.user_id),"\n",res.newslist[0].content,
  ];
  //发送消息
  e.reply(msg);
  return true; //返回true 阻挡消息不再往下
}
export async function joke(e) {
  let url = "http://api.tianapi.com/joke/index?key=947a91d78155a584a19c69b1ce50dd99&num=1";
  let response = await fetch(url);
  let res = await response.json(); //结果json字符串转对象
  let msg = [
    segment.at(e.user_id),"\n",res.newslist[0].title,"\n",
    res.newslist[0].content,
  ];
  //发送消息
  e.reply(msg);
  return true; //返回true 阻挡消息不再往下
}
