import fetch from "node-fetch";                  
import fs from "fs";
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
//项目路径
const _path = process.cwd();
const schedule = require('node-schedule');

// 每日答题次数文件目录：落在 Yunzai 根 data 下，与猜角色排行等数据同位置
const QA_DIR = path.join(_path, 'data', 'randomQA');
// 目录只在这里和零点重置时创建，其余读写前一律先调本函数
const ensureQaDir = () => fs.mkdirSync(QA_DIR, { recursive: true });
ensureQaDir();

const scheduleCronstyle = ()=>{
  //每天重置可答题次数:
    schedule.scheduleJob('0 0 0 * * *',()=>{
	//console.log("重置问答次数");
	// rmSync 带 force 时不存在的目录不会抛错，无需先判存在
	fs.rmSync(QA_DIR, { recursive: true, force: true });
	ensureQaDir();
    });
  }
scheduleCronstyle();


//简单应用示例

//1.定义命令规则
export const rule = {
    randomQA: {
    reg: "^#?(榴莲|留恋|芒果)问答$", //匹配消息正则，命令正则
    priority: 2202, //优先级，越小优先度越高
    describe: "【#竞猜】「派蒙的十万个为什么」题库", //【命令】功能说明
  },
  answerCheck: {
      reg: "^(?!#).*",  // 匹配所有非命令消息
      priority: 5,
      describe: "",
  },};

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
const qaFile = path.join(QA_DIR, `${e.user_id}.txt`);

if (QAtype ==0 && !e.isGroup){
	e.reply('#芒果/留恋问答 只能的群里进行，去群里和小伙伴们一起玩耍吧!');
	return true;
}


// 当天首次答题时文件尚未建立，同步判定后再写，避免读到尚未落盘的状态
ensureQaDir();
if (fs.existsSync(qaFile)) {
  console.log(e.user_id.toString() + '的答题日志文件已存在，跳过创建');
} else {
  fs.writeFileSync(qaFile, dayNumQA, 'utf-8');
}


    
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


  var maxnum = fs.readFileSync(qaFile,'utf-8');//读取日志文件
  if (maxnum.toString() == "0") {
      e.reply(`每天只能进行${dayNumQA}次知识竞猜哦，请明天再来！`);
      return true;
    }
  maxnum = maxnum - 1;
  fs.writeFileSync(qaFile, maxnum.toString());



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
    
    // 如果游戏未开始，直接返回，不处理
    if (!gameing) {
      return false;
    }
    
    // 检查用户答案是否正确
    if (current.indexOf(e.msg) != -1) {
      e.reply(['恭喜你答对了！'], true);
      guessConfig.gameing = false;
      clearTimeout(guessConfig.timer)
      return true;
    }
    
    return false;
  }
