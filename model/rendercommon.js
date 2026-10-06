
import fs from 'fs'
import { logger, liulianSafe } from '#liulian'

const _path = process.cwd();

let packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const yunzaiVersion = packageJson.version
export const isV3 = yunzaiVersion[0] === '3'

let config;
if (isV3) {
  const YAML = await import('yaml');

  let configUrl = `${_path}/config/config`

  // 运行时现读 yaml：配置改后无需重启即可生效；读失败返回兜底值
  const readYaml = (name, fallback) => {
    try {
      return YAML.parse(fs.readFileSync(`${configUrl}/${name}`, 'utf8')) ?? fallback;
    } catch (e) {
      logger.warn(`[rendercommon] 读取 ${name} 失败: ${e.message}`);
      return fallback;
    }
  };

  config = {
    get other() { return readYaml('other.yaml', {}); },
    get group() { return readYaml('group.yaml', {}); },
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
      if (typeof Bot !== 'undefined' && Bot.cfg) return Bot.cfg.getAllCfg?.('other') ?? BotConfig?.other ?? {};
      return BotConfig?.other ?? {};
    },
    get group() {
      if (typeof Bot !== 'undefined' && Bot.cfg) return Bot.cfg.getAllCfg?.('group') ?? BotConfig?.group ?? {};
      return BotConfig?.group ?? {};
    },
    get masterQQ() {
      try {
        if (typeof Bot !== 'undefined' && Bot.cfg) {
          const out = [];
          const push = v => {
            if (v == null) return;
            const s = String(v).split(':').pop().trim();
            if (s && !out.includes(s)) out.push(s);
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
}

export const botConfig = config;

/**
 * 发送私聊消息，非好友以临时聊天发送
 * @param user_id qq号
 * @param msg 消息
 * @param isStranger 是否给陌生人发消息,默认false
 */
async function relpyPrivate(user_id, msg ,isStranger = false) {
  user_id = parseInt(user_id);

  let friend = liulianSafe.fl.get(user_id);
  if (friend) {
    logger.mark(`发送好友消息[${friend.nickname}](${user_id})`);
    liulianSafe.pickUser(user_id).sendMsg(msg).catch((err) => {
      logger.mark(err);
    });
    redis.incr(`Yunzai:sendMsgNum:${liulianSafe.uin}`);
    return;
  }
  else {
    //是否给陌生人发消息
    if(!isStranger){
      return;
    }
    let key = `Yunzai:group_id:${user_id}`;
    let group_id = await redis.get(key);

    if (!group_id) {
      for (let group of liulianSafe.gl) {
        group[0] = parseInt(group[0])
        let MemberInfo = await liulianSafe.getGroupMemberInfo(group[0], user_id).catch((err)=>{});
        if (MemberInfo) {
          group_id = group[0];
          redis.set(key, group_id.toString(), { EX: 1209600 });
          break;
        }
      }
    } else {
      group_id = parseInt(group_id)
    }

    if (group_id) {

      logger.mark(`发送临时消息[${group_id}]（${user_id}）`);

          let res = await liulianSafe.pickMember(group_id, user_id).sendMsg(msg).catch((err) => {

                      logger.mark(err);

                });

          

                if (res) {

                  redis.expire(key, 86400 * 15);

                } else {

                  return;

                }

          

                redis.incr(`Yunzai:sendMsgNum:${liulianSafe.uin}`);
    } else {
      logger.mark(`发送临时消息失败：[${user_id}]`);
    }
  }

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
  let dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), "23", "59", "59").getTime() / 1000;

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

export default { relpyPrivate, sleep, getDayEnd, isGroupAdmin, getRightTimeInterval };
