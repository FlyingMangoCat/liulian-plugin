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
  wyyjx: {
    reg: "^#*网易云解析(.*)$",
    priority: 100,
    describe: "网易云歌曲解析",
  },
  wyyauto: {
    reg: "music.163.com.*id=",
    priority: 50,
    describe: "网易云链接自动解析",
  },
  qrcode: {
    reg: "^#*二维码(.*)$",
    priority: 100,
    describe: "二维码生成",
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

// 网易云主动解析
export async function wyyjx(e) {
  const text = e.msg.replace(/^#*网易云解析/, '').trim();

  if (!text) {
    e.reply('请输入网易云歌曲ID或链接，格式：#网易云解析[歌曲ID] 或 #网易云解析[网易云链接]');
    return true;
  }

  // 提取歌曲ID
  let songId = text;
  const match = text.match(/id=(\d+)/);
  if (match) {
    songId = match[1];
  }

  const cfg = config.getdefault_config('liulian', 'token', 'config');
  const apikeys = cfg.apikeys;
  const apikey = apikeys.网易云_apikey || '';

  try {
    let url = `https://api.oick.cn/api/wyy?id=${songId}&apikey=${apikey}`;
    let response = await fetch(url);
    let res = await response.json();

    if (res && res.MP3) {
      e.reply(`歌曲链接：${res.MP3}`);
    } else {
      e.reply('解析失败，请检查歌曲ID是否正确');
    }
  } catch (error) {
    e.reply('解析失败，请稍后重试');
  }

  return true;
}

// 网易云自动解析
export async function wyyauto(e) {
  const match = e.msg.match(/id=(\d+)/);
  if (!match) return false;

  const songId = match[1];
  const cfg = config.getdefault_config('liulian', 'token', 'config');
  const apikeys = cfg.apikeys;
  const apikey = apikeys.网易云_apikey || '';

  try {
    let url = `https://api.oick.cn/api/wyy?id=${songId}&apikey=${apikey}`;
    let response = await fetch(url);
    let res = await response.json();

    if (res && res.MP3) {
      e.reply(`网易云歌曲解析成功：\n歌曲链接：${res.MP3}`);
    }
  } catch (error) {
    console.error('网易云自动解析失败:', error);
  }

  return true;
}

// 二维码生成
export async function qrcode(e) {
  let text = e.msg.replace(/^#*二维码/, '').trim();

  if (!text) {
    e.reply('请输入要生成二维码的内容，格式：#二维码[内容] [大小]');
    return true;
  }

  // 解析大小参数
  let size = '200px'; // 默认大小
  const match = text.match(/(\d+)px$/);
  if (match) {
    size = match[1] + 'px';
    text = text.replace(/\s*\d+px$/, '').trim();
  }

  const cfg = config.getdefault_config('liulian', 'token', 'config');
  const apikeys = cfg.apikeys;
  const apikey = apikeys.qrcode_apikey || '';

  try {
    let url = `https://api.oick.cn/api/qrcode?text=${encodeURIComponent(text)}&size=${size}&apikey=${apikey}`;
    let response = await fetch(url);
    let res = await response.json();

    if (res && res.图片) {
      e.reply(segment.image(res.图片));
    } else {
      e.reply('二维码生成失败，请稍后重试');
    }
  } catch (error) {
    e.reply('二维码生成失败，请稍后重试');
  }

  return true;
}