import fs from "fs";
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import * as tough from 'tough-cookie';
import common from "../components/bcommon.js";
import { botConfig } from "../components/bcommon.js"
import config from "../model/config/config.js"
import { getBLsid, getUuid } from "#liulian"
import Cfg from '../components/Cfg.js'

// 创建cookie jar
const cookieJar = new tough.CookieJar();
const httpClient = wrapper(axios.create({ jar: cookieJar }));

// 从cookiejar中获取cookie值
async function getCookieValue(cookieName) {
  try {
    const cookies = await cookieJar.getCookies('https://api.bilibili.com');
    const cookie = cookies.find(c => c.key === cookieName);
    return cookie ? cookie.value : '';
  } catch (err) {
    return '';
  }
}

const _path = process.cwd();
const cfg = config.getdefault_config('liulian', 'botname', 'config');
const botname = cfg.botname

if (!fs.existsSync(`${_path}/data/PushNews/`)) {
  fs.mkdirSync(`${_path}/data/PushNews/`);
}

let dynamicPushHistory = []; // 历史推送，记录推送的动态详细信息，包含ID和发布时间
let nowDynamicPushList = new Map(); // 本次新增的需要推送的列表信息
let BilibiliPushConfig = {}; // 推送配置
let PushBilibiliDynamic = {}; // 推送对象列表

// B站动态类型
// const DynamicTypeList = {
//   DYNAMIC_TYPE_AV: { name: "视频动态", type: "DYNAMIC_TYPE_AV" },
//   DYNAMIC_TYPE_WORD: { name: "文字动态", type: "DYNAMIC_TYPE_WORD" },
//   DYNAMIC_TYPE_DRAW: { name: "图文动态", type: "DYNAMIC_TYPE_DRAW" },
//   DYNAMIC_TYPE_ARTICLE: { name: "专栏动态", type: "DYNAMIC_TYPE_ARTICLE" },
//   DYNAMIC_TYPE_FORWARD: { name: "转发动态", type: "DYNAMIC_TYPE_FORWARD" },
//   DYNAMIC_TYPE_LIVE_RCMD: { name: "直播动态", type: "DYNAMIC_TYPE_LIVE_RCMD" },
// };

// B站 API 端点（使用新版 API）
const BiliDynamicApiUrl = "https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space";
const BiliDrawDynamicLinkUrl = "https://m.bilibili.com/dynamic/"; // 图文动态链接地址
const BiliUserInfoUrl = "https://api.bilibili.com/x/space/acc/info"; // 用户信息 API
const BiliLoginQrcodeUrl = "https://passport.bilibili.com/x/passport-login/web/qrcode/generate"; // 获取登录二维码
const BiliLoginInfoUrl = "https://passport.bilibili.com/x/passport-login/web/qrcode/poll"; // 查询登录状态
const BiliNavUrl = "https://api.bilibili.com/x/web-interface/nav"; // 获取当前登录用户信息

// B站请求头配置
const BiliReqHeaders = {
  'accept': 'application/json, text/plain, */*',
  'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
  'origin': 'https://t.bilibili.com',
  'referer': 'https://t.bilibili.com/',
  'sec-ch-ua': '"Chromium";v="120", "Not=A?Brand";v="99", "Google Chrome";v="120"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-site',
  'sec-fetch-user': '?1',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'sec-ch-ua-arch': '"x86"',
  'sec-ch-ua-bitness': '"64"',
  'sec-ch-ua-full-version': '"120.0.0.0"'
}

// B站 Cookie（从配置文件读取或自动生成）
let BiliCookie = '';

// 当前登录用户的 DedeUserID
let BiliUID = 0;

// 初始化获取B站推送信息
const BotHaveARest = 500; // 每次发送间隔时间
const BiliApiRequestTimeInterval = 2000; // B站动态获取api请求间隔，别太快防止被拉黑
const DynamicPicCountLimit = 3; // 推送动态时，限制发送多少张图片
const DynamicContentLenLimit = 95; // 推送文字和图文动态时，限制字数是多少
const DynamicContentLineLimit = 5; // 推送文字和图文动态时，限制多少行文本

let nowPushDate = Date.now(); // 设置当前推送的开始时间
let lastSuccessfulPushDate = Date.now(); // 记录上一次成功推送的时间，用于避免漏推
let pushTimeInterval = 10; // 推送间隔时间，单位：分钟
// 延长过期时间的定义
let DynamicPushTimeInterval = 60 * 60 * 1000; // 过期时间，单位：小时，默认一小时，范围[1,24]

// 初始化 B站 Cookie
async function initBiliCookie() {
  // 从配置文件读取Cookie
  if (!BiliCookie || BiliCookie.trim() === '') {
    if (fs.existsSync(_path + "/data/PushNews/BilibiliPushConfig.json")) {
      try {
        const configData = JSON.parse(fs.readFileSync(_path + "/data/PushNews/BilibiliPushConfig.json", "utf8"));
        if (configData.bilibiliCookie && configData.bilibiliCookie.cookie && configData.bilibiliCookie.cookie.trim() !== '') {
          BiliCookie = configData.bilibiliCookie.cookie;
          Bot.logger.mark(`B站推送：从配置文件加载 Cookie (长度: ${BiliCookie.length})`);
        }
      } catch (err) {
        Bot.logger.warn(`B站推送：从配置文件加载 Cookie 失败: ${err.message}`);
      }
    }
  }
  
  // 检查是否有有效的Cookie
  if (!BiliCookie || BiliCookie.trim() === '') {
    Bot.logger.mark('B站推送：未配置有效的 Cookie，B站推送功能无法使用');
    Bot.logger.mark('B站推送：请主人发送 #B站扫码登录 进行配置');
    return false;
  }

  BiliReqHeaders.cookie = BiliCookie;
  Bot.logger.mark(`B站推送：使用扫码登录的 Cookie (长度: ${BiliCookie.length})`);
  
  // 获取当前登录用户的 UID
  await getLoginUserInfo();
  
  return true;
}

// 获取当前登录用户信息（获取 UID）
async function getLoginUserInfo() {
  if (!BiliCookie || BiliCookie.trim() === '') {
    return;
  }

  try {
    const response = await httpClient.get(BiliNavUrl, {
      headers: BiliReqHeaders
    });

    const res = response.data;

    if (res.code === -352) {
      Bot.logger.warn('B站推送：Cookie 已过期或无效，请重新扫码登录');
      return;
    }

    if (res.code !== 0) {
      Bot.logger.warn(`B站推送：获取登录用户信息失败，错误码: ${res.code}`);
      return;
    }

    const data = res?.data;
    if (data && data.mid) {
      BiliUID = data.mid;
      Bot.logger.mark(`B站推送：当前登录用户 UID: ${BiliUID}`);
    }
  } catch (err) {
    Bot.logger.error(`B站推送：获取登录用户信息异常: ${err.message}`);
  }
}

// 生成随机 ID（用于 buvid3 和 b_nut）
function generateRandomId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// 获取用户信息
async function getUserInfo(uid, retryCount = 0) {
  // 检查是否配置了有效的 Cookie
  if (!BiliCookie || BiliCookie.trim() === '') {
    Bot.logger.warn('B站推送：未配置有效的 Cookie');
    return null;
  }

  try {
    const url = `${BiliUserInfoUrl}?mid=${uid}`;
    const response = await httpClient.get(url, {
      headers: BiliReqHeaders
    });

    const res = response.data;

    if (res.code === -352) {
      Bot.logger.warn('B站推送：Cookie 已过期或无效，请重新扫码登录');
      return null;
    }

    if (res.code === 799) {
      Bot.logger.warn(`B站推送：接口访问受限（错误码799），第${retryCount + 1}次遇到`);
      // 重试机制：最多重试3次，每次等待5-10秒
      if (retryCount < 3) {
        let retryDelay = Math.floor(Math.random() * 5) + 5;
        Bot.logger.mark(`B站推送：等待${retryDelay}秒后重试获取用户[${uid}]信息`);
        await common.sleep(retryDelay * 1000);
        return getUserInfo(uid, retryCount + 1);
      } else {
        Bot.logger.warn('B站推送：达到最大重试次数，仍然受限');
        return { error: 799, message: '接口访问受限' };
      }
    }

    if (res.code !== 0) {
      Bot.logger.warn(`B站推送：获取用户信息失败，错误码: ${res.code}, 消息: ${res.message}`);
      return null;
    }

    const data = res?.data;
    if (!data) {
      Bot.logger.warn('B站推送：用户信息数据为空');
      return null;
    }

    return {
      name: data.name || uid,
      face: data.face || '',
      sign: data.sign || ''
    };
  } catch (err) {
    Bot.logger.error(`B站推送：获取用户信息异常: ${err.message}`);
    return null;
  }
}

// B站扫码登录
export async function biliLogin(e) {
  if (!e.isMaster) {
    e.reply("只有主人可以使用扫码登录功能哦");
    return true;
  }

  try {
    // 获取登录二维码
    const response = await httpClient.get(BiliLoginQrcodeUrl + "?source=main-fe-header", {
      headers: BiliReqHeaders
    });

    const res = response.data;

    if (res.code !== 0) {
      e.reply(`获取登录二维码失败：${res.message}`);
      return true;
    }

    const qrcodeData = res?.data;
    if (!qrcodeData || !qrcodeData.url || !qrcodeData.qrcode_key) {
      e.reply("登录二维码数据异常");
      return true;
    }

    // 生成二维码图片
    const qrCodeUrl = qrcodeData.url;
    const qrcodeKey = qrcodeData.qrcode_key;

    // 使用 qrcode 库生成二维码
    let qrImage;
    try {
      const QRCode = (await import('qrcode')).default;
      qrImage = await QRCode.toBuffer(qrCodeUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (err) {
      Bot.logger.error(`B站推送：生成二维码失败: ${err.message}`);
      e.reply("生成二维码失败，请检查是否安装了 qrcode 依赖");
      return true;
    }

    // 构建消息：二维码 + 风险提示
    const msg = [
      segment.image(qrImage),
      "\n请使用 B站手机 APP 扫码登录\n二维码有效期 3 分钟\n\n⚠️ 风险提示：\n1. 扫码登录会将您的 B站 账号与此机器人关联\n2. Cookie 包含您的登录凭证，请勿泄露给他人\n3. 建议使用小号或测试账号进行扫码\n4. 如有顾虑，可随时在配置中删除 Cookie"
    ];

    // 发送二维码和提示
    let qrMessage;
    if (e.isGroup) {
      qrMessage = await e.group.sendMsg(msg);
    } else {
      qrMessage = await e.reply(msg);
    }

    // 记录二维码消息ID，用于撤回
    const qrMessageId = qrMessage?.message_id;

    // 设置2分钟超时撤回
    const timeoutId = setTimeout(() => {
      if (qrMessageId) {
        if (e.isGroup) {
          e.group.recallMsg(qrMessageId).catch(() => {});
        } else {
          e.group?.recallMsg(qrMessageId).catch(() => {});
        }
      }
    }, 120000); // 2分钟后撤回

    // 轮询登录状态（优化轮询策略）
    const maxAttempts = 120; // 最多轮询 120 次（2分钟）
    let attempts = 0;
    let isScanned = false; // 是否已扫描

    // 使用渐进式轮询策略
    const pollLogin = async () => {
      attempts++;

      if (attempts > maxAttempts) {
        e.reply("登录超时，请重新扫码");
        if (qrMessageId) {
          try {
            if (e.isGroup) {
              await e.group.recallMsg(qrMessageId);
            } else {
              await e.group?.recallMsg(qrMessageId);
            }
          } catch (err) {
            // 忽略撤回失败
          }
        }
        return;
      }

      try {
        const pollResponse = await httpClient.get(`${BiliLoginInfoUrl}?qrcode_key=${qrcodeKey}&source=main-fe-header`, {
          headers: BiliReqHeaders
        });

        const pollRes = pollResponse.data;

        if (pollRes.code === 0) {
          const dataCode = pollRes.data?.code;
          
          if (dataCode === 0) {
            // 登录成功，处理Cookie
            await handleLoginSuccess(pollResponse, e, qrMessageId);
            return;
          } else if (dataCode === 86038) {
            // 二维码已失效
            e.reply("二维码已失效，请重新扫码");
            return;
          } else if (dataCode === 86090) {
            // 等待扫码
            if (!isScanned) {
              Bot.logger.mark("B站推送：等待扫码...");
            }
          } else if (dataCode === 86101) {
            // 已扫码，等待确认
            if (!isScanned) {
              Bot.logger.mark("B站推送：已扫码，等待确认...");
              isScanned = true;
            }
          }
        }
      } catch (err) {
        Bot.logger.error(`B站推送：轮询登录状态异常: ${err.message}`);
      }

      // 继续轮询
      scheduleNextPoll();
    };

    // 渐进式轮询间隔
    const scheduleNextPoll = () => {
      let nextDelay = 1000; // 默认1秒
      if (attempts < 10) {
        nextDelay = 1000; // 前10次，1秒
      } else if (attempts < 30) {
        nextDelay = 2000; // 10-30次，2秒
      } else {
        nextDelay = 3000; // 30次后，3秒
      }
      setTimeout(pollLogin, nextDelay);
    };

    // 开始轮询
    pollLogin();

  } catch (err) {
    Bot.logger.error(`B站推送：扫码登录异常: ${err.message}`);
    e.reply("扫码登录失败，请稍后重试");
  }

  return true;
}

// 处理登录成功
async function handleLoginSuccess(pollResponse, e, qrMessageId) {
  try {
    // Cookie已经由cookiejar自动管理，不需要手动解析
    const setCookieHeaders = pollResponse.headers['set-cookie'];
    if (!setCookieHeaders || setCookieHeaders.length === 0) {
      e.reply("登录成功但未获取到Cookie，请重试");
      return;
    }

    // 手动设置cookie到cookiejar
    for (const cookieStr of setCookieHeaders) {
      try {
        await cookieJar.setCookie(cookieStr, 'https://passport.bilibili.com');
      } catch (err) {
        Bot.logger.warn(`B站推送：设置Cookie失败: ${err.message}`);
      }
    }

    // 获取DedeUserID
    const SESSDATA = await getCookieValue('SESSDATA');
    const DedeUserID = await getCookieValue('DedeUserID');
    
    if (!SESSDATA || !DedeUserID) {
      e.reply("登录成功但Cookie不完整，请重试");
      return;
    }

    BiliUID = parseInt(DedeUserID);

    Bot.logger.mark(`B站推送：登录成功，DedeUserID=${BiliUID}`);

    // 获取并保存UID
    await getLoginUserInfo();

    // 保存到配置文件（只保存SESSDATA、bili_jct、DedeUserID）
    const biliJct = await getCookieValue('bili_jct');
    const DedeUserIDCkMd5 = await getCookieValue('DedeUserID__ckMd5');
    const cookieString = `SESSDATA=${SESSDATA}; bili_jct=${biliJct}; DedeUserID=${DedeUserID}; DedeUserID__ckMd5=${DedeUserIDCkMd5};`;
    
    BiliCookie = cookieString;
    BiliReqHeaders.cookie = cookieString;

    // 保存到配置文件
    try {
      if (!BilibiliPushConfig.bilibiliCookie) {
        BilibiliPushConfig.bilibiliCookie = {};
      }
      BilibiliPushConfig.bilibiliCookie.cookie = cookieString;
      await saveConfigJson();
      Bot.logger.mark('B站推送：Cookie已保存到配置文件');
    } catch (err) {
      Bot.logger.warn(`B站推送：保存Cookie到配置文件失败: ${err.message}`);
    }

    // 撤回二维码
    if (qrMessageId) {
      try {
        if (e.isGroup) {
          await e.group.recallMsg(qrMessageId);
        } else {
          await e.group?.recallMsg(qrMessageId);
        }
      } catch (err) {
        // 忽略撤回失败
      }
    }

    e.reply(`✅ 扫码登录成功！\n当前登录用户ID：${BiliUID}\nCookie已保存，可以开始使用B站推送功能`);

  } catch (err) {
    Bot.logger.error(`B站推送：处理登录成功状态异常: ${err.message}`);
    e.reply("登录成功但处理Cookie失败，请重试");
  }
}

// 从登录 URL 中提取 Cookie
function extractCookieFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    let cookie = '';
    const cookieKeys = ['SESSDATA', 'bili_jct', 'DedeUserID'];

    cookieKeys.forEach(key => {
      const value = params.get(key);
      if (value) {
        cookie += `${key}=${value}; `;
      }
    });

    return cookie.trim();
  } catch (err) {
    Bot.logger.error(`B站推送：提取 Cookie 失败: ${err.message}`);
    return null;
  }
}

async function initBiliPushJson() {
  if (fs.existsSync(_path + "/data/PushNews/PushBilibiliDynamic.json")) {
    PushBilibiliDynamic = JSON.parse(fs.readFileSync(_path + "/data/PushNews/PushBilibiliDynamic.json", "utf8"));
  } else {
    savePushJson();
  }

  if (fs.existsSync(_path + "/data/PushNews/BilibiliPushConfig.json")) {
    BilibiliPushConfig = JSON.parse(fs.readFileSync(_path + "/data/PushNews/BilibiliPushConfig.json", "utf8"));

    // 如果设置了过期时间
    let faultTime = Number(BilibiliPushConfig.dynamicPushFaultTime);
    let temp = DynamicPushTimeInterval;
    if (!isNaN(faultTime)) {
      temp = common.getRightTimeInterval(faultTime);
      temp = temp < 1 ? 1 : temp; // 兼容旧设置
      temp = temp > 24 ? 24 : temp; // 兼容旧设置
      temp = temp * 60 * 60 * 1000;
    }
    DynamicPushTimeInterval = temp; // 允许推送多久以前的动态

    // 如果设置了间隔时间
    let timeInter = Number(BilibiliPushConfig.dynamicPushTimeInterval);
    if (!isNaN(timeInter)) {
      pushTimeInterval = common.getRightTimeInterval(timeInter);
    }

  } else {
    BilibiliPushConfig = {
      allowPrivate: true,
    };
    saveConfigJson();
  }
}

initBiliPushJson(); // 初始化配置

// 初始化 Cookie
const cookieStatus = await initBiliCookie();
if (!cookieStatus) {
  Bot.logger.mark('B站推送：未配置有效的 Cookie，B站推送功能无法使用');
  Bot.logger.mark('B站推送：请主人发送 #B站扫码登录 进行配置');
}

// (开启|关闭)B站推送
export async function changeBilibiliPush(e) {
  // 是否允许使用这个功能
  if (!isAllowPushFunc(e)) {
    return false;
  }

  if (e.isGroup && !common.isGroupAdmin(e) && !e.isMaster) {
    e.reply("只有管理员和master才可以操作哦");
    return true;
  }

  // 推送对象记录
  let pushID = "";
  if (e.isGroup) {
    pushID = e.group_id;
  } else {
    pushID = e.user_id;
  }
  if (!pushID) {
    return true;
  }

  if (e.msg.includes("开启")) {
    let info = PushBilibiliDynamic[pushID];
    if (!info) {
      PushBilibiliDynamic[pushID] = {
        isNewsPush: true, // 是否开启了推送
        allowPush: true, // 是否允许推送，不允许的话开启了推送也没用呢
        adminPerm: true, 
        isGroup: e.isGroup || false,
        biliUserList: [
          { uid: "401742377", name: "原神" },
          { uid: "1636034895", name: "绝区零" },
          { uid: "1340190821", name: "崩坏星穹铁道" },
          { uid: "3546886017387331", name: "崩坏因缘精灵" },
          { uid: "27534330", name: "崩坏3第一偶像爱酱" },
          { uid: "3546720675826241", name: "妄想天使唯一指定官号" },
          { uid: "609035442", name: "会飞的芒果猫" }
        ], // 默认推送多个B站官方账号
        pushTarget: pushID,
        pushTargetName: e.isGroup ? e.group_name : e.sender?.nickname,
      };
    } else {
      PushBilibiliDynamic[pushID].isNewsPush = true;
    }
    savePushJson();
    Bot.logger.mark(`开启B站动态推送:${pushID}`);
    e.reply(`B站动态推送开启了哦~\n每间隔${pushTimeInterval}分钟会自动检测一次有没有新动态\n如果有的话会自动发送动态内容到这里的~`);
  }

  if (e.msg.includes("关闭")) {
    if (PushBilibiliDynamic[pushID]) {
      PushBilibiliDynamic[pushID].isNewsPush = false;
      savePushJson();
      Bot.logger.mark(`关闭B站动态推送:${pushID}`);
      e.reply(`这里的B站动态推送已经关闭了，${botname}再也不会提醒你动态更新了，哼！`);
    } else {
      e.reply("你还没有在这里开启过B站动态推送呢");
    }
  }

  return true;
}

// (开启|关闭|允许|禁止)群B站推送
export async function changeGroupBilibiliPush(e) {
  if (!e.isMaster) {
    return false;
  }

  let commands = e.msg.split("群B站推送");
  let command = commands[0];
  let groupID = commands[1].trim();
  if (!groupID) {
    e.reply(`群ID呢？没有群ID我可干不了这活\n示例：${command}群B站推送 254740428`);
    return true;
  }
  if (isNaN(Number(groupID))) {
    e.reply(`${groupID} ←这东西真的是群ID么？\n示例：${command}群B站推送 254740428`);
    return true;
  }

  let group = Bot.gl.get(Number(groupID));
  if (!group) {
    e.reply(`${botname}不在这个群哦`);
    return true;
  }
  // 没有开启过的话，那就给初始化一个
  if (!PushBilibiliDynamic[groupID]) {
    PushBilibiliDynamic[groupID] = {
      isNewsPush: true,
      allowPush: true,
      adminPerm: true,
      isGroup: true,
      biliUserList: [
        { uid: "401742377", name: "原神" },
        { uid: "1636034895", name: "绝区零" },
        { uid: "1340190821", name: "崩坏星穹铁道" },
        { uid: "3546886017387331", name: "崩坏因缘精灵" },
        { uid: "27534330", name: "崩坏3第一偶像爱酱" },
        { uid: "3546720675826241", name: "妄想天使唯一指定官号" },
        { uid: "609035442", name: "会飞的芒果猫" }
      ], // 默认推送多个B站官方账号
      pushTarget: groupID,
      pushTargetName: group.group_name,
    };
  }

  switch (command) {
    case "开启":
    case "#开启":
      PushBilibiliDynamic[groupID].isNewsPush = true;
      break;
    case "关闭":
    case "#关闭":
      PushBilibiliDynamic[groupID].isNewsPush = false;
      break;
    case "允许":
    case "#允许":
      PushBilibiliDynamic[groupID].allowPush = true;
      break;
    case "禁止":
    case "#禁止":
      PushBilibiliDynamic[groupID].allowPush = false;
      break;
  }

  savePushJson();
  e.reply(`【${group.group_name}】设置${command}推送成功~`);
  return true;
}

// (允许|禁止)B站私聊推送
export async function changeBiliPushPrivatePermission(e) {
  if (!e.isMaster) {
    return false;
  }

  if (e.msg.indexOf("允许") > -1) {
    BilibiliPushConfig.allowPrivate = true;
  }
  if (e.msg.indexOf("禁止") > -1) {
    BilibiliPushConfig.allowPrivate = false;
  }
  e.reply("设置成功！");
  return true;
}

// (开启|关闭)B站推送群权限
export async function bilibiliPushPermission(e) {
  if (!e.isMaster) {
    return false;
  }

  let commands = e.msg.split("B站推送群权限");
  let command = commands[0];
  let groupID = commands[1].trim();
  let commAllList = ["all", "全部", "所有"];
  if (!groupID) {
    e.reply("必须要有群ID的哦");
    return true;
  }

  if (commAllList.indexOf(groupID) > -1) {
    for (let key in PushBilibiliDynamic) {
      if (PushBilibiliDynamic[key].isGroup) {
        PushBilibiliDynamic[key].adminPerm = command === "开启";
      }
    }

    await savePushJson();
    e.reply(`好了，全${command}了(*^▽^*)`);
    return true;
  }

  if (isNaN(Number(groupID))) {
    e.reply(`${groupID} ←这东西真的是群ID么？\n示例：${command}B站推送群权限 254740428`);
    return true;
  }

  let group = Bot.gl.get(Number(groupID));
  if (!group) {
    e.reply(`${botname}不在这个群哦`);
    return true;
  }

  if (!PushBilibiliDynamic[groupID]) {
        PushBilibiliDynamic[groupID] = {
          isNewsPush: true,
          allowPush: true,
          adminPerm: true,
          isGroup: true,
          biliUserList: [
            { uid: "401742377", name: "原神" },
            { uid: "1636034895", name: "绝区零" },
            { uid: "1340190821", name: "崩坏星穹铁道" },
            { uid: "3546886017387331", name: "崩坏因缘精灵" },
            { uid: "27534330", name: "崩坏3第一偶像爱酱" },
            { uid: "3546720675826241", name: "妄想天使唯一指定官号" },
            { uid: "609035442", name: "会飞的芒果猫" }
          ], // 默认推送多个B站官方账号
          pushTarget: groupID,
          pushTargetName: group.group_name,
        };
      }
  PushBilibiliDynamic[groupID].adminPerm = command === "开启";

  await savePushJson();
  e.reply(`【${group.group_name}】已${command}B站推送狗管理权限`);

  return true;
}

// 新增/删除B站动态推送UID
export async function updateBilibiliPush(e) {
  // 是否允许使用这个功能
  if (!isAllowPushFunc(e)) {
    return false;
  }

  if (e.isGroup && !common.isGroupAdmin(e) && !e.isMaster) {
    e.reply("只有管理员和master才可以操作哦");
    return true;
  }

  // 推送对象记录
  let pushID = "";
  if (e.isGroup) {
    pushID = e.group_id;
  } else {
    pushID = e.user_id;
  }
  if (!pushID) {
    return true;
  }
  let temp = PushBilibiliDynamic[pushID];
  if (!temp) {
    e.reply("你特喵的没在这开启过B站动态推送");
    return true;
  }

  let msgList = e.msg.split("B站推送");
  const addComms = ["订阅", "添加", "新增", "增加", "#订阅", "#添加", "#新增", "#增加"];
  const delComms = ["删除", "移除", "去除", "取消", "#删除", "#移除", "#去除", "#取消"];

  let uid = msgList[1].trim();
  let operComm = msgList[0];
  // uid或者用户名可不能缺
  if (!uid) {
    e.reply(`UID呢？没有UID${botname}可干不了这活\n示例：${operComm}B站推送 609035442`);
    return true;
  }

  let uids = temp.biliUserList.map((item) => item.uid);
  let names = temp.biliUserList.map((item) => item.name);
  // 删除B站推送的时候，可以传UID也可以传用户名
  if (delComms.indexOf(operComm) > -1) {
    let isExist = false;

    if (uids.indexOf(uid) > -1) {
      PushBilibiliDynamic[pushID].biliUserList = temp.biliUserList.filter((item) => item.uid != uid);
      isExist = true;
    }
    if (names.indexOf(uid) > -1) {
      PushBilibiliDynamic[pushID].biliUserList = temp.biliUserList.filter((item) => item.name != uid);
      isExist = true;
    }

    if (!isExist) {
      e.reply("嘶，这个B站用户你好像没添加过");
      return true;
    }

    savePushJson();
    e.reply("删掉啦~后悔了就再加回来吧");

    return true;
  }

  if (isNaN(Number(uid))) {
    e.reply(`${uid} <- 这东西不是UID吧？\n示例：${operComm}B站推送 609035442\n⚠️如确认uid正确请尝试将B站ck替换为自己获取的`);
    return true;
  }

  // 添加只能是 uid 的方式添加
  if (addComms.indexOf(operComm) > -1) {
    if (uids.indexOf(uid) > -1) {
      e.reply("嘶，这个UID已经加过了");
      return true;
    }

    // 检查是否配置了有效的 Cookie
    if (!BiliCookie || BiliCookie.trim() === '') {
      e.reply("⚠️ 检测到未配置B站 Cookie\n请主人发送 #B站扫码登录 后再添加订阅");
      return true;
    }

    // 先获取用户信息
    let userInfo = await getUserInfo(uid);
    if (!userInfo) {
      e.reply("⚠️ 无法获取用户信息，可能的原因：\n1. UID 错误\n2. B站接口限制\n3. Cookie 已过期\n\n请尝试：\n- 检查UID是否正确\n- 发送 #B站扫码登录 更新Cookie");
      return true;
    }

    if (userInfo.error === 799) {
      e.reply("⚠️ 无法获取用户信息（错误码799）\n\n可能的原因：\n1. B站接口访问频率限制\n2. 当前Cookie账号可能被风控\n3. 请求过于频繁触发限制\n\n解决方案：\n- 等待几分钟后重试\n- 发送 #B站扫码登录 更新Cookie\n- 确认UID是否正确\n\n如持续出现此问题，建议联系管理员");
      return true;
    }

    PushBilibiliDynamic[pushID].biliUserList.push({ uid, name: userInfo.name });
    savePushJson();
    e.reply(`添加成功~\n${userInfo.name}：${uid}`);
  }

  return true;
}

// 返回当前聊天对象推送的B站用户列表
export async function getBilibiliPushUserList(e) {
  // 是否允许使用这个功能
  if (!isAllowPushFunc(e)) {
    return false;
  }

  if (e.msg.indexOf("群") > -1) {
    if (!e.isMaster) {
      return false;
    }

    let groupMap = Bot.gl;
    let groupList = [];
    for (let [groupID, groupObj] of groupMap) {
      groupID = "" + groupID;
      let info = PushBilibiliDynamic[groupID];
      if (!info) {
        groupList.push(`${groupObj.group_name}(${groupID})：未开启，允许使用`);
      } else {
        PushBilibiliDynamic[groupID].pushTargetName = groupObj.group_name;
        let tmp = PushBilibiliDynamic[groupID];
        groupList.push(
          `${groupObj.group_name}(${groupID})：${tmp.isNewsPush ? "已开启" : "已关闭"}，${tmp.adminPerm === false ? "无权限" : "有权限"}，${
            tmp.allowPush === false ? "禁止使用" : "允许使用"
          }`
        );
      }
    }

    e.reply(`B站推送各群使用情况：\n${groupList.join("\n")}`);

    return true;
  }

  // 推送对象记录
  let pushID = "";
  if (e.isGroup) {
    pushID = e.group_id;
  } else {
    pushID = e.user_id;
  }
  if (!pushID) {
    return true;
  }
  if (!PushBilibiliDynamic[pushID]) {
    return e.reply("要开启B站推送才能查哦");
  }

  let push = PushBilibiliDynamic[pushID];
  let info = push.biliUserList
    .map((item) => {
      return `${item.name}：${item.uid}`;
    })
    .join("\n");
  let status = push.isNewsPush ? "开启" : "关闭";
  e.reply(`当前B站推送是【${status}】状态哦\n推送的B站用户有：\n${info}`);

  return true;
}

export async function setBiliPushCookie(e) {
  if (!e.isMaster) {
    e.reply(`只有主人才可以命令榴莲哦`);
    return false;
  }
  
  e.reply("⚠️ 本插件已移除手动配置 Cookie 功能\n请使用扫码登录功能获取 Cookie\n\n发送指令：#B站扫码登录\n使用B站手机APP扫描二维码即可自动配置");
  return true;
}

// 设置B站推送定时任务时间
export async function setBiliPushTimeInterval(e) {
  if (!e.isMaster) {
    return false;
  }

  let time = e.msg.split("B站推送时间")[1].trim();
  time = Number(time);
  if (time <= 0 || time >= 60) {
    e.reply("请正确填写时间\n时间单位：分钟，范围[1-60)\n示例：B站推送时间 10");
    return true;
  }

  BilibiliPushConfig.dynamicPushTimeInterval = time;
  await saveConfigJson();
  e.reply(`设置间隔时间 ${time}分钟 成功，重启后生效~\n请手动重启或发送#重启`);

  return true;
}

// 设置B站推送过期时间
export async function setBiliPushFaultTime(e) {
  if (!e.isMaster) {
    return false;
  }

  let time = e.msg.split("B站推送过期时间")[1].trim();
  time = Number(time);
  if (time < 1 || time > 24) {
    e.reply("请正确填写时间\n时间单位：小时，范围[1-24]\n示例：B站推送过期时间 9");
    return true;
  }

  BilibiliPushConfig.dynamicPushFaultTime = time;
  await saveConfigJson();
  e.reply(`设置过期时间 ${time}小时 成功，重启后生效~\n请手动重启或发送#重启`);

  return true;
}

// (开启|关闭)B站转发推送
export async function changeBiliPushTransmit(e) {
  if (!isAllowPushFunc(e)) {
    return false;
  }
  if (e.isGroup && !common.isGroupAdmin(e) && !e.isMaster) {
    e.reply("只有管理员和master才可以操作哦");
    return true;
  }

  let pushID = "";
  if (e.isGroup) {
    pushID = e.group_id;
  } else {
    pushID = e.user_id;
  }
  let info = PushBilibiliDynamic[pushID];
  if (!info) {
    e.reply("嘶，你还没在这开启过B站动态推送呢");
    return true;
  }
  if (e.msg.indexOf("开启") > -1) {
    PushBilibiliDynamic[pushID].pushTransmit = true;
    e.reply("设置成功~转发的动态也会推送了哦");
  }
  if (e.msg.indexOf("关闭") > -1) {
    PushBilibiliDynamic[pushID].pushTransmit = false;
    e.reply("好滴~不会推送转发的动态了哦");
  }

  await savePushJson();
  return true;
}

// 设置B站推送(默认|合并|图片)
export async function setBiliPushSendType(e) {
  if (!isAllowPushFunc(e)) {
    return false;
  }
  if (e.isGroup && !common.isGroupAdmin(e) && !e.isMaster) {
    e.reply("只有管理员和master才可以操作哦");
    return true;
  }

  let pushID = "";
  if (e.isGroup) {
    pushID = e.group_id;
  } else {
    pushID = e.user_id;
  }
  let info = PushBilibiliDynamic[pushID];
  if (!info) {
    e.reply("你还没在这开启过B站动态推送呢");
    return true;
  }
  let type = e.msg.substr(e.msg.length - 2);
  let typeCode = "";
  switch (type) {
    case "默认":
      typeCode = "default";
      break;
    case "合并":
      typeCode = "merge";
      break;
    case "图片":
      typeCode = "picture";
      break;
  }
  if (e.msg.indexOf("全局") > -1) {
    BilibiliPushConfig.sendType = typeCode;
    type = "全局" + type;
    await saveConfigJson();
  } else {
    PushBilibiliDynamic[pushID].sendType = typeCode;
    await savePushJson();
  }
  e.reply(`设置B站推送方式【${type}】成功！`);
  return true;
}

// 推送定时任务
export async function pushScheduleJob(e = {}) {
  if (e.msg) return false; 
  if (e.msg && !e.isMaster) {
    return false;
  }
  
  // 没有任何人正在开启B站推送
  if (Object.keys(PushBilibiliDynamic).length === 0) {
    return true;
  }

  // 推送之前先初始化，拿到历史推送，但不能频繁去拿，为空的时候肯定要尝试去拿
  if (dynamicPushHistory.length === 0) {
    let temp = await redis.get("liulian:bilipush:history");
    if (!temp) {
      dynamicPushHistory = [];
    } else {
      dynamicPushHistory = JSON.parse(temp);
    }
  }
  Bot.logger.mark("liulian-plugin —— B站动态定时推送");
  // 将上一次推送的动态全部合并到历史记录中
  let hisMap = new Map();
  // 从已有历史记录初始化Map
  for (let item of dynamicPushHistory) {
    hisMap.set(item.id_str, item);
  }
  // 添加新推送的动态
  for (let [userId, pushList] of nowDynamicPushList) {
    for (let msg of pushList) {
      let author = msg?.modules?.module_author || {};
      let pubTime = author?.pub_ts || 0;
      hisMap.set(msg.id_str, {
        id_str: msg.id_str,
        pub_time: pubTime,
        update_time: Date.now()
      });
    }
  }
  dynamicPushHistory = [...hisMap.values()];
  await redis.set("liulian:bilipush:history", JSON.stringify(dynamicPushHistory), { EX: 24 * 60 * 60 }); // 仅存储一次，过期时间24小时
  nowPushDate = Date.now();
  nowDynamicPushList = new Map(); // 清空上次的推送列表
  let temp = PushBilibiliDynamic;
  
  // 收集所有需要推送的用户，然后分批处理
  let allPushTasks = [];
  for (let user in temp) {
    temp[user].pushTarget = user;
    if (isAllowSchedulePush(temp[user])) {
      allPushTasks.push({
        pushInfo: temp[user],
        users: temp[user].biliUserList
      });
    }
  }
  
  // 分批处理，每批处理一个用户，使用随机延迟
  const hasNewDynamic = await processBatchPush(allPushTasks);
  
  // 只有成功推送后才更新lastSuccessfulPushDate，避免漏推
  if (hasNewDynamic) {
    lastSuccessfulPushDate = nowPushDate;
  }
  
  // 返回是否有新动态
  return { hasNewDynamic };
}

// 分批处理推送任务，按动态推送策略
async function processBatchPush(allPushTasks) {
  // 第一步：收集所有需要推送的动态（去重）
  let allDynamics = new Map(); // 使用Map去重，key为动态ID
  
  for (let task of allPushTasks) {
    let { pushInfo, users } = task;
    
    for (let i = 0; i < users.length; i++) {
      let user = users[i];
      let biliUID = user.uid;

      // 检查是否已经请求过这个用户的动态
      let lastPushList = nowDynamicPushList.get(biliUID);
      if (lastPushList) {
        // 将动态添加到全局列表
        for (let dynamic of lastPushList) {
          if (!allDynamics.has(dynamic.id_str)) {
            allDynamics.set(dynamic.id_str, {
              dynamic: dynamic,
              biliUser: user,
              pushTargets: []
            });
          }
          // 添加推送目标（避免重复）
          let target = allDynamics.get(dynamic.id_str);
          if (!target.pushTargets.includes(pushInfo.pushTarget)) {
            target.pushTargets.push(pushInfo.pushTarget);
          }
        }
        continue;
      }

      // 带重试机制的动态获取
      let pushList = await fetchUserDynamicWithRetry(pushInfo, user, biliUID);
      
      if (pushList && pushList.length > 0) {
        // 将动态添加到全局列表
        for (let dynamic of pushList) {
          if (!allDynamics.has(dynamic.id_str)) {
            allDynamics.set(dynamic.id_str, {
              dynamic: dynamic,
              biliUser: user,
              pushTargets: []
            });
          }
          // 添加推送目标（避免重复）
          let target = allDynamics.get(dynamic.id_str);
          if (!target.pushTargets.includes(pushInfo.pushTarget)) {
            target.pushTargets.push(pushInfo.pushTarget);
          }
        }
        
        // 估算阅读时间，用于延迟
        let readingTime = estimateReadingTime(pushList);
        Bot.logger.mark(`B站推送：用户[${biliUID}]有 ${pushList.length} 条新动态，估算阅读时间=${readingTime}秒`);
        
        // 基于估算阅读时间调整下次查询的随机延迟，避免被检测
        // 在估算时间的50%-150%之间波动，增加规律性
        let delayRange = Math.max(15, readingTime); // 至少15秒
        let minDelay = Math.floor(delayRange * 0.5);  // 下限：50%
        let maxDelay = Math.floor(delayRange * 1.5);  // 上限：150%
        let actualDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        
        Bot.logger.mark(`B站推送：等待${actualDelay}秒后处理下一个用户（基于估算阅读时间${readingTime}秒）`);
        await common.sleep(actualDelay * 1000);
      } else {
        // 没有新动态，使用基础随机延迟30-60秒
        let baseDelay = Math.floor(Math.random() * 30) + 30;
        Bot.logger.mark(`B站推送：等待${baseDelay}秒后处理下一个用户（无新动态）`);
        await common.sleep(baseDelay * 1000);
      }
    }
  }
  
  // 第二步：按动态推送（每条动态推给所有群）
  let dynamicIndex = 0;
  for (let [dynamicId, dynamicData] of allDynamics) {
    dynamicIndex++;
    let { dynamic, biliUser, pushTargets } = dynamicData;
    
    Bot.logger.mark(`B站推送：开始推送动态[${dynamicIndex}/${allDynamics.size}] [${dynamicId}] 到 ${pushTargets.length} 个群`);
    
    // 构建消息
    let msg = buildSendDynamic(biliUser, dynamic, { sendType: 'default' });
    
    if (!msg || msg === "can't push transmit") {
      Bot.logger.warn(`B站推送：动态信息解析失败或跳过转发 [${dynamicId}]`);
      continue;
    }
    
    // 推送给所有群
    for (let pushTarget of pushTargets) {
      try {
        // 获取该群的推送配置
        let pushInfo = PushBilibiliDynamic[pushTarget];
        if (!pushInfo) continue;
        
        let sendType = getSendType(pushInfo);
        let finalMsg = msg;
        if (sendType === "merge") {
          finalMsg = await common.replyMake(msg, pushInfo.isGroup, msg[0]);
        }
        
        if (pushInfo.isGroup) {
          await Bot.pickGroup(pushTarget)
            .sendMsg(finalMsg)
            .catch((err) => {
              Bot.logger.error(`B站推送：群[${pushTarget}]推送失败: ${err.message}`);
              return pushAgain(pushTarget, finalMsg);
            });
        } else {
          await common.relpyPrivate(pushTarget, finalMsg);
        }
        
        Bot.logger.mark(`B站推送：成功推送动态 [${dynamicId}] 到 群[${pushTarget}]`);
        
        // 群之间有短暂延迟（500ms）
        await common.sleep(500);
      } catch (err) {
        Bot.logger.error(`B站推送：发送动态异常 [${dynamicId}]: ${err.message}`);
      }
    }
    
    // 动态之间有延迟（30-60秒）
    if (dynamicIndex < allDynamics.size) {
      let delayBetweenDynamics = Math.floor(Math.random() * 30) + 30;
      Bot.logger.mark(`B站推送：等待${delayBetweenDynamics}秒后推送下一条动态`);
      await common.sleep(delayBetweenDynamics * 1000);
    }
  }
  
  // 返回是否有新动态
  return allDynamics.size > 0;
}

// 带重试机制的动态获取（只获取，不发送）
async function fetchUserDynamicWithRetry(pushInfo, user, biliUID, retryCount = 0) {
  const maxRetries = 3;
  
  try {
    let pushList = await fetchUserDynamic(pushInfo, user, biliUID);
    nowDynamicPushList.set(biliUID, pushList);
    
    return pushList; // 返回动态列表，不发送
  } catch (err) {
    if (retryCount < maxRetries) {
      Bot.logger.warn(`B站推送：获取用户[${biliUID}]动态失败，第${retryCount + 1}次重试，错误: ${err.message}`);
      // 失败后等待5-15秒重试
      let retryDelay = Math.floor(Math.random() * 10) + 5;
      await common.sleep(retryDelay * 1000);
      return fetchUserDynamicWithRetry(pushInfo, user, biliUID, retryCount + 1);
    } else {
      Bot.logger.error(`B站推送：获取用户[${biliUID}]动态失败，已达最大重试次数，错误: ${err.message}`);
      nowDynamicPushList.set(biliUID, []);
      return []; // 返回空数组
    }
  }
}

// 获取用户动态（不包含发送），返回动态列表和估算的阅读时间
async function fetchUserDynamic(pushInfo, user, biliUID) {
  let url = `${BiliDynamicApiUrl}?host_mid=${biliUID}&timezone_offset=-480&features=itemOpusStyle`;
  let pushList = [];

  Bot.logger.mark(`B站推送：准备获取用户[${biliUID}]的动态`);
  Bot.logger.mark(`B站推送：当前Cookie: ${BiliReqHeaders.cookie ? BiliReqHeaders.cookie.substring(0, 20) + '...' : '未配置'}`);

  // 使用BiliReqHeaders，Cookie已经包含了DedeUserID
  const response = await httpClient.get(url, {
    headers: BiliReqHeaders
  });

  const res = response.data;

  if (res.code === -352) {
    Bot.logger.warn('B站推送：Cookie 已过期或无效，请重新扫码登录');
    return [];
  }

  if (res.code === 799) {
    Bot.logger.warn(`B站推送：获取动态接口访问受限（错误码799），用户[${biliUID}]`);
    throw new Error(`接口访问受限（错误码799）`);
  }

  if (res.code !== 0) {
    throw new Error(`错误码: ${res.code}, 消息: ${res.message}`);
  }

  let data = res?.data?.items || [];
  if (data.length === 0) {
    Bot.logger.mark(`B站推送：用户[${biliUID}]暂无新动态`);
    return [];
  }

  // 筛选需要推送的动态
  for (let val of data) {
    let author = val?.modules?.module_author || {};
    if (!author?.pub_ts) continue;

    let pubTime = author.pub_ts * 1000;
    // 使用lastSuccessfulPushDate来判断是否过期，避免因推送失败导致漏推
    // 如果上一次推送成功后，动态发布时间早于过期时间，就不推送
    if (lastSuccessfulPushDate - pubTime > DynamicPushTimeInterval) {
      continue;
    }
    pushList.push(val);
  }

  // 去重
  pushList = rmDuplicatePushList(pushList);
  
  if (pushList.length > 0) {
    Bot.logger.mark(`B站推送：用户[${biliUID}]有 ${pushList.length} 条新动态待推送`);
    // 记录每条动态的详细信息
    pushList.forEach((item, index) => {
      let author = item?.modules?.module_author || {};
      let pubTime = author?.pub_ts || 0;
      let pubDate = new Date(pubTime * 1000).toLocaleString('zh-CN');
      Bot.logger.mark(`B站推送：动态[${index + 1}] ID=${item.id_str}, 发布时间=${pubDate}`);
    });
  }
  
  return pushList;
}

// 估算动态内容的阅读时间（秒）
function estimateReadingTime(pushList) {
  if (!pushList || pushList.length === 0) {
    return 10; // 默认10秒
  }
  
  let totalTextLength = 0;
  let totalImageCount = 0;
  
  for (let dynamic of pushList) {
    // 估算文字长度
    let textLength = 0;
    let major = dynamic?.modules?.module_dynamic?.major;
    
    // 新版API：文字动态和图文动态的文本都在major.opus.summary.text中
    if (major && major.type === 'MAJOR_TYPE_OPUS' && major.opus && major.opus.summary) {
      textLength += String(major.opus.summary.text || '').length;
      // 估算图片数量
      if (major.opus.pics) {
        totalImageCount += major.opus.pics.length;
      }
    } else if (major) {
      // 其他类型动态
      if (major.type === 'MAJOR_TYPE_ARCHIVE') {
        // 视频动态，按1张图片算
        totalImageCount += 1;
      } else if (major.type === 'MAJOR_TYPE_ARTICLE') {
        // 专栏动态，按2张图片算
        totalImageCount += 2;
      }
    }
    
    totalTextLength += textLength;
  }
  
  // 估算阅读时间：文字每100字5秒，每张图片10秒
  let textTime = Math.ceil(totalTextLength / 100) * 5;
  let imageTime = totalImageCount * 10;
  let baseTime = 10; // 基础时间10秒
  
  let totalReadingTime = baseTime + textTime + imageTime;
  
  // 限制在10-60秒之间
  return Math.max(10, Math.min(60, totalReadingTime));
}

// 定时任务是否给这个QQ对象推送B站动态
function isAllowSchedulePush(user) {
  if (botConfig.masterQQ.includes(Number(user.pushTarget))) return true; // 主人的命令就是一切！
  if (!user.isNewsPush) return false; // 不推那当然。。不推咯
  if (user.allowPush === false) return false; // 信息里边禁止使用推送功能了，那直接禁止
  if (!BilibiliPushConfig.allowPrivate && !user.isGroup) return false; // 禁止私聊推送并且不是群聊，直接禁止
  return true;
}

// 历史推送过的动态，这一轮不推
function rmDuplicatePushList(newList) {
  if (newList && newList.length === 0) return newList;
  
  // 创建历史记录的Map，方便快速查找
  let historyMap = new Map();
  for (let item of dynamicPushHistory) {
    historyMap.set(item.id_str, item);
  }
  
  return newList.filter((item) => {
    let id = item.id_str;
    let author = item?.modules?.module_author || {};
    let pubTime = author?.pub_ts || 0;
    
    // 检查是否在历史记录中
    if (!historyMap.has(id)) {
      return true; // 不在历史记录中，需要推送
    }
    
    // 在历史记录中，检查发布时间是否一致
    let historyItem = historyMap.get(id);
    if (historyItem.pub_time === pubTime) {
      // 发布时间一致，说明是同一条动态，不推送
      return false;
    }
    
    // 发布时间不一致，可能是被编辑的动态，推送
    return true;
  });
}

// 发送动态内容
async function sendDynamic(info, biliUser, list) {
  let pushID = info.pushTarget;
  Bot.logger.mark(`B站推送[${pushID}] - 用户[${biliUser.name}]`);

  for (let val of list) {
    try {
      let msg = buildSendDynamic(biliUser, val, info);

      if (msg === "can't push transmit") {
        Bot.logger.mark(`B站推送：跳过转发动态 [${val.id_str}]`);
        continue;
      }

      if (!msg) {
        Bot.logger.warn(`B站推送：动态信息解析失败 [${val.id_str}]`);
        continue;
      }

      let sendType = getSendType(info);
      if (sendType === "merge") {
        msg = await common.replyMake(msg, info.isGroup, msg[0]);
      }

      if (info.isGroup) {
        await Bot.pickGroup(pushID)
          .sendMsg(msg)
          .catch((err) => {
            Bot.logger.error(`B站推送：群[${pushID}]推送失败: ${err.message}`);
            return pushAgain(pushID, msg);
          });
      } else {
        await common.relpyPrivate(pushID, msg);
      }

      Bot.logger.mark(`B站推送：成功推送动态 [${val.id_str}]`);
      // 固定延迟，避免一次性发送太多消息
      await common.sleep(BotHaveARest);

    } catch (err) {
      Bot.logger.error(`B站推送：发送动态异常 [${val.id_str}]: ${err.message}`);
    }
  }

  return true;
}

// 群推送失败了，再推一次，再失败就算球了
async function pushAgain(groupId, msg, retryCount = 0) {
  const maxRetries = 2; // 最多重试 2 次

  if (retryCount >= maxRetries) {
    Bot.logger.error(`B站推送：群[${groupId}]推送失败，已达最大重试次数`);
    return false;
  }

  await common.sleep(BotHaveARest * (retryCount + 1)); // 重试时延迟递增

  try {
    await Bot.pickGroup(groupId).sendMsg(msg);
    Bot.logger.mark(`B站推送：群[${groupId}]重试推送成功 (第${retryCount + 1}次)`);
    return true;
  } catch (err) {
    Bot.logger.warn(`B站推送：群[${groupId}]重试推送失败 (第${retryCount + 1}次): ${err.message}`);
    return pushAgain(groupId, msg, retryCount + 1);
  }
}

// 构建动态消息
function buildSendDynamic(biliUser, dynamic, info) {
  try {
    let desc, msg, pics, opusDesc;
    let title = `${biliUser.name}「动态」推送：\n`;

    // 以下对象结构参考新版 API 接口
    switch (dynamic.type) {
      case "DYNAMIC_TYPE_AV":
        desc = dynamic?.modules?.module_dynamic?.major?.archive;
        if (!desc) {
          Bot.logger.warn(`B站推送：视频动态数据不完整 [${dynamic.id_str}]`);
          return null;
        }
        title = `${biliUser.name}「视频」推送：\n`;
        msg = [title, desc.title, segment.image(desc.cover), resetLinkUrl(desc.jump_url)];
        return msg;

      case "DYNAMIC_TYPE_WORD":
        // 新版API：文字动态数据在major.opus中
        desc = dynamic?.modules?.module_dynamic?.major?.opus || {};
        opusDesc = desc?.summary?.text || '';
        if (!opusDesc) {
          Bot.logger.warn(`B站推送：文字动态数据不完整 [${dynamic.id_str}]`);
          return null;
        }
        if (!contentFilter(opusDesc)) return null;
        title = `${biliUser.name}「动态」推送：\n`;
        if (getSendType(info) != "default") {
          msg = [title, `${opusDesc}\n`, `${BiliDrawDynamicLinkUrl}${dynamic.id_str}`];
        } else {
          msg = [title, `${dynamicContentLimit(opusDesc)}\n`, `${BiliDrawDynamicLinkUrl}${dynamic.id_str}`];
        }
        return msg;

      case "DYNAMIC_TYPE_DRAW":
        // 新版API：图文动态数据在major.opus中
        desc = dynamic?.modules?.module_dynamic?.major?.opus || {};
        pics = desc?.pics || [];
        if (pics && pics.length > 0) {
          pics = pics.map((item) => {
            return segment.image(item.url);
          });
        } else {
          pics = [];
        }
        opusDesc = desc?.summary?.text || '';
        if (opusDesc && !contentFilter(opusDesc)) return null;
        title = `${biliUser.name}「图文」推送：\n`;
        if (getSendType(info) != "default") {
          msg = [title, opusDesc ? `${opusDesc}\n` : '', ...pics, `${BiliDrawDynamicLinkUrl}${dynamic.id_str}`];
        } else {
          if (pics.length > DynamicPicCountLimit) pics.length = DynamicPicCountLimit;
          msg = [title, opusDesc ? `${dynamicContentLimit(opusDesc)}\n` : '', ...pics, `${BiliDrawDynamicLinkUrl}${dynamic.id_str}`];
        }
        return msg;

      case "DYNAMIC_TYPE_ARTICLE":
        desc = dynamic?.modules?.module_dynamic?.major?.article;
        if (!desc) {
          Bot.logger.warn(`B站推送：文章动态数据不完整 [${dynamic.id_str}]`);
          return null;
        }
        pics = [];
        if (desc.covers && desc.covers.length) {
          pics = desc.covers.map((item) => {
            return segment.image(item);
          });
        }

        title = `${biliUser.name}「文章」推送：\n`;
        msg = [title, desc.title, ...pics, resetLinkUrl(desc.jump_url)];
        return msg;

      case "DYNAMIC_TYPE_FORWARD":
        let pushTransmit = info.pushTransmit;
        if (!pushTransmit) return "can't push transmit";

        desc = dynamic?.modules?.module_dynamic?.desc;
        if (!desc) {
          Bot.logger.warn(`B站推送：转发动态数据不完整 [${dynamic.id_str}]`);
          return null;
        }

        if (!dynamic.orig) {
          Bot.logger.warn(`B站推送：转发动态缺少原始内容 [${dynamic.id_str}]`);
          return null;
        }

        if (!contentFilter(desc.text)) return null;

        let orig = buildSendDynamic(biliUser, dynamic.orig, info);
        if (orig && orig.length) {
          orig.shift();
          orig.pop();
        } else {
          Bot.logger.warn(`B站推送：转发动态原始内容解析失败 [${dynamic.id_str}]`);
          return null;
        }

        title = `${biliUser.name}「转发」推送：\n`;

        if (getSendType(info) != "default") {
          msg = [
            title,
            `${desc.text}\n---以下为转发内容---\n`,
            ...orig,
            `${BiliDrawDynamicLinkUrl}${dynamic.id_str}`,
          ];
        } else {
          msg = [
            title,
            `${dynamicContentLimit(desc.text, 1, 15)}\n---以下为转发内容---\n`,
            ...orig,
            `${BiliDrawDynamicLinkUrl}${dynamic.id_str}`,
          ];
        }
        return msg;

      case "DYNAMIC_TYPE_LIVE_RCMD":
        desc = dynamic?.modules?.module_dynamic?.major?.live_rcmd?.content;
        if (!desc) {
          Bot.logger.warn(`B站推送：直播动态数据不完整 [${dynamic.id_str}]`);
          return null;
        }
        try {
          desc = JSON.parse(desc);
          desc = desc?.live_play_info;
        } catch (e) {
          Bot.logger.warn(`B站推送：直播动态数据解析失败 [${dynamic.id_str}]`);
          return null;
        }

        if (!desc) {
          Bot.logger.warn(`B站推送：直播动态播放信息不完整 [${dynamic.id_str}]`);
          return null;
        }

        title = `${biliUser.name}「直播」动态推送：\n`;
        msg = [title, `${desc.title}\n`, segment.image(desc.cover), resetLinkUrl(desc.link)];
        return msg;

      default:
        Bot.logger.warn(`B站推送：未处理的动态类型 [${dynamic.type}] [${dynamic.id_str}]`);
        return null;
    }
  } catch (err) {
    Bot.logger.error(`B站推送：构建动态消息异常 [${dynamic.id_str}]: ${err.message}`);
    return null;
  }
}

// 限制动态字数/行数，避免过长影响观感（霸屏）
function dynamicContentLimit(content, lineLimit, lenLimit) {
  content = content.split("\n");

  lenLimit = lenLimit || DynamicContentLenLimit;
  lineLimit = lineLimit || DynamicContentLineLimit;

  if (content.length > lineLimit) content.length = lineLimit;
  let contentLen = 0; // 内容总长度
  let outLen = false; // 溢出 flag
  for (let i = 0; i < content.length; i++) {
    let len = lenLimit - contentLen; // 这一段内容允许的最大长度
    if (outLen) {
      // 溢出了，后面的直接删掉
      content.splice(i--, 1);
      continue;
    }
    if (content[i].length > len) {
      content[i] = content[i].substr(0, len);
      content[i] = `${content[i]}...`;
      contentLen = lenLimit;
      outLen = true;
    }
    contentLen += content[i].length;
  }

  return content.join("\n");
}

// B站返回的url有时候多两斜杠，去掉
function resetLinkUrl(url) {
  if (url.indexOf("//") === 0) {
    return url.substr(2);
  }
  return url;
}

// 是否被禁用了B站推送功能
function isAllowPushFunc(e) {
  if (e.isMaster) return true; // master当然是做什么都可以咯
  let pushID = "";
  if (e.isGroup) {
    pushID = e.group_id;
  } else {
    // 私聊禁止使用哦
    if (!BilibiliPushConfig.allowPrivate) {
      return false;
    }
    pushID = e.user_id;
  }

  let info = PushBilibiliDynamic[pushID];
  if (!info) return true;
  if (info.isGroup && info.adminPerm === false) return false;
  // allowPush可能不存在，只在严格不等于false的时候才禁止
  if (info.allowPush === false) return false;

  return info.allowPush !== false;
}

// 判断当前不是默认推送方式
function getSendType(info) {
  if (BilibiliPushConfig.sendType && BilibiliPushConfig.sendType != "default") return BilibiliPushConfig.sendType;
  if (info.sendType) return info.sendType;
  return "default";
}

// B站推送拦截关键词
function contentFilter(inContent) {
   const cfg = config.getdefault_config('bilibiliPush', 'bilibiliPushFilter', 'config');
  for (const keyword of cfg.FilterKeyword) {
    if (RegExp(keyword).exec(inContent)) {
      Bot.logger.mark(`B站动态推送拦截关键词: ${keyword}`);
      return false;
    }
  }
  return true;
}

// 存储B站推送信息
async function savePushJson() {
  let path = _path + "/data/PushNews/PushBilibiliDynamic.json";
  fs.writeFileSync(path, JSON.stringify(PushBilibiliDynamic, "", "\t"));
}

// 存储B站推送配置信息
async function saveConfigJson() {
  let path = _path + "/data/PushNews/BilibiliPushConfig.json";
  fs.writeFileSync(path, JSON.stringify(BilibiliPushConfig, "", "\t"));
}

// 检查Cookie状态
export async function checkBiliCookie(e) {
  if (!e.isMaster) {
    e.reply("只有主人可以使用此功能");
    return false;
  }

  let info = "";
  info += `当前Cookie状态:\n`;
  info += `- 是否配置Cookie: ${BiliCookie ? '是' : '否'}\n`;
  info += `- Cookie长度: ${BiliCookie ? BiliCookie.length : 0}\n`;
  info += `- DedeUserID: ${BiliUID}\n`;
  info += `- Cookie内容: ${BiliCookie ? BiliCookie.substring(0, 50) + '...' : '未配置'}\n`;
  
  e.reply(info);
  return true;
}

// 默认B站用户列表
const defaultBiliUserList = [
  { uid: "401742377", name: "原神" },
  { uid: "1636034895", name: "绝区零" },
  { uid: "1340190821", name: "崩坏星穹铁道" },
  { uid: "3546886017387331", name: "崩坏因缘精灵" },
  { uid: "27534330", name: "崩坏3第一偶像爱酱" },
  { uid: "3546720675826241", name: "妄想天使唯一指定官号" },
  { uid: "609035442", name: "会飞的芒果猫" }
];

// 刷新B站推送列表
export async function refreshBiliPushList(e) {
  if (!e.isMaster) {
    e.reply("只有主人可以刷新B站推送列表");
    return false;
  }

  let pushID = "";
  if (e.isGroup) {
    pushID = e.group_id;
  } else {
    pushID = e.user_id;
  }

  if (!PushBilibiliDynamic[pushID]) {
    return e.reply("当前未开启B站推送，请先开启B站推送功能");
  }

  let push = PushBilibiliDynamic[pushID];
  let currentList = push.biliUserList || [];
  let currentUIDs = new Set(currentList.map(u => u.uid));
  let addedCount = 0;
  let addedUsers = [];

  // 检查并添加缺失的默认用户
  for (let defaultUser of defaultBiliUserList) {
    if (!currentUIDs.has(defaultUser.uid)) {
      currentList.push(defaultUser);
      currentUIDs.add(defaultUser.uid);
      addedCount++;
      addedUsers.push(defaultUser.name);
    }
  }

  if (addedCount > 0) {
    push.biliUserList = currentList;
    savePushJson();
    e.reply(`✅ 已刷新B站推送列表\n新增了 ${addedCount} 个用户：${addedUsers.join("、")}\n\n当前共有 ${currentList.length} 个用户`);
  } else {
    e.reply(`当前B站推送列表已经是最新状态，共 ${currentList.length} 个用户`);
  }

  return true;
}