import fs from 'fs';
import path from 'path';
import { segment } from 'oicq';
import lodash from 'lodash';
import sizeOf from 'image-size';
import { getPluginRender } from '../model/render.js';
import { Data } from "../components/index.js";
const GAME_TIME_OUT = 30//游戏时长(秒)
export const rule = {
  guessAvatar: {
    reg: '^#猜(头像|角色)(普通|困难|地狱)?(模式)?',
    priority: 99,
    describe: '#猜头像、#猜角色、#猜角色困难模式',
  },
  guessAvatarCheck: {
    reg: '',
    priority: 98,
    describe: '',
  },
};
const _path = process.cwd();
const logoPath = path.join(_path, 'plugins/liulian-plugin/resources/genshin/logo/role');
const gachaPath = path.join(_path, 'plugins/liulian-plugin/resources/genshin/gacha/character');
const version = '2.0';
const templateVersion = '2.0';
const templateName = `guessAvatar_${templateVersion}`;
const pluginName = 'games-template-plugin-zolay';
const render = getPluginRender(pluginName);
init();
const guessConfigMap = new Map();
function getGuessConfig(e) {
  let key = e.message_type + e[e.isGroup ? 'group_id' : 'user_id'];
  let config = guessConfigMap.get(key);
  if (config == null) {
    config = {
      playing: false,
      roleId: '',
      timer: null,
      answer: null,
      delete: () => guessConfigMap.delete(key),
    };
    guessConfigMap.set(key, config);
  }
  return config;
}
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
  let normalMode = (!hardMode && !hellMode);
  let size, helpText;
  if (hardMode) {
    size = lodash.random(30, 40);
    helpText = '%s\n在『困难模式』下，发送的图片将会变成黑白色。';
  } else if (hellMode) {
    size = lodash.random(20, 30);
    helpText = '%s\n在『地狱模式』下，发送的图片将会变成反色。';
  } else {
    size = lodash.random(30, 50);
    helpText = '%s';
  }
  helpText = helpText.replace('%s', `即将发送一张『随机角色』的『随机一角』，${GAME_TIME_OUT}秒之后揭晓答案！`);
  e.reply(helpText);
  let fileNames = [];
  let ffn = (n) => !/(未知)/.test(n);
  let imgPath = lodash.random(0, 100) <= 30 ? logoPath : gachaPath;
  fs.readdirSync(imgPath).filter(ffn).forEach(n => fileNames.push(n));
  let fileName = fileNames[Math.round(Math.random() * (fileNames.length - 1))];
  let roleName = fileName.replace(/\..+$/, '').replace(/\d/g, '');
  let roleId = YunzaiApps.mysInfo.roleIdToName(roleName);
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
    hardMode, hellMode, normalMode
  };
  let base64 = null;
  let promise = render(templateName, 'question', props);
  setTimeout(async () => {
    base64 = await promise;
    if (base64) {
      e.reply(segment.image(`base64://${base64}`));
      guessConfig.normalMode = normalMode;
      guessConfig.answer = render(templateName, 'answer', props);
      guessConfig.timer = setTimeout(() => {
        if (guessConfig.playing) {
          replayAnswer(e, ['很遗憾，还没有人答对哦，正确答案是：' + roleName], guessConfig);
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
  let {playing, roleId, normalMode} = guessConfig;
  if (playing && roleId && e.msg) {
    let id = YunzaiApps.mysInfo.roleIdToName(e.msg.trim());
    if (roleId === id) {
      await replayAnswer(e, ['恭喜你答对了！'], guessConfig, true);
      if (normalMode && lodash.random(0, 100) <= 8) {
        e.reply('如果感觉太简单了的话，可以对我说“#猜角色困难模式”或者“#猜角色地狱模式”哦！');
      }
      return true;
    }
  }
}
async function replayAnswer(e, message, cfg, isReply = false) {
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
  if (!fs.existsSync(questionPath)) {
    if (!fs.existsSync(templatePath)) {
      Data.createDir(_path, `/plugins/${pluginName}/resources/${templateName}`);
    }
    fs.writeFileSync(questionPath, getTemplate());
    fs.writeFileSync(answerPath, getTemplate(false));
  }
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
  controlEl.style.top = "-" + imgTop + "px";
  controlEl.style.left = "-" + imgLeft + "px";
  if (hardMode) {
    controlEl.classList.add('grayscale')
  } else if (hellMode) {
    controlEl.classList.add('invert')
  }
} else {
  controlEl = document.getElementById('mask');
  controlEl.style.top =  imgTop + "px";
  controlEl.style.left =  imgLeft + "px";
  controlEl.style.width =  size + "px";
  controlEl.style.height =  size + "px";
}
</script>
</body>
</html>
  `;
}
