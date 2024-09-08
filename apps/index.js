import fs from "fs";
import schedule from "node-schedule";
import config from "../model/config/config.js"
import help from "./help.js"
import { wjc } from "./wjc.js"
import { ai } from "./ai.js"
import { replace } from "./replace.js"
import { toShutUp,
determineIfYouShutUp,
openYourMouth
 } from "./Groupshutup.js"
import { daihua,
guangbo
 } from "./transmit.js"
import { 运势 } from "./lucktendency.js"
import { maphelp, mapnumber } from "./maphelp.js"
import {	currentVersion } from "../components/Changelog.js";
import { pluginhelp } from "./pluginhelp.js"
import { 修仙help } from "./修仙help.js"
import { ercyFUN,
chengfenFUN,
daanFUN,
qiuqianFUN } from "./other.js"
import admin from "./admin.js"
import { dutang,
caihongpi,
saylove,
joke,
weather,
早报,
xzys,
godEyesFUN,
headPortraitFUN,
dog,
setu,
lp,
dailyword,
sentence
} from "./manyfunctions.js"
import { Robacat,
Loseacat,
Resetcat,
Bouncecat
 } from "./Cat.js"
import { CeShi } from "./inoutgroup.js"
import { 哪个群友是我老婆 } from "./whoismywife.js"
import { chumeng } from "./打卡.js"
import { randomQA, answerCheck } from "./Q&A.js"
import { HitMe } from "./hitme.js"
import { forge } from "./伪造信息.js"
import { fabing } from "./morbidity.js"
import { biaoQing, biaoQingHelp } from "./makeemoticons.js"
import { random, chuochuo, 上传 } from "./Random expression.js"
import { FuckingChatterbox } from "./chatterboxStat.js"
import { EndCheck,   
musicanswerCheck,
guessmusic,
guessAvatarCheck,
guessAvatar,
starguessAvatar,
starguessAvatarCheck
} from "./Guess.js"
import{ yl总,
yl1,
yl2,
yl3,
yl4,
yl5,
yl6,
yl7,
yl8,
yl9,
yl10,
yl11,
yl12,
yl13,
yl14,
yl15,
yl16,
yl17,
yl18,
yl19,
yl20,
sm总, 
sm1,
sm2,
sm3,
sm4,
sm5,
sm6,
sm7,
sm8,
sm9,
sm10,
sm11,
sm12,
sm13,
sm14,
sm15,
sm16,
sm17,
sm18,
sm19,
sm20,
sm21,
sm22,
sm23,
} from "./XMmap.js"
import {
  changeBilibiliPush,
  changeGroupBilibiliPush,
  changeBiliPushPrivatePermission,
  bilibiliPushPermission,
  updateBilibiliPush,
  getBilibiliPushUserList,
  setBiliPushTimeInterval,
  setBiliPushCookie,
  setBiliPushFaultTime,
  changeBiliPushTransmit,
  setBiliPushSendType,
  pushScheduleJob,
} from "./bilibiliPush.js";
import { bilibilihelp, YZversionInfo } from "./bilibilihelp.js"
import { JsPlugins,
PluginsList,
WarehPluginsList,
RemovePlugins,
LoadPlugins,
DeletePlugins,
HelpMenu
} from "./pluginManager.js"
import { v3JsPlugins,
v3PluginsList,
v3WarehPluginsList,
v3RemovePlugins,
v3LoadPlugins,
v3DeletePlugins,
v3HelpMenu} from "./V3pluginManager.js"
import { miku,
 kt1,
jtm, 
mr,
ys,
bh3,
blhx,
wl,
fgo,
y7d,
sn,
gz,
se,
kt2,
小黑子
} from "./寄你太美.js"
import { examples } from "./群友强制休息.js"
import { qmp } from "./updatecard.js"

let apps = { character, poke, profile, stat, wiki, gacha, admin, help }
let rules = {} // v3
for (let key in apps) {
  rules[`${key}`] = apps[key].v3App()
}

let pushConfig = {};
async function initPushConfig() {
  if (fs.existsSync("./data/PushNews/BilibiliPushConfig.json")) {
    pushConfig = JSON.parse(fs.readFileSync("./data/PushNews/BilibiliPushConfig.json", "utf8"));
  }
}
initPushConfig();

// 定时任务
async function task() {
  let scheduleConfig = "0 5,9,15,19,45,59 * * * ?"; // 默认
  let timeInter = Number(pushConfig.dynamicPushTimeInterval);
  // 做好容错，防一手乱改配置文件
  if (!isNaN(timeInter)) {
    timeInter = Math.ceil(timeInter); // 确保一定是整数
    if (timeInter <= 0) timeInter = 1; // 确保一定大于等于 1

    scheduleConfig = `0 0/${timeInter} * * * ?`;
    if (timeInter >= 60) {
      scheduleConfig = `0 0 * * * ?`;
    }
  }

  // B站动态推送
  schedule.scheduleJob(scheduleConfig, () => pushScheduleJob());
}

task();

export { rules as apps }