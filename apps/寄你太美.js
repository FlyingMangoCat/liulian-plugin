import lodash from "lodash";
import { Cfg } from '../components/index.js';
import fetch from "node-fetch";
import path from "path"
import fs from "fs"
import co from '../tools/common-black.js'
const __dirname = path.resolve();
const hmd_userqq = []; //对于某用户黑名单 ,隔开
const bmd_GroupQQ = [790621765,363475402,849341971,231381173,278546012]; //需要使用的群的白名单 ,隔开
let timeout = 99999; //0表示不撤回，单位毫秒，默认30s。
const 小黑子_path ='plugins/liulian-plugin/resources/小黑子/小黑子/小黑子'
let source={}
const settings = {
    path: path.join(__dirname, "/plugins/liulian-plugin/resources/小黑子"),  
  }
const settings2 = {
    path: path.join(__dirname, "/plugins/liulian-plugin/resources/liulian-res-plus"),  
  }
export const rule = {
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
小黑子: {
  reg: "^#?上传(图|图片)$", //匹配消息正则，命令正则
  priority: 10, //优先级，越小优先度越高
  describe: "", //【命令】功能说明
},
};
export function Chehui(msgRes,e){
	if (timeout!=0 && msgRes && msgRes.message_id){
	  let target = null;
	  if (e.isGroup) {
	    target = e.group;
	  }else{
	    target = e.friend;
	  }
	  if (target != null){
	    setTimeout(() => {
	      target.recallMsg(msgRes.message_id);
	    }, timeout);
	  }
	}  
}
export async function miku(e) {   
  let url = `http://25252.xyz/index.php`;
  e.reply(segment.image(url));
  return true;//返回true 阻挡消息不再往下
}
export async function kt1(e) {
  let url = `http://25252.xyz/t/index.php`;
  e.reply(segment.image(url));
  return true;//返回true 阻挡消息不再往下
}
export async function jtm(e) {
if (!/榴莲/.test(e.msg) && !Cfg.get('sys.jtm', false)) {
    e.reply (`该功能已被关闭，请通过榴莲设置开启`);
    return false
  }
 let RandomNum=lodash.random(0, 100);
    if(RandomNum <= 75){
  let faceFiles = [];
  let fileName= [];
  let name = "小黑子";
  let facePath = path.join(settings2.path, name);  fs.readdirSync(facePath).forEach(fileName => faceFiles.push(fileName));
  let randomFile = faceFiles[Math.round(Math.random() * (faceFiles.length - 1))]
  console.log(randomFile)
  let finalPath = path.join(settings2.path, name, randomFile);
  let bitMap = fs.readFileSync(finalPath);
  let base64 = Buffer.from(bitMap, 'binary').toString('base64');
  let message = [segment.at(e.user_id), segment.image(`base64://${base64}`)]
  let msgRes =await e.reply(message);
    }
     if(RandomNum >= 75){
  let faceFiles = [];
  let fileName= [];
  let name = "小黑子";
  let facePath = path.join(settings.path, name);
  fs.readdirSync(facePath).forEach(fileName => faceFiles.push(fileName));
  let randomFile = faceFiles[Math.round(Math.random() * (faceFiles.length - 1))]
  console.log(randomFile)
  let finalPath = path.join(settings.path, name, randomFile);
  let bitMap = fs.readFileSync(finalPath);
  let base64 = Buffer.from(bitMap, 'binary').toString('base64');
  let message = [segment.at(e.user_id), segment.image(`base64://${base64}`)]
  let msgRes =await e.reply(message);
    }
    let msgRes =await e.reply(message);
    Chehui(msgRes,e)//调用撤回方法
    return true; //返回true 阻挡消息不再往下
}
export async function mr(e) {   
  let url = `http://25252.xyz/mr/index.php`;
  let msg=[segment.at(e.user_id),	  
	  segment.image(url)
	  ]
    let msgRes =await e.reply(msg);
    Chehui(msgRes,e)//调用撤回方法
    return true; //返回true 阻挡消息不再往下
}
export async function blhx(e) {   
  let url = `http://25252.xyz/blhx/index.php`;
  let msg=[segment.at(e.user_id),	  
	  segment.image(url)
	  ]
    let msgRes =await e.reply(msg);
    Chehui(msgRes,e)//调用撤回方法
    return true; //返回true 阻挡消息不再往下
}
export async function wl(e) {   
  let url = `http://25252.xyz/wl/index.php`;
  let msg=[segment.at(e.user_id),	  
	  segment.image(url)
	  ]
    let msgRes =await e.reply(msg);
    Chehui(msgRes,e)//调用撤回方法
    return true; //返回true 阻挡消息不再往下
}
export async function fgo(e) {   
  let url = `http://25252.xyz/fgo/index.php`;
  let msg=[segment.at(e.user_id),	  
	  segment.image(url)
	  ]
    let msgRes =await e.reply(msg);
    Chehui(msgRes,e)//调用撤回方法
    return true; //返回true 阻挡消息不再往下
}
export async function y7d(e) {   
  let url = `http://25252.xyz/7d/index.php`;
  let msg=[segment.at(e.user_id),	  
	  segment.image(url)
	  ]
    let msgRes =await e.reply(msg);
    Chehui(msgRes,e)//调用撤回方法
    return true; //返回true 阻挡消息不再往下
}
export async function sn(e) {
  let url = `http://25252.xyz/sn/index.php`;
  let msg=[segment.at(e.user_id),	  
	  segment.image(url)
	  ]
    let msgRes =await e.reply(msg);
    Chehui(msgRes,e)//调用撤回方法
    return true; //返回true 阻挡消息不再往下
}
export async function gz(e) {   
  let url = `http://25252.xyz/gz/index.php`;
  let msg=[segment.at(e.user_id),	  
	  segment.image(url)
	  ]
    let msgRes =await e.reply(msg);
    Chehui(msgRes,e)//调用撤回方法
    return true; //返回true 阻挡消息不再往下
}
export async function hx(e) {   
  let url = `http://25252.xyz/hx/index.php`;
  let msg=[segment.at(e.user_id),	  
	  segment.image(url)
	  ]
    let msgRes =await e.reply(msg);
    Chehui(msgRes,e)//调用撤回方法
    return true; //返回true 阻挡消息不再往下
}
export async function ys(e) {   
  if (!bmd_GroupQQ.includes(e.group_id)) {
		return;
  }
  if (hmd_userqq.includes(e.user_id)) {
		return;
  }
let url = `http://25252.xyz/ys/index.php`;
  let msg=[segment.at(e.user_id),	  
	  segment.image(url)
	  ]
    let msgRes =await e.reply(msg);
    Chehui(msgRes,e)//调用撤回方法
    return true; //返回true 阻挡消息不再往下
}
export async function bh3(e) {   
  let url = `http://25252.xyz/bh3/index.php`;
  let msg=[segment.at(e.user_id),	  
	  segment.image(url)
	  ]
    let msgRes =await e.reply(msg);
    Chehui(msgRes,e)//调用撤回方法
    return true; //返回true 阻挡消息不再往下
}
export async function se(e) {   
  let url = `http://25252.xyz/se/index.php`;
  let msg=[segment.at(e.user_id),	  
	  segment.image(url)
	  ]
    let msgRes =await e.reply(msg);
    Chehui(msgRes,e)//调用撤回方法
    return true; //返回true 阻挡消息不再往下
}
export async function kt2(e) {   
  let url = `https://yang520.ltd/api/tu.php`;
  let response = await fetch(url);
     let res = await response.text();
 

	  e.reply(segment.image(res));
   
    return true; //返回true 阻挡消息不再往下
}
export async function 小黑子(e) {
    if (!e.isMaster) {
    return true
  }
    if (e.isGroup) {
          source = (await e.group.getChatHistory(e.source ?.seq, 1)).pop()
        }else{
          source = (await e.friend.getChatHistory((e.source ?.time + 1), 1)).pop()
    }
    let imageMessages = []
    if (source) {
          for (let val of source.message) {
            if (val.type === 'image') {
              imageMessages.push(val.url)
            }else if (val.type === 'xml') {
             let resid = val.data.match(/m_resid="(.*?)"/)[1]
              if (!resid) break
              let message = await Bot.getForwardMsg(resid)
              for (const item of message) {
                for (const i of item.message) {
                  if (i.type === 'image') {
                    imageMessages.push(i.url)
                  }
                }
          }      
        }
      }
    }else{
        imageMessages = e.img
    }
    if (!imageMessages.length) return e.reply('未发现图片，请与消息一同发送或引用该图片')
    try{
        let savePath
        let File
        if(!fs.existsSync(小黑子_path)) fs.mkdirSync(小黑子_path)
        for (let i = 0; i < imageMessages.length; i++) {
            File = fs.readdirSync(小黑子_path)
            savePath = `${小黑子_path}${File.length + 1}.jpg`
            await co.downFile(imageMessages[i], savePath)
          }
          e.reply(`小黑子上传成功${imageMessages.length}张`)
        } catch (err) {
          logger.error(err)
          e.reply('上传失败')
        }
        return true
}