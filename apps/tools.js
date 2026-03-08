import fetch from "node-fetch";
import config from "../model/config/config.js"

// 通用的翻译函数，可以被其他模块调用
export async function translateText(text) {
  try {
    const cfg = config.getdefault_config('liulian', 'token', 'config');
    const apikeys = cfg.apikeys;
    const apikey = apikeys.fanyi_apikey || '';
    
    let url = `https://api.oick.cn/api/fanyi?text=${encodeURIComponent(text)}&apikey=${apikey}`;
    let response = await fetch(url);
    let res = await response.json();
    
    if (res && res.result) {
      return res.result;
    } else if (res && res.text) {
      return res.text;
    }
    return null;
  } catch (error) {
    console.error('翻译失败:', error);
    return null;
  }
}

export const rule = {
  fanyi: {
    reg: "^#*翻译(.*)$",
    priority: 100,
    describe: "翻译功能",
  },
};

// 用户命令接口
export async function fanyi(e) {
  const text = e.msg.replace(/^#*翻译/, '').trim();
  
  if (!text) {
    e.reply('请输入要翻译的内容，格式：#翻译[内容]');
    return true;
  }
  
  e.reply('正在翻译...');
  
  const result = await translateText(text);
  
  if (result) {
    e.reply(`原文：${text}\n翻译：${result}`);
  } else {
    e.reply('翻译失败，请稍后重试');
  }
  
  return true;
}