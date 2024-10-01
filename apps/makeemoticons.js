import fetch from "node-fetch";
import axios from 'axios';

let app = App.init({
  id: 'bq',
  name: 'bq',
  desc: 'bq'
})

app.reg({
  biaoQing: {
    reg: "noCheck", //匹配消息正则，命令正则
    priority: 10, //优先级，越小优先度越高
    describe: "头像表情包", //【命令】功能说明
  },
  biaoQingHelp: {
    reg: "^表情帮助$", //匹配消息正则，命令正则
    priority: 10, //优先级，越小优先度越高
    describe: "表情帮助", //【命令】功能说明
  },
})
export default app
const keywordList = [
  "表情更新",
  "摸",
  "摸摸",
  "摸头",
  "摸摸头",
  "rua",
  "亲",
  "亲亲",
  "贴贴",
  "贴",
  "蹭",
  "蹭蹭",
  "顶",
  "玩",
  "拍",
  "撕",
  "丢",
  "扔",
  "抛",
  "掷",
  "爬",
  "精神支柱",
  "一直",
  "加载中",
  "转",
  "小天使",
  "不要靠近",
  "一样",
  "滚",
  "玩游戏",
  "来玩游戏",
  "膜拜",
  "膜",
  "吃",
  "啃",
  "出警",
  "警察",
  "问问",
  "去问问",
  "舔屏",
  "舔",
  "prpr",
  "搓",
  "国旗",
  "墙纸",
  "交个朋友",
  "继续干活",
  "完美",
  "完美的",
  "关注",
  "我朋友说",
  "我有个朋友说",
  "这像画吗",
  "震惊",
  "兑换券",
  "听音乐",
  "典中典",
  "哈哈镜",
  "永远爱你",
  "对称",
  "安全感",
  "永远喜欢",
  "我永远喜欢",
  "采访",
  "打拳",
  "群青",
  "捣",
  "捶",
  "需要",
  "你可能需要",
  "捂脸",
  "敲",
  "垃圾",
  "垃圾桶",
  "为什么at我",
  "像样的亲亲",
  "啾啾",
  "吸",
  "嗦",
  "紧贴",
  "紧紧贴着",
  "锤",
  "可莉",
  "仰望大佬",
  "打",
  "击剑",
  "mo鱼",
  "赞",
  "小恐龙",
  "吞",
  "胡桃",
  "快逃",
  "色色",
  "踢",
  "踩",
  "520",
  "孤寡",
];
const specialList = [
  "摸",
  "摸摸",
  "摸头",
  "摸摸头",
  "rua",
  "撕",
  "爬",
  "小天使",
  "玩游戏",
  "来玩游戏",
  "问问",
  "去问问",
  "交个朋友",
  "关注",
  "我朋友说",
  "我有个朋友说",
  "兑换券",
  "典中典",
  "对称",
  "安全感",
  "采访",
  "永远喜欢",
  "我永远喜欢",
  "520",
  "孤寡",
  "表情更新",
];
export async function biaoQing(e) {
  if (!e.isGroup || !e.msg) {
    return false;
  }
  const atItem = e.message.filter((item) => item.type === "at");

  let isSpecial = specialList.filter((item) => e.msg.includes(item) && item !== e.msg).length > 0;
//console.log('isSpecial:', isSpecial);
 
  let key = '';
  let flag = "_";
  let target='';
  let master = "1280951594";
//console.log('msg:',e.msg)
if (e.img){target=e.img[0], key=e.msg}
if (e.msg.match('自己')){target=e.user_id; key=e.msg.replace('自己','');}
if (atItem.length){target=atItem[0].qq, key=e.msg}
//console.log('key',key);
  if     (!keywordList.includes(e.msg) && !isSpecial && !keywordList.includes(key))
    return false;

//console.log('isSpecial:',isSpecial);
  let specialName = isSpecial
    ? getSpecialName(
        key.trim(),
        specialList.filter((item) => key.includes(item) )[0]
      )
    : key;
//console.log('specialName:',specialName);
let cmd = specialName.split('_').shift();

if (e.msg.match('表情更新')){cmd=e.msg.replace('表情更新', '')}
//console.log(target, key);

if     (!keywordList.includes(cmd) && !keywordList.includes(e.msg))
    return false;

key = encodeURI(specialName);
if (e.msg.match('表情更新')){key=e.msg.replace('表情更新', 'update_'),target=e.user_id}
//console.log(target, key);

  if (target) {
    let url = `https://api.dlut-cc.live/emoji/?flag=${flag}&qq=${e.user_id}&target=${target}&group=${e.group_id}&args=${key}&master=${master}`;
    console.log(url);
    //let response = await fetch(url); //调用接口获取数据
    let response = await axios.get(url, {timeout: 20000}); //调用接口获取数据
    //const res = await response.json(); //结果json字符串转对象
    const res = await response.data; //结果json字符串转对象
    if (res.success == "true") {
      await e.reply([segment.at(e.user_id), segment.image(res.url)]);
    } else {
      await e.reply([segment.at(e.user_id), res.url]);
    }
    return true;
  }
}
export async function biaoQingHelp(e) {
  if (!e.isGroup) {
    return false;
  } else {
    await e.reply([
      segment.at(e.user_id),
      "\n格式：指令+@QQ/自己/图片\n如：#爬@790621765\n爬自己\n爬+图片,详见下图",
      segment.image(`./plugins/liulian-plugin/resources/help/bphelp.jpg`),
    ]);
    return true; //返回true 阻挡消息不再往下
  }
}
function getSpecialName(msg, chooseItem) {
  let name = "";
  switch (chooseItem) {
    case "摸":
    case "摸摸":
    case "摸头":
    case "摸摸头":
    case "rua":
      if (msg.includes("圆")) name = msg.replace("圆", "_圆");
      else name = msg.replace("摸", "摸_");
      break;
    case "撕":
      if (msg.includes("滑稽")) name = msg.replace("滑稽", "_滑稽_");
      else name = msg.replace("撕", "撕_");
      break;
    case "爬":
      if (/\d+/.test(msg)) name = msg.replace(/\d+/, `_${msg.match(/\d+/)[0]}_`);
      else name = msg.replace("摸", "摸_");
      break;
    case "小天使":
      if (msg.includes("自己")) name = msg.replace("小天使", "小天使_").replace("自己", "_自己");
      else name = msg.replace("小天使", "小天使_");
      break;
    case "玩游戏":
    case "来玩游戏":
      name = msg.replace("玩游戏", "玩游戏_");
      break;
    case "问问":
    case "去问问":
      name = msg.replace("问问", "问问_");
      break;
    case "交个朋友":
      name = msg.replace("交个朋友", "交个朋友_");
      break;
    case "关注":
      name = msg.replace("关注", "关注_");
      break;
    case "我朋友说":
    case "我有个朋友说":
      name = msg.replace("朋友说", "朋友说_").replace("自己", "_自己");
      break;
    case "兑换券":
      name = msg.replace("兑换券", "兑换券_");
      break;
    case "典中典":
      if (msg.includes("彩")) name = msg.replace("彩", "_彩_");
      else name = msg.replace("典中典", "典中典_");
      break;
    case "对称":
      if (/(上|下|左|右)/.test(msg))
        name = msg.replace(/(上|下|左|右)/, `_${msg.match(/(上|下|左|右)/)[0]}`);
      else name = "对称";
      break;
    case "安全感":
      name = msg.replace("安全感", "安全感_");
      break;
    case "采访":
      name = msg.replace("采访", "采访_");
      break;
    case "永远喜欢":
    case "我永远喜欢":
      name = msg.replace("永远喜欢", "永远喜欢_");
      break;
    case "520":
    case "孤寡":
      name = msg.replace("520", "520_").replace('孤寡','520_');
      break;
  }
  return name;
}





