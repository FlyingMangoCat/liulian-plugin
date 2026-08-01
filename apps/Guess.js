import fs from 'fs'; 
import path from 'path';
import ffmpeg from 'ffmpeg';
import lodash from 'lodash';
import fetch from "node-fetch";
import sizeOf from 'image-size';
import { roleIdToName, starroleIdToName, zzzroleIdToName, nteroleIdToName, wwroleIdToName } from "../components/mysInfo.js";
import { getPluginRender, browserInit } from '../model/render.js';
import template from "art-template";
import { Data } from "#liulian";
import config from "../model/config/config.js"
const GAME_TIME_OUT = 30//游戏时长(秒)
const _path = process.cwd();
let music = [14160207525]; //这里改网易云的歌单
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
  let guessConfig = getGuessConfig(e);
  if (guessConfig.playing) {
    e.reply('猜角色游戏正在进行哦');
    return true;
  }
  let hardMode = e.msg.includes('困难');
  let hellMode = e.msg.includes('地狱');
  let purgatoryMode = e.msg.includes('炼狱');
  let normalMode = (!hardMode && !hellMode && !purgatoryMode);
  let size, helpText;
  if (hardMode) {
    size = lodash.random(35, 45);
    helpText = '%s\n在『困难模式』下，发送的图片将会变成黑白色。';
  } else if (hellMode) {
    size = lodash.random(25, 35);
    helpText = '%s\n在『地狱模式』下，发送的图片将会变成反色。';
  } else if (purgatoryMode) {
    size = lodash.random(25, 35);
    helpText = '%s\n在『炼狱模式』下，发送的图片将会变成反色并随机旋转。';
  } else {
    size = lodash.random(35, 55);
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
  let roleName = fileName.replace(/\..+$/, '').replace(/\d/g, '');
  let roleId = roleIdToName(roleName);
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
  let imgTop = lodash.random(minTop, imgSize.height - size - limitTop);
  let imgLeft = lodash.random(minLeft, imgSize.width - size - limitLeft);
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
    let answer = e.msg.replace(/^#?我猜/, '').trim();
    let id = roleIdToName(answer);
    if (roleId === id) {
      await replayAnswer(e, ['恭喜你答对了！'], guessConfig, true);
      if (normalMode && lodash.random(0, 100) <= 8) {
        e.reply('如果感觉太简单了的话，可以对我说“#猜角色困难模式”或者“#猜角色地狱模式”哦！');
      }
      return true;
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
      #answer-wrap {margin:auto;display: flex;align-items: center;justify-content: center;}
      #answer-wrap #mask{position:absolute;z-index: 1;border: 1px solid white;box-shadow: 0 0 0 2000px rgba(0,0,0,0.6);}
  </style>
</head>

<body>
<div class="container" id="container">
  <img id="img" src="{{src}}" alt="头像">
  <div id="answer-wrap" style="display: none;">
    <img src="{{src}}" alt="头像">
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
  controlEl = document.getElementById('mask');
  controlEl.style.top =  imgTop + "px";
  controlEl.style.left =  imgLeft + "px";
  controlEl.style.width =  size + "px";
  controlEl.style.height =  size + "px";
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
   let res = await(await fetch('https://free.wqwlkj.cn/wqwlapi/wyy_random.php?type=json')).json(); 
   if (!res || res.code !== 1 || !res.data) {
     e.reply('获取歌曲失败，请稍后重试');
     return true;
   }
   console.log("歌名是:"+res.data.name);
    e.reply( `游戏开始啦,请听语音猜出歌名！\n游戏区分大小写,猜的歌名必须跟答案一样才算你对噢~\n结束游戏指令【投降】`,true);
    e.reply(await uploadRecord(res.data.url));
    setTimeout(() => {
      e.reply(`提示：\n歌手:${res.data.artistsname}`);
    }, 2000)//毫秒数
  guessConfig.gameing = true;
  guessConfig.current = res.data.name;
    guessConfig.timer = setTimeout(() => {
      if (guessConfig.gameing) {
        guessConfig.gameing = false;
        e.reply(`嘿嘿,猜歌名结束啦,很遗憾没有人猜中噢！歌名是【${res.data.name}】`);
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
  let guessConfig = getGuessConfig(e);
  if (guessConfig.playing) {
    e.reply('猜角色游戏正在进行哦');
    return true;
  }
  let hardMode = e.msg.includes('困难');
  let hellMode = e.msg.includes('地狱');
  let purgatoryMode = e.msg.includes('炼狱');
  let normalMode = (!hardMode && !hellMode && !purgatoryMode);
  let size, helpText;
  if (hardMode) {
    size = lodash.random(80, 90);
    helpText = '%s\n在『困难模式』下，发送的图片将会变成黑白色。';
  } else if (hellMode) {
    size = lodash.random(70, 80);
    helpText = '%s\n在『地狱模式』下，发送的图片将会变成反色。';
  } else if (purgatoryMode) {
    size = lodash.random(70, 80);
    helpText = '%s\n在『炼狱模式』下，发送的图片将会变成反色并随机旋转。';
  } else {
    size = lodash.random(80, 120);
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
  let roleName = fileName.replace(/\..+$/, '').replace(/\d/g, '');
  let roleId = starroleIdToName(roleName);
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
  let imgTop = lodash.random(minTop, imgSize.height - size - limitTop);
  let imgLeft = lodash.random(minLeft, imgSize.width - size - limitLeft);
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
    let answer = e.msg.replace(/^#?我猜/, '').trim();
    let id = starroleIdToName(answer);
    if (starroleId === id) {
      await replayAnswer(e, ['恭喜你答对了！'], guessConfig, true);
      if (normalMode && lodash.random(0, 100) <= 8) {
        e.reply('如果感觉太简单了的话，可以对我说“#星铁猜角色困难模式”或者“#星铁猜角色地狱模式”哦！');
      }
      return true;
    }
      }
      return false;
    }
    
    
    export async function zzzguessAvatar(e) {
  let guessConfig = getGuessConfig(e);
  if (guessConfig.playing) {
    e.reply('猜角色游戏正在进行哦');
    return true;
  }
  let hardMode = e.msg.includes('困难');
  let hellMode = e.msg.includes('地狱');
  let purgatoryMode = e.msg.includes('炼狱');
  let normalMode = (!hardMode && !hellMode && !purgatoryMode);
  let size, helpText;
  if (hardMode) {
    size = lodash.random(80, 90);
    helpText = '%s\n在『困难模式』下，发送的图片将会变成黑白色。';
  } else if (hellMode) {
    size = lodash.random(70, 80);
    helpText = '%s\n在『地狱模式』下，发送的图片将会变成反色。';
  } else if (purgatoryMode) {
    size = lodash.random(70, 80);
    helpText = '%s\n在『炼狱模式』下，发送的图片将会变成反色并随机旋转。';
  } else {
    size = lodash.random(80, 120);
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
  let roleName = fileName.replace(/\..+$/, '');
  let roleId = zzzroleIdToName(roleName);
  if (!roleId) {
    let stripped = roleName.replace(/\d+$/, '');
    if (stripped !== roleName) {
      roleId = zzzroleIdToName(stripped);
      if (roleId) roleName = stripped;
    }
  }
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
  let imgTop = lodash.random(minTop, imgSize.height - size - limitTop);
  let imgLeft = lodash.random(minLeft, imgSize.width - size - limitLeft);
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
    let answer = e.msg.replace(/^#?我猜/, '').trim();
    let id = zzzroleIdToName(answer);
    if (zzzroleId === id) {
      await replayAnswer(e, ['恭喜你答对了！'], guessConfig, true);
      if (normalMode && lodash.random(0, 100) <= 8) {
        e.reply('如果感觉太简单了的话，可以对我说“#绝区零猜角色困难模式”或者“#绝区零猜角色地狱模式”哦！');
      }
      return true;
    }
  }
  return false;
}

export async function wwguessAvatar(e) {
  let guessConfig = getGuessConfig(e);
  if (guessConfig.playing) {
    e.reply('猜角色游戏正在进行哦');
    return true;
  }
  let hardMode = e.msg.includes('困难');
  let hellMode = e.msg.includes('地狱');
  let purgatoryMode = e.msg.includes('炼狱');
  let normalMode = (!hardMode && !hellMode && !purgatoryMode);
  let size, helpText;
  if (hardMode) {
    size = lodash.random(80, 90);
    helpText = '%s\n在『困难模式』下，发送的图片将会变成黑白色。';
  } else if (hellMode) {
    size = lodash.random(70, 80);
    helpText = '%s\n在『地狱模式』下，发送的图片将会变成反色。';
  } else if (purgatoryMode) {
    size = lodash.random(70, 80);
    helpText = '%s\n在『炼狱模式』下，发送的图片将会变成反色并随机旋转。';
  } else {
    size = lodash.random(80, 120);
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
  let roleName = fileName.replace(/\..+$/, '');
  let roleId = wwroleIdToName(roleName);
  if (!roleId) {
    let stripped = roleName.replace(/\d+$/, '');
    if (stripped !== roleName) {
      roleId = wwroleIdToName(stripped);
      if (roleId) roleName = stripped;
    }
  }
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
  let imgTop = lodash.random(minTop, imgSize.height - size - limitTop);
  let imgLeft = lodash.random(minLeft, imgSize.width - size - limitLeft);
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
    let answer = e.msg.replace(/^[~#]?我猜/, '').trim();
    let id = wwroleIdToName(answer);
    if (wwroleId === id) {
      await replayAnswer(e, ['恭喜你答对了！'], guessConfig, true);
      if (normalMode && lodash.random(0, 100) <= 8) {
        e.reply('如果感觉太简单了的话，可以对我说“~猜角色困难模式”或者“~猜角色地狱模式”哦！');
      }
      return true;
    }
  }
  return false;
}

export async function nteguessAvatar(e) {
  let guessConfig = getGuessConfig(e);
  if (guessConfig.playing) {
    e.reply('猜角色游戏正在进行哦');
    return true;
  }
  let hardMode = e.msg.includes('困难');
  let hellMode = e.msg.includes('地狱');
  let purgatoryMode = e.msg.includes('炼狱');
  let normalMode = (!hardMode && !hellMode && !purgatoryMode);
  let size, helpText;
  if (hardMode) {
    size = lodash.random(80, 90);
    helpText = '%s\n在『困难模式』下，发送的图片将会变成黑白色。';
  } else if (hellMode) {
    size = lodash.random(70, 80);
    helpText = '%s\n在『地狱模式』下，发送的图片将会变成反色。';
  } else if (purgatoryMode) {
    size = lodash.random(70, 80);
    helpText = '%s\n在『炼狱模式』下，发送的图片将会变成反色并随机旋转。';
  } else {
    size = lodash.random(80, 120);
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
  let roleName = fileName.replace(/\..+$/, '');
  let roleId = nteroleIdToName(roleName);
  if (!roleId) {
    let stripped = roleName.replace(/\d+$/, '');
    if (stripped !== roleName) {
      roleId = nteroleIdToName(stripped);
      if (roleId) roleName = stripped;
    }
  }
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
  let imgTop = lodash.random(minTop, imgSize.height - size - limitTop);
  let imgLeft = lodash.random(minLeft, imgSize.width - size - limitLeft);
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
    let answer = e.msg.replace(/^#?我猜/, '').trim();
    let id = nteroleIdToName(answer);
    if (nteroleId === id) {
      await replayAnswer(e, ['恭喜你答对了！'], guessConfig, true);
      if (normalMode && lodash.random(0, 100) <= 8) {
        e.reply('如果感觉太简单了的话，可以对我说“#异环猜角色困难模式”或者“#异环猜角色地狱模式”哦！');
      }
      return true;
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
  
  const cfg = config.getdefault_config('liulian', 'token', 'config');
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