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
  group: "实用工具",
  list: [{
    icon: 98,
    title: "#翻译[内容]",
    desc: "翻译指定内容"
  }, {
    icon: 101,
    title: "#base64加密[内容]",
    desc: "对文本进行base64编码"
  }, {
    icon: 102,
    title: "#base64解密[内容]",
    desc: "对base64文本进行解码"
  }]
}, {
  group: "查询功能",
  list: [{
    icon: 66,
    title: "#热搜[平台]",
    desc: "全网热搜榜，支持：微博、知乎、百度、抖音、B站、CSDN、少数派"
  }, {
    icon: 76,
    title: "#骚扰电话/查电话",
    desc: "查询手机号是否为骚扰电话"
  }, {
    icon: 67,
    title: "#历史上的今天",
    desc: "查看历史上今天发生的事件"
  }]
}, {
  group: "娱乐互动",
  list: [{
    icon: 78,
    title: "#猜谜语",
    desc: "随机谜语，30秒后公布答案，回答格式：#谜底[答案]"
  }, {
    icon: 44,
    title: "猫猫系统",
    desc: "抱走猫猫、猫猫突袭"
  }, {
    icon: 95,
    title: "#二次元的我",
    desc: "查看我的二次元属性"
  }, {
    icon: 96,
    title: "#我的成分",
    desc: "查看我的成分"
  }, {
    icon: 97,
    title: "#答案之书",
    desc: "答案之书会告诉你答案"
  }, {
    icon: 99,
    title: "#观音灵签",
    desc: "观音灵签"
  }]
}, {
  group: "使用说明",
  list: [{
    icon: 77,
    title: "热搜榜使用方法",
    desc: "#热搜（抖音）、#热搜微博、#热搜知乎、#热搜百度、#热搜B站、#热搜CSDN、#热搜少数派"
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
    icon: 86,
    title: "热搜帮助",
    desc: "查看热搜功能帮助"
  }, {
    icon: 79,
    title: "插件管理帮助",
    desc: "查看插件管理帮助"
  }]
}];