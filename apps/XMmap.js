import fetch from "node-fetch";

/**
 * 原神地下地图功能模块
 * 提供须弥雨林和沙漠区域的地下地图查看功能
 */
const _path = process.cwd(); // 项目路径

/**
 * 地下地图规则定义
 * 每个规则对应一个地图编号
 */
export const rule = {
  yl总: {
    reg: "^100101$", // 雨林总图
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥雨林总图", 
  },
  yl1: {
    reg: "^100102$", // 雨林地图1
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥雨林地图1", 
  },
  yl2: {
    reg: "^100103$", // 雨林地图2
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥雨林地图2", 
  },
  yl3: {
    reg: "^100104$", // 雨林地图3
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥雨林地图3", 
  },
  yl4: {
    reg: "^100105$", // 雨林地图4
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥雨林地图4", 
  },
  yl5: {
    reg: "^100106$", // 雨林地图5
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥雨林地图5", 
  },
  yl6: {
    reg: "^100107$", // 雨林地图6
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥雨林地图6", 
  },
  yl7: {
    reg: "^100108$", // 雨林地图7
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥雨林地图7", 
  },
  yl8: {
    reg: "^100109$", // 雨林地图8
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥雨林地图8", 
  },
  yl9: {
    reg: "^100110$", // 雨林地图9
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥雨林地图9", 
  },
  yl10: {
    reg: "^100111$", // 雨林地图10
    priority: 3, // 优先级，越小优先度越高
    describe: "【地下地图】须弥雨林地图10", 
  },
  yl11: {
    reg: "^100112$", // 雨林地图11
    priority: 3, // 优先级，越小优先度越高
    describe: "【地下地图】须弥雨林地图11", 
  },
  yl12: {
    reg: "^100113$", // 雨林地图12
    priority: 3, // 优先级，越小优先度越高
    describe: "【地下地图】须弥雨林地图12", 
  },
  yl13: {
    reg: "^100114$", // 雨林地图13
    priority: 3, // 优先级，越小优先度越高
    describe: "【地下地图】须弥雨林地图13", 
  },
  yl14: {
    reg: "^100115$", // 雨林地图14
    priority: 3, // 优先级，越小优先度越高
    describe: "【地下地图】须弥雨林地图14", 
  },
  yl15: {
    reg: "^100116$", // 雨林地图15
    priority: 3, // 优先级，越小优先度越高
    describe: "【地下地图】须弥雨林地图15", 
  },
  yl16: {
    reg: "^100117$", // 雨林地图16
    priority: 3, // 优先级，越小优先度越高
    describe: "【地下地图】须弥雨林地图16", 
  },
  yl17: {
    reg: "^100118$", // 雨林地图17
    priority: 3, // 优先级，越小优先度越高
    describe: "【地下地图】须弥雨林地图17", 
  },
  yl18: {
    reg: "^100119$", // 雨林地图18
    priority: 3, // 优先级，越小优先度越高
    describe: "【地下地图】须弥雨林地图18", 
  },
  yl19: {
    reg: "^100120$", // 雨林地图19
    priority: 3, // 优先级，越小优先度越高
    describe: "【地下地图】须弥雨林地图19", 
  },
  yl20: {
    reg: "^100121$", // 雨林地图20
    priority: 3, // 优先级，越小优先度越高
    describe: "【地下地图】须弥雨林地图20", 
  },
  yl21: {
    reg: "^100122$", // 雨林地图21
    priority: 3, // 优先级，越小优先度越高
    describe: "【地下地图】须弥雨林地图21", 
  },
  yl22: {
    reg: "^100123$", // 雨林地图22
    priority: 3, // 优先级，越小优先度越高
    describe: "【地下地图】须弥雨林地图22", 
  },
  yl23: {
    reg: "^100124$", // 雨林地图23
    priority: 3, // 优先级，越小优先度越高
    describe: "【地下地图】须弥雨林地图23", 
  },
  yl24: {
    reg: "^100125$", // 雨林地图24
    priority: 3, // 优先级，越小优先度越高
    describe: "【地下地图】须弥雨林地图24", 
  },
  sm总: {
    reg: "^100201$", // 沙漠总图
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥沙漠总图", 
  },
  sm1: {
    reg: "^100202$", // 沙漠地图1
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥沙漠地图1", 
  },
  sm2: {
    reg: "^100203$", // 沙漠地图2
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥沙漠地图2", 
  },
  sm3: {
    reg: "^100204$", // 沙漠地图3
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥沙漠地图3", 
  },
  sm4: {
    reg: "^100205$", // 沙漠地图4
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥沙漠地图4", 
  },
  sm5: {
    reg: "^100206$", // 沙漠地图5
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥沙漠地图5", 
  },
  sm6: {
    reg: "^100207$", // 沙漠地图6
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥沙漠地图6", 
  },
  sm7: {
    reg: "^100208$", // 沙漠地图7
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥沙漠地图7", 
  },
  sm8: {
    reg: "^100209$", // 沙漠地图8
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥沙漠地图8", 
  },
  sm9: {
    reg: "^100301$", // 沙漠地图9
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥沙漠地图9", 
  },
  sm10: {
    reg: "^100302$", // 沙漠地图10
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥沙漠地图10", 
  },
  sm11: {
    reg: "^100303$", // 沙漠地图11
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥沙漠地图11", 
  },
  sm12: {
    reg: "^100304$", // 沙漠地图12
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥沙漠地图12", 
  },
  sm13: {
    reg: "^100305$", // 沙漠地图13
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥沙漠地图13", 
  },
  sm14: {
    reg: "^100306$", // 沙漠地图14
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥沙漠地图14", 
  },
  sm15: {
    reg: "^100307$", // 沙漠地图15
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥沙漠地图15", 
  },
  sm16: {
    reg: "^100308$", // 沙漠地图16
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥沙漠地图16", 
  },
  sm17: {
    reg: "^100309$", // 沙漠地图17
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥沙漠地图17", 
  },
  sm18: {
    reg: "^100310$", // 沙漠地图18
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥沙漠地图18", 
  },
  sm19: {
    reg: "^100311$", // 沙漠地图19
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥沙漠地图19", 
  },
  sm20: {
    reg: "^100312$", // 沙漠地图20
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥沙漠地图20", 
  },
  sm21: {
    reg: "^100313$", // 沙漠地图21
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥沙漠地图21", 
  },
  sm22: {
    reg: "^100314$", // 沙漠地图22
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥沙漠地图22", 
  },
  sm23: {
    reg: "^100315$", // 沙漠地图23
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥沙漠地图23", 
  },
  sm24: {
    reg: "^100401$", // 沙漠地图24
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥沙漠地图24", 
  },
  sm25: {
    reg: "^100402$", // 沙漠地图25
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥沙漠地图25", 
  },
  sm26: {
    reg: "^100403$", // 沙漠地图26
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥沙漠地图26", 
  },
  sm27: {
    reg: "^100404$", // 沙漠地图27
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥沙漠地图27", 
  },
  sm28: {
    reg: "^100405$", // 沙漠地图28
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥沙漠地图28", 
  },
  sm29: {
    reg: "^100406$", // 沙漠地图29
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥沙漠地图29", 
  },
  sm30: {
    reg: "^100407$", // 沙漠地图30
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥沙漠地图30", 
  },
  sm31: {
    reg: "^100408$", // 沙漠地图31
    priority: 35, // 优先级，越小优先度越高
    describe: "【地下地图】须弥沙漠地图31", 
  },
};

/**
 * 显示须弥雨林总图
 * @param {Object} e - 事件对象
 * @returns {Promise<boolean>} 处理结果
 */
export async function yl总(e) {
  try {
    if (!e || !e.msg) {
      console.error('yl总函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100101")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100101.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥雨林总图失败:', error);
    return false;
  }
}
/**
 * 显示须弥雨林地图1
 * @param {Object} e - 事件对象
 * @returns {Promise<boolean>} 处理结果
 */
export async function yl1(e) {
  try {
    if (!e || !e.msg) {
      console.error('yl1函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100102")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100102.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥雨林地图1失败:', error);
    return false;
  }
}
/**
 * 显示须弥雨林地图2
 * @param {Object} e - 事件对象
 * @returns {Promise<boolean>} 处理结果
 */
export async function yl2(e) {
  try {
    if (!e || !e.msg) {
      console.error('yl2函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100103")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100103.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥雨林地图2失败:', error);
    return false;
  }
}
/**
 * 显示须弥雨林地图3
 * @param {Object} e - 事件对象
 * @returns {Promise<boolean>} 处理结果
 */
export async function yl3(e) {
  try {
    if (!e || !e.msg) {
      console.error('yl3函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100104")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100104.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥雨林地图3失败:', error);
    return false;
  }
}
export async function yl20(e) {
  try {
    if (!e || !e.msg) {
      console.error('yl20函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100121")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100121.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥雨林地图20失败:', error);
    return false;
  }
}
export async function yl21(e) {
  try {
    if (!e || !e.msg) {
      console.error('yl21函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100122")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100122.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥雨林地图21失败:', error);
    return false;
  }
}
export async function yl22(e) {
  try {
    if (!e || !e.msg) {
      console.error('yl22函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100123")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100123.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥雨林地图22失败:', error);
    return false;
  }
}
export async function yl23(e) {
  try {
    if (!e || !e.msg) {
      console.error('yl23函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100124")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100124.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥雨林地图23失败:', error);
    return false;
  }
}
export async function yl24(e) {
  try {
    if (!e || !e.msg) {
      console.error('yl24函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100125")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100125.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥雨林地图24失败:', error);
    return false;
  }
}
export async function yl4(e) {
  try {
    if (!e || !e.msg) {
      console.error('yl4函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100105")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100105.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥雨林地图4失败:', error);
    return false;
  }
}
export async function yl5(e) {
  try {
    if (!e || !e.msg) {
      console.error('yl5函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100106")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100106.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥雨林地图5失败:', error);
    return false;
  }
}
export async function yl6(e) {
  try {
    if (!e || !e.msg) {
      console.error('yl6函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100107")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100107.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥雨林地图6失败:', error);
    return false;
  }
}
export async function yl7(e) {
  try {
    if (!e || !e.msg) {
      console.error('yl7函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100108")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100108.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥雨林地图7失败:', error);
    return false;
  }
}
export async function yl8(e) {
  try {
    if (!e || !e.msg) {
      console.error('yl8函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100109")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100109.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥雨林地图8失败:', error);
    return false;
  }
}
export async function yl9(e) {
  try {
    if (!e || !e.msg) {
      console.error('yl9函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100110")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100110.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥雨林地图9失败:', error);
    return false;
  }
}
export async function yl10(e) {
  try {
    if (!e || !e.msg) {
      console.error('yl10函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100111")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100111.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥雨林地图10失败:', error);
    return false;
  }
}
export async function yl11(e) {
  try {
    if (!e || !e.msg) {
      console.error('yl11函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100112")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100112.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥雨林地图11失败:', error);
    return false;
  }
}
export async function yl12(e) {
  try {
    if (!e || !e.msg) {
      console.error('yl12函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100113")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100113.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥雨林地图12失败:', error);
    return false;
  }
}
export async function yl13(e) {
  try {
    if (!e || !e.msg) {
      console.error('yl13函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100114")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100114.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥雨林地图13失败:', error);
    return false;
  }
}
export async function yl14(e) {
  try {
    if (!e || !e.msg) {
      console.error('yl14函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100115")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100115.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥雨林地图14失败:', error);
    return false;
  }
}
export async function yl15(e) {
  try {
    if (!e || !e.msg) {
      console.error('yl15函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100116")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100116.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥雨林地图15失败:', error);
    return false;
  }
}
export async function yl16(e) {
  try {
    if (!e || !e.msg) {
      console.error('yl16函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100117")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100117.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥雨林地图16失败:', error);
    return false;
  }
}
export async function yl17(e) {
  try {
    if (!e || !e.msg) {
      console.error('yl17函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100118")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100118.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥雨林地图17失败:', error);
    return false;
  }
}
export async function yl18(e) {
  try {
    if (!e || !e.msg) {
      console.error('yl18函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100119")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100119.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥雨林地图18失败:', error);
    return false;
  }
}
export async function yl19(e) {
  try {
    if (!e || !e.msg) {
      console.error('yl19函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100120")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-雨林/100120.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥雨林地图19失败:', error);
    return false;
  }
}
export async function sm总(e) {
  try {
    if (!e || !e.msg) {
      console.error('sm总函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100201")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100201.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥沙漠总图失败:', error);
    return false;
  }
}
export async function sm1(e) {
  try {
    if (!e || !e.msg) {
      console.error('sm1函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100202")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100202.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥沙漠地图1失败:', error);
    return false;
  }
}
export async function sm2(e) {
  try {
    if (!e || !e.msg) {
      console.error('sm2函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100203")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100203.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥沙漠地图2失败:', error);
    return false;
  }
}
export async function sm3(e) {
  try {
    if (!e || !e.msg) {
      console.error('sm3函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100204")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100204.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥沙漠地图3失败:', error);
    return false;
  }
}
export async function sm4(e) {
  try {
    if (!e || !e.msg) {
      console.error('sm4函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100205")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100205.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥沙漠地图4失败:', error);
    return false;
  }
}
export async function sm5(e) {
  try {
    if (!e || !e.msg) {
      console.error('sm5函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100206")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100206.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥沙漠地图5失败:', error);
    return false;
  }
}
export async function sm6(e) {
  try {
    if (!e || !e.msg) {
      console.error('sm6函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100207")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100207.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥沙漠地图6失败:', error);
    return false;
  }
}
export async function sm7(e) {
  try {
    if (!e || !e.msg) {
      console.error('sm7函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100208")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100208.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥沙漠地图7失败:', error);
    return false;
  }
}
export async function sm8(e) {
  try {
    if (!e || !e.msg) {
      console.error('sm8函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100209")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100209.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥沙漠地图8失败:', error);
    return false;
  }
}
export async function sm9(e) {
  try {
    if (!e || !e.msg) {
      console.error('sm9函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100301")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100301.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥沙漠地图9失败:', error);
    return false;
  }
}
export async function sm10(e) {
  try {
    if (!e || !e.msg) {
      console.error('sm10函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100302")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100302.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥沙漠地图10失败:', error);
    return false;
  }
}
export async function sm11(e) {
  try {
    if (!e || !e.msg) {
      console.error('sm11函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100303")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100303.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥沙漠地图11失败:', error);
    return false;
  }
}
export async function sm12(e) {
  try {
    if (!e || !e.msg) {
      console.error('sm12函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100304")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100304.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥沙漠地图12失败:', error);
    return false;
  }
}
export async function sm13(e) {
  try {
    if (!e || !e.msg) {
      console.error('sm13函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100305")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100305.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥沙漠地图13失败:', error);
    return false;
  }
}
export async function sm14(e) {
  try {
    if (!e || !e.msg) {
      console.error('sm14函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100306")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100306.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥沙漠地图14失败:', error);
    return false;
  }
}
export async function sm15(e) {
  try {
    if (!e || !e.msg) {
      console.error('sm15函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100307")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100307.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥沙漠地图15失败:', error);
    return false;
  }
}
export async function sm16(e) {
  try {
    if (!e || !e.msg) {
      console.error('sm16函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100308")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100308.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥沙漠地图16失败:', error);
    return false;
  }
}
export async function sm17(e) {
  try {
    if (!e || !e.msg) {
      console.error('sm17函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100309")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100309.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥沙漠地图17失败:', error);
    return false;
  }
}
export async function sm18(e) {
  try {
    if (!e || !e.msg) {
      console.error('sm18函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100310")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100310.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥沙漠地图18失败:', error);
    return false;
  }
}
export async function sm19(e) {
  try {
    if (!e || !e.msg) {
      console.error('sm19函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100311")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100311.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥沙漠地图19失败:', error);
    return false;
  }
}
export async function sm20(e) {
  try {
    if (!e || !e.msg) {
      console.error('sm20函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100312")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100312.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥沙漠地图20失败:', error);
    return false;
  }
}
export async function sm21(e) {
  try {
    if (!e || !e.msg) {
      console.error('sm21函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100313")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100313.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥沙漠地图21失败:', error);
    return false;
  }
}
export async function sm22(e) {
  try {
    if (!e || !e.msg) {
      console.error('sm22函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100314")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100314.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥沙漠地图22失败:', error);
    return false;
  }
}
export async function sm23(e) {
  try {
    if (!e || !e.msg) {
      console.error('sm23函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100315")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100315.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥沙漠地图23失败:', error);
    return false;
  }
}
export async function sm24(e) {
  try {
    if (!e || !e.msg) {
      console.error('sm24函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100401")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100401.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥沙漠地图24失败:', error);
    return false;
  }
}
export async function sm25(e) {
  try {
    if (!e || !e.msg) {
      console.error('sm25函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100402")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100402.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥沙漠地图25失败:', error);
    return false;
  }
}
export async function sm26(e) {
  try {
    if (!e || !e.msg) {
      console.error('sm26函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100403")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100403.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥沙漠地图26失败:', error);
    return false;
  }
}
export async function sm27(e) {
  try {
    if (!e || !e.msg) {
      console.error('sm27函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100404")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100404.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥沙漠地图27失败:', error);
    return false;
  }
}
export async function sm28(e) {
  try {
    if (!e || !e.msg) {
      console.error('sm28函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100405")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100405.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥沙漠地图28失败:', error);
    return false;
  }
}
export async function sm29(e) {
  try {
    if (!e || !e.msg) {
      console.error('sm29函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100406")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100406.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥沙漠地图29失败:', error);
    return false;
  }
}
export async function sm30(e) {
  try {
    if (!e || !e.msg) {
      console.error('sm30函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100407")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100407.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥沙漠地图30失败:', error);
    return false;
  }
}
export async function sm31(e) {
  try {
    if (!e || !e.msg) {
      console.error('sm31函数缺少必要的事件参数');
      return false;
    }
    
    // 检查命令是否匹配
    if (!e.msg.includes("地下地图") || !e.msg.includes("100408")) {
      return false;
    }
    
    console.log("用户命令：", e.msg);

    const msg = [
      segment.image(`file:///${_path}/plugins/liulian-plugin/resources/须弥-沙漠/100408.png`),
    ];
    await e.reply(msg);

    return true; // 返回true 阻挡消息不再往下
  } catch (error) {
    console.error('显示须弥沙漠地图31失败:', error);
    return false;
  }
}