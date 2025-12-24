import fetch from "node-fetch";
import path from 'path';
import fs from 'fs';

/**
 * 带话给主人 支持文字、图片、以及表情
 * 例如#广播 群号（可多个用,隔开）内容123456 or  #广播默认内容xxx
 * 
 */
let time = 1; //缓存删除规则单位分钟 不建议写0会出现未知数据冗余 
let qq_ = []; //需要推送的qq号  不填会默认推送给主人 多个请用 ,隔开
let qqGroup = [790621765,826193914,658720198]; //默认需要推送的群多个请用 ,隔开

//定义命令规则
export const rule = {
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
	}
};
// 
export async function daihua(e) {
var msg = e.msg.replace("带话", ""); 
	var data_msg = [];
	let data = await redis.get(`Yunzai:setlinshimsg:${e.user_id}_daihua`); 
	var new_sum = 1;
	if (data) {
		 if (JSON.parse(data)[0].num == sum) {
		e.reply(`话已经传到了，请等待${time}分钟后再可以传话~`)
		return;
		}
		new_sum += JSON.parse(data)[0].num; //次数累加
	}
	for (let val of e.message) {
		 console.log("用户消息内容类型为：",val)
		switch (val.type) {
			case "text": 
				data_msg.push(val.text.replace("带话", ""))
				break;
			case "face": 
				data_msg.push(segment.face(val.id))
				break;
			case "image": 
				if (!e.img) {
					break;
				}
				data_msg.push(segment.image(val.url))
				break;
			case "at": 
				data_msg.push(segment.at(val.qq))
				break;
		}
	}

	redis.set(`Yunzai:setlinshimsg:${e.user_id}_daihua`, 1, { 
		EX: parseInt(60 * time)
	});
	data_msg.unshift(`群${e.group_name}(${e.group_id}),用户： ${e.sender.nickname}(${e.user_id})给主人带话>`)
	if (!data_msg) { 
		return false
	}
	if (qq_.length == 0) { 
		Bot.pickUser(BotConfig.masterQQ[0]).sendMsg(data_msg) //指定给单个人带话
	} else {
		for (let i of qq_) { 
			let userId = i
			Bot.pickUser(userId).sendMsg(data_msg)
		}
	}

	 for (let i of BotConfig.masterQQ) { //这里定义发送给所有主人
	 	let userId = i
	 	Bot.pickUser(userId).sendMsg(data_msg)
	 }

	e.reply("已经带话给主人~")
	return true
}
let count=0;
export async function guangbo(e) {
	if (!e.isMaster) {
		e.reply(`只有主人才能命令榴莲哦~\n(*/ω＼*)"`)
		return true;
	}
	count=0
	var msg = e.msg.split("内容")[1];
	if (!msg) { //判断为空时跳出
		return false
	}
	var qq_Group = e.msg.match(/(\d+)/g); //匹配全局拿出全部的QQ群号
	if (e.msg.indexOf("默认") >= 0 && qqGroup.length != 0) { //当文本出现默认群号的时候
		for (var i = 0; i < qqGroup.length; i++) {
			var qq_dq = qqGroup[i];
			// await setTimeout(() => { //间隔多久推送一次消息
			// Bot.pickGroup(Number(qq_dq)).sendMsg(msg)
			sendMsg(qq_dq, msg)
			// }, 1000 * 30) //定时多少分钟执行 这里的单位是毫秒1000*60=1分钟
		}
	} else { //否便渲染输入的群号
let qq_Group = qqGroup
		if (!qq_Group) {
			e.reply("请确认正确配置默认广播群号或输入正确指令\n例如：#广播123456内容114514等")
			return false;
		}
		for (var i = 0; i < qq_Group.length; i++) {
			var qq_dq = qq_Group[i]
			sendMsg(qq_dq, msg)
		}
	}
	return true;
	// 
}

async function sendMsg(qq, msg) {
	count++;  //这行代码放在方法结尾第一次是秒触发 放方法开头是指定时间
	// console.log(count)
	setTimeout(() => { //间隔多久推送一次消息
		Bot.pickGroup(Number(qq)).sendMsg(msg)
	}, 10000 * count) //定时多少分钟执行 这里的单位是毫秒1000*60=1分钟 count是代表第几个群请勿删除
}

// 群广播帮助功能
export async function guangboHelp(e) {
	let helpMsg = `📢 榴莲群广播使用帮助

🔧 功能说明：
群广播功能可以让机器人在指定群组发送消息，仅限管理员使用。

📝 使用方法：

1️⃣ 广播到默认群组：
   #广播默认内容[你的消息内容]

2️⃣ 广播到指定群组：
   #广播[群号]内容[你的消息内容]

3️⃣ 广播到多个群组：
   #广播[群号1,群号2,群号3]内容[你的消息内容]

💡 使用示例：
• #广播默认内容大家好，这是一条测试消息
• #广播123456内容通知：今晚8点有活动
• #广播123456,789012内容重要通知请查收

⚙️ 功能特性：
• 支持文本消息广播
• 支持多个群组同时广播（用逗号分隔群号）
• 自动延时发送，每个群间隔10秒
• 仅管理员可使用，确保安全性

🔒 权限要求：
• 只有管理员（master）才能使用群广播功能
• 非管理员用户尝试使用会收到权限提示

💬 带话功能：
• 命令：带话[消息内容]
• 功能：给机器人主人发送消息
• 支持文字、图片、表情等

如有问题请联系管理员~`;
	
	e.reply(helpMsg);
	return true;
}

