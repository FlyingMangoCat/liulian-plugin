import { segment } from "oicq";
import fetch from "node-fetch";
import lodash from "lodash";
const _path = process.cwd();
let godeye = true;
let headPortrait = true;
export const rule = {
	godEyesFUN: {
    reg: "^#*神之眼(.*)$",
    priority: 5000,
    describe: "【神之眼@xxx】看看ta的神之眼", 
  },
  headPortraitFUN: {
    reg: "^#*看头像(.*)$",
    priority: 5000,
    describe: "【头像@xxx】看看头像大图", 
  }
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