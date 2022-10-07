import { segment } from "oicq";
import fetch from "node-fetch";
//#看腿1
//#看腿2
//#原神
//#崩坏3
//#明日方舟
//#碧蓝航线
//#蔚蓝档案
//#FGO
//#7d
//#少女前线
//#公主连接
//#miku
//#涩涩一下
let timeout = 99999; //0表示不撤回，单位毫秒，默认30s。
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
  let url = `http://25252.xyz/j/index.php`;
  let msg=[segment.at(e.user_id),	  
	  segment.image(url)
	  ]
    let msgRes =await e.reply(msg);
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