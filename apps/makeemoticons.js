/*
* 榴莲插件 - 表情制作模块
* 功能：提供头像表情包制作功能
* 支持多种表情动作，包括摸、亲、贴贴、顶、玩、拍、撕、丢等
* 可通过@用户、自己或图片来制作表情
* */

import fetch from "node-fetch";
import axios from 'axios';

// 命令规则定义
export const rule = {
  // 表情制作命令
  biaoQing: {
    reg: "noCheck", // 不检查正则，匹配所有消息
    priority: 10, //优先级，越小优先度越高
    describe: "头像表情包制作", //【命令】功能说明
  },
  // 表情帮助命令
  biaoQingHelp: {
    reg: "^表情帮助$", //匹配消息正则，命令正则
    priority: 10, //优先级，越小优先度越高
    describe: "表情制作帮助", //【命令】功能说明
  },
};
// 支持的所有表情关键词列表
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

// 需要特殊处理的关键词列表（支持参数变体）
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
/**
 * 表情制作主函数
 * @param {Object} e - 事件对象
 * @returns {boolean|void} - 返回false表示不处理，void表示已处理
 */
export async function biaoQing(e) {
  // 只在群聊中处理，且必须有消息内容
  if (!e.isGroup || !e.msg) {
    return false;
  }
  // 获取消息中的@信息
  const atItem = e.message.filter((item) => item.type === "at");

  // 检查是否包含需要特殊处理的关键词
  let isSpecial = specialList.filter((item) => e.msg.includes(item) && item !== e.msg).length > 0;
 
  // 初始化变量
  let key = '';
  let flag = "_";
  let target='';
  let master = "1280951594"; // 主人QQ号

  // 确定表情目标：可以是图片、自己或@的用户
  if (e.img){target=e.img[0], key=e.msg} // 如果有图片，使用图片作为目标
  if (e.msg.match('自己')){target=e.user_id; key=e.msg.replace('自己','');} // 如果是"自己"，使用发送者QQ
  if (atItem.length){target=atItem[0].qq, key=e.msg} // 如果有@用户，使用被@的用户QQ

  // 检查消息是否包含有效的表情关键词
  if (!keywordList.includes(e.msg) && !isSpecial && !keywordList.includes(key))
    return false;

  // 处理特殊表情名称
  let specialName = isSpecial
    ? getSpecialName(
        key.trim(),
        specialList.filter((item) => key.includes(item) )[0]
      )
    : key;

  // 获取基础命令
  let cmd = specialName.split('_').shift();

  // 处理表情更新命令
  if (e.msg.match('表情更新')){cmd=e.msg.replace('表情更新', '')}

  // 再次检查命令有效性
  if (!keywordList.includes(cmd) && !keywordList.includes(e.msg))
    return false;

  // 对关键词进行URL编码
  key = encodeURI(specialName);
  
  // 处理表情更新命令的特殊逻辑
  if (e.msg.match('表情更新')){key=e.msg.replace('表情更新', 'update_'),target=e.user_id}

  // 如果确定了目标，则调用API制作表情
  if (target) {
    let url = `https://api.dlut-cc.live/emoji/?flag=${flag}&qq=${e.user_id}&target=${target}&group=${e.group_id}&args=${key}&master=${master}`;
    console.log(url);
    
    try {
      // 调用表情制作API，设置20秒超时
      let response = await axios.get(url, {timeout: 20000});
      const res = await response.data;
      
      // 根据API返回结果发送表情或错误信息
      if (res.success == "true") {
        await e.reply([segment.at(e.user_id), segment.image(res.url)]);
      } else {
        await e.reply([segment.at(e.user_id), res.url]);
      }
      return true;
    } catch (error) {
      console.error('表情制作API调用失败:', error);
      await e.reply([segment.at(e.user_id), '表情制作失败，请稍后重试']);
      return true;
    }
  }
}
/**
 * 表情帮助函数
 * @param {Object} e - 事件对象
 * @returns {boolean} - 返回true表示成功处理
 */
export async function biaoQingHelp(e) {
  // 只在群聊中提供帮助
  if (!e.isGroup) {
    return false;
  } else {
    // 发送帮助信息，包括使用说明和示例图片
    await e.reply([
      segment.at(e.user_id),
      "\n格式：指令+@QQ/自己/图片\n如：#爬@790621765\n爬自己\n爬+图片,详见下图",
      segment.image(`./plugins/liulian-plugin/resources/help/bphelp.jpg`),
    ]);
    return true; //返回true 阻挡消息不再往下
  }
}

/**
 * 处理特殊表情名称的函数
 * 根据不同的表情类型和参数，生成符合API要求的特殊名称格式
 * @param {string} msg - 原始消息内容
 * @param {string} chooseItem - 匹配到的特殊关键词
 * @returns {string} - 处理后的特殊名称
 */
function getSpecialName(msg, chooseItem) {
  let name = "";
  switch (chooseItem) {
    // 摸系列表情处理
    case "摸":
    case "摸摸":
    case "摸头":
    case "摸摸头":
    case "rua":
      if (msg.includes("圆")) name = msg.replace("圆", "_圆");
      else name = msg.replace("摸", "摸_");
      break;
    
    // 撕表情处理
    case "撕":
      if (msg.includes("滑稽")) name = msg.replace("滑稽", "_滑稽_");
      else name = msg.replace("撕", "撕_");
      break;
    
    // 爬表情处理
    case "爬":
      if (/\d+/.test(msg)) name = msg.replace(/\d+/, `_${msg.match(/\d+/)[0]}_`);
      else name = msg.replace("摸", "摸_");
      break;
    
    // 小天使表情处理
    case "小天使":
      if (msg.includes("自己")) name = msg.replace("小天使", "小天使_").replace("自己", "_自己");
      else name = msg.replace("小天使", "小天使_");
      break;
    
    // 游戏相关表情处理
    case "玩游戏":
    case "来玩游戏":
      name = msg.replace("玩游戏", "玩游戏_");
      break;
    
    // 问问表情处理
    case "问问":
    case "去问问":
      name = msg.replace("问问", "问问_");
      break;
    
    // 交个朋友表情处理
    case "交个朋友":
      name = msg.replace("交个朋友", "交个朋友_");
      break;
    
    // 关注表情处理
    case "关注":
      name = msg.replace("关注", "关注_");
      break;
    
    // 朋友说表情处理
    case "我朋友说":
    case "我有个朋友说":
      name = msg.replace("朋友说", "朋友说_").replace("自己", "_自己");
      break;
    
    // 兑换券表情处理
    case "兑换券":
      name = msg.replace("兑换券", "兑换券_");
      break;
    
    // 典中典表情处理
    case "典中典":
      if (msg.includes("彩")) name = msg.replace("彩", "_彩_");
      else name = msg.replace("典中典", "典中典_");
      break;
    
    // 对称表情处理
    case "对称":
      if (/(上|下|左|右)/.test(msg))
        name = msg.replace(/(上|下|左|右)/, `_${msg.match(/(上|下|左|右)/)[0]}`);
      else name = "对称";
      break;
    
    // 安全感表情处理
    case "安全感":
      name = msg.replace("安全感", "安全感_");
      break;
    
    // 采访表情处理
    case "采访":
      name = msg.replace("采访", "采访_");
      break;
    
    // 永远喜欢表情处理
    case "永远喜欢":
    case "我永远喜欢":
      name = msg.replace("永远喜欢", "永远喜欢_");
      break;
    
    // 520/孤寡表情处理
    case "520":
    case "孤寡":
      name = msg.replace("520", "520_").replace('孤寡','520_');
      break;
  }
  return name;
}





