import fs from "fs";
import fetch from "node-fetch";
import common from "../components/bcommon.js";
import { botConfig } from "../components/bcommon.js"
import config from "../model/config/config.js"
import { getBLsid, getUuid } from "#liulian"
import Cfg from '../components/Cfg.js'

const _path = process.cwd();
const cfg = config.getdefault_config('liulian', 'botname', 'config');
  const botname = cfg.botname

if (!fs.existsSync(`${_path}/data/PushNews/`)) {
  fs.mkdirSync(`${_path}/data/PushNews/`);
}

let dynamicPushHistory = []; // 历史推送，仅记录推送的消息ID，不记录本体对象，用来防止重复推送的
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
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

// B站 Cookie（从配置文件读取或自动生成）
let BiliCookie = '';

// 初始化获取B站推送信息
const BotHaveARest = 500; // 每次发送间隔时间
const BiliApiRequestTimeInterval = 2000; // B站动态获取api请求间隔，别太快防止被拉黑
const DynamicPicCountLimit = 3; // 推送动态时，限制发送多少张图片
const DynamicContentLenLimit = 95; // 推送文字和图文动态时，限制字数是多少
const DynamicContentLineLimit = 5; // 推送文字和图文动态时，限制多少行文本

let nowPushDate = Date.now(); // 设置当前推送的开始时间
let pushTimeInterval = 10; // 推送间隔时间，单位：分钟
// 延长过期时间的定义
let DynamicPushTimeInterval = 60 * 60 * 1000; // 过期时间，单位：小时，默认一小时，范围[1,24]

// 初始化 B站 Cookie
async function initBiliCookie() {
  // 尝试从配置文件读取 Cookie
  try {
    const cfg = config.getdefault_config('bilibiliPush', 'bilibiliCookie', 'config');
    if (cfg && cfg.cookie) {
      BiliCookie = cfg.cookie;
      BiliReqHeaders.cookie = BiliCookie;
      Bot.logger.mark('B站推送：使用配置文件中的 Cookie');
      return true;
    }
  } catch (err) {
    Bot.logger.warn(`B站推送：读取配置文件 Cookie 失败: ${err.message}`);
  }

  // 如果没有配置 Cookie，生成基础 Cookie
  BiliCookie = `buvid3=${generateRandomId()}; b_nut=${generateRandomId()}; _uuid=${getUuid()}; b_lsid=${getBLsid()}`;
  BiliReqHeaders.cookie = BiliCookie;
  Bot.logger.mark('B站推送：使用自动生成的 Cookie');
  return true;
}

// 生成随机 ID（用于 buvid3 和 b_nut）
function generateRandomId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// 获取用户信息
async function getUserInfo(uid) {
  try {
    const url = `${BiliUserInfoUrl}?mid=${uid}`;
    const response = await fetch(url, {
      method: "get",
      headers: BiliReqHeaders
    });

    if (!response.ok) {
      Bot.logger.warn(`B站推送：获取用户信息失败，HTTP状态码: ${response.status}`);
      return null;
    }

    const res = await response.json();

    if (res.code === -352) {
      Bot.logger.warn('B站推送：Cookie 已过期或无效');
      return null;
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
    const response = await fetch(BiliLoginQrcodeUrl, {
      method: "get",
      headers: BiliReqHeaders
    });

    if (!response.ok) {
      e.reply("获取登录二维码失败，请稍后重试");
      return true;
    }

    const res = await response.json();

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

    // 发送二维码图片
    if (e.isGroup) {
      await e.group.sendMsg(segment.image(qrImage));
    } else {
      await e.reply(segment.image(qrImage));
    }

    e.reply("请使用 B站手机 APP 扫码登录\n二维码有效期 3 分钟");

    // 轮询登录状态
    const maxAttempts = 60; // 最多轮询 60 次（3分钟）
    let attempts = 0;

    const pollInterval = setInterval(async () => {
      attempts++;

      if (attempts > maxAttempts) {
        clearInterval(pollInterval);
        e.reply("登录超时，请重新扫码");
        return;
      }

      try {
        const pollResponse = await fetch(`${BiliLoginInfoUrl}?qrcode_key=${qrcodeKey}`, {
          method: "get",
          headers: BiliReqHeaders
        });

        if (!pollResponse.ok) {
          return;
        }

        const pollRes = await pollResponse.json();

        if (pollRes.code === 0 && pollRes.data?.code === 0) {
          // 登录成功
          clearInterval(pollInterval);

          const url = pollRes.data.url;
          if (!url) {
            e.reply("登录成功但获取 Cookie 失败");
            return;
          }

          // 从 URL 中提取 Cookie
          const cookie = extractCookieFromUrl(url);

          if (!cookie) {
            e.reply("登录成功但提取 Cookie 失败");
            return;
          }

          // 保存 Cookie
          BiliCookie = cookie;
          BiliReqHeaders.cookie = cookie;

          // 保存到配置文件
          try {
            const configPath = `${_path}/plugins/liulian-plugin/config/config/bilibiliPush/bilibiliCookie.yaml`;
            const yamlContent = `# B站推送 Cookie 配置
# 获取方式：
# 1. 登录 B站网页版 (https://www.bilibili.com)
# 2. 按 F12 打开开发者工具
# 3. 切换到 Network (网络) 标签
# 4. 刷新页面
# 5. 找到任意请求，查看 Request Headers 中的 Cookie
# 6. 复制完整的 Cookie 内容到下方

# Cookie 内容（留空则使用自动生成的 Cookie，但功能可能受限）
cookie: '${cookie}'

# 注意：
# - 建议配置有效的 Cookie 以获得更好的推送效果
# - Cookie 包含敏感信息，请勿泄露给他人
# - Cookie 可能会过期，如遇推送失败可尝试更新 Cookie
`;

            fs.writeFileSync(configPath, yamlContent, 'utf8');
            Bot.logger.mark('B站推送：Cookie 已保存到配置文件');
          } catch (err) {
            Bot.logger.error(`B站推送：保存 Cookie 失败: ${err.message}`);
          }

          e.reply("✅ 登录成功！Cookie 已保存");
          Bot.logger.mark('B站推送：扫码登录成功');
        } else if (pollRes.data?.code === 86038) {
          // 二维码已过期
          clearInterval(pollInterval);
          e.reply("二维码已过期，请重新扫码");
        } else if (pollRes.data?.code === 86090) {
          // 等待扫码
          // 继续轮询
        }
      } catch (err) {
        Bot.logger.error(`B站推送：查询登录状态异常: ${err.message}`);
      }
    }, 3000); // 每 3 秒查询一次

  } catch (err) {
    Bot.logger.error(`B站推送：扫码登录异常: ${err.message}`);
    e.reply(`扫码登录失败：${err.message}`);
  }

  return true;
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
initBiliCookie(); // 初始化 Cookie

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
        biliUserList: [{ uid: "401742377", name: "原神" }], // 默认推送原神B站
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
      biliUserList: [{ uid: "401742377", name: "原神" }], // 默认推送原神B站
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
      biliUserList: [{ uid: "401742377", name: "原神" }], // 默认推送原神B站
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

    // 先获取用户信息
    let userInfo = await getUserInfo(uid);
    if (!userInfo) {
      e.reply("⚠️无法获取用户信息，可能是UID错误或B站接口限制\n提示：建议在配置文件中配置有效的 B站 Cookie");
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
  e.reply("填写成功");
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
  let hisArr = new Set(dynamicPushHistory);
  for (let [userId, pushList] of nowDynamicPushList) {
    for (let msg of pushList) {
      hisArr.add(msg.id_str);
    }
  }
  dynamicPushHistory = [...hisArr]; 
  await redis.set("liulian:bilipush:history", JSON.stringify(dynamicPushHistory), { EX: 24 * 60 * 60 }); // 仅存储一次，过期时间24小时
  nowPushDate = Date.now();
  nowDynamicPushList = new Map(); // 清空上次的推送列表
  let temp = PushBilibiliDynamic;
  for (let user in temp) {
    temp[user].pushTarget = user; // 保存推送QQ对象
    // 循环每个订阅了推送任务的QQ对象
    if (isAllowSchedulePush(temp[user])) {
      await pushDynamic(temp[user]);
    }
  }
}

// 定时任务是否给这个QQ对象推送B站动态
function isAllowSchedulePush(user) {
  if (botConfig.masterQQ.includes(Number(user.pushTarget))) return true; // 主人的命令就是一切！
  if (!user.isNewsPush) return false; // 不推那当然。。不推咯
  if (user.allowPush === false) return false; // 信息里边禁止使用推送功能了，那直接禁止
  if (!BilibiliPushConfig.allowPrivate && !user.isGroup) return false; // 禁止私聊推送并且不是群聊，直接禁止
  return true;
}

// 动态推送
async function pushDynamic(pushInfo) {
  let users = pushInfo.biliUserList;
  for (let i = 0; i < users.length; i++) {
    let biliUID = users[i].uid;

    // 检查是否已经请求过这个用户的动态
    let lastPushList = nowDynamicPushList.get(biliUID);
    if (lastPushList) {
      if (lastPushList.length === 0) {
        continue;
      }
      await sendDynamic(pushInfo, users[i], lastPushList);
      continue;
    }

    // 请求用户动态
    let url = `${BiliDynamicApiUrl}?host_mid=${biliUID}&timezone_offset=-480&features=itemOpusStyle`;
    let pushList = [];

    try {
      const response = await fetch(url, {
        method: "get",
        headers: BiliReqHeaders
      });

      if (!response.ok) {
        Bot.logger.warn(`B站推送：获取用户[${biliUID}]动态失败，HTTP状态码: ${response.status}`);
        await common.sleep(BiliApiRequestTimeInterval);
        nowDynamicPushList.set(biliUID, []);
        continue;
      }

      const res = await response.json();

      if (res.code === -352) {
        Bot.logger.warn('B站推送：Cookie 已过期或无效');
        await common.sleep(BiliApiRequestTimeInterval);
        nowDynamicPushList.set(biliUID, []);
        continue;
      }

      if (res.code !== 0) {
        Bot.logger.warn(`B站推送：获取用户[${biliUID}]动态失败，错误码: ${res.code}, 消息: ${res.message}`);
        await common.sleep(BiliApiRequestTimeInterval);
        nowDynamicPushList.set(biliUID, []);
        continue;
      }

      let data = res?.data?.items || [];
      if (data.length === 0) {
        Bot.logger.mark(`B站推送：用户[${biliUID}]暂无新动态`);
        await common.sleep(BiliApiRequestTimeInterval);
        nowDynamicPushList.set(biliUID, []);
        continue;
      }

      // 筛选需要推送的动态
      for (let val of data) {
        let author = val?.modules?.module_author || {};
        if (!author?.pub_ts) continue;

        let pubTime = author.pub_ts * 1000;
        // 检查是否在允许推送的时间范围内
        if (nowPushDate - pubTime > DynamicPushTimeInterval) {
          continue;
        }
        pushList.push(val);
      }

      // 去重
      pushList = rmDuplicatePushList(pushList);
      nowDynamicPushList.set(biliUID, pushList);

      if (pushList.length === 0) {
        Bot.logger.mark(`B站推送：用户[${biliUID}]没有需要推送的新动态`);
        await common.sleep(BiliApiRequestTimeInterval);
        continue;
      }

      Bot.logger.mark(`B站推送：用户[${biliUID}]有 ${pushList.length} 条新动态待推送`);
      await sendDynamic(pushInfo, users[i], pushList);
      await common.sleep(BiliApiRequestTimeInterval);

    } catch (err) {
      Bot.logger.error(`B站推送：获取用户[${biliUID}]动态异常: ${err.message}`);
      await common.sleep(BiliApiRequestTimeInterval);
      nowDynamicPushList.set(biliUID, []);
    }
  }
  return true;
}

// 历史推送过的动态，这一轮不推
function rmDuplicatePushList(newList) {
  if (newList && newList.length === 0) return newList;
  return newList.filter((item) => {
    return !dynamicPushHistory.includes(item.id_str);
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
    let desc, msg, pics;
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
        desc = dynamic?.modules?.module_dynamic?.desc;
        if (!desc) {
          Bot.logger.warn(`B站推送：文字动态数据不完整 [${dynamic.id_str}]`);
          return null;
        }
        if (!contentFilter(desc.text)) return null;
        title = `${biliUser.name}「动态」推送：\n`;
        if (getSendType(info) != "default") {
          msg = [title, `${desc.text}\n`, `${BiliDrawDynamicLinkUrl}${dynamic.id_str}`];
        } else {
          msg = [title, `${dynamicContentLimit(desc.text)}\n`, `${BiliDrawDynamicLinkUrl}${dynamic.id_str}`];
        }
        return msg;

      case "DYNAMIC_TYPE_DRAW":
        desc = dynamic?.modules?.module_dynamic?.desc;
        pics = dynamic?.modules?.module_dynamic?.major?.draw?.items;
        if (!desc && !pics) {
          Bot.logger.warn(`B站推送：图文动态数据不完整 [${dynamic.id_str}]`);
          return null;
        }
        if (desc && !contentFilter(desc.text)) return null;

        if (pics && pics.length > 0) {
          pics = pics.map((item) => {
            return segment.image(item.src);
          });
        } else {
          pics = [];
        }

        title = `${biliUser.name}「图文」推送：\n`;

        if (getSendType(info) != "default") {
          msg = [title, desc ? `${desc.text}\n` : '', ...pics, `${BiliDrawDynamicLinkUrl}${dynamic.id_str}`];
        } else {
          if (pics.length > DynamicPicCountLimit) pics.length = DynamicPicCountLimit;
          msg = [title, desc ? `${dynamicContentLimit(desc.text)}\n` : '', ...pics, `${BiliDrawDynamicLinkUrl}${dynamic.id_str}`];
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