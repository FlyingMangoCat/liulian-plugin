import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import schedule from "node-schedule";
import config from "../model/config/config.js"
import { Cfg } from '#liulian'
import { versionInfo, help } from "./help.js"
import { wjc } from "./wjc.js"
import { liulian_status } from './status.js';
import { replace } from "./replace.js"
import { toShutUp,
determineIfYouShutUp,
openYourMouth
 } from "./Groupshutup.js"
import { daihua,
guangbo,
guangboHelp
 } from "./transmit.js"
import { 运势 } from "./lucktendency.js"
import { maphelp, mapnumber } from "./maphelp.js"
import { count } from "./telemetry.js"

// 启动检测：复制安装（无 .git）提示改用 git 方式安装，才能获取更新修复
try {
  const pluginDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
  if (!fs.existsSync(path.join(pluginDir, ".git"))) {
    console.log([
      "[榴莲插件] 检测到当前为复制安装，无法自动获取更新修复。请按以下步骤转为 git 安装：",
      "[榴莲插件] 1. 停止机器人",
      "[榴莲插件] 2. 控制台进入云崽根目录（Yunzai 目录），依次执行：",
      "[榴莲插件]    mv plugins/liulian-plugin plugins/liulian-plugin.bak",
      "[榴莲插件]    git clone https://gitee.com/huifeidemangguomao/liulian-plugin.git plugins/liulian-plugin",
      "[榴莲插件] 3. 重启机器人，确认正常后可删除 plugins/liulian-plugin.bak"
    ].join("\n"))
  }
} catch (err) {}
import {	currentVersion } from "../components/Changelog.js";
import { pluginhelp } from "./pluginhelp.js"
import { tangyuanhelp } from "./tangyuanhelp.js"
import { render } from "../adapter/render.js"
import { ercyFUN,
chengfenFUN,
daanFUN,
qiuqianFUN } from "./other.js"
import { rule as adminRule,
updateRes,
sysCfg,
updateLiulianPlugin,
profileCfg,
cj
} from "./admin.js"
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
holiday,
eventHistory,
setu,
lp
} from "./manyfunctions.js"
import { 骚扰电话,
rule as phoneRule
} from "./phone.js"
import { sjclassic,
zdclassic,
 } from "./classic.js"
import { Robacat,
Loseacat,
Resetcat,
Bouncecat
} from "./Cat.js"
import { CeShi } from "./inoutgroup.js"
import { 哪个群友是我老婆 } from "./whoismywife.js"
import { checkIn } from "./checkIn.js"
import { randomQA, answerCheck } from "./Q&A.js"
import { HitMe } from "./hitme.js"
import { fakeMessage } from "./fakeMessage.js"
import { fabing } from "./morbidity.js"
import { biaoQing, biaoQingHelp } from "./makeemoticons.js"
import { random, chuochuo, 上传 } from "./Random expression.js"
import { FuckingChatterbox } from "./chatterboxStat.js"
import { fanyi, translateText, base64jiami, base64jiemi, wyyjx, wyyauto, qrcode } from "./tools.js"
import { dailyword, sentence, dailywordCheck, sentenceCheck } from "./daily.js"
import { hotSearch, subscribeKeyword, unsubscribeKeyword, viewSubscriptions, addGlobalBlockedKeyword, removeGlobalBlockedKeyword, viewGlobalBlockedKeywords, addGroupBlockedKeyword, removeGroupBlockedKeyword, viewGroupBlockedKeywords, viewApplications, approveApplication, rejectApplication, hotWordCloud, hotTrendChart, hotUpdate, enableHotPush, disableHotPush, setHotPushTime, setHotPushPlatform, getHotPushList, hotPushScheduleJob } from "./hot.js"
import { EndCheck,   
musicanswerCheck,
guessmusic,
guessAvatar,
guessAvatarCheck,
starguessAvatar,
starguessAvatarCheck,
zzzguessAvatar,
zzzguessAvatarCheck,
wwguessAvatar,
wwguessAvatarCheck,
nteguessAvatar,
nteguessAvatarCheck,
miyu,
miyuCheck,
guessRankCmd
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
setBiliPushFaultTime,
changeBiliPushTransmit,
setBiliPushSendType,
pushScheduleJob,
biliLogin,
refreshBiliPushList,
refreshAllBiliPushList,
checkBiliCookie,
} from "./bilibiliPush.js";
import { bilibilihelp, YZversionInfo } from "./bilibilihelp.js"
import { hothelp } from "./hothelp.js"
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
} from "./kun.js"
import { groupRest } from "./groupRest.js"
import { qmp } from "./updatecard.js"
import { memberBind, memberBindKey, memberStatus } from "./rankmember.js"

export {
    help,
    maphelp,
    pluginhelp,
    sysCfg,
    哪个群友是我老婆,
    checkIn,
    randomQA,
    answerCheck,
    updateLiulianPlugin,
    JsPlugins,
    PluginsList,
    WarehPluginsList,
    RemovePlugins,
    LoadPlugins,
    DeletePlugins,
    HelpMenu,
    v3JsPlugins,
    v3PluginsList,
    v3WarehPluginsList,
    v3RemovePlugins,
    v3LoadPlugins,
    v3DeletePlugins,
    v3HelpMenu,
    miku,
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
    versionInfo,
    yl总,
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
    fakeMessage,
    random,
    chuochuo,
    FuckingChatterbox,
    guessAvatar,
    guessAvatarCheck,
    zzzguessAvatar,
    zzzguessAvatarCheck,
    wwguessAvatar,
    wwguessAvatarCheck,
    nteguessAvatar,
    nteguessAvatarCheck,
    groupRest,
    godEyesFUN,
    headPortraitFUN,
    qmp,
    biaoQing,
    biaoQingHelp,
    fabing,
    lp,
    setu,
    dailyword,
    sentence,
    HitMe,
    CeShi,
    dutang,
    caihongpi,
    saylove,
    joke,
    早报,
    xzys,
    ercyFUN,
    chengfenFUN,
    daanFUN,
    qiuqianFUN,
    changeBilibiliPush,
    changeGroupBilibiliPush,
    changeBiliPushPrivatePermission,
    bilibiliPushPermission,
    updateBilibiliPush,
    getBilibiliPushUserList,
    setBiliPushTimeInterval,
    setBiliPushFaultTime,    changeBiliPushTransmit,
    setBiliPushSendType,
    pushScheduleJob,
    biliLogin,
    weather,
    dog,
    bilibilihelp,
    hothelp,
    YZversionInfo,
    EndCheck,   
    musicanswerCheck,
    guessmusic,
    运势,
    小黑子,
    updateRes,
    cj,
    Robacat,
    Loseacat,
    Resetcat,
    Bouncecat,
    mapnumber,
    上传,
    daihua,
    guangbo,
    guangboHelp,
    starguessAvatar,
    starguessAvatarCheck,
    toShutUp,
    determineIfYouShutUp,
    openYourMouth,
    replace,
    骚扰电话,
    sjclassic,
    zdclassic,
    liulian_status,
    guessRankCmd,
}

const cfg = config.getconfig('liulian', 'botname', 'config');
  const botname = cfg.botname

// AI 模块静态注册（对齐最初版本的形态）：规则始终注册，开关判定收进 ai() 函数内部
import { ai, ai_reset_memory } from './ai.js'
import * as chatState from '#liulian.chatState'

// 排名参数允许出现的字符（可夹在"猜角色"与"排名"前后，如 猜角色星铁全服周排名）
const rankParamChars = '原神星穹铁绝区零鸣潮异环全服本周月年日综合总榜分计前群聊zZwWnNhHsSrR\\d\\s*~%';

let rule = {

        help: {
        reg: "^#?(榴莲|留恋)(帮助|help)$",
        priority: 1,
        describe: "使用帮助",
    },
        maphelp: {
        reg: "^#?(地下地图帮助)$",
        priority: 1,
        describe: "地下地图使用帮助",
    },
        pluginhelp: {
        reg: "^#?(插件管理帮助)$",
        priority: 1,
        describe: "插件管理帮助",
    },
        tangyuanhelp: {
        reg: "^#?(汤圆帮助)$",
        priority: 1,
        describe: "汤圆帮助",
    },
        bilibilihelp: {
        reg: "^#?(B站|b站|小破站)推送帮助$",
        priority: 1,
        describe: "B站推送帮助",
    },
        hothelp: {
        reg: "^#?(热搜帮助)$",
        priority: 1,
        describe: "热搜帮助",
    },
        updateRes: {
        reg: '^#(榴莲|留恋)(更新图像|图像更新)$',
        priority: 1,
        describe: "更新素材",
    },
        cj: {
        reg: '^#(榴莲|留恋)(更新|安装)芒果插件$',
        priority: 1,
        describe: "更新素材",
    },
        sysCfg: {
        reg: "^#?(榴莲|留恋)设置(.*)$",
        priority: 1,
        describe: "设置",
    },
        versionInfo: {
        reg: '^#?(榴莲|留恋)版本$',
        priority: 1,
        describe: "版本介绍",
    },
        mapnumber: {
        reg: '^#?(原神地下地图编号)',
        priority: 10,
        describe: "介绍",
    },
        YZversionInfo: {
        reg: '^#?(猫崽|芒果猫版云崽|芒果崽|芒崽)?版本$',
        priority: 1,
        describe: "版本介绍",
    },
        哪个群友是我老婆: {
        reg: "^#*(拐群友|绑架群友|娶群友|娶老婆|拐卖人口|哪个群友是我老婆|抽管理|拐卖群友|绑架人口|拐走群友)$", //匹配消息正则，命令正则
        priority: 10,
        describe: "哪个群友是我老婆",
    },
        checkIn: {
        reg: "打卡$", //匹配消息正则，命令正则
        priority: 1000, //优先级，越小优先度越高
        describe: "打卡or点赞", //【命令】功能说明
    },
        randomQA: {
        reg: "^#?(榴莲|留恋|芒果)问答$", //匹配消息正则，命令正则
        priority: 50, //优先级，越小优先度越高
        describe: "【#竞猜】「派蒙的十万个为什么」题库", //【命令】功能说明
    },
        answerCheck: {
        reg: "^(?!#).*",
        priority: 5,
        log: false, // 全量监听规则，不打匹配日志避免刷屏
        describe: "",
    },
        memberBind: {
        reg: '^#?榴莲会员绑定$',
        priority: 5,
        describe: '【#管理】榴莲会员绑定（仅主人私信）'
    },
        memberStatus: {
        reg: '^#榴莲会员状态$',
        priority: 5,
        describe: '【#管理】榴莲会员状态查询'
    },
        memberBindKey: {
        reg: '[\\s\\S]*',
        priority: 0,
        log: false, // 全量监听规则，仅处理绑定等待态，不打匹配日志避免刷屏
        describe: ""
    },
        updateLiulianPlugin: {
        reg: '^#(榴莲|留恋)(强制)?更新',
        priority: 10,
        describe: '更新'
    },
    JsPlugins: {
        reg: "(.*)", // 全量接住文件消息，由 JsPlugins() 内部校验主人与文件类型
        priority: 450,
        log: false, // 全量监听规则，不打匹配日志避免刷屏
        describe: "生成js文件自动放到插件目录下面"
    },
    PluginsList: {
        reg: "^#v2插件列表$",
        priority: 4500,
        describe: "查看你安装的插件的列表",
    },
    WarehPluginsList: {
        reg: "^(#|井)*(v2仓库列表)$",
        priority: 4500,
        describe: "查看被停用的插件的列表",
    },
    RemovePlugins: {
        reg: "^(#|井)*(v2移除插件)(.*)$",
        priority: 4500,
        describe: "移除插件(插件名)",
    },
    LoadPlugins: {
        reg: "^(#|井)*(v2添加插件)(.*)$",
        priority: 4500,
        describe: "添加插件(插件名)",
    },
    DeletePlugins: {
        reg: "^(#|井)*(v2删除插件)(.*)$",
        priority: 4500,
        describe: "删除插件(插件名)",
    },
    HelpMenu: {
        reg: "^(#|井)*(v2插件管理帮助)(.*)$",
        priority: 4500,
        describe: "帮助菜单",
    },
    v3JsPlugins: {
        reg: "(.*)", // 全量接住文件消息，由 v3JsPlugins() 内部校验主人与文件类型
        priority: 450,
        log: false, // 全量监听规则，不打匹配日志避免刷屏
        describe: "生成js文件自动放到插件目录下面"
    },
    v3PluginsList: {
        reg: "插件列表$",
        priority: 4500,
        describe: "查看你安装的插件的列表",
    },
    v3WarehPluginsList: {
        reg: "仓库列表$",
        priority: 4500,
        describe: "查看被停用的插件的列表",
    },
    v3RemovePlugins: {
        reg: "移除插件(.*)$",
        priority: 4500,
        describe: "移除插件(插件名)",
    },
    v3LoadPlugins: {
        reg: "添加插件(.*)$",
        priority: 4500,
        describe: "添加插件(插件名)",
    },
    v3DeletePlugins: {
        reg: "删除插件(.*)$",
        priority: 4500,
        describe: "删除插件(插件名)",
    },
    v3HelpMenu: {
        reg: "插件管理帮助(.*)$",
        priority: 4500,
        describe: "帮助菜单",
    },
    miku: {
        reg: "^(miku|初音|初音未来|葱葱|MIKU)$", //匹配消息正则，命令正则
        priority: 3567, //优先级，越小优先度越高
        describe: "", //【命令】功能说明
    },
        kt1: {
        reg: "^#*看腿1", //匹配消息正则，命令正则
        priority: 3568, //优先级，越小优先度越高
        describe: "", //【命令】功能说明
    },
        jtm: {
        reg: "^((.*)鸡你太美(.*)|(.*)寄你太美(.*)|(.*)黑子(.*)|(.*)油饼(.*)|(.*)荔枝(.*)|(.*)鲲(.*)|(.*)鸽(.*)|(.*)坤(.*)|(.*)姬霓太美(.*))$", //匹配消息正则，命令正则
        priority: 3566, //优先级，越小优先度越高
        describe: "", //【命令】功能说明
    },
        mr: {
        reg: "^#明日方舟$", //匹配消息正则，命令正则
        priority: 3569, //优先级，越小优先度越高
        describe: "", //【命令】功能说明
    },
        ys: {
        reg: "^#原神$", //匹配消息正则，命令正则
        priority: 3570, //优先级，越小优先度越高
        describe: "", //【命令】功能说明
    },
        bh3: {
        reg: "^#崩坏3$", //匹配消息正则，命令正则
        priority: 3571, //优先级，越小优先度越高
        describe: "", //【命令】功能说明
    },
        blhx: {
        reg: "^#碧蓝航线", //匹配消息正则，命令正则
        priority: 3572, //优先级，越小优先度越高
        describe: "", //【命令】功能说明
    },
        wl: {
        reg: "^#蔚蓝档案$", //匹配消息正则，命令正则
        priority: 3573, //优先级，越小优先度越高
        describe: "", //【命令】功能说明
    },
        fgo: {
        reg: "^#FGO$", //匹配消息正则，命令正则
        priority: 3574, //优先级，越小优先度越高
        describe: "", //【命令】功能说明
    },
        y7d: {
        reg: "^#7d$", //匹配消息正则，命令正则
        priority: 3575, //优先级，越小优先度越高
        describe: "", //【命令】功能说明
    },

        sn: {
        reg: "^#少女前线$", //匹配消息正则，命令正则
        priority: 3575, //优先级，越小优先度越高
        describe: "", //【命令】功能说明
    },
        gz: {
        reg: "^#公主连结$", //匹配消息正则，命令正则
        priority: 3575, //优先级，越小优先度越高
        describe: "", //【命令】功能说明
    },

        se: {
        reg: "^#涩涩一下$", //匹配消息正则，命令正则
        priority: 1000, //优先级，越小优先度越高
        describe: "", //【命令】功能说明
    },
        kt2: {
        reg: "^#看腿2$", //匹配消息正则，命令正则
        priority: 1000, //优先级，越小优先度越高
        describe: "", //【命令】功能说明
    }, 
        yl总: {
        reg: "地下地图100101", //匹配消息正则，命令正则
        priority: 350, //优先级，越小优先度越高
       describe: "", 
    },
        yl1: {
        reg: "地下地图100102", //匹配消息正则，命令正则
        priority: 350, //优先级，越小优先度越高
        describe: "", 
    },
        yl2: {
        reg: "地下地图100103", //匹配消息正则，命令正则
        priority: 305, //优先级，越小优先度越高
        describe: "", 
     },
        yl3: {
        reg: "地下地图100104", //匹配消息正则，命令正则
        priority: 350, //优先级，越小优先度越高
        describe: "", 
     },
        yl4: {
        reg: "地下地图100105", //匹配消息正则，命令正则
        priority: 350, //优先级，越小优先度越高
        describe: "", 
     },
        yl5: {
        reg: "地下地图100106", //匹配消息正则，命令正则
        priority: 350, //优先级，越小优先度越高
        describe: "", 
      },
        yl6: {
        reg: "地下地图100107", //匹配消息正则，命令正则
        priority: 350, //优先级，越小优先度越高
        describe: "", 
      },
        yl7: {
        reg: "地下地图100108", //匹配消息正则，命令正则
        priority: 305, //优先级，越小优先度越高
        describe: "", 
      },
        yl8: {
        reg: "地下地图100109", //匹配消息正则，命令正则
        priority: 305, //优先级，越小优先度越高
        describe: "", 
      },
        yl9: {
        reg: "地下地图100110", //匹配消息正则，命令正则
        priority: 305, //优先级，越小优先度越高
        describe: "", 
      },
        yl10: {
        reg: "地下地图100111", //匹配消息正则，命令正则
        priority: 300, //优先级，越小优先度越高
        describe: "", 
      },
        yl11: {
        reg: "地下地图100112", //匹配消息正则，命令正则
        priority: 300, //优先级，越小优先度越高
        describe: "", 
      },
        yl12: {
        reg: "地下地图100113", //匹配消息正则，命令正则
        priority: 300, //优先级，越小优先度越高
        describe: "", 
      },
        yl13: {
        reg: "地下地图100114", //匹配消息正则，命令正则
        priority: 300, //优先级，越小优先度越高
        describe: "", 
      },
        yl14: {
        reg: "地下地图100115", //匹配消息正则，命令正则
        priority: 300, //优先级，越小优先度越高
        describe: "", 
  },
  yl15: {
    reg: "地下地图100116", //匹配消息正则，命令正则
    priority: 300, //优先级，越小优先度越高
    describe: "", 
  },
  yl16: {
    reg: "地下地图100117", //匹配消息正则，命令正则
    priority: 300, //优先级，越小优先度越高
    describe: "", 
  },
  yl17: {
    reg: "地下地图100118", //匹配消息正则，命令正则
    priority: 300, //优先级，越小优先度越高
    describe: "", 
  },
  yl18: {
    reg: "地下地图100119", //匹配消息正则，命令正则
    priority: 300, //优先级，越小优先度越高
    describe: "", 
  },
  yl19: {
    reg: "地下地图100120", //匹配消息正则，命令正则
    priority: 300, //优先级，越小优先度越高
    describe: "", 
  },
yl21: {
    reg: "地下地图100122", //匹配消息正则，命令正则
    priority: 300, //优先级，越小优先度越高
    describe: "", 
  },
  yl22: {
    reg: "地下地图100123", //匹配消息正则，命令正则
    priority: 300, //优先级，越小优先度越高
    describe: "", 
  },
  yl23: {
    reg: "地下地图100124", //匹配消息正则，命令正则
    priority: 300, //优先级，越小优先度越高
    describe: "", 
  },
  yl24: {
    reg: "地下地图100125", //匹配消息正则，命令正则
    priority: 300, //优先级，越小优先度越高
    describe: "", 
  },
  sm总: {
    reg: "地下地图100201", //匹配消息正则，命令正则
    priority: 350, //优先级，越小优先度越高
    describe: "", 
  },
    sm1: {
    reg: "地下地图100202", //匹配消息正则，命令正则
    priority: 305, //优先级，越小优先度越高
    describe: "", 
  },
    sm2: {
    reg: "地下地图100203", //匹配消息正则，命令正则
    priority: 350, //优先级，越小优先度越高
    describe: "", 
  },
    sm3: {
    reg: "地下地图100204", //匹配消息正则，命令正则
    priority: 350, //优先级，越小优先度越高
    describe: "", 
  },
    sm4: {
    reg: "地下地图100205", //匹配消息正则，命令正则
    priority: 350, //优先级，越小优先度越高
    describe: "", 
  },
    sm5: {
    reg: "地下地图100206", //匹配消息正则，命令正则
    priority: 350, //优先级，越小优先度越高
    describe: "", 
  },
    sm6: {
    reg: "地下地图100207", //匹配消息正则，命令正则
    priority: 350, //优先级，越小优先度越高
    describe: "", 
  },
    sm7: {
    reg: "地下地图100208", //匹配消息正则，命令正则
    priority: 350, //优先级，越小优先度越高
    describe: "", 
  },
    sm8: {
    reg: "地下地图100209", //匹配消息正则，命令正则
    priority: 305, //优先级，越小优先度越高
    describe: "", 
  },
    sm9: {
    reg: "地下地图100301", //匹配消息正则，命令正则
    priority: 305, //优先级，越小优先度越高
    describe: "", 
  },
    sm10: {
    reg: "地下地图100302", //匹配消息正则，命令正则
    priority: 305, //优先级，越小优先度越高
    describe: "", 
  },
    sm11: {
    reg: "地下地图100303", //匹配消息正则，命令正则
    priority: 305, //优先级，越小优先度越高
    describe: "", 
  },
    sm12: {
    reg: "地下地图100304", //匹配消息正则，命令正则
    priority: 305, //优先级，越小优先度越高
    describe: "", 
  },
    sm13: {
    reg: "地下地图100305", //匹配消息正则，命令正则
    priority: 305, //优先级，越小优先度越高
    describe: "", 
  },
    sm14: {
    reg: "地下地图100306", //匹配消息正则，命令正则
    priority: 305, //优先级，越小优先度越高
    describe: "", 
  },
    sm15: {
    reg: "地下地图100307", //匹配消息正则，命令正则
    priority: 305, //优先级，越小优先度越高
    describe: "", 
  },
    sm16: {
    reg: "地下地图100308", //匹配消息正则，命令正则
    priority: 305, //优先级，越小优先度越高
    describe: "", 
  },
    sm17: {
    reg: "地下地图100309", //匹配消息正则，命令正则
    priority: 305, //优先级，越小优先度越高
    describe: "", 
  },
    sm18: {
    reg: "地下地图100310", //匹配消息正则，命令正则
    priority: 305, //优先级，越小优先度越高
    describe: "", 
  },
    sm19: {
    reg: "地下地图100311", //匹配消息正则，命令正则
    priority: 305, //优先级，越小优先度越高
    describe: "", 
  },
    sm20: {
    reg: "地下地图100312", //匹配消息正则，命令正则
    priority: 305, //优先级，越小优先度越高
    describe: "", 
  },
    sm21: {
    reg: "地下地图100313", //匹配消息正则，命令正则
    priority: 305, //优先级，越小优先度越高
    describe: "", 
  },
    sm22: {
    reg: "地下地图100314", //匹配消息正则，命令正则
    priority: 305, //优先级，越小优先度越高
    describe: "", 
  },
    sm23: {
    reg: "地下地图100315", //匹配消息正则，命令正则
    priority: 305, //优先级，越小优先度越高
    describe: "", 
  },
    sm24: {
    reg: "地下地图100401", //匹配消息正则，命令正则
    priority: 305, //优先级，越小优先度越高
    describe: "", 
  },
    sm25: {
    reg: "地下地图100402", //匹配消息正则，命令正则
    priority: 305, //优先级，越小优先度越高
    describe: "", 
  },
    sm26: {
    reg: "地下地图100403", //匹配消息正则，命令正则
    priority: 305, //优先级，越小优先度越高
    describe: "", 
  },
    sm27: {
    reg: "地下地图100404", //匹配消息正则，命令正则
    priority: 350, //优先级，越小优先度越高
    describe: "", 
  },
    sm28: {
    reg: "地下地图100405", //匹配消息正则，命令正则
    priority: 305, //优先级，越小优先度越高
    describe: "", 
  },
    sm29: {
    reg: "地下地图100406", //匹配消息正则，命令正则
    priority: 305, //优先级，越小优先度越高
    describe: "", 
  },
    sm30: {
    reg: "地下地图100407", //匹配消息正则，命令正则
    priority: 305, //优先级，越小优先度越高
    describe: "", 
  },
    sm31: {
    reg: "地下地图100408", //匹配消息正则，命令正则
    priority: 305, //优先级，越小优先度越高
    describe: "", 
  },
        fakeMessage: {
        reg: "^#(伪造信息|伪造消息).*$", //匹配消息正则，命令正则
        priority: 50, //优先级，越小优先度越高
        describe: "【#伪造信息@群成员 信息】", 
    },
        random: {
        reg: "(.*)", // 匹配所有消息，由 random() 函数内部按概率自过滤
        priority: 114514,
        log: false, // 全量监听规则，不打匹配日志避免刷屏
        describe: "概率随机发送表情包",  //聊天中概率回复表情包
    },
        chuochuo: {
        reg: "戳䔱戳",
        priority: 30000,
        describe: "",
    },
        FuckingChatterbox: {
        reg: "^#*(话痨统计|话痨检测|水逼检测|水逼统计)$", 
        priority: 600,
        describe: "寻找大水逼",
    },
        guessRankCmd: {
        reg: '^[#*~%]?[' + rankParamChars + ']{0,15}猜角色[' + rankParamChars + ']{0,15}排名[\\s\\S]*$',
        priority: 5, // 需先于各猜角色入口规则，避免"排名"被当成答题
        describe: '猜角色排名，如 #猜角色星铁全服周排名 / #猜角色排名星铁 全服 周',
    },
        guessAvatar: {
        reg: '^#猜(头像|角色)(普通|困难|地狱|炼狱)?(模式)?',
        priority: 10,
        describe: '#猜头像、#猜角色、#猜角色困难模式',
    },
        guessAvatarCheck: {
        reg: "^[#*~%]?我猜(.*)",
        priority: 98,
        describe: ''
    },
        starguessAvatar: {
        reg: '^(?:\\*|星铁|#星铁|(?=.*星铁))猜角色(?:星铁)?(?:普通|困难|地狱)?(?:模式)?',
        priority: 10,
        describe: '猜星铁角色',
    },
        starguessAvatarCheck: {
        reg: "^[#*~%]?我猜(.*)",
        priority: 98,
        describe: ''
    },
        zzzguessAvatar: {
        reg: '^(?:绝区零|%|[Zz][Zz][Zz]|#绝区零|#[Zz][Zz][Zz]|%绝区零|(?=.*(?:绝区零|[Zz][Zz][Zz]|%)))猜角色(?:ZZZ|绝区零)?(?:普通|困难|地狱)?(?:模式)?',
        priority: 99,
        describe: '猜ZZZ角色',
    },
        zzzguessAvatarCheck: {
        reg: "^[#*~%]?我猜(.*)",
        priority: 98,
        describe: ''
    },
        wwguessAvatar: {
        reg: '^(?:鸣潮|~|ww|#鸣潮|#ww|(?=.*(?:鸣潮|ww)))猜角色(?:鸣潮)?(?:普通|困难|地狱|炼狱)?(?:模式)?|^#猜角色(?:鸣潮|ww|~)(?:普通|困难|地狱|炼狱)?(?:模式)?$',
        priority: 10,
        describe: '猜鸣潮角色',
    },
        wwguessAvatarCheck: {
        reg: "^[#*~%]?我猜(.*)",
        priority: 98,
        describe: ''
    },
        nteguessAvatar: {
        reg: '^(?:异环|nte|#异环|#nte)猜角色(?:异环)?(?:普通|困难|地狱|炼狱)?(?:模式)?|^#猜角色(?:异环|nte)(?:普通|困难|地狱|炼狱)?(?:模式)?$',
        priority: 10,
        describe: '猜异环角色',
    },
        nteguessAvatarCheck: {
        reg: "^[#*~%]?我猜(.*)",
        priority: 98,
        describe: ''
    },
       groupRest: {
       reg: "^#?我要休息[\s\S]*", //匹配消息正则，命令正则
       priority: 750, //优先级，越小优先度越高
       describe: "#我要休息XX分钟 || 天 || 小时", //【命令】功能说明
    },
       godEyesFUN: {
       reg: "^#*神之眼(.*)$",
       priority: 500,
       describe: "【神之眼@xxx】看看ta的神之眼", 
    },
       headPortraitFUN: {
       reg: "^#*看头像(.*)$",
       priority: 5000,
       describe: "【头像@xxx】看看头像大图", 
    },
       qmp : {
       reg : "#更新群名片$",
       priority: 10,
       describe : "",
    },
       biaoQing: {
       reg: "(.*)", //全量接住，关键词在函数内匹配，不命中静默返回
       priority: 10, //优先级，越小优先度越高
       log: false, //函数内自过滤，框架不打匹配日志
       describe: "头像表情包", //【命令】功能说明
    },
       biaoQingHelp: {
       reg: "#*表情帮助$", //匹配消息正则，命令正则
       priority: 100, //优先级，越小优先度越高
       describe: "表情帮助", //【命令】功能说明
    },
       fabing: {
       reg: "^#?发病(.*)$", //匹配消息正则，命令正则
       priority: 50, //优先级，越小优先度越高
       describe: "",
    },
       setu: {
     		reg: "^#(抽|今日)色图$", //匹配消息正则，命令正则
	     	priority: 4000, //优先级，越小优先度越高
	     	describe: "【#例子】开发简单示例演示", //【命令】功能说明
   	},
      	lp: {
	     	reg: "^#(抽|今日)老婆$", //匹配消息正则，命令正则
	     	priority: 4000, //优先级，越小优先度越高
		     describe: "【#例子】开发简单示例演示", //【命令】功能说明
   	},
       dailyword: {
       reg: "^[^-]*(每日句子|english|句子)$", //匹配消息正则，命令正则
       priority: 1000, //优先级，越小优先度越高
       describe: "每日句子", //【命令】功能说明
    },
       sentence: {
       reg: "^[^-]*(每日单词|word|单词)$", //匹配消息正则，命令正则
       priority: 1000, //优先级，越小优先度越高
       describe: "每日单词", //【命令】功能说明
    },
       dailywordCheck: {
       reg: "(.*)",
       priority: 999,
       log: false, // 全量监听规则，不打匹配日志避免刷屏
       describe: "",
    },
       sentenceCheck: {
       reg: "(.*)",
       priority: 999,
       log: false, // 全量监听规则，不打匹配日志避免刷屏
       describe: "",
    },
       hotSearch: {
       reg: "^#*(热搜|热搜榜|热点)(.*)$|^#*(.+)热搜$",
       priority: 495,
       describe: "全网热搜榜",
    },
       subscribeKeyword: {
       reg: "^#*(热搜订阅|订阅关键词|添加订阅)(.*)$",
       priority: 500,
       describe: "订阅关键词",
    },
       unsubscribeKeyword: {
       reg: "^#*(热搜取消订阅|取消订阅|删除订阅)(.*)$",
       priority: 500,
       describe: "取消订阅",
    },
       viewSubscriptions: {
       reg: "^#*(热搜查看订阅|查看订阅|我的订阅|订阅列表)$",
       priority: 500,
       describe: "查看订阅",
    },
       addGlobalBlockedKeyword: {
       reg: "^#*添加全局屏蔽词(.*)$",
       priority: 1,
       describe: "添加全局屏蔽词",
    },
       removeGlobalBlockedKeyword: {
       reg: "^#*删除全局屏蔽词(.*)$",
       priority: 1,
       describe: "删除全局屏蔽词",
    },
       viewGlobalBlockedKeywords: {
       reg: "^#*查看全局屏蔽词$",
       priority: 1,
       describe: "查看全局屏蔽词",
    },
       addGroupBlockedKeyword: {
       reg: "^#*添加群屏蔽词(.*)$",
       priority: 500,
       describe: "添加群屏蔽词",
    },
       removeGroupBlockedKeyword: {
       reg: "^#*删除群屏蔽词(.*)$",
       priority: 500,
       describe: "删除群屏蔽词",
    },
       viewGroupBlockedKeywords: {
       reg: "^#*(查看屏蔽词|群屏蔽词)$",
       priority: 500,
       describe: "查看群屏蔽词",
    },
       viewApplications: {
       reg: "^#*查看订阅申请$",
       priority: 1,
       describe: "查看订阅申请",
    },
       approveApplication: {
       reg: "^#*通过订阅申请\\s*(\\d+)\\s*(.*)$",
       priority: 1,
       describe: "通过订阅申请",
    },
       rejectApplication: {
       reg: "^#*拒绝订阅申请\\s*(\\d+)\\s*(.*)$",
       priority: 1,
       describe: "拒绝订阅申请",
    },
       hotWordCloud: {
       reg: "^#*热搜词云(.*)$",
       priority: 500,
       describe: "生成热搜词云图",
    },
       hotTrendChart: {
       reg: "^#*热搜趋势(.*)$",
       priority: 500,
       describe: "生成热搜趋势图",
    },
       enableHotPush: {
       reg: "^#*开启热搜推送$",
       priority: 500,
       describe: "开启定时推送",
    },
       disableHotPush: {
       reg: "^#*关闭热搜推送$",
       priority: 500,
       describe: "关闭定时推送",
    },
       setHotPushTime: {
       reg: "^#*设置热搜推送时间(.*)$",
       priority: 500,
       describe: "设置推送时间",
    },
       setHotPushPlatform: {
       reg: "^#*设置热搜推送平台(.*)$",
       priority: 500,
       describe: "设置推送平台",
    },
       getHotPushList: {
       reg: "^#*热搜推送列表$",
       priority: 500,
       describe: "查看推送配置",
    },
       hotPushScheduleJob: {
       reg: "^#*测试热搜推送$",
       priority: 500,
       describe: "测试热搜推送",
    },
       HitMe: {
       reg: "#打我", //匹配消息正则，命令正则
       priority: 1000, //优先级，越小优先度越高
       describe: "【#禁言自己1-10次】", //【命令】功能说明
    },
       CeShi: {
     		reg: "", //不通过正则匹配
    		priority: 5000, //优先级，越小优先度越高
     		describe: '检测进群退群消息', //【命令】功能说明
   	},
       dutang: {
       reg: "^[^-]*毒鸡汤$", //匹配消息正则，命令正则
       priority: 1000, //优先级，越小优先度越高
       describe: "毒鸡汤", //【命令】功能说明
    },
       caihongpi: {
       reg: "^[^-]*(彩虹屁|夸夸我)$", //匹配消息正则，命令正则
       priority: 1000, //优先级，越小优先度越高
       describe: "彩虹屁", //【命令】功能说明
    },
       saylove: {
       reg: "^[^-]*(土味情话|土味|情话)$", //匹配消息正则，命令正则
       priority: 1000, //优先级，越小优先度越高
       describe: "土味情话", //【命令】功能说明
    },
       joke: {
       reg: "^[^-]*(讲个笑话|讲笑话|来个笑话)$", 
       priority: 1000, //优先级，越小优先度越高
       describe: "笑话", //【命令】功能说明
    },
       早报: {
       reg: "^#*(早报|新闻)$", //匹配消息正则，命令正则
       priority: 100, //优先级，越小优先度越高
       describe: "【#例子】开发简单示例演示", //【命令】功能说明
    },
       xzys: {
       reg: "^#?.*座运势$", //匹配消息正则，命令正则
       priority: 500, //优先级，越小优先度越高
       describe: "【水瓶运势】开发简单示例演示", //【命令】功能说明
    },
       ercyFUN: {
       reg: "^#*二次元的我$", 
       priority: 500, 
       describe: "【#二次元的我】查看我的二次元属性", 
    },
       chengfenFUN: {
       reg: "^#*我的成分$", 
       priority: 500, 
       describe: "查看你是由什么组成的",
    },
       daanFUN: {
       reg: "^#*答案之书(.*)$", 
       priority: 5000,
       describe: "答案之书会告诉你答案", 
    },   
       qiuqianFUN: {
       reg: "^#*观音灵签$",
       priority: 300,
       describe: "看看今天的运势",
    },
       dog: {
       reg: "^#舔狗日记$", //匹配消息正则，命令正则
       priority: 100, //优先级，越小优先度越高
       describe: "setu", //【命令】功能说明
    },
       holiday: {
       reg: "^#(\\d{4})?(节假日|假期)$", //匹配消息正则，命令正则
       priority: 100, //优先级，越小优先度越高
       describe: "节假日查询", //【命令】功能说明
    },
       eventHistory: {
       reg: "^#*历史上的今天$", //匹配消息正则，命令正则
       priority: 100, //优先级，越小优先度越高
       describe: "历史上的今天", //【命令】功能说明
    },
       miyu: {
       reg: "^#*猜谜语$", //匹配消息正则，命令正则
       priority: 100, //优先级，越小优先度越高
       describe: "猜谜语", //【命令】功能说明
    },
       miyuCheck: {
       reg: "(.*)",
       priority: 99,
       log: false, // 全量监听规则，不打匹配日志避免刷屏
       describe: "",
    },
       fanyi: {
       reg: "^#*翻译(.*)$",
       priority: 100,
       describe: "翻译功能",
    },
       骚扰电话: {
       reg: "^#*(骚扰电话|查电话)(.*)$",
       priority: 100,
       describe: "骚扰电话查询",
    },
       weather: {
       reg: "^#(.*)(天气)$", //匹配消息正则，命令正则
       priority: 100, //优先级，越小优先度越高
       describe: "天气预报", //【命令】功能说明
    },
       changeBilibiliPush: {
       reg: "^#*(开启|关闭)B站推送$",
       priority: 500,
       describe: "开启或关闭B站推送，默认推送原神动态",
    },
       updateBilibiliPush: {
       reg: "^#*(订阅|增加|新增|移除|去除|取消)B站推送\\s*.*$",
       priority: 500,
       describe: "添加或删除B站推送UID",
    },
       getBilibiliPushUserList: {
       reg: "^#*B站推送(群)?列表$",
       priority: 500,
       describe: "返回当前聊天对象推送的B站用户列表",
    },
       changeGroupBilibiliPush: {
       reg: "^#*(开启|关闭|允许|禁止)群B站推送\\s*.*$",
       priority: 500,
       describe: "",
  },
       changeBiliPushPrivatePermission: {
       reg: "^#*(允许|禁止)B站私聊推送$",
       priority: 500,
       describe: "慎用！允许/禁止私聊的方式使用B站推送功能",
  },
       bilibiliPushPermission: {
       reg: "^#*(开启|关闭)B站推送群权限\\s*.*$",
       priority: 500,
       describe: "在任意地方给任意群聊开启/关闭狗管理使用B站推送功能的权限",
  },
       setBiliPushTimeInterval: {
       reg: "^#*B站推送时间\\s*\\d+$",
       priority: 500,
       describe: "设置B站推送的定时任务间隔时间",
  },
       setBiliPushFaultTime: {
       reg: "^#*B站推送过期时间\\s*\\d+$",
       priority: 500,
       describe: "设置B站推送的的过期时间，防止被叔叔夹了导致动态发布时间和实际不符而漏推",
  },
       changeBiliPushTransmit: {
       reg: "^#*(开启|关闭)B站转发推送$",
       priority: 500,
       describe: "默认不推送类型为转发的B站动态的",
  },
       setBiliPushSendType: {
       reg: "^#*设置(全局)?B站推送(默认|合并|图片)$",
       priority: 500,
       describe: "设置B站推送发送类型为：默认（文字+图片+链接）、合并（合并消息转发）、图片（就是图片）",
  },
       pushScheduleJob: {
       reg: "^#*测试B站推送$",
       priority: 500,
       describe: "",
  },
       biliLogin: {
       reg: "^#*B站扫码登录$",
       priority: -100,
       describe: "B站扫码登录获取Cookie",
  },
       refreshBiliPushList: {
       reg: "^#*刷新B站推送列表$",
       priority: 500,
       describe: "刷新B站推送列表，同步最新的默认用户",
  },
       refreshAllBiliPushList: {
       reg: "^#*刷新全部B站推送列表$",
       priority: 500,
       describe: "刷新全部群的B站推送列表，同步最新的默认用户",
  },
       checkBiliCookie: {
       reg: "^#*检查B站Cookie$",
       priority: 500,
       describe: "检查当前Cookie状态",
  },
       guessmusic: {
       reg: "^#?猜歌名$", //匹配消息正则，命令正则
       priority: 100, //优先级，越小优先度越高
       describe: "【猜歌名】", //【命令】功能说明
    },
       musicanswerCheck: {
       reg: "(.*)",
       priority: 1000,
       log: false, // 全量监听规则，不打匹配日志避免刷屏
       describe: "",
  },
       EndCheck: {
       reg: "^(结束猜歌名|投降)$",
       priority: 900,
       describe: "",
  },
       base64jiami: {
       reg: "^#*base64加密(.*)$",
       priority: 100,
       describe: "base64编码",
    },
       base64jiemi: {
       reg: "^#*base64解密(.*)$",
       priority: 100,
       describe: "base64解码",
    },
       wyyjx: {
       reg: "^#*网易云解析(.*)$",
       priority: 100,
       describe: "网易云歌曲解析",
    },
       wyyauto: {
       reg: "music.163.com.*id=",
       priority: 50,
       describe: "网易云链接自动解析",
    },
       qrcode: {
       reg: "^#*二维码(.*)$",
       priority: 100,
       describe: "二维码生成",
    },
       wjc: {
      reg: "(傻逼|淦|你妈|卧槽|woc)", //在此处添加违禁词，用"|"隔开
       priority: 100, //优先级，越小优先度越高
       describe: "违禁词", //【命令】功能说明
    },
       运势: {
       reg: "(运势|今日运势)$",
       priority: 1000,
       describe: "",
    },
       小黑子: {
       reg: "^#?上传(真爱粉|black)(图|图片)$", 
       priority: 1000, //优先级，越小优先度越高
       describe: "", //【命令】功能说明
    },
       Robacat: {
       reg: "^#*抱走猫猫$",
       priority: 999,
       describe: "【#抱走猫猫】抱走一只猫猫",
  },
       Loseacat: {
       reg: "^#*猫猫突袭(.*)$",
       priority: 999,
       describe: "【#猫猫突袭@一个人】向一个人丢出一只猫猫",
  },
      Resetcat: {
      reg: "^#*重置猫猫$",
      priority: 999,
      describe: "【#重置猫猫】重置今日可抢的猫猫数量",
  },
      Bouncecat: {
      reg: "^#*猫猫反弹$",
      priority: 999,
      describe: "【#设置猫猫反弹】设置今日不被猫猫袭击",
  },
       上传: {
       reg: "^#?上传(随机表情|表情包)$",
       priority: 100,
       describe: "",
    },
    daihua: {
		reg: "^带话(.*)$", //匹配消息正则，命令正则
		priority: 400, //优先级，越小优先度越高
		describe: "群友给机器人主人带话", //【命令】功能说明
  	},
 	guangbo: {
		reg: "^#广播(.*)内容(.*)$", //匹配消息正则，命令正则
		priority: 400, //优先级，越小优先度越高
		describe: "机器人在指定群说指定内容", //【命令】功能说明
  	},
        guangboHelp: {
		reg: "^#(广播|群广播)帮助$", //匹配消息正则，命令正则
		priority: 401, //优先级，越小优先度越高
		describe: "群广播使用帮助", //【命令】功能说明
  	},
    toShutUp: {
    reg: "#(闭嘴|自爆)$", //匹配消息正则，命令正则
    priority: 1000, //优先级，越小优先度越高
    describe: "群聊闭嘴", //【命令】功能说明
    },
    determineIfYouShutUp: {
    reg: "(.*)", //匹配消息正则，命令正则
    priority: 0, //优先级，越小优先度越高
    log: false, // 全量监听规则，不打匹配日志避免刷屏
    describe: "闭嘴判断", //【命令】功能说明
    },
    openYourMouth: {
    reg: "#(张嘴|色色|复活)$", //匹配消息正则，命令正则
    priority: 100, //优先级，越小优先度越高
    describe: "群聊张嘴", //【命令】功能说明
    },
    replace: {
    reg: "^\\/(.*)", //只匹配开头是/的消息，避免中间含/的消息误触发
    priority: -10,
    describe: "",
    },
    sjclassic: {
    reg: "#?(来点|整点|搞点|随机|看看|来一张)(经典|小怪话|怪话|逆天|逆天语录|经典语录|乐子|杂图)$", //匹配消息正则，命令正则
    priority: 100, //优先级，越小优先度越高
    describe: "经典发言", //【命令】功能说明
    },
    zdclassic: {
    reg: "#?(来点|整点|搞点|随机|看看|来一张)(.*)$", //匹配消息正则，命令正则
    priority: 100, //优先级，越小优先度越高
    describe: "经典发言", //【命令】功能说明
    },
    liulian_status: {
    reg: "^#榴莲状态$",
    priority: 1,
    describe: "查看榴莲插件状态"
    },
};

// AI 全量消息收录器 + 回复规则（静态注册，对齐最初版本形态；开关判定收进 ai() 内部门禁）
{
  // 全量消息收录器：reg 为空 + check 字段 → 通过 accept 机制对每条消息触发，
  // 只收录不消费（永远返回 false），不影响其他插件处理
  rule.ai_record = {
    reg: "",
    check: (e) => {
      try { chatState.record(e); } catch (err) { console.error('[榴莲AI] 收录失败:', err.message); }
      return false;
    },
    describe: "AI消息收录（不可调用）"
  };
  rule.ai = {
    reg: "(.*)", // 匹配所有消息
    priority: 99999, // 极低优先级，确保所有其他指令优先处理
    log: false, // 全量监听规则，不打匹配日志避免刷屏
    describe: "AI自动回复", // 功能说明
  };
  rule.ai_reset_memory = {
    reg: "^#榴莲重置记忆\\s*@?(\\d+)", // 匹配 #榴莲重置记忆@123456 或 #榴莲重置记忆 123456
    priority: 99, // 高优先级
    describe: "重置用户记忆（管理员功能）"
  };
}

// lodash.forEach(rule, (r) => {
//     r.priority = r.priority || 50;
//     r.prehash = true;
//     r.hashMark = true;
//   });

let pushConfig = {};
async function initPushConfig() {
  if (fs.existsSync("./data/PushNews/BilibiliPushConfig.json")) {
    pushConfig = JSON.parse(fs.readFileSync("./data/PushNews/BilibiliPushConfig.json", "utf8"));
  }
}
initPushConfig();

// 自适应B站推送间隔时间配置（分钟）
let adaptivePushConfig = {
  minInterval: 3,   // 最小间隔3分钟（无新动态时）
  maxInterval: 30,  // 最大间隔30分钟（有新动态时）
  defaultInterval: 10 // 默认间隔10分钟
};

// 自适应B站推送定时任务（使用递归setTimeout实现动态间隔）
let biliPushScheduleTimer = null;

async function adaptiveBiliPushSchedule() {
  try {
    // 记录开始时间
    const startTime = Date.now();
    Bot.logger?.mark(`[liulian-plugin]B站推送：开始执行自适应推送任务`);
    
    // 执行推送任务，获取结果
    const result = await pushScheduleJob();
    
    // 计算执行耗时（分钟）
    const executionTime = Math.ceil((Date.now() - startTime) / 1000 / 60);
    
    // 根据是否有新动态，决定下一次的间隔时间（完全随机）
    let nextInterval;
    if (result && result.hasNewDynamic) {
      // 有新动态，间隔较长，范围15-30分钟
      nextInterval = 15 + Math.floor(Math.random() * 16); // 15-30分钟
    } else {
      // 无新动态，间隔较短，范围3-12分钟
      nextInterval = 3 + Math.floor(Math.random() * 10); // 3-12分钟
    }
    
    // 执行时间不能超过间隔时间，避免立即执行
    if (executionTime >= nextInterval) {
      nextInterval = executionTime + 1; // 至少间隔1分钟
    }
    
    Bot.logger?.mark(`[liulian-plugin]B站推送：上一轮执行耗时${executionTime}分钟，${result && result.hasNewDynamic ? '有新动态' : '无新动态'}，下次间隔${nextInterval}分钟`);
    
    // 清除旧的定时器
    if (biliPushScheduleTimer) {
      clearTimeout(biliPushScheduleTimer);
    }
    
    // 设置下一次执行（添加随机秒数偏移，避免整点触发）
    const randomSeconds = Math.floor(Math.random() * 60); // 0-59秒随机偏移
    const nextDelay = nextInterval * 60 * 1000 + randomSeconds * 1000;
    biliPushScheduleTimer = setTimeout(adaptiveBiliPushSchedule, nextDelay);
    
  } catch (err) {
    Bot.logger?.error(`[liulian-plugin]B站推送：自适应定时任务异常: ${err.message}`);
    // 发生异常，使用随机间隔重试（5-15分钟）
    if (biliPushScheduleTimer) {
      clearTimeout(biliPushScheduleTimer);
    }
    const randomRetryInterval = 5 + Math.floor(Math.random() * 11); // 5-15分钟
    biliPushScheduleTimer = setTimeout(adaptiveBiliPushSchedule, randomRetryInterval * 60 * 1000);
  }
}

// 定时任务
async function task() {
  // B站动态推送 - 使用自适应间隔
  adaptiveBiliPushSchedule();
  
  // 热搜推送（每小时检查一次，使用随机秒数）
  const hotSearchRandomSecond = Math.floor(Math.random() * 60);
  schedule.scheduleJob(`${hotSearchRandomSecond} * * * *`, () => hotPushScheduleJob());
}

task();

// V3支持：将rule对象转换为V3插件类
import plugin from '../adapter/lib/plugin.js'

class LiulianV3 extends plugin {
  constructor() {
    let rules = []
    let checkList = []
    
    // 将rule对象转换为V3规则数组，跳过空字符串正则的规则
    for (let key in rule) {
      let cfg = rule[key]
      // 跳过使用空字符串的规则，这些规则应该通过其他方式触发
      if (cfg.reg !== "") {
        rules.push({
          reg: cfg.reg,
          fnc: key,
          priority: cfg.priority ?? 5000,
          log: cfg.log // 透传log开关，false时框架不打匹配日志
        })
      }
      
      // 有 check 字段的规则（包括 reg 为空的）通过 accept 机制触发
      if (cfg.check) {
        checkList.push({
          key: key,
          check: cfg.check
        })
      }
    }
    
    // 闭嘴相关规则前置，确保闭嘴判断优先于所有命令执行
    const shutKeys = ['toShutUp', 'determineIfYouShutUp', 'openYourMouth']
    const shutRules = rules.filter(r => shutKeys.includes(r.fnc))
    const otherRules = rules.filter(r => !shutKeys.includes(r.fnc))
    rules = [...shutRules, ...otherRules]
    
    super({
      name: 'liulian-plugin',
      desc: '榴莲插件',
      event: 'message',
      priority: 50,
      rule: rules
    })
    
    // 保存 checkList 到实例属性，必须在 super() 调用之后
    this.checkList = checkList
  }
  
  // 接受方法，执行所有 check 函数
  async accept(e) {
    if (!this.checkList || this.checkList.length === 0) {
      return false
    }
    
    for (let idx = 0; idx < this.checkList.length; idx++) {
      let item = this.checkList[idx]
      if (item.check(e) === true) {
        return true
      }
    }
    return false
  }
  
  
}

// 将所有导出的函数添加到LiulianV3类中
const exportedFunctions = {
    help, maphelp, pluginhelp, tangyuanhelp, sysCfg, 哪个群友是我老婆,
    checkIn, randomQA, answerCheck, updateLiulianPlugin,
    JsPlugins, PluginsList, WarehPluginsList, RemovePlugins,
    LoadPlugins, DeletePlugins, HelpMenu, v3JsPlugins,
    v3PluginsList, v3WarehPluginsList, v3RemovePlugins,
    v3LoadPlugins, v3DeletePlugins, v3HelpMenu, miku,
    kt1, jtm, mr, ys, bh3, blhx, wl, fgo, y7d, sn,
    gz, se, kt2, versionInfo, yl总, yl1, yl2, yl3, yl4,
    yl5, yl6, yl7, yl8, yl9, yl10, yl11, yl12, yl13,
    yl14, yl15, yl16, yl17, yl18, yl19, yl20, sm总,
    sm1, sm2, sm3, sm4, sm5, sm6, sm7, sm8, sm9, sm10,
    sm11, sm12, sm13, sm14, sm15, sm16, sm17, sm18, sm19,
    sm20, sm21, sm22, sm23, fakeMessage, random, chuochuo,
    FuckingChatterbox, guessAvatar, guessAvatarCheck, memberBind, memberBindKey, memberStatus,
    zzzguessAvatar, zzzguessAvatarCheck, wwguessAvatar, wwguessAvatarCheck, nteguessAvatar, nteguessAvatarCheck, groupRest, godEyesFUN,
    headPortraitFUN, qmp, biaoQing, biaoQingHelp, fabing,
    lp, setu, dailyword, sentence, dailywordCheck, sentenceCheck, HitMe, CeShi, dutang,
    caihongpi, saylove, joke, 早报, xzys, ercyFUN,
    chengfenFUN, daanFUN, qiuqianFUN, changeBilibiliPush,
    changeGroupBilibiliPush, changeBiliPushPrivatePermission,
    bilibiliPushPermission, updateBilibiliPush,
    getBilibiliPushUserList, setBiliPushTimeInterval,
    setBiliPushFaultTime, changeBiliPushTransmit,
    setBiliPushSendType, pushScheduleJob, biliLogin, refreshBiliPushList, refreshAllBiliPushList, checkBiliCookie, weather, dog, holiday, eventHistory, miyu, miyuCheck, fanyi, translateText, base64jiami, base64jiemi, wyyjx, wyyauto, qrcode, hotSearch, subscribeKeyword, unsubscribeKeyword, viewSubscriptions,
    addGlobalBlockedKeyword, removeGlobalBlockedKeyword, viewGlobalBlockedKeywords,
    addGroupBlockedKeyword, removeGroupBlockedKeyword, viewGroupBlockedKeywords,
    viewApplications, approveApplication, rejectApplication,
    hotWordCloud, hotTrendChart, hotUpdate,
    enableHotPush, disableHotPush, setHotPushTime, setHotPushPlatform, getHotPushList,
    hotPushScheduleJob, bilibilihelp, hothelp, YZversionInfo, EndCheck, musicanswerCheck,
    guessmusic, 运势, 小黑子, updateRes, cj, Robacat,
    Loseacat, Resetcat, Bouncecat, mapnumber, 上传, daihua, guangbo, guangboHelp,
    starguessAvatar, starguessAvatarCheck, toShutUp,
    guessRankCmd,
    determineIfYouShutUp, openYourMouth, replace, sjclassic,
    zdclassic, liulian_status
}

// AI 处理函数静态挂载（对齐最初版本：ai/ai_reset_memory 从 './ai.js' 直接导入）
exportedFunctions.ai = ai;
exportedFunctions.ai_reset_memory = ai_reset_memory;

// 功能分布计数映射：handler 函数名 → 功能族（ct 外层键）；内层键即函数名本身，与代码零漂移
// 未映射的 handler 不计数；Check 类内部校验函数（answerCheck/guessAvatarCheck 等）无触发面，不映射
// qmp/biaoQing/lp/randomQA 归属待确认，暂不映射
const CT_MAP = {
  help: '帮助查询', maphelp: '地下地图', pluginhelp: '帮助查询', tangyuanhelp: '帮助查询',
  sysCfg: '插件管理', 哪个群友是我老婆: '娶群友', checkIn: '打卡',
  updateLiulianPlugin: '插件管理', updateRes: '插件管理', cj: '插件管理',
  JsPlugins: '插件管理', PluginsList: '插件管理', WarehPluginsList: '插件管理',
  RemovePlugins: '插件管理', LoadPlugins: '插件管理', DeletePlugins: '插件管理',
  HelpMenu: '插件管理', v3JsPlugins: '插件管理', v3PluginsList: '插件管理',
  v3WarehPluginsList: '插件管理', v3RemovePlugins: '插件管理', v3LoadPlugins: '插件管理',
  v3DeletePlugins: '插件管理', v3HelpMenu: '插件管理', replace: '插件管理',
  liulian_status: '插件管理', ai_reset_memory: '插件管理', fakeMessage: '插件管理',
  miku: '小黑子', kt1: '小黑子', kt2: '小黑子', jtm: '小黑子', mr: '小黑子',
  ys: '小黑子', bh3: '小黑子', blhx: '小黑子', wl: '小黑子', fgo: '小黑子',
  y7d: '小黑子', sn: '小黑子', gz: '小黑子', se: '小黑子', 小黑子: '小黑子',
  yl总: '地下地图', yl1: '地下地图', yl2: '地下地图', yl3: '地下地图', yl4: '地下地图',
  yl5: '地下地图', yl6: '地下地图', yl7: '地下地图', yl8: '地下地图', yl9: '地下地图',
  yl10: '地下地图', yl11: '地下地图', yl12: '地下地图', yl13: '地下地图', yl14: '地下地图',
  yl15: '地下地图', yl16: '地下地图', yl17: '地下地图', yl18: '地下地图', yl19: '地下地图',
  yl20: '地下地图', sm总: '地下地图', sm1: '地下地图', sm2: '地下地图', sm3: '地下地图',
  sm4: '地下地图', sm5: '地下地图', sm6: '地下地图', sm7: '地下地图', sm8: '地下地图',
  sm9: '地下地图', sm10: '地下地图', sm11: '地下地图', sm12: '地下地图', sm13: '地下地图',
  sm14: '地下地图', sm15: '地下地图', sm16: '地下地图', sm17: '地下地图', sm18: '地下地图',
  sm19: '地下地图', sm20: '地下地图', sm21: '地下地图', sm22: '地下地图', sm23: '地下地图',
  mapnumber: '地下地图',
  chuochuo: '随机表情',
  上传: '随机表情', biaoQingHelp: '表情制作', biaoQing: '表情制作', qmp: '群名片',
  FuckingChatterbox: '寻找大水逼',
  guessAvatar: '猜角色', starguessAvatar: '猜角色', zzzguessAvatar: '猜角色',
  wwguessAvatar: '猜角色', nteguessAvatar: '猜角色', guessRankCmd: '猜角色排名',
  guessmusic: '猜歌名', miyu: '猜谜语', randomQA: '派蒙题库',
  memberBind: '会员', memberBindKey: '会员', memberStatus: '会员',
  groupRest: '群聊闭嘴', toShutUp: '群聊闭嘴', openYourMouth: '群聊闭嘴', determineIfYouShutUp: '群聊闭嘴',
  godEyesFUN: '神之眼', headPortraitFUN: '头像',
  HitMe: '打我', CeShi: '进退群通知',
  dutang: '毒鸡汤', caihongpi: '彩虹屁', saylove: '土味情话', joke: '笑话',
  fabing: '发病文学',
  早报: '早报', xzys: '星座运势', weather: '天气', holiday: '节假日', eventHistory: '历史上的今天',
  setu: 'setu', dog: '舔狗日记',
  dailyword: '每日单词', sentence: '每日句子',
  ercyFUN: '二次元的我', chengfenFUN: '二次元的我', daanFUN: '答案之书', qiuqianFUN: '运势',
  运势: '运势', lp: '娶群友',
  changeBilibiliPush: 'B站推送', changeGroupBilibiliPush: 'B站推送',
  changeBiliPushPrivatePermission: 'B站推送', bilibiliPushPermission: 'B站推送',
  updateBilibiliPush: 'B站推送', getBilibiliPushUserList: 'B站推送',
  setBiliPushTimeInterval: 'B站推送', setBiliPushFaultTime: 'B站推送',
  changeBiliPushTransmit: 'B站推送', setBiliPushSendType: 'B站推送',
  biliLogin: 'B站推送', refreshBiliPushList: 'B站推送', refreshAllBiliPushList: 'B站推送',
  checkBiliCookie: 'B站推送',
  subscribeKeyword: '词云热搜', unsubscribeKeyword: '词云热搜', viewSubscriptions: '词云热搜',
  hotSearch: '词云热搜',
  addGlobalBlockedKeyword: '词云热搜', removeGlobalBlockedKeyword: '词云热搜',
  viewGlobalBlockedKeywords: '词云热搜', addGroupBlockedKeyword: '词云热搜',
  removeGroupBlockedKeyword: '词云热搜', viewGroupBlockedKeywords: '词云热搜',
  viewApplications: '词云热搜', approveApplication: '词云热搜', rejectApplication: '词云热搜',
  hotWordCloud: '词云热搜', hotTrendChart: '词云热搜', hotUpdate: '词云热搜',
  enableHotPush: '词云热搜', disableHotPush: '词云热搜', setHotPushTime: '词云热搜',
  setHotPushPlatform: '词云热搜', getHotPushList: '词云热搜', hotPushScheduleJob: '词云热搜',
  bilibilihelp: '帮助查询', hothelp: '帮助查询', YZversionInfo: '帮助查询', versionInfo: '帮助查询',
  Robacat: '猫猫互动', Loseacat: '猫猫互动', Resetcat: '猫猫互动', Bouncecat: '猫猫互动',
  daihua: '广播带话', guangbo: '广播带话', guangboHelp: '广播带话',
  sjclassic: '经典发言', zdclassic: '经典发言',
  fanyi: '翻译', base64jiami: 'base64', base64jiemi: 'base64',
  wyyjx: '网易云解析', wyyauto: '网易云解析', qrcode: '二维码'
}

for (let fnName in exportedFunctions) {
  const family = CT_MAP[fnName]
  LiulianV3.prototype[fnName] = async function(e) {
    if (family) count(family, fnName)
    return await exportedFunctions[fnName](e, { render })
  }
}

export { rule, LiulianV3 };