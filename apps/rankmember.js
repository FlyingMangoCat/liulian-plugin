import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import fetch from 'node-fetch';

// 会员密钥与排名系统对接（HMAC 签名，见接口规范）
// secret 单独落盘存储，绝不随请求传输；主人 QQ 取自配置环境文件
const DATA_DIR = path.join(process.cwd(), 'data', 'guessrank');
const MEMBER_FILE = path.join(DATA_DIR, 'member.json');
const ROUNDS_FILE = path.join(DATA_DIR, 'rounds.json');

const API_BASE = 'https://api-forum.liulian-ai.top';
const MEMBER_VERIFY_PATH = '/api/rank/membership';
const ROUND_START_PATH = '/api/rank/round/start';
const ROUND_FINISH_PATH = '/api/rank/round/finish';
const RANKING_PATH = '/api/rank/ranking';
const GROUP_RANKING_PATH = '/api/rank/group-ranking';

let memberCache = null;
// 处于绑定等待态的主人（私信发过 榴莲会员绑定，正在等发密钥）
const pendingBinds = new Map();

function readMember() {
  if (memberCache) return memberCache;
  try {
    if (fs.existsSync(MEMBER_FILE)) {
      memberCache = JSON.parse(fs.readFileSync(MEMBER_FILE, 'utf-8'));
    }
  } catch (err) {
    logger.warn(`[榴莲会员] 密钥文件读取失败: ${err.message}`);
  }
  return memberCache;
}

function getSecret() {
  const m = readMember();
  return m && m.secret ? m.secret : '';
}

function getMemberExpiry() {
  const m = readMember();
  return m && m.expiry ? m.expiry : 0;
}

// 主人 QQ：只认单主人配置，多个主人无法确定归属
function getOwnerQqs() {
  const masters = Array.isArray(BotConfig?.masterQQ) ? BotConfig.masterQQ : (BotConfig?.masterQQ ? [BotConfig.masterQQ] : []);
  return masters.map(String);
}

// ============ HMAC 签名 ============
// 签名输入为原始请求体字节（序列化一次原样发送）；GET 请求 bodyHash = SHA-256('')
function buildHeaders(method, secret, ownerQqs, bodyObj) {
  const timestamp = String(Date.now());
  const nonce = crypto.randomBytes(16).toString('hex');
  const ownerQq = ownerQqs.join(',');
  const rawBody = (method === 'GET' || bodyObj === undefined) ? '' : JSON.stringify(bodyObj);
  const bodyHash = crypto.createHash('sha256').update(rawBody, 'utf8').digest('hex');
  const signature = crypto.createHmac('sha256', secret)
    .update(`${timestamp}\n${nonce}\n${ownerQq}\n${bodyHash}`, 'utf8')
    .digest('hex');
  return {
    'Content-Type': 'application/json',
    'X-Owner-Qq': ownerQq,
    'X-Timestamp': timestamp,
    'X-Nonce': nonce,
    'X-Body-Hash': bodyHash,
    'X-Signature': signature,
  };
}

// 带签名请求：重试（RATE_LIMITED/网络错误）须重新签名；返回 { ok, data, errorCode }
async function signedRequest(method, apiPath, bodyObj, secretOverride, e) {
  const secret = secretOverride || getSecret();
  const ownerQqs = getOwnerQqs();
  if (!secret || !ownerQqs.length) return { ok: false, errorCode: 'NO_CREDENTIAL' };
  const rawBody = (method === 'GET' || bodyObj === undefined) ? '' : JSON.stringify(bodyObj);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(API_BASE + apiPath, {
        method,
        headers: buildHeaders(method, secret, ownerQqs, bodyObj),
        body: method === 'GET' ? undefined : rawBody,
      });
      const ret = await res.json();
      if (ret.success) return { ok: true, data: ret.data };
      const errorCode = ret.errorCode || '';
      // 可重试：限流退避 ≥5 秒后重新签名重试一次；其余错误码直接返回
      if (errorCode === 'RATE_LIMITED' && attempt === 0) {
        await new Promise(r => setTimeout(r, 5 * 1000));
        continue;
      }
      return { ok: false, errorCode };
    } catch (err) {
      // 网络错误：重新签名重试一次
      if (attempt === 0) {
        await new Promise(r => setTimeout(r, 5 * 1000));
        continue;
      }
      logger.warn(`[榴莲会员] 排名系统请求失败: ${err.message}`);
      return { ok: false, errorCode: 'NETWORK_ERROR' };
    }
  }
  return { ok: false, errorCode: 'RATE_LIMITED' };
}

// ============ 会员状态 ============
// 查询会员状态：可传候选 secret 用于绑定验证
async function fetchMembership(secretOverride) {
  const ret = await signedRequest('GET', MEMBER_VERIFY_PATH, undefined, secretOverride);
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
  // 主人 QQ 归属只认单主人配置：多个主人无法确定归属，不受理
  const masters = getOwnerQqs();
  if (masters.length > 1) {
    e.reply('检测到多个主人配置，请联系会飞的芒果猫处理');
    return true;
  }
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

  // 验证密钥：会员状态有效才落盘，避免无效密钥污染本地数据
  const ret = await fetchMembership(secret);
  if (!ret.ok) {
    recordBindFail();
    const msgMap = {
      KEY_INVALID: '密钥无效，请联系管理员重新授权',
      QQ_MISMATCH: '主人 QQ 与授权留档不一致',
      MEMBER_REQUIRED: '该密钥无会员资格',
      MEMBER_EXPIRED: '会员已到期，请续费',
      MEMBER_BANNED: '会员已被封禁',
      NETWORK_ERROR: '验证请求失败，请稍后再试',
      RATE_LIMITED: '请求过频，请稍后再试',
      NO_CREDENTIAL: '绑定功能暂未开放，请稍后再试',
    };
    e.reply(`绑定失败：${msgMap[ret.errorCode] || '密钥无效'}`);
    return true;
  }
  const data = ret.data || {};
  if (!data.isActive) {
    recordBindFail();
    e.reply('绑定失败：会员当前不可用');
    return true;
  }
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    memberCache = { secret, expiry: data.expiresAt || 0 };
    fs.writeFileSync(MEMBER_FILE, JSON.stringify(memberCache, null, 2), 'utf-8');
    const days = data.remainingDays != null ? data.remainingDays : Math.ceil((data.expiresAt - Date.now()) / 86400000);
    logger.mark(`[榴莲会员] 密钥绑定成功，有效期至 ${data.expiresAt ? new Date(data.expiresAt).toLocaleString('zh-CN', { hour12: false }) : '未知'}`);
    e.reply(`绑定成功，会员剩余 ${days} 天`);
  } catch (err) {
    memberCache = null;
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
    const msgMap = {
      KEY_INVALID: '密钥已失效，请联系管理员重新授权',
      QQ_MISMATCH: '主人 QQ 与授权留档不一致',
      MEMBER_EXPIRED: '榴莲会员已过期，请续费',
      MEMBER_BANNED: '榴莲会员已被封禁',
      NETWORK_ERROR: '查询失败，请稍后再试',
      RATE_LIMITED: '请求过频，请稍后再试',
      NO_CREDENTIAL: '查询功能暂未开放，请稍后再试',
    };
    e.reply(`查询失败：${msgMap[ret.errorCode] || '接口异常，请稍后再试'}`);
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
export async function startRound(e, gameType) {
  const ownerQqs = getOwnerQqs();
  if (!getSecret() || !ownerQqs.length) return '';
  const groupId = String(e.group_id || '');
  if (!/^\d{4,20}$/.test(groupId)) return '';
  if (!['genshin', 'star', 'zzz', 'ww', 'nte'].includes(gameType)) return '';
  const ret = await signedRequest('POST', ROUND_START_PATH, { groupId, game: gameType });
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

// 对局结算：一次性上报本局结果（含 0 分参与条目）
export async function finishRound(roundId, results) {
  if (!roundId || !results) return;
  try {
    const ret = await signedRequest('POST', ROUND_FINISH_PATH, { roundId, results });
    if (ret.ok) {
      if (ret.data && ret.data.invalidCount > 0) {
        logger.mark(`[榴莲会员] 对局结算完成，异常条目 ${ret.data.invalidCount} 条: ${JSON.stringify(ret.data.invalidItems)}`);
      }
      return;
    }
    if (ret.errorCode === 'MEMBER_EXPIRED') {
      logger.mark('[榴莲会员] 会员已过期，结算未入账');
      return;
    }
    // 重复结算/已过期/赢家校验失败等：roundId 已不可用，清理本地记录
    logger.mark(`[榴莲会员] 对局结算未通过: ${ret.errorCode}`);
  } catch (err) {
    logger.warn(`[榴莲会员] 对局结算请求失败: ${err.message}`);
  } finally {
    cleanupRound(roundId);
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
  const ret = await signedRequest('GET', `${RANKING_PATH}?${qs}`);
  if (!ret.ok) {
    logger.mark(`[榴莲会员] 排名查询未通过: ${ret.errorCode}`);
    return null;
  }
  return ret.data;
}

// 群总分榜（群与群比）：可选 groupId 返回本群名次，game/period 口径与用户榜一致
export async function fetchGroupRanking(top = 10, groupId = '', game = '', period = '') {
  let qs = `top=${top}`;
  if (groupId) qs += `&groupId=${groupId}`;
  if (game) qs += `&game=${game}`;
  if (period) qs += `&period=${period}&offset=${tzOffset()}`;
  const ret = await signedRequest('GET', `${GROUP_RANKING_PATH}?${qs}`);
  if (!ret.ok) {
    logger.mark(`[榴莲会员] 群榜查询未通过: ${ret.errorCode}`);
    return null;
  }
  return ret.data;
}
