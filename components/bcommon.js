import fs from "fs";
import { liulianSafe } from './index.js';

const _path = process.cwd();

let packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const yunzaiVersion = packageJson.version;
export const isV3 = yunzaiVersion[0] === "3";

let config;
if (isV3) {
  const YAML = await import("yaml");

  let configUrl = `${_path}/config/config`;

  // 运行时现读 yaml：配置改后无需重启即可生效；读失败返回兜底值，避免模块加载即崩
  const readYaml = (name, fallback) => {
    try {
      return YAML.parse(fs.readFileSync(`${configUrl}/${name}`, "utf8")) ?? fallback;
    } catch (e) {
      console.warn(`[bcommon] 读取 ${name} 失败: ${e.message}`);
      return fallback;
    }
  };

  config = {
    get other() { return readYaml("other.yaml", {}); },
    get group() { return readYaml("group.yaml", {}); },
    // masterQQ 兜底：兼容 null/未配置/单值数字/数组，避免 .includes 崩溃
    get masterQQ() {
      let masterQQ = this.other?.masterQQ;
      if (masterQQ == null) return [];
      return Array.isArray(masterQQ) ? masterQQ : [masterQQ];
    },
  };
} else {
  // 非 V3：优先 TRSS 运行时 Bot.cfg（实时生效），BotConfig 作兜底
  config = {
    get other() {
      if (typeof Bot !== 'undefined' && Bot.cfg) return Bot.cfg.getAllCfg?.("other") ?? BotConfig?.other ?? {};
      return BotConfig?.other ?? {};
    },
    get group() {
      if (typeof Bot !== 'undefined' && Bot.cfg) return Bot.cfg.getAllCfg?.("group") ?? BotConfig?.group ?? {};
      return BotConfig?.group ?? {};
    },
    get masterQQ() {
      // TRSS：Bot.cfg.master = { bot_id: [主人QQ] }，条目形如 "bot_id:主人QQ"，取冒号后的 QQ
      try {
        if (typeof Bot !== 'undefined' && Bot.cfg) {
          const out = [];
          const push = v => {
            if (v == null) return;
            const s = String(v).split(':').pop().trim();
            // 只保留纯数字 QQ 号（5~12 位）：过滤 stdin 控制台、内部账号 ID 等非 QQ 条目
            if (/^\d{5,12}$/.test(s) && !out.includes(s)) out.push(s);
          };
          const m = Bot.cfg.master;
          if (m && typeof m === 'object') {
            for (const list of Object.values(m)) (Array.isArray(list) ? list : [list]).forEach(push);
          }
          const g = Bot.cfg.masterQQ;
          (Array.isArray(g) ? g : (g ? [g] : [])).forEach(push);
          if (out.length) return out;
        }
      } catch {}
      const mq = BotConfig?.masterQQ;
      if (mq == null) return [];
      return Array.isArray(mq) ? mq : [mq];
    },
  };
  if (typeof BotConfig === 'undefined' && typeof Bot === 'undefined') {
    console.warn('[bcommon] BotConfig/Bot 均未定义，主人配置将返回空列表');
  }
}

export const botConfig = config;

/**
 * 发送私聊消息，非好友以临时聊天发送
 * @param user_id qq号
 * @param msg 消息
 * @param isStranger 是否给陌生人发消息,默认false
 */
async function relpyPrivate(user_id, msg, isStranger = false) {
  user_id = parseInt(user_id);

  let friend = liulianSafe.fl.get(user_id);

  if (friend) {
    liulianSafe.logger.mark(`发送好友消息[${friend.nickname}](${user_id})`);

    liulianSafe.pickUser(user_id)
      .sendMsg(msg)
      .catch((err) => {
        liulianSafe.logger.mark(err);
      });

    // redis.incr(`Yunzai:sendMsgNum:${liulianSafe.uin}`);
    return;
  } else {
    //是否给陌生人发消息
    if (!isStranger) {
      return;
    }
    let key = `Yunzai:group_id:${user_id}`;
    let group_id = null;
    
    // 尝试获取 redis
    if (typeof redis !== 'undefined') {
      try {
        group_id = await redis.get(key);
      } catch (e) {
        console.warn('[bcommon] redis.get 失败:', e);
      }
    }
    
    if (!group_id) {
      for (let group of liulianSafe.gl) {
        group[0] = parseInt(group[0]);
        let MemberInfo = await liulianSafe.getGroupMemberInfo(group[0], user_id).catch(
          (err) => {}
        );
        if (MemberInfo) {
          group_id = group[0];
          if (typeof redis !== 'undefined') {
            try {
              redis.set(key, group_id.toString(), { EX: 1209600 });
            } catch (e) {
              console.warn('[bcommon] redis.set 失败:', e);
            }
          }
          break;
        }
      }
    } else {
      group_id = parseInt(group_id);
    }

    if (group_id) {
      liulianSafe.logger.mark(`发送临时消息[${group_id}]（${user_id})`);
      let res = await liulianSafe.pickMember(group_id, user_id).sendMsg(msg).catch((err) => {
        liulianSafe.logger.mark(err);
      });
      
      if (res) {
        if (typeof redis !== 'undefined') {
          try {
            redis.expire(key, 86400 * 15);
          } catch (e) {
            console.warn('[bcommon] redis.expire 失败:', e);
          }
        }
      } else {
        return;
      }
      
      // redis.incr(`Yunzai:sendMsgNum:${liulianSafe.uin}`);
    } else {
      liulianSafe.logger.mark(`发送临时消息失败：[${user_id}]`);
    }
  }
}

/**
 * 消息合并工具函数
 * @param {Array} messages 需要合并的消息列表，必填
 * @param {Boolean} isGroup 是否发送到群，必填，false时为发送到个人
 * @param {String} title 标题
 */
async function replyMake(messages, isGroup, title) {
  let nickname = liulianSafe.nickname;

  // 组装消息
  let msgList = [];
  messages.forEach((msg) => {
    msgList.push({
      message: msg, // 合并消息中的每一个单项消息
      nickname: nickname, // 机器人名字
      user_id: liulianSafe.uin, // 机器人的QQ号
    });
  });

  let forwardMsg = await liulianSafe.makeForwardMsg(msgList, !isGroup);

  if (title) {
    // 处理合并消息在点开前看到的描述
    forwardMsg.data = forwardMsg.data
      .replace(/\n/g, "")
      .replace(/<title color="#777777" size="26">(.+?)<\/title>/g, "___")
      .replace(/___+/, `<title color="#777777" size="26">${title}</title>`);
  }

  return forwardMsg;
}

/**
 * 休眠函数
 * @param ms 毫秒
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 获取现在时间到今天23:59:59秒的秒数
 */
function getDayEnd() {
  let now = new Date();
  let dayEnd =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      "23",
      "59",
      "59"
    ).getTime() / 1000;

  return dayEnd - parseInt(now.getTime() / 1000);
}

/**
 * 是不是狗管理或者狗群主
 */
function isGroupAdmin(e = {}) {
  let isAdmin = e?.sender?.role === "admin";
  let isOwner = e?.sender?.role === "owner";

  return isAdmin || isOwner;
}

/**
 * 根据给到的数据，返回一个 1 - 60 的整数或者false
 */
function getRightTimeInterval(num) {
  num = Number(num);
  if (isNaN(num)) return false;

  if (num > 60) return 60;
  if (num <= 0) return 1;

  return num;
}

export default {
  relpyPrivate,
  replyMake,
  sleep,
  getDayEnd,
  isGroupAdmin,
  getRightTimeInterval,
};