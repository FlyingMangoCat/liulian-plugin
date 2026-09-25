import fs from 'fs';
import path from 'path';

// 数据落在 Yunzai 根目录的 data 下（运行时 process.cwd() 即 Yunzai 根），与 ck/面板数据同位置
const DATA_DIR = path.join(process.cwd(), 'data', 'guessrank');
const DATA_FILE = path.join(DATA_DIR, 'rank.json');
const FLUSH_DELAY = 3000;

// 周期key：日=自然日、周=周一~周日（取周一日期）、月=自然月、年=自然年
export function periodKeys(now = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  const fmt = (d) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  return {
    day: fmt(now),
    week: fmt(monday),
    month: `${now.getFullYear()}-${p(now.getMonth() + 1)}`,
    year: String(now.getFullYear()),
  };
}

class GuessRankDB {
  constructor() {
    this.data = null;
    this.flushTimer = null;
    this.seen = new Map(); // 消息去重：同一条消息只记一次
  }

  load() {
    if (this.data) return this.data;
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    try {
      if (fs.existsSync(DATA_FILE)) {
        this.data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      }
    } catch (err) {
      console.error('[GuessRank] 排行数据读取失败，已重建:', err.message);
      this.data = null;
    }
    if (!this.data || typeof this.data !== 'object') {
      this.data = {};
      this.flushSync();
    }
    for (const period of ['day', 'week', 'month', 'year']) {
      if (!this.data[period]) this.data[period] = {};
    }
    return this.data;
  }

  // 定位(周期, 范围, 游戏)下的用户表；scopeType: group=群内 server=全服
  bucket(period, key, scopeType, scopeId, game) {
    const d = this.load();
    if (!d[period]) d[period] = {};
    if (!d[period][key]) d[period][key] = {};
    if (!d[period][key][scopeType]) d[period][key][scopeType] = {};
    let target = d[period][key][scopeType];
    if (scopeType === 'group') {
      if (!target[scopeId]) target[scopeId] = {};
      target = target[scopeId];
    }
    if (!target[game]) target[game] = {};
    return target[game];
  }

  // 记录一次答题：score按0/1/3分，isCorrect=true时答对数+1，参与数恒+1
  record({ gameType, e, score = 0, isCorrect = false }) {
    if (!gameType || !e || !e.user_id) return;
    const userId = String(e.user_id);
    const msgKey = e.message_id ? `m${e.message_id}` : `t${e.time}_${userId}_${e.msg}`;
    this.cleanSeen();
    if (this.seen.has(msgKey)) return;
    this.seen.set(msgKey, Date.now());

    const keys = periodKeys();
    const scopes = [{ type: 'server', id: '' }];
    if (e.group_id) scopes.push({ type: 'group', id: String(e.group_id) });
    const games = [gameType, 'total'];
    for (const period of Object.keys(keys)) {
      for (const sc of scopes) {
        for (const game of games) {
          const users = this.bucket(period, keys[period], sc.type, sc.id, game);
          if (!users[userId]) users[userId] = { s: 0, w: 0, p: 0 };
          users[userId].s += score;
          users[userId].p += 1;
          if (isCorrect) users[userId].w += 1;
        }
      }
    }
    this.flushSoon();
  }

  cleanSeen() {
    const now = Date.now();
    if (this.seen.size > 500) {
      for (const [k, t] of this.seen) {
        if (now - t > 120000) this.seen.delete(k);
      }
    }
    if (this.seen.size > 1000) this.seen.clear();
  }

  sortedList(period, scope, scopeId, game) {
    const keys = periodKeys();
    const d = this.load();
    const pd = d[period] && d[period][keys[period]];
    if (!pd) return [];
    let users = null;
    if (scope === 'group') {
      users = pd.group && pd.group[scopeId] && pd.group[scopeId][game];
    } else {
      users = pd.server && pd.server[game];
    }
    if (!users) return [];
    return Object.entries(users)
      .map(([userId, v]) => ({ userId, score: v.s || 0, wins: v.w || 0, parts: v.p || 0 }))
      .sort((a, b) => b.score - a.score || b.wins - a.wins || b.parts - a.parts || a.userId.localeCompare(b.userId));
  }

  // 排行查询：period=day|week|month|year, scope=group|server, game=游戏类型|total
  getRank({ period = 'day', scope = 'group', groupId, game = 'total', topN = 10 }) {
    return this.sortedList(period, scope, scope === 'group' ? String(groupId || '') : '', game).slice(0, topN);
  }

  // 指定用户的排名与数据（不在榜内时返回 null）
  getUserRank({ period = 'day', scope = 'group', groupId, game = 'total', userId }) {
    const list = this.sortedList(period, scope, scope === 'group' ? String(groupId || '') : '', game);
    const idx = list.findIndex(u => u.userId === String(userId));
    if (idx < 0) return null;
    return { rank: idx + 1, ...list[idx] };
  }

  flushSoon() {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.flushSync();
    }, FLUSH_DELAY);
    if (this.flushTimer.unref) this.flushTimer.unref();
  }

  flushSync() {
    try {
      if (!this.data) return;
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[GuessRank] 排行数据写入失败:', err.message);
    }
  }
}

const guessRank = new GuessRankDB();
process.on('exit', () => guessRank.flushSync());

export { guessRank };
export default guessRank;
