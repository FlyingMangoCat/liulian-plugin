/*
* 榴莲会员 - 服务对接公共层
* 功能：凭据管理 + HMAC 签名 + 带签请求（JSON / 原始字节两种）
* 排名系统、表情服务等所有服务端功能统一走这里，勿各自重复实现
* */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import fetch from 'node-fetch';
import { botConfig, liulianSafe } from "./bcommon.js";

const DATA_DIR = path.join(process.cwd(), 'data', 'guessrank');
const MEMBER_FILE = path.join(DATA_DIR, 'member.json');
const API_BASE = 'https://api-forum.liulian-ai.top';

let memberCache = null;

// 读取密钥档案（绑定状态查询/展示用）
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

// 保存密钥档案（绑定成功写入；传 null 清空缓存）——缓存与落盘都在此维护，勿在外部直写文件
function saveMember(data) {
  if (data === null) {
    memberCache = null;
    return;
  }
  memberCache = data;
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(MEMBER_FILE, JSON.stringify(memberCache, null, 2), 'utf-8');
  } catch (err) {
    memberCache = null;
    throw err;
  }
}

// 会员密钥（发放时落盘，不随请求传输）
function getSecret() {
  const m = readMember();
  return m && m.secret ? m.secret : '';
}

// 主人 QQ（请求头 X-Owner-Qq 用，必须是管理员留档列表的子集）
// 每次调用实时读取运行时配置（与 e.isMaster 同源），任何身份不落盘：
//   1. 本机 bot 账号名下的主人（TRSS Bot.cfg.master 按 uin 匹配）
//   2. 全局 masterQQ（TRSS Bot.cfg.masterQQ）
//   3. V3 全局 BotConfig
// 只保留纯数字 QQ 号（过滤 stdin/内部 ID 等非 QQ 条目）
let ownerEmptyDumped = false;
function getOwnerQqs() {
  const out = [];
  const push = v => {
    if (v == null) return;
    const s = String(v).split(':').pop().trim();
    // 只保留纯数字 QQ 号（5~12 位）：过滤 stdin 控制台、内部账号 ID 等非 QQ 条目
    if (/^\d{5,12}$/.test(s) && !out.includes(s)) out.push(s);
  };
  // 当前机器人账号（TRSS 为数组，V3 为单值）
  let uins = [];
  try {
    const u = liulianSafe?.uin;
    if (u != null) uins = (Array.isArray(u) ? u : [u]).map(String);
  } catch {}
  try {
    if (typeof Bot !== 'undefined' && Bot.cfg) {
      const m = Bot.cfg.master;
      if (m && typeof m === 'object') {
        for (const [botId, list] of Object.entries(m)) {
          if (uins.includes(String(botId))) (Array.isArray(list) ? list : [list]).forEach(push);
        }
        if (!out.length) {
          const g = Bot.cfg.masterQQ;
          (Array.isArray(g) ? g : (g ? [g] : [])).forEach(push);
        }
      }
    }
  } catch (err) {
    logger.warn(`[榴莲会员] 读取运行时主人配置异常: ${err.message}`);
  }
  if (out.length) return out;
  // 兜底：V3 全局 BotConfig（bcommon 已做归一化）
  const v3 = botConfig?.masterQQ;
  (Array.isArray(v3) ? v3 : (v3 ? [v3] : [])).forEach(push);
  // 已绑定却读不到主人才属异常，此时 dump 运行时原始值定位（只打一次防刷屏）；未绑定属正常状态不打印
  if (!out.length && getSecret() && !ownerEmptyDumped) {
    ownerEmptyDumped = true;
    try {
      const dump = {
        uin: uins,
        hasBot: typeof Bot !== 'undefined',
        hasCfg: typeof Bot !== 'undefined' ? !!Bot.cfg : false,
        master: typeof Bot !== 'undefined' && Bot.cfg ? Bot.cfg.master : undefined,
        masterQQ: typeof Bot !== 'undefined' && Bot.cfg ? Bot.cfg.masterQQ : undefined,
        botConfigQQ: v3,
      };
      logger.warn(`[榴莲会员] 主人列表为空，运行时原始值: ${JSON.stringify(dump)}`);
    } catch (err) {
      logger.warn(`[榴莲会员] 主人列表为空，诊断失败: ${err.message}`);
    }
  }
  return out;
}

// ============ HMAC 签名 ============
// 签名输入为实际发送的原始请求体字节（JSON 串或 multipart 原始字节，序列化一次原样发送）
// GET / 无 body 时 bodyHash = SHA-256('')
function buildHeaders(method, secret, ownerQqs, bodyBytes) {
  const timestamp = String(Date.now());
  const nonce = crypto.randomBytes(16).toString('hex');
  const ownerQq = ownerQqs.join(',');
  const hasBody = !(method === 'GET' || bodyBytes === undefined || bodyBytes === null);
  const raw = hasBody ? bodyBytes : '';
  const bodyHash = crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
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

// 统一请求执行：每轮尝试都用新时间戳/新 nonce 重新签名后发送（重试禁止复用旧签名头，防 SIGN_NONCE_REUSED）
// sign = { method, secret, ownerQqs, bodyBytes, extraHeaders }；返回 { ok, data, buffer, errorCode }
async function doRequest(sign, url) {
  for (let attempt = 0; attempt < 2; attempt++) {
    let res = null;
    try {
      const headers = { ...buildHeaders(sign.method, sign.secret, sign.ownerQqs, sign.bodyBytes), ...(sign.extraHeaders || {}) };
      res = await fetch(url, { method: sign.method, headers, body: sign.method === 'GET' ? undefined : sign.bodyBytes, signal: AbortSignal.timeout(30000) });
      const contentType = res.headers.get('content-type') || '';
      // 图片流响应：直接取二进制，不解析 JSON
      if (contentType.startsWith('image/')) {
        if (res.ok) return { ok: true, buffer: Buffer.from(await res.arrayBuffer()) };
        return { ok: false, errorCode: `HTTP_${res.status}` };
      }
      let ret = null;
      try { ret = await res.json(); } catch {}
      if (ret && ret.success) return { ok: true, data: ret.data };
      const errorCode = (ret && ret.errorCode) || '';
      // 无 errorCode 的响应（网关超时/非 JSON 错误页等）：视作网络类故障，退避后重新签名重试一次
      if (!errorCode) {
        logger.mark(`[榴莲会员] 服务接口异常响应: HTTP ${res.status}`);
        if (attempt === 0) {
          await new Promise(r => setTimeout(r, 5 * 1000));
          continue;
        }
        return { ok: false, errorCode: 'SERVICE_UNAVAILABLE' };
      }
      // 可重试：限流退避 ≥5 秒后重新签名重试一次；其余错误码直接返回
      if (errorCode === 'RATE_LIMITED' && attempt === 0) {
        await new Promise(r => setTimeout(r, 5 * 1000));
        continue;
      }
      return { ok: false, errorCode };
    } catch (err) {
      // 网络错误：退避后重新签名重试一次
      if (attempt === 0) {
        await new Promise(r => setTimeout(r, 5 * 1000));
        continue;
      }
      logger.warn(`[榴莲会员] 服务请求失败: ${err.message}`);
      return { ok: false, errorCode: 'NETWORK_ERROR' };
    }
  }
}

// JSON 请求（排名系统等）：bodyObj 序列化后签名并原样发送
// secretOverride：绑定验证等场景用候选密钥签名（缺省用已落盘密钥）
// ownerQqOverride：绑定验证等场景直接指定主人 QQ（如已通过 isMaster 判定的绑定人）
async function signedJsonRequest(method, apiPath, bodyObj, secretOverride, ownerQqOverride) {
  const secret = secretOverride || getSecret();
  const ownerQqs = ownerQqOverride ? [String(ownerQqOverride)] : getOwnerQqs();
  if (!secret || !ownerQqs.length) return { ok: false, errorCode: 'NO_CREDENTIAL' };
  const rawBody = (method === 'GET' || bodyObj === undefined) ? '' : JSON.stringify(bodyObj);
  return doRequest({ method, secret, ownerQqs, bodyBytes: rawBody }, API_BASE + apiPath);
}

// 原始字节请求（multipart 等）：调用方构造好原始字节后签名发送，签名与发送用同一份
// extraHeaders 用于覆盖 Content-Type（如 multipart 需自带 boundary）
async function signedRawRequest(method, apiPath, bodyBytes, extraHeaders = {}) {
  const secret = getSecret();
  const ownerQqs = getOwnerQqs();
  if (!secret || !ownerQqs.length) return { ok: false, errorCode: 'NO_CREDENTIAL' };
  return doRequest({ method, secret, ownerQqs, bodyBytes, extraHeaders }, API_BASE + apiPath);
}

export {
  DATA_DIR,
  getSecret,
  getOwnerQqs,
  readMember,
  saveMember,
  buildHeaders,
  signedJsonRequest,
  signedRawRequest,
};
