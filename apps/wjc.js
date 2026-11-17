//项目路径
const _path = process.cwd();
import { isGroupWhite, isUserBlack } from "../model/bwConfig.js"
let hit = ['让你瞎逼逼!','让你涩涩!', '让你骂人!', '让你色色!', '让你胡说!', '让你说话!', '让你违规!', '让你xx!', 'དཔེཔཟོ!', 'دكېبدڭ!'];
let MuteTime = 60;
export const rule = {
    wjc: {
        reg: "(傻逼|淦|你妈|卧槽|woc|wocpro)", //可修改，用"|"隔开即可
        priority: 10, //优先级，越小优先度越高
        describe: "违禁词", //【命令】功能说明
    },

};

export async function wjc(e) {
 if (!isGroupWhite('wjc', e.group_id)) {
		return;
  }
  if (isUserBlack('wjc', e.user_id)) {
		return;
  }
	let random = Math.round(Math.random() * 9);//随机生成 0-9 
	let msg;
 	msg = [
   		segment.at(e.user_id),
    	 	"\n正在吟唱，准备施法！"
  	];
  	e.reply(msg); //发送消息
  	await sleep(2000) //延时
	
    for (let i = 0; i <= random; i++) {
  		e.reply(hit[i]);
		e.group.muteMember(e.user_id, MuteTime*(i+1)); 
		await sleep(2000); 
	}
        return true; //返回true 阻挡消息不再往下
   
}



function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
