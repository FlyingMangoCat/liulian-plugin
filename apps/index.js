import fs from "fs";
import schedule from "node-schedule";
import config from "../model/config/config.js"
import { versionInfo, help } from "./help.js"
import { wjc } from "./wjc.js"
import { ai, ai_reset_memory } from "./ai.js"
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
import {	currentVersion } from "../components/Changelog.js";
import { pluginhelp } from "./pluginhelp.js"
import { 修仙help } from "./修仙help.js"
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
setu,
lp,
dailyword,
sentence
} from "./manyfunctions.js"
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
import { chumeng } from "./打卡.js"
import { randomQA, answerCheck } from "./Q&A.js"
import { HitMe } from "./hitme.js"
import { forge } from "./伪造信息.js"
import { fabing } from "./morbidity.js"
import { biaoQing, biaoQingHelp } from "./makeemoticons.js"
import { random, chuochuo, 上传 } from "./Random expression.js"
import { random as adRandom } from "./ad.js"
import { FuckingChatterbox } from "./chatterboxStat.js"
import { EndCheck,   
musicanswerCheck,
guessmusic,
guessAvatarCheck,
guessAvatar,
starguessAvatar,
starguessAvatarCheck,
bbguessAvatar,
bbguessAvatarCheck
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

export {
    help,
    maphelp,
    pluginhelp,
    修仙help,
    sysCfg,
    哪个群友是我老婆,
    chumeng,
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
    forge,
    random,
    chuochuo,
    adRandom,
    FuckingChatterbox,
    guessAvatar,
    guessAvatarCheck,
    bbguessAvatar,
    bbguessAvatarCheck,
    examples,
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
    setBiliPushCookie,
    setBiliPushFaultTime,
    changeBiliPushTransmit,
    setBiliPushSendType,
    pushScheduleJob,
    weather,
    dog,
    bilibilihelp,
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
    ai,
    ai_reset_memory,
    daihua,
    guangbo,
    guangboHelp,
    starguessAvatar,
    starguessAvatarCheck,
    toShutUp,
    determineIfYouShutUp,
    openYourMouth,
    replace,
    sjclassic,
    zdclassic,
    liulian_status,
}

const cfg = config.getdefault_config('liulian', 'botname', 'config');
  const botname = cfg.botname

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
        修仙help: {
        reg: "^#?(修仙使用帮助)$",
        priority: 100,
        describe: "修仙使用帮助",
    },
        bilibilihelp: {
        reg: "^#?(B站|b站|小破站)推送帮助$",
        priority: 1,
        describe: "B站推送帮助",
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
        reg: '^#?(原神地下地图编号)$',
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
        chumeng: {
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
        reg: "(.*)",
        priority: 500,
        describe: "",
    },
        updateLiulianPlugin: {
        reg: '^#(榴莲|留恋)(强制)?更新',
        priority: 10,
        describe: '更新'
    },        
        JsPlugins: {        
        reg: "noCheck",       
        priority: 4500,        
        describe: "生成js文件自动放到插件目录下面",    
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
        reg: "(.*)",        
        priority: 4500,        
        describe: "生成js文件自动放到插件目录下面",    
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
        forge: {
        reg: "^#(伪造信息|伪造消息).*$", //匹配消息正则，命令正则
        priority: 50, //优先级，越小优先度越高
        describe: "【#伪造信息@群成员 信息】", 
    },
        random: {
        reg: "(.*)",
        priority: 114514,
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
        guessAvatar: {
        reg: '^#猜(头像|角色)(普通|困难|地狱)?(模式)?',
        priority: 10,
        describe: '#猜头像、#猜角色、#猜角色困难模式',
    },
        guessAvatarCheck: {
        reg: "(.*)",
        priority: 908,
        describe: '',
    },
        starguessAvatar: {
        reg: '^#(星铁)?猜(角色|角色星铁)(普通|困难|地狱)?(模式)?',
        priority: 10,
        describe: '猜星铁角色',
    },
        starguessAvatarCheck: {
        reg: "(.*)",
        priority: 908,
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
    },
       examples: {
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
       reg: "(.*)", //匹配消息正则，命令正则
       priority: 99999, //优先级，越小优先度越高
       describe: "头像表情包", //【命令】功能说明
    },
       biaoQingHelp: {
       reg: "#*表情帮助$", //匹配消息正则，命令正则
       priority: 100, //优先级，越小优先度越高
       describe: "表情帮助", //【命令】功能说明
    },
       ad: {
       reg: "noCheck", //不检查正则，匹配所有消息
       priority: 99999, //最低优先级，确保不干扰其他功能
       describe: "概率随机触发宣传消息", //【命令】功能说明
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
       HitMe: {
       reg: "#打我", //匹配消息正则，命令正则
       priority: 1000, //优先级，越小优先度越高
       describe: "【#禁言自己1-10次】", //【命令】功能说明
    },
       CeShi: {
	     	reg: "(.*)", //匹配消息正则，命令正则
     		priority: 99999, //优先级，越小优先度越高
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
       setBiliPushCookie: {
       reg: "^#*B站推送ck\\s*.+$",
       priority: 500,
       describe: "设置B站推送ck"
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
       wjc: {
       reg: "(傻逼|淦|你妈|卧槽|woc)$", //在此处添加违禁词，用"|"隔开
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
  ai: {
    reg: "(.*)", // 匹配所有消息
    priority: 99999, // 极低优先级，确保所有其他指令优先处理
    describe: "AI自动回复", // 功能说明
  },
   ai_reset_memory: {
        reg: "^#榴莲重置记忆\\s*@?(\\d+)", // 匹配 #榴莲重置记忆@123456 或 #榴莲重置记忆 123456
        priority: 99, // 高优先级
        describe: "重置用户记忆（管理员功能）"
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
    describe: "闭嘴判断", //【命令】功能说明
    },
    openYourMouth: {
    reg: "#(张嘴|色色|复活)$", //匹配消息正则，命令正则
    priority: 100, //优先级，越小优先度越高
    describe: "群聊张嘴", //【命令】功能说明
    },
    replace: {
    reg: "/(.*)",
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

// V3支持：将rule对象转换为V3插件类
import plugin from '../adapter/lib/plugin.js'

class LiulianV3 extends plugin {
  constructor() {
    let rules = []
    
    // 将rule对象转换为V3规则数组
    for (let key in rule) {
      let cfg = rule[key]
      rules.push({
        reg: cfg.reg,
        fnc: key,
        priority: cfg.priority || 5000
      })
    }
    
    super({
      name: 'liulian-plugin',
      desc: '榴莲插件',
      event: 'message',
      priority: 50,
      rule: rules
    })
  }
}

// 将所有导出的函数添加到LiulianV3类中
const exportedFunctions = {
    help, maphelp, pluginhelp, 修仙help, sysCfg, 哪个群友是我老婆,
    chumeng, randomQA, answerCheck, updateLiulianPlugin,
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
    sm20, sm21, sm22, sm23, forge, random, chuochuo,
    adRandom, FuckingChatterbox, guessAvatar, guessAvatarCheck,
    bbguessAvatar, bbguessAvatarCheck, examples, godEyesFUN,
    headPortraitFUN, qmp, biaoQing, biaoQingHelp, fabing,
    lp, setu, dailyword, sentence, HitMe, CeShi, dutang,
    caihongpi, saylove, joke, 早报, xzys, ercyFUN,
    chengfenFUN, daanFUN, qiuqianFUN, changeBilibiliPush,
    changeGroupBilibiliPush, changeBiliPushPrivatePermission,
    bilibiliPushPermission, updateBilibiliPush,
    getBilibiliPushUserList, setBiliPushTimeInterval,
    setBiliPushCookie, setBiliPushFaultTime, changeBiliPushTransmit,
    setBiliPushSendType, pushScheduleJob, weather, dog,
    bilibilihelp, YZversionInfo, EndCheck, musicanswerCheck,
    guessmusic, 运势, 小黑子, updateRes, cj, Robacat,
    Loseacat, Resetcat, Bouncecat, mapnumber, 上传, ai,
    ai_reset_memory, daihua, guangbo, guangboHelp,
    starguessAvatar, starguessAvatarCheck, toShutUp,
    determineIfYouShutUp, openYourMouth, replace, sjclassic,
    zdclassic, liulian_status
}

for (let fnName in exportedFunctions) {
  LiulianV3.prototype[fnName] = async function(e) {
    const render = this.render || null
    return await exportedFunctions[fnName](e, { render })
  }
}

export { rule, LiulianV3 };