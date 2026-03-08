import fetch from "node-fetch";
import config from "../model/config/config.js";

// 全网热搜榜
export async function hotSearch(e) {
  const cfg = config.getdefault_config('liulian', 'token', 'config');
  const apikeys = cfg.apikeys;
  const apikey = apikeys.resou_apikey || '';
  
  // 支持的平台映射
  const platformMap = {
    '微博': 'weibo',
    '微博热搜': 'weibo',
    'weibo': 'weibo',
    '知乎': 'zhihu',
    '知乎热榜': 'zhihu',
    'zhihu': 'zhihu',
    '百度': 'baidu',
    '百度热点': 'baidu',
    'baidu': 'baidu',
    '抖音': 'douyin',
    '抖音热搜': 'douyin',
    'douyin': 'douyin',
    'B站': 'bilihot',
    'b站': 'bilihot',
    '哔哩哔哩': 'bilihot',
    'bilihot': 'bilihot',
    'B站全站': 'biliall',
    'b站全站': 'biliall',
    'biliall': 'biliall',
    'CSDN': 'csdn',
    'csdn': 'csdn',
    '少数派': 'sspai',
    'sspai': 'sspai',
  };
  
  // 获取用户指定的平台
  let userPlatform = e.msg.replace(/^#*(热搜|热搜榜|热点)/, '').trim();
  let type = 'douyin'; // 默认抖音热搜
  let platformName = '抖音热搜';
  
  // 如果用户指定了平台，则使用指定的
  if (userPlatform && platformMap[userPlatform]) {
    type = platformMap[userPlatform];
    platformName = userPlatform;
  } else if (userPlatform && userPlatform !== '') {
    // 用户输入了平台名但不在支持列表中
    e.reply(`⚠️ 不支持的平台：${userPlatform}\n\n支持的平台：\n微博、知乎、百度、抖音、B站、CSDN、少数派\n\n示例：#热搜、#热搜微博、#热搜知乎`);
    return true;
  }
  
  let url = `https://api.oick.cn/api/hot?type=${type}&apikey=${apikey}`;
  
  try {
    let response = await fetch(url);
    let res = await response.json();
    
    if (!res || !Array.isArray(res.data)) {
      e.reply('获取热搜榜失败，请稍后重试');
      return true;
    }
    
    const hotList = res.data;
    
    if (hotList.length === 0) {
      e.reply(`当前${platformName}暂无热搜数据`);
      return true;
    }
    
    // 只取前10条
    const top10 = hotList.slice(0, 10);
    
    let msg = [`🔥 ${platformName} TOP10\n\n`];
    
    top10.forEach((item, index) => {
      msg.push(`${item.index}. ${item.title}`);
      if (item.hot) {
        msg.push(`   🔥 ${item.hot}`);
      }
      msg.push('\n');
    });
    
    msg.push(`完整榜单：${res.url || '暂无链接'}`);
    
    // 如果消息太长，分段发送
    if (msg.join('').length > 2000) {
      let chunk = '';
      for (let i = 0; i < msg.length; i++) {
        if ((chunk + msg[i]).length > 2000) {
          e.reply(chunk);
          chunk = '';
        }
        chunk += msg[i];
      }
      if (chunk) {
        e.reply(chunk);
      }
    } else {
      e.reply(msg.join(''));
    }
    
  } catch (err) {
    e.reply(`获取热搜榜失败：${err.message}`);
  }
  
  return true;
}