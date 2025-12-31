import fs from 'fs'; 
import path from 'path';
import ffmpeg from 'ffmpeg';
import lodash from 'lodash';
import fetch from "node-fetch";
import sizeOf from 'image-size';
import { roleIdToName, starroleIdToName } from "../components/mysInfo.js";
import { getPluginRender } from '../model/render.js';
import { Data } from "#liulian";
const GAME_TIME_OUT = 30//游戏时长(秒)
const _path = process.cwd();
let music = [7351920257]; //这里改网易云的歌单id
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
    reg: '^#(星铁)?猜(角色|角色星铁)(普通|困难|地狱)?(模式)?',
    priority: 99,
    describe: '猜星铁角色',
  },
  starguessAvatarCheck: {
    reg: '',
    priority: 98,
    describe: '',
  },
   bbAvatar: {
    reg: '^#(邦布)?猜(邦布|绝区零邦布)(普通|困难|地狱)?(模式)?',
    priority: 99,
    describe: '猜邦布',
  },
  bbAvatarCheck: {
    reg: '',
    priority: 98,
    describe: '',
  }
};
const logoPath = path.join(_path, 'plugins/liulian-plugin/resources/genshin/logo/role');
const gachaPath = path.join(_path, 'plugins/liulian-plugin/resources/genshin/gacha/character');
const starlogoPath = path.join(_path, 'plugins/liulian-plugin/resources/星铁/role');
const stargachaPath = path.join(_path, 'plugins/liulian-plugin/resources/星铁/side');
const bblogoPath = path.join(_path, 'plugins/liulian-plugin/resources/buddy');
const bbgachaPath = path.join(_path, 'plugins/liulian-plugin/resources/buddy');
const version = '2.0';
const templateVersion = '2.0';
const templateName = `guessAvatar_${templateVersion}`;
const pluginName = 'games-template-plugin-zolay-liulian';
const render = getPluginRender(pluginName);
// 暂时禁用导入时初始化，避免阻塞插件加载
// init();
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
    size = lodash.random(35, 45);
    helpText = '%s\n在『困难模式』下，发送的图片将会变成黑白色。';
  } else if (hellMode) {
    size = lodash.random(25, 35);
    helpText = '%s\n在『地狱模式』下，发送的图片将会变成反色。';
  } else {
    size = lodash.random(35, 55);
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
  let roleId = roleIdToName(roleName);
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
          replayAnswer(e, ['很遗憾，还没有人答对哦，正确答案是：' + roleName + '\n(如有角色未收录或角色名称错误，请联系我们)'], guessConfig);
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
    let id = roleIdToName(e.msg.trim());
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
export async function guessmusic(e) {
  let guessConfig = getGuessConfig(e)
  if (guessConfig.gameing) {
    e.reply('猜歌名正在进行哦!')
    return true;
  }
   let res = await(await fetch(`https://api.yimian.xyz/msc/?type=playlist&id=${music}&random=true`)).json(); 
   console.log("歌名是:"+res[0].name);
    e.reply( `游戏开始啦,请听语音猜出歌名！\n游戏区分大小写,猜的歌名必须跟答案一样才算你对噢~\n结束游戏指令【投降】`,true);
    e.reply(await uploadRecord(res[0].url));
    setTimeout(() => {
      e.reply(`提示：\n歌手:${res[0].artist}`);
    }, 2000)//毫秒数
  guessConfig.gameing = true;
  guessConfig.current = res[0].name;
    guessConfig.timer = setTimeout(() => {
      if (guessConfig.gameing) {
        guessConfig.gameing = false;
        e.reply(`嘿嘿,猜歌名结束啦,很遗憾没有人猜中噢！歌名是【${res[0].name}】`);
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
  let normalMode = (!hardMode && !hellMode);
  let size, helpText;
  if (hardMode) {
    size = lodash.random(80, 90);
    helpText = '%s\n在『困难模式』下，发送的图片将会变成黑白色。';
  } else if (hellMode) {
    size = lodash.random(70, 80);
    helpText = '%s\n在『地狱模式』下，发送的图片将会变成反色。';
  } else {
    size = lodash.random(80, 120);
    helpText = '%s';
  }
  helpText = helpText.replace('%s', `即将发送一张『随机角色』的『随机一角』，${GAME_TIME_OUT}秒之后揭晓答案！`);
  e.reply(helpText);
  let fileNames = [];
  let ffn = (n) => !/(未知)/.test(n);
  let imgPath = lodash.random(0, 100) <= 30 ? starlogoPath : stargachaPath;
  fs.readdirSync(imgPath).filter(ffn).forEach(n => fileNames.push(n));
  let fileName = fileNames[Math.round(Math.random() * (fileNames.length - 1))];
  let roleName = fileName.replace(/\..+$/, '').replace(/\d/g, '');
  let roleId = starroleIdToName(roleName);
  guessConfig.playing = true;
  guessConfig.roleId = roleId;
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
          replayAnswer(e, ['很遗憾，还没有人答对哦，正确答案是：' + roleName + '\n(如有角色未收录或名称错误，请联系我们)'], guessConfig);
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
  let {playing, starroleId, normalMode} = guessConfig;
  if (playing && starroleId && e.msg) {
    let id = starroleIdToName(e.msg.trim());
    if (roleId === id) {
      await replayAnswer(e, ['恭喜你答对了！'], guessConfig, true);
      if (normalMode && lodash.random(0, 100) <= 8) {
        e.reply('如果感觉太简单了的话，可以对我说“#星铁猜角色困难模式”或者“#星铁猜角色地狱模式”哦！');
      }
      return true;
    }
  }
}

export async function bbguessAvatar(e) {
  let guessConfig = getGuessConfig(e);
  if (guessConfig.playing) {
    e.reply('猜邦布游戏正在进行哦');
    return true;
  }
  let hardMode = e.msg.includes('困难');
  let hellMode = e.msg.includes('地狱');
  let normalMode = (!hardMode && !hellMode);
  let size, helpText;
  if (hardMode) {
    size = lodash.random(80, 90);
    helpText = '%s\n在『困难模式』下，发送的图片将会变成黑白色。';
  } else if (hellMode) {
    size = lodash.random(70, 80);
    helpText = '%s\n在『地狱模式』下，发送的图片将会变成反色。';
  } else {
    size = lodash.random(80, 120);
    helpText = '%s';
  }
  helpText = helpText.replace('%s', `即将发送一张『随机邦布』的『随机一角』，${GAME_TIME_OUT}秒之后揭晓答案！`);
  e.reply(helpText);
  let fileNames = [];
  let ffn = (n) => !/(未知)/.test(n);
  let imgPath = lodash.random(0, 100) <= 30 ? bblogoPath : bbgachaPath;
  fs.readdirSync(imgPath).filter(ffn).forEach(n => fileNames.push(n));
  let fileName = fileNames[Math.round(Math.random() * (fileNames.length - 1))];
  let roleName = fileName.replace(/\..+$/, '').replace(/\d/g, '');
  let roleId = bbroleIdToName(roleName);
  guessConfig.playing = true;
  guessConfig.roleId = roleId;
  console.group('猜角色');
  console.log('ID:', roleId);
  console.log('角色:', roleName);
  console.groupEnd();
  let imgSrc = path.join(imgPath, fileName);
  let minTop = 0, limitTop = 0, minLeft = 0, limitLeft = 0;
  if (imgPath === bbgachaPath) {
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
          replayAnswer(e, ['很遗憾，还没有人答对哦，正确答案是：' + roleName + '\n(如有邦布未收录或名称错误，请联系我们)'], guessConfig);
        }
      }, GAME_TIME_OUT * 1000);
    } else {
      guessConfig.playing = false;
      e.reply('呜~ 图片生成失败了… 请稍后重试 〒▽〒');
    }
  }, 1500);
  return true;
}
export async function bbguessAvatarCheck(e) {
  let guessConfig = getGuessConfig(e);
  let {playing, bbroleId, normalMode} = guessConfig;
  if (playing && bbroleId && e.msg) {
    let id = bbroleIdToName(e.msg.trim());
    if (roleId === id) {
      await replayAnswer(e, ['恭喜你答对了！'], guessConfig, true);
      if (normalMode && lodash.random(0, 100) <= 8) {
        e.reply('如果感觉太简单了的话，可以对我说“#猜邦布困难模式”或者“#猜邦布地狱模式”哦！');
      }
      return true;
    }
  }
}