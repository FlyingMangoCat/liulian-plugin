/*
* 请注意！！！！
* 【请勿直接修改此文件，可能会导致后续更新冲突】
* 【请勿直接修改此文件，可能会导致后续更新冲突】
*
* 如需自定义可将文件【复制】一份，并重命名为 help-cfg.js 或 help-list.js 后编辑
*
* */

// 帮助配置
export const helpCfg = {
  title: "榴莲帮助",  // 帮助标题
  subTitle: "Yunzai-Bot & Liulian-Plugin" // 帮助副标题
};

// 帮助菜单内容
export const helpList = [{
  group: "群聊功能",
  list: [{
    icon: 47,
    title: "娶群友 娶老婆 ",
    desc: "根据发言时间抽群友老婆"
  }, {
    icon: 18,
    title: "姬霓太美 菜虚鲲",
    desc: "开团"
  }, {
    icon: 35,
    title: "打卡",
    desc: "私聊发送自动点赞"
  }, {
    icon: 71,
    title: "#派蒙/芒果/榴莲问答",
    desc: "原神知识问答"
  },{
    icon: 75,
    title: "#伪造信/消息@群友+内容",
    desc: "指定群友伪造信息"
  }, {
    icon: 11,
    title: "#话痨统计",
    desc: "统计群里的话痨"
  }, {
    icon: 78,
    title: "#猜角色",
    desc: "可以选择难度简单，困难，地狱等"
  } ,{
    icon: 44,
    title: "#谁是龙王",
    desc: "查询群龙王(v2专享)"
  }, {
    icon: 56,
    title: "#神之眼自己/@群友",
    desc: "查看自己/群友神之眼"
  }, {
    icon: 98,
    title: "#我要休息xx分钟/小时/天",
    desc: "休息xx分钟/小时/天"
  }, {
    icon: 22,
    title: "#每日单词/句子",
    desc: "练习英语"
  }, {
    icon: 52,
    title: "早报",
    desc: "当天新闻早报"
  }, {
    icon: 50,
    title: "#xx座运势",
    desc: "查看星座运势"
  },{
    icon: 60,
    title: "#发病xxx",
    desc: "发病文学"
  }, {
    icon: 94,
    title: "#讲个笑话",
    desc: "讲个笑话"
  }, {
    icon: 30,
    title: "#彩虹屁",
    desc: "放个彩虹屁"
  } ,{
    icon: 54,
    title: "#土味情话",
    desc: "说点土味情话"
  }, {
    icon: 43,
    title: "#毒鸡汤",
    desc: "毒鸡汤可不要多听哦"
  }, {
    icon: 42,
    title: "#打我",
    desc: "根据随机人品禁言"
  }, {
    icon: 90,
    title: "更多群聊功能等待发现",
    desc: "正在整理更新"
  }]
}, {
  group: "其他指令/功能",
  list: [{
    icon: 74,
    title: "添加哈哈哈 删除哈哈哈",
    desc: "添加表情，回复哈哈触发"
  }, {
    icon: 79,
    title: "#帮助 #版本 #榴莲版本",
    desc: "查看榴莲帮助/版本"
  }, {
    icon: 59,
    title: "自动发送表情",
    desc: "群聊/私聊均可用，内容/触发都为随机"
  }]
}, {
  group: "其他帮助",
  list: [{
    icon: 99,
    title: " ",
    desc: " "
  }, {
    icon: 89,
    title: "地下地图帮助",
    desc: "查看地下地图使用帮助"
  }, {
    icon: 100,
    title: "汤圆帮助",
    desc: "查看汤圆帮助"
  }, {
    icon: 54,
    title: "修仙使用帮助(芒果猫专享，不开放公开使用)",
    desc: "修仙插件部分使用帮助+活动"
  }, {
    icon: 79,
    title: "插件管理帮助/help",
    desc: "查看插件管理帮助"
  }]
}, {
  group: "管理命令，仅管理员可用",
  auth: "master",
  list: [{
    icon: 29,
    title: "#更新插件",
    desc: "自动更新部分插件 （暂不可用）"
  },{   
    icon: 97,
    title: "#榴莲更新",
    desc: "更新榴莲插件"
  }]
}];