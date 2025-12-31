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
  title: "B站推送帮助",  // 帮助标题
  subTitle: "Liulian-Plugin & 会飞的芒果猫" // 帮助副标题
};

// 帮助菜单内容
export const helpList = [{
  group: "B站推送帮助",
  list: [{
    icon: 98,
    title: "开启B站推送",
    desc: "默认推送原神官方动态，默认不推送转发动态"
  }, {
    icon: 99,
    title: "关闭B站推送",
    desc: "默认推送原神官方动态，默认不推送转发动态"
  }]
},{
  group: "订阅与转发",
  list: [{
    icon: 95,
    title: "订阅B站推送+B站用户UID",
    desc: "订阅B站用户"
  }, {
    icon: 96,
    title: "取消B站推送+B站用户UID",
    desc: "取消订阅B站用户"
  }, {
    icon: 71,
    title: "开启B站转发推送",
    desc: "嘶，转发也要推送的嘛"
  }, {
    icon: 10,
    title: "关闭B站转发推送",
    desc: "好滴，这就关闭"
  }]
},{
  group: "其他指令/功能",
  list: [{
    icon: 97,
    title: "B站推送列表",
    desc: "查看当前订阅的B站用户"
  },{
    icon: 74,
    title: "设置B站推送默认",
    desc: "默认推送文字+图片+链接"
  },{
    icon: 30,
    title: "设置B站推送合并",
    desc: "合并为消息合并转发"
  }]
}, {
  group: "其他帮助",
  list: [{
    icon: 99,
    title: "B站推送帮助",
    desc: "B站推送使用帮助"
  }, {
    icon: 89,
    title: "地下地图帮助",
    desc: "查看地下地图使用帮助"
  }, {
    icon: 100,
    title: "汤圆帮助",
    desc: "查看汤圆帮助"
  }, {
    icon: 79,
    title: "插件管理帮助/help",
    desc: "查看插件管理帮助"
  }]
}, {
  group: "管理命令",
  list: [{
    icon: 73,
    title: "B站推送时间+时间(单位分钟)",
    desc: "默认10分钟推送一次"
  },{
    icon: 91,
    title: "B站推送过期时间+时间(单位小时)",
    desc: "默认1小时"
  },{
    icon: 66,
    title: "开启/关闭群B站推送+群号",
    desc: "开启/关闭指定群B站推送"
  },{
    icon: 29,
    title: "B站推送群列表",
    desc: "查看当前各群B站推送状态"
  }]
}];