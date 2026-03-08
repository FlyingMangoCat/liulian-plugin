import fetch from "node-fetch";
import config from "../model/config/config.js";

// 安全获取segment对象
const segment = global.segment || global.Bot?.segment || {}

// 常见英文单词列表
const commonWords = [
  'hello', 'world', 'happy', 'love', 'beautiful', 'today', 'tomorrow', 'friend',
  'morning', 'evening', 'night', 'school', 'work', 'home', 'family', 'book',
  'computer', 'phone', 'music', 'movie', 'food', 'water', 'coffee', 'tea',
  'time', 'money', 'people', 'place', 'thing', 'something', 'nothing', 'everything',
  'good', 'bad', 'new', 'old', 'big', 'small', 'long', 'short', 'right', 'wrong',
  'think', 'know', 'want', 'need', 'like', 'love', 'hate', 'hope', 'dream',
  'walk', 'run', 'jump', 'talk', 'speak', 'listen', 'read', 'write', 'learn',
  'year', 'month', 'week', 'day', 'hour', 'minute', 'second', 'spring', 'summer',
  'autumn', 'winter', 'sun', 'moon', 'star', 'sky', 'cloud', 'rain', 'snow', 'wind',
  'red', 'blue', 'green', 'yellow', 'black', 'white', 'orange', 'purple', 'pink'
];

// 游戏状态管理
const dailyGames = new Map();

export const rule = {
  dailyword: {
    reg: "^[^-]*(每日句子|english|句子)$",
    priority: 10,
    describe: "每日句子",
  },
  dailywordCheck: {
    reg: "(.*)",
    priority: 9,
    describe: "",
  },
  sentence: {
    reg: "^[^-]*(每日单词|word|单词)$",
    priority: 1,
    describe: "每日单词",
  },
  sentenceCheck: {
    reg: "(.*)",
    priority: 9,
    describe: "",
  },
};

// 翻译函数
async function translate(text) {
  const cfg = config.getdefault_config('liulian', 'token', 'config');
  const apikeys = cfg.apikeys;
  const apikey = apikeys.fanyi_apikey || '';
  
  let url = `https://api.oick.cn/api/fanyi?text=${encodeURIComponent(text)}&apikey=${apikey}`;
  let response = await fetch(url);
  let res = await response.json();
  
  if (res && res.result) {
    return res.result;
  } else if (res && res.text) {
    return res.text;
  }
  return null;
}

// 每日句子（英汉语录）
export async function dailyword(e) {
  // 检查是否有正在进行的游戏
  const key = e.message_type + e[e.isGroup ? 'group_id' : 'user_id'];
  if (dailyGames.has(key)) {
    e.reply('句子翻译游戏正在进行中，请先完成当前游戏！');
    return true;
  }
  
  const cfg = config.getdefault_config('liulian', 'token', 'config');
  const apikeys = cfg.apikeys;
  const apikey = apikeys.english_apikey || '';
  
  let url = `https://api.oick.cn/api/yhyl?apikey=${apikey}`;
  let response = await fetch(url);
  let res = await response.json();
  
  if (!res || !res.content || !res.note) {
    e.reply('获取英汉语录失败，请稍后重试');
    return true;
  }
  
  let msg = [
    segment.at(e.user_id),"\n",
    '📖 英文句子：',res.content,"\n\n",
    '40秒后公布中文翻译，请先自己翻译一下！\n回答格式：翻译[你的答案]',
  ];
  
  e.reply(msg);
  
  // 保存游戏状态
  dailyGames.set(key, {
    answer: res.note,
    type: 'sentence',
    timer: null
  });
  
  // 设置超时公布答案
  const gameTimer = setTimeout(() => {
    if (dailyGames.has(key)) {
      const game = dailyGames.get(key);
      e.reply(`\n⏰ 时间到！\n📝 中文翻译：${game.answer}`);
      dailyGames.delete(key);
    }
  }, 40000);
  
  // 保存定时器
  const game = dailyGames.get(key);
  game.timer = gameTimer;
  
  return true;
}

// 每日句子答案检查
export async function dailywordCheck(e) {
  const key = e.message_type + e[e.isGroup ? 'group_id' : 'user_id'];
  
  // 检查是否有正在进行的句子游戏
  if (!dailyGames.has(key)) {
    return false;
  }
  
  const game = dailyGames.get(key);
  if (game.type !== 'sentence') {
    return false;
  }
  
  // 检查是否是回答格式
  if (!e.msg.includes('翻译')) {
    return false;
  }
  
  const userAnswer = e.msg.replace(/^.*翻译/, '').trim();
  
  // 简单匹配：只要答案中包含正确答案的关键词就算对
  if (userAnswer && game.answer.includes(userAnswer) || game.answer === userAnswer) {
    clearTimeout(game.timer);
    e.reply(`\n🎉 回答正确！\n📝 中文翻译：${game.answer}`);
    dailyGames.delete(key);
    return true;
  }
  
  return false;
}

// 每日单词
export async function sentence(e) {
  // 检查是否有正在进行的游戏
  const key = e.message_type + e[e.isGroup ? 'group_id' : 'user_id'];
  if (dailyGames.has(key)) {
    e.reply('单词翻译游戏正在进行中，请先完成当前游戏！');
    return true;
  }
  
  // 随机选择一个单词
  const word = commonWords[Math.floor(Math.random() * commonWords.length)];
  
  let msg = [
    segment.at(e.user_id),"\n",
    '📖 单词：',word,"\n\n",
    '40秒后公布中文翻译，请先自己翻译一下！\n回答格式：翻译[你的答案]',
  ];
  
  e.reply(msg);
  
  // 先获取翻译
  const translation = await translate(word);
  
  // 保存游戏状态
  dailyGames.set(key, {
    answer: translation || word,
    type: 'word',
    timer: null
  });
  
  // 设置超时公布答案
  const gameTimer = setTimeout(() => {
    if (dailyGames.has(key)) {
      const game = dailyGames.get(key);
      e.reply(`\n⏰ 时间到！\n📝 中文翻译：${game.answer}`);
      dailyGames.delete(key);
    }
  }, 40000);
  
  // 保存定时器
  const game = dailyGames.get(key);
  game.timer = gameTimer;
  
  return true;
}

// 每日单词答案检查
export async function sentenceCheck(e) {
  const key = e.message_type + e[e.isGroup ? 'group_id' : 'user_id'];
  
  // 检查是否有正在进行的单词游戏
  if (!dailyGames.has(key)) {
    return false;
  }
  
  const game = dailyGames.get(key);
  if (game.type !== 'word') {
    return false;
  }
  
  // 检查是否是回答格式
  if (!e.msg.includes('翻译')) {
    return false;
  }
  
  const userAnswer = e.msg.replace(/^.*翻译/, '').trim();
  
  // 简单匹配：只要答案中包含正确答案的关键词就算对
  if (userAnswer && (game.answer.includes(userAnswer) || game.answer === userAnswer)) {
    clearTimeout(game.timer);
    e.reply(`\n🎉 回答正确！\n📝 中文翻译：${game.answer}`);
    dailyGames.delete(key);
    return true;
  }
  
  return false;
}