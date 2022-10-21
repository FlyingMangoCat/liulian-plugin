import { segment } from "oicq";
import fs from "fs"
import path from "path"
const __dirname = path.resolve();

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
    describe: "概率随机发送表情包",  //聊天中概率回复表情包，不需要可以注释掉。
    },
}

export async function chuochuo(e) {
  let faceFiles = [];
  let fileName= [];
  let name = "chuochuo";
  let facePath = path.join(settings.path, name);
  fs.readdirSync(facePath).forEach(fileName => faceFiles.push(fileName));
  let randomFile = faceFiles[Math.round(Math.random() * (faceFiles.length - 1))]
  console.log(randomFile)
  let finalPath = path.join(settings.path, name, randomFile);
  let bitMap = fs.readFileSync(finalPath);
  let base64 = Buffer.from(bitMap, 'binary').toString('base64');
  let message = segment.image(`base64://${base64}`);
  e.reply(message);
  }

export async function random(e) {
	let random_ = parseInt(Math.random() * 99); //触发回复概率
	//随机触发（10%概率）
	if (random_ > 95 || random_ <5) {
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