import fs from "fs";
import schedule from "node-schedule";
import { App } from '#liulian'
import {	currentVersion } from "../components/Changelog.js";
import config from "../model/config/config.js"
import help from "./help.js"
import wjc from "./wjc.js"
import ai from "./ai.js"
import bz from "./Groupshutup.js"
import gb from "./transmit.js"
import ys from "./lucktendency.js"
import other from "./other.js"
import admin from "./admin.js"
import many from "./manyfunctions.js"
import 猫猫 from "./Cat.js"
import wife from "./whoismywife.js"
import dk from "./打卡.js"
import qa from "./Q&A.js"
import hitme from "./hitme.js"
import wz from "./伪造信息.js"
import fb from "./morbidity.js"
import bq from "./makeemoticons.js"
import sjbq from "./Random expression.js"
import hltj from "./chatterboxStat.js"
import guess from "./Guess.js"
import map from "./XMmap.js"
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
import v2gl from "./pluginManager.js"
import wjgl from "./V3pluginManager.js"
import jtm from "./寄你太美.js"
import qzxx from "./群友强制休息.js"
import qmp from "./updatecard.js"

let apps = { character, poke, profile, stat, wiki, gacha, admin, help, wjc, ai, bz, gb, ys, other, many, 猫猫,  wife, dk, qa, hitme, wz, fb, bq, sjbq, hltj, guess, map, changeBilibiliPush, changeGroupBilibiliPush, changeBiliPushPrivatePermission, bilibiliPushPermission, updateBilibiliPush, getBilibiliPushUserList, setBiliPushTimeInterval, setBiliPushCookie, setBiliPushFaultTime, changeBiliPushTransmit, setBiliPushSendType, v2gl, wjgl, jtm, qzxx, qmp }
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