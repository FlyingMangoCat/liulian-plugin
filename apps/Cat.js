import fetch from "node-fetch";
import schedule from "node-schedule";
import moment from "moment";
import fs from "fs";
import { promisify } from "util";
import { pipeline } from "stream";

//如果报错请删除Yunzai/data/目录中susu文件夹，并将redis中键为Yunzai:setlinshimsg:xxxxxxxx_cat的值删除（此问题一般是因为今天已经抱过猫猫所导致的，xxxxxxxx为你的QQ号），重启机器人

var dirpath = "data/susu/";//文件夹路径
var filename = `cat`;//文件名
var Defaultnumberofcats = 10//默认猫猫数量
var dateTime = 'YYYY-MM-DD 00:00:00';//默认日期时间格式
var catCD = {};//猫猫CD
var Cooling_time = 300//突袭冷却时间，单位秒
var Forbiddentime = 1//禁言时间,单位分钟
var imgurl = "https://gitee.com/huifeidemangguomao/yunzai-one-button/blob/master/IMG_20221221_132129.jpg";//抱走图片
var imgurl2 = "https://gitee.com/huifeidemangguomao/yunzai-one-button/blob/master/1671600120148.png";//突袭图片
var imgurl3 = "https://gitee.com/huifeidemangguomao/yunzai-one-button/blob/master/1671600065533.png";//反弹图片
let sum = 1;//每日可以抱走猫猫数量
var protectmaster = true;//是否开启保护主人
imgurl = String(imgurl);
imgurl2 = String(imgurl2);
imgurl3 = String(imgurl3);


export const rule = {
  Robacat: {
    reg: "^#*抱走猫猫$",
    priority: 4999,
    describe: "【#抱走猫猫】抱走一只猫猫",
  },
  Loseacat: {
    reg: "^#*猫猫突袭(.*)$",
    priority: 4999,
    describe: "【#猫猫突袭@一个人】向一个人丢出一只猫猫",
  },
  Resetcat: {
    reg: "^#*重置猫猫$",
    priority: 4999,
    describe: "【#重置猫猫】重置今日可抢的猫猫数量",
  }, 
  Bouncecat: {
    reg: "^#*猫猫反弹$",
    priority: 4999,
    describe: "【#设置猫猫反弹】设置今日不被猫猫袭击",
  },
};

// 暂时禁用定时任务，避免导入时阻塞
// schedule.scheduleJob('0 0 0 * * *', function () {//每天凌晨0点执行
  if (filename.indexOf(".json") == -1) {//如果文件名不包含.json
    filename = filename + ".json";//添加.json
  }
  if (!fs.existsSync(dirpath)) {//如果文件夹不存在
    fs.mkdirSync(dirpath);//创建文件夹
  }
  if (!fs.existsSync(dirpath + "/" + filename)) {//如果文件不存在
    fs.writeFileSync(dirpath + "/" + filename, JSON.stringify({//创建文件
      "EveryDay":
      {
        "Remainingcats": Defaultnumberofcats,
      },
    }));
  }
  var json = JSON.parse(fs.readFileSync(dirpath + "/" + filename));//读取文件
    for (let key in json) {//遍历json
      json[key].Catprotection = false;//把猫猫保护属性设置为false
      json.EveryDay.Remainingcats = Defaultnumberofcats;//每日可以抱走猫猫数量重置
    }
    fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json,null,"\t"));//写入文件
  }
);
// });

export async function Robacat(e) {
  if (filename.indexOf(".json") == -1) {//如果文件名不包含.json
    filename = filename + ".json";//添加.json
  }
  if (!fs.existsSync(dirpath)) {//如果文件夹不存在
    fs.mkdirSync(dirpath);
  }
  if (!fs.existsSync(dirpath + "/" + filename)) {//如果文件不存在
    fs.writeFileSync(dirpath + "/" + filename, JSON.stringify({//创建文件
      "EveryDay":
      {
        "Remainingcats": Defaultnumberofcats,
      },
    }));
  }
  var json = fs.readFileSync(dirpath + "/" + filename, "utf8");//读取文件
  console.log(`剩余猫数量：${JSON.parse(json).EveryDay.Remainingcats}`);//打印剩余猫数量
  let data_redis = await redis.get(`Yunzai:setlinshimsg:${e.user_id}_cat`);//获取redis中的猫猫数量
  var new_num = 1
  if (data_redis) {//如果redis中有猫猫数量
    if (JSON.parse(data_redis)[0].num == sum) {
      var json = fs.readFileSync(dirpath + "/" + filename, "utf8");
      json = JSON.parse(json);
      e.reply([`你今天已经抢了${sum}只猫猫了，请明日再来喵~\n你拥有的猫猫数量：${json[e.user_id].Remainingcats}\n今日还剩下${json.EveryDay.Remainingcats}只猫猫`,segment.image(imgurl)]);//回复消息
      return;//结束函数
    }
    new_num = JSON.parse(data_redis)[0].num + 1;//新的猫猫数量
  }
  if (JSON.parse(json).EveryDay.Remainingcats > 0) {//如果今日可抱走猫猫数量大于0
    if (!JSON.parse(json).hasOwnProperty(e.user_id)) {//如果json中不存在该用户
      json = JSON.parse(json);//转换为json
      json[e.user_id] = {//创建该用户
        "Remainingcats": 1,
        "Catprotection": false,
      };
      json.EveryDay.Remainingcats--;//今日可抱走猫猫数量减1
      e.reply([`喵~抢到了一只猫猫！使用#猫猫突袭命令丢出猫猫！\n你拥有的猫猫数量：${json[e.user_id].Remainingcats}\n今日还剩下${json.EveryDay.Remainingcats}只猫猫`,segment.image(imgurl)]);//回复消息
      fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json,null,"\t"));//写入文件
    } else {//如果json中存在该用户
      json = JSON.parse(json);//转换为json
      json[e.user_id].Remainingcats++;//该用户的猫猫数量加1
      json.EveryDay.Remainingcats--;//今日可抱走猫猫数量减1
      e.reply([`喵~抢到了一只猫猫！使用#猫猫突袭命令丢出猫猫！\n你拥有的猫猫数量：${json[e.user_id].Remainingcats}\n今日还剩下${json.EveryDay.Remainingcats}只猫猫`,segment.image(imgurl)]);//回复消息
      fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json,null,"\t"));//写入文件
    }
    var time = moment(Date.now()).add(1, 'days').format(dateTime);//获取下一天的时间
    var new_date = (new Date(time)).getTime() - new Date().getTime() / 1000//获取下一天的时间戳
    let redis_data = [{//创建redis数据
      "num": new_num,
    }]
    redis.set(`Yunzai:setlinshimsg:${e.user_id}_cat`, JSON.stringify(redis_data), 'EX', new_date);//设置redis数据
  } else {//如果今日可抱走猫猫数量等于0
    e.reply([`猫已经被抢光了！每天只有${Defaultnumberofcats}只猫，下次早点来哦！\n你拥有的猫猫数量：${json[e.user_id].Remainingcats}`,segment.image(imgurl)]);//回复消息
  }
}
export async function Loseacat(e) {
  if (!e.isGroup) {
    e.reply(["请在群内使用猫猫突袭！",segment.image(imgurl)]);//回复消息
    return true;
  }
  if (filename.indexOf(".json") == -1) {
    filename = filename + ".json";
  }
  if (!fs.existsSync(dirpath)) {
    fs.mkdirSync(dirpath);
  }
  if (!fs.existsSync(dirpath + "/" + filename)) {
    fs.writeFileSync(dirpath + "/" + filename, JSON.stringify({//创建文件
      "EveryDay":
      {
        "Remainingcats": Defaultnumberofcats,
      },
    }));
  }
  var json = fs.readFileSync(dirpath + "/" + filename, "utf8");//读取文件
  if (!JSON.parse(json).hasOwnProperty(e.user_id)) {//如果json中不存在该用户
    //json = JSON.parse(json);//转换为json
    json[e.user_id] = {//创建该用户
      "Remainingcats": 0,
      "Catprotection": false,
    };
    fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json,null,"\t"));//写入文件
  }
  if (!e?.group.is_admin) {//如果不是管理员
    e.reply(['我不是管理员，猫猫无法正常发送啦！',segment.image(imgurl2)]);
    return true;
  }
  if (!e.at) {//如果没有@
    e.reply(['你想把猫猫丢给谁呢？@ta吧！',segment.image(imgurl2)]);
    return true;
  }
  if (e.group.pickMember(e.at).is_owner || (e.group.pickMember(e.at).is_admin && !e.group.is_owner)) {//如果@的人是群主或管理员
    e.reply(["ta在群内地位比我高，猫猫无法正常发送啦！",segment.image(imgurl2)]);
    return true
  }
  if (catCD[e.user_id]) {//如果该用户有突袭CD
    e.reply([`你刚刚使用过猫猫突袭啦！猫猫也是需要休息的啊喂！\n（该功能有${Cooling_time}秒的CD）`,segment.image(imgurl2)]);//回复消息
    return true;
  }
  let user_id_nickname = null//创建用户id和昵称的对象
  for (let msg of e.message) {//遍历消息
    if (msg.type === 'at') {//如果是@
      user_id_nickname = msg.text//获取用户id和昵称
      break//结束循环
    }
  }
  catCD[e.user_id] = true;//设置突袭CD
  catCD[e.user_id] = setTimeout(() => {//设置突袭CD定时器
    if (catCD[e.user_id]) {//如果该用户有突袭CD
      delete catCD[e.user_id];//删除该用户的突袭CD
    }
  }, Cooling_time * 1000);//设置突袭CD定时器
  if (JSON.parse(json)[e.user_id].Remainingcats > 0) {//如果该用户有猫猫
    let user_id = e.at;//获取用户id
    let json = fs.readFileSync(dirpath + "/" + filename, "utf8");//读取文件
    json = JSON.parse(json);//转换为json
    json[e.user_id].Remainingcats--;//减少该用户的猫猫数量
    //如果json中不存在该用户
    if (!json.hasOwnProperty(user_id)) {
      console.log(`用户id为：`,e.at)
      json[user_id] = {//创建该用户
        "Remainingcats": 0,
        "Catprotection": false,
      };
      fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json,null,"\t"));
    }
    if (json[e.at].Catprotection || (BotConfig.masterQQ.includes(e.at) && protectmaster)) {
      e.group.muteMember(e.user_id, Forbiddentime * 600);//禁言发起者
      e.reply([`对方开启了猫猫反弹，你发射的猫猫被反弹回来了！`,segment.image(imgurl3)]);
    } else {
      e.group.muteMember(user_id, Forbiddentime * 60);//禁言用户
      e.reply([`丢了一只猫给${user_id_nickname}(${user_id})你还剩${json[e.user_id].Remainingcats}只猫！`,segment.image(imgurl3)]);//回复消息
    }
    fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json,null,"\t"));//写入文件
  } else {
    e.reply([`你还没有猫猫！使用#抱走猫猫命令抢猫猫！`,segment.image(imgurl3)]);//回复消息
  }
}
export async function Resetcat(e) {
  if (filename.indexOf(".json") == -1) {
    filename = filename + ".json";
  }
  if (!fs.existsSync(dirpath)) {
    fs.mkdirSync(dirpath);
  }
  if (!fs.existsSync(dirpath + "/" + filename)) {
    fs.writeFileSync(dirpath + "/" + filename, JSON.stringify({
      "EveryDay":
      {
        "Remainingcats": Defaultnumberofcats,
      },
    }));
  }
  if (!e.isMaster) {
    e.reply([`只有主人才能命令榴莲哦~\n(*/ω＼*)`,segment.image(imgurl)])//回复消息
    return true;
  }
  let json = fs.readFileSync(dirpath + "/" + filename, "utf8");
  json = JSON.parse(json);
  json.EveryDay.Remainingcats = Defaultnumberofcats;//设置每日猫猫数量
  fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json,null,"\t"));
  e.reply([`重置猫猫数量为${Defaultnumberofcats}啦！`,segment.image(imgurl)]);
}
export async function Bouncecat(e) {
  if (filename.indexOf(".json") == -1) {
    filename = filename + ".json";
  }
  if (!fs.existsSync(dirpath)) {
    fs.mkdirSync(dirpath);
  }
  if (!fs.existsSync(dirpath + "/" + filename)) {
    fs.writeFileSync(dirpath + "/" + filename, JSON.stringify({
      "EveryDay":
      {
        "Remainingcats": Defaultnumberofcats,
      },
    }));
  }
  let json = fs.readFileSync(dirpath + "/" + filename, "utf8");
  if (!JSON.parse(json).hasOwnProperty(e.user_id)) {
    json = JSON.parse(json);
    json[e.user_id] = {
      "Remainingcats": 0,
      "Catprotection": false,
    };
    fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json,null,"\t"));
  }
  json = fs.readFileSync(dirpath + "/" + filename, "utf8");
  json = JSON.parse(json);//转换为json
  if (json[e.user_id].Remainingcats > 0) {
    if (json[e.user_id].Catprotection) {
      e.reply(["你今日已经设置过猫猫反弹了",segment.image(imgurl)]);
      return true;
    }
    json[e.user_id].Remainingcats--;
    json[e.user_id].Catprotection = true;
    fs.writeFileSync(dirpath + "/" + filename, JSON.stringify(json,null,"\t"));//写入文件
    e.reply([`你使用一只猫猫设置了猫猫反弹，你还剩${json[e.user_id].Remainingcats}只猫猫！`,segment.image(imgurl)]);
  } else {//如果该用户没有猫猫
    e.reply([`你没有猫猫，无法设置猫猫反弹！`,segment.image(imgurl)]);
  }
}
