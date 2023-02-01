import fs from "fs";
import schedule from "node-schedule";
import { versionInfo,help } from "./help.js"
import { wjc } from "./wjc.js"
import { 运势 } from "./运势.js"
import { maphelp,mapnumber} from "./maphelp.js"
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
import { Robacat,
Loseacat,
Resetcat,
Bouncecat
 } from "./Cat.js"
import { CeShi } from "./inoutgroup.js"
import { 哪个群友是我老婆 } from "./哪个群友是我老婆.js"
import { chumeng } from "./打卡(加好友私聊打卡还能点赞).js"
import { randomQA,answerCheck } from "./问答.js"
import { HitMe } from "./hitme.js"
import { forge } from "./伪造信息.js"
import { fabing } from "./morbidity.js"
import { biaoQing,biaoQingHelp } from "./makeemoticons.js"
import { random,chuochuo } from "./随机表情.js"
import { FuckingChatterbox } from "./chatterboxStat.js"
import { EndCheck,   
musicanswerCheck,
guessmusic,
guessAvatarCheck,
guessAvatar
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
sm8
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
} from "./bilibiliPush.js";
import { bilibilihelp } from "./bilibilihelp.js"
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
import { dragonKing } from "./查龙王.js"
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
    forge,
    random,
    chuochuo,
    FuckingChatterbox,
    guessAvatar,
    guessAvatarCheck,
    dragonKing,
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
    setBiliPushFaultTime,
    changeBiliPushTransmit,
    setBiliPushSendType,
    pushScheduleJob,
    weather,
    dog,
    bilibilihelp,
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
}


let rule = {
 
        help: {
        reg: "^#?(榴莲帮助|帮助|help)$",
        priority: 10,
        describe: "榴莲版本",
    },
        maphelp: {
        reg: "^#?(地下地图帮助)$",
        priority: 10,
        describe: "地下地图使用帮助",
    },
        pluginhelp: {
        reg: "^#?(插件管理帮助)$",
        priority: 10,
        describe: "插件管理帮助",
    },
        修仙help: {
        reg: "^#?(修仙使用帮助)$",
        priority: 10,
        describe: "修仙使用帮助",
    },
        bilibilihelp: {
        reg: "^#?(B站|b站|小破站)推送帮助$",
        priority: 10,
        describe: "B站推送帮助",
    },    
        updateRes: {
        reg: '^#榴莲(更新图像|图像更新)$',
        priority: 10,
        describe: "榴莲更新素材",
    },
        cj: {
        reg: '^#榴莲(更新|安装)芒果插件$',
        priority: 10,
        describe: "榴莲更新素材",
    },
        sysCfg: {
        reg: "^#?榴莲设置(.*)$",
        priority: 15,
        describe: "榴莲设置",
    },
        versionInfo: {
        reg: '^#?(榴莲版本|༕)$',
        priority: 10,
        describe: "榴莲版本介绍",
    },
        mapnumber: {
        reg: '^#?(原神地下地图编号)$',
        priority: 10,
        describe: "介绍",
    },
        哪个群友是我老婆: {
        reg: "^#*(拐群友|柰子|奈子|奶子|绑架群友|娶群友|娶老婆|拐卖人口|哪个群友是我老婆|抽管理|拐卖群友|绑架人口|拐走群友)$", //匹配消息正则，命令正则
        priority: 100,
        describe: "哪个群友是我老婆",
    },
        chumeng: {
        reg: "打卡$", //匹配消息正则，命令正则
        priority: 1, //优先级，越小优先度越高
        describe: "打卡or点赞", //【命令】功能说明
    },
        randomQA: {
        reg: "^#?(榴莲|芒果)问答$", //匹配消息正则，命令正则
        priority: 59, //优先级，越小优先度越高
        describe: "【#竞猜】「派蒙的十万个为什么」题库", //【命令】功能说明
    },
        answerCheck: {
        reg: "(.*)",
        priority: 5,
        describe: "",
    },
        updateLiulianPlugin: {
        reg: '^#榴莲(强制)?更新',
        priority: 1,
        describe: '榴莲更新'
    },        
        JsPlugins: {        
        reg: "noCheck",       
        priority: 450,        
        describe: "生成js文件自动放到插件目录下面",    
    },        
        PluginsList: {        
        reg: "^#v2插件列表$", 
        priority: 450,        
        describe: "查看你安装的插件的列表", 
    },        
        WarehPluginsList: {        
        reg: "^(#|井)*(v2仓库列表)$", 
        priority: 450,       
        describe: "查看被停用的插件的列表",   
    },        
        RemovePlugins: {        
        reg: "^(#|井)*(v2移除插件)(.*)$", 
        priority: 450,    
        describe: "移除插件(插件名)",   
    },        
        LoadPlugins: {       
        reg: "^(#|井)*(v2添加插件)(.*)$",  
        priority: 450,        
        describe: "添加插件(插件名)",  
    },        
        DeletePlugins: {       
        reg: "^(#|井)*(v2删除插件)(.*)$", 
        priority: 450,       
        describe: "删除插件(插件名)",  
    },       
        HelpMenu: {       
        reg: "^(#|井)*(v2插件管理帮助)(.*)$",
        priority: 450,        
        describe: "帮助菜单",	   
    },        
        v3JsPlugins: {        
        reg: "(.*)",        
        priority: 450,        
        describe: "生成js文件自动放到插件目录下面",    
    },        
        v3PluginsList: {        
        reg: "插件列表$", 
        priority: 450,        
        describe: "查看你安装的插件的列表", 
    },        
        v3WarehPluginsList: {        
        reg: "仓库列表$", 
        priority: 450,       
        describe: "查看被停用的插件的列表",   
    },        
        v3RemovePlugins: {        
        reg: "移除插件(.*)$", 
        priority: 450,    
        describe: "移除插件(插件名)",   
    },        
        v3LoadPlugins: {       
        reg: "添加插件(.*)$",  
        priority: 450,        
        describe: "添加插件(插件名)",  
    },        
        v3DeletePlugins: {       
        reg: "删除插件(.*)$", 
        priority: 450,       
        describe: "删除插件(插件名)",  
    },       
        v3HelpMenu: {       
        reg: "插件管理帮助(.*)$",
        priority: 450,        
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
        priority: 10, //优先级，越小优先度越高
        describe: "", //【命令】功能说明
    },
        kt2: {
        reg: "^#看腿2$", //匹配消息正则，命令正则
        priority: 10, //优先级，越小优先度越高
        describe: "", //【命令】功能说明
    }, 
        yl总: {
        reg: "须弥1-总", //匹配消息正则，命令正则
        priority: 35, //优先级，越小优先度越高
        describe: "", 
    },
        yl1: {
        reg: "须弥1-1", //匹配消息正则，命令正则
        priority: 35, //优先级，越小优先度越高
        describe: "", 
    },
        yl2: {
        reg: "须弥1-2", //匹配消息正则，命令正则
        priority: 35, //优先级，越小优先度越高
        describe: "", 
    },
        yl3: {
        reg: "须弥1-3", //匹配消息正则，命令正则
        priority: 35, //优先级，越小优先度越高
        describe: "", 
    },
        yl4: {
        reg: "须弥1-4", //匹配消息正则，命令正则
        priority: 35, //优先级，越小优先度越高
        describe: "", 
    },
        yl5: {
        reg: "须弥1-5", //匹配消息正则，命令正则
        priority: 35, //优先级，越小优先度越高
        describe: "", 
    },
        yl6: {
        reg: "须弥1-6", //匹配消息正则，命令正则
        priority: 35, //优先级，越小优先度越高
        describe: "", 
    },
        yl7: {
        reg: "须弥1-7", //匹配消息正则，命令正则
        priority: 35, //优先级，越小优先度越高
        describe: "", 
    },
        yl8: {
        reg: "须弥1-8", //匹配消息正则，命令正则
        priority: 35, //优先级，越小优先度越高
        describe: "", 
    },
        yl9: {
        reg: "须弥1-9", //匹配消息正则，命令正则
        priority: 35, //优先级，越小优先度越高
        describe: "", 
    },
        yl10: {
        reg: "须弥1-10", //匹配消息正则，命令正则
        priority: 3, //优先级，越小优先度越高
        describe: "", 
    },
        yl11: {
        reg: "须弥1-11", //匹配消息正则，命令正则
        priority: 3, //优先级，越小优先度越高
        describe: "", 
    },
        yl12: {
        reg: "须弥1-12", //匹配消息正则，命令正则
        priority: 3, //优先级，越小优先度越高
        describe: "", 
    },
        yl13: {
        reg: "须弥1-13", //匹配消息正则，命令正则
        priority: 3, //优先级，越小优先度越高
        describe: "", 
    },
        yl14: {
        reg: "须弥1-14", //匹配消息正则，命令正则
        priority: 3, //优先级，越小优先度越高
        describe: "", 
    },
        yl15: {
        reg: "须弥1-15", //匹配消息正则，命令正则
        priority: 3, //优先级，越小优先度越高
        describe: "", 
    },
        yl16: {
        reg: "须弥1-16", //匹配消息正则，命令正则
        priority: 3, //优先级，越小优先度越高
        describe: "", 
    },
        yl17: {
        reg: "须弥1-17", //匹配消息正则，命令正则
        priority: 3, //优先级，越小优先度越高
        describe: "", 
    },
        yl18: {
        reg: "须弥1-18", //匹配消息正则，命令正则
        priority: 3, //优先级，越小优先度越高
        describe: "", 
    },
        yl19: {
        reg: "须弥1-19", //匹配消息正则，命令正则
        priority: 3, //优先级，越小优先度越高
        describe: "", 
    },
        yl20: {
        reg: "须弥1-20", //匹配消息正则，命令正则
        priority: 3, //优先级，越小优先度越高
        describe: "", 
    },
        sm总: {
        reg: "须弥2-总", //匹配消息正则，命令正则
        priority: 35, //优先级，越小优先度越高
        describe: "", 
    },
        sm8: {
        reg: "须弥2-8", //匹配消息正则，命令正则
        priority: 35, //优先级，越小优先度越高
        describe: "", 
    },
        sm1: {
        reg: "须弥2-1", //匹配消息正则，命令正则
        priority: 35, //优先级，越小优先度越高
        describe: "", 
    },
        sm2: {
        reg: "须弥2-2", //匹配消息正则，命令正则
        priority: 35, //优先级，越小优先度越高
        describe: "", 
    },
        sm3: {
        reg: "须弥2-3", //匹配消息正则，命令正则
        priority: 35, //优先级，越小优先度越高
        describe: "", 
    },
        sm4: {
        reg: "须弥2-4", //匹配消息正则，命令正则
        priority: 35, //优先级，越小优先度越高
        describe: "", 
    },
        sm5: {
        reg: "须弥2-5", //匹配消息正则，命令正则
        priority: 35, //优先级，越小优先度越高
        describe: "", 
    },
        sm6: {
        reg: "须弥2-6", //匹配消息正则，命令正则
        priority: 35, //优先级，越小优先度越高
        describe: "", 
    },
        sm7: {
        reg: "须弥2-7", //匹配消息正则，命令正则
        priority: 35, //优先级，越小优先度越高
        describe: "", 
    },
        forge: {
        reg: "^#(伪造信息|伪造消息).*$", //匹配消息正则，命令正则
        priority: 50, //优先级，越小优先度越高
        describe: "【#伪造信息@群成员 信息】", 
    },
        random: {
        reg: "(.*)",
        priority: 59,
        describe: "概率随机发送表情包",  //聊天中概率回复表情包，不需要可以注释掉。
    },
        chuochuo: {
        reg: "戳一戳",
        priority: 5,
        describe: "",
    },
        FuckingChatterbox: {
        reg: "^#*(话痨统计|话痨检测|水逼检测|水逼统计)$", 
        priority: 60,
        describe: "寻找大水逼",
    },
        guessAvatar: {
        reg: '^#猜(头像|角色)(普通|困难|地狱)?(模式)?',
        priority: 99,
        describe: '#猜头像、#猜角色、#猜角色困难模式',
    },
        guessAvatarCheck: {
        reg: "(.*)",
        priority: 98,
        describe: '',
    },
       dragonKing: {
       reg: "^#*(谁|哪个吊毛|哪个屌毛|哪个叼毛)是(龙王|群龙王)(\\?|？)*$",  //匹配消息正则，命令正则
       priority: 5000, //优先级，越小优先度越高
       describe: "查询本群龙王", //【命令】功能说明
    },
       examples: {
       reg: "^#我要休息[\s\S]*", //匹配消息正则，命令正则
       priority: 750, //优先级，越小优先度越高
       describe: "#我要休息XX分钟 || 天 || 小时", //【命令】功能说明
    },
       godEyesFUN: {
       reg: "^#*神之眼(.*)$",
       priority: 5000,
       describe: "【神之眼@xxx】看看ta的神之眼", 
    },
       headPortraitFUN: {
       reg: "^#*看头像(.*)$",
       priority: 5000,
       describe: "【头像@xxx】看看头像大图", 
    },
       qmp : {
       reg : "^更新群名片",
       priority: 10,
       describe : "",
    },
       biaoQing: {
       reg: "(.*)", //匹配消息正则，命令正则
       priority: 10, //优先级，越小优先度越高
       describe: "头像表情包", //【命令】功能说明
    },
       biaoQingHelp: {
       reg: "^表情帮助$", //匹配消息正则，命令正则
       priority: 10, //优先级，越小优先度越高
       describe: "表情帮助", //【命令】功能说明
    },
       fabing: {
       reg: "^#?发病(.*)$", //匹配消息正则，命令正则
       priority: 500, //优先级，越小优先度越高
       describe: "",
    },
       setu: {
     		reg: "^#(抽|今日)色图$", //匹配消息正则，命令正则
	     	priority: 400, //优先级，越小优先度越高
	     	describe: "【#例子】开发简单示例演示", //【命令】功能说明
   	},
      	lp: {
	     	reg: "^#(抽|今日)老婆$", //匹配消息正则，命令正则
	     	priority: 400, //优先级，越小优先度越高
		     describe: "【#例子】开发简单示例演示", //【命令】功能说明
   	},
       dailyword: {
       reg: "^[^-]*(每日句子|english|句子)$", //匹配消息正则，命令正则
       priority: 10, //优先级，越小优先度越高
       describe: "每日句子", //【命令】功能说明
    },
       sentence: {
       reg: "^[^-]*(每日单词|word|单词)$", //匹配消息正则，命令正则
       priority: 1, //优先级，越小优先度越高
       describe: "每日单词", //【命令】功能说明
    },
       HitMe: {
       reg: "#打我", //匹配消息正则，命令正则
       priority: 1000, //优先级，越小优先度越高
       describe: "【#禁言自己1-10次】", //【命令】功能说明
    },
       CeShi: {
	     	reg: "(.*)", //匹配消息正则，命令正则
     		priority: 5000, //优先级，越小优先度越高
	     	describe: '检测进群退群消息', //【命令】功能说明
   	},
       dutang: {
       reg: "^[^-]*毒鸡汤$", //匹配消息正则，命令正则
       priority: 10, //优先级，越小优先度越高
       describe: "毒鸡汤", //【命令】功能说明
    },
       caihongpi: {
       reg: "^[^-]*(彩虹屁|夸夸我)$", //匹配消息正则，命令正则
       priority: 10, //优先级，越小优先度越高
       describe: "彩虹屁", //【命令】功能说明
    },
       saylove: {
       reg: "^[^-]*(土味情话|土味|情话)$", //匹配消息正则，命令正则
       priority: 10, //优先级，越小优先度越高
       describe: "土味情话", //【命令】功能说明
    },
       joke: {
       reg: "^[^-]*(讲个笑话|讲笑话|来个笑话)$", 
       priority: 10, //优先级，越小优先度越高
       describe: "笑话", //【命令】功能说明
    },
       早报: {
       reg: "^#*早报$", //匹配消息正则，命令正则
       priority: 100, //优先级，越小优先度越高
       describe: "【#例子】开发简单示例演示", //【命令】功能说明
    },
       xzys: {
       reg: "^#?.*座运势$", //匹配消息正则，命令正则
       priority: 50, //优先级，越小优先度越高
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
       priority: 500,
       describe: "答案之书会告诉你答案", 
    },   
       qiuqianFUN: {
       reg: "^#*观音灵签$",
       priority: 30,
       describe: "看看今天的运势",
    },
       dog: {
       reg: "^#舔狗日记$", //匹配消息正则，命令正则
       priority: 10, //优先级，越小优先度越高
       describe: "setu", //【命令】功能说明
    },
       weather: {
       reg: "^#(.*)(天气)$", //匹配消息正则，命令正则
       priority: 10, //优先级，越小优先度越高
       describe: "天气预报", //【命令】功能说明
    },
       changeBilibiliPush: {
       reg: "^#*(开启|关闭)B站推送$",
       priority: 5,
       describe: "开启或关闭B站推送，默认推送原神动态",
    },
       updateBilibiliPush: {
       reg: "^#*(订阅|增加|新增|移除|去除|取消)B站推送\\s*.*$",
       priority: 5,
       describe: "添加或删除B站推送UID",
    },
       getBilibiliPushUserList: {
       reg: "^#*B站推送(群)?列表$",
       priority: 5,
       describe: "返回当前聊天对象推送的B站用户列表",
    },
       changeGroupBilibiliPush: {
       reg: "^#*(开启|关闭|允许|禁止)群B站推送\\s*.*$",
       priority: 5,
       describe: "",
  },
       changeBiliPushPrivatePermission: {
       reg: "^#*(允许|禁止)B站私聊推送$",
       priority: 5,
       describe: "慎用！允许/禁止私聊的方式使用B站推送功能",
  },
       bilibiliPushPermission: {
       reg: "^#*(开启|关闭)B站推送群权限\\s*.*$",
       priority: 5,
       describe: "在任意地方给任意群聊开启/关闭狗管理使用B站推送功能的权限",
  },
       setBiliPushTimeInterval: {
       reg: "^#*B站推送时间\\s*\\d+$",
       priority: 5,
       describe: "设置B站推送的定时任务间隔时间",
  },
       setBiliPushFaultTime: {
       reg: "^#*B站推送过期时间\\s*\\d+$",
       priority: 5,
       describe: "设置B站推送的的过期时间，防止被叔叔夹了导致动态发布时间和实际不符而漏推",
  },
       changeBiliPushTransmit: {
       reg: "^#*(开启|关闭)B站转发推送$",
       priority: 5,
       describe: "默认不推送类型为转发的B站动态的",
  },
       setBiliPushSendType: {
       reg: "^#*设置(全局)?B站推送(默认|合并|图片)$",
       priority: 5,
       describe: "设置B站推送发送类型为：默认（文字+图片+链接）、合并（合并消息转发）、图片（就是图片）",
  },
       pushScheduleJob: {
       reg: "^#*测试B站推送$",
       priority: 5,
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
       reg: "(傻逼|淦|你妈|卧槽|789125977|云溪院)$", //可修改，用"|"隔开即可
       priority: 10, //优先级，越小优先度越高
       describe: "违禁词", //【命令】功能说明
  },
       运势: {
       reg: "(运势|今日运势)$",
       priority: 100,
       describe: "",
  },
       小黑子: {
       reg: "^#?上传(真爱粉|black)(图|图片)$", 
       priority: 10, //优先级，越小优先度越高
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

export { rule };