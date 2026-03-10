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
  base64jiami: {
    reg: "^#*base64加密(.*)$",
    priority: 100,
    describe: "base64编码",
  },
  base64jiemi: {
    reg: "^#*base64解密(.*)$",
    priority: 100,
    describe: "base64解码",
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

export async function base64jiami(e) {
  const text = e.msg.replace(/^#*base64加密/, '').trim();

  if (!text) {
    e.reply('请输入要编码的内容，格式：#base64加密[内容]');
    return true;
  }

  const cfg = config.getdefault_config('liulian', 'token', 'config');
  const apikeys = cfg.apikeys;
  const apikey = apikeys.base64_apikey || '';

  try {
    let url = `https://api.oick.cn/api/base64?type=jiami&text=${encodeURIComponent(text)}&apikey=${apikey}`;
    let response = await fetch(url);
    let res = await response.json();

    if (res && res.data) {
      e.reply(`原文：${text}\n编码结果：${res.data}`);
    } else {
      e.reply('编码失败，请稍后重试');
    }
  } catch (error) {
    e.reply('编码失败，请稍后重试');
  }

  return true;
}

export async function base64jiemi(e) {
  const text = e.msg.replace(/^#*base64解密/, '').trim();

  if (!text) {
    e.reply('请输入要解码的内容，格式：#base64解密[内容]');
    return true;
  }

  const cfg = config.getdefault_config('liulian', 'token', 'config');
  const apikeys = cfg.apikeys;
  const apikey = apikeys.base64_apikey || '';

  try {
    let url = `https://api.oick.cn/api/base64?type=jiemi&text=${encodeURIComponent(text)}&apikey=${apikey}`;
    let response = await fetch(url);
    let res = await response.json();

    if (res && res.data) {
      e.reply(`编码内容：${text}\n解码结果：${res.data}`);
    } else {
      e.reply('解码失败，请稍后重试');
    }
  } catch (error) {
    e.reply('解码失败，请稍后重试');
  }

  return true;
}