import fetch from "node-fetch";
import lodash from "lodash";
import { App } from '#liulian'
const _path = process.cwd();
// 改为false可关闭功能
let ercy = true;     //二次元的我
let chengfen = true; //我的成分
let daan = true;     //答案之书
let qiuqian = true;  //观音灵签
// 设置是否开启CD，填true则有CD
let ercyCD = false;      //二次元的我
let chengfenCD = false;  //我的成分
let daanCD = false;      //答案之书
let qiuqianCD = false;   //观音灵签
// CD时长，单位分钟，建议填写≥1的阿拉村数字，填别的报错了别找我
let ercy_time = 1;     //二次元的我 
let chengfen_time = 1; //我的成分 
let daan_time = 1;     //答案之书
let qiuqian_time = 1;  //观音灵签

let app = App.init({
  id: 'other',
  name: 'other',
  desc: 'other'
})

app.reg({
  ercyFUN: {
    reg: "^#*二次元的我$", 
    priority: 5000, 
    describe: "【#二次元的我】查看我的二次元属性", 
  },
  chengfenFUN: {
    reg: "^#*我的成分$", 
    priority: 500, 
    describe: "查看你是由什么组成的",
  },
  daanFUN: {
    reg: "^#*答案之书(.*)$", 
    priority: 500,
    describe: "答案之书会告诉你答案", 
  },
  qiuqianFUN: {
    reg: "^#*观音灵签$",
    priority: 30,
    describe: "看看今天的运势",
  },
})
export default app

export async function ercyFUN(e) {
  if (!ercy) return true;
  let data = await redis.get(`Yunzai:setlinshimsg:${e.user_id}_ercy`); 
  if (data) {
    console.log(data)
    data = JSON.parse(data)
    if (ercyCD) {
      if (data.num != 0) {
        e.reply([segment.at(e.user_id), "该命令有" + ercy_time + "分钟CD~"]);
        return true;
      }
    }
  }
  let url = `http://ovooa.com/API/Ser/api?name=${e.sender.card}『${lodash.random(0, 100)}』&type=json`;
  let response = await fetch(url);
  let res = await response.json();

  if (res.code == -1) {
    e.reply("参数错误！");
    return true
  }
  res.text = res.text.replace(/『(.+?)』/g, "");
  let msg = [
    segment.text(res.text),
    segment.image(`https://iw233.cn/API/Random.php`),
  ];
  e.reply(msg);
  redis.set(`Yunzai:setlinshimsg:${e.user_id}_ercy`, `{"num":1,"booltime":${ercyCD}}`, { 
    EX: parseInt(60 * ercy_time)
  });
  return true; 
}
export async function chengfenFUN(e) {
  if (!chengfen) return true;
  let data = await redis.get(`Yunzai:setlinshimsg:${e.user_id}_chengfen`);
  if (data) {
    console.log(data)
    data = JSON.parse(data)
    if (chengfenCD) {
      if (data.num != 0) {
        e.reply([segment.at(e.user_id), "该命令有" + chengfen_time + "分钟CD~"]);
        return true;
      }
    }
  }
  let url = `http://ovooa.com/API/name/api.php?msg=${e.sender.card}『${lodash.random(0, 100)}』&type=json`;
  let response = await fetch(url);
  let res = await response.json();
  if (res.code == -1) {
    e.reply("参数错误！");
    return true
  }
  res.text = res.text.replace(/『(.+?)』/g, "")
  res.text = res.text.replace("泡在福尔马林里面的内脏", "沾着晨露的小黄花").trim();
  res.text = res.text.replace(/“|”/g, "").trim();
  let msg = [
    segment.text(res.text),
    segment.image(`https://iw233.cn/API/Random.php`),
  ];
  e.reply(msg);
  redis.set(`Yunzai:setlinshimsg:${e.user_id}_chengfen`, `{"num":1,"booltime":${chengfenCD}}`, { 
    EX: parseInt(60 * chengfen_time)
  });
  return true; 
}
export async function daanFUN(e) {
  if (!daan) return true;
  try {
    let data = await redis.get(`Yunzai:setlinshimsg:${e.user_id}_daan`); 
    if (data) {
      console.log(data)
      data = JSON.parse(data)
      if (daanCD) {
        if (data.num != 0) {
          e.reply([segment.at(e.user_id), "该命令有" + daan_time + "分钟CD~"]);
          return true;
        }
      }
    }
    let url = `http://ovooa.com/API/daan/api?type=json`;
    let response = await fetch(url);
    let res = await response.json();
    let msg = [
      segment.text(res.data.zh),
      "\n",
      segment.text(res.data.en),
    ];
    e.reply(msg, true);
    redis.set(`Yunzai:setlinshimsg:${e.user_id}_daan`, `{"num":1,"booltime":${daanCD}}`, { //写入缓存值
      EX: parseInt(60 * daan_time)
    });
  } catch (error) {
    let msg = [
      "给答案之书整不会了",
      segment.image("https://c2cpicdw.qpic.cn/offpic_new/1761869682//1761869682-4172686859-71B1FBA58A05D2C62802B570F00A4CFB/0?term=3"),
    ];
    e.reply(msg, true);
    return true;
  }
  return true;
}
export async function qiuqianFUN(e) {
  console.log("1");
  if (!qiuqian) return true;

  let data = await redis.get(`Yunzai:setlinshimsg:${e.user_id}_qiuqian`);
  if (data) {
    console.log(data)
    data = JSON.parse(data)
    if (qiuqianCD) {
      if (data.num != 0) {
        e.reply([segment.at(e.user_id), "该命令有" + qiuqian_time + "分钟CD~"]);
        return true;
      }
    }
  }
  let url = `http://ovooa.com/API/chouq/api.php`;
  let response = await fetch(url);
  let res = await response.json();
  console.log(res);
  if (res.code !=1) {
    e.reply("出错了哦~");
    return true
  }
  let msg = [
    segment.at(e.user_id), 
    "\n第",segment.text(res.data.format),"签：",segment.text(res.data.draw),"\n",
    segment.image(res.data.image),
    "【解日】：",segment.text(res.data.explain),"\n",
    "【仙机】：",segment.text(res.data.details),"\n",
    "【签语】：",segment.text(res.data.annotate),"\n",
    "【起源】：",segment.text(res.data.source),
  ];
  e.reply(msg);
  redis.set(`Yunzai:setlinshimsg:${e.user_id}_qiuqian`, `{"num":1,"booltime":${qiuqianCD}}`, { 
    EX: parseInt(60 * qiuqian_time)
  });
  return true;
}
