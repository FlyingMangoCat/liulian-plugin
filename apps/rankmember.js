import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

// 会员密钥与对局上报
// 密钥单独落盘存储，请求时拼接进请求头；接口地址在此配置，后端就绪后填入域名即可
const DATA_DIR = path.join(process.cwd(), 'data', 'guessrank');
const MEMBER_FILE = path.join(DATA_DIR, 'member.json');

const API_BASE = '';            // TODO: 后端就绪后填入接口域名
const MEMBER_VERIFY_URL = '';   // TODO: 后端就绪后填入密钥验证地址（返回有效期）
const ROUND_START_URL = '/api/rank/round/start';
const ROUND_FINISH_URL = '/api/rank/round/finish';

let memberCache = null;

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

export function getMemberKey() {
  const m = readMember();
  return m && m.key ? m.key : '';
}

export function getMemberExpiry() {
  const m = readMember();
  return m && m.expiry ? m.expiry : '';
}

// 验证密钥：仅验证通过且返回有效期才允许落盘，避免无效密钥污染本地数据
// 验证时附带配置环境文件中的主人 QQ 供服务端核对归属
async function verifyKey(key, masterQQ) {
  if (!MEMBER_VERIFY_URL) return { ok: false, msg: '绑定功能暂未开放，请稍后再试' };
  try {
    const res = await fetch(MEMBER_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: key },
      body: JSON.stringify({ masterQQ: String(masterQQ || '') }),
    });
    const ret = await res.json();
    if (ret.code === 0 || ret.code === 200) {
      const expiry = (ret.data && ret.data.expiry) || ret.expiry || '';
      if (!expiry) return { ok: false, msg: '验证返回异常，未收到有效期' };
      return { ok: true, expiry };
    }
    return { ok: false, msg: ret.msg || ret.message || '密钥无效' };
  } catch (err) {
    logger.warn(`[榴莲会员] 密钥验证请求失败: ${err.message}`);
    return { ok: false, msg: '验证请求失败，请稍后再试' };
  }
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
  const key = (e.msg || '').trim();
  if (!key) return false;

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

  // 主人 QQ 取自配置环境文件，随验证请求一并发送供服务端核对
  const masterQQ = Array.isArray(BotConfig?.masterQQ) ? BotConfig.masterQQ[0] : BotConfig?.masterQQ;
  const ret = await verifyKey(key, masterQQ);
  if (!ret.ok) {
    recordBindFail();
    e.reply(`绑定失败：${ret.msg}`);
    return true;
  }
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    memberCache = { key, expiry: ret.expiry };
    fs.writeFileSync(MEMBER_FILE, JSON.stringify(memberCache, null, 2), 'utf-8');
    logger.mark(`[榴莲会员] 密钥绑定成功，有效期至 ${ret.expiry}`);
    e.reply(`绑定成功，会员有效期至 ${ret.expiry}`);
  } catch (err) {
    memberCache = null;
    logger.warn(`[榴莲会员] 密钥写入失败: ${err.message}`);
    e.reply('绑定验证通过，但本地保存失败，请稍后重试');
  }
  return true;
}

const pendingBinds = new Map();

// 对局上报：开局登记，返回 roundId（未配置/无密钥/业务冲突时静默返回空，不打扰用户）
export async function startRound(e, gameType) {
  if (!API_BASE || !getMemberKey()) return '';
  try {
    const res = await fetch(API_BASE + ROUND_START_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: getMemberKey() },
      body: JSON.stringify({ groupId: String(e.group_id || '') }),
    });
    const ret = await res.json();
    if (ret.code === 0 || ret.code === 200) {
      return (ret.data && ret.data.roundId) || ret.roundId || '';
    }
    if (/MEMBER_EXPIRED/.test(ret.code || ret.error || '')) {
      e.reply('榴莲会员已过期，请续费后再试~');
      return '';
    }
    // 业务冲突（对局已存在/冷却中）：正常现象，只记录不发消息
    logger.mark(`[榴莲会员] 对局开局未通过: ${ret.code || ret.error}`);
  } catch (err) {
    logger.warn(`[榴莲会员] 对局开局请求失败: ${err.message}`);
  }
  return '';
}

// 对局结算：一次性上报本局结果（含 0 分参与条目），超时无赢家的局不上报，由服务端过期兜底
export async function finishRound(roundId, results) {
  if (!API_BASE || !roundId || !results || !results.length) return;
  try {
    const res = await fetch(API_BASE + ROUND_FINISH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: getMemberKey() },
      body: JSON.stringify({ roundId, results }),
    });
    const ret = await res.json();
    if (ret.code === 0 || ret.code === 200) return;
    // 重复结算/已过期属正常时序，只记录不发消息
    logger.mark(`[榴莲会员] 对局结算未通过: ${ret.code || ret.error}`);
  } catch (err) {
    logger.warn(`[榴莲会员] 对局结算请求失败: ${err.message}`);
  }
}
