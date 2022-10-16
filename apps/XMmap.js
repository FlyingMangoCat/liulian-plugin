import { segment } from "oicq";
import fetch from "node-fetch";

const _path = process.cwd();//项目路径

export const rule = {
  yl总: {
    reg: "^须弥1-总$", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
  yl1: {
    reg: "^须弥1-1$", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
  yl2: {
    reg: "^须弥1-2$", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
  yl3: {
    reg: "^须弥1-3$", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
  yl4: {
    reg: "^须弥1-4$", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
  yl5: {
    reg: "^须弥1-5$", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
  yl6: {
    reg: "^须弥1-6$", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
  yl7: {
    reg: "^须弥1-7$", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
  yl8: {
    reg: "^须弥1-8$", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
  yl9: {
    reg: "^须弥1-9$", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
  yl10: {
    reg: "^须弥1-10$", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
  yl11: {
    reg: "^须弥1-11$", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
  yl12: {
    reg: "^须弥1-12$", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
  yl13: {
    reg: "^须弥1-13$", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
  yl14: {
    reg: "^须弥1-14$", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
  yl15: {
    reg: "^须弥1-15$", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
  yl16: {
    reg: "^须弥1-16$", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
  yl17: {
    reg: "^须弥1-17$", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
  yl18: {
    reg: "^须弥1-18$", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
  yl19: {
    reg: "^须弥1-19$", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
  yl20: {
    reg: "^须弥1-20$", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
};

export async function yl总(e) {
  //e.msg 用户的命令消息
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/须弥-雨林/总.png`),
  ];

  //发送消息
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl1(e) {
  //e.msg 用户的命令消息
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/须弥-雨林/1.png`),
  ];

  //发送消息
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl2(e) {
  //e.msg 用户的命令消息
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/须弥-雨林/2.png`),
  ];

  //发送消息
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl3(e) {
  //e.msg 用户的命令消息
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/须弥-雨林/3.png`),
  ];

  //发送消息
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl20(e) {
  //e.msg 用户的命令消息
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/须弥-雨林/20.png`),
  ];

  //发送消息
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl4(e) {
  //e.msg 用户的命令消息
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/须弥-雨林/4.png`),
  ];

  //发送消息
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl5(e) {
  //e.msg 用户的命令消息
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/须弥-雨林/5.png`),
  ];

  //发送消息
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl6(e) {
  //e.msg 用户的命令消息
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/须弥-雨林/6.png`),
  ];

  //发送消息
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl7(e) {
  //e.msg 用户的命令消息
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/须弥-雨林/7.png`),
  ];

  //发送消息
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl8(e) {
  //e.msg 用户的命令消息
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/须弥-雨林/8.png`),
  ];

  //发送消息
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl9(e) {
  //e.msg 用户的命令消息
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/须弥-雨林/9.png`),
  ];

  //发送消息
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl10(e) {
  //e.msg 用户的命令消息
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/须弥-雨林/10.png`),
  ];

  //发送消息
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl11(e) {
  //e.msg 用户的命令消息
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/须弥-雨林/11.png`),
  ];

  //发送消息
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl12(e) {
  //e.msg 用户的命令消息
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/须弥-雨林/12.png`),
  ];

  //发送消息
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl13(e) {
  //e.msg 用户的命令消息
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/须弥-雨林/13.png`),
  ];

  //发送消息
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl14(e) {
  //e.msg 用户的命令消息
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/须弥-雨林/14.png`),
  ];

  //发送消息
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl15(e) {
  //e.msg 用户的命令消息
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/须弥-雨林/15.png`),
  ];

  //发送消息
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl16(e) {
  //e.msg 用户的命令消息
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/须弥-雨林/16.png`),
  ];

  //发送消息
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl17(e) {
  //e.msg 用户的命令消息
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/须弥-雨林/17.png`),
  ];

  //发送消息
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl18(e) {
  //e.msg 用户的命令消息
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/须弥-雨林/18.png`),
  ];

  //发送消息
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl19(e) {
  //e.msg 用户的命令消息
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/须弥-雨林/19.png`),
  ];

  //发送消息
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}