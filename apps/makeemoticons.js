/*
* 榴莲插件 - 表情制作模块
* 功能：会员表情包制作（对接榴莲表情服务，meme 引擎）
* 支持@用户、自己或图片作为素材，签名与凭据统一走 components/memberAuth.js
* */

import fetch from "node-fetch";
import { signedJsonRequest, signedRawRequest } from "../components/memberAuth.js";

// 命令规则定义
export const rule = {
  // 表情制作命令
  biaoQing: {
    reg: "noCheck", // 不检查正则，匹配所有消息
    priority: 10, //优先级，越小优先度越高
    describe: "头像表情包制作", //【命令】功能说明
  },
  // 表情帮助命令
  biaoQingHelp: {
    reg: "^表情帮助$", //匹配消息正则，命令正则
    priority: 10, //优先级，越小优先度越高
    describe: "表情制作帮助", //【命令】功能说明
  },
};

// 服务端接口路径
const MEME_KEYS_PATH = '/api/meme/keys';
const MEME_GEN_PATH = '/api/meme';
// 上传素材上限（与服务端一致：单请求全部图片合计 ≤10MB）
const MAX_IMAGES = 10;
const MAX_BYTES = 10 * 1024 * 1024;
// 模块加载标记：启动日志可见，用于确认部署机运行的是会员表情服务版本
logger.mark('[表情制作] 会员表情服务模块已加载');

// 关键词 → 引擎模板映射（longest-match 优先，取交集的关键词逐字对齐引擎 keywords）
// imgs=所需图片数（1=被操作者头像，2=操作者+被操作者），texts=所需文案数，arg=可选参数识别
const MEME_MAP = {
  "摸": { key: 'petpet', imgs: 1, texts: 0, arg: 'circle' },
  "摸摸": { key: 'petpet', imgs: 1, texts: 0, arg: 'circle' },
  "摸头": { key: 'petpet', imgs: 1, texts: 0, arg: 'circle' },
  "摸摸头": { key: 'petpet', imgs: 1, texts: 0, arg: 'circle' },
  "rua": { key: 'petpet', imgs: 1, texts: 0, arg: 'circle' },
  "亲": { key: 'kiss', imgs: 2, texts: 0 },
  "亲亲": { key: 'kiss', imgs: 2, texts: 0 },
  "像样的亲亲": { key: 'decent_kiss', imgs: 1, texts: 0 },
  "啾啾": { key: 'jiujiu', imgs: 1, texts: 0 },
  "贴贴": { key: 'hug', imgs: 2, texts: 0 },
  "贴": { key: 'capoo_rub', imgs: 1, texts: 0 },
  "蹭": { key: 'capoo_rub', imgs: 1, texts: 0 },
  "蹭蹭": { key: 'capoo_rub', imgs: 1, texts: 0 },
  "紧贴": { key: 'capoo_rub', imgs: 1, texts: 0 },
  "紧紧贴着": { key: 'capoo_rub', imgs: 1, texts: 0 },
  "拍": { key: 'beat_head', imgs: 1, texts: 0 },
  "撕": { key: 'capoo_rip', imgs: 1, texts: 0 },
  "丢": { key: 'chino_throw', imgs: 1, texts: 0 },
  "扔": { key: 'chino_throw', imgs: 1, texts: 0 },
  "抛": { key: 'chino_throw', imgs: 1, texts: 0 },
  "掷": { key: 'chino_throw', imgs: 1, texts: 0 },
  "爬": { key: 'crawl', imgs: 1, texts: 0 },
  "小天使": { key: 'little_angel', imgs: 1, texts: 0 },
  "加载中": { key: 'loading', imgs: 1, texts: 0 },
  "一样": { key: 'alike', imgs: 1, texts: 0 },
  "不要靠近": { key: 'dont_go_near', imgs: 1, texts: 0 },
  "吃": { key: 'eat', imgs: 1, texts: 0 },
  "啃": { key: 'bite', imgs: 1, texts: 0 },
  "问问": { key: 'ask', imgs: 1, texts: 1 },
  "去问问": { key: 'ask', imgs: 1, texts: 1 },
  "舔屏": { key: 'prpr', imgs: 1, texts: 0 },
  "舔": { key: 'prpr', imgs: 1, texts: 0 },
  "prpr": { key: 'prpr', imgs: 1, texts: 0 },
  "国旗": { key: 'china_flag', imgs: 1, texts: 0 },
  "墙纸": { key: 'look_flat', imgs: 1, texts: 0 },
  "继续干活": { key: 'back_to_work', imgs: 1, texts: 0 },
  "兑换券": { key: 'coupon', imgs: 1, texts: 1 },
  "听音乐": { key: 'listen_music', imgs: 1, texts: 0 },
  "典中典": { key: 'dianzhongdian', imgs: 1, texts: 0 },
  "哈哈镜": { key: 'funny_mirror', imgs: 1, texts: 0 },
  "永远爱你": { key: 'always_like', imgs: 1, texts: 1 },
  "永远喜欢": { key: 'always_like', imgs: 1, texts: 1 },
  "我永远喜欢": { key: 'always_like', imgs: 1, texts: 1 },
  "采访": { key: 'interview', imgs: 1, texts: 0 },
  "垃圾": { key: 'garbage', imgs: 1, texts: 0 },
  "垃圾桶": { key: 'garbage', imgs: 1, texts: 0 },
  "敲": { key: 'knock', imgs: 1, texts: 0 },
  "锤": { key: 'hammer', imgs: 1, texts: 0 },
  "击剑": { key: 'fencing', imgs: 2, texts: 0 },
  "可莉": { key: 'klee_eat', imgs: 1, texts: 0 },
  "小恐龙": { key: 'dinosaur', imgs: 1, texts: 0 },
  "胡桃": { key: 'hutao_bite', imgs: 1, texts: 0 },
  "吞": { key: 'eat', imgs: 1, texts: 0 },
};
// longest-match：先匹配长关键词（"摸摸头"优先于"摸"）
const MEME_KEYWORDS = Object.keys(MEME_MAP).sort((a, b) => b.length - a.length);

// 服务端表情清单缓存（进程启动后首次使用时拉取，"表情更新"可手动刷新）
let memeKeys = null;
async function refreshMemeKeys() {
  const ret = await signedJsonRequest('GET', MEME_KEYS_PATH);
  if (ret.ok && Array.isArray(ret.data && ret.data.keys)) {
    memeKeys = ret.data.keys;
  }
  return memeKeys;
}

// 下载素材图片（返回 Buffer；群头像/头像 URL 均可）
async function downloadImage(url) {
  // node-fetch v3 无 timeout 选项，用 AbortSignal 兜底，防止请求无限挂起
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_BYTES) throw new Error('TOO_LARGE');
  return buf;
}

// 手工构造 multipart 原始字节（boundary 固定才能先签名后发送，与服务端签名校验对齐）
// images=上传的图片字节；qqs=QQ 号（服务端代拉头像，同名重复按序追加在 images 之后）
function buildMultipart(images, qqs, texts, args) {
  const boundary = '----liulianclient' + Date.now();
  const part = (name, value, filename, contentType) => {
    const head = filename
      ? `--${boundary}\r\nContent-Disposition: form-data; name="${name}"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`
      : `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n`;
    return Buffer.concat([Buffer.from(head, 'utf8'), value, Buffer.from('\r\n', 'utf8')]);
  };
  const chunks = [];
  for (const img of images) {
    chunks.push(part('images', img, 'img.png', 'image/png'));
  }
  for (const qq of qqs) {
    chunks.push(part('qq', Buffer.from(String(qq), 'utf8')));
  }
  for (const text of texts) {
    chunks.push(part('texts', Buffer.from(text, 'utf8')));
  }
  if (args) {
    chunks.push(part('args', Buffer.from(JSON.stringify(args), 'utf8')));
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`, 'utf8'));
  return { body: Buffer.concat(chunks), contentType: `multipart/form-data; boundary=${boundary}` };
}

// 服务错误码 → 用户提示（只认 errorCode，不解析文案）
function memeErrorMessage(errorCode) {
  switch (errorCode) {
    case 'NO_CREDENTIAL':
      return '表情制作需绑定榴莲会员，请先私信发送「榴莲会员绑定」～';
    case 'MEMBER_REQUIRED':
      return '表情制作是会员专属功能，开通请联系会飞的芒果猫～';
    case 'MEMBER_EXPIRED':
      return '榴莲会员已过期，请续费后再使用表情制作～';
    case 'MEMBER_BANNED':
      return '当前会员状态不可用，无法使用表情制作～';
    case 'RATE_LIMITED':
      return '操作太频繁啦，请稍后再试～';
    case 'MEME_INVALID_PARAMS':
      return '这个表情的参数不对，请检查指令格式～';
    case 'AVATAR_FETCH_FAILED':
      return '头像获取失败，请稍后再试或换张图片～';
    case 'MEME_NOT_FOUND':
      return '该表情暂未收录，试试其他表情吧～';
    case 'MEME_SERVICE_UNAVAILABLE':
    case 'SERVICE_UNAVAILABLE':
    case 'NETWORK_ERROR':
    case 'HTTP_502':
      return '表情服务开小差了，请稍后再试～';
    case 'TOO_LARGE':
      return '图片太大啦，请换一张小一点的（10MB 以内）～';
    default:
      return '表情制作失败，请稍后重试';
  }
}

/**
 * 表情制作主函数
 * @param {Object} e - 事件对象
 * @returns {boolean|void} - 返回false表示不处理，void表示已处理
 */
export async function biaoQing(e) {
  // 只在群聊中处理，且必须有消息内容
  if (!e.isGroup || !e.msg) {
    return false;
  }
  const msg = e.msg.trim();

  // 表情更新：刷新服务端表情清单缓存
  if (msg === '表情更新') {
    const keys = await refreshMemeKeys();
    await e.reply(keys ? `表情清单已更新，当前可用 ${keys.length} 个表情` : '表情清单获取失败，请稍后再试');
    return true;
  }

  // @ 目标解析：优先从 e.message 取结构化 at，兜底从 msg 的 CQ 码文本提取（协议端可能只给原始 CQ 码）
  const atItem = e.message.filter((item) => item.type === "at");
  let atQq = '';
  if (atItem.length) atQq = String(atItem[0].qq);
  else {
    const cq = msg.match(/\[CQ:at,qq=(\d{5,11})\]/);
    if (cq) atQq = cq[1];
  }
  // 剥离 CQ 码与前后空白后再做关键词匹配（@ 位置无关：#贴贴@人 / @人 贴 都成立）
  const cleanMsg = msg.replace(/\[CQ:[^\]]+\]/g, '').trim();

  // longest-match 找表情关键词：裸关键词必须完整一致，否则普通聊天（如"摸鱼"）会被误触
  let hit = null, hitWord = '';
  for (const word of MEME_KEYWORDS) {
    if (cleanMsg === word || (cleanMsg.includes(word) && (cleanMsg.includes('自己') || atQq))) {
      hit = MEME_MAP[word];
      hitWord = word;
      break;
    }
  }
  if (!hit) return false;

  // 确定素材目标：图片 > @用户 > 自己；无目标且无图片素材不响应（避免空 QQ 请求）
  let targetQq = '';
  if (atQq) targetQq = atQq;
  else if (cleanMsg.includes('自己')) targetQq = String(e.user_id);
  // 无目标且无图片素材：不响应（裸关键词"摸"或无目标尾巴句都拦截，避免空 QQ 请求）
  if (!targetQq && !(e.img && e.img[0])) return false;

  try {
    // 素材组装（分步日志：沉默时可直接定位卡点）
    // 头像走 qq 字段由服务端代拉，省去本地下载再上传；图片才走 images 上传
    const images = [];
    const qqs = [];
    if (e.img && e.img[0]) {
      logger.mark(`[表情制作] 下载消息图片: ${hit.key}`);
      images.push(await downloadImage(e.img[0]));
    } else if (hit.imgs === 2) {
      // 双图模板：操作者 + 被操作者（顺序即服务端拼接顺序）
      logger.mark(`[表情制作] 服务端代拉双头像: ${hit.key}`);
      qqs.push(String(e.user_id), targetQq);
    } else {
      logger.mark(`[表情制作] 服务端代拉头像: ${hit.key} <- ${targetQq}`);
      qqs.push(targetQq);
    }
    if (images.length > MAX_IMAGES || images.reduce((s, b) => s + b.length, 0) > MAX_BYTES) {
      await e.reply([segment.at(e.user_id), memeErrorMessage('TOO_LARGE')]);
      return true;
    }

    // 可选参数（如 petpet 的圆形）
    let args;
    if (hit.arg === 'circle' && msg.includes('圆')) args = { circle: true };

    // 文案素材（ask/兑换券等需要一段文字：取关键词之外的剩余内容，空则用默认）
    const texts = [];
    if (hit.texts > 0) {
      let text = msg.replace(hitWord, '').replace(/\[QQ:[^\]]*\]/g, '').trim();
      if (!text) text = hitWord.includes('问') ? '在吗' : ' ';
      texts.push(text);
    }

    // 清单懒加载：首次使用时拉一次（服务端 404 时也会刷新重试）
    if (!memeKeys) await refreshMemeKeys();

    // 构造 multipart 并签名发送（签名输入=实际发送的原始字节）
    const { body, contentType } = buildMultipart(images, qqs, texts, args);
    const ret = await signedRawRequest('POST', `${MEME_GEN_PATH}/${hit.key}`, body, { 'Content-Type': contentType });

    // MEME_NOT_FOUND 可能是清单过期：刷新后重试一次
    if (!ret.ok && ret.errorCode === 'MEME_NOT_FOUND') {
      await refreshMemeKeys();
    }
    if (ret.ok && ret.buffer) {
      await e.reply([segment.at(e.user_id), segment.image(ret.buffer)]);
      return true;
    }
    await e.reply([segment.at(e.user_id), memeErrorMessage(ret.errorCode)]);
    return true;
  } catch (err) {
    logger.mark(`[表情制作] 生成失败: ${err.message}`);
    await e.reply([segment.at(e.user_id), memeErrorMessage(err.message === 'TOO_LARGE' ? 'TOO_LARGE' : 'NETWORK_ERROR')]);
    return true;
  }
}

/**
 * 表情帮助函数
 * @param {Object} e - 事件对象
 * @returns {boolean} - 返回true表示成功处理
 */
export async function biaoQingHelp(e) {
  // 只在群聊中提供帮助
  if (!e.isGroup) {
    return false;
  } else {
    // 发送帮助信息，包括使用说明和示例图片
    await e.reply([
      segment.at(e.user_id),
      "\n格式：指令+@QQ/自己/图片\n如：#爬@790621765\n爬自己\n爬+图片,详见下图",
      segment.image(`./plugins/liulian-plugin/resources/help/bphelp.jpg`),
    ]);
    return true; //返回true 阻挡消息不再往下
  }
}
