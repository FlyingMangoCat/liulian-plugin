import plugin from "../../../lib/plugins/plugin.js";
import * as LiuLian from "../apps/index.js";
import { render } from "./render.js";

export class liulian extends plugin {
  constructor() {
    let rule = {
      reg:
        "^#*(哪个群友是我老婆|娶老婆|小黑子|鸽鸽|龙图|榴莲|留恋|伪造|土味|舔狗日记|讲个笑话|毒鸡汤|广播|猜歌名|猜角色|运势|早报|每日句子|每日单词|神之眼|话痨).*$",
      fnc: "dispatch",
    };
    super({
      name: "liulian-plugin",
      desc: "留恋插件",
      event: "message",
      priority: 50,
      rule: [rule],
    });
    Object.defineProperty(rule, "log", {
      get: () => !!this.isDispatch,
    });
  }

  async dispatch(e) {
    let msg = e.msg || "";
    if (!msg) {
      return false;
    }
    msg = msg.replace("#", "").trim();
    msg = "#" + msg;
    for (let fn in LiuLian.rule) {
      let cfg = LiuLian.rule[fn];
      if (LiuLian[fn] && new RegExp(cfg.reg).test(msg)) {
        let ret = await LiuLian[fn](e, {
          render,
        });
        if (ret === true) {
          this.isDispatch = true;
          return true;
        }
      }
    }
    return false;
  }
}
