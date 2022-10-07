import { versionInfo,help } from "./help.js"
import {	currentVersion } from "../components/Changelog.js";
import { pluginhelp } from "./pluginhelp.js"
import { 修仙help } from "./修仙help.js"
import { rule as adminRule,
 updateRes,
 sysCfg,
 updateLiulianPlugin,
 profileCfg
 } from "./admin.js"
import { 哪个群友是我老婆 } from "./哪个群友是我老婆.js"
import { chumeng } from "./打卡(加好友私聊打卡还能点赞).js"
import { randomQA,answerCheck } from "./派蒙问答[添加群聊开关和次数限制].js"
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
export {
    help,
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
}


let rule = {
 
        help: {
        reg: "^#?(榴莲帮助|帮助|help)$",
        priority: 10,
        describe: "榴莲版本",
    },
        pluginhelp: {
        reg: "^#?(插件管理帮助)$",
        priority: 10,
        describe: "插件管理帮助",
    },
        修仙help: {
        reg: "修仙使用帮助$",
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
        reg: "noCheck",
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
        reg: "^(#|井)*(cjlb|插件列表)$", 
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
        reg: "^(#|井)*(qycj|恢复插件)(.*)$",  
        priority: 450,        
        describe: "恢复插件(插件名)",  
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
        reg: "noCheck",        
        priority: 450,        
        describe: "生成js文件自动放到插件目录下面",    
    },        
        v3PluginsList: {        
        reg: "^(cjlb|插件列表)$", 
        priority: 450,        
        describe: "查看你安装的插件的列表", 
    },        
        v3WarehPluginsList: {        
        reg: "^(cklb|仓库列表)$", 
        priority: 450,       
        describe: "查看被停用的插件的列表",   
    },        
        v3RemovePlugins: {        
        reg: "^(tycj|移除插件)(.*)$", 
        priority: 450,    
        describe: "移除插件(插件名)",   
    },        
        v3LoadPlugins: {       
        reg: "^(qycj|添加插件)(.*)$",  
        priority: 450,        
        describe: "添加插件(插件名)",  
    },        
        v3DeletePlugins: {       
        reg: "^(sccj|删除插件)(.*)$", 
        priority: 450,       
        describe: "删除插件(插件名)",  
    },       
        v3HelpMenu: {       
        reg: "^(cjhelp|插件管理帮助)(.*)$",
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
};

// lodash.forEach(rule, (r) => {
//     r.priority = r.priority || 50;
//     r.prehash = true;
//     r.hashMark = true;
//   });

export { rule };