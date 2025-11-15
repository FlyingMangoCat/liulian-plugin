import fetch from "node-fetch";
import schedule from "node-schedule";
import moment from "moment";
import fs from "fs";
import { promisify } from "util";
import { pipeline } from "stream";

/**
 * 猫猫游戏模块
 * 功能包括抱走猫猫、猫猫突袭、重置猫猫、设置猫猫反弹
 * 如果报错请删除Yunzai/data/目录中susu文件夹，并将redis中键为Yunzai:setlinshimsg:xxxxxxxx_cat的值删除（此问题一般是因为今天已经抱过猫猫所导致的，xxxxxxxx为你的QQ号），重启机器人
 */

// 配置参数
const dirpath = "data/susu/"; // 文件夹路径
const filename = `cat`; // 文件名
const Defaultnumberofcats = 10; // 默认猫猫数量
const dateTime = 'YYYY-MM-DD 00:00:00'; // 默认日期时间格式
const catCD = {}; // 猫猫CD
const Cooling_time = 300; // 突袭冷却时间，单位秒
const Forbiddentime = 1; // 禁言时间,单位分钟
const imgurl = "https://gitee.com/huifeidemangguomao/yunzai-one-button/blob/master/IMG_20221221_132129.jpg"; // 抱走图片
const imgurl2 = "https://gitee.com/huifeidemangguomao/yunzai-one-button/blob/master/1671600120148.png"; // 突袭图片
const imgurl3 = "https://gitee.com/huifeidemangguomao/yunzai-one-button/blob/master/1671600065533.png"; // 反弹图片
const sum = 1; // 每日可以抱走猫猫数量
const protectmaster = true; // 是否开启保护主人


/**
 * 猫猫游戏规则定义
 */
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

/**
 * 每日重置任务 - 每天凌晨0点执行
 */
schedule.scheduleJob('0 0 0 * * *', function () {
  try {
    // 确保文件名正确
    let actualFilename = filename;
    if (actualFilename.indexOf(".json") == -1) {
      actualFilename = actualFilename + ".json";
    }
    
    // 确保目录存在
    if (!fs.existsSync(dirpath)) {
      fs.mkdirSync(dirpath, { recursive: true });
    }
    
    // 如果文件不存在，创建默认文件
    const filePath = dirpath + "/" + actualFilename;
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({
        "EveryDay": {
          "Remainingcats": Defaultnumberofcats,
        },
      }, null, "\t"));
    }
    
    // 读取并重置数据
    const jsonData = fs.readFileSync(filePath, "utf8");
    const json = JSON.parse(jsonData);
    
    // 重置每个用户的猫猫保护属性和每日猫猫数量
    for (let key in json) {
      if (key !== "EveryDay") {
        json[key].Catprotection = false;
      }
    }
    json.EveryDay.Remainingcats = Defaultnumberofcats;
    
    // 写入文件
    fs.writeFileSync(filePath, JSON.stringify(json, null, "\t"));
  } catch (error) {
    console.error('每日重置猫猫数据失败:', error);
  }
});

/**
 * 抱走猫猫功能
 * @param {Object} e - 事件对象
 * @returns {Promise<boolean>} 处理结果
 */
export async function Robacat(e) {
  try {
    if (!e || !e.user_id) {
      console.error('Robacat函数缺少必要的事件参数');
      return false;
    }
    
    // 确保文件名正确
    let actualFilename = filename;
    if (actualFilename.indexOf(".json") == -1) {
      actualFilename = actualFilename + ".json";
    }
    
    // 确保目录存在
    if (!fs.existsSync(dirpath)) {
      fs.mkdirSync(dirpath, { recursive: true });
    }
    
    // 如果文件不存在，创建默认文件
    const filePath = dirpath + "/" + actualFilename;
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({
        "EveryDay": {
          "Remainingcats": Defaultnumberofcats,
        },
      }, null, "\t"));
    }
    
    // 读取文件
    let json = fs.readFileSync(filePath, "utf8");
    const jsonData = JSON.parse(json);
    console.log(`剩余猫数量：${jsonData.EveryDay.Remainingcats}`);
    
    // 获取redis中的猫猫数量
    let data_redis = await redis.get(`Yunzai:setlinshimsg:${e.user_id}_cat`);
    let new_num = 1;
    
    if (data_redis) {
      const redisData = JSON.parse(data_redis);
      if (redisData && redisData[0] && redisData[0].num == sum) {
        // 用户今日已达到抱猫上限
        const json = fs.readFileSync(filePath, "utf8");
        const jsonData = JSON.parse(json);
        const userCats = jsonData[e.user_id] ? jsonData[e.user_id].Remainingcats : 0;
        const remainingCats = jsonData.EveryDay.Remainingcats || 0;
        e.reply([`你今天已经抢了${sum}只猫猫了，请明日再来喵~\n你拥有的猫猫数量：${userCats}\n今日还剩下${remainingCats}只猫猫`, segment.image(imgurl)]);
        return true;
      }
      new_num = redisData[0].num + 1;
    }
    
    // 检查今日是否还有猫可以抱
    if (jsonData.EveryDay.Remainingcats > 0) {
      // 更新用户猫猫数量
      if (!jsonData.hasOwnProperty(e.user_id)) {
        // 创建新用户
        jsonData[e.user_id] = {
          "Remainingcats": 1,
          "Catprotection": false,
        };
        jsonData.EveryDay.Remainingcats--;
        e.reply([`喵~抢到了一只猫猫！使用#猫猫突袭命令丢出猫猫！\n你拥有的猫猫数量：${jsonData[e.user_id].Remainingcats}\n今日还剩下${jsonData.EveryDay.Remainingcats}只猫猫`, segment.image(imgurl)]);
      } else {
        // 更新现有用户
        jsonData[e.user_id].Remainingcats++;
        jsonData.EveryDay.Remainingcats--;
        e.reply([`喵~抢到了一只猫猫！使用#猫猫突袭命令丢出猫猫！\n你拥有的猫猫数量：${jsonData[e.user_id].Remainingcats}\n今日还剩下${jsonData.EveryDay.Remainingcats}只猫猫`, segment.image(imgurl)]);
      }
      
      // 写入文件
      fs.writeFileSync(filePath, JSON.stringify(jsonData, null, "\t"));
      
      // 设置redis数据
      const time = moment(Date.now()).add(1, 'days').format(dateTime);
      const new_date = Math.floor((new Date(time)).getTime() / 1000) - Math.floor(Date.now() / 1000);
      const redis_data = [{
        "num": new_num,
      }];
      await redis.set(`Yunzai:setlinshimsg:${e.user_id}_cat`, JSON.stringify(redis_data), 'EX', new_date);
    } else {
      // 今日猫已被抢光
      const userCats = jsonData[e.user_id] ? jsonData[e.user_id].Remainingcats : 0;
      e.reply([`猫已经被抢光了！每天只有${Defaultnumberofcats}只猫，下次早点来哦！\n你拥有的猫猫数量：${userCats}`, segment.image(imgurl)]);
    }
    
    return true;
  } catch (error) {
    console.error('抱走猫猫功能出错:', error);
    e.reply(['抱走猫猫时出现错误，请稍后再试', segment.image(imgurl)]);
    return false;
  }
}
/**
 * 猫猫突袭功能
 * @param {Object} e - 事件对象
 * @returns {Promise<boolean>} 处理结果
 */
export async function Loseacat(e) {
  try {
    if (!e || !e.user_id) {
      console.error('Loseacat函数缺少必要的事件参数');
      return false;
    }
    
    // 检查是否在群内使用
    if (!e.isGroup) {
      e.reply(["请在群内使用猫猫突袭！", segment.image(imgurl2)]);
      return true;
    }
    
    // 确保文件名正确
    let actualFilename = filename;
    if (actualFilename.indexOf(".json") == -1) {
      actualFilename = actualFilename + ".json";
    }
    
    // 确保目录存在
    if (!fs.existsSync(dirpath)) {
      fs.mkdirSync(dirpath, { recursive: true });
    }
    
    // 如果文件不存在，创建默认文件
    const filePath = dirpath + "/" + actualFilename;
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({
        "EveryDay": {
          "Remainingcats": Defaultnumberofcats,
        },
      }, null, "\t"));
    }
    
    // 读取文件
    let json = fs.readFileSync(filePath, "utf8");
    let jsonData = JSON.parse(json);
    
    // 确保用户数据存在
    if (!jsonData.hasOwnProperty(e.user_id)) {
      jsonData[e.user_id] = {
        "Remainingcats": 0,
        "Catprotection": false,
      };
      fs.writeFileSync(filePath, JSON.stringify(jsonData, null, "\t"));
    }
    
    // 检查机器人是否为管理员
    if (!e?.group?.is_admin) {
      e.reply(['我不是管理员，猫猫无法正常发送啦！', segment.image(imgurl2)]);
      return true;
    }
    
    // 检查是否@了用户
    if (!e.at) {
      e.reply(['你想把猫猫丢给谁呢？@ta吧！', segment.image(imgurl2)]);
      return true;
    }
    
    // 检查@的用户是否为群主或管理员
    try {
      const targetMember = e.group.pickMember(e.at);
      if (targetMember.is_owner || (targetMember.is_admin && !e.group.is_owner)) {
        e.reply(["ta在群内地位比我高，猫猫无法正常发送啦！", segment.image(imgurl2)]);
        return true;
      }
    } catch (error) {
      console.error('检查目标用户权限失败:', error);
      e.reply(['检查目标用户权限失败，请稍后再试', segment.image(imgurl2)]);
      return true;
    }
    
    // 检查突袭CD
    if (catCD[e.user_id]) {
      e.reply([`你刚刚使用过猫猫突袭啦！猫猫也是需要休息的啊喂！\n（该功能有${Cooling_time}秒的CD）`, segment.image(imgurl2)]);
      return true;
    }
    
    // 获取被@用户的昵称
    let user_id_nickname = null;
    for (let msg of e.message) {
      if (msg.type === 'at') {
        user_id_nickname = msg.text;
        break;
      }
    }
    
    // 设置突袭CD
    catCD[e.user_id] = true;
    setTimeout(() => {
      if (catCD[e.user_id]) {
        delete catCD[e.user_id];
      }
    }, Cooling_time * 1000);
    
    // 检查用户是否有猫猫
    if (jsonData[e.user_id].Remainingcats > 0) {
      const user_id = e.at;
      const json = fs.readFileSync(filePath, "utf8");
      const jsonData = JSON.parse(json);
      
      // 减少发起者的猫猫数量
      jsonData[e.user_id].Remainingcats--;
      
      // 确保目标用户数据存在
      if (!jsonData.hasOwnProperty(user_id)) {
        console.log(`用户id为：`, e.at);
        jsonData[user_id] = {
          "Remainingcats": 0,
          "Catprotection": false,
        };
        fs.writeFileSync(filePath, JSON.stringify(jsonData, null, "\t"));
      }
      
      // 检查目标用户是否开启了猫猫反弹或为主人且开启保护
      const isProtected = jsonData[e.at]?.Catprotection || 
                         (typeof BotConfig !== 'undefined' && 
                          BotConfig.masterQQ && 
                          BotConfig.masterQQ.includes(e.at) && 
                          protectmaster);
      
      if (isProtected) {
        // 反弹，禁言发起者
        try {
          await e.group.muteMember(e.user_id, Forbiddentime * 60);
          e.reply([`对方开启了猫猫反弹，你发射的猫猫被反弹回来了！`, segment.image(imgurl3)]);
        } catch (error) {
          console.error('禁言发起者失败:', error);
          e.reply([`对方开启了猫猫反弹，但禁言操作失败：${error.message}`, segment.image(imgurl3)]);
        }
      } else {
        // 成功突袭，禁言目标用户
        try {
          await e.group.muteMember(user_id, Forbiddentime * 60);
          e.reply([`丢了一只猫给${user_id_nickname}(${user_id})你还剩${jsonData[e.user_id].Remainingcats}只猫！`, segment.image(imgurl3)]);
        } catch (error) {
          console.error('禁言目标用户失败:', error);
          e.reply([`丢了一只猫给${user_id_nickname}(${user_id})，但禁言操作失败：${error.message}`, segment.image(imgurl3)]);
        }
      }
      
      // 写入文件
      fs.writeFileSync(filePath, JSON.stringify(jsonData, null, "\t"));
    } else {
      // 用户没有猫猫
      e.reply([`你还没有猫猫！使用#抱走猫猫命令抢猫猫！`, segment.image(imgurl3)]);
    }
    
    return true;
  } catch (error) {
    console.error('猫猫突袭功能出错:', error);
    e.reply(['猫猫突袭时出现错误，请稍后再试', segment.image(imgurl2)]);
    return false;
  }
}
/**
 * 重置猫猫功能 - 仅限主人使用
 * @param {Object} e - 事件对象
 * @returns {Promise<boolean>} 处理结果
 */
export async function Resetcat(e) {
  try {
    if (!e || !e.user_id) {
      console.error('Resetcat函数缺少必要的事件参数');
      return false;
    }
    
    // 检查是否为主人
    if (!e.isMaster) {
      e.reply([`只有主人才能命令榴莲哦~
(*/ω＼*)`, segment.image(imgurl)]);
      return true;
    }
    
    // 确保文件名正确
    let actualFilename = filename;
    if (actualFilename.indexOf(".json") == -1) {
      actualFilename = actualFilename + ".json";
    }
    
    // 确保目录存在
    if (!fs.existsSync(dirpath)) {
      fs.mkdirSync(dirpath, { recursive: true });
    }
    
    // 如果文件不存在，创建默认文件
    const filePath = dirpath + "/" + actualFilename;
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({
        "EveryDay": {
          "Remainingcats": Defaultnumberofcats,
        },
      }, null, "\t"));
    }
    
    // 读取、修改并写入文件
    let json = fs.readFileSync(filePath, "utf8");
    const jsonData = JSON.parse(json);
    jsonData.EveryDay.Remainingcats = Defaultnumberofcats;
    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, "\t"));
    
    e.reply([`重置猫猫数量为${Defaultnumberofcats}啦！`, segment.image(imgurl)]);
    return true;
  } catch (error) {
    console.error('重置猫猫功能出错:', error);
    e.reply(['重置猫猫时出现错误，请稍后再试', segment.image(imgurl)]);
    return false;
  }
}
/**
 * 猫猫反弹功能
 * @param {Object} e - 事件对象
 * @returns {Promise<boolean>} 处理结果
 */
export async function Bouncecat(e) {
  try {
    if (!e || !e.user_id) {
      console.error('Bouncecat函数缺少必要的事件参数');
      return false;
    }
    
    // 确保文件名正确
    let actualFilename = filename;
    if (actualFilename.indexOf(".json") == -1) {
      actualFilename = actualFilename + ".json";
    }
    
    // 确保目录存在
    if (!fs.existsSync(dirpath)) {
      fs.mkdirSync(dirpath, { recursive: true });
    }
    
    // 如果文件不存在，创建默认文件
    const filePath = dirpath + "/" + actualFilename;
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({
        "EveryDay": {
          "Remainingcats": Defaultnumberofcats,
        },
      }, null, "\t"));
    }
    
    // 确保用户数据存在
    let json = fs.readFileSync(filePath, "utf8");
    let jsonData = JSON.parse(json);
    if (!jsonData.hasOwnProperty(e.user_id)) {
      jsonData[e.user_id] = {
        "Remainingcats": 0,
        "Catprotection": false,
      };
      fs.writeFileSync(filePath, JSON.stringify(jsonData, null, "\t"));
    }
    
    // 重新读取文件以确保数据一致性
    json = fs.readFileSync(filePath, "utf8");
    jsonData = JSON.parse(json);
    
    // 检查用户是否有猫猫
    if (jsonData[e.user_id].Remainingcats > 0) {
      // 检查是否已经设置过反弹
      if (jsonData[e.user_id].Catprotection) {
        e.reply(["你今日已经设置过猫猫反弹了", segment.image(imgurl)]);
        return true;
      }
      
      // 设置猫猫反弹
      jsonData[e.user_id].Remainingcats--;
      jsonData[e.user_id].Catprotection = true;
      fs.writeFileSync(filePath, JSON.stringify(jsonData, null, "\t"));
      
      e.reply([`你使用一只猫猫设置了猫猫反弹，你还剩${jsonData[e.user_id].Remainingcats}只猫猫！`, segment.image(imgurl)]);
    } else {
      // 用户没有猫猫
      e.reply([`你没有猫猫，无法设置猫猫反弹！`, segment.image(imgurl)]);
    }
    
    return true;
  } catch (error) {
    console.error('猫猫反弹功能出错:', error);
    e.reply(['设置猫猫反弹时出现错误，请稍后再试', segment.image(imgurl)]);
    return false;
  }
}
