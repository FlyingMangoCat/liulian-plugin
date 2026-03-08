import fetch from "node-fetch";
import config from "../model/config/config.js";
import common from "../components/bcommon.js";
import hotDatabase from "./hot/database.js";

// 安全获取segment对象
const segment = global.segment || global.Bot?.segment || {}

// 初始化数据库连接
hotDatabase.connect().catch(err => {
  console.error('[Hot] 数据库连接失败:', err);
});

// 热搜推送配置
let HotPushConfig = {};
let HotSubscriptions = {};

// 导出规则
export const rule = {
  hotSearch: {
    reg: "^#*(热搜|热搜榜|热点)(.*)$",
    priority: 500,
    describe: "全网热搜榜",
  },
  // 订阅功能
  subscribeKeyword: {
    reg: "^#*(订阅关键词|添加订阅)(.*)$",
    priority: 500,
    describe: "订阅关键词",
  },
  unsubscribeKeyword: {
    reg: "^#*(取消订阅|删除订阅)(.*)$",
    priority: 500,
    describe: "取消订阅",
  },
  viewSubscriptions: {
    reg: "^#*(查看订阅|我的订阅|订阅列表)$",
    priority: 500,
    describe: "查看订阅",
  },
  // 屏蔽词功能
  addGlobalBlockedKeyword: {
    reg: "^#*添加全局屏蔽词(.*)$",
    priority: 1,
    describe: "添加全局屏蔽词",
  },
  removeGlobalBlockedKeyword: {
    reg: "^#*删除全局屏蔽词(.*)$",
    priority: 1,
    describe: "删除全局屏蔽词",
  },
  viewGlobalBlockedKeywords: {
    reg: "^#*查看全局屏蔽词$",
    priority: 1,
    describe: "查看全局屏蔽词",
  },
  addGroupBlockedKeyword: {
    reg: "^#*添加群屏蔽词(.*)$",
    priority: 500,
    describe: "添加群屏蔽词",
  },
  removeGroupBlockedKeyword: {
    reg: "^#*删除群屏蔽词(.*)$",
    priority: 500,
    describe: "删除群屏蔽词",
  },
  viewGroupBlockedKeywords: {
    reg: "^#*(查看屏蔽词|群屏蔽词)$",
    priority: 500,
    describe: "查看群屏蔽词",
  },
  // 审批功能
  viewApplications: {
    reg: "^#*查看订阅申请$",
    priority: 1,
    describe: "查看订阅申请",
  },
  approveApplication: {
    reg: "^#*通过订阅申请\\s*(\\d+)\\s*(.*)$",
    priority: 1,
    describe: "通过订阅申请",
  },
  rejectApplication: {
    reg: "^#*拒绝订阅申请\\s*(\\d+)\\s*(.*)$",
    priority: 1,
    describe: "拒绝订阅申请",
  },
};

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
    
    // 保存到数据库（用于趋势分析）
    for (let item of top10) {
      await hotDatabase.saveHotSearchHistory(type, item.title, item.hot);
    }
    
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

// 订阅关键词
export async function subscribeKeyword(e) {
  if (!e.isGroup) {
    e.reply('关键词订阅仅支持群聊');
    return true;
  }

  let keyword = e.msg.replace(/^#*(订阅关键词|添加订阅)/, '').trim();
  if (!keyword) {
    e.reply('请输入要订阅的关键词\n示例：#订阅关键词 原神');
    return true;
  }

  // 检查是否与屏蔽词冲突
  const groupBlockedKeywords = await hotDatabase.getGroupBlockedKeywords(e.group_id);
  const globalBlockedKeywords = await hotDatabase.getGlobalBlockedKeywords();
  
  if (groupBlockedKeywords.includes(keyword) || globalBlockedKeywords.includes(keyword)) {
    e.reply(`⚠️ 该关键词已被屏蔽，无法订阅\n如需订阅，请先删除对应的屏蔽词`);
    return true;
  }

  // 添加订阅申请
  const success = await hotDatabase.addApplication(e.group_id, keyword);
  
  if (success) {
    e.reply(`✅ 已提交订阅申请：${keyword}\n等待主人审核...`);
  } else {
    e.reply('❌ 订阅申请提交失败，请稍后重试');
  }
  
  return true;
}

// 取消订阅
export async function unsubscribeKeyword(e) {
  if (!e.isGroup) {
    e.reply('关键词订阅仅支持群聊');
    return true;
  }

  let keyword = e.msg.replace(/^#*(取消订阅|删除订阅)/, '').trim();
  if (!keyword) {
    e.reply('请输入要取消订阅的关键词\n示例：#取消订阅 原神');
    return true;
  }

  const success = await hotDatabase.removeSubscription(e.group_id, keyword);
  
  if (success) {
    e.reply(`✅ 已取消订阅：${keyword}`);
  } else {
    e.reply('❌ 取消订阅失败，请检查关键词是否正确');
  }
  
  return true;
}

// 查看订阅
export async function viewSubscriptions(e) {
  if (!e.isGroup) {
    e.reply('关键词订阅仅支持群聊');
    return true;
  }

  const subscriptions = await hotDatabase.getGroupSubscriptions(e.group_id);
  
  if (subscriptions.length === 0) {
    e.reply('当前群暂无订阅的关键词\n发送 #订阅关键词 [关键词] 来订阅');
    return true;
  }
  
  let msg = ['📋 当前群订阅的关键词：\n'];
  subscriptions.forEach((sub, index) => {
    msg.push(`${index + 1}. ${sub.keyword} (${sub.platform})`);
  });
  
  e.reply(msg.join('\n'));
  return true;
}

// 添加全局屏蔽词
export async function addGlobalBlockedKeyword(e) {
  if (!e.isMaster) {
    e.reply('只有主人可以添加全局屏蔽词');
    return true;
  }

  let keyword = e.msg.replace(/^#*添加全局屏蔽词/, '').trim();
  if (!keyword) {
    e.reply('请输入要屏蔽的关键词\n示例：#添加全局屏蔽词 广告');
    return true;
  }

  const success = await hotDatabase.addGlobalBlockedKeyword(keyword, e.user_id);
  
  if (success) {
    e.reply(`✅ 已添加全局屏蔽词：${keyword}`);
  } else {
    e.reply('❌ 添加失败，关键词可能已存在');
  }
  
  return true;
}

// 删除全局屏蔽词
export async function removeGlobalBlockedKeyword(e) {
  if (!e.isMaster) {
    e.reply('只有主人可以删除全局屏蔽词');
    return true;
  }

  let keyword = e.msg.replace(/^#*删除全局屏蔽词/, '').trim();
  if (!keyword) {
    e.reply('请输入要删除的关键词\n示例：#删除全局屏蔽词 广告');
    return true;
  }

  const success = await hotDatabase.removeGlobalBlockedKeyword(keyword);
  
  if (success) {
    e.reply(`✅ 已删除全局屏蔽词：${keyword}`);
  } else {
    e.reply('❌ 删除失败，请检查关键词是否正确');
  }
  
  return true;
}

// 查看全局屏蔽词
export async function viewGlobalBlockedKeywords(e) {
  if (!e.isMaster) {
    e.reply('只有主人可以查看全局屏蔽词');
    return true;
  }

  const keywords = await hotDatabase.getGlobalBlockedKeywords();
  
  if (keywords.length === 0) {
    e.reply('当前没有全局屏蔽词');
    return true;
  }
  
  let msg = ['🚫 全局屏蔽词列表：\n'];
  keywords.forEach((keyword, index) => {
    msg.push(`${index + 1}. ${keyword}`);
  });
  
  e.reply(msg.join('\n'));
  return true;
}

// 添加群屏蔽词
export async function addGroupBlockedKeyword(e) {
  if (!e.isGroup) {
    e.reply('群屏蔽词仅支持群聊');
    return true;
  }

  if (e.isGroup && !common.isGroupAdmin(e) && !e.isMaster) {
    e.reply('只有管理员和主人可以添加群屏蔽词');
    return true;
  }

  let keyword = e.msg.replace(/^#*添加群屏蔽词/, '').trim();
  if (!keyword) {
    e.reply('请输入要屏蔽的关键词\n示例：#添加群屏蔽词 广告');
    return true;
  }

  // 检查是否与订阅冲突
  const subscriptions = await hotDatabase.getGroupSubscriptions(e.group_id);
  const hasSubscription = subscriptions.some(sub => sub.keyword === keyword);
  
  if (hasSubscription) {
    e.reply(`⚠️ 该关键词已被订阅，请先取消订阅再添加屏蔽词`);
    return true;
  }

  const success = await hotDatabase.addGroupBlockedKeyword(e.group_id, keyword, e.user_id);
  
  if (success) {
    e.reply(`✅ 已添加群屏蔽词：${keyword}`);
  } else {
    e.reply('❌ 添加失败，关键词可能已存在');
  }
  
  return true;
}

// 删除群屏蔽词
export async function removeGroupBlockedKeyword(e) {
  if (!e.isGroup) {
    e.reply('群屏蔽词仅支持群聊');
    return true;
  }

  if (e.isGroup && !common.isGroupAdmin(e) && !e.isMaster) {
    e.reply('只有管理员和主人可以删除群屏蔽词');
    return true;
  }

  let keyword = e.msg.replace(/^#*删除群屏蔽词/, '').trim();
  if (!keyword) {
    e.reply('请输入要删除的关键词\n示例：#删除群屏蔽词 广告');
    return true;
  }

  const success = await hotDatabase.removeGroupBlockedKeyword(e.group_id, keyword);
  
  if (success) {
    e.reply(`✅ 已删除群屏蔽词：${keyword}`);
  } else {
    e.reply('❌ 删除失败，请检查关键词是否正确');
  }
  
  return true;
}

// 查看群屏蔽词
export async function viewGroupBlockedKeywords(e) {
  if (!e.isGroup) {
    e.reply('群屏蔽词仅支持群聊');
    return true;
  }

  const keywords = await hotDatabase.getGroupBlockedKeywords(e.group_id);
  
  if (keywords.length === 0) {
    e.reply('当前群没有屏蔽词\n发送 #添加群屏蔽词 [关键词] 来添加');
    return true;
  }
  
  let msg = ['🚫 当前群屏蔽词列表：\n'];
  keywords.forEach((keyword, index) => {
    msg.push(`${index + 1}. ${keyword}`);
  });
  
  e.reply(msg.join('\n'));
  return true;
}

// 查看订阅申请
export async function viewApplications(e) {
  if (!e.isMaster) {
    e.reply('只有主人可以查看订阅申请');
    return true;
  }

  const applications = await hotDatabase.getApplications();
  
  if (applications.length === 0) {
    e.reply('当前没有待审核的订阅申请');
    return true;
  }
  
  let msg = ['📋 待审核的订阅申请：\n\n'];
  applications.forEach((app, index) => {
    msg.push(`${index + 1}. 群号：${app.group_id}`);
    msg.push(`   关键词：${app.keyword}`);
    msg.push(`   申请次数：${app.application_count}`);
    msg.push(`   申请时间：${app.created_at}`);
    msg.push('');
  });
  
  msg.push('\n使用 #通过订阅申请 [群号] [关键词] 或 #拒绝订阅申请 [群号] [关键词] 来处理申请');
  
  e.reply(msg.join('\n'));
  return true;
}

// 通过订阅申请
export async function approveApplication(e) {
  if (!e.isMaster) {
    e.reply('只有主人可以审核订阅申请');
    return true;
  }

  const match = e.msg.match(/^#*通过订阅申请\s+(\d+)\s+(.*)$/);
  if (!match) {
    e.reply('格式错误\n示例：#通过订阅申请 123456 原神');
    return true;
  }

  const groupId = match[1];
  const keyword = match[2];

  // 检查是否与屏蔽词冲突
  const groupBlockedKeywords = await hotDatabase.getGroupBlockedKeywords(groupId);
  const globalBlockedKeywords = await hotDatabase.getGlobalBlockedKeywords();
  
  if (groupBlockedKeywords.includes(keyword) || globalBlockedKeywords.includes(keyword)) {
    e.reply(`⚠️ 该关键词已被屏蔽，无法通过申请`);
    return true;
  }

  const success = await hotDatabase.approveApplication(groupId, keyword);
  
  if (success) {
    e.reply(`✅ 已通过订阅申请：群${groupId} - ${keyword}`);
  } else {
    e.reply('❌ 审核失败，请检查群号和关键词是否正确');
  }
  
  return true;
}

// 拒绝订阅申请
export async function rejectApplication(e) {
  if (!e.isMaster) {
    e.reply('只有主人可以审核订阅申请');
    return true;
  }

  const match = e.msg.match(/^#*拒绝订阅申请\s+(\d+)\s+(.*)$/);
  if (!match) {
    e.reply('格式错误\n示例：#拒绝订阅申请 123456 原神');
    return true;
  }

  const groupId = match[1];
  const keyword = match[2];

  const success = await hotDatabase.rejectApplication(groupId, keyword);
  
  if (success) {
    e.reply(`✅ 已拒绝订阅申请：群${groupId} - ${keyword}`);
  } else {
    e.reply('❌ 拒绝失败，请检查群号和关键词是否正确');
  }
  
  return true;
}