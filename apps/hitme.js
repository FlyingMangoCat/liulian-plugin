import { segment } from "oicq";

//项目路径
const _path = process.cwd();

let hit = ['一拳!','两拳!', '三拳!', '四拳!', '五拳!', '六拳!', '七拳!', '八拳!', '九拳!', '十拳!'];
let MuteTime = 60;
export const rule = {
    HitMe: {
        reg: "#打我", //匹配消息正则，命令正则
        priority: 1000, //优先级，越小优先度越高
        describe: "【#禁言自己1-10次】", //【命令】功能说明
    },

};

export async function HitMe(e) {
    
	let random = Math.round(Math.random() * 9);//随机生成 0-9 
	let msg;
 	msg = [
   		segment.at(e.user_id),
    	 	"\n今天的人品是【",
		 (random+1).toString(),
		"】，让可心满足你！"
  	];
  	
  	e.reply(msg); //发送消息
  	await sleep(2000) //延时
	
    for (let i = 0; i <= random; i++) {
  		e.reply(hit[i]);
		e.group.muteMember(e.user_id, MuteTime*(i+1)); 
		await sleep(2000); 
	} 
	
        
        e.reply (`够了吗！`); //发送消息

        return true; //返回true 阻挡消息不再往下

   
}



function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
