import fetch from "node-fetch";
import config from "../model/config/config.js"

// 安全获取segment对象
const segment = global.segment || global.Bot?.segment || {}

export const rule = {
 骚扰电话: {
    reg: "^#*(骚扰电话|查电话)(.*)$", //匹配消息正则，命令正则
    priority: 10, //优先级，越小优先度越高
    describe: "骚扰电话查询", //【命令】功能说明
  },
};

export async function 骚扰电话(e) {
  // 获取手机号参数
  let phone = e.msg.replace(/#*(骚扰电话|查电话)/, "").trim();
  
  // 验证手机号格式
  if (!phone || !/^\d{11}$/.test(phone)) {
    e.reply("请输入正确的手机号（11位数字）");
    return true;
  }
  
  // 获取API密钥
  const cfg = config.getdefault_config('liulian', 'token', 'config');
  const apikeys = cfg.apikeys;
  const apikey = apikeys.骚扰电话_apikey || '';
  
  if (!apikey) {
    e.reply("⚠️未配置API密钥，请联系管理员");
    return false;
  }
  
  try {
    // 请求查询接口
    let url = `https://api.oick.cn/api/phone?phone=${phone}&apikey=${apikey}`;
    let response = await fetch(url);
    let res = await response.json();
    
    if (!res || !res.图片) {
      e.reply("查询失败，请稍后重试");
      return false;
    }
    
    // 发送查询结果
    let msg = [
      segment.at(e.user_id),
      "\n📱 骚扰电话查询结果：",
      segment.image(res.图片),
    ];
    
    e.reply(msg);
    return true;
  } catch (error) {
    e.reply(`⚠️查询失败：${error.message}`);
    return false;
  }
}