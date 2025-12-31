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
  title: "插件管理帮助",  // 帮助标题
  subTitle: "Yunzai-Bot & Liulian-Plugin & 会飞的芒果猫" // 帮助副标题
};

// 帮助菜单内容
export const helpList = [{
  group: "插件管理",
  list: [{
    icon: 75,
    title: "插件列表",
    desc: "查看你安装的js插件，不包括插件包"
  }, {
    icon: 92,
    title: "仓库列表",
    desc: "查看你移除的插件列表"
  }]
}, {
  group: "恢复/移除/删除插件",
  list: [{
    icon: 74,
    title: "移除+插件名",
    desc: "移除指定插件(注意只能移除目前已经安装的插件哦)"
  }, {
    icon: 40,
    title: "恢复+插件名",
    desc: "恢复指定插件(注意只能恢复最近移除过的插件哦)"
  }, {
    icon: 49,
    title: "删除+插件名",
    desc: "删除指定插件(注意删除之后就不可以再添加了哦)"
  }]
}, {
  group: "其他",
  list: [{
    icon: 79,
    title: "插件管理帮助/help",
    desc: "查看插件管理帮助(所以说这条好像没啥用吧…)"
  }, {
    icon: 94,
    title: "v2在指令前+v2",
    desc: "v3直接发送指令，前面不加#"
  }]
}, {
  group: "其他帮助（部分功能帮助为独立帮助，榴莲帮助内不包括）",
  list: [{
    icon: 84,
    title: "B站推送帮助",
    desc: "查看b站推送帮助"
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
  group: "使用方法",
  list: [{
    icon: 59,
    title: "直接将js格式的插件私聊发给bot即可",
    desc: "食用方法"
  }]
}];