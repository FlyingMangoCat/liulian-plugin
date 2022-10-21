import { segment } from "oicq";                   
import fetch from "node-fetch";                  
import { createRequire } from "module";
const require = createRequire(import.meta.url);
//项目路径
const _path = process.cwd();
const schedule = require('node-schedule');
const scheduleCronstyle = ()=>{
  //每天重置可答题次数:
    schedule.scheduleJob('0 0 0 * * *',()=>{
	//console.log("重置问答次数");  
        var fs = require('fs');
 	fs.rmdirSync('plugins/liulian-plugin/apps/randomQA/',{recursive:true});
	fs.mkdirSync('plugins/liulian-plugin/apps/randomQA/',{recursive:true});
    });
  }
scheduleCronstyle();


//简单应用示例

//1.定义命令规则
export const rule = {
    randomQA: {
    reg: "^#?(榴莲问答|芒果问答|派蒙问答)$", //匹配消息正则，命令正则
    priority: 2202, //优先级，越小优先度越高
    describe: "【#竞猜】「派蒙的十万个为什么」题库", //【命令】功能说明
  },
  answerCheck: {
    reg: "noCheck",
    priority: 5,
    describe: "",
  },
};

//2.编写功能方法
//方法名字与rule中的examples保持一致
//测试命令 npm test 例子
export async function randomQA(e) {
  //e.msg 用户的命令消息
  console.log("用户命令：", e.msg);

  let guessConfig = getGuessConfig(e)
  if (guessConfig.gameing) {
    e.reply('问答游戏正在进行哦!');
    return true;
  }


//console.log(e.user_id);

var dayNumQA = "999";                              //每日问答次数设置，设置后请重启Yunzai-bot
var QAtype = 0;                                  //设置是否开启私聊使用，1-开启 0-关闭，默认关闭
var QAurl="plugins/liulian-plugin/apps/randomQA/"+e.user_id+".txt";

if (QAtype ==0 && !e.isGroup){
	e.reply('#派蒙/芒果/榴莲问答 只能的群里进行，去群里和小伙伴们一起玩耍吧!');
	return true;
}


var fs = require('fs');
fs.access(QAurl.toString(), fs.constants.R_OK, (err) => { 
  if (err) 
  fs.writeFileSync(QAurl.toString(), dayNumQA, 'utf-8');

  else
    console.log(e.user_id.toString()+'的答题日志文件已存在，跳过创建'); 

}); 


    
  //执行的逻辑功能
  let url = "https://wiki.biligame.com/ys/%E3%80%8C%E6%B4%BE%E8%92%99%E7%9A%84%E5%8D%81%E4%B8%87%E4%B8%AA%E4%B8%BA%E4%BB%80%E4%B9%88%E3%80%8D%E9%A2%98%E5%BA%93"; //一言接口地址
  let response = await fetch(url); //调用接口获取数据
  let res = await response.text(); //结果json字符串转对象
  res = res.replace(/\r|\n/g,"");
  let reg = /<td>(.*?)<\/td>/g
  let listtbody = res.match(reg);
  let listQ = [];
  let listA = [];
  // console.log(res);
  for (const key in listtbody) {
      if (key % 2 == 0) {
          listQ.push(listtbody[key].replace(/<td>|<\/td>/g,""))
      }else{
          listA.push(listtbody[key].replace(/<td>|<\/td>/g,""))
      }
  }

  let condition = ["下列","以下","关于风魔龙"];

  for (var i = 0;i < listQ.length;i++) {
    let tempstr = listQ[i];
    if (condition.find(item => tempstr.includes(item))) {
      listQ.splice(i,1);
      listA.splice(i,1);
      i --;
    }
  }

  let randomQA = Math.round(Math.random() * (listQ.length - 1))
  console.log(listQ.length,":",randomQA);
  console.log(listQ);
  let randomQ = listQ[randomQA];
  let randomA = listA[randomQA];
  console.log(randomQ);
  console.log(randomA);


  var maxnum = fs.readFileSync(QAurl.toString(),'utf-8');//读取日志文件
  if (maxnum.toString() == "0") {
      e.reply(`每天只能进行${dayNumQA}次知识竞猜哦，请明天再来！`);
      return true;
    }
  maxnum = maxnum - 1;
  fs.writeFile(QAurl.toString(), maxnum.toString() , function(err) {
    	if(err) {
        		return console.log(err);
    		}
  });



  e.reply(randomQ);

  guessConfig.gameing = true;
  guessConfig.current = null;

  setTimeout(() => {
    guessConfig.current = randomA;

    guessConfig.timer = setTimeout(() => {
      if (guessConfig.gameing) {
        guessConfig.gameing = false;
        e.reply('很遗憾，还没有人答对哦，正确答案是：' + guessConfig.current);
      }
    }, 60000)
  }, 1500)

  return true; //返回true 阻挡消息不再往下
}

const guessConfigMap = new Map()

function getGuessConfig(e) {
    let key = e.message_type + e[e.isGroup ? 'group_id' : 'user_id'];
    let config = guessConfigMap.get(key);
    if (config == null) {
      config = {
        gameing: false,
        current: '',
        timer: null,
      }
      guessConfigMap.set(key, config);
    }
    return config;
  }

export async function answerCheck(e) {
    let guessConfig = getGuessConfig(e);
    
    let { gameing, current } = guessConfig;
    if (gameing && current.indexOf(e.msg) != -1) {
      e.reply(['恭喜你答对了！'], true);
      guessConfig.gameing = false;
      clearTimeout(guessConfig.timer)
      return true;
    }
  }
