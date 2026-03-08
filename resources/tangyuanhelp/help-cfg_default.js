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
  title: "汤圆帮助",  // 帮助标题
  subTitle: "Liulian-Plugin & 会飞的芒果猫" // 帮助副标题
};

// 帮助菜单内容
export const helpList = [{
  group: "学习类",
  list: [{
    icon: 22,
    title: "#每日单词",
    desc: "随机英文单词，40秒后公布翻译，回答格式：翻译[答案]"
  }, {
    icon: 22,
    title: "#每日句子",
    desc: "随机英语句，40秒后公布翻译，回答格式：翻译[答案]"
  }, {
    icon: 78,
    title: "#猜谜语",
    desc: "随机谜语，30秒后公布答案，回答格式：#谜底[答案]"
  }, {
    icon: 74,
    title: "#猜歌名",
    desc: "猜歌曲名称，需要ffmpeg"
  }, {
    icon: 78,
    title: "#猜角色",
    desc: "支持原神/星铁/邦布，回答格式：#我猜[角色名]"
  }, {
    icon: 71,
    title: "#芒果问答",
    desc: "原神知识问答"
  }]
}, {
  group: "生活类",
  list: [{
    icon: 50,
    title: "#xx座运势",
    desc: "查看星座运势"
  }, {
    icon: 93,
    title: "运势",
    desc: "查看今日运势"
  }, {
    icon: 52,
    title: "#早报",
    desc: "当天新闻早报"
  }, {
    icon: 100,
    title: "#城市+天气",
    desc: "查看指定城市当日天气"
  }, {
    icon: 54,
    title: "#土味情话",
    desc: "说点土味情话"
  }, {
    icon: 43,
    title: "#毒鸡汤",
    desc: "随机毒鸡汤"
  }, {
    icon: 94,
    title: "#讲个笑话",
    desc: "讲个笑话"
  }, {
    icon: 30,
    title: "#舔狗日记",
    desc: "随机舔狗日记"
  }, {
    icon: 60,
    title: "#发病xxx",
    desc: "发病文学"
  }]
}, {
  group: "信息类",
  list: [{
    icon: 67,
    title: "#历史上的今天",
    desc: "查看历史上今天发生的事件"
  }, {
    icon: 11,
    title: "#话痨统计",
    desc: "统计群里的话痨"
  }, {
    icon: 56,
    title: "#神之眼自己/@群友",
    desc: "查看自己/群友神之眼"
  }, {
    icon: 42,
    title: "#打我",
    desc: "根据随机人品禁言"
  }, {
    icon: 44,
    title: "#更新群名片",
    desc: "更新bot群昵称数据"
  }, {
    icon: 98,
    title: "#翻译[内容]",
    desc: "翻译指定内容"
  }]
}, {
  group: "其他帮助",
  list: [{
    icon: 100,
    title: "榴莲帮助",
    desc: "查看榴莲插件主帮助"
  }, {
    icon: 84,
    title: "B站推送帮助",
    desc: "查看b站推送帮助"
  }, {
    icon: 89,
    title: "地下地图帮助",
    desc: "查看地下地图使用帮助"
  }, {
    icon: 79,
    title: "插件管理帮助",
    desc: "查看插件管理帮助"
  }]
}];