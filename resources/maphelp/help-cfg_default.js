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
    title: "在群聊中发送地区名称+下一级地区编号-地图编号",
    desc: "地下地图使用格式（例子：须弥1-总【须弥雨林地下总地图】）"
 }]
}, {
  group: "须弥（地区名称）",
  list: [{
    icon: 46,
    title: "雨林编号",
    desc: "1"
  }, {
    icon: 17,
    title: "沙漠编号",
    desc: "2"
  }]
}, {
  group: "雨林地图编号",
  list: [{
    icon: 25,
    title: "总",
    desc: "雨林地下总地图"
  }, {
    icon: 25,
    title: "1",
    desc: "雨林地下觉王之殿东地下三层（恒常机关阵列挑战）地图"
  },{
    icon: 25,
    title: "2",
    desc: "雨林地下觉王之殿东地下一层（幻梦之门）地图"
  },{
    icon: 25,
    title: "3",
    desc: "雨林地下觉王之殿东地下二层（大蘑菇厅）地图"
  },{
    icon: 25,
    title: "4",
    desc: "雨林地下觉王之殿东地下三层（小蘑菇厅）地图"
  },{
    icon: 25,
    title: "5",
    desc: "雨林地下觉王之殿东地下二层（童梦的切片）地图"
  },{
    icon: 25,
    title: "6",
    desc: "雨林地下觉王之殿东地下一层（遗迹区）地图"
  },{
    icon: 25,
    title: "7",
    desc: "雨林地下觉王之殿东总地图"
  },{
    icon: 25,
    title: "8",
    desc: "雨林地下觉王之殿东地图"
  },{
    icon: 25,
    title: "9",
    desc: "雨林地下香醉坡地图"
  },{
    icon: 25,
    title: "10",
    desc: "雨林地下地图"
  },{
    icon: 25,
    title: "11",
    desc: "雨林地图地图"
  },{
    icon: 25,
    title: "12",
    desc: "雨林地下地图"
  },{
    icon: 25,
    title: "13",
    desc: "雨林地下地图"
  },{
    icon: 25,
    title: "14",
    desc: "雨林地下地图"
  },{
    icon: 25,
    title: "15",
    desc: "雨林地下地图"
  },{
    icon: 25,
    title: "16",
    desc: "雨林地下地图"
  },{
    icon: 25,
    title: "17",
    desc: "雨林地下地图"
  },{
    icon: 25,
    title: "18",
    desc: "雨林地下地图"
  },{
    icon: 25,
    title: "19",
    desc: "雨林地下地图"
  },{
    icon: 25,
    title: "20",
    desc: "雨林地下地图"
  }]
}, {
  group: "沙漠地图编号",
  list: [{
    icon: 25,
    title: "总",
    desc: "沙漠地下地图"
  },{
    icon: 25,
    title: "1",
    desc: "沙漠地下地图"
  },{
    icon: 25,
    title: "2",
    desc: "沙漠地下地图"
  },{
    icon: 25,
    title: "3",
    desc: "沙漠地下地图"
  },{
    icon: 25,
    title: "4",
    desc: "沙漠地下地图"
  },{
    icon: 25,
    title: "5",
    desc: "沙漠地下地图"
  },{
    icon: 25,
    title: "6",
    desc: "沙漠地下地图"
  },{
    icon: 25,
    title: "7",
    desc: "沙漠地下地图"
  },{
    icon: 25,
    title: "8",
    desc: "沙漠地下地图"
  }]
}, {
  group: "管理命令，仅管理员可用",
  auth: "master",
  list: [{   
    icon: 29,
    title: "#地图图片更新",
    desc: "更新地下地图图片（暂不可用）"
  }]
}];