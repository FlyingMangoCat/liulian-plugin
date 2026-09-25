import fs from 'fs'; 
import path from 'path';
import ffmpeg from 'ffmpeg';
import lodash from 'lodash';
import fetch from "node-fetch";
import sizeOf from 'image-size';
import { roleIdToName, starroleIdToName, zzzroleIdToName, nteroleIdToName, wwroleIdToName } from "../components/mysInfo.js";
import { roleId as roleIdData, starroleId as starroleIdData, zzzroleId as zzzroleIdData, nteroleId as nteroleIdData, wwroleId as wwroleIdData } from "../config/roleId.js";
import { guessRank, parseRankArgs } from "./guessrank.js";
import { getPluginRender, browserInit } from '../model/render.js';
import template from "art-template";
import { Data, Cfg, Common } from "#liulian";
import config from "../model/config/config.js"
const GAME_TIME_OUT = 30//游戏时长(秒)
const _path = process.cwd();
let music = Cfg.get('sys.musicList'); //这里改网易云的歌单
// 出题解析辅助：按条目首位（官方名）精确匹配 ID，图片名=官方名=首位强对应，不走会被覆盖的全局别名表
function findOfficialId(map, name) {
  for (const [id, names] of Object.entries(map)) {
    if (names[0] === name) return id;
  }
  return '';
}
// 答案分级判定：官方名（首位）命中得3分，别名命中得1分，未命中0分（分值供后续排名统计使用）
function judgeAnswer(names, answer) {
  if (!names || !answer) return 0;
  if (names[0] === answer) return 3;
  if (names.includes(answer)) return 1;
  return 0;
}
// 上传音频文件
export async function uploadRecord(url) {
  try {
    const response = await fetch(url);
    const buffer = await response.buffer();
    const tempPath = path.join(_path, 'temp', `music_${Date.now()}.mp3`);

    // 确保temp目录存在
    const tempDir = path.join(_path, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    fs.writeFileSync(tempPath, buffer);
    return segment.record(tempPath);
  } catch (error) {
    console.error('上传音频失败:', error);
    return null;
  }
}
export const rule = {
  guessAvatar: {
    reg: '^#猜(头像|角色)(普通|困难|地狱)?(模式)?',
    priority: 99,
    describe: '#猜头像、#猜角色、#猜角色困难模式',
  },
  guessAvatarCheck: {
    reg: '(.*)',
    priority: 98,
    describe: '',
  },
  guessmusic: {
    reg: "^#?猜歌名$", //匹配消息正则，命令正则
    priority: 100, //优先级，越小优先度越高
    describe: "【猜歌名】", //【命令】功能说明
  },
  musicanswerCheck: {
    reg: "(.*)",
    priority: 1000,
    describe: "",
  },
  EndCheck: {
    reg: "^(结束猜歌名|投降)$",
    priority: 900,
    describe: "",
  },
   starguessAvatar: {
    reg: '^(?:\\*|星铁|#星铁|(?=.*星铁))猜角色(?:星铁)?(?:普通|困难|地狱)?(?:模式)?',
    priority: 99,
    describe: '猜星铁角色',
  },
  starguessAvatarCheck: {
    reg: '(.*)',
    priority: 98,
    describe: '',
  },
   zzzguessAvatar: {
    reg: '^(?:绝区零|%|[Zz][Zz][Zz]|#绝区零|#[Zz][Zz][Zz]|%绝区零|(?=.*(?:绝区零|[Zz][Zz][Zz]|%)))猜角色(?:ZZZ|绝区零)?(?:普通|困难|地狱)?(?:模式)?',
    priority: 99,
    describe: '猜ZZZ角色',
  },
  zzzguessAvatarCheck: {
    reg: '(.*)',
    priority: 98,
    describe: '',
  },
  miyu: {
    reg: '^#*猜谜语$',
    priority: 99,
    describe: '猜谜语',
  },
  miyuCheck: {
    reg: '(.*)',
    priority: 98,
    describe: '',
  }
};
const logoPath = path.join(_path, 'plugins/liulian-plugin/resources/genshin/logo/role');
const gachaPath = path.join(_path, 'plugins/liulian-plugin/resources/genshin/gacha/character');
const genshinSplashPath = path.join(_path, 'plugins/liulian-plugin/resources/genshin/logo/splash');
const starlogoPath = path.join(_path, 'plugins/liulian-plugin/resources/星铁/role');
const stargachaPath = path.join(_path, 'plugins/liulian-plugin/resources/星铁/side');
const starSplashPath = path.join(_path, 'plugins/liulian-plugin/resources/星铁/splash');
const zzzlogoPath = path.join(_path, 'plugins/liulian-plugin/resources/zzz/role');
const zzzgachaPath = path.join(_path, 'plugins/liulian-plugin/resources/zzz/gacha');
const wwlogoPath = path.join(_path, 'plugins/liulian-plugin/resources/wwroleId/role');
const wwgachaPath = path.join(_path, 'plugins/liulian-plugin/resources/wwroleId/character');
const wwSplashPath = path.join(_path, 'plugins/liulian-plugin/resources/wwroleId/splash');
const nteSplashPath = path.join(_path, 'plugins/liulian-plugin/resources/nteroleId/splash');
const version = '2.0';
const templateVersion = '2.0';
const templateName = `guessAvatar_${templateVersion}`;
const pluginName = 'games-template-plugin-zolay-liulian';
const render = getPluginRender(pluginName);
// 猜角色专用渲染：等裁切校验完成（#guess-ready 出现）再截图，避免盲选坐标被截图
// 题图（type=question）返回 {base64, lx, ty}，答案图返回 base64 字符串
async function guessRender(type, data, imgType = "jpeg") {
  const browser = await browserInit();
  if (!browser) return false;
  data._plugin = pluginName;
  if (lodash.isUndefined(data._res_path)) data._res_path = `../../../../../plugins/${pluginName}/resources/`;
  if (lodash.isUndefined(data._sys_res_path)) data._sys_res_path = `../../../../../resources/`;
  let saveId = data.save_id || type;
  let tplFile = _path + `/plugins/${pluginName}/resources/${templateName}/${type}.html`;
  Data.createDir(_path + '/data/', `html/plugin_${pluginName}/${templateName}/${type}`);
  let savePath = _path + `/data/html/plugin_${pluginName}/${templateName}/${type}/${saveId}.html`;
  // 读模板并替换
  let tplContent = fs.readFileSync(tplFile, "utf8");
  let tmpHtml = template.render(tplContent, data);
  fs.writeFileSync(savePath, tmpHtml);
  let base64 = "";
  let cropCoord = null;
  try {
    const page = await browser.newPage();
    // 转发页面内 console.log 到主进程，便于调试裁切校验逻辑
    page.on('console', msg => console.log(msg.text()));
    await page.goto("file://" + savePath);
    await page.waitForSelector("#container");
    // 等裁切校验完成标记出现，最多等 15 秒（兜底避免死等，给大图校验留足时间）
    await page.waitForSelector("#guess-ready", { visible: true, timeout: 15000 });
    // 题图阶段：读出校验后的裁切框坐标，供答案图高亮用
    if (type === 'question') {
      cropCoord = await page.evaluate(() => {
        const imgEl = document.getElementById('img');
        // style.top/left 是 "-typx"/"-lxpx"，转回数字坐标
        const ty = parseInt(imgEl.style.top) || 0;
        const lx = parseInt(imgEl.style.left) || 0;
        return { lx: -lx, ty: -ty };
      });
    }
    let body = await page.$("#container");
    let randData = { type: imgType, encoding: "base64" };
    if (imgType === "jpeg") randData.quality = 90;
    if (imgType === "png") randData.omitBackground = true;
    base64 = await body.screenshot(randData);
    page.close().catch(() => {});
  } catch (error) {
    console.error(`猜角色渲染失败:${type}:${error}`);
    base64 = "";
  }
  // 题图返回坐标+图片，答案图只返回图片
  return type === 'question' ? { base64, coord: cropCoord } : base64;
}
init();
const guessConfigMap = new Map();
function getGuessConfig(e) {
  let key = e.message_type + e[e.isGroup ? 'group_id' : 'user_id'];
  let config = guessConfigMap.get(key);
  if (config == null) {
    config = {
      playing: false,
      gameType: '',   // 当前游戏类型：genshin/star/zzz/nte/ww，避免不同游戏状态混淆
      roleId: '',
      starroleId: '',
      zzzroleId: '',
      nteroleId: '',
      wwroleId: '',
      timer: null,
      answer: null,
      delete: () => guessConfigMap.delete(key),
    };
    guessConfigMap.set(key, config);
  }
  return config;
}

// 导出 getGuessConfig 供外部使用
export { getGuessConfig };

const colors = [// 随机背景颜色
  '#F5F5F5',
  '#FFEDED',
  '#F7F0D7',
  '#C0E2F5',
  '#FFCDCA',
  '#D0FFC3',
  '#D9D6FF',
];
export async function guessAvatar(e) {
  // 原神猜角色：消息含其他游戏名/前缀时跳过，交给对应游戏处理
  if (/[异环nte鸣潮ww~%*星铁]/.test(e.msg)) return false;
  // 查排名的消息绝不新开一局
  if (/排名/.test(e.msg)) return false;
  let guessConfig = getGuessConfig(e);
  if (guessConfig.playing) {
    e.reply('猜角色游戏正在进行哦');
    return true;
  }
  let hardMode = e.msg.includes('困难');
  let hellMode = e.msg.includes('地狱');
  let purgatoryMode = e.msg.includes('炼狱');
  let normalMode = (!hardMode && !hellMode && !purgatoryMode);
  let helpText;
  if (hardMode) {
    helpText = '%s\n在『困难模式』下，发送的图片将会变成黑白色。';
  } else if (hellMode) {
    helpText = '%s\n在『地狱模式』下，发送的图片将会变成反色。';
  } else if (purgatoryMode) {
    helpText = '%s\n在『炼狱模式』下，发送的图片将会变成反色并随机旋转。';
  } else {
    helpText = '%s';
  }
  helpText = helpText.replace('%s', `即将发送一张『随机角色』的『随机一角』，${GAME_TIME_OUT}秒之后揭晓答案！\n回答格式：#我猜[角色名]`);
  e.reply(helpText);
  let fileNames = [];
  let ffn = (n) => !/(未知)/.test(n);
  // 随机选图目录：logo头像、gacha立绘、splash Splash插画
  let imgPaths = [logoPath, gachaPath, genshinSplashPath];
  let imgPath = imgPaths[lodash.random(0, imgPaths.length - 1)];
  fs.readdirSync(imgPath).filter(ffn).forEach(n => fileNames.push(n));
  let fileName = fileNames[Math.round(Math.random() * (fileNames.length - 1))];
  let roleName = fileName.replace(/\.[^.]+$/, '');
  // 皮肤后缀为固定格式（01/02…09），不影响角色名，先清洗皮肤后缀
  let stripped = roleName.replace(/0\d$/, '');
  if (stripped !== roleName) roleName = stripped;
  // 首位精确匹配 → 别名兜底
  let roleId = findOfficialId(roleIdData, roleName) || roleIdToName(roleName);
  // 清空其他游戏残留ID，设置当前游戏类型，避免不同游戏状态混淆
  guessConfig.starroleId = '';
  guessConfig.zzzroleId = '';
  guessConfig.gameType = 'genshin';
  guessConfig.playing = true;
  guessConfig.roleId = roleId;
  console.group('猜角色');
  console.log('ID:', roleId);
  console.log('角色:', roleName);
  console.groupEnd();
  let imgSrc = path.join(imgPath, fileName);
  let minTop = 0, limitTop = 0, minLeft = 0, limitLeft = 0;
  if (imgPath === gachaPath) {
    minTop = 50;
  } else {
    minLeft = 30;
    limitLeft = 30;
  }
  let imgSize = sizeOf(imgSrc);
  // 裁切框按图片短边比例动态计算：普通最大、困难次之、地狱炼狱更小，并限制上下限避免太小或几乎全图
  let shortSide = Math.min(imgSize.width, imgSize.height);
  let sizeRatio;
  if (hardMode) sizeRatio = lodash.random(0.20, 0.30);
  else if (hellMode) sizeRatio = lodash.random(0.16, 0.26);
  else if (purgatoryMode) sizeRatio = lodash.random(0.14, 0.24);
  else sizeRatio = lodash.random(0.25, 0.35);
  let size = Math.round(shortSide * sizeRatio);
  size = Math.max(30, Math.min(200, size));
  let imgTop = lodash.random(minTop, Math.max(minTop, imgSize.height - size - limitTop));
  let imgLeft = lodash.random(minLeft, Math.max(minLeft, imgSize.width - size - limitLeft));
  let imgColor = colors[lodash.random(0, colors.length - 1)];
  let props = {
    src: `file:///${imgSrc}`,
    size, imgTop, imgLeft, imgColor,
    imgWidth: imgSize.width,
    imgHeight: imgSize.height,
    hardMode, hellMode, normalMode, purgatoryMode,
    rotate: purgatoryMode ? lodash.random(-180, 180) : 0,
    minTop, limitTop, minLeft, limitLeft
  };
  let base64 = null;
  let promise = guessRender('question', props);
  setTimeout(async () => {
    const result = await promise;
    base64 = result ? result.base64 : null;
    if (base64) {
      // 题图校验后的裁切坐标写回 props，答案图高亮框与题图实际位置对齐
      if (result.coord) {
        props.imgTop = result.coord.ty;
        props.imgLeft = result.coord.lx;
      }
      e.reply(segment.image(`base64://${base64}`));
      guessConfig.normalMode = normalMode;
      guessConfig.answer = guessRender('answer', props);
      guessConfig.timer = setTimeout(() => {
        if (guessConfig.playing) {
          replayAnswer(e, ['很遗憾，还没有人答对哦，正确答案是：' + (roleIdToName(String(roleId), true) || roleName) + '\n(如有角色未收录或角色名称错误，请联系我们)'], guessConfig);
        }
      }, GAME_TIME_OUT * 1000);
    } else {
      guessConfig.playing = false;
      e.reply('呜~ 图片生成失败了… 请稍后重试 〒▽〒');
    }
  }, 1500);
  return true;
}
export async function guessAvatarCheck(e) {
  let guessConfig = getGuessConfig(e);
  let {playing, roleId, normalMode, gameType} = guessConfig;
  // 只处理原神猜角色，避免与其他游戏状态混淆
  if (playing && gameType === 'genshin' && roleId && e.msg) {
    let guessed = e.msg.replace(/^#?我猜/, '');
    let isGuess = guessed !== e.msg; // 带"我猜"前缀=明确答题，未命中也计参与
    let answer = guessed.trim();
    let score = judgeAnswer(roleIdData[roleId], answer);
    if (score > 0) {
      guessRank.record({ gameType: 'genshin', e, score, isCorrect: true });
      await replayAnswer(e, ['恭喜你答对了！'], guessConfig, true);
      if (normalMode && lodash.random(0, 100) <= 8) {
        e.reply('如果感觉太简单了的话，可以对我说“#猜角色困难模式”或者“#猜角色地狱模式”哦！');
      }
      return true;
    }
    if (isGuess) {
      guessRank.record({ gameType: 'genshin', e, score: 0, isCorrect: false });
    }
  }
  return false;
}
export async function replayAnswer(e, message, cfg, isReply = false) {
  clearTimeout(cfg.timer);
  cfg.playing = false;
  let answer = await cfg.answer;
  if (answer) {
    message.push('\n');
    message.push(segment.image(`base64://${answer}`));
  }
  await e.reply(message, isReply);
  cfg.delete();
}
function init() {
  let pluginPath = path.join(_path, 'plugins', pluginName);
  let templatePath = path.join(pluginPath, `resources`, templateName);
  let questionPath = path.join(templatePath, 'question.html');
  let answerPath = path.join(templatePath, 'answer.html');
  if (!fs.existsSync(templatePath)) {
    Data.createDir(_path, `/plugins/${pluginName}/resources/${templateName}`);
  }
  // 每次启动都用最新模板覆盖，避免更新代码后仍用老模板
  fs.writeFileSync(questionPath, getTemplate());
  fs.writeFileSync(answerPath, getTemplate(false));
}
function getTemplate(flag = true) {
  return `
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>猜头像</title>
  <style>
      *, html, body {padding: 0;margin: 0;}
      .container {overflow: hidden;position: relative;transform-origin: 0 0;}
      .container img {position: absolute;}
      .container .invert {filter: invert(100%);}
      .container .grayscale {filter: grayscale(100%);}
      #answer-wrap {position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;}
      #answer-wrap #mask{position:absolute;z-index: 1;border: 1px solid white;box-shadow: 0 0 0 2000px rgba(0,0,0,0.6);}
  </style>
</head>

<body>
<div class="container" id="container">
  <img id="img" src="{{src}}" alt="头像">
  <div id="answer-wrap" style="display: none;">
    <img id="answer-img" src="{{src}}" alt="头像">
    <div id="mask"></div>
  </div>
</div>
<!-- 裁切校验完成标记，puppeteer 等它出现再截图 -->
<div id="guess-ready" style="display:none;width:1px;height:1px;"></div>
<script>
// 图片大小
const flag = ${flag};
const size = {{size}};
const imgTop = {{imgTop}};
const imgLeft = {{imgLeft}};
const imgWidth = {{imgWidth}};
const imgHeight = {{imgHeight}};
const imgColor = "{{imgColor}}";
const hardMode = {{hardMode}};
const hellMode = {{hellMode}};
const purgatoryMode = {{purgatoryMode}};
const rotate = {{rotate}};
// 裁切框可选范围的上下界（来自 Guess.js 的 minTop/minLeft/limitTop/limitLeft）
const minTop = {{minTop}};
const limitTop = {{limitTop}};
const minLeft = {{minLeft}};
const limitLeft = {{limitLeft}};

// 等图片加载完后，用 canvas 读像素，优先 alpha 校验，失效时用 RGB 方差兜底
// 同步返回裁切框左上角坐标 [lx, ty]，不再用回调异步
function pickCenterOnRole(imgEl) {
  // 裁切框左上角可选范围（保护下界，避免负数）
  const maxTop = Math.max(minTop, imgHeight - size - limitTop);
  const maxLeft = Math.max(minLeft, imgWidth - size - limitLeft);
  let data;
  try {
    const cvs = document.createElement('canvas');
    cvs.width = imgWidth; cvs.height = imgHeight;
    const ctx = cvs.getContext('2d');
    ctx.drawImage(imgEl, 0, 0);
    data = ctx.getImageData(0, 0, imgWidth, imgHeight).data;
  } catch (e) {
    // canvas 读不了，兜底用原坐标
    console.log('[guess-debug] canvas读取失败走兜底, err:', e.message, '坐标:', imgLeft, imgTop);
    return [imgLeft, imgTop];
  }
  // 主逻辑：收集"裁切框中心落在非透明像素上"的候选
  const threshold = 128;
  const candidates = [];
  const half = size >> 1;
  for (let y = minTop; y <= maxTop; y++) {
    const cy = y + half;
    if (cy < 0 || cy >= imgHeight) continue;
    for (let x = minLeft; x <= maxLeft; x++) {
      const cx = x + half;
      if (cx < 0 || cx >= imgWidth) continue;
      const idx = (imgWidth * cy + cx) * 4;
      if (data[idx + 3] > threshold) {
        candidates.push([x, y]);
      }
    }
  }
  // alpha 校验有效（有候选且没占满整张图）→ 从候选里随机选
  const total = (maxTop - minTop + 1) * (maxLeft - minLeft + 1);
  if (candidates.length > 0 && candidates.length < total * 0.8) {
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    console.log('[guess-debug] alpha校验生效, 候选数:', candidates.length, '/', total, '坐标:', pick[0], pick[1]);
    return pick;
  }
  console.log('[guess-debug] alpha校验失效, candidates:', candidates.length, '/', total, '走RGB方差兜底');
  // 兜底：alpha 校验失效（全透明或全非透明如 Splash 插画）→ 用 RGB 方差判断角色区
  const varianceThreshold = 1000;
  const sampleSize = 30;
  const validPicks = [];
  for (let i = 0; i < sampleSize; i++) {
    const x = minLeft + Math.floor(Math.random() * (maxLeft - minLeft + 1));
    const y = minTop + Math.floor(Math.random() * (maxTop - minTop + 1));
    let sumR = 0, sumG = 0, sumB = 0, count = 0;
    for (let py = y; py < y + size && py < imgHeight; py++) {
      for (let px = x; px < x + size && px < imgWidth; px++) {
        const idx = (imgWidth * py + px) * 4;
        sumR += data[idx]; sumG += data[idx + 1]; sumB += data[idx + 2];
        count++;
      }
    }
    if (count === 0) continue;
    const avgR = sumR / count, avgG = sumG / count, avgB = sumB / count;
    let varR = 0, varG = 0, varB = 0;
    for (let py = y; py < y + size && py < imgHeight; py++) {
      for (let px = x; px < x + size && px < imgWidth; px++) {
        const idx = (imgWidth * py + px) * 4;
        varR += (data[idx] - avgR) * (data[idx] - avgR);
        varG += (data[idx + 1] - avgG) * (data[idx + 1] - avgG);
        varB += (data[idx + 2] - avgB) * (data[idx + 2] - avgB);
      }
    }
    if (varR + varG + varB > varianceThreshold) {
      validPicks.push([x, y]);
    }
  }
  if (validPicks.length > 0) {
    const pick = validPicks[Math.floor(Math.random() * validPicks.length)];
    console.log('[guess-debug] RGB方差兜底生效, 有效候选:', validPicks.length, '/', sampleSize, '坐标:', pick[0], pick[1]);
    return pick;
  }
  // 最终兜底：用原 imgTop/imgLeft
  console.log('[guess-debug] RGB方差兜底也失效, 用原坐标:', imgLeft, imgTop);
  return [imgLeft, imgTop];
}

const boxEl = document.getElementById("container");
if (flag) {
  boxEl.style.width = size + 'px';
  boxEl.style.height = size + 'px';
  boxEl.style.transform = 'scale(3)';
} else {
  boxEl.style.width = imgWidth + 'px';
  boxEl.style.height = imgHeight + 'px';
  boxEl.style.transform = 'scale(1.5)';
  document.getElementById('answer-wrap').style.display = 'block';
}
boxEl.style.backgroundColor = imgColor;

let controlEl ;
if (flag) {
  controlEl = document.getElementById('img');
  if (hardMode) {
    controlEl.classList.add('grayscale')
  } else if (hellMode) {
    controlEl.classList.add('invert')
  } else if (purgatoryMode) {
    controlEl.classList.add('invert')
    controlEl.style.transform = 'rotate(' + rotate + 'deg)'
  }
  const imgEl = controlEl;
  // 等图片解码完，同步跑校验，跑完设置标记让 puppeteer 截图
  const readyEl = document.getElementById('guess-ready');
  imgEl.decode().then(() => {
    const [lx, ty] = pickCenterOnRole(imgEl);
    imgEl.style.top = "-" + ty + "px";
    imgEl.style.left = "-" + lx + "px";
    readyEl.style.display = 'block';
  }).catch(() => {
    // 解码失败兜底：用原坐标，并标记完成避免 puppeteer 死等
    imgEl.style.top = "-" + imgTop + "px";
    imgEl.style.left = "-" + imgLeft + "px";
    readyEl.style.display = 'block';
  });
} else {
  // 答案图：container、answer-wrap、底图都用 imgWidth×imgHeight 像素值，尺寸完全一致不露边
  const answerImg = document.getElementById('answer-img');
  answerImg.style.top = '0px';
  answerImg.style.left = '0px';
  answerImg.style.width = imgWidth + 'px';
  answerImg.style.height = imgHeight + 'px';
  answerImg.style.objectFit = 'fill';
  controlEl = document.getElementById('mask');
  controlEl.style.top =  imgTop + "px";
  controlEl.style.left =  imgLeft + "px";
  controlEl.style.width =  size + "px";
  controlEl.style.height =  size + "px";
  // 炼狱模式：题目图 img 旋转后，答案高亮框需以图片中心为原点反向旋转，与题图实际显示区域对齐
  if (purgatoryMode && rotate !== 0) {
    controlEl.style.transformOrigin = (imgWidth / 2 - imgLeft) + "px " + (imgHeight / 2 - imgTop) + "px";
    controlEl.style.transform = 'rotate(' + (-rotate) + 'deg)';
  }
  // 答案图不需要校验，直接标记完成
  document.getElementById('guess-ready').style.display = 'block';
}
</script>
</body>
</html>
  `;
}
export async function guessmusic(e) {
  let guessConfig = getGuessConfig(e)
  if (guessConfig.gameing) {
    e.reply('猜歌名正在进行哦!')
    return true;
  }
  // 从配置的网易云歌单中随机取歌
  let playlists = music && music.length ? music : null
  if (!playlists) {
    e.reply('未配置网易云歌单，请先通过 #榴莲设置网易云歌单 配置');
    return true;
  }
  let pid = playlists[Math.floor(Math.random() * playlists.length)]
  let song = null
  // 主接口取歌
  try {
    let listRes = await(await fetch(`https://music.163.com/api/v6/playlist/detail?id=${pid}`, { headers: { 'User-Agent': 'Mozilla/5.0' } })).json()
    let allIds = listRes && listRes.playlist && listRes.playlist.trackIds ? listRes.playlist.trackIds.map(t => t.id) : []
    if (allIds.length) {
      // 批量获取歌单全部歌曲信息
      let c = JSON.stringify(allIds.map(id => ({ id })))
      let detailRes = await(await fetch(`https://music.163.com/api/v3/song/detail?c=${encodeURIComponent(c)}`, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://music.163.com' } })).json()
      let songs = detailRes && detailRes.songs ? detailRes.songs : []
      if (songs.length) {
        let track = songs[Math.floor(Math.random() * songs.length)]
        song = {
          name: track.name,
          url: `https://music.163.com/song/media/outer/url?id=${track.id}.mp3`,
          artist: (track.ar || []).map(a => a.name).join('/')
        }
      }
    }
  } catch (err) {
    song = null
  }
  // 主接口不可用时，使用备用歌单接口取歌（同样按歌单取歌，不降级功能）
  if (!song) {
    try {
      let backupRes = await(await fetch(`https://api.injahow.cn/meting/?type=playlist&id=${pid}`, { headers: { 'User-Agent': 'Mozilla/5.0' } })).json()
      if (Array.isArray(backupRes) && backupRes.length) {
        let track = backupRes[Math.floor(Math.random() * backupRes.length)]
        song = {
          name: track.name,
          url: track.url,
          artist: track.artist
        }
      }
    } catch (err) {
      song = null
    }
  }
  if (!song) {
    e.reply('获取歌曲失败，请稍后重试');
    return true;
  }
   console.log("歌名是:"+song.name);
    e.reply( `游戏开始啦,请听语音猜出歌名！\n游戏区分大小写,猜的歌名必须跟答案一样才算你对噢~\n结束游戏指令【投降】`,true);
    e.reply(await uploadRecord(song.url));
    setTimeout(() => {
      e.reply(`提示：\n歌手:${song.artist}`);
    }, 2000)//毫秒数
  guessConfig.gameing = true;
  guessConfig.current = song.name;
    guessConfig.timer = setTimeout(() => {
      if (guessConfig.gameing) {
        guessConfig.gameing = false;
        e.reply(`嘿嘿,猜歌名结束啦,很遗憾没有人猜中噢！歌名是【${song.name}】`);
		return true;
      }
    }, 120000)//毫秒数
  return true; //返回true 阻挡消息不再往下
}
export async function musicanswerCheck(e) {
    let guessConfig = getGuessConfig(e);
    let {gameing, current } = guessConfig;
  if (gameing && e.msg == guessConfig.current) {
      e.reply(`猜歌名结束,这也能猜中？\n蒙的吧~~可心才不信呢`, true);
      guessConfig.gameing = false;
      clearTimeout(guessConfig.timer)
      return true;
    }
  return false;
}
  export async function EndCheck(e) {
    let guessConfig = getGuessConfig(e);
    let {gameing, current } = guessConfig;
    if(gameing){
         guessConfig.gameing = false
         clearTimeout(guessConfig.timer);
         e.reply(`猜歌名已结束\n歌名是:` + guessConfig.current);
         return true;
    }else{
        e.reply(`猜歌名游戏都没开始,你结束锤子呢？`)
        return true;
    }
  }

export async function starguessAvatar(e) {
  // 星铁猜角色：消息含其他游戏名/前缀时跳过，交给对应游戏处理
  if (/[异环nte鸣潮ww~绝区零%]/.test(e.msg)) return false;
  // 查排名的消息绝不新开一局
  if (/排名/.test(e.msg)) return false;
  let guessConfig = getGuessConfig(e);
  if (guessConfig.playing) {
    e.reply('猜角色游戏正在进行哦');
    return true;
  }
  let hardMode = e.msg.includes('困难');
  let hellMode = e.msg.includes('地狱');
  let purgatoryMode = e.msg.includes('炼狱');
  let normalMode = (!hardMode && !hellMode && !purgatoryMode);
  let helpText;
  if (hardMode) {
    helpText = '%s\n在『困难模式』下，发送的图片将会变成黑白色。';
  } else if (hellMode) {
    helpText = '%s\n在『地狱模式』下，发送的图片将会变成反色。';
  } else if (purgatoryMode) {
    helpText = '%s\n在『炼狱模式』下，发送的图片将会变成反色并随机旋转。';
  } else {
    helpText = '%s';
  }
  helpText = helpText.replace('%s', `即将发送一张『随机角色』的『随机一角』，${GAME_TIME_OUT}秒之后揭晓答案！\n回答格式：#我猜[角色名]`);
  e.reply(helpText);
  let fileNames = [];
  let ffn = (n) => !/(未知)/.test(n);
  // 随机选图目录：logo头像、gacha立绘、splash Splash插画
  let imgPaths = [starlogoPath, stargachaPath, starSplashPath];
  let imgPath = imgPaths[lodash.random(0, imgPaths.length - 1)];
  fs.readdirSync(imgPath).filter(ffn).forEach(n => fileNames.push(n));
  let fileName = fileNames[Math.round(Math.random() * (fileNames.length - 1))];
  // 只去扩展名，保留带点号/数字的角色名（如「银狼LV.999」），查不到再去末尾数字后缀重试
  let roleName = fileName.replace(/\.[^.]+$/, '');
  // 皮肤后缀为固定格式（01/02…09），不影响角色名，先清洗皮肤后缀
  let stripped = roleName.replace(/0\d$/, '');
  if (stripped !== roleName) roleName = stripped;
  // 首位精确匹配 → 别名兜底
  let roleId = findOfficialId(starroleIdData, roleName) || starroleIdToName(roleName);
  // 清空其他游戏残留ID，设置当前游戏类型，避免不同游戏状态混淆
  guessConfig.roleId = '';
  guessConfig.zzzroleId = '';
  guessConfig.gameType = 'star';
  guessConfig.playing = true;
  guessConfig.starroleId = roleId;
  console.group('猜角色');
  console.log('ID:', roleId);
  console.log('角色:', roleName);
  console.groupEnd();
  let imgSrc = path.join(imgPath, fileName);
  let minTop = 0, limitTop = 0, minLeft = 0, limitLeft = 0;
  if (imgPath === stargachaPath) {
    minTop = 50;
  } else {
    minLeft = 30;
    limitLeft = 30;
  }
  let imgSize = sizeOf(imgSrc);
  // 裁切框按图片短边比例动态计算：普通最大、困难次之、地狱炼狱更小，并限制上下限避免太小或几乎全图
  let shortSide = Math.min(imgSize.width, imgSize.height);
  let sizeRatio;
  if (hardMode) sizeRatio = lodash.random(0.20, 0.30);
  else if (hellMode) sizeRatio = lodash.random(0.16, 0.26);
  else if (purgatoryMode) sizeRatio = lodash.random(0.14, 0.24);
  else sizeRatio = lodash.random(0.25, 0.35);
  let size = Math.round(shortSide * sizeRatio);
  size = Math.max(30, Math.min(200, size));
  let imgTop = lodash.random(minTop, Math.max(minTop, imgSize.height - size - limitTop));
  let imgLeft = lodash.random(minLeft, Math.max(minLeft, imgSize.width - size - limitLeft));
  let imgColor = colors[lodash.random(0, colors.length - 1)];
  let props = {
    src: `file:///${imgSrc}`,
    size, imgTop, imgLeft, imgColor,
    imgWidth: imgSize.width,
    imgHeight: imgSize.height,
    hardMode, hellMode, normalMode, purgatoryMode,
    rotate: purgatoryMode ? lodash.random(-180, 180) : 0,
    minTop, limitTop, minLeft, limitLeft
  };
  let base64 = null;
  let promise = guessRender('question', props);
  setTimeout(async () => {
    const result = await promise;
    base64 = result ? result.base64 : null;
    if (base64) {
      // 题图校验后的裁切坐标写回 props，答案图高亮框与题图实际位置对齐
      if (result.coord) {
        props.imgTop = result.coord.ty;
        props.imgLeft = result.coord.lx;
      }
      e.reply(segment.image(`base64://${base64}`));
      guessConfig.normalMode = normalMode;
      guessConfig.answer = guessRender('answer', props);
      guessConfig.timer = setTimeout(() => {
        if (guessConfig.playing) {
          replayAnswer(e, ['很遗憾，还没有人答对哦，正确答案是：' + (starroleIdToName(String(roleId), true) || roleName) + '\n(如有角色未收录或名称错误，请联系我们)'], guessConfig);
        }
      }, GAME_TIME_OUT * 1000);
    } else {
      guessConfig.playing = false;
      e.reply('呜~ 图片生成失败了… 请稍后重试 〒▽〒');
    }
  }, 1500);
  return true;
}
export async function starguessAvatarCheck(e) {
  let guessConfig = getGuessConfig(e);
  let {playing, starroleId, normalMode, gameType} = guessConfig;
  // 只处理星铁猜角色，避免与其他游戏状态混淆
  if (playing && gameType === 'star' && starroleId && e.msg) {
    let guessed = e.msg.replace(/^#?我猜/, '');
    let isGuess = guessed !== e.msg; // 带"我猜"前缀=明确答题，未命中也计参与
    let answer = guessed.trim();
    let score = judgeAnswer(starroleIdData[starroleId], answer);
    if (score > 0) {
      guessRank.record({ gameType: 'star', e, score, isCorrect: true });
      await replayAnswer(e, ['恭喜你答对了！'], guessConfig, true);
      if (normalMode && lodash.random(0, 100) <= 8) {
        e.reply('如果感觉太简单了的话，可以对我说“#星铁猜角色困难模式”或者“#星铁猜角色地狱模式”哦！');
      }
      return true;
    }
    if (isGuess) {
      guessRank.record({ gameType: 'star', e, score: 0, isCorrect: false });
    }
      }
      return false;
    }
    
    
    export async function zzzguessAvatar(e) {
  // 绝区零猜角色：消息含其他游戏名/前缀时跳过，交给对应游戏处理
  if (/[异环nte鸣潮ww~星铁]/.test(e.msg)) return false;
  // 查排名的消息绝不新开一局
  if (/排名/.test(e.msg)) return false;
  let guessConfig = getGuessConfig(e);
  if (guessConfig.playing) {
    e.reply('猜角色游戏正在进行哦');
    return true;
  }
  let hardMode = e.msg.includes('困难');
  let hellMode = e.msg.includes('地狱');
  let purgatoryMode = e.msg.includes('炼狱');
  let normalMode = (!hardMode && !hellMode && !purgatoryMode);
  let helpText;
  if (hardMode) {
    helpText = '%s\n在『困难模式』下，发送的图片将会变成黑白色。';
  } else if (hellMode) {
    helpText = '%s\n在『地狱模式』下，发送的图片将会变成反色。';
  } else if (purgatoryMode) {
    helpText = '%s\n在『炼狱模式』下，发送的图片将会变成反色并随机旋转。';
  } else {
    helpText = '%s';
  }
  helpText = helpText.replace('%s', `即将发送一张『随机角色』的『随机一角』，${GAME_TIME_OUT}秒之后揭晓答案！\n回答格式：#我猜[角色名]`);
  e.reply(helpText);
  let fileNames = [];
  let ffn = (n) => !/(未知)/.test(n);
  let imgPath = lodash.random(0, 100) <= 30 ? zzzlogoPath : zzzgachaPath;
  fs.readdirSync(imgPath).filter(ffn).forEach(n => fileNames.push(n));
  let fileName = fileNames[Math.round(Math.random() * (fileNames.length - 1))];
  // 绝区零角色名本身可能带数字（如「11号」「零号·安比」），不能删数字
  // 只去扩展名，查不到再去末尾数字后缀重试（如「简01」→「简」）
  let roleName = fileName.replace(/\.[^.]+$/, '');
  // 皮肤后缀为固定格式（01/02…09），不影响角色名，先清洗皮肤后缀
  let stripped = roleName.replace(/0\d$/, '');
  if (stripped !== roleName) roleName = stripped;
  // 首位精确匹配 → 别名兜底
  let roleId = findOfficialId(zzzroleIdData, roleName) || zzzroleIdToName(roleName);
  guessConfig.playing = true;
  // 清空其他游戏残留ID，设置当前游戏类型，避免不同游戏状态混淆
  guessConfig.roleId = '';
  guessConfig.starroleId = '';
  guessConfig.gameType = 'zzz';
  guessConfig.zzzroleId = roleId;
  console.group('猜角色');
  console.log('ID:', roleId);
  console.log('角色:', roleName);
  console.groupEnd();
  let imgSrc = path.join(imgPath, fileName);
  let minTop = 0, limitTop = 0, minLeft = 0, limitLeft = 0;
  if (imgPath === zzzgachaPath) {
    minTop = 50;
  } else {
    minLeft = 30;
    limitLeft = 30;
  }
  let imgSize = sizeOf(imgSrc);
  // 裁切框按图片短边比例动态计算：普通最大、困难次之、地狱炼狱更小，并限制上下限避免太小或几乎全图
  let shortSide = Math.min(imgSize.width, imgSize.height);
  let sizeRatio;
  if (hardMode) sizeRatio = lodash.random(0.20, 0.30);
  else if (hellMode) sizeRatio = lodash.random(0.16, 0.26);
  else if (purgatoryMode) sizeRatio = lodash.random(0.14, 0.24);
  else sizeRatio = lodash.random(0.25, 0.35);
  let size = Math.round(shortSide * sizeRatio);
  size = Math.max(30, Math.min(200, size));
  let imgTop = lodash.random(minTop, Math.max(minTop, imgSize.height - size - limitTop));
  let imgLeft = lodash.random(minLeft, Math.max(minLeft, imgSize.width - size - limitLeft));
  let imgColor = colors[lodash.random(0, colors.length - 1)];
  let props = {
    src: `file:///${imgSrc}`,
    size, imgTop, imgLeft, imgColor,
    imgWidth: imgSize.width,
    imgHeight: imgSize.height,
    hardMode, hellMode, normalMode, purgatoryMode,
    rotate: purgatoryMode ? lodash.random(-180, 180) : 0,
    minTop, limitTop, minLeft, limitLeft
  };
  let base64 = null;
  let promise = guessRender('question', props);
  setTimeout(async () => {
    const result = await promise;
    base64 = result ? result.base64 : null;
    if (base64) {
      // 题图校验后的裁切坐标写回 props，答案图高亮框与题图实际位置对齐
      if (result.coord) {
        props.imgTop = result.coord.ty;
        props.imgLeft = result.coord.lx;
      }
      e.reply(segment.image(`base64://${base64}`));
      guessConfig.normalMode = normalMode;
      guessConfig.answer = guessRender('answer', props);
      guessConfig.timer = setTimeout(() => {
        if (guessConfig.playing) {
          replayAnswer(e, ['很遗憾，还没有人答对哦，正确答案是：' + (zzzroleIdToName(String(roleId), true) || roleName) + '\n(如有角色未收录或名称错误，请联系我们)'], guessConfig);
        }
      }, GAME_TIME_OUT * 1000);
    } else {
      guessConfig.playing = false;
      e.reply('呜~ 图片生成失败了… 请稍后重试 〒▽〒');
    }
  }, 1500);
  return true;
}
export async function zzzguessAvatarCheck(e) {
  let guessConfig = getGuessConfig(e);
  let {playing, zzzroleId, normalMode, gameType} = guessConfig;
  // 只处理绝区零猜角色，避免与其他游戏状态混淆
  if (playing && gameType === 'zzz' && zzzroleId && e.msg) {
    let guessed = e.msg.replace(/^#?我猜/, '');
    let isGuess = guessed !== e.msg; // 带"我猜"前缀=明确答题，未命中也计参与
    let answer = guessed.trim();
    let score = judgeAnswer(zzzroleIdData[zzzroleId], answer);
    if (score > 0) {
      guessRank.record({ gameType: 'zzz', e, score, isCorrect: true });
      await replayAnswer(e, ['恭喜你答对了！'], guessConfig, true);
      if (normalMode && lodash.random(0, 100) <= 8) {
        e.reply('如果感觉太简单了的话，可以对我说“#绝区零猜角色困难模式”或者“#绝区零猜角色地狱模式”哦！');
      }
      return true;
    }
    if (isGuess) {
      guessRank.record({ gameType: 'zzz', e, score: 0, isCorrect: false });
    }
  }
  return false;
}

export async function wwguessAvatar(e) {
  // 鸣潮猜角色：消息含其他游戏名/前缀时跳过，交给对应游戏处理
  if (/[异环nte绝区零%Zz星铁]/.test(e.msg)) return false;
  // 查排名的消息绝不新开一局
  if (/排名/.test(e.msg)) return false;
  let guessConfig = getGuessConfig(e);
  if (guessConfig.playing) {
    e.reply('猜角色游戏正在进行哦');
    return true;
  }
  let hardMode = e.msg.includes('困难');
  let hellMode = e.msg.includes('地狱');
  let purgatoryMode = e.msg.includes('炼狱');
  let normalMode = (!hardMode && !hellMode && !purgatoryMode);
  let helpText;
  if (hardMode) {
    helpText = '%s\n在『困难模式』下，发送的图片将会变成黑白色。';
  } else if (hellMode) {
    helpText = '%s\n在『地狱模式』下，发送的图片将会变成反色。';
  } else if (purgatoryMode) {
    helpText = '%s\n在『炼狱模式』下，发送的图片将会变成反色并随机旋转。';
  } else {
    helpText = '%s';
  }
  helpText = helpText.replace('%s', `即将发送一张『随机角色』的『随机一角』，${GAME_TIME_OUT}秒之后揭晓答案！\n回答格式：~我猜[角色名]`);
  e.reply(helpText);
  let fileNames = [];
  let ffn = (n) => !/(未知)/.test(n);
  // 随机选图目录：头像、抽卡图、立绘
  let imgPaths = [wwlogoPath, wwgachaPath, wwSplashPath];
  let imgPath = imgPaths[lodash.random(0, imgPaths.length - 1)];
  fs.readdirSync(imgPath).filter(ffn).forEach(n => fileNames.push(n));
  let fileName = fileNames[Math.round(Math.random() * (fileNames.length - 1))];
  // 鸣潮角色名可能带数字（如「漂泊者·湮灭」），不能删数字
  // 只去扩展名，查不到再去末尾数字后缀重试（如「椿01」→「椿」）
  let roleName = fileName.replace(/\.[^.]+$/, '');
  // 皮肤后缀为固定格式（01/02…09），不影响角色名，先清洗皮肤后缀
  let stripped = roleName.replace(/0\d$/, '');
  if (stripped !== roleName) roleName = stripped;
  // 首位精确匹配 → 别名兜底
  let roleId = findOfficialId(wwroleIdData, roleName) || wwroleIdToName(roleName);
  guessConfig.playing = true;
  // 清空其他游戏残留ID，设置当前游戏类型，避免不同游戏状态混淆
  guessConfig.roleId = '';
  guessConfig.starroleId = '';
  guessConfig.zzzroleId = '';
  guessConfig.nteroleId = '';
  guessConfig.gameType = 'ww';
  guessConfig.wwroleId = roleId;
  console.group('猜角色');
  console.log('ID:', roleId);
  console.log('角色:', roleName);
  console.groupEnd();
  let imgSrc = path.join(imgPath, fileName);
  let minTop = 0, limitTop = 0, minLeft = 0, limitLeft = 0;
  if (imgPath === wwgachaPath) {
    minTop = 50;
  } else {
    minLeft = 30;
    limitLeft = 30;
  }
  let imgSize = sizeOf(imgSrc);
  // 裁切框按图片短边比例动态计算：普通最大、困难次之、地狱炼狱更小，并限制上下限避免太小或几乎全图
  let shortSide = Math.min(imgSize.width, imgSize.height);
  let sizeRatio;
  if (hardMode) sizeRatio = lodash.random(0.20, 0.30);
  else if (hellMode) sizeRatio = lodash.random(0.16, 0.26);
  else if (purgatoryMode) sizeRatio = lodash.random(0.14, 0.24);
  else sizeRatio = lodash.random(0.25, 0.35);
  let size = Math.round(shortSide * sizeRatio);
  size = Math.max(30, Math.min(200, size));
  let imgTop = lodash.random(minTop, Math.max(minTop, imgSize.height - size - limitTop));
  let imgLeft = lodash.random(minLeft, Math.max(minLeft, imgSize.width - size - limitLeft));
  let imgColor = colors[lodash.random(0, colors.length - 1)];
  let props = {
    src: `file:///${imgSrc}`,
    size, imgTop, imgLeft, imgColor,
    imgWidth: imgSize.width,
    imgHeight: imgSize.height,
    hardMode, hellMode, normalMode, purgatoryMode,
    rotate: purgatoryMode ? lodash.random(-180, 180) : 0,
    minTop, limitTop, minLeft, limitLeft
  };
  let base64 = null;
  let promise = guessRender('question', props);
  setTimeout(async () => {
    const result = await promise;
    base64 = result ? result.base64 : null;
    if (base64) {
      // 题图校验后的裁切坐标写回 props，答案图高亮框与题图实际位置对齐
      if (result.coord) {
        props.imgTop = result.coord.ty;
        props.imgLeft = result.coord.lx;
      }
      e.reply(segment.image(`base64://${base64}`));
      guessConfig.normalMode = normalMode;
      guessConfig.answer = guessRender('answer', props);
      guessConfig.timer = setTimeout(() => {
        if (guessConfig.playing) {
          replayAnswer(e, ['很遗憾，还没有人答对哦，正确答案是：' + (wwroleIdToName(String(roleId), true) || roleName) + '\n(如有角色未收录或名称错误，请联系我们)'], guessConfig);
        }
      }, GAME_TIME_OUT * 1000);
    } else {
      guessConfig.playing = false;
      e.reply('呜~ 图片生成失败了… 请稍后重试 〒▽〒');
    }
  }, 1500);
  return true;
}

export async function wwguessAvatarCheck(e) {
  let guessConfig = getGuessConfig(e);
  let {playing, wwroleId, normalMode, gameType} = guessConfig;
  // 只处理鸣潮猜角色，避免与其他游戏状态混淆
  if (playing && gameType === 'ww' && wwroleId && e.msg) {
    let guessed = e.msg.replace(/^[~#]?我猜/, '');
    let isGuess = guessed !== e.msg; // 带"我猜"前缀=明确答题，未命中也计参与
    let answer = guessed.trim();
    let score = judgeAnswer(wwroleIdData[wwroleId], answer);
    if (score > 0) {
      guessRank.record({ gameType: 'ww', e, score, isCorrect: true });
      await replayAnswer(e, ['恭喜你答对了！'], guessConfig, true);
      if (normalMode && lodash.random(0, 100) <= 8) {
        e.reply('如果感觉太简单了的话，可以对我说“~猜角色困难模式”或者“~猜角色地狱模式”哦！');
      }
      return true;
    }
    if (isGuess) {
      guessRank.record({ gameType: 'ww', e, score: 0, isCorrect: false });
    }
  }
  return false;
}

export async function nteguessAvatar(e) {
  // 异环猜角色：消息含其他游戏名/前缀时跳过，交给对应游戏处理
  if (/[鸣潮ww~绝区零%Zz星铁]/.test(e.msg)) return false;
  // 查排名的消息绝不新开一局
  if (/排名/.test(e.msg)) return false;
  let guessConfig = getGuessConfig(e);
  if (guessConfig.playing) {
    e.reply('猜角色游戏正在进行哦');
    return true;
  }
  let hardMode = e.msg.includes('困难');
  let hellMode = e.msg.includes('地狱');
  let purgatoryMode = e.msg.includes('炼狱');
  let normalMode = (!hardMode && !hellMode && !purgatoryMode);
  let helpText;
  if (hardMode) {
    helpText = '%s\n在『困难模式』下，发送的图片将会变成黑白色。';
  } else if (hellMode) {
    helpText = '%s\n在『地狱模式』下，发送的图片将会变成反色。';
  } else if (purgatoryMode) {
    helpText = '%s\n在『炼狱模式』下，发送的图片将会变成反色并随机旋转。';
  } else {
    helpText = '%s';
  }
  helpText = helpText.replace('%s', `即将发送一张『随机角色』的『随机一角』，${GAME_TIME_OUT}秒之后揭晓答案！\n回答格式：#我猜[角色名]`);
  e.reply(helpText);
  let fileNames = [];
  let ffn = (n) => !/(未知)/.test(n);
  // 异环只有立绘目录
  let imgPath = nteSplashPath;
  fs.readdirSync(imgPath).filter(ffn).forEach(n => fileNames.push(n));
  let fileName = fileNames[Math.round(Math.random() * (fileNames.length - 1))];
  // 异环角色名可能带数字（如「11号」），不能删数字
  // 只去扩展名，查不到再去末尾数字后缀重试（如「零01」→「零」）
  let roleName = fileName.replace(/\.[^.]+$/, '');
  // 皮肤后缀为固定格式（01/02…09），不影响角色名，先清洗皮肤后缀
  let stripped = roleName.replace(/0\d$/, '');
  if (stripped !== roleName) roleName = stripped;
  // 首位精确匹配 → 别名兜底
  let roleId = findOfficialId(nteroleIdData, roleName) || nteroleIdToName(roleName);
  guessConfig.playing = true;
  // 清空其他游戏残留ID，设置当前游戏类型，避免不同游戏状态混淆
  guessConfig.roleId = '';
  guessConfig.starroleId = '';
  guessConfig.zzzroleId = '';
  guessConfig.wwroleId = '';
  guessConfig.gameType = 'nte';
  guessConfig.nteroleId = roleId;
  console.group('猜角色');
  console.log('ID:', roleId);
  console.log('角色:', roleName);
  console.groupEnd();
  let imgSrc = path.join(imgPath, fileName);
  let minTop = 0, limitTop = 0, minLeft = 0, limitLeft = 0;
  minLeft = 30;
  limitLeft = 30;
  let imgSize = sizeOf(imgSrc);
  // 裁切框按图片短边比例动态计算：普通最大、困难次之、地狱炼狱更小，并限制上下限避免太小或几乎全图
  let shortSide = Math.min(imgSize.width, imgSize.height);
  let sizeRatio;
  if (hardMode) sizeRatio = lodash.random(0.20, 0.30);
  else if (hellMode) sizeRatio = lodash.random(0.16, 0.26);
  else if (purgatoryMode) sizeRatio = lodash.random(0.14, 0.24);
  else sizeRatio = lodash.random(0.25, 0.35);
  let size = Math.round(shortSide * sizeRatio);
  size = Math.max(30, Math.min(200, size));
  let imgTop = lodash.random(minTop, Math.max(minTop, imgSize.height - size - limitTop));
  let imgLeft = lodash.random(minLeft, Math.max(minLeft, imgSize.width - size - limitLeft));
  let imgColor = colors[lodash.random(0, colors.length - 1)];
  let props = {
    src: `file:///${imgSrc}`,
    size, imgTop, imgLeft, imgColor,
    imgWidth: imgSize.width,
    imgHeight: imgSize.height,
    hardMode, hellMode, normalMode, purgatoryMode,
    rotate: purgatoryMode ? lodash.random(-180, 180) : 0,
    minTop, limitTop, minLeft, limitLeft
  };
  let base64 = null;
  let promise = guessRender('question', props);
  setTimeout(async () => {
    const result = await promise;
    base64 = result ? result.base64 : null;
    if (base64) {
      // 题图校验后的裁切坐标写回 props，答案图高亮框与题图实际位置对齐
      if (result.coord) {
        props.imgTop = result.coord.ty;
        props.imgLeft = result.coord.lx;
      }
      e.reply(segment.image(`base64://${base64}`));
      guessConfig.normalMode = normalMode;
      guessConfig.answer = guessRender('answer', props);
      guessConfig.timer = setTimeout(() => {
        if (guessConfig.playing) {
          replayAnswer(e, ['很遗憾，还没有人答对哦，正确答案是：' + (nteroleIdToName(String(roleId), true) || roleName) + '\n(如有角色未收录或名称错误，请联系我们)'], guessConfig);
        }
      }, GAME_TIME_OUT * 1000);
    } else {
      guessConfig.playing = false;
      e.reply('呜~ 图片生成失败了… 请稍后重试 〒▽〒');
    }
  }, 1500);
  return true;
}

export async function nteguessAvatarCheck(e) {
  let guessConfig = getGuessConfig(e);
  let {playing, nteroleId, normalMode, gameType} = guessConfig;
  // 只处理异环猜角色，避免与其他游戏状态混淆
  if (playing && gameType === 'nte' && nteroleId && e.msg) {
    let guessed = e.msg.replace(/^#?我猜/, '');
    let isGuess = guessed !== e.msg; // 带"我猜"前缀=明确答题，未命中也计参与
    let answer = guessed.trim();
    let score = judgeAnswer(nteroleIdData[nteroleId], answer);
    if (score > 0) {
      guessRank.record({ gameType: 'nte', e, score, isCorrect: true });
      await replayAnswer(e, ['恭喜你答对了！'], guessConfig, true);
      if (normalMode && lodash.random(0, 100) <= 8) {
        e.reply('如果感觉太简单了的话，可以对我说“#异环猜角色困难模式”或者“#异环猜角色地狱模式”哦！');
      }
      return true;
    }
    if (isGuess) {
      guessRank.record({ gameType: 'nte', e, score: 0, isCorrect: false });
    }
  }
  return false;
}
// 谜语游戏状态管理
const miyuGames = new Map();

export async function miyu(e) {
  // 检查是否有正在进行的游戏
  if (miyuGames.has(e.group_id)) {
    e.reply('猜谜语游戏正在进行中，请先回答当前的谜语！');
    return true;
  }
  
  const cfg = config.getconfig('liulian', 'token', 'config');
  const apikeys = cfg.apikeys;
  const apikey = apikeys.miyu_apikey || '';
  
  let url = `https://api.oick.cn/api/miyu?apikey=${apikey}`;
  let response = await fetch(url);
  let res = await response.json();
  
  if (!res || !res.topic || !res.answer) {
    e.reply('获取谜语失败，请稍后重试');
    return true;
  }
  
  const gameTime = 30; // 游戏时长30秒
  
  // 显示谜语
  let msg = `🧩 猜谜语游戏开始！
  
${res.topic}

提示：${res.tip}

${gameTime}秒后公布答案！
回答格式：#谜底[答案]`;
  e.reply(msg);
  
  // 保存游戏状态
  miyuGames.set(e.group_id, {
    answer: res.answer,
    timer: null
  });
  
  // 设置超时公布答案
  const gameTimer = setTimeout(() => {
    if (miyuGames.has(e.group_id)) {
      const game = miyuGames.get(e.group_id);
      e.reply(`⏰ 时间到！正确答案是：${game.answer}`);
      miyuGames.delete(e.group_id);
    }
  }, gameTime * 1000);
  
  // 保存定时器
  const game = miyuGames.get(e.group_id);
  game.timer = gameTimer;
  
  return true;
}

export async function miyuCheck(e) {
  // 检查是否有正在进行的游戏
  if (!miyuGames.has(e.group_id)) {
    return false;
  }
  
  const game = miyuGames.get(e.group_id);
  const userAnswer = e.msg.replace(/^#?谜底/, '').trim();
  
  if (userAnswer === game.answer) {
    // 回答正确
    clearTimeout(game.timer);
    e.reply(`🎉 恭喜你答对了！正确答案就是：${game.answer}`);
    miyuGames.delete(e.group_id);
    return true;
  }

  return false;
}

// ============ 猜角色排名查询 ============
const RANK_GAME_NAMES = { genshin: '原神', star: '星穹铁道', zzz: '绝区零', ww: '鸣潮', nte: '异环', total: '综合' };
const RANK_PERIOD_NAMES = { day: '日榜', week: '周榜', month: '月榜', year: '年榜' };

// 实时取用户昵称：群名片优先，其次各Bot的群成员/好友缓存，取不到用QQ号兜底
// 实时取群名：各Bot的群列表缓存优先，取不到用群号兜底
function getGroupName(e, groupId) {
  const gid = String(groupId);
  try {
    const Bot = global.Bot;
    const bots = (Bot?.uin ? Bot.uin.map(u => Bot[u]) : Object.values(Bot || {})).filter(b => b && (b.gl || b.fl));
    for (const bot of bots) {
      const g = bot.gl?.get?.(gid);
      if (g && (g.group_name || g.groupName)) return g.group_name || g.groupName;
    }
  } catch {}
  return `群${gid}`;
}

function getRankName(e, userId) {
  const uid = String(userId);
  try {
    if (e.group && e.group.pickMember) {
      const info = e.group.pickMember(uid)?.info;
      if (info && (info.card || info.nickname)) return info.card || info.nickname;
    }
  } catch {}
  try {
    const Bot = global.Bot;
    const bots = (Bot?.uin ? Bot.uin.map(u => Bot[u]) : Object.values(Bot || {})).filter(b => b && (b.fl || b.gml));
    for (const bot of bots) {
      const f = bot.fl?.get?.(uid);
      if (f?.nickname) return f.nickname;
      if (bot.gml) {
        for (const members of bot.gml.values()) {
          const info = members?.get?.(uid);
          if (info && (info.card || info.nickname)) return info.card || info.nickname;
        }
      }
    }
  } catch {}
  return uid.length > 6 ? `QQ${uid.slice(-4)}` : uid;
}

// ============ 总排名接口钩子 ============
// 后端就绪后在此配置接口地址与密钥，请求时带密钥做验证，按返回错误码给出对应提示
const TOTAL_RANK_API = {
  url: '',    // TODO: 后端就绪后填入拉取总排名数据的接口地址
  key: '',    // TODO: 后端就绪后填入验证密钥
  cacheMs: 60 * 1000, // 1分钟内直接用缓存返回
};
let totalRankCache = { data: null, time: 0 };

// 拉取总排名：命中缓存直接返回；请求失败/返回错误码时返回 null，由调用方给出提示
async function fetchTotalRank({ game, period, topN }) {
  if (!TOTAL_RANK_API.url) return null;
  const now = Date.now();
  if (totalRankCache.data && now - totalRankCache.time < TOTAL_RANK_API.cacheMs) {
    return totalRankCache.data;
  }
  try {
    const res = await fetch(TOTAL_RANK_API.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: TOTAL_RANK_API.key },
      body: JSON.stringify({ game, period, topN }),
    });
    const ret = await res.json();
    // TODO: 后端就绪后按约定错误码分支处理（无权限提示购买榴莲会员等）
    if (ret.code !== 0 && ret.code !== 200) {
      logger.warn(`[猜角色排名] 总排名接口返回错误码: ${ret.code}`);
      return null;
    }
    totalRankCache = { data: ret.data, time: now };
    return ret.data;
  } catch (err) {
    logger.warn(`[猜角色排名] 总排名接口请求失败: ${err.message}`);
    return null;
  }
}

// 会员身份验证：查任何排名（总/全服/群）都需先通过验证，验证失败一律不提供排名数据
// 后端就绪后填入验证接口地址（密钥复用 TOTAL_RANK_API.key）
const MEMBER_VERIFY_API = {
  url: '',   // TODO: 后端就绪后填入会员验证接口地址
};
let memberVerifyCache = { ok: null, time: 0 };

// 验证会员身份：接口未配置时不拦截（功能未上线）；验证通过或命中缓存返回 true
async function checkMemberVerified() {
  if (!MEMBER_VERIFY_API.url) return true;
  const now = Date.now();
  if (memberVerifyCache.ok !== null && now - memberVerifyCache.time < TOTAL_RANK_API.cacheMs) {
    return memberVerifyCache.ok;
  }
  try {
    const res = await fetch(MEMBER_VERIFY_API.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: TOTAL_RANK_API.key },
    });
    const ret = await res.json();
    // TODO: 后端就绪后按约定错误码分支处理（无权限/过期/其他）
    memberVerifyCache = { ok: ret.code === 0 || ret.code === 200, time: now };
  } catch (err) {
    logger.warn(`[猜角色排名] 会员验证请求失败: ${err.message}`);
    memberVerifyCache = { ok: false, time: now };
  }
  return memberVerifyCache.ok;
}

export async function guessRankCmd(e, { render }) {
  // 关键词可能出现在"排名"前后（如 星铁猜角色排名 / 猜角色星铁全服周排名），全量交给解析器
  const rest = e.msg.replace(/^[#*~%]+/, '').replace('排名', ' ');
  // 是否带了任何参数（用于提示语跳过"参数组合"这条）
  const hasArg = /[^\s#*~%]/.test(rest);
  const parsed = parseRankArgs(rest);
  let { game, scope, period, topN } = parsed;
  // 前缀游戏约定（与各猜角色入口一致）：*=星铁、~=鸣潮、%=绝区零
  const prefixRet = e.msg.match(/^[#]*([*~%])/);
  if (prefixRet && game === 'all') {
    game = { '*': 'star', '~': 'ww', '%': 'zzz' }[prefixRet[1]];
  }

  // 会员验证只管总排名（bot 自身会员），本地群/全服排名不设门槛

  // 私聊没有群维度，自动转全服
  if (scope === 'group' && !e.group_id) scope = 'server';

  // 群与群排名：本地数据按群汇总总分，需 bot 会员验证，不验证不给用
  if (scope === 'grouprank') {
    if (!(await checkMemberVerified())) {
      e.reply('请购买榴莲会员获取群聊排名资格～');
      return true;
    }
    const list = guessRank.getGroupRank({ period, game: game === 'all' ? 'total' : game, topN });
    if (!list.length) {
      e.reply(`暂无${RANK_PERIOD_NAMES[period]}群聊排名数据，快开始猜角色吧～`);
      return true;
    }
    await Common.render('guess/rank', {
      title: '猜角色群聊排名',
      scopeLabel: '群聊排名',
      periodLabel: RANK_PERIOD_NAMES[period],
      period,
      groups: [{
        game: 'grouprank',
        title: '群排名',
        rows: list.map(r => ({
          rank: r.rank,
          name: getGroupName(e, r.groupId),
          avatar: `https://p.qlogo.cn/gh/${r.groupId}/${r.groupId}/100`,
          score: r.score, wins: r.wins, parts: r.parts,
          me: String(r.groupId) === String(e.group_id),
        })),
        mine: null,
      }],
      updateTime: new Date().toLocaleString('zh-CN', { hour12: false })
    }, { e, render, scale: 1.2 });
    return true;
  }

  // 总排名：走中央接口，需 bot 会员验证；本地群/全服排名不设门槛
  if (scope === 'total') {
    if (!(await checkMemberVerified())) {
      e.reply('请购买榴莲会员获取总排名资格～\n可先发送 #猜角色排名全服 查看全服榜');
      return true;
    }
    const totalRank = await fetchTotalRank({ game, period, topN });
    if (totalRank) {
      // 接口返回结构：
      // users: [{ game, title, rows: [{ rank, userId, name?, avatar?, score, wins, parts }], mine? }]
      // groupRank: [{ rank, groupId, name?, score, parts? }] —— 群总分榜（仅总排名提供，本地无此数据）
      const groups = (totalRank.users || []).map(g => ({
        game: g.game,
        title: g.title,
        avatar: '',
        rows: (g.rows || []).map(r => ({
          rank: r.rank, name: r.name,
          avatar: r.avatar || (r.userId ? `https://q1.qlogo.cn/g?b=qq&nk=${r.userId}&s=100` : ''),
          score: r.score, wins: r.wins, parts: r.parts,
          me: String(r.userId) === myId,
        })),
        mine: g.mine || null,
      }));
      if (groups.length) {
        await Common.render('guess/rank', {
          title: '猜角色排名',
          scopeLabel: '总排名',
          periodLabel: RANK_PERIOD_NAMES[period],
          period,
          groups,
          updateTime: new Date().toLocaleString('zh-CN', { hour12: false })
        }, { e, render, scale: 1.2 });
        sendRankHint(e, { scope, period, game, topN, hasArg });
      } else {
        e.reply('总排名暂无数据');
      }
      return true;
    }
    e.reply('总排名需榴莲会员获取资格，功能即将开放，敬请期待～\n可先发送 #猜角色排名全服 查看全服榜');
    return true;
  }

  const scopeLabel = scope === 'server' ? '全服' : '本群';
  const groupId = scope === 'group' ? e.group_id : undefined;

  const gameList = game === 'all' ? ['genshin', 'star', 'zzz', 'ww', 'nte', 'total'] : [game];
  const myId = String(e.user_id);
  const groups = [];

  for (const g of gameList) {
    const list = guessRank.getRank({ period, scope, groupId, game: g, topN });
    const rows = [];
    for (let i = 0; i < list.length; i++) {
      const u = list[i];
      rows.push({
        rank: i + 1,
        name: getRankName(e, u.userId),
        avatar: `https://q1.qlogo.cn/g?b=qq&nk=${u.userId}&s=100`,
        score: u.score, wins: u.wins, parts: u.parts,
        me: u.userId === myId,
      });
    }
    // 进榜时行内高亮即可；未进榜但有数据时页尾补"我的排名"
    let mine = null;
    if (!rows.some(r => r.me)) {
      const ur = guessRank.getUserRank({ period, scope, groupId, game: g, userId: myId });
      if (ur) mine = { rank: ur.rank, score: ur.score, wins: ur.wins, parts: ur.parts, inList: false };
    }
    groups.push({ game: g, title: g === 'total' ? '综合排名' : RANK_GAME_NAMES[g], rows, mine });
  }

  if (groups.every(g => g.rows.length === 0)) {
    e.reply(`暂无${scopeLabel}${RANK_PERIOD_NAMES[period]}数据，快开始猜角色吧～`);
    return true;
  }

  await Common.render('guess/rank', {
    title: '猜角色排名',
    scopeLabel,
    periodLabel: RANK_PERIOD_NAMES[period],
    period,
    groups,
    updateTime: new Date().toLocaleString('zh-CN', { hour12: false })
  }, { e, render, scale: 1.2 });

  sendRankHint(e, { scope, period, game, topN, hasArg });
  return true;
}

// 发排名图后随机附带一条玩法提示（开关控制），跳过与本次查询重复的（查了全服就不推全服，互补范围的照发）
const RANK_HINTS = [
  { key: 'server', text: '发送 #猜角色排名全服 可查看全服榜' },
  { key: 'group', text: '发送 #猜角色群排名 可查看群友榜' },
  { key: 'week', text: '发送 #猜角色排名周 可查看周榜（日/周/月/年均可查）' },
  { key: 'game', text: '发送 #猜角色排名星铁 可查看指定游戏的排名' },
  { key: 'combo', text: '排名参数可组合，如 #猜角色排名星铁 全服 周' },
  { key: 'score', text: '使用官方名称答对得3分，别名答对得1分' },
  { key: 'top', text: '发送 #猜角色排名前20 可查看更多名次' },
  { key: 'total', text: '总排名需榴莲会员资格，敬请期待' },
];

function sendRankHint(e, { scope, period, game, topN, hasArg }) {
  try {
    if (Cfg.get('sys.guessRankHint', true) === false) return;
    const pool = RANK_HINTS.filter(h => {
      if (h.key === 'server') return scope !== 'server';
      if (h.key === 'group') return scope !== 'group' && !!e.group_id;
      if (h.key === 'week') return period !== 'week';
      if (h.key === 'game') return game === 'all';
      if (h.key === 'combo') return !hasArg;
      if (h.key === 'top') return topN < 20;
      return true;
    });
    if (!pool.length) return;
    e.reply(pool[Math.floor(Math.random() * pool.length)].text);
  } catch (err) {
    logger.warn(`[猜角色排名] 提示语发送失败: ${err.message}`);
  }
}