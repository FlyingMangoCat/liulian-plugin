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
  title: "地下地图帮助",  // 帮助标题
  subTitle: "Yunzai-Bot & Liulian-Plugin & 会飞的芒果猫 & 提瓦特图研社" // 帮助副标题
};

// 帮助菜单内容
export const helpList = [{
  group: "如何使用",
  list: [{
    icon: 48,
    title: "在群聊中发送地区编号+下一级地区编号+地图编号",
    desc: "地下地图使用格式（例子：100101【须弥雨林地下总地图】）"
 }]
}, {
  group: "须弥地区编号10",
  list: [{
    icon: 46,
    title: "雨林编号",
    desc: "01"
  }, {
    icon: 17,
    title: "沙漠编号",
    desc: "02/03"
  }]
}, {
  group: "详细地图编号请发送#原神地下地图编号",
  list: [{
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
  group: "管理命令，仅管理员可用",
  auth: "master",
  list: [{   
    icon: 29,
    title: "#榴莲更新",
    desc: "更新地下地图图片"
  }]
}];