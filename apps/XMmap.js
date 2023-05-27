import fetch from "node-fetch";

const _path = process.cwd();//项目路径

export const rule = {
  yl总: {
    reg: "100101", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
  yl1: {
    reg: "100102", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
  yl2: {
    reg: "100103", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
  yl3: {
    reg: "100104", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
  yl4: {
    reg: "100105", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
  yl5: {
    reg: "100106", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
  yl6: {
    reg: "100107", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
  yl7: {
    reg: "100108", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
  yl8: {
    reg: "100109", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
  yl9: {
    reg: "100110", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
  yl10: {
    reg: "100111", //匹配消息正则，命令正则
    priority: 3, //优先级，越小优先度越高
    describe: "", 
  },
  yl11: {
    reg: "100112", //匹配消息正则，命令正则
    priority: 3, //优先级，越小优先度越高
    describe: "", 
  },
  yl12: {
    reg: "100113", //匹配消息正则，命令正则
    priority: 3, //优先级，越小优先度越高
    describe: "", 
  },
  yl13: {
    reg: "100114", //匹配消息正则，命令正则
    priority: 3, //优先级，越小优先度越高
    describe: "", 
  },
  yl14: {
    reg: "100115", //匹配消息正则，命令正则
    priority: 3, //优先级，越小优先度越高
    describe: "", 
  },
  yl15: {
    reg: "100116", //匹配消息正则，命令正则
    priority: 3, //优先级，越小优先度越高
    describe: "", 
  },
  yl16: {
    reg: "100117", //匹配消息正则，命令正则
    priority: 3, //优先级，越小优先度越高
    describe: "", 
  },
  yl17: {
    reg: "100118", //匹配消息正则，命令正则
    priority: 3, //优先级，越小优先度越高
    describe: "", 
  },
  yl18: {
    reg: "100119", //匹配消息正则，命令正则
    priority: 3, //优先级，越小优先度越高
    describe: "", 
  },
  yl19: {
    reg: "100120", //匹配消息正则，命令正则
    priority: 3, //优先级，越小优先度越高
    describe: "", 
  },
  yl20: {
    reg: "100121", //匹配消息正则，命令正则
    priority: 3, //优先级，越小优先度越高
    describe: "", 
  },
  yl21: {
    reg: "100122", //匹配消息正则，命令正则
    priority: 3, //优先级，越小优先度越高
    describe: "", 
  },
  yl22: {
    reg: "100123", //匹配消息正则，命令正则
    priority: 3, //优先级，越小优先度越高
    describe: "", 
  },
  yl23: {
    reg: "100124", //匹配消息正则，命令正则
    priority: 3, //优先级，越小优先度越高
    describe: "", 
  },
  yl24: {
    reg: "100125", //匹配消息正则，命令正则
    priority: 3, //优先级，越小优先度越高
    describe: "", 
  },
  sm总: {
    reg: "100201", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
    sm1: {
    reg: "100202", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
    sm2: {
    reg: "100203", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
    sm3: {
    reg: "100204", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
    sm4: {
    reg: "100205", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
    sm5: {
    reg: "100206", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
    sm6: {
    reg: "100207", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
    sm7: {
    reg: "100208", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
    sm8: {
    reg: "100209", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
    sm9: {
    reg: "100301", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
    sm10: {
    reg: "100302", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
    sm11: {
    reg: "100303", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
    sm12: {
    reg: "100304", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
    sm13: {
    reg: "100305", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
    sm14: {
    reg: "100306", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
    sm15: {
    reg: "100307", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
    sm16: {
    reg: "100308", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
    sm17: {
    reg: "100309", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
    sm18: {
    reg: "100310", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
    sm19: {
    reg: "100311", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
    sm20: {
    reg: "100312", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
    sm21: {
    reg: "100313", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
    sm22: {
    reg: "100314", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
    sm23: {
    reg: "100315", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
    sm24: {
    reg: "100401", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
    sm25: {
    reg: "100402", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
    sm26: {
    reg: "100403", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
    sm27: {
    reg: "100404", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
    sm28: {
    reg: "100405", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
    sm29: {
    reg: "100406", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
    sm30: {
    reg: "100407", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
    sm31: {
    reg: "100408", //匹配消息正则，命令正则
    priority: 35, //优先级，越小优先度越高
    describe: "", 
  },
};

export async function yl总(e) {
if (!e.msg.replace("地下地图").trim()) {
    return false
  }
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100101.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl1(e) {
if (!e.msg.replace("地下地图","").trim()) {
    return false
  }
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100102.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl2(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100103.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl3(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100104.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl20(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100121.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl21(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100122.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl22(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100123.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl23(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100124.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl24(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100125.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl4(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100105.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl5(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100106.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl6(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100107.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl7(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100108.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl8(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100109.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl9(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100110.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl10(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100111.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl11(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100112.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl12(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100113.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl13(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100114.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl14(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }
  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100115.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl15(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100116.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl16(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100117.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl17(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100118.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl18(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100119.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function yl19(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100120.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function sm总(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100201.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function sm1(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100202.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function sm2(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100203.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function sm3(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100204.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function sm4(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100205.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function sm5(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100206.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function sm6(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100207.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function sm7(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100208.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function sm8(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100209.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function sm9(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100301.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}export async function sm10(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100302.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function sm11(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100303.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function sm12(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100304.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function sm13(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100305.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function sm14(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100306.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function sm15(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100307.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function sm16(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100308.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function sm17(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100309.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function sm18(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100310.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function sm19(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100311.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function sm20(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100312.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function sm21(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100313.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function sm22(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100314.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function sm23(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100315.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function sm24(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100401.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function sm25(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100402.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function sm26(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100403.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function sm27(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100404.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function sm28(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100405.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function sm29(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100406.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function sm30(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100407.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}
export async function sm31(e) {
if (e.msg.replace("绑定","").trim()) {
    return false
  }

  console.log("用户命令：", e.msg);

  let msg = [
    segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100408.png`),
  ];
  e.reply(msg);

  return true; //返回true 阻挡消息不再往下
}