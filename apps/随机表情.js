import lodash from "lodash";
import fs from "fs"
import path from "path"
import Cfg from '../components/Cfg.js'
import co from '../tools/common-black.js'
const __dirname = path.resolve();
const hmd_userqq = []; //对于某用户黑名单 ,隔开
const bmd_GroupQQ = []; //不需要使用的群的黑名单 ,隔开
const 随机表情_path ='plugins/liulian-plugin/resources/随机表情/随机表情/随机表情'
let source={}
const settings = {
    // 表情包文件存放路径
    path: path.join(__dirname, "/plugins/liulian-plugin/resources/随机表情"),
  }

export const rule = {
    chuochuo: {
      reg: "戳一戳",
      priority: 5,
      describe: "",
    },
	random: {
    reg: "noCheck",
    priority: 59,
    describe: "概率随机发送表情包",  
    },
  上传: {
    reg: "^#?上传(随机表情|表情包)$", 
    priority: 10, 
    describe: "", 
    },
}

export async function chuochuo(e) {
  let RandomNum=Cfg.get('sys.expression'); 
  if(RandomNum = 1){ 
  let faceFiles = []; 
  let fileName= []; 
  let name = "chuochuo"; 
  let facePath = path.join(settings.path, name); fs.readdirSync(facePath).forEach(fileName => faceFiles.push(fileName)); 
  let randomFile = faceFiles[Math.round(Math.random() * (faceFiles.length - 1))] 
  console.log(randomFile) 
  let finalPath = path.join(settings.path, name, randomFile); 
  let bitMap = fs.readFileSync(finalPath); 
  let base64 = Buffer.from(bitMap, 'binary').toString('base64'); 
  let message = segment.image(`base64://${base64}`) 
  let msgRes =await e.reply(message); 
  return true
  } 
  if(RandomNum = 2){ 
  let faceFiles = []; 
  let fileName= []; 
  let name = "随机表情"; 
  let facePath = path.join(settings.path, name); 
  fs.readdirSync(facePath).forEach(fileName => faceFiles.push(fileName)); 
  let randomFile = faceFiles[Math.round(Math.random() * (faceFiles.length - 1))] 
  console.log(randomFile) 
  let finalPath = path.join(settings.path, name, randomFile); 
  let bitMap = fs.readFileSync(finalPath); 
  let base64 = Buffer.from(bitMap, 'binary').toString('base64'); 
  let message = segment.image(`base64://${base64}`) 
  let msgRes =await e.reply(message); 
  return true
  } 
  return true
}


export async function random(e) {
if (!/榴莲/.test(e.msg) && !Cfg.get('sys.bq', false)) {
    return false
  }
  if (bmd_GroupQQ.includes(e.group_id)) {
		return;
  }
  if (hmd_userqq.includes(e.user_id)) {
		return;
  }
	let random_ = lodash.random(0, 100); //触发回复概率
  let gl= Cfg.get('sys.gl')
	if (random_ < gl ) {
	chuochuo(e);
	}
}

//戳一戳触发
Bot.on("notice.group.poke", async (e)=> {
	if (typeof YunzaiApps == "undefined") {
    return;
  }
  if (e.group.mute_left > 0) {
    return;
  }
  e.isPoke = true;
  e.user_id = e.operator_id;

  if (e.target_id != BotConfig.account.qq) {
    return;
  }

  //黑名单
  if (BotConfig.balckQQ && BotConfig.balckQQ.includes(Number(e.user_id))) {
    return;
  }

  //主人qq
  if (BotConfig.masterQQ && BotConfig.masterQQ.includes(Number(e.user_id))) {
    e.isMaster = true;
  }

  let key = `genshin:poke:${e.user_id}`;

  let num = await redis.get(key);
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
    await redis.incr(key);
    redis.expire(key, 120);
  }
  await chuochuo(e);
  return;
})

export async function 上传(e) {
    if (!e.isMaster) {
    return true
  }
    if (e.isGroup) {
          source = (await e.group.getChatHistory(e.source ?.seq, 1)).pop()
        }else{
          source = (await e.friend.getChatHistory((e.source ?.time + 1), 1)).pop()
    }
    let imageMessages = []
    if (source) {
          for (let val of source.message) {
            if (val.type === 'image') {
              imageMessages.push(val.url)
            }else if (val.type === 'xml') {
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
        imageMessages = e.img
    }
    if (!imageMessages.length) return e.reply('未发现图片，请与消息一同发送或引用该图片')
    try{
        let savePath
        let File
        if(!fs.existsSync(随机表情_path)) fs.mkdirSync(随机表情_path)
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