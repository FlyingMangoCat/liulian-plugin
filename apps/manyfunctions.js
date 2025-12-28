import fetch from "node-fetch";
import fs from 'fs';
import path from 'path';
import moment from 'moment';
import lodash from "lodash";
import config from "../model/config/config.js"

// 安全获取segment对象
const segment = global.segment || global.Bot?.segment || {}
const cfg = config.getdefault_config('liulian', 'botname', 'config');
  const botname = cfg.botname
let godeye = true;
let headPortrait = true;
let url = "http://api.dlut-cc.live/imgur?num=1";
let _url = "https://iw233.cn/api.php?sort=random";
let sum = 99999; //这里记录涩图/老婆总次数 也就是每天可查询次数接口分开算
const _path = process.cwd();
const __dirname = path.resolve();
export const rule = {
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
    reg: "^[^-]*(讲个笑话|讲笑话|来个笑话)$", // 只匹配以括号里面结尾的 例如 讲个笑话或 派蒙讲个笑话，同上
    priority: 10, //优先级，越小优先度越高
    describe: "笑话", //【命令】功能说明
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
  早报: {
    reg: "^#*早报$", //匹配消息正则，命令正则
    priority: 100, //优先级，越小优先度越高
    describe: "【#例子】开发简单示例演示", //【命令】功能说明
  },
  xzys: {
    reg: "^#?.*座运势$", //匹配消息正则，命令正则
    priority: 5, //优先级，越小优先度越高
    describe: "【水瓶运势】开发简单示例演示", //【命令】功能说明
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
  saylove: {
    reg: "^[^-]*(每日单词|word|单词)$", //匹配消息正则，命令正则
    priority: 1, //优先级，越小优先度越高
    describe: "每日单词", //【命令】功能说明
  },
};

export async function dutang(e) {
  let url = "https://api.oick.cn/dutang/api.php";
  let response = await fetch(url);
  let res = await response.json(); //结果json字符串转对象
  let msg = [
    segment.at(e.user_id),"\n",res,
  ];
  //发送消息
  e.reply(msg);
  return true; //返回true 阻挡消息不再往下
}
export async function caihongpi(e) {
  let url = "http://api.tianapi.com/caihongpi/index?key=947a91d78155a584a19c69b1ce50dd99";
  let response = await fetch(url);
  let res = await response.json(); //结果json字符串转项
  let msg = [
    segment.at(e.user_id),"\n",res.newslist[0].content,
  ];
  //发送消息
  e.reply(msg);
  return true; //返回true 阻挡消息不再往下
}
export async function saylove(e) {
  let url = "http://api.tianapi.com/saylove/index?key=947a91d78155a584a19c69b1ce50dd99";
  let response = await fetch(url);
  let res = await response.json(); //结果json字符串转对象
  let msg = [
    segment.at(e.user_id),"\n",res.newslist[0].content,
  ];
  //发送消息
  e.reply(msg);
  return true; //返回true 阻挡消息不再往下
}
export async function joke(e) {
  let url = "http://api.tianapi.com/joke/index?key=947a91d78155a584a19c69b1ce50dd99&num=1";
  let response = await fetch(url);
  let res = await response.json(); //结果json字符串转对象
  let msg = [
    segment.at(e.user_id),"\n",res.newslist[0].title,"\n",
    res.newslist[0].content,
  ];
  //发送消息
  e.reply(msg);
  return true; //返回true 阻挡消息不再往下
}
export async function dog(e) {
  let url = "https://api.oick.cn/dog/api.php";
  let response = await fetch(url);
  let res = await response.json(); //结果json字符串转对象
  let msg = [
    segment.at(e.user_id),"\n",
    res,
  ];
  //发送消息
  e.reply(msg);
  return true; //返回true 阻挡消息不再往下
}

export async function weather(e) {
    
  //e.msg 用户的命令消息
  let keyword = e.msg.replace("#","");
  keyword = keyword.replace("天气","");
  console.log(keyword);
   const cfg = config.getdefault_config('liulian', 'token', 'config');
  const token = cfg.token
  let url = `https://v2.alapi.cn/api/tianqi?token=${token}&city=${keyword}`;
  let response = await fetch(url);
  let res = await response.json(); //结果json字符串转对象
       let msg = [
"城市：",res.data.city,
"\n","省份：",res.data.province,
"\n","更新时间：",res.data.update_time,
"\n","天气：",res.data.weather,
"\n",//"空气质量：",res.data.air, res.data.aqi.air_level,
"\n","当前温度：",res.data.temp,"℃",
"\n","最高温度：",res.data.max_temp,"℃",
"\n","最低温度：",res.data.min_temp,"℃",
"\n","风向：",res.data.wind,
"\n","风力：",res.data.wind_speed,
"\n","风速：",res.data.wind_scale,
"\n","降雨：",res.data.rain,
"\n","湿度：",res.data.humidity,
"\n","能见度：",res.data.visibility,
"\n","气压：",res.data.pressure,
"\n","车辆限制：",res.data.tail_number,
"\n","预警情况：",res.data.alarm,
"\n",`${botname}提示您：今日`,res.data.aqi.air_tips,
  ];
if (res.code == 429) {
    e.reply (`⚠️接口错误，请重试`);
    return false
     }
  e.reply(msg);
  }

export async function 早报(e) {
const cfg = config.getdefault_config('liulian', 'token', 'config');
  const token = cfg.token
   let url = `https://v2.alapi.cn/api/zaobao?token=${token}&format=image`;
//https://admin.alapi.cn/account/center
  let msg = [

    segment.image(url),

  ];
  
  e.reply(msg);

  return true;
}

export async function xzys(e) {
    
  //e.msg 用户的命令消息
  let keyword = e.msg.replace("#","");
  keyword = keyword.replace("运势","");
  console.log(keyword);
  
  if(keyword == `白羊` || keyword == `白羊座`){
       let msg = [
    //@用户
    segment.at(e.user_id),
    
    segment.image(`http://xiaoapi.cn/API/xzys_pic.php?msg=%E7%99%BD%E7%BE%8A%E5%BA%A7`),
  ];

  e.reply(msg);
  }
  
 else if(keyword == `金牛` || keyword == `金牛座` ){
       let msg = [
    //@用户
    segment.at(e.user_id),
    
    segment.image(`http://xiaoapi.cn/API/xzys_pic.php?msg=%E9%87%91%E7%89%9B%E5%BA%A7`),
  ];

  e.reply(msg);
  
  }
  
else  if(keyword == `双子` || keyword == `双子座` ){
       let msg = [
    //@用户
    segment.at(e.user_id),
    
    segment.image(`http://xiaoapi.cn/API/xzys_pic.php?msg=%E5%8F%8C%E5%AD%90`),
  ];

  e.reply(msg);
  
  }
  
else  if(keyword == `巨蟹` || keyword == `巨蟹座` ){
       let msg = [
    //@用户
    segment.at(e.user_id),
    
    segment.image(`http://xiaoapi.cn/API/xzys_pic.php?msg=%E5%B7%A8%E8%9F%B9`),
  ];

  e.reply(msg);
  
  }
  
else if(keyword == `狮子` || keyword == `狮子座` ){
       let msg = [
    //@用户
    segment.at(e.user_id),
    
    segment.image(`http://xiaoapi.cn/API/xzys_pic.php?msg=%E7%8B%AE%E5%AD%90`),
  ];

  e.reply(msg);
  
  }
  
else   if(keyword == `处女` || keyword == `处女座` ){
       let msg = [
    //@用户
    segment.at(e.user_id),
    
    segment.image(`http://xiaoapi.cn/API/xzys_pic.php?msg=%E5%A4%84%E5%A5%B3`),
  ];

  e.reply(msg);
  
  }
  
else  if(keyword == `天秤` || keyword == `天秤座` ){
       let msg = [
    //@用户
    segment.at(e.user_id),
    
    segment.image(`http://xiaoapi.cn/API/xzys_pic.php?msg=%E5%A4%A9%E7%A7%A4`),
  ];

  e.reply(msg);
  
  }
  
  
else  if(keyword == `天蝎` || keyword == `天蝎座` ){
       let msg = [
    //@用户
    segment.at(e.user_id),
    
    segment.image(`http://xiaoapi.cn/API/xzys_pic.php?msg=%E5%A4%A9%E8%9D%8E`),
  ];

  e.reply(msg);
  
  }
  
else  if(keyword == `射手` || keyword == `射手座` ){
       let msg = [
    //@用户
    segment.at(e.user_id),
    
    segment.image(`http://xiaoapi.cn/API/xzys_pic.php?msg=%E5%B0%84%E6%89%8B`),
  ];

  e.reply(msg);
  
  }
  
 else if(keyword == `摩羯` || keyword == `摩羯座` ){
       let msg = [
    //@用户
    segment.at(e.user_id),
    
    segment.image(`http://xiaoapi.cn/API/xzys_pic.php?msg=%E6%91%A9%E7%BE%AF`),
  ];

  e.reply(msg);
  
  }
  
 else if(keyword == `水瓶` || keyword == `水瓶座` ){
       let msg = [
    //@用户
    segment.at(e.user_id),
    
    segment.image(`http://xiaoapi.cn/API/xzys_pic.php?msg=%E6%B0%B4%E7%93%B6`),
  ];

  e.reply(msg);
  
  }
  
  
 else if(keyword == `双鱼` || keyword == `双鱼座` ){
       let msg = [
    //@用户
    segment.at(e.user_id),
    
    segment.image(`http://xiaoapi.cn/API/xzys_pic.php?msg=%E5%8F%8C%E9%B1%BC`),
  ];

  e.reply(msg);
  
  }else
   {
       e.reply(`请输入正确的星座名称！`);
   }

  return true; //返回true 阻挡消息不再往下
}

export async function headPortraitFUN(e) {
  if (!e.isGroup||!headPortrait) return false;
  if (e.msg.match('自己')) {
    e.reply(segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${e.user_id}`))
    return true
  }
  if (!e.at) {
    e.reply("发送看头像@xx，可以快捷查看ta的头像哦~")
    return true
  }
  e.reply(segment.image(`https://q1.qlogo.cn/g?b=qq&s=0&nk=${e.at}`))
  return true;
}
export async function godEyesFUN(e) {
  if (!godeye) return false;
  if (!e.msg.match('自己') && !e.at) {
    e.reply("发送神之眼@xx，或者神之眼自己，可以查看ta的和你的神之眼哦~")
    return true
  }
  var dic = {
    0: "https://gchat.qpic.cn/gchatpic_new/1761869682/1023102458-2849443945-C7F8992AD44A89FD12E043C97F9B4B3F/0?term=3",//火神之眼图片
    1: "https://gchat.qpic.cn/gchatpic_new/1761869682/1023102458-3000881371-7B8A998923FA5A50E85559A15EEED082/0?term=3",//水神之眼图片
    2: "https://gchat.qpic.cn/gchatpic_new/1761869682/1023102458-3197120511-DB03E53C7279DB17DA7BA46D3F8B930C/0?term=3",  //冰神之眼图片
    3: "https://gchat.qpic.cn/gchatpic_new/1761869682/1023102458-2895037012-DE3813A9147D4D9820B76677B61BDF91/0?term=3",//风神之眼图片
    4: "https://gchat.qpic.cn/gchatpic_new/1761869682/1023102458-2995945814-9E11498825D98086AA1C5EDC5E8B224B/0?term=3",//雷神之眼图片
    5: "https://gchat.qpic.cn/gchatpic_new/1761869682/1023102458-3164811676-0F706954315979715490227CC653F8EA/0?term=3",//草神之眼图片
    6: "https://gchat.qpic.cn/gchatpic_new/1761869682/1023102458-3113929476-4E53C2897724F4FA9DE12EF128A17634/0?term=3"//岩神之眼图片
  }
  var dic2 = { 0: "火", 1: "水", 2: "冰", 3: "风", 4: "雷", 5: "草", 6: "岩" }
  let qq = 0;
  let name = "";
  if (e.msg.match('自己')) {
    qq = e.user_id * 1;
    name = e.sender.card;
  } else if (e.at) {
    qq = e.at * 1
    let member = await Bot.getGroupMemberInfo(e.group_id, e.at).catch((err) => { })
    name = member.nickname
  } else return true;
  let type = qq % 7;
  let msg = [
    `${name}的神之眼是${dic2[type]}属性哦`,
    segment.image(dic[type])
  ]
  e.reply(msg)
  return true; 
}

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

export async function dailyword(e) {
  let url = "http://api.tianapi.com/everyday/index?key=d95080931b673b052e060c26a749276b";
  let response = await fetch(url);
  let res = await response.json(); //结果json字符串转对象
  let msg = [
    segment.at(e.user_id),"\n",
    '四十秒时间翻译:   '+res.newslist[0].content,
	//res.newslist[0].note,
  ];
  //发送消息
  //e.reply(msg);
  let timeout = 40000; //40秒后翻译
  let msgRes = await e.reply(msg);
  if (timeout!=0 && msgRes && msgRes.message_id){
    let target = null;
    if (e.isGroup) {
      target = e.group;
    }else{
      target = e.friend;
    }
    if (target != null){
      setTimeout(() => {
        let msg2 = ['答案:  '+res.newslist[0].note,];
		e.reply(msg2);
      }, timeout);
    }
  }  
  return true; //返回true 阻挡消息不再往下
}
//单词
export async function sentence(e) {
  let url = "http://api.wordnik.com:80/v4/words.json/randomWords?hasDictionaryDef=true&minCorpusCount=0&minLength=5&maxLength=15&limit=1&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5";
  let response = await fetch(url);
  let res = await response.json(); //结果json字符串转对象
  let msg = [
    //segment.at(e.user_id),"\n",
    //date.format("yyyy年MM月dd日 "),ress.data.forecast[0].type,"\n",
    "henry目前还没有判定您的答案是否正确的功能，请自行判断：","\n","\n",'10秒后公布答案：  ',"\n","\n","单词：",
	res[0].word,
  ];
  //发送消息
  //e.reply(msg);
  let urln = `https://api.vvhan.com/api/fy?text=${res[0].word}`;
  let responsen = await fetch(urln);
  let resn = await responsen.json(); //结果json字符串转对象
  let msgn = [
    //segment.at(e.user_id),"\n",
    '公布答案：  ',"\n","\n","\n","单词：",
	resn.data.fanyi,
  ];
  
  let timeout = 5000; //5秒后翻译
  let msgRes = await e.reply(msg);
  if (timeout!=0 && msgRes && msgRes.message_id){
    let target = null;
    if (e.isGroup) {
      target = e.group;
    }else{
      target = e.friend;
    }
    if (target != null){
      setTimeout(() => {
          //发送消息
		e.reply(msgn);

      }, timeout);
    }
  }


  return true; //返回true 阻挡消息不再往下
}