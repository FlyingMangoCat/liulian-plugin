import { versionInfo,help } from "./help.js"
import { maphelp } from "./maphelp.js"
import {	currentVersion } from "../components/Changelog.js";
import { pluginhelp } from "./pluginhelp.js"
import { 修仙help } from "./修仙help.js"
import { guessAvatarCheck,guessAvatar } from "./roleGuess.js"
import { rule as adminRule,
 updateRes,
 sysCfg,
 updateLiulianPlugin,
 profileCfg
 } from "./admin.js"
import { 哪个群友是我老婆 } from "./哪个群友是我老婆.js"
import { chumeng } from "./打卡(加好友私聊打卡还能点赞).js"
import { randomQA,answerCheck } from "./问答.js"
import { forge } from "./伪造信息.js"
import { random,chuochuo } from "./随机表情.js"
import { FuckingChatterbox } from "./chatterboxStat.js"
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
sm8} from "./XMmap.js"
import { JsPlugins,
PluginsList,
WarehPluginsList,
RemovePlugins,
LoadPlugins,
DeletePlugins,
HelpMenu} from "./pluginManager.js"
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
kt2
} from "./寄你太美.js"
import { dragonKing } from "./查龙王.js"
import { examples } from "./群友强制休息.js"
import { godEyesFUN,headPortraitFUN } from "./godEyes.js"
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
        sysCfg: {
        reg: "^#?(榴莲设置|设置|榴莲设置帮助开启|榴莲设置帮助关闭)$",
        priority: 15,
        describe: "榴莲设置",
    },
        versionInfo: {
        reg: '^#?榴莲版本$',
        priority: 10,
        describe: "榴莲版本介绍",
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
        reg: "^#?(榴莲问答|芒果问答|派蒙问答)$", //匹配消息正则，命令正则
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
        reg: "^#插件列表$", 
        priority: 450,        
        describe: "查看你安装的插件的列表", 
    },        
        WarehPluginsList: {        
        reg: "^(#|井)*(cklb|仓库列表)$", 
        priority: 450,       
        describe: "查看被停用的插件的列表",   
    },        
        RemovePlugins: {        
        reg: "^(#|井)*(tycj|移除插件)(.*)$", 
        priority: 450,    
        describe: "移除插件(插件名)",   
    },        
        LoadPlugins: {       
        reg: "^(#|井)*(qycj|添加插件)(.*)$",  
        priority: 450,        
        describe: "添加插件(插件名)",  
    },        
        DeletePlugins: {       
        reg: "^(#|井)*(sccj|删除插件)(.*)$", 
        priority: 450,       
        describe: "删除插件(插件名)",  
    },       
        HelpMenu: {       
        reg: "^(#|井)*(cjhelp|插件管理帮助)(.*)$",
        priority: 450,        
        describe: "帮助菜单",	   
    },        
        v3JsPlugins: {        
        reg: "(.*)",        
        priority: 450,        
        describe: "生成js文件自动放到插件目录下面",    
    },        
        v3PluginsList: {        
        reg: "v3插件列表$", 
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
        reg: "^((.*)鸡你太美(.*)|(.*)寄你太美(.*)|(.*)小黑子(.*)|(.*)鲲鲲(.*)|(.*)鸽鸽(.*)|(.*)爱坤(.*)|(.*)geigei(.*)|(.*)蔡徐坤(.*)|(.*)菜虚鲲(.*)|(.*)姬霓太美(.*))$", //匹配消息正则，命令正则
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
    }
};

// lodash.forEach(rule, (r) => {
//     r.priority = r.priority || 50;
//     r.prehash = true;
//     r.hashMark = true;
//   });

export { rule };