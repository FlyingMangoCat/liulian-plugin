import { segment } from "oicq";
import fetch from "node-fetch";

//项目路径
const _path = process.cwd();

//简单应用示例
// api 地址 https://www.tianapi.com/ 建议key 换成自己的
//1.定义命令规则
export const rule = {
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

//句子
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
export async function joke(e) {
  let url = "https://v2.alapi.cn/api/fanyi?q=hello&from=en&to=zh&token=LwExDtUWhF3rH5ib";
  let response = await fetch(url);
  let res = await response.json(); //结果json字符串转对象
  let msg = [
    segment.at(e.user_id),"\n",
    res.data.dst,
	"目前已取消这个功能",
  ];
  //发送消息
  e.reply(msg);
  return true; //返回true 阻挡消息不再往下
}
