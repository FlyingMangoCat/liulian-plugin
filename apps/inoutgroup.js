import { segment } from "oicq";
import fetch from "node-fetch";
const _path = process.cwd();

let ru = true //开启入群欢迎
let tui = true //开启主动退群提示
let ti = true  //开启管理员踢人提示

Bot.on("notice.group", (e) => {
    CeShi(e);
});

//1.定义命令规则
export const rule = {
	CeShi: {
		reg: "noCheck", //匹配消息正则，命令正则
		priority: 5000, //优先级，越小优先度越高
		describe: '检测进群退群消息', //【命令】功能说明
	},
};


export async function CeShi(e) {
	//检测是否为群 console.log()
	if (!e.isGroup) {
		return
	}
	let a = e.sub_type
	//入群判定
	if (a == "increase") {
		let msg = [
      segment.at(e.user_id) , '欢迎新人！ 我是本群的机器人 如果有什么需要帮忙的 可以发送 #帮助'
  ];
		await e.reply(msg)
		return true
	//退群判定
	} else if (a == "decrease") {
		//判断是否为主动退群
		if (e.operator_id == e.user_id && tui){
			let msg = [
				e.member.nickname , 
				'[' , String(e.user_id) , ']' , 
				' 因为抽卡必歪，气的退出了群聊...' 
			]
			await e.reply(msg)
			return true
		} else if (ti) {
			let msg = [e.member.nickname , 
				'[' , String(e.user_id) , ']' , 
				' 因为触犯了群规，被管理员 '  , 
				 segment.at(e.operator_id) , 
				' 移出了群聊...' 
			]
			await e.reply(msg)
			return true
		}
		
		
	}


	return ; //返回true 阻挡消息不再往下
}