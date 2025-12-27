/*
* 榴莲插件 - 随机表情模块
* 功能：提供随机表情包发送、表情包上传等功能
* 支持戳一戳触发、概率随机发送、自定义表情包上传等
* */

import lodash from "lodash";
import fs from "fs"
import path from "path"
import Cfg from '../components/Cfg.js'
import co from '../tools/common-black.js'
import { logger } from '../components/index.js'

const __dirname = path.resolve();

// 用户黑名单列表，用逗号分隔
const hmd_userqq = []; 

// 群黑名单列表，用逗号分隔
const bmd_GroupQQ = [931286774]; 

// 自定义表情包存储路径
const 随机表情_path ='plugins/liulian-plugin/resources/自定义表情/expression/自定义表情'

// 消息源数据
let source={} 

// 默认表情包配置
const settings = {
    // 表情包文件存放路径
    path: path.join(__dirname, "/plugins/liulian-plugin/resources/随机表情"),
  }

// 自定义表情包配置
const settings2 = {
    // 自定义表情包文件存放路径
    path: path.join(__dirname, "/plugins/liulian-plugin/resources/自定义表情"),
  }

// 命令规则定义
export const rule = {
    // 戳一戳触发表情包
    chuochuo: {
      reg: "戳一戳",
      priority: 5,
      describe: "戳一戳触发随机表情包",
    },
    // 概率随机发送表情包
	random: {
    reg: "noCheck", // 不检查正则，匹配所有消息
    priority: 59,
    describe: "概率随机发送表情包",  
    },
    // 上传表情包
  上传: {
    reg: "^#?上传(随机表情|表情包)$", 
    priority: 10, 
    describe: "上传图片到随机表情包库", 
    },
}

/**
 * 戳一戳触发表情包函数
 * @param {Object} e - 事件对象
 * @returns {boolean} - 返回true表示成功执行
 */
export async function chuochuo(e) {
  // 获取表情包配置，1表示默认表情包，2表示自定义表情包
  let RandomNum=Cfg.get('sys.expression'); 
  
  // 使用默认表情包
  if(RandomNum == 1){ 
  let faceFiles = []; 
  let fileName= []; 
  let name = "expression"; 
  // 获取默认表情包路径并读取所有文件
  let facePath = path.join(settings.path, name); fs.readdirSync(facePath).forEach(fileName => faceFiles.push(fileName)); 
  // 随机选择一个表情文件
  let randomFile = faceFiles[Math.round(Math.random() * (faceFiles.length - 1))] 
  console.log(randomFile) 
  // 构建文件完整路径
  let finalPath = path.join(settings.path, name, randomFile); 
  // 读取文件并转换为base64
  let bitMap = fs.readFileSync(finalPath); 
  let base64 = Buffer.from(bitMap, 'binary').toString('base64'); 
  // 构建图片消息并发送
  let message = segment.image(`base64://${base64}`) 
  let msgRes =await e.reply(message); 
  return true
  } 
  
  // 使用自定义表情包
  if(RandomNum == 2){ 
  let faceFiles = []; 
  let fileName= []; 
  let name = "expression"; 
  // 获取自定义表情包路径并读取所有文件
  let facePath = path.join(settings2.path, name); 
  fs.readdirSync(facePath).forEach(fileName => faceFiles.push(fileName)); 
  // 随机选择一个表情文件
  let randomFile = faceFiles[Math.round(Math.random() * (faceFiles.length - 1))] 
  console.log(randomFile) 
  // 构建文件完整路径
  let finalPath = path.join(settings2.path, name, randomFile); 
  // 读取文件并转换为base64
  let bitMap = fs.readFileSync(finalPath); 
  let base64 = Buffer.from(bitMap, 'binary').toString('base64'); 
  // 构建图片消息并发送
  let message = segment.image(`base64://${base64}`) 
  let msgRes =await e.reply(message); 
  return true
  } 
  return true
}


/**
 * 概率随机发送表情包函数
 * @param {Object} e - 事件对象
 * @returns {boolean|void} - 返回false表示功能未开启，void表示正常执行
 */
export async function random(e) {
// 检查表情包功能是否开启
if (!Cfg.get('sys.bq', false)) {
    return false
  }
  // 检查群是否在黑名单中
  if (bmd_GroupQQ.includes(e.group_id)) {
		return;
  }
  // 检查用户是否在黑名单中
  if (hmd_userqq.includes(e.user_id)) {
		return;
  }
	// 生成0-100的随机数作为触发概率
	let random_ = lodash.random(0, 100); 
  // 获取配置的触发概率
  let gl= Cfg.get('sys.gl')
	// 如果随机数小于配置概率，则触发表情包
	if (random_ < gl ) {
	chuochuo(e);
  Bot.logger.mark(`liulian-plugin -- 随机表情`);
	}
}

// 戳一戳触发事件监听器
Bot.on("notice.group.poke", async (e)=> {
	// 检查YunzaiApps是否存在
	if (typeof YunzaiApps == "undefined") {
    return;
  }
  // 检查群是否处于禁言状态
  if (e.group.mute_left > 0) {
    return;
  }
  // 设置戳一戳标志
  e.isPoke = true;
  e.user_id = e.operator_id;

  // 检查是否戳的是机器人自己
  if (e.target_id != e.self_id) {
    return;
  }

  // 检查用户是否在黑名单中
  if (BotConfig.balckQQ && BotConfig.balckQQ.includes(Number(e.user_id))) {
    return;
  }

  // 检查是否是主人QQ
  if (BotConfig.masterQQ && BotConfig.masterQQ.includes(Number(e.user_id))) {
    e.isMaster = true;
  }

  // 防止戳一戳过于频繁的限流机制
  let key = `genshin:poke:${e.user_id}`;

  let num = await redis.get(key);
  // 如果戳得太频繁且不是主人，则提醒用户
  if (num && num > 2 && !e.isMaster) {
    if (!(await redis.get(`genshin:pokeTips:${e.group_id}`))) {
      e.reply([segment.at(e.user_id), "\n戳太快了，请慢点。。"]);
      redis.set(`genshin:pokeTips:${e.group_id}`, "1", { EX: 120 });
      return;
    }

    await redis.incr(key);
    redis.expire(key, 120);

    return;
  } else {
    // 增加戳一戳计数并设置过期时间
    await redis.incr(key);
    redis.expire(key, 120);
  }
  // 触发戳一戳表情包
  await chuochuo(e);
  return;
})

/**
 * 上传表情包函数
 * @param {Object} e - 事件对象
 * @returns {boolean} - 返回true表示成功执行
 */
export async function 上传(e) {
    // 检查是否是主人，只有主人可以上传表情包
    if (!e.isMaster) {
    return true
  }
    // 获取消息源，支持群聊和私聊
    if (e.isGroup) {
          source = (await e.group.getChatHistory(e.source ?.seq, 1)).pop()
        }else{
          source = (await e.friend.getChatHistory((e.source ?.time + 1), 1)).pop()
    }
    // 存储图片URL的数组
    let imageMessages = []
    
    // 从消息源中提取图片
    if (source) {
          for (let val of source.message) {
            if (val.type === 'image') {
              imageMessages.push(val.url)
            }else if (val.type === 'xml') {
              // 处理转发消息中的图片
             let resid = val.data.match(/m_resid="(.*?)"/)[1]
              if (!resid) break
              let message = await Bot.getForwardMsg(resid)
              for (const item of message) {
                for (const i of item.message) {
                  if (i.type === 'image') {
                    imageMessages.push(i.url)
                  }
                }
          }      
        }
      }
    }else{
        // 如果没有消息源，直接从当前消息中获取图片
        imageMessages = e.img
    }
    // 检查是否找到图片
    if (!imageMessages.length) return e.reply('未发现图片，请与消息一同发送或引用该图片')
    
    try{
        let savePath
        let File
        // 如果表情包目录不存在则创建
        if(!fs.existsSync(随机表情_path)) fs.mkdirSync(随机表情_path)
        
        // 下载并保存每张图片
        for (let i = 0; i < imageMessages.length; i++) {
            File = fs.readdirSync(随机表情_path)
            savePath = `${随机表情_path}${File.length + 1}.jpg`
            await co.downFile(imageMessages[i], savePath)
          }
          e.reply(`随机表情上传成功${imageMessages.length}张`)
        } catch (err) {
          logger.error(err)
          e.reply('上传失败')
        }
        return true
}