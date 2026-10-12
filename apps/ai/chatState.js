// AI 决策状态模块 —— 参考 MaiBot 触发体系移植：
// 全量收录（accept 调用，纯同步）→ 逻辑回归评分 → 额度门控（只收紧不放宽）→ 空闲退避
// 另含双层上下文（远期摘要 + 近期原文目录）与 [查看 #N] 取阅支持
import config from '#liulian.config';

// 每个会话（群/私聊）一份状态
const chatStates = new Map();

// 摘要/视觉描述处理器由 ai/index.js 初始化时注入，避免循环依赖
const processors = {
  summarize: null,      // async (text) => summaryText
  describeImage: null   // async (url, hint) => descriptionText
};

export function setProcessors(p) {
  if (p.summarize) processors.summarize = p.summarize;
  if (p.describeImage) processors.describeImage = p.describeImage;
}

function getDecisionCfg() {
  return config.ai?.decision || {};
}

function getWindowSec() {
  return Number(getDecisionCfg().window_sec) || 300;
}

// ==================== 收录（accept 调用，必须纯同步轻量） ====================

// 把消息数组压成轻量记录：不 await、不清洗 CQ 原文（原文留到取阅时用）
function extractParts(e) {
  const parts = [];
  let isAtMe = false;
  let isAtOther = false;
  let isMediaOnly = true; // 是否纯图/表情（无文字）
  let textLen = 0;

  const msgArr = Array.isArray(e.message) ? e.message : (e.msg ? [{ type: 'text', text: String(e.msg) }] : []);
  for (const m of msgArr) {
    if (!m || !m.type) continue;
    switch (m.type) {
      case 'text': {
        const t = String(m.text || '').trim();
        if (t) {
          parts.push({ kind: 'text', text: t });
          textLen += t.length;
          isMediaOnly = false;
        }
        break;
      }
      case 'at': {
        if (String(m.qq) === String(e.self_id)) isAtMe = true;
        else isAtOther = true;
        parts.push({ kind: 'at', qq: m.qq });
        break;
      }
      case 'image': {
        parts.push({ kind: 'image', url: m.url || m.file || '' });
        break;
      }
      case 'mface': { // 表情包（有图）
        parts.push({ kind: 'mface', url: m.url || '', name: m.name || '' });
        break;
      }
      case 'face': { // QQ 小黄脸（无图，只有 id）
        parts.push({ kind: 'face', id: m.id });
        isMediaOnly = false;
        break;
      }
      case 'reply': case 'forward': case 'xml': case 'json': {
        parts.push({ kind: 'other', type: m.type });
        break;
      }
      default: break;
    }
  }
  return { parts, isAtMe, isAtOther, isMediaOnly: isMediaOnly && textLen === 0 && parts.some(p => p.kind === 'image' || p.kind === 'mface'), msgArr };
}

// 生成目录用预览（清洗版，截断）
function previewOf(rec) {
  const seg = rec.parts.map(p => {
    if (p.kind === 'text') return p.text;
    if (p.kind === 'at') return '@某群友';
    if (p.kind === 'image') return '[图片]';
    if (p.kind === 'mface') return p.name ? `[表情包:${p.name}]` : '[表情包]';
    if (p.kind === 'face') return `[表情:${p.id}]`;
    return `[${p.type || '消息'}]`;
  }).join(' ');
  const maxLen = Number(getDecisionCfg().preview_len) || 20;
  return seg.length > maxLen ? seg.slice(0, maxLen) + '…' : seg;
}

// 全量收录入口（由 LiulianV3.accept 的 check 规则调用，纯同步）
export function record(e) {
  if (!e) return false;
  if (String(e.user_id) === String(e.self_id)) return false; // 忽略自身

  const chatId = e.group_id ? `g${e.group_id}` : `p${e.user_id}`;
  let st = chatStates.get(chatId);
  if (!st) {
    st = {
      chatId, isGroup: !!e.group_id, selfId: String(e.self_id),
      msgs: [], nextId: 1,
      lastReplyAt: 0,        // bot 上次真实发言时间
      idleCount: 0,          // 连续沉默周期数（空闲退避）
      forced: [],            // 窗口内强制回复（@/私聊）时间戳
      replied10m: [],        // 近10分钟真实回复时间戳（额度反馈）
      summary: '', summaryUntilId: 0, summarizing: false
    };
    chatStates.set(chatId, st);
  }

  const now = Date.now();
  const { parts, isAtMe, isAtOther, isMediaOnly, msgArr } = extractParts(e);
  const rec = {
    id: st.nextId++,
    t: now,
    senderId: String(e.user_id),
    senderName: (e.sender?.card || e.sender?.nickname || '').slice(0, 12),
    parts, raw: msgArr, // 原始 message 数组，取阅时用（保持原样不清洗）
    isAtMe, isAtOther, isMediaOnly,
    hasQuestion: parts.some(p => p.kind === 'text' && /[?？]/.test(p.text))
  };
  st.msgs.push(rec);
  return rec;
}

// 滑窗：清理过过期消息
function trimWindow(st) {
  const win = getWindowSec() * 1000;
  const cutoff = Date.now() - win;
  st.msgs = st.msgs.filter(m => m.t >= cutoff || m.id > st.summaryUntilId);
  if (st.msgs.length > 400) st.msgs = st.msgs.slice(-400);
  st.forced = st.forced.filter(t => Date.now() - t < getWindowSec() * 1000);
  st.replied10m = st.replied10m.filter(t => Date.now() - t < 600000);
}

// ==================== 评分（逻辑回归，权重来自 MaiBot 离线拟合） ====================

export function buildFeatures(st, msgs) {
  trimWindow(st);
  const now = Date.now();
  const recent = msgs || st.msgs;
  const winSec = getWindowSec();
  const silenceSec = st.lastReplyAt ? (now - st.lastReplyAt) / 1000 : winSec;
  const pending = recent.filter(m => now - m.t < 60000).length;

  return {
    atMe: recent.some(m => m.isAtMe) ? 1 : 0,
    atOther: recent.some(m => m.isAtOther) && !recent.some(m => m.isAtMe) ? 1 : 0,
    hasQuestion: recent.some(m => m.hasQuestion) ? 1 : 0,
    mediaOnly: recent.length > 0 && recent.every(m => m.isMediaOnly) ? 1 : 0,
    selfRatio: st.lastReplyAt && recent.length ? recent.filter(m => m.t >= st.lastReplyAt).length / recent.length : 0,
    msgCount: recent.length / Math.max(winSec / 60, 1), // 每分钟消息数
    silenceSec,
    pending
  };
}

// 逻辑回归：MaiBot reply_likelihood.py 的权重直接作先验
export function estimateReplyProbability(st, msgs) {
  const f = buildFeatures(st, msgs);
  const logit = -1.2005
    + 1.5852 * f.atMe
    - 1.1157 * f.atOther
    + 0.4807 * f.hasQuestion
    - 1.0281 * f.mediaOnly
    + 2.6525 * f.selfRatio
    - 0.0367 * f.msgCount
    + 0.0571 * Math.log1p(Math.max(f.silenceSec, 0))
    + 0.1012 * f.pending;
  return 1 / (1 + Math.exp(-logit));
}

// ==================== 额度门控（只收紧不放宽） ====================

function getGateCfg() {
  const d = getDecisionCfg();
  return {
    virtualTurnSec: Number(d.virtual_turn_sec) || 40,
    targetPer10m: Number(d.target_replies_per_10min) || 3,
    staticThreshold: Number(d.static_threshold) || 0.35,
    minSamples: 20
  };
}

// 窗口内的动态阈值：按概率降序累计到保留额度处的概率值
function dynamicThreshold(st, prob) {
  const g = getGateCfg();
  trimWindow(st);
  const now = Date.now();

  // 保留额度 = 目标频率折算到窗口 × 反馈因子（实际超了就收紧，clamp [0.5,1]）
  const winMin = getWindowSec() / 60;
  const target = g.targetPer10m * winMin / 10;
  const actual = st.replied10m.length;
  const feedback = Math.max(0.5, Math.min(1, 1 + (target - actual) / Math.max(target, 0.1)));
  // 强制回复（@等）占额度
  const expectedForced = st.forced.length;
  const quota = Math.max(0, Math.round(target * feedback - expectedForced));
  if (quota === 0) return 1; // 额度用尽，本轮不主动回

  // 40 秒虚拟轮次：每轮取轮内消息的最高概率作为该轮评分样本
  const turnMs = g.virtualTurnSec * 1000;
  const turns = [];
  for (let end = now; end > now - getWindowSec() * 1000; end -= turnMs) {
    const inTurn = st.msgs.filter(m => m.t > end - turnMs && m.t <= end);
    if (inTurn.length) turns.push(estimateReplyProbability(st, inTurn));
  }
  if (turns.length < 2) return g.staticThreshold; // 样本不足退静态阈值

  turns.sort((a, b) => b - a);
  const idx = Math.min(quota, turns.length) - 1;
  return Math.max(g.staticThreshold, turns[idx]); // 只收紧不放宽
}

// ==================== 空闲退避 ====================

function getBackoffCfg() {
  const d = getDecisionCfg();
  return {
    base: Number(d.backoff_base_sec) || 60,
    cap: Number(d.backoff_cap_sec) || 1800,
    start: Number(d.backoff_start_count) || 2,
    bypassPending: Number(d.bypass_pending) || 8
  };
}

function cooldownRemain(st) {
  if (st.isGroup === false) return 0; // 私聊不退避
  const b = getBackoffCfg();
  if (st.idleCount < b.start) return 0;
  const cooldown = Math.min(b.cap, b.base * Math.pow(2, st.idleCount - b.start));
  const remain = (st.lastIdleAt || 0) + cooldown * 1000 - Date.now();
  // 积压消息多时绕过冷却（群里炸锅必须能接上）
  const pending = st.msgs.filter(m => Date.now() - m.t < 60000).length;
  if (pending >= b.bypassPending) return 0;
  return Math.max(0, remain / 1000);
}

// ==================== 决策入口 ====================

// 决策结果：true=允许进入模型（强制回复或评分通过），false=跳过（零 token）
export function shouldAutoReply(e) {
  const isPrivate = !e.group_id;
  // 私聊直通不依赖收录状态（收录可能因异常缺失，私聊不受门控约束）
  if (isPrivate) return { ok: true, reason: 'private' };

  const chatId = e.group_id ? `g${e.group_id}` : `p${e.user_id}`;
  const st = chatStates.get(chatId);
  if (!st) return { ok: false, reason: 'no_state' };

  const isAtMe = Array.isArray(e.message) && e.message.some(m => m.type === 'at' && String(m.qq) === String(e.self_id));

  // 被@强制回复（计入额度，防@刷屏）
  if (isAtMe) {
    st.forced.push(Date.now());
    return { ok: true, reason: 'at_me' };
  }

  // 群聊主动回复：额度门控 + 空闲退避
  const cd = cooldownRemain(st);
  if (cd > 0) return { ok: false, reason: `cooldown_${Math.ceil(cd)}s` };
  const prob = estimateReplyProbability(st);
  const threshold = dynamicThreshold(st, prob);
  return { ok: prob >= threshold, prob: Number(prob.toFixed(3)), threshold: Number(threshold.toFixed(3)), reason: prob >= threshold ? 'score_pass' : 'score_low' };
}

// 触发名等直通条件也计入额度（占额度防刷屏）
export function markForced(e) {
  const chatId = e.group_id ? `g${e.group_id}` : `p${e.user_id}`;
  const st = chatStates.get(chatId);
  if (st) st.forced.push(Date.now());
}

// bot 真实回复后调用：重置退避 + 记入反馈
export function markReplied(e) {
  const chatId = e.group_id ? `g${e.group_id}` : `p${e.user_id}`;
  const st = chatStates.get(chatId);
  if (!st) return;
  st.lastReplyAt = Date.now();
  st.idleCount = 0;
  st.replied10m.push(Date.now());
}

// 模型输出 [沉默] 后调用：累加空闲退避
export function markSilent(e) {
  const chatId = e.group_id ? `g${e.group_id}` : `p${e.user_id}`;
  const st = chatStates.get(chatId);
  if (!st) return;
  st.idleCount++;
  st.lastIdleAt = Date.now();
}

// ==================== 双层上下文（远期摘要 + 近期目录） ====================

export function buildContextBlock(e) {
  const chatId = e.group_id ? `g${e.group_id}` : `p${e.user_id}`;
  const st = chatStates.get(chatId);
  if (!st || !st.msgs.length) return '';

  const d = getDecisionCfg();
  const recentN = Number(d.digest_recent) || 10;
  trimWindow(st);
  const recent = st.msgs.slice(-recentN);

  const lines = recent.map(m => `#${m.id} ${m.senderName || '群友'}: ${previewOf(m)}`);
  const block = ['【近期聊天目录（编号索引，正文见下）】', ...lines].join('\n');

  const summaryPart = st.summary ? `\n【更早聊过的事（摘要，非原文）】\n${st.summary}\n` : '';
  const rules = [
    '【使用说明】',
    '- 目录只是索引；如某条消息内容对你的判断重要，先单独回复 [查看 #编号]，会补发该条原文，你再作正式回复。',
    '- 只允许查看一次。看过后必须给出正式回复，或回复 [沉默] 表示此刻不接话。',
    '- 如果判断此刻接话会很尴尬（没人等你说话、话题已过、接不上），宁可回复 [沉默]，不要勉强找话说。'
  ].join('\n');

  return `${summaryPart}${block}\n${rules}`;
}

// 取阅一条消息的"可用内容"：图片/表情包走视觉模型转文字，其余给原文
export async function fetchMsgContent(chatId, id) {
  const st = chatStates.get(chatId);
  if (!st) return null;
  const rec = st.msgs.find(m => m.id === Number(id));
  if (!rec) return null;

  const imgPart = rec.parts.find(p => (p.kind === 'image' || p.kind === 'mface') && p.url);
  if (imgPart && processors.describeImage) {
    try {
      const desc = await processors.describeImage(imgPart.url, '群聊上下文里的图片');
      return `#${rec.id} ${rec.senderName || '群友'} 发送了图片，视觉识别：${desc}`;
    } catch { /* 视觉失败降级为原文 */ }
  }
  // 原文拼接（保持原始内容，不清洗 CQ 码）
  const raw = rec.parts.map(p => p.kind === 'text' ? p.text
    : p.kind === 'at' ? `@${String(p.qq) === String(st.selfId) ? '我' : '某人'}`
    : p.kind === 'image' ? '[图片]'
    : p.kind === 'mface' ? '[表情包]'
    : p.kind === 'face' ? `[表情:${p.id}]` : ''
  ).join(' ').trim() || previewOf(rec);
  return `#${rec.id} ${rec.senderName || '群友'}: ${raw}`;
}

// ==================== 远期摘要（后台异步，不在回复路径上） ====================

const SUMMARY_MIN = () => Number(getDecisionCfg().summary_min_msgs) || 20;

// bot 回复后 fire-and-forget 触发；摘要覆盖 [summaryUntilId+1 .. 窗口外] 的消息
export function maybeSummarize(e) {
  const chatId = e.group_id ? `g${e.group_id}` : `p${e.user_id}`;
  const st = chatStates.get(chatId);
  if (!st || st.summarizing || !processors.summarize) return;
  trimWindow(st);
  const win = getWindowSec() * 1000;
  const unsummarized = st.msgs.filter(m => m.id > st.summaryUntilId && Date.now() - m.t > win / 2);
  if (unsummarized.length < SUMMARY_MIN()) return;

  st.summarizing = true;
  const text = unsummarized.map(m => `#${m.id} ${m.senderName || '群友'}: ${previewOf(m)}`).join('\n');
  const fromId = unsummarized[0].id;
  const toId = unsummarized[unsummarized.length - 1].id;

  processors.summarize(text).then(summary => {
    if (summary) {
      st.summary = st.summary ? `${st.summary}\n（续）${summary}` : summary;
      st.summaryUntilId = Math.max(st.summaryUntilId, toId);
    }
  }).catch(() => {}).finally(() => { st.summarizing = false; });
}

// 供外部（admin/状态页）查看
export function getStateSnapshot() {
  const snap = [];
  for (const [chatId, st] of chatStates) {
    snap.push({
      chatId, msgCount: st.msgs.length, nextId: st.nextId,
      idleCount: st.idleCount, summaryLen: (st.summary || '').length,
      summaryUntilId: st.summaryUntilId,
      lastReplyAt: st.lastReplyAt ? new Date(st.lastReplyAt).toISOString() : null
    });
  }
  return snap;
}
