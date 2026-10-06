import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import bcommon from "../components/bcommon.js";
import { DATA_DIR, getSecret, getOwnerQqs, readMember, saveMember, signedJsonRequest } from "../components/memberAuth.js";

// 会员密钥与排名系统对接：凭据/签名/请求统一走 components/memberAuth.js
const MEMBER_FILE = path.join(DATA_DIR, 'member.json');
const ROUNDS_FILE = path.join(DATA_DIR, 'rounds.json');

const MEMBER_VERIFY_PATH = '/api/rank/membership';
const ROUND_START_PATH = '/api/rank/round/start';
const ROUND_FINISH_PATH = '/api/rank/round/finish';
const RANKING_PATH = '/api/rank/ranking';
const GROUP_RANKING_PATH = '/api/rank/group-ranking';

// 处于绑定等待态的主人（私信发过 榴莲会员绑定，正在等发密钥）
const pendingBinds = new Map();

function getMemberExpiry() {
  let m = null;
  try {
    if (fs.existsSync(MEMBER_FILE)) m = JSON.parse(fs.readFileSync(MEMBER_FILE, 'utf-8'));
  } catch (err) {
    logger.warn(`[榴莲会员] 密钥文件读取失败: ${err.message}`);
  }
  return m && m.expiry ? m.expiry : 0;
}

// ============ 会员状态 ============
// 查询会员状态：可传候选 secret 用于绑定验证
async function fetchMembership(secretOverride, ownerQqOverride) {
  const ret = await signedJsonRequest('GET', MEMBER_VERIFY_PATH, undefined, secretOverride, ownerQqOverride);
  return ret;
}

// 排名门槛：会员有效才给查（结果缓存 1 分钟）
let memberOkCache = { ok: null, time: 0 };
export async function checkMember() {
  const now = Date.now();
  if (memberOkCache.ok !== null && now - memberOkCache.time < 60 * 1000) {
    return memberOkCache.ok;
  }
  const m = readMember();
  if (!m || !m.secret) {
    memberOkCache = { ok: false, time: now };
    return false;
  }
  const ret = await fetchMembership();
  memberOkCache = { ok: !!(ret.ok && ret.data && ret.data.isActive), time: now };
  return memberOkCache.ok;
}

// 绑定失败限流：失败后 10 分钟内不能再发起；一天内失败满 3 次禁用绑定 24 小时
const BIND_RETRY_MS = 10 * 60 * 1000;
const BIND_MAX_FAILS_PER_DAY = 3;
const BIND_DISABLE_MS = 24 * 60 * 60 * 1000;
let bindLimit = { lastFail: 0, fails: [], disabledUntil: 0 };

function bindBlocked() {
  return Date.now() < bindLimit.disabledUntil;
}

function bindCooldownRemain() {
  return Math.max(0, bindLimit.lastFail + BIND_RETRY_MS - Date.now());
}

function recordBindFail() {
  const now = Date.now();
  bindLimit.lastFail = now;
  bindLimit.fails = bindLimit.fails.filter(t => now - t < 24 * 60 * 60 * 1000);
  bindLimit.fails.push(now);
  if (bindLimit.fails.length >= BIND_MAX_FAILS_PER_DAY) {
    bindLimit.disabledUntil = now + BIND_DISABLE_MS;
    logger.mark(`[榴莲会员] 一天内绑定失败满 ${BIND_MAX_FAILS_PER_DAY} 次，绑定功能禁用 24 小时`);
  }
}

// 每小时清理过期的失败记录，避免数组无限增长
const _bindCleanupTimer = setInterval(() => {
  const now = Date.now();
  bindLimit.fails = bindLimit.fails.filter(t => now - t < 24 * 60 * 60 * 1000);
}, 60 * 60 * 1000);
_bindCleanupTimer.unref?.();

// 榴莲会员绑定：仅主人私信可用，非主人/非私信不受理并提示原因
export async function memberBind(e) {
  if (!e.isMaster) {
    e.reply('只有主人才可以绑定榴莲会员哦~');
    return true;
  }
  if (e.isGroup) {
    e.reply('必须私信我才能绑定，请私信发送 榴莲会员绑定~');
    return true;
  }
  const masters = getOwnerQqs();
  if (bindBlocked()) {
    const hours = Math.ceil((bindLimit.disabledUntil - Date.now()) / (60 * 60 * 1000));
    e.reply(`绑定失败次数过多，绑定功能已禁用，约 ${hours} 小时后再试`);
    return true;
  }
  const remain = bindCooldownRemain();
  if (remain > 0) {
    e.reply(`上次绑定失败，请 ${Math.ceil(remain / (60 * 1000))} 分钟后再试`);
    return true;
  }
  pendingBinds.set(String(e.user_id), true);
  e.reply('请直接发送会员密钥，验证通过后自动绑定~');
  return true;
}

// 等待绑定中的密钥消息：仅主人私信生效，其余消息原样放行
export async function memberBindKey(e) {
  if (!e.isMaster || e.isGroup) return false;
  const uid = String(e.user_id);
  if (!pendingBinds.has(uid)) return false;
  pendingBinds.delete(uid);
  const secret = (e.msg || '').trim();
  if (!secret) return false;

  if (bindBlocked()) {
    const hours = Math.ceil((bindLimit.disabledUntil - Date.now()) / (60 * 60 * 1000));
    e.reply(`绑定失败次数过多，绑定功能已禁用，约 ${hours} 小时后再试`);
    return true;
  }
  const remain = bindCooldownRemain();
  if (remain > 0) {
    e.reply(`上次绑定失败，请 ${Math.ceil(remain / (60 * 1000))} 分钟后再试`);
    return true;
  }

  // 验证密钥：用绑定人 QQ（已通过 isMaster 判定）直接提交，不依赖运行时配置读取
  const ret = await fetchMembership(secret, uid);
  if (!ret.ok) {
    recordBindFail();
    // 真实原因只记日志供排查，用户侧只给友好提示，不暴露内部细节
    // 绑定验证直接以绑定人 QQ 提交，这里打印实际提交值，便于与服务端留档比对
    logger.mark(`[榴莲会员] 绑定验证未通过: ${ret.errorCode || 'UNKNOWN'}，提交主人 QQ: ${uid}`);
    const msgMap = {
      KEY_INVALID: '密钥无效，请核对后重试',
      QQ_MISMATCH: '当前机器人与授权信息不符，请联系发放方核对',
      MEMBER_REQUIRED: '该密钥尚未开通会员',
      MEMBER_EXPIRED: '会员已到期，请续费后重新绑定',
      MEMBER_BANNED: '会员已被限制使用',
      NETWORK_ERROR: '网络波动，请稍后再试',
      RATE_LIMITED: '操作太频繁，请稍后再试',
      NO_CREDENTIAL: '功能暂未开放，请稍后再试',
      SERVICE_UNAVAILABLE: '服务暂时繁忙，请稍后再试',
    };
    e.reply(`绑定未成功：${msgMap[ret.errorCode] || '请确认密钥无误后再试，若多次失败请联系发放方'}`);
    return true;
  }
  const data = ret.data || {};
  if (!data.isActive) {
    recordBindFail();
    e.reply('绑定失败：会员当前不可用');
    return true;
  }
  try {
    // 验证通过只落 secret 与有效期；主人身份不落盘，每次请求实时取运行时判定值
    saveMember({ secret, expiry: data.expiresAt || 0 });
    const days = data.remainingDays != null ? data.remainingDays : Math.ceil((data.expiresAt - Date.now()) / 86400000);
    logger.mark(`[榴莲会员] 密钥绑定成功，有效期至 ${data.expiresAt ? new Date(data.expiresAt).toLocaleString('zh-CN', { hour12: false }) : '未知'}`);
    e.reply(`绑定成功，会员剩余 ${days} 天`);
  } catch (err) {
    saveMember(null);
    logger.warn(`[榴莲会员] 密钥写入失败: ${err.message}`);
    e.reply('绑定验证通过，但本地保存失败，请稍后重试');
  }
  return true;
}

// 榴莲会员状态：查询会员是否生效、到期时间与剩余时长
export async function memberStatus(e) {
  if (!e.isMaster) {
    e.reply('只有主人才能查询榴莲会员状态哦~');
    return true;
  }
  const m = readMember();
  if (!m || !m.secret) {
    e.reply('尚未绑定榴莲会员，请私信发送 榴莲会员绑定 进行绑定~');
    return true;
  }
  const ret = await fetchMembership();
  if (!ret.ok) {
    // 真实原因只记日志供排查，用户侧只给友好提示
    logger.mark(`[榴莲会员] 状态查询未通过: ${ret.errorCode || 'UNKNOWN'}`);
    const msgMap = {
      KEY_INVALID: '密钥已失效，请重新绑定',
      QQ_MISMATCH: '当前机器人与授权信息不符，请联系发放方核对',
      MEMBER_EXPIRED: '榴莲会员已过期，请续费',
      MEMBER_BANNED: '榴莲会员已被限制使用',
      NETWORK_ERROR: '查询失败，请稍后再试',
      RATE_LIMITED: '操作太频繁，请稍后再试',
      NO_CREDENTIAL: '功能暂未开放，请稍后再试',
      SERVICE_UNAVAILABLE: '服务暂时繁忙，请稍后再试',
    };
    e.reply(`查询未成功：${msgMap[ret.errorCode] || '请稍后再试，若多次失败请联系发放方'}`);
    return true;
  }
  const data = ret.data || {};
  if (data.banned && data.banned.isBanned) {
    e.reply('榴莲会员已被封禁');
    return true;
  }
  if (!data.isActive) {
    e.reply('榴莲会员当前未生效（可能已到期或未开始）');
    return true;
  }
  // 剩余时长：天不足 1 天按小时展示
  let remain = '';
  if (data.remainingDays >= 1) {
    remain = `${data.remainingDays} 天`;
  } else if (data.remainingMs > 0) {
    remain = `${Math.max(1, Math.ceil(data.remainingMs / 3600000))} 小时`;
  } else {
    remain = '不足 1 小时';
  }
  const expiry = data.expiresAt ? new Date(data.expiresAt).toLocaleString('zh-CN', { hour12: false }) : '未知';
  e.reply(`榴莲会员状态：生效中\n剩余时长：${remain}\n到期时间：${expiry}`);
  return true;
}

// ============ 会员公告 ============
// 公告内容存于仓库 resources/member_notice.md，随更新分发；
// 每 10 分钟检查一次内容哈希：变动即给全部主人私信一次，全员送达才记录指纹，失败自动补发
const NOTICE_SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'resources', 'member_notice.md');
const NOTICE_FILE = path.join(DATA_DIR, 'notice2.json');

function noticeHash() {
  try {
    if (!fs.existsSync(NOTICE_SRC)) return '';
    return crypto.createHash('sha256').update(fs.readFileSync(NOTICE_SRC, 'utf-8'), 'utf8').digest('hex');
  } catch {
    return '';
  }
}

async function sendMemberNotice() {
  try {
    const hash = noticeHash();
    if (!hash) return;
    let mark = {};
    try {
      if (fs.existsSync(NOTICE_FILE)) mark = JSON.parse(fs.readFileSync(NOTICE_FILE, 'utf-8'));
    } catch {}
    const sameHash = mark.hash === hash;
    // 进度只对同一份公告有效：公告变了则重新通知全员
    const sent = sameHash && Array.isArray(mark.sent) ? mark.sent : [];
    const masters = getOwnerQqs();
    if (!masters.length) return;
    const pending = masters.filter(qq => !sent.includes(qq));
    if (!pending.length) {
      if (sameHash) return; // 已全员送达且公告未变
      mark = { hash, sent, time: new Date().toISOString() };
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(NOTICE_FILE, JSON.stringify(mark, null, 2), 'utf-8');
      return;
    }
    const msg = fs.readFileSync(NOTICE_SRC, 'utf-8').trim();
    if (!msg) return;
    const okList = [], failList = [];
    for (const qq of pending) {
      try {
        // 只走好友通道：非好友跳过，不发临时会话
        const Bot = global.Bot;
        const isFriend = (Bot?.uin ? Bot.uin.map(u => Bot[u]) : Object.values(Bot || {}))
          .some(bot => bot && bot.fl && bot.fl.get(Number(qq)));
        if (!isFriend) {
          failList.push(qq);
          continue;
        }
        await bcommon.relpyPrivate(Number(qq), msg, false);
        okList.push(qq);
      } catch {
        failList.push(qq);
      }
    }
    const sentAll = [...sent, ...okList];
    if (okList.length) logger.mark(`[榴莲会员] 会员公告已发送给: ${okList.join(', ')}`);
    if (failList.length) logger.mark(`[榴莲会员] 会员公告发送失败待重试: ${failList.join(', ')}`);
    // 全员送达才记录指纹完结；部分成功只记进度，失败者下轮自动补发
    mark = failList.length === 0
      ? { hash, sent: sentAll, time: new Date().toISOString() }
      : { hash, sent: sentAll };
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(NOTICE_FILE, JSON.stringify(mark, null, 2), 'utf-8');
  } catch (err) {
    logger.warn(`[榴莲会员] 会员公告检查失败: ${err.message}`);
  }
}

// 每 10 分钟检查一次公告变动（未上线不发送；unref 不占用退出）
const _noticeTimer = setInterval(() => {
  const Bot = global.Bot;
  const bots = Bot?.uin ? Bot.uin.map(u => Bot[u]).filter(b => b && b.fl) : [];
  if (!bots.length) return;
  sendMemberNotice();
}, 10 * 60 * 1000);
_noticeTimer.unref?.();

// ============ 对局上报 ============
// roundId 持久化：进程崩溃后恢复仍可结算/弃局
function loadRounds() {
  try {
    if (fs.existsSync(ROUNDS_FILE)) return JSON.parse(fs.readFileSync(ROUNDS_FILE, 'utf-8'));
  } catch (err) {
    logger.warn(`[榴莲会员] 对局文件读取失败: ${err.message}`);
  }
  return {};
}

function saveRound(groupId, roundId) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const rounds = loadRounds();
    if (roundId) rounds[groupId] = roundId;
    else delete rounds[groupId];
    fs.writeFileSync(ROUNDS_FILE, JSON.stringify(rounds, null, 2), 'utf-8');
  } catch (err) {
    logger.warn(`[榴莲会员] 对局文件写入失败: ${err.message}`);
  }
}

// 对局上报：开局登记，返回 roundId（未绑定/业务冲突时静默返回空，不打扰用户）
// game 为开局必传枚举（genshin/star/zzz/ww/nte），结算自动沿用无需再传
export async function startRound(e, gameType, difficulty = 'normal') {
  const ownerQqs = getOwnerQqs();
  if (!getSecret() || !ownerQqs.length) return '';
  const groupId = String(e.group_id || '');
  if (!/^\d{4,20}$/.test(groupId)) return '';
  if (!['genshin', 'star', 'zzz', 'ww', 'nte'].includes(gameType)) return '';
  if (!['normal', 'hard', 'hell', 'purgatory'].includes(difficulty)) difficulty = 'normal';
  // 该群存在残留对局（上次未正常结算/进程重启遗留）：先补报弃局让服务端立即回收，避免 ROUND_ACTIVE 锁群
  const prevRoundId = loadRounds()[groupId];
  if (prevRoundId) {
    logger.mark(`[榴莲会员] 检测到残留对局，先补报弃局回收再开局: ${groupId}`);
    await finishRound(prevRoundId, []);
  }
  const ret = await signedJsonRequest('POST', ROUND_START_PATH, { groupId, game: gameType, difficulty });
  if (ret.ok) {
    const roundId = (ret.data && ret.data.roundId) || '';
    if (roundId) saveRound(groupId, roundId);
    return roundId;
  }
  if (ret.errorCode === 'MEMBER_EXPIRED') {
    e.reply('榴莲会员已过期，请续费后再试~');
    return '';
  }
  // 业务冲突（对局已存在/冷却中/未授权等）：正常现象，只记录不发消息
  logger.mark(`[榴莲会员] 对局开局未通过: ${ret.errorCode}`);
  return '';
}

// roundId 已被服务端消费或回收的错误码：本地记录同步清理即可
const DEAD_ROUND_CODES = new Set(['ROUND_FINISHED', 'ROUND_NOT_FOUND', 'ROUND_EXPIRED', 'FINISHED', 'NOT_FOUND', 'EXPIRED']);

// 对局结算：一次性上报本局结果（含 0 分参与条目）
// 网络类失败保留本地记录，待该群下次开局前补报弃局回收，避免服务端锁群 2 小时
export async function finishRound(roundId, results) {
  if (!roundId || !results) return;
  try {
    const ret = await signedJsonRequest('POST', ROUND_FINISH_PATH, { roundId, results });
    if (ret.ok) {
      if (ret.data && ret.data.invalidCount > 0) {
        logger.mark(`[榴莲会员] 对局结算完成，异常条目 ${ret.data.invalidCount} 条: ${JSON.stringify(ret.data.invalidItems)}`);
      }
      cleanupRound(roundId);
      return;
    }
    if (ret.errorCode === 'MEMBER_EXPIRED') {
      logger.mark('[榴莲会员] 会员已过期，结算未入账，残留对局待后续回收');
      return;
    }
    logger.mark(`[榴莲会员] 对局结算未通过: ${ret.errorCode}`);
    if (DEAD_ROUND_CODES.has(ret.errorCode)) {
      // 服务端已回收该对局：本地记录同步清理
      cleanupRound(roundId);
    }
  } catch (err) {
    // 网络错误：保留本地记录，下次开局前补报弃局回收
    logger.warn(`[榴莲会员] 对局结算请求失败: ${err.message}`);
  }
}

// 清理已消费的 roundId 持久记录
function cleanupRound(roundId) {
  try {
    if (!fs.existsSync(ROUNDS_FILE)) return;
    const rounds = loadRounds();
    for (const [gid, rid] of Object.entries(rounds)) {
      if (rid === roundId) delete rounds[gid];
    }
    fs.writeFileSync(ROUNDS_FILE, JSON.stringify(rounds, null, 2), 'utf-8');
  } catch (err) {
    logger.warn(`[榴莲会员] 对局文件清理失败: ${err.message}`);
  }
}

// ============ 排名榜 ============
// 时区偏移（分钟，东八区=-480）：只用于服务端切自然边界
function tzOffset() {
  return new Date().getTimezoneOffset();
}

// 用户榜（服务端 60 秒缓存）：可选 game 分游戏榜、period+offset 时效榜
export async function fetchRanking(top = 10, qq = '', game = '', period = '') {
  let qs = `top=${top}`;
  if (qq) qs += `&qq=${qq}`;
  if (game) qs += `&game=${game}`;
  if (period) qs += `&period=${period}&offset=${tzOffset()}`;
  const ret = await signedJsonRequest('GET', `${RANKING_PATH}?${qs}`);
  if (!ret.ok) {
    logger.mark(`[榴莲会员] 排名查询未通过: ${ret.errorCode}`);
    return null;
  }
  try { logger.mark(`[榴莲会员] 排名原始返回: ${JSON.stringify(ret.data).slice(0, 500)}`); } catch {}
  return ret.data;
}

// 群总分榜（群与群比）：可选 groupId 返回本群名次，game/period 口径与用户榜一致
export async function fetchGroupRanking(top = 10, groupId = '', game = '', period = '') {
  let qs = `top=${top}`;
  if (groupId) qs += `&groupId=${groupId}`;
  if (game) qs += `&game=${game}`;
  if (period) qs += `&period=${period}&offset=${tzOffset()}`;
  const ret = await signedJsonRequest('GET', `${GROUP_RANKING_PATH}?${qs}`);
  if (!ret.ok) {
    logger.mark(`[榴莲会员] 群榜查询未通过: ${ret.errorCode}`);
    return null;
  }
  try { logger.mark(`[榴莲会员] 群榜原始返回: ${JSON.stringify(ret.data).slice(0, 500)}`); } catch {}
  return ret.data;
}
