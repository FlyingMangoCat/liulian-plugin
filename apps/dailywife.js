import {
	segment
} from "oicq";
import fetch from "node-fetch";
import fs from 'fs';
import path from 'path';
import moment from 'moment';
//项目路径
const _path = process.cwd();
const __dirname = path.resolve();
//感谢@菜狗大佬提供的接口 
let url = "http://api.dlut-cc.live/imgur?num=1";
//二次元接口
let _url = "https://iw233.cn/api.php?sort=random";

let sum = 99999; //这里记录总次数 也就是每天可查询次数接口分开算
/**
 * 每天限制色图一次(混图有18+也可能没有)
 * 每天凌晨4点刷新 如需改规则请自行修改
 */

//定义命令规则
export const rule = {
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

};

export async function setu(e) {
	let data = await redis.get(`Yunzai:setlinshimsg:${e.user_id}`); //先获取这个逼 看看他今天有没有色色
	console.log(data)
	var new_sum = 1;
	if (data) {
		if (JSON.parse(data)[0].num >= sum) {
			e.reply(`你今天已经抽过${sum}份色图了请明天再来~`)
			return;
		}
		new_sum += JSON.parse(data)[0].num; //次数累加
	}
	let response = await fetch(url);
	let res = await response.json();
	console.log(res.urls[0])
	
	let msg = [
		segment.at(e.user_id), "今日份色图:",
	];
	var time = moment(Date.now()).add('days', 1).format('YYYY-MM-DD 04:00:00')
	var new_date = (new Date(time).getTime() - new Date().getTime()) / 1000 / 60 //获取隔天凌晨四点的时间差
	let redis_data = [{
		num: new_sum, //次数
		// url:res.urls[0], 抽出的色图
	}]
	console.log(redis_data)
	redis.set(`Yunzai:setlinshimsg:${e.user_id}`, JSON.stringify(redis_data), { //把色图链接写入缓存防止一直色色
		EX:  parseInt(new_date)
	});
	//发送消息
	e.reply(msg);
	e.reply(segment.flash(res.urls[0])) //太色了改成闪照方式发送
	return true; //返回true 阻挡消息不再往下
}

export async function lp(e) {
	let data = await redis.get(`Yunzai:setlinshimsg:${e.user_id}_lp`); //先获取这个逼 看看他今天有没有色色
	var new_sum = 1;
	if (data) {
		if (JSON.parse(data)[0].num >= sum) {
			e.reply(`你今天已经抽过${sum}位老婆了请明天再来~`)
			return;
		}
		new_sum += JSON.parse(data)[0].num; //次数累加
	}
	// let response = await fetch(url);
	// let res = await response.json();
	// console.log(res.urls[0])
	let msg = [
		segment.at(e.user_id), "今日份老婆:",
		segment.image(_url)
	];
	var time = moment(Date.now()).add('days', 1).format('YYYY-MM-DD 04:00:00')
	var new_date = (new Date(time).getTime() - new Date().getTime()) / 1000 / 60 //获取隔天凌晨四点的时间差
	let redis_data = [{
		num: new_sum, //次数
	}]
	console.log(redis_data)
	redis.set(`Yunzai:setlinshimsg:${e.user_id}_lp`, JSON.stringify(redis_data), { //把色图链接写入缓存防止一直色色
		EX: parseInt(new_date)
	});
	//发送消息
	e.reply(msg);
	// e.reply(segment.flash(res.urls[0])) //太色了改成闪照方式发送
	return true; //返回true 阻挡消息不再往下
}
